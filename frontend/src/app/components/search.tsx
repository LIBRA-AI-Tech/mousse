import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import dayjs, { Dayjs } from 'dayjs';
import _ from 'lodash';
import { Paper, IconButton, Divider, Fade, ToggleButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import FilterBar from './filterBar';
import { RootState, useAppDispatch } from '../store';
import { toggleFilterSection } from '../../features/ui/uiSlice';
import { resetResults, submitSearch, initiateSearch } from '../../features/search/searchSlice';
import { ClearIcon } from '@mui/x-date-pickers';

import { analyzeQuery, AnalyzerResponse } from '../../services/analyzerApi';
import StyledInput from '../../components/styledInput';
import { FilterValuesType } from '../../types';

const Search = () => {

  const dispatch = useAppDispatch();
  const { isFilterSectionOpen } = useSelector((state: RootState) => state.ui)
  const { status } = useSelector((state: RootState) => state.search);
  const [isFilterToggleButtonPressed, setIsFilterToggleButtonPressed] = useState(false);
  const initialFilterValues: FilterValuesType = useMemo(() => ({
    country: [],
    startDate: null,
    endDate: null,
    phase: [],
  }), []);
  const [filterValues, setFilterValues] = useState({...initialFilterValues});
  const [manualSetFilters, setManualSetFilters] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [resetFlag, setResetFlag] = useState(false);

  const [queryAnalysis, setQueryAnalysis] = useState<AnalyzerResponse|null>(null);

  const [analyzerJobId, setAnalyzerJobId] = useState<number|null>(null);
  const [isReadyForSubmit, setIsReadyFormSubmit] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const componentRef = useRef<HTMLDivElement>(null);

  const controllerRef = useRef<AbortController | null>(null);

  const handleFocus = () => {
    dispatch(toggleFilterSection(true));
  }

  const handleFormSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (queryAnalysis?.query === query) {
      processFormSubmission();
    } else {
      dispatch( initiateSearch() );
    }
  }

  const processFormSubmission = useCallback(() => {
    const { cleanedQuery } = queryAnalysis || {cleanedQuery: null};
    dispatch(toggleFilterSection(false));
    if (inputRef.current) {
      inputRef.current.blur();
    }
    if (query !== '') {
      dispatch(submitSearch({query: (cleanedQuery && cleanedQuery.length > 0) ? cleanedQuery.join(' ') : query, filterValues}));
    } else {
      dispatch(resetResults());
    }
  }, [dispatch, query, queryAnalysis, filterValues]);

  const handleFilterChange = ({name, value}: {name: string, value: FilterValuesType['country']|FilterValuesType['phase']|Dayjs|null}) => {
    setFilterValues({...filterValues, [name]: value});
    if (name === 'country') {
      if (queryAnalysis?.entities.location) {
        setQueryAnalysis({
          ...queryAnalysis,
          cleanedQuery: [...queryAnalysis.cleanedQuery, ...queryAnalysis.entities.location]
        });
      }
    } else {
      if (queryAnalysis?.entities.date) {
        setQueryAnalysis({
          ...queryAnalysis,
          cleanedQuery: [...queryAnalysis.cleanedQuery, ...queryAnalysis.entities.date]
        });
      }
    }
    if (!value || (Array.isArray(value) && value.length === 0)) {
      const idx = manualSetFilters.indexOf(name);
      if (idx !== -1)
        setManualSetFilters((prevValues) => [...prevValues.slice(0, idx), ...prevValues.slice(idx + 1)]);
    } else {
      setManualSetFilters((prevValues) => [...prevValues, name]);
    }
  }

  const handleReset = () => {
    setQuery(() => '');
    setQueryAnalysis(null);
    setResetFlag(true);
  }

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (componentRef.current && !componentRef.current.contains(event.target as Node)) {
      const muiSelectMenu = document.querySelector('.MuiPopper-root, .MuiSelect-root');
      if (muiSelectMenu && muiSelectMenu.contains(event.target as Node)) {
        return; // Ignore the click if it is inside a MUI portal component
      }
      dispatch(toggleFilterSection(false));
    }
  }, [dispatch]);

  const handleFiltersReset = useCallback(() => {
    setFilterValues(() => ({...initialFilterValues}));
    setManualSetFilters([]);
  }, [initialFilterValues]);

  const handleQueryChange = (currentQuery: string) => {
    const prevQuery = query;
    if (prevQuery !== currentQuery) {
      setIsReadyFormSubmit(false);
    }
    setQuery(currentQuery);
    if (analyzerJobId) {
      clearTimeout(analyzerJobId);
    }
    if (controllerRef.current) {
      controllerRef.current.abort("AbortAnalyze");
    }
    if (!currentQuery.includes(prevQuery)) {
      setQueryAnalysis(null);
    }
    if (!currentQuery || currentQuery === '' || currentQuery === queryAnalysis?.query) {
      return;
    }
    const currentAnalyzerJobId = setTimeout(async () => {
      const controller = new AbortController();
      controllerRef.current = controller;
      try {
        const analyzerResponse = await analyzeQuery(currentQuery, controller.signal);
        setQueryAnalysis(analyzerResponse.data);
        applyAnalysisOnFilters(analyzerResponse.data);
        setIsReadyFormSubmit(() => true);
      } catch (error) {
        if (error !== 'AbortAnalyze') {
          console.warn('Error analyzing query', error);
          setIsReadyFormSubmit(() => true);
        }
      }
      controllerRef.current = null;
    }, 500);
    setAnalyzerJobId(currentAnalyzerJobId)
  }

  const applyAnalysisOnFilters = (entities: AnalyzerResponse) => {
    setFilterValues((prevValues) => {
      const currentValues = {...prevValues};
      if (entities.country && !manualSetFilters.includes('country')) {
        currentValues.country = entities.country;
      }
      if (!manualSetFilters.includes('startDate')) {
        currentValues.startDate = (!entities.timerange.start) ? null : dayjs(entities.timerange.start);
      }
      if (!manualSetFilters.includes('endDate')) {
        currentValues.endDate = (!entities.timerange.end) ? null : dayjs(entities.timerange.end);
      }
      if (entities.phase && !manualSetFilters.includes('phase')) {
        currentValues.phase = entities.phase;
      }
      return currentValues;
    });
  }

  const applyStyling = (value: string) => {
    if (!queryAnalysis || queryAnalysis.cleanedQuery.length === 0 || (queryAnalysis.cleanedQuery.length === 1 && queryAnalysis.cleanedQuery[0] === value)) {
      return [{start: 0, end: value.length, style: {}}];
    }
    const { cleanedQuery, entities } = queryAnalysis;
    const location = entities.location ?? [null];
    const dates = entities.date ?? [null];
    const parts = [...cleanedQuery, ...location, ...dates]
      .filter((substring) => substring !== null)
      .map((substring, index) => ({
        start: value.indexOf(substring),
        end: value.indexOf(substring) + substring.length,
        style: index < cleanedQuery.length ? {color: 'rgba(0,0,0,1)'} : {color: 'rgba(0,0,0,0.5)'},
      }))
      .filter(({start}) => start !== -1);
    parts.sort((a, b) => a.start - b.start);

    const filledParts: typeof parts = [];
    const defaultStyle = {color: 'rgba(0,0,0,0.3)'};
    let start = 0;
    for (let i = 0; i < parts.length; i++) {
      const element = parts[i];
      if (start < element.start) {
        filledParts.push({start, end: element.start, style: defaultStyle});
      }
      if (start > element.start) continue;
      filledParts.push(element);
      start = element.end;
    }
    if (start < value.length) {
      filledParts.push({start, end: value.length, style: defaultStyle});
    }
    return filledParts;
  }

  useEffect(() => {
    if (resetFlag) {
      processFormSubmission();
      setResetFlag(false);
    }
  }, [resetFlag, processFormSubmission]);

  useEffect(() => {
    // Add event listener when the component is mounted
    document.addEventListener('mousedown', handleClickOutside);

    // Clean up the event listener when the component is unmounted
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  useEffect(() => {
    if (isReadyForSubmit) {
      if (status === 'pending') {
        processFormSubmission();
      }
    }
  }, [isReadyForSubmit, status, processFormSubmission]);

  return (
    <div ref={componentRef} style={{ position: 'relative' }}>
      <Paper
        component="form"
        sx={{ p: '2px 4px', display: 'flex', alignItems: 'center', width: '40vw', borderRadius: '17px' }}
        onSubmit={handleFormSubmit}
      >
        <IconButton
          type="submit"
          sx={{ p: '10px' }}
          aria-label="search"
        >
          <SearchIcon />
        </IconButton>
        <StyledInput
          placeholder="Semantic Search"
          inputProps={{ 'aria-label': 'semantic search' }}
          onFocus={handleFocus}
          inputRef={inputRef}
          value={query}
          onChange={(value) => handleQueryChange(value)}
          applyStyling={applyStyling}
        />
        <IconButton onClick={handleReset} sx={{visibility: query === '' ? 'hidden' : 'visible'}}>
          <ClearIcon/>
        </IconButton>
        <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
        <ToggleButton
          value="check"
          selected={isFilterToggleButtonPressed}
          sx={{border: "none", p: '10px'}}
          aria-label="filters"
          onClick={() => setIsFilterToggleButtonPressed(!isFilterToggleButtonPressed)}
          color={_.isEqual(filterValues, initialFilterValues) ? 'primary' : 'warning'}
        >
          <TuneIcon color={_.isEqual(filterValues, initialFilterValues) ? 'primary' : 'warning'} />
        </ToggleButton>
        { (isFilterToggleButtonPressed || isFilterSectionOpen) &&
          <Fade in={(isFilterToggleButtonPressed || isFilterSectionOpen)} timeout={500}>
            <div>
              <FilterBar
                values={filterValues}
                onChange={handleFilterChange}
                onReset={handleFiltersReset}
              />
            </div>
          </Fade>
        }
      </Paper>
    </div>
  );
}

export default Search;
