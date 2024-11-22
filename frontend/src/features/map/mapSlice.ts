import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Feature } from "geojson";

interface mapState {
  hoveredFeature: string|number|null;
  features: Feature[];
}

const initialState: mapState = {
  hoveredFeature: null,
  features: []
}

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setHoveredFeature: (state, action: PayloadAction<mapState['hoveredFeature']>) => {
      state.hoveredFeature = action.payload;
    },
    addLayer: (state, action: PayloadAction<Feature>) => {
      state.features = [...state.features, action.payload];
    },
    editLayer: (state, action: PayloadAction<Feature>) => {
      state.features = state.features
        .map(feature => feature.id === action.payload.id ? action.payload : feature);
    },
    deleteLayer: (state, action: PayloadAction<number>) => {
      state.features = state.features.filter(feature => feature.id !== action.payload);
    },
    resetLayer: (state) => {
      state.features = [];
    }
  }
});

export const { setHoveredFeature, addLayer, editLayer, deleteLayer, resetLayer } = mapSlice.actions;

export default mapSlice.reducer;
