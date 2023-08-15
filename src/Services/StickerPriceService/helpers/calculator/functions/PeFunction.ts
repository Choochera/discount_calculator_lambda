import QuarterlyData from "@/resources/entities/models/QuarterlyData";
import AbstractFunction from "./AbstractFunction";
import { buildHistoricalPriceInput } from "../../../../../Services/HistoricalPriceService/utils/HistoricalPriceUtils";
import PriceData from "../../../../../Services/HistoricalPriceService/models/PriceData";
import { annualizeByMean, days_between } from "../../../utils/QuarterlyDataUtils";
import StickerPriceData from "@/resources/entities/facts/IStickerPriceData";
import HistoricalPriceInput from "Services/HistoricalPriceService/models/HistoricalPriceInput";
import InsufficientDataException from "@/utils/exceptions/InsufficientDataException";
import { historicalPriceService } from "../../../../../bootstrap";

class PeFunction extends AbstractFunction {

    constructor() {
        super();
    }

    async calculate(data: StickerPriceData): Promise<QuarterlyData[]> {
        const quarterlyPE: QuarterlyData[] = [];
        const quarterlyEPS = data.quarterlyEPS;
        const historicalPriceInput =
            this.buildHistoricalPriceInput(data.symbol, quarterlyEPS);
        return historicalPriceService.getHistoricalPrices(historicalPriceInput)
            .then(async (priceData: PriceData[]) => {
                data.quarterlyEPS.forEach(quarter => {
                    const price = priceData.find(day => {
                        return days_between(new Date(day.date), new Date(quarter.announcedDate)) <= 3;
                    })?.close;
                    if (!price) {
                        console.log("Insufficient historical price data available for " + data.cik);
                        throw new InsufficientDataException("Insufficient historical price data available");
                    }
                    quarterlyPE.push({
                        cik: data.cik,
                        announcedDate: quarter.announcedDate,
                        value: quarter.value !== 0 ? price/quarter.value : 0
                    });
                });
                return quarterlyPE;
            });
    }

    annualize(cik: string, quarterlyPE: QuarterlyData[]): QuarterlyData[] {
        return annualizeByMean(cik, quarterlyPE);
    }

    private buildHistoricalPriceInput(symbol: string, quarterlyEPS: QuarterlyData[]): HistoricalPriceInput {
        const fromDate: Date = new Date(quarterlyEPS[0].announcedDate);
        const toDate: Date = new Date(quarterlyEPS[quarterlyEPS.length - 1].announcedDate);
        toDate.setDate(toDate.getDate() + 3); 
        return buildHistoricalPriceInput(symbol, fromDate, toDate)
    }
    
}

export default PeFunction;