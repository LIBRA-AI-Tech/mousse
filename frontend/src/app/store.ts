import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import { setupListeners } from '@reduxjs/toolkit/query';
import uiReducer from '../features/ui/uiSlice';
import searchReducer from '../features/search/searchSlice';
import mapReducer from '../features/map/mapSlice';
import countryReducer from '../features/country/countrySlice';
import clusteredReducer from '../features/clusters/clusteredSlice';
import searchMiddleware from './searchMiddleware';

const rootReducer = combineReducers({
  ui: uiReducer,
  search: searchReducer,
  clustered: clusteredReducer,
  map: mapReducer,
  countryList: countryReducer,
});
const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(searchMiddleware)
});

setupListeners(store.dispatch);

export type AppStore = typeof store;
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = AppStore['dispatch'];

export const useAppDispatch = () => useDispatch<AppDispatch>();

export default store;
