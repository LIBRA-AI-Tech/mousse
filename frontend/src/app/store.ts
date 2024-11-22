import { configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import { setupListeners } from '@reduxjs/toolkit/query';
import uiReducer from '../features/ui/uiSlice';
import searchReducer from '../features/search/searchSlice';
import mapReducer from '../features/map/mapSlice';
import countryReducer from '../features/country/countrySlice';

const store = configureStore({
  reducer: {
    ui: uiReducer,
    search: searchReducer,
    map: mapReducer,
    countryList: countryReducer,
  }
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();

export default store;
