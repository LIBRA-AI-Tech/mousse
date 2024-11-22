import { useSelector } from 'react-redux';
import { MapContainer, TileLayer, FeatureGroup, ZoomControl, GeoJSON } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { Feature } from 'geojson';
import L from 'leaflet';
import type { DrawEvents } from 'leaflet';

import { RootState, useAppDispatch } from '../store';
import { setHoveredFeature, addLayer, editLayer, deleteLayer } from '../../features/map/mapSlice';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

const fillColor = "#ffd672";

function Map() {

  const dispatch = useAppDispatch();
  const { results } = useSelector((state: RootState) => state.search);
  const { hoveredFeature } = useSelector((state: RootState) => state.map);
  const { isDrawOnMapActive } = useSelector((state: RootState) => state.ui);
  let activeTimeoutId: number|null = null;

  const geojsonMarkerOptions = {
    radius: 8,
    color: "#000",
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  };

  const setIcon = (_feature: Feature, latlng: L.LatLng) => {
    return L.circleMarker(latlng, {...geojsonMarkerOptions, fillColor: 'red'});
  };

  const handleMouseOver = (id: string|number|undefined) => {
    if (!id) return;
    activeTimeoutId = setTimeout(() => {
      dispatch(setHoveredFeature(id));
    }, 500);
  }

  const handleMouseOut = () => {
    if (activeTimeoutId) {
      clearTimeout(activeTimeoutId);
      activeTimeoutId = null;
    }
  }

  const geojsonCallback = (f: L.GeoJSON) => {
    if (!f)
      return;
    f.eachLayer((layer: L.Layer) => {
      const geoJsonLayer = layer as L.GeoJSON;
      const feature = geoJsonLayer.feature as GeoJSON.Feature;
      const actualFillColor = feature?.id === hoveredFeature ? 'red' : fillColor;
      const pathLayer = layer as L.Path;
      pathLayer.setStyle({fillColor: actualFillColor});
    });
  }

  const handleLayerCreate = ({layer}: DrawEvents.Created) => {
    const id = layer._leaflet_id;
    dispatch(addLayer({id, ...layer.toGeoJSON()}));
  }

  const handleLayerEdit = ({layers}: DrawEvents.Edited) => {
    layers.eachLayer((layer: L.Layer) => {
      const id = layer._leaflet_id;
      if (id) {
        dispatch(editLayer({id, ...layer.toGeoJSON()}));
      }
    });
  }

  const handleLayerDelete = ({layers}: DrawEvents.Deleted) => {
    layers.eachLayer((layer: L.Layer) => {
      const id = layer._leaflet_id;
      if (id) {
        dispatch(deleteLayer(id));
      }
    })
  }

  return (
    <MapContainer
      center={[47, 10]}
      zoom={5}
      zoomControl={false}
      scrollWheelZoom={true}
      style={{height: 'calc(100vh - 100px)'}}
    >
      <ZoomControl position="topright" />
      <TileLayer
        attribution='&copy; 2024 <a target="_blank" href="https://libramli.ai">Libra Technologies</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      { isDrawOnMapActive &&
        <FeatureGroup>
          <EditControl
            position="topright"
            draw={{
              circle: false,
              polyline: false,
              marker: false,
              circlemarker: false,
              rectangle: false,
            }}
            onCreated={handleLayerCreate}
            onEdited={handleLayerEdit}
            onDeleted={handleLayerDelete}
          />
        </FeatureGroup>
      }
      { results &&
        <FeatureGroup>
          <GeoJSON
            ref={geojsonCallback}
            data={results}
            pointToLayer={setIcon}
            style={{fillOpacity: 0.4, color: "grey", weight: 1}}
            onEachFeature={(f: Feature, layer: L.Path) => {
              // if (!hoveredFeature || !f.id) return;
              layer.on('mouseover', () => handleMouseOver(f.id));
              layer.on('mouseout', () => handleMouseOut());
              layer.on('click', () => () => dispatch(setHoveredFeature(f.id || null)));
            }}
          />
        </FeatureGroup>
      }
    </MapContainer>
  );
}

export default Map;
