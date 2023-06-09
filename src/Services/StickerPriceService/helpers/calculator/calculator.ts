import PriceData from "../../../HistoricalPriceService/models/PriceData";
import AbstractFunction from "./functions/AbstractFunction";
import BvpsFunction from "./functions/BvpsFunction";
import QuarterlyData from "@/resources/discount/models/QuarterlyData";
import Discount from "@/resources/discount/IDiscount";
import Identity from "@/resources/identity/models/Identity";
import PeFunction from "./functions/PeFunction";
import AbstractRetriever from "../retriever/AbstractRetriever";
import InsufficientDataException from "../../../../exceptions/InsufficientDataException";
import RoicFunction from "./functions/RoicFunction";
import CONSTANTS from "Services/ServiceConstants";

class Calculator {

    private identity: Identity;
    private retriever: AbstractRetriever;
    private functions: Record<string, AbstractFunction>

    constructor(identity: Identity, retriever: AbstractRetriever) {
        this.identity = identity;
        this.retriever = retriever;
        this.functions = {
            'bvps': new BvpsFunction(identity.cik, this.retriever),
            'pe': new PeFunction(identity, retriever),
            'roic': new RoicFunction(retriever)
        }
    }

    public async calculateStickerPriceData(): Promise<Discount | null> {
        return Promise.all([
            this.calculateQuarterlyBVPS(),
            this.fetchQuarterlyEPS()])
        .then((data: QuarterlyData[][]) => {
            const [ quarterlyBVPS, quarterlyEPS ] = data;
            const { tyy_BVPS_growth, tfy_BVPS_growth, tty_BVPS_growth } = this.calculateGrowthRates(data[0]);
            return Promise.all([
                this.calculateQuarterlyPE(quarterlyEPS),
                this.calculateQuarterlyROIC()])
            .then((data: QuarterlyData[][]) => {
                const [ quarterlyPE, quarterlyROIC ] = data;
                return {
                    cik: this.identity.cik,
                    symbol: this.identity.symbol,
                    name: this.identity.name,
                    ratioPrice: 0,
                    lastUpdated: new Date(),
                    ttmPriceData: [],
                    tfyPriceData: [],
                    ttyPriceData: [],
                    quarterlyBVPS: quarterlyBVPS,
                    quarterlyPE: quarterlyPE,
                    quarterlyEPS: quarterlyEPS,
                    quarterlyROIC: quarterlyROIC,
                }
            });
        });
    }

    private async fetchQuarterlyEPS(): Promise<QuarterlyData[]> {
        return this.retriever.retrieve_quarterly_EPS();
    }

    private async calculateQuarterlyBVPS(): Promise<QuarterlyData[]> {
        const bvpsFunction: BvpsFunction = this.functions['bvps'] as BvpsFunction;
        return bvpsFunction.setVariables().then(() => {
            return bvpsFunction.calculate();
        });
    }

    private async calculateQuarterlyPE(quarterlyEPS: QuarterlyData[]): Promise<QuarterlyData[]> {
        const peFunction: PeFunction = this.functions['pe'] as PeFunction;
        peFunction.setQuarterlyEPS(quarterlyEPS);
        return peFunction.setVariables().then(() => {
            return peFunction.calculate();
        });
    }

    private async calculateQuarterlyROIC(): Promise<QuarterlyData[]> {
        const roicFunction : RoicFunction = this.functions['roic'] as RoicFunction;
        return roicFunction.setVariables().then(() => {
            return roicFunction.calculate();
        });
    }

    private calculateGrowthRates(quarterlyBVPS: QuarterlyData[]): { tyy_BVPS_growth: number, tfy_BVPS_growth: number, tty_BVPS_growth: number } {
        try {
            const bvpsFunction: BvpsFunction = this.functions['bvps'] as BvpsFunction;
            const { lastQuarters, annualBVPS } = bvpsFunction.getLastQuarterAndAnnualizedData(quarterlyBVPS);
            const tyy_BVPS_growth = (Math.pow(lastQuarters[lastQuarters.length - 1] / lastQuarters[0], (1/1)) - 1) * 100;
            const tfy_BVPS_growth = (Math.pow(annualBVPS[annualBVPS.length - 1].value / annualBVPS[annualBVPS.length - 5].value, (1/5)) - 1) * 100;
            const tty_BVPS_growth = (Math.pow(annualBVPS[annualBVPS.length - 1].value / annualBVPS[annualBVPS.length - 10].value, (1/10)) - 1) * 100;
            return { tyy_BVPS_growth, tfy_BVPS_growth, tty_BVPS_growth }
        } catch (error: any) {
            throw new InsufficientDataException(`Insufficient data collected to calcuate growth rates for ${this.identity.name}`);
        }
    }

}

export default Calculator;