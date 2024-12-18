import { API_BASE_URL, ApiResponse, handleResponse } from "./api";
import { CountryType, PhaseOptionType } from "../types";

type TimeRange = {
    start: string|null;
    end: string|null;
}

type Entities = {
    location: string|null;
    date: string|null;
}

export interface AnalyzerResponse {
    query: string;
    country: CountryType[];
    timerange: TimeRange,
    cleanedQuery: string;
    entities: Entities;
    phase: PhaseOptionType[];
}

export const analyzeQuery = async (query: string, signal: AbortSignal): Promise<ApiResponse<AnalyzerResponse>> => {
    const response = await fetch(`${API_BASE_URL}/ner/analyze?query=${encodeURI(query)}`, {signal});
    return handleResponse<AnalyzerResponse>(response);
}
