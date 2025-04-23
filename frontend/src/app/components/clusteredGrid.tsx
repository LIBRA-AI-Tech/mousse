import { Paper, Tooltip, Typography } from "@mui/material"
import { Grid } from "@mui/system"
import { RootState, useAppDispatch } from "../store"
import { useSelector } from "react-redux"
import { setHoveredCluster } from "../../features/clusters/clusteredSlice"

const ClusteredGrid = () => {
  const dispatch = useAppDispatch();
  const { clusters } = useSelector((state: RootState) => state.clustered);

  const handleClusterHover = (id: number) => {
    dispatch(setHoveredCluster(id));
  }

  return (
    <Grid sx={{p: '1rem', display: 'grid', gridTemplateColumns: {sm: '1fr', lg: '1fr 1fr'}, gap: '1rem'}} spacing={2}>
      {clusters && clusters.map(r => (
        <Paper variant="outlined" key={r.id} sx={{padding: '.8rem .7rem', boxShadow: '0px 0px 10px rgba(0,0,0,0.1)'}}>
          <Grid container alignItems='center' justifyContent='space-between'>
            <Typography component="h6" variant="h6" onClick={() => handleClusterHover(r.id)} sx={{"&:hover": {textDecoration: 'underline', textDecorationStyle: 'wavy', textDecorationColor: theme => theme.palette.grey[600], cursor: 'pointer'}}}>{r.summary}</Typography>
            <Tooltip title={`There are ${r.elementCount} elements in this cluster`}>
              <Typography component="h5" variant="h6" sx={{background: theme => theme.palette.grey[600], color: 'white', borderRadius: '.5rem', boxShadow: '2px 2px 10px rgba(0, 0, 0, 0.2)', width: 'max-content', padding: '.1rem .5rem', marginBlockEnd: '1rem'}}>{r.elementCount}</Typography>
            </Tooltip>
          </Grid>
          <Typography>{r.representativeTitle}</Typography>
          <Typography sx={{width: '35ch'}}></Typography>
        </Paper>
      ))}
    </Grid>
  )
}

export default ClusteredGrid
