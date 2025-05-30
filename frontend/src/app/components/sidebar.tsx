import { Alert, FormControlLabel, Grid2, Paper, Switch, Typography } from '@mui/material'
import React from 'react';
import { RootState, useAppDispatch } from '../store';
import { useSelector } from 'react-redux';
import { toggleMode } from '../../features/search/searchSlice';

interface SidebarProps {
  children: React.ReactNode;
}

const Sidebar = ({children}: SidebarProps) => {
  const dispatch = useAppDispatch();
  const { error: cerror, status: cstatus } = useSelector((state: RootState) => state.clustered);
  const { error: serror, status: sstatus, records: { page, hasMore }, clusteredMode, usedLowerThreshold } = useSelector((state: RootState) => state.search);

  const loading = cstatus === 'pending' || sstatus === 'pending' || sstatus === 'loading';

  const handleSwitch = () => {
    dispatch(toggleMode());
  }

  const childrenWrapper = (children: React.ReactNode) => {
    const error = clusteredMode ? cerror : serror;
    if (error) return <Alert variant='outlined' severity='error' sx={{marginBlockStart: '2rem', marginInline: '.5rem'}}>{error}</Alert>

    return children;
  }

  return (
    <Paper sx={loading ? {height: 'calc(100vh - 100px)', maxHeight: 'calc(100vh - 100px)', overflow: 'auto', position: 'relative', opacity: 0.5, pointerEvents: 'none'} : {height: 'calc(100vh - 100px)', maxHeight: 'calc(100vh - 100px)', overflow: 'auto', position: 'relative'}}>
      <Grid2 container alignItems='center' justifyContent='space-between' sx={{marginBlock: '.5rem .7rem'}}>
        <Typography variant="h6" sx={{mx: 2}} color="textSecondary">Results</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={clusteredMode}
              disabled={(!hasMore && page===1 && !clusteredMode) || (usedLowerThreshold)} onChange={handleSwitch}
            />
          }
          label="Cluster view"
          labelPlacement="start"
          sx={{marginInlineEnd: '.3rem'}}
        />
      </Grid2>
      {childrenWrapper(children)}
    </Paper>
  )
};

export default Sidebar;
