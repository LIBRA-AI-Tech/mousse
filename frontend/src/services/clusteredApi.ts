
import { Dayjs } from "dayjs";
import { Feature } from "geojson";
import { API_BASE_URL, ApiResponse, handleResponse } from "./api"

export interface Cluster {
  id: number;
  representativeTitle: string;
  summary: string;
  elementCount: number;
}

export type ClusteredResponse = Cluster[];

type DateRange = {
  start?: Dayjs | null,
  end?: Dayjs | null,
}

export interface ClusteredRequest {
  query: string;
  country?: string[];
  features?: Feature[];
  dateRange?: DateRange;
  epoch?: string[];
}

export const clusteredSearch = async (body: ClusteredRequest): Promise<ApiResponse<ClusteredResponse>> => {
  const response = await fetch(`${API_BASE_URL}/clustered/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body),
  });

  return handleResponse<ClusteredResponse>(response);
}
