import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { countryQuery, CountryResponse } from "../../services/countryApi";

interface RequestState {
    data: CountryResponse[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: RequestState = {
    data: [],
    status: 'idle',
    error: null,
};

// Thunks
export const fetchCountryList = createAsyncThunk('country/list/fetch', async () => {
    const response = await countryQuery();
    return response.data;
});

// Slice
const CountrySlice = createSlice({
    name: 'country',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchCountryList.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchCountryList.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.data = action.payload;
            })
            .addCase(fetchCountryList.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message || null;
            })
    }
});

export default CountrySlice.reducer;
