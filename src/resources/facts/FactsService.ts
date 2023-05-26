import HttpException from "@/utils/exceptions/HttpException";
import CONSTANTS from "../ResourceConstants";
import fetch from 'node-fetch';
import Discount from "../discount/IDiscount";
import HistoricalPriceService from "../../Services/HistoricalPriceService/HistoricalPriceService";
import IdentityService from "../identity/IdentityService";
import Identity from "../identity/models/Identity";
import { Frequency } from "../../Services/HistoricalPriceService/models/Frequency";
import HistoricalPriceInput from "../../Services/HistoricalPriceService/models/HistoricalPriceInput";
import { buildHeadersWithBasicAuth } from "../../utils/serviceUtils";
import PriceData from "../../Services/HistoricalPriceService/models/PriceData";

class FactsService {

    private financialFactsServiceFactsV1Url: string;
    private identityService: IdentityService;
    private historicalPriceService: HistoricalPriceService;
    
    constructor() {
        this.financialFactsServiceFactsV1Url
            = process.env.FINANCIAL_FACTS_SERVICE_BASE_URL + CONSTANTS.FACTS.V1_ENDPOINT;
        this.identityService = new IdentityService();
        this.historicalPriceService = new HistoricalPriceService();
    }

    // Fetch financial facts for a company
    public async getFacts(cik: string): Promise<any> {
        try {
            const url = `${this.financialFactsServiceFactsV1Url}/${cik}`;
            return fetch(url, { method: 'GET', headers: buildHeadersWithBasicAuth()})
                .then(async (response: Response) => {
                    if (response.status != 200) {
                        throw new HttpException(response.status, CONSTANTS.FACTS.FETCH_ERROR + await response.text());
                    }
                    return response.text();
                }).then((body: string) => {
                    return JSON.parse(body);
                })
        } catch (err: any) {
            throw new HttpException(err.status, CONSTANTS.FACTS.FETCH_ERROR + err.message);
        }
    }
}

export default FactsService;
