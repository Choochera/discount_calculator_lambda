import CONSTANTS from "@/resources/resource.contants";
import HttpException from "@/utils/exceptions/HttpException";
import { BalanceSheet, CashFlowStatement, IncomeStatement, Statements } from "./statement.typings";
import { cleanStatements, simplifyCik } from "./statement.utils";

class StatementService {

    private financialFactsServiceStatementV1Url: string;
    private fmpApiUrl: string = 'https://financialmodelingprep.com/api/v3/';
    private apiKey: string = '';
    
    constructor(ffs_base_url: string) {
        this.financialFactsServiceStatementV1Url = ffs_base_url + CONSTANTS.STATEMENTS.V1_ENDPOINT;
    }

    // Fetch sticker price data for a company
    public async getStatements(cik: string): Promise<Statements> {
        console.log("In statement service gettings sticker price data for cik: " + cik);
        return Promise.all([
            this.getIncomeStatements(cik),
            this.getBalanceSheets(cik),
            this.getCashFlowStatements(cik)
        ]).then(statements => {
            const [ incomeStatements, balanceSheets, cashFlowStatements ] = statements;
            return {
                incomeStatements: incomeStatements,
                balanceSheets: balanceSheets,
                cashFlowStatements: cashFlowStatements
            }
        });
    }

    private async getBalanceSheets(cik: string): Promise<BalanceSheet[]> {
        console.log(`In statement service getting balance sheets for ${cik}`);
        try {
            const url = this.fmpApiUrl + this.buildURI(cik, 'balance-sheet-statement');
            return fetch(url)
                .then(async (response: Response) => {
                    if (response.status !== 200) {
                        const text = await response.text();
                        throw new HttpException(response.status,
                            `Error occurred while getting balance sheets for ${cik}: ${text}`);
                    }
                    return response.json();
                }).then((body: BalanceSheet[]) => {
                    return cleanStatements(cik, body);
                });
        } catch (err: any) {
            throw new HttpException(err.status,
                `Error occurred while getting balance sheets for ${cik}: ${err.message}`)
        }
    }

    private async getIncomeStatements(cik: string): Promise<IncomeStatement[]> {
        console.log(`In statement service getting income statements for ${cik}`);
        try {
            const url = this.fmpApiUrl + this.buildURI(cik, 'income-statement');
            return fetch(url)
                .then(async (response: Response) => {
                    if (response.status !== 200) {
                        const text = await response.text();
                        throw new HttpException(response.status,
                            `Error occurred while getting income statements for ${cik}: ${text}`);
                    }
                    return response.json();
                }).then((body: IncomeStatement[]) => {
                    return cleanStatements(cik, body);
                });
        } catch (err: any) {
            throw new HttpException(err.status,
                `Error occurred while getting income statements for ${cik}: ${err.message}`)
        }
    }

    private async getCashFlowStatements(cik: string): Promise<CashFlowStatement[]> {
        console.log(`In statement service getting cash flow statements for ${cik}`);
        try {
            const url = this.fmpApiUrl + this.buildURI(cik, 'cash-flow-statement');
            return fetch(url)
                .then(async (response: Response) => {
                    if (response.status !== 200) {
                        const text = await response.text();
                        throw new HttpException(response.status,
                            `Error occurred while getting cash flow statements for ${cik}: ${text}`);
                    }
                    return response.json();
                }).then((body: CashFlowStatement[]) => {
                    return cleanStatements(cik, body);
                });
        } catch (err: any) {
            throw new HttpException(err.status,
                `Error occurred while getting cash flow statements for ${cik}: ${err.message}`)
        }
    }

    private buildURI(cik: string, identifier: string): string {
        return `/${identifier}/${simplifyCik(cik)}?period=quarter&apikey=${this.apiKey}&limit=132`;
    }

}

export default StatementService;
