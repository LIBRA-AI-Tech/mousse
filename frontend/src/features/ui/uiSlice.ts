import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  isInfoModalOpen: boolean;
  isResultsSectionVisible: boolean;
  isResultsSectionOpen: boolean;
  isFilterSectionOpen: boolean;
  isDrawOnMapActive: boolean
}

const initialState: UIState = {
  isInfoModalOpen: false,
  isResultsSectionVisible: false,
  isResultsSectionOpen: false,
  isFilterSectionOpen: false,
  isDrawOnMapActive: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleInfoModal: (state, action: PayloadAction<boolean>) => {
      state.isInfoModalOpen = action.payload;
    },
    toggleResultsSection: (state, action: PayloadAction<boolean>) => {
      state.isResultsSectionVisible = action.payload;
    },
    toggleFilterSection: (state, action: PayloadAction<boolean>) => {
      state.isFilterSectionOpen = action.payload;
    },
    toggleDrawOnMap: (state, action: PayloadAction<boolean>) => {
      state.isDrawOnMapActive = action.payload;
    },
  },
});

export const { toggleInfoModal, toggleResultsSection, toggleFilterSection, toggleDrawOnMap } = uiSlice.actions;

export default uiSlice.reducer;
