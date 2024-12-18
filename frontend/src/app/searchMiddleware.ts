import { Middleware } from "@reduxjs/toolkit";
import { RootState, AppDispatch } from "./store";
import { fetchRecords, submitSearch, setCurrentPage, addLayer, editLayer, deleteLayer } from "../features/search/searchSlice";

/* eslint-disable @typescript-eslint/no-empty-object-type */
const searchMiddleware: Middleware<{}, RootState> = (storeAPI) => (next) => (action) => {
  const result = next(action);

  const state = storeAPI.getState();
  const dispatch = storeAPI.dispatch as AppDispatch;

  const matchers = [submitSearch.match, setCurrentPage.match, addLayer.match, editLayer.match, deleteLayer.match];
  if (matchers.some((matcher) => matcher(action))) {
    const { query, filterValues, currentPage: page, features } = state.search;
    const { startDate, endDate, phase, ...otherFilters } = filterValues;
    const filters = {
      ...otherFilters,
      country: otherFilters.country.map((c) => c.code),
      dateRange: {
        start: startDate?.toISOString().substring(0, 10),
        end: endDate?.toISOString().substring(0, 10),
      },
      epoch: phase.map((p) => p.value),
    }
    if (query !== '') {
      dispatch(fetchRecords({query, ...filters, page, features, output: 'geojson'}));
    }
  }

  return result;
}

export default searchMiddleware;
