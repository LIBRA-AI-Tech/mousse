import { FeatureCollection } from "geojson";
import { API_BASE_URL, ApiResponse, handleResponse } from "./api";

export interface CountryResponse {
    code: string;
    label: string;
}

export const countryQuery = async (): Promise<ApiResponse<CountryResponse[]>> => {
    const response = await fetch(`${API_BASE_URL}/country/list`);
    return handleResponse<CountryResponse[]>(response);
}

export const countryGeoJSON = async (countryList: string[]): Promise<ApiResponse<FeatureCollection>> => {
    const response = await fetch(`${API_BASE_URL}/country/${countryList.join(';')}`);
    return handleResponse<FeatureCollection>(response);
}
