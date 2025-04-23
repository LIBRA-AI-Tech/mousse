import { Feature, FeatureCollection } from "geojson";
import { API_BASE_URL, ApiResponse, handleResponse } from "./api";
import { PhaseOptionType, RecordDetails } from "../types";

export interface recordSearchResponse {
  page: number;
  hasMore: boolean;
  data: FeatureCollection;
}

type DateRange = {
  start?: string,
  end?: string,
}

export interface RecordSearchRequest {
  query: string;
  page?: number;
  output?: 'json'|'geojson'
  country?: string[];
  threshold?: number;
  features?: Feature[];
  dateRange?: DateRange;
  epoch?: PhaseOptionType['value'][];
}

export const recordSearch = async (body: RecordSearchRequest): Promise<ApiResponse<recordSearchResponse>> => {
  const response = await fetch(`${API_BASE_URL}/records/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
  });
  return handleResponse<recordSearchResponse>(response);
}

export const fetchRecordById = async (recordId: string): Promise<ApiResponse<RecordDetails>> => {
  const response = await fetch(`${API_BASE_URL}/records?id=${recordId}`);
  return handleResponse<RecordDetails>(response);
}
