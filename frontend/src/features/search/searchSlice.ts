import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FeatureCollection, Feature } from 'geojson';
import { RecordSearchRequest, recordSearch } from '../../services/recordsApi';
import { FilterValuesType } from '../../types';

interface Records {
  data: FeatureCollection | null;
  page: number;
  hasMore: boolean;
}

interface SearchState {
  records: Records;
  query: string;
  filterValues: FilterValuesType;
  currentPage: number;
  pageCount: number;
  features: Feature[]
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialRecords: Records = {
  data: null,
  page: 1,
  hasMore: true,
}

export const initialFilterValues = {
  country: [],
  startDate: null,
  endDate: null,
  phase: [],
}

const initialState: SearchState = {
  records: initialRecords,
  query: '',
  filterValues: initialFilterValues,
  currentPage: 1,
  pageCount: 1,
  features: [],
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
    resetResults: (state) => Object.assign(state, initialState),
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    submitSearch: (state, action: PayloadAction<{query: string, filterValues: FilterValuesType}>) => {
      state.query = action.payload.query;
      state.filterValues = action.payload.filterValues;
      state.currentPage = 1;
      state.pageCount = 1;
    },
    addLayer: (state, action: PayloadAction<Feature>) => {
      state.features = [...state.features, action.payload];
      state.currentPage = 1;
      state.pageCount = 1;
    },
    editLayer: (state, action: PayloadAction<Feature>) => {
      state.features = state.features
        .map(feature => feature.id === action.payload.id ? action.payload : feature);
      state.currentPage = 1;
      state.pageCount = 1;
    },
    deleteLayer: (state, action: PayloadAction<number>) => {
      state.features = state.features.filter(feature => feature.id !== action.payload);
      state.currentPage = 1;
      state.pageCount = 1;
    },
    resetLayer: (state) => {
      state.features = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecords.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchRecords.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        state.records = action.payload;
        state.pageCount = Math.max(state.pageCount, action.payload.page + Number(action.payload.hasMore))
      })
      .addCase(fetchRecords.rejected, (state, action) => {
        Object.assign(state, initialState);
        state.status = 'failed';
        state.error = action.error.message || null;
      });
  }
});

export const { resetResults, setCurrentPage, submitSearch, addLayer, editLayer, deleteLayer, resetLayer } = searchSlice.actions;

export default searchSlice.reducer;
