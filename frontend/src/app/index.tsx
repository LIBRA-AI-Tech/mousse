import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Grid2, Slide } from '@mui/material';
import Map from './components/map';
import Bar from './components/bar';
import Info from './components/info';
import Results from './components/results';
import { fetchCountryList } from '../features/country/countrySlice';
import { RootState, useAppDispatch } from './store';

import 'simplebar-react/dist/simplebar.min.css';

function App() {

  const dispatch = useAppDispatch();
  const { results } = useSelector((state: RootState) => state.search);

  useEffect(() => {
    dispatch(fetchCountryList());
  }, [dispatch]);

  return (
    <>
      <Bar/>
      <Grid2 container spacing={0}>
        { results &&
          <Slide direction="right" in={results !== null}>
            <Grid2 size={3}>
              <Results/>
            </Grid2>
          </Slide>
        }
        <Grid2 size={!results ? 12 : 9}>
          <Map/>
        </Grid2>
      </Grid2>
      <Info/>
    </>
  );
}

export default App;
