import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Backdrop, CircularProgress, Grid2, Slide } from '@mui/material';
import Map from './components/map';
import Bar from './components/bar';
import Info from './components/info';
import Results from './components/results';
import { fetchCountryList } from '../features/country/countrySlice';
import { RootState, useAppDispatch } from './store';

import 'simplebar-react/dist/simplebar.min.css';
import Details from './components/details';

function App() {

  const dispatch = useAppDispatch();
  const { data } = useSelector((state: RootState) => state.search.records);
  const { status } = useSelector((state: RootState) => state.search);
  const { record } = useParams();

  useEffect(() => {
    dispatch(fetchCountryList());
  }, [dispatch]);

  return (
    <>
      <Bar/>
      <Grid2 container spacing={0}>
        { data &&
          <Slide direction="right" in={data !== null}>
            <Grid2 size={3}>
              <Sidebar>
                {data && <Results/>}
              </Sidebar>
            </Grid2>
          </Slide>
        }
        <Grid2 size={!data ? 12 : 9} sx={{position: 'relative'}}>
          {clusteredMode ? <ClusteredGrid /> : <Map/>}
          <Backdrop
            sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1, position: 'absolute' })}
            open={status === 'loading' || status === 'pending'}
          >
            <CircularProgress color="inherit" />
          </Backdrop>
        </Grid2>
      </Grid2>
      { record &&
        <Details recordId={record} open={true} />
      }
      <Info/>
    </>
  );
}

export default App;
