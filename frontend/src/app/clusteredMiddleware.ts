import { Middleware } from "@reduxjs/toolkit";
import { RootState, AppDispatch } from "./store";
import { fetchClusteredResults, initiateClusteredSearch} from "../features/clusters/clusteredSlice";

/* eslint-disable @typescript-eslint/no-empty-object-type */
const clusteredMiddleware: Middleware<{}, RootState> = (storeAPI) => (next) => (action) => {
  const result = next(action);

  const state = storeAPI.getState();
  const dispatch = storeAPI.dispatch as AppDispatch;

  const matchers = [initiateClusteredSearch.match];
  if (matchers.some((matcher) => matcher(action))) {
    const { query, filterValues, features } = state.search;
    const { country, startDate, endDate, phase } = filterValues;
    const requestBody = {
      query,
      country: country.map(c => c.code),
      features: features,
      dateRange: {
        start: startDate?.toISOString().substring(0, 10),
        end: endDate?.toISOString().substring(0, 10),
      },
      epoch: phase.map(p => p.value),
    }

    if (query !== '') {
      dispatch(fetchClusteredResults(requestBody))
    }
  }

  return result;
}

export default clusteredMiddleware;
