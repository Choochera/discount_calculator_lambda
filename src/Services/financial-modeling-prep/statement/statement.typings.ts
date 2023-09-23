import { Period } from "@/resources/consumers/price-check-consumer/discount-manager/discount-manager.typings";

export interface Statement {
    cik: string,
    date: Date,
    symbol: string,
    reportedCurrency: string,
    fillingDate: Date,
    acceptedDate: string,
    calendarYear: string,
    period: Period
}

export type IncomeStatement = Statement & IIncomeStatement;

export type BalanceSheet = Statement & IBalanceSheet;

export type CashFlowStatement = Statement & ICashFlowStatement;

export interface Statements {
    incomeStatements: IncomeStatement[],
    balanceSheets: BalanceSheet[],
    cashFlowStatements: CashFlowStatement[]
}

export interface IIncomeStatement {
    revenue: number,
    costOfRevenue: number,
    grossProfit: number,
    grossProfitRatio: number,
    researchAndDevelopmentExpenses: number,
    generalAndAdministrativeExpenses: number,
    sellingAndMarketingExpenses: number,
    sellingGeneralAndAdministrativeExpenses: number,
    otherExpenses: number,
    operatingExpenses: number,
    costAndExpenses: number,
    interestIncome: number,
    interestExpense: number,
    depreciationAndAmortization: number,
    ebitda: number,
    ebitdaratio: number,
    operatingIncome: number,
    operatingIncomeRatio: number,
    totalOtherIncomeExpensesNet: number,
    incomeBeforeTax: number,
    incomeBeforeTaxRatio: number,
    incomeTaxExpense: number,
    netIncome: number,
    netIncomeRatio: number,
    eps: number,
    epsdiluted: number,
    weightedAverageShsOut: number,
    weightedAverageShsOutDil: number,
    link: string,
    finalLink: string 
}

export interface IBalanceSheet {
    cashAndCashEquivalents: number,
    shortTermInvestments: number,
    cashAndShortTermInvestments: number,
    netReceivables: number,
    inventory: number,
    otherCurrentAssets: number,
    totalCurrentAssets: number,
    propertyPlantEquipmentNet: number,
    goodwill: number,
    intangibleAssets: number,
    goodwillAndIntangibleAssets: number,
    longTermInvestments: number,
    taxAssets: number,
    otherNonCurrentAssets: number,
    totalNonCurrentAssets: number,
    otherAssets: number,
    totalAssets: number,
    accountPayables: number,
    shortTermDebt: number,
    taxPayables: number,
    deferredRevenue: number,
    otherCurrentLiabilities: number,
    totalCurrentLiabilities: number,
    longTermDebt: number,
    deferredRevenueNonCurrent: number,
    deferredTaxLiabilitiesNonCurrent: number,
    otherNonCurrentLiabilities: number,
    totalNonCurrentLiabilities: number,
    otherLiabilities: number,
    capitalLeaseObligations: number,
    totalLiabilities: number,
    preferredStock: number,
    commonStock: number,
    retainedEarnings: number,
    accumulatedOtherComprehensiveIncomeLoss: number,
    othertotalStockholdersEquity: number,
    totalStockholdersEquity: number,
    totalEquity: number,
    totalLiabilitiesAndStockholdersEquity: number,
    minorityInterest: number,
    totalLiabilitiesAndTotalEquity: number,
    totalInvestments: number,
    totalDebt: number,
    netDebt: number,
    link: string,
    finalLink: string
}

export interface ICashFlowStatement {
    netIncome: number,
    depreciationAndAmortization: number,
    deferredIncomeTax: number,
    stockBasedCompensation: number,
    changeInWorkingCapital: number,
    accountsReceivables: number,
    inventory: number,
    accountsPayables: number,
    otherWorkingCapital: number,
    otherNonCashItems: number,
    netCashProvidedByOperatingActivities: number,
    investmentsInPropertyPlantAndEquipment: number,
    acquisitionsNet: number,
    purchasesOfInvestments: number,
    salesMaturitiesOfInvestments: number,
    otherInvestingActivites: number,
    netCashUsedForInvestingActivites: number,
    debtRepayment: number,
    commonStockIssued: number,
    commonStockRepurchased: number,
    dividendsPaid: number,
    otherFinancingActivites: number,
    netCashUsedProvidedByFinancingActivities: number,
    effectOfForexChangesOnCash: number,
    netChangeInCash: number,
    cashAtEndOfPeriod: number,
    cashAtBeginningOfPeriod: number,
    operatingCashFlow: number,
    capitalExpenditure: number,
    freeCashFlow: number,
    link: string,
    finalLink: string 
}