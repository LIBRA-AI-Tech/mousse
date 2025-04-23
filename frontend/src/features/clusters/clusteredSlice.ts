import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Cluster, ClusteredRequest, clusteredSearch, clusterMembers } from "../../services/clusteredApi";
import { RecordSearchRequest, recordSearchResponse } from '../../services/recordsApi';
import { RootState } from '../../app/store';

interface ClusteredState {
  status: 'idle' | 'pending' | 'succeeded' | 'failed';
  clusters: Cluster[];
  resultCount: number,
  error: string | null;
  hoveredCluster: number;
}

const initialState: ClusteredState = {
  status: 'idle',
  clusters: [],
  resultCount: 1,
  error: null,
  hoveredCluster: -1
}

export const fetchClusteredResults = createAsyncThunk(
  'records/clusteredSearch',
  async (body: ClusteredRequest) => {
    const response = await clusteredSearch(body);
    return response.data;
  }
)

export const fetchRecordsByClusterId = createAsyncThunk<
  recordSearchResponse,
  RecordSearchRequest,
  { rejectValue: RecordSearchRequest }
>(
  'records/clusteredSearchById',
  async (body: RecordSearchRequest, {getState}) => {
    const state = getState() as RootState
    const { hoveredCluster } = state.clustered;
    const response = await clusterMembers(hoveredCluster, body);
    return response.data;
  }
)

const clusteredSlice = createSlice({
  name: 'clusteredSearch',
  initialState: initialState,
  reducers: {
    initiateClusteredSearch: (state) => {
      state.status = 'pending';
    },
    resetClusters: (state) => {
      Object.assign(state, initialState);
    },
    setHoveredCluster: (state, action) => {
      state.hoveredCluster = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClusteredResults.pending, (state) => {
        state.status = 'pending';
      })
      .addCase(fetchClusteredResults.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.clusters = action.payload;
        state.error = null;
        state.resultCount = action.payload.length;
      })
      .addCase(fetchClusteredResults.rejected, (state, action) => {
        Object.assign(state, initialState);
        state.status = 'failed';
        state.error = action.error.message || "Couldn't fetch clustered results";
      })
  }
})

export const { initiateClusteredSearch, resetClusters, setHoveredCluster } = clusteredSlice.actions;
export default clusteredSlice.reducer;
