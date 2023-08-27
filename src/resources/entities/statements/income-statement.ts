export default interface IncomeStatement {

    cik: string,
    date: Date,
    symbol: string | null,
    reportedCurrency: string | null,
    fillingDate: Date | null,
    acceptedDate: Date | null,
    calendarYear: string | null,
    period: string | null,
    revenue: number | null,
    costOfRevenue: number | null,
    grossProfit: number | null,
    grossProfitRatio: number | null,
    researchAndDevelopmentExpenses: number | null,
    generalAndAdministrativeExpenses: number | null,
    sellingAndMarketingExpenses: number | null,
    sellingGeneralAndAdministrativeExpenses: number | null,
    otherExpenses: number | null,
    operatingExpenses: number | null,
    costAndExpenses: number | null,
    interestIncome: number | null,
    interestExpense: number | null,
    depreciationAndAmortization: number | null,
    ebitda: number | null,
    ebitdaratio: number | null,
    operatingIncome: number | null,
    operatingIncomeRatio: number | null,
    totalOtherIncomeExpensesNet: number | null,
    incomeBeforeTax: number | null,
    incomeBeforeTaxRatio: number | null,
    incomeTaxExpense: number | null,
    netIncome: number,
    netIncomeRatio: number | null,
    eps: number,
    epsdiluted: number | null,
    weightedAverageShsOut: number,
    weightedAverageShsOutDil: number | null,
    link: string | null,
    finalLink: string  | null
    
}