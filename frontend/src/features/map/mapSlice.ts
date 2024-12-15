import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface mapState {
  hoveredFeature: string|number|null;
}

const initialState: mapState = {
  hoveredFeature: null,
}

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setHoveredFeature: (state, action: PayloadAction<mapState['hoveredFeature']>) => {
      state.hoveredFeature = action.payload;
    }
  }
});

export const { setHoveredFeature } = mapSlice.actions;

export default mapSlice.reducer;
