import DisqualifyingDataException from "@/utils/exceptions/DisqualifyingDataException";
import HttpException from "@/utils/exceptions/HttpException";
import InsufficientDataException from "@/utils/exceptions/InsufficientDataException";
import { Discount } from "@/services/discount/ffs-discount/discount.typings";
import { benchmarkService, discountService, discountedCashFlowService, profileService, statementService, stickerPriceService } from "@/src/bootstrap";
import { buildDiscount, buildQuarterlyData, validateStatements } from "./discount-manager.utils";
import DataNotUpdatedException from "@/utils/exceptions/DataNotUpdatedException";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";
import { StickerPriceInput } from "@/services/sticker-price/sticker-price.typings";
import { BenchmarkRatioPriceInput } from "@/services/benchmark/benchmark.typings";
import { DiscountedCashFlowInput } from "@/services/financial-modeling-prep/discounted-cash-flow/discounted-cash-flow.typings";
import { Statements } from "@/services/financial-modeling-prep/statement/statement.typings";
import { CompanyProfile } from "@/services/financial-modeling-prep/profile/profile.typings";
import { getLastQ4Value } from "@/utils/processing.utils";


class DiscountManager {

    isReady: Promise<void>;
    existingDiscountCikSet: Set<string>;
    sfnClient: SFNClient;
    revisitMachineArn: string | undefined;
    
    constructor(revisitMachineArn?: string) {
        this.sfnClient = new SFNClient({ region: 'us-east-1' });
        this.revisitMachineArn = revisitMachineArn;
        this.existingDiscountCikSet = new Set<string>();
        this.isReady = this.loadExistingDiscountCikSet();
    }

    public async intiateDiscountCheck(cik: string): Promise<void> {
        return this.checkForDiscount(cik)
            .catch(async (err: any) => {
                return this.isReady.then(async () => {
                    console.log(`Error occurred while checking ${cik} for discount: ${err.message}`);
                    if ((err instanceof DisqualifyingDataException || 
                        err instanceof InsufficientDataException) &&
                        this.existingDiscountCikSet.has(cik)) {
                        return this.deleteDiscount(cik, err.message);
                    }
                    if (err instanceof DataNotUpdatedException) {
                        return this.triggerRevisit(cik);
                    }
                });
            });
    }

    private async checkForDiscount(cik: string): Promise<void> {
        console.log(`In discount manager checking for a discount on ${cik}`);
        return Promise.all([
            statementService.getStatements(cik),
            profileService.getCompanyProfile(cik)
        ]).then(async companyData => {
            const [ statements, profile ] = companyData;
            validateStatements(cik, statements, !!this.revisitMachineArn);
            return this.buildValuationInputs(cik, statements, profile)
                .then(inputs => {
                    const [stickerPriceInput, benchmarkRatioPriceInput, discountedCashFlowInput ] = inputs;
                    const marketPrice = discountedCashFlowInput.marketPrice;
                    const discount = buildDiscount(cik, profile,
                        stickerPriceService.getStickerPrice(stickerPriceInput),
                        benchmarkService.getBenchmarkRatioPrice(cik, benchmarkRatioPriceInput),
                        discountedCashFlowService.getDiscountCashFlowPrice(cik, discountedCashFlowInput));
                    
                    if (discount.stickerPrice.price < 0 ||
                        discount.benchmarkRatioPrice.price < 0 ||
                        discount.discountedCashFlowPrice.price <= 0) {
                            throw new DisqualifyingDataException('Valuation cannot be negative');
                        }
                    
                    discount.active = 
                        marketPrice <  discount.stickerPrice.price &&
                        marketPrice < discount.benchmarkRatioPrice.price && 
                        marketPrice < discount.discountedCashFlowPrice.price;
                    
                    discount.marketPrice = marketPrice;
                    
                    console.log(discount);
                    return this.saveDiscount(discount);
                });
        });
    }

    private async buildValuationInputs(
        cik: string,
        statements: Statements,
        profile: CompanyProfile
    ): Promise<[ StickerPriceInput, BenchmarkRatioPriceInput, DiscountedCashFlowInput ]> {
        const symbol = profile.symbol;
        const industry = profile.industry;
        const quarterlyData = buildQuarterlyData(statements);

        const lastQ4BalanceSheet = getLastQ4Value(statements.balanceSheets);
        const netDebt = lastQ4BalanceSheet.netDebt;
        const totalDebt = lastQ4BalanceSheet.totalDebt;

        return Promise.all([
            stickerPriceService.buildStickerPriceInput(cik, symbol, quarterlyData),
            benchmarkService.buildBenchmarkRatioPriceInput(cik, industry, quarterlyData),
            discountedCashFlowService.buildDiscountedCashFlowInput(cik, symbol, totalDebt, netDebt, quarterlyData)
        ]);
    }

    private async triggerRevisit(cik: string): Promise<void> {
        console.log(`Triggering revisit for ${cik}`);
        const stateMachineCommand = new StartExecutionCommand({
            stateMachineArn: this.revisitMachineArn,
            input: JSON.stringify({ cik: cik })
        })
        this.sfnClient.send(stateMachineCommand)
            .then(() => console.log(`Revisit successfully triggered for ${cik}`))
            .catch(err => console.log(`Revisit failed to triggerd for ${cik} due to error: ${err}`));
    }

    private async saveDiscount(discount: Discount): Promise<void> {
        const cik = discount.cik;
        return discountService.save(discount)
            .then(async response => {
                if (response) {
                    return this.isReady.then(() => {
                        console.log(`Sticker price sale saved for ${cik}`);
                        this.existingDiscountCikSet.add(discount.cik);
                    });
                }
            }).catch((err: HttpException) => {
                console.log(`Sticker price save failed for ${cik} with err: ${err}`);
            });
    }

    private async deleteDiscount(cik: string, reason: string): Promise<void> {
        return discountService.delete(cik)
            .then(async () => {
                return this.isReady.then(() => {
                    console.log(`Discount for ${cik} has been deleted due to: ${reason}`);
                    this.existingDiscountCikSet.delete(cik);
                });
            }).catch((deleteEx: HttpException) => {
                if (deleteEx.status !== 404) {
                    console.log(`Deleting discount for ${cik} failed due to: ${deleteEx.message}`);
                } else {
                    console.log(`Discount for ${cik} does not exist`);
                }
            })
    }

    private async loadExistingDiscountCikSet(): Promise<void> {
        return discountService.getBulkSimpleDiscounts()
            .then(simpleDiscounts => {
                simpleDiscounts.forEach(simpleDiscount => {
                    this.existingDiscountCikSet.add(simpleDiscount.cik);
                });
                console.log('Existing discount cik successfully loaded!');
            }).catch((err: HttpException) => {
                console.log(`Error occurred while initializing existing discount set: ${err.message}`);
            });
    }
}

export default DiscountManager;
