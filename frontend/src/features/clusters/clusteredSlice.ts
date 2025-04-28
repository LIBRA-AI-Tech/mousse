import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Cluster, ClusteredRequest, clusteredSearch } from "../../services/clusteredApi";

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

const clusteredSlice = createSlice({
  name: 'clusteredSearch',
  initialState: initialState,
  reducers: {
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
        Object.assign(state, {...initialState, status: 'pending', hoveredCluster: -1});
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
      });
  }
});

export const { resetClusters, setHoveredCluster } = clusteredSlice.actions;
export default clusteredSlice.reducer;
