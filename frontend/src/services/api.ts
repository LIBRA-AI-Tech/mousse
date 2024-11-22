export interface ApiResponse<T> {
    data: T;
    error?: string;
}

export const API_BASE_URL = '/api';

export const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
    }
    const data = await response.json();
    return { data };
}
