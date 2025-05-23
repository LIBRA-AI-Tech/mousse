import { Middleware } from "@reduxjs/toolkit";
import { RootState, AppDispatch } from "./store";
import { fetchRecords, submitSearch, setCurrentPage, addLayer, editLayer, deleteLayer, setThresholdFlag } from "../features/search/searchSlice";
import { toggleMode } from "../features/search/searchSlice";
import { fetchClusteredResults, setHoveredCluster } from "../features/clusters/clusteredSlice";

/* eslint-disable @typescript-eslint/no-empty-object-type */
const searchMiddleware: Middleware<{}, RootState> = (storeAPI) => (next) => (action) => {
  const result = next(action);

  const state = storeAPI.getState();
  const dispatch = storeAPI.dispatch as AppDispatch;

  const matchers = [
    submitSearch.match,
    setCurrentPage.match,
    addLayer.match, editLayer.match,
    deleteLayer.match,
    toggleMode.match,
    setHoveredCluster.match,
    setThresholdFlag.match,
  ];
  if (matchers.some((matcher) => matcher(action))) {
    const { query, filterValues, currentPage: page, features, clusteredMode } = state.search;
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
      if (toggleMode.match(action) && clusteredMode) {
        dispatch(fetchClusteredResults({query, ...filters, features}))
      } else {
        const threshold = (setThresholdFlag.match(action)) ? 0.3 : 0.45;
        dispatch(fetchRecords({query, ...filters, page, features, threshold, output: 'geojson'}));
      }
    }
  }

  return result;
}

export default searchMiddleware;
