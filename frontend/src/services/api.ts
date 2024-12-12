export interface ApiResponse<T> {
    data: T;
    error?: string;
}

export const API_BASE_URL = '/api';

export class HttpError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        this.name = "HttpError";
    }
}

export const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
    if (!response.ok) {
        const errorText = await response.text();
        throw new HttpError(errorText, response.status);
    }
    const data = await response.json();
    return { data };
}
