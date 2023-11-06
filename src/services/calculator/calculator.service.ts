import { BenchmarkRatioPriceInput, BvpsInput, DebtYearsInput, IcInput, NopatInput, PeInput, QuarterlyData, RoicInput } from "@/resources/discount-manager/discount-manager.typings";
import { TimePeriod } from "./calculator.typings";
import AverageOverPeriodFunction from "./functions/AverageOverPeriod.function";
import BvpsFunction from "./functions/BVPS.function";
import BenchmarkRatioPriceFunction from "./functions/BenchmarkRatioPrice.function";
import IcFunction from "./functions/IC.function";
import NopatFunction from "./functions/NOPAT.function";
import PeFunction from "./functions/PE.function";
import PeriodicGrowthRatesFunction from "./functions/PeriodicGrowthRates.function";
import RoicFunction from "./functions/ROIC.function";
import StickerPriceFunction from "./functions/StickerPrice.function";
import { PeriodicData } from "@/src/types";
import DebtYearsFunction from "./functions/DebtYears.function";
import { BenchmarkRatioPrice } from "../benchmark/benchmark.typings";


class CalculatorService {

    private bvpsFunction = new BvpsFunction();
    private peFunction = new PeFunction();
    private roicFunction = new RoicFunction();
    private nopatFunction = new NopatFunction();
    private icFunction = new IcFunction();
    private debtYearsFunction = new DebtYearsFunction();
    private benchmarkRatioPriceFunction = new BenchmarkRatioPriceFunction();
    private periodicGrowthRatesFunction = new PeriodicGrowthRatesFunction();
    private averageOverPeriodFunction = new AverageOverPeriodFunction();
    private stickerPriceFunction = new StickerPriceFunction();

    public calculateBVPS(data: {
        cik: string,
        timePeriod: TimePeriod,
        quarterlyData: BvpsInput
    }): PeriodicData[] {
        return this.bvpsFunction.calculate(data);
    }

    public async calculatePE(data: {
        cik: string,
        timePeriod: TimePeriod,
        symbol: string,
        quarterlyData: PeInput
    }): Promise<PeriodicData[]> {
        return this.peFunction.calculate(data);
    }

    public calculateNOPAT(data: {
        cik: string,
        timePeriod: TimePeriod,
        quarterlyData: NopatInput
    }): PeriodicData[] {
        return this.nopatFunction.calculate(data);
    }

    public calculateIC(data: {
        cik: string,
        timePeriod: TimePeriod,
        quarterlyData: IcInput
    }): PeriodicData[] {
        return this.icFunction.calculate(data);
    }

    public calculateROIC(data: {
        cik: string,
        timePeriod: TimePeriod,
        quarterlyData: RoicInput
    }): PeriodicData[] {
        return this.roicFunction.calculate(data);
    }

    public calculateDebtYears(data: {
        cik: string,
        quarterlyData: DebtYearsInput
    }): number {
        return this.debtYearsFunction.calculate(data);
    }

    public async calculateBenchmarkRatioPrice(data: {
        cik: string,
        industry: string,
        quarterlyData: BenchmarkRatioPriceInput
    }): Promise<BenchmarkRatioPrice> {
        return this.benchmarkRatioPriceFunction.calculate(data);
    }

    public calculateAverageOverPeriod(data: {
        periodicData: PeriodicData[],
        numPeriods: number,
        minimum?: number,
        errorMessage?: string
    }): number {
        return this.averageOverPeriodFunction.calculate(data);
    }

    public calculatePeriodicGrowthRates(data: {
        cik: string,
        periodicData: PeriodicData[]
    }): PeriodicData[] {
        return this.periodicGrowthRatesFunction.calculate(data);
    }

    public calculateStickerPrice(data: {
        cik: string, 
        numPeriods: number,
        equityGrowthRate: number,
        annualPE: PeriodicData[],
        annualEPS: PeriodicData[],
        analystGrowthEstimate?: number
    }): number {
        return this.stickerPriceFunction.calculate(data);
    }
    
}

export default CalculatorService;