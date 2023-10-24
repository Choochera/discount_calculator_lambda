import DisqualifyingDataException from "@/utils/exceptions/DisqualifyingDataException";
import HttpException from "@/utils/exceptions/HttpException";
import InsufficientDataException from "@/utils/exceptions/InsufficientDataException";
import { Discount } from "@/services/discount/discount.typings";
import { checkDiscountIsOnSale } from "@/resources/resource.utils";
import { buildDiscount, buildQuarterlyData, buildStickerPriceInput } from "@/services/discount/discount.utils";
import { benchmarkService, discountService, historicalPriceService, profileService, statementService, stickerPriceService } from "@/src/bootstrap";
import { checkHasSufficientStatements } from "./discount-manager.utils";


class DiscountManager {

    isReady: Promise<void>;
    existingDiscountCikSet: Set<string>;
    
    constructor() {
        this.existingDiscountCikSet = new Set<string>();
        this.isReady = this.loadExistingDiscountCikSet();
    }

    public async intiateDiscountCheck(cik: string): Promise<void> {
        return this.checkForDiscount(cik)
            .catch(async (err: any) => {
                return this.isReady.then(async () => {
                    if ((err instanceof DisqualifyingDataException || 
                        err instanceof InsufficientDataException) &&
                        this.existingDiscountCikSet.has(cik)) {
                        await this.deleteDiscount(cik, err.message);
                    }
                    console.log(`Error occurred while checking ${cik} for discount: ${err.message}`);
                });
            });
    }

    private async checkForDiscount(cik: string): Promise<void> {
        console.log("In price check consumer checking for a discount on CIK: " + cik);
        return Promise.all([
            statementService.getStatements(cik),
            profileService.getCompanyProfile(cik)
        ]).then(async companyData => {
            const [ statements, profile ] = companyData;
            checkHasSufficientStatements(cik, statements);
            const quarterlyData = buildQuarterlyData(statements);
            const stickerPriceInput =  await buildStickerPriceInput(cik, profile.symbol, quarterlyData);
            const stickerPrice = stickerPriceService.calculateStickerPriceObject(stickerPriceInput);
            return benchmarkService.getBenchmarkRatioPrice(cik, profile.industry, quarterlyData)
                .then(async benchmarkRatioPrice => {
                    const discount = buildDiscount(cik, profile, stickerPrice, benchmarkRatioPrice);
                    return historicalPriceService.getCurrentPrice(discount.symbol)
                        .then(currentPrice => {
                            discount.active = checkDiscountIsOnSale(currentPrice, discount);
                            return this.saveDiscount(discount);
                        });
                });
        });
    }

    private async saveDiscount(discount: Discount): Promise<void> {
        const cik = discount.cik;
        return discountService.save(discount)
            .then(async response => {
                if (response) {
                    return this.isReady.then(() => {
                        console.log("Sticker price sale saved for cik: " + cik);
                        this.existingDiscountCikSet.add(discount.cik);
                    });
                }
            }).catch((err: HttpException) => {
                console.log("Sticker price save failed for cik: " + cik + " with err: " + err);
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