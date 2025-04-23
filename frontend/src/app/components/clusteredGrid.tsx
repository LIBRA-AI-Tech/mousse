import { Paper, Theme, Tooltip, Typography } from "@mui/material"
import { Grid } from "@mui/system"
import { RootState, useAppDispatch } from "../store"
import { useSelector } from "react-redux"
import { setHoveredCluster } from "../../features/clusters/clusteredSlice"

const ClusteredGrid = () => {
  const dispatch = useAppDispatch();
  const { clusters, hoveredCluster } = useSelector((state: RootState) => state.clustered);

  const applyStyles = (hoveredId: number) => {
    const hoverStyles = {outlineColor: (theme: Theme) => theme.palette.grey[600], outlineWidth: '.15rem', outlineStyle: 'solid', cursor: 'pointer'};
    if (hoveredCluster === hoveredId) {
      return {'&:hover': hoverStyles, ...hoverStyles, padding: '.8rem .7rem', boxShadow: '0px 0px 10px rgba(0,0,0,0.1)'}
    }
    return {'&:hover': hoverStyles, padding: '.8rem .7rem', boxShadow: '0px 0px 10px rgba(0,0,0,0.1)'}
  }

  const handleClusterHover = (id: number) => {
    dispatch(setHoveredCluster(id));
  }

  return (
    <Grid sx={{p: '1rem', display: 'grid', gridTemplateColumns: {sm: '1fr', lg: '1fr 1fr'}, gap: '1rem'}} spacing={2}>
      {clusters && clusters.map(r => (
        <Paper variant="outlined" key={r.id} onClick={() => handleClusterHover(r.id)} sx={applyStyles(r.id)}>
          <Grid container alignItems='center' justifyContent='space-between'>
            <Typography component="h6" variant="h6">{r.summary}</Typography>
            <Tooltip title={`There are ${r.elementCount} elements in this cluster`}>
              <Typography component="h5" variant="h6" sx={{background: theme => theme.palette.grey[600], color: 'white', borderRadius: '.5rem', boxShadow: '2px 2px 10px rgba(0, 0, 0, 0.2)', width: 'max-content', padding: '.1rem .5rem', marginBlockEnd: '1rem'}}>{r.elementCount}</Typography>
            </Tooltip>
          </Grid>
          <Typography>{r.representativeTitle}</Typography>
        </Paper>
      ))}
    </Grid>
  )
}

export default ClusteredGrid
