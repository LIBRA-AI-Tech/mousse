import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FeatureCollection, Feature } from 'geojson';
import { RecordSearchRequest, recordSearch, recordSearchResponse } from '../../services/recordsApi';
import { clusterMembers } from '../../services/clusteredApi';
import { FilterValuesType } from '../../types';
import { RootState } from '../../app/store';

const CACHE_SIZE = 30;

interface Records {
  data: FeatureCollection | null;
  page: number;
  hasMore: boolean;
}

interface SearchState {
  records: Records;
  query: string;
  usedLowerThreshold: boolean;
  filterValues: FilterValuesType;
  currentPage: number;
  pageCount: number;
  features: Feature[]
  status: 'idle' | 'pending' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  cache: Record<number, Records>;
}

interface FetchRecordsErrorPayload {
  usedCache: boolean;
  data: Records;
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
  usedLowerThreshold: false,
  query: '',
  filterValues: initialFilterValues,
  currentPage: 1,
  pageCount: 1,
  features: [],
  status: 'idle',
  error: null,
  cache: {},
}

// Thunks
export const fetchRecords = createAsyncThunk<
  recordSearchResponse,
  RecordSearchRequest,
  { rejectValue: FetchRecordsErrorPayload }
>('records/search', 
  async (body: RecordSearchRequest, { getState, rejectWithValue }) => {
    const state = getState() as RootState;
    const { clusteredMode } = state.ui;

    const { page } = body;
    if (!clusteredMode && page && state.search.cache[page]) {
      return rejectWithValue({ usedCache: true, data: state.search.cache[page] });
    }
    let response;
    if (clusteredMode) {
      const { hoveredCluster } = state.clustered;
      if (hoveredCluster === -1) {
        return rejectWithValue({ usedCache: true, data: initialRecords });
      }
      response = await clusterMembers(hoveredCluster, body);
    } else {
      response = await recordSearch(body);
    }
    return response.data;
  }
);

const initiateNewSearch = (state: SearchState) => {
  state.currentPage = 1;
  state.pageCount = 1;
  state.cache = {};
}

const addToCache = (state: SearchState, payload: recordSearchResponse) => {
  const current_cache: Record<number, Records> = Object.entries(state.cache)
    .slice(Math.max(0, Object.keys(state.cache).length - CACHE_SIZE))
    .reduce((obj, [key, value]) => ({
      ...obj,
      [key]: value,
    }), {});
  state.cache = {...current_cache, [payload.page]: payload};
}

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    initiateSearch: (state) => {
      state.status = 'pending';
    },
    resetResults: (state) => Object.assign(state, initialState),
    resetSearch: (state) => {
      state.records = initialState.records;
      state.cache = initialState.cache;
      state.pageCount = initialState.pageCount;
    },
    setThresholdFlag: (state, action: PayloadAction<boolean>) => {
      state.usedLowerThreshold = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    submitSearch: (state, action: PayloadAction<{query: string, filterValues: FilterValuesType}>) => {
      state.query = action.payload.query;
      state.filterValues = action.payload.filterValues;
      initiateNewSearch(state);
    },
    addLayer: (state, action: PayloadAction<Feature>) => {
      state.features = [...state.features, action.payload];
      initiateNewSearch(state);
    },
    editLayer: (state, action: PayloadAction<Feature>) => {
      state.features = state.features
        .map(feature => feature.id === action.payload.id ? action.payload : feature);
        initiateNewSearch(state);
    },
    deleteLayer: (state, action: PayloadAction<number>) => {
      state.features = state.features.filter(feature => feature.id !== action.payload);
      initiateNewSearch(state);
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
        addToCache(state, action.payload);
        state.records = action.payload;
        state.pageCount = Math.max(state.pageCount, action.payload.page + Number(action.payload.hasMore))
      })
      .addCase(fetchRecords.rejected, (state, action) => {
        if (action.payload?.usedCache) {
          state.status = 'succeeded';
          state.error = null;
          state.records = action.payload.data;
        } else {
          Object.assign(state, initialState);
          state.status = 'failed';
          state.error = action.error.message || null;
        }
      });
  }
});

export const { resetResults, resetSearch, setThresholdFlag, setCurrentPage, submitSearch, addLayer, editLayer, deleteLayer, resetLayer, initiateSearch } = searchSlice.actions;

export default searchSlice.reducer;
