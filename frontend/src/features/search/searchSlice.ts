import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { FeatureCollection } from 'geojson';
import { RecordSearchRequest, recordSearch } from '../../services/recordsApi';

interface SearchState {
  results: FeatureCollection|null;
  page: number;
  hasMore: boolean;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: SearchState = {
  results: null,
  page: 1,
  hasMore: true,
  status: 'idle',
  error: null,
}

// Thunks
export const fetchRecords = createAsyncThunk('records/search', async (body: RecordSearchRequest) => {
  const response = await recordSearch(body);
  return response.data;
});

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    resetResults: (state) => {
      state.error = initialState.error;
      state.results = initialState.results;
      state.page = initialState.page;
      state.hasMore = initialState.hasMore;
      state.status = initialState.status;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecords.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchRecords.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.results = action.payload.data;
        state.page = action.payload.page;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchRecords.rejected, (state, action) => {
        state = {...initialState, status: 'failed', error: action.error.message || null};
      });
  }
});

export const { resetResults } = searchSlice.actions;

export default searchSlice.reducer;
