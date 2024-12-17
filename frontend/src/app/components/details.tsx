import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Chip, Dialog, DialogContent, DialogTitle, Grid2, IconButton, Link, List, ListItem, ListItemIcon, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import LinkIcon from '@mui/icons-material/Link';
import L from 'leaflet';

import { RecordDetails } from "../../types";
import { fetchRecordById } from "../../services/recordsApi";
import { HttpError } from "../../services/api";
import { CircleMarker, FeatureGroup, MapContainer, Polygon, TileLayer } from "react-leaflet";
import { LatLngExpression } from "leaflet";

const Details = ({recordId, open}: {recordId: string, open: boolean}) => {

  const [recordDetails, setRecordDetails] = useState<RecordDetails|null>(null);
  const [polygon, setPolygon] = useState<LatLngExpression[][]>([]);
  const [markers, setMarkers] = useState<LatLngExpression[]>([]);
  const mapRef = useRef<L.Map>(null);
  const navigateTo = useNavigate();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('lg'));
  const maxWidth = useMediaQuery(theme.breakpoints.down('xl')) ? 'md' : 'lg';

  const fetchData = useCallback(async (recordId: string) => {
    try {
      const response = await fetchRecordById(recordId);
      setRecordDetails(response.data);
    } catch (e) {
      if (e instanceof HttpError) {
        if (e.statusCode === 404) {
          navigateTo('/404');
        }
      }
    }
  }, [navigateTo]);

  const handleClose = () => {
    navigateTo('/');
  }

  const fgCallback = (layer: L.FeatureGroup) => {
    if (!layer) return;
    const bounds = layer.getBounds();
    if (mapRef.current && Object.keys(bounds).includes('_northEast')) {
      mapRef.current.fitBounds(bounds);
    }
  }

  useEffect(() => {
    fetchData(recordId);
  }, [recordId, fetchData]);

  useEffect(() => {
    let multiPolygon: LatLngExpression[][] = [];
    let multiMarker: LatLngExpression[] = [];
    if (recordDetails) {
      multiPolygon = recordDetails.where
        .filter((p) => p.north !== p.south && p.east !== p.west)
        .map((p) => ([
          [p.north, p.west],
          [p.north, p.east],
          [p.south, p.east],
          [p.south, p.west],
        ])
      );
      multiMarker = recordDetails.where
        .filter((p) => p.north === p.south && p.east === p.west)
        .map((p) => (
          [p.north, p.west]
        ));
    }
    setPolygon(multiPolygon);
    setMarkers(multiMarker);
  }, [recordDetails]);

  if (!recordDetails)
    return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth={maxWidth} fullScreen={fullScreen}>
      <DialogTitle sx={{backgroundColor: 'rgba(255,236,190,0.2)', display: 'flex', justifyContent: 'space-between', pr: 8}}>
        <Typography component="span" sx={{fontWeight: 600}}>Resource details</Typography>
        <Typography component={Link} underline="hover" target="_blank" href={`/api/records/raw?id=${recordId}`}>Raw metadata</Typography>
      </DialogTitle>
      <IconButton
        aria-label="close"
        onClick={handleClose}
        sx={(theme) => ({
          position: 'absolute',
          right: 8,
          top: 8,
          color: theme.palette.grey[500],
        })}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent dividers>
        <Typography gutterBottom sx={{fontWeight: 600}}>{recordDetails.title}</Typography>
        <Typography variant="body2" gutterBottom sx={{opacity: 0.6}}>Organization: <Typography component="span" sx={{fontWeight: 100}}>{recordDetails.source.title}</Typography></Typography>
        <Typography variant="body2" gutterBottom sx={{opacity: 0.6}}>
          License: <Typography component="span" variant="body2" sx={{fontWeight: 100}}>{recordDetails.rights}</Typography>
          { !recordDetails.rights && ' —'}
        </Typography>
        <Typography component="div" variant="body2" gutterBottom sx={{opacity: 0.6}}>
          Topic(s):
          { recordDetails.topic?.map((topic, index) => (
            <Chip key={`topic_${recordId}_${index}`} label={topic} sx={{ml: 1}} size="small" />
          ))}
          { !recordDetails.topic && ' —'}
        </Typography>
        <Typography gutterBottom variant="body2">{recordDetails.description}</Typography>
        <Typography sx={{fontWeight: 600}}>Keywords</Typography>
        { recordDetails.keyword?.filter((k: string | null) => k !== null).map((k: string, idx: number) => (
          <Chip key={`keyword_${recordId}_${idx}`} label={k} sx={{mr: 1, mb: 1}} />
        ))}
        <Typography sx={{fontWeight: 600}}>Extent</Typography>
        <Grid2 container sx={{mb: 1}}>
          <Grid2 size={6}>
            <Typography sx={{fontWeight: 100, opacity: 0.6}}>Spatial Rectangle</Typography>
            { recordDetails.where.map((extent, index) => (
              <Tooltip key={`where_${recordId}_${index}`} title={`(${Object.keys(extent).join(', ')})`} placement="top-start">
                <Typography variant="body2">
                  ({Object.values(extent).map((coord) => (Math.round(coord * 100) / 100).toFixed(2) + '°').join(', ')})
                </Typography>
              </Tooltip>
            ))}
          </Grid2>
          <Grid2 size={6}>
            <Typography sx={{fontWeight: 100, opacity: 0.6}}>Temporal Range</Typography>
            { recordDetails.when?.map((extent, index) => (
              <Typography variant="body2" key={`when_${recordId}_${index}`}>
                {extent.from || '—'}{' to '}{extent.to || '—'}
              </Typography>
            ))}
            { !recordDetails.when && "—"}
          </Grid2>
        </Grid2>
        <MapContainer
          ref={mapRef}
          center={[47, 10]}
          zoom={5}
          scrollWheelZoom={true}
          style={{height: '400px', marginBottom: '2em'}}
          minZoom={2}
          maxZoom={17}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='OpenStreetMap contributors'
          />
          <FeatureGroup ref={fgCallback}>
            <Polygon positions={polygon} />
            { markers.map((m: LatLngExpression, index: number) => (
              <CircleMarker key={`marker_${recordId}_${index}`} center={m} radius={10}/>
            ))}
          </FeatureGroup>
        </MapContainer>
        <Typography sx={{fontWeight: 600}}>Online Resource(s)</Typography>
        <List>
          { recordDetails.online?.map(({name, description, url}, index) => (
            <ListItem key={`online_${recordId}_${index}`}>
              <ListItemIcon><LinkIcon/></ListItemIcon>
              <Typography variant="body2" component={Link} underline="hover" target="_blank" href={url}>
                {name || description || url}
              </Typography>
            </ListItem>
          ))}
        </List>
        { (!recordDetails.online || recordDetails.online.length === 0) && (
          <Typography gutterBottom>—</Typography>
        )}
      </DialogContent>
    </Dialog>
  );

}

export default Details;
