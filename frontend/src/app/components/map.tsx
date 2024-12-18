import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { MapContainer, TileLayer, FeatureGroup, ZoomControl, GeoJSON } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { Feature } from 'geojson';
import * as L from 'leaflet';

import { RootState, useAppDispatch } from '../store';
import { setHoveredFeature } from '../../features/map/mapSlice';
import { addLayer, editLayer, deleteLayer } from '../../features/search/searchSlice';

import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

const fillColor = "#ffd672";

function Map() {

  const dispatch = useAppDispatch();
  const { data } = useSelector((state: RootState) => state.search.records);
  const { status } = useSelector((state: RootState) => state.search);
  const { hoveredFeature } = useSelector((state: RootState) => state.map);
  const { isDrawOnMapActive } = useSelector((state: RootState) => state.ui);
  const [shouldMapFocus, setShouldMapFocus] = useState(false);
  const mapRef = useRef<L.Map>(null);

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

  const geojsonCallback = (f: L.GeoJSON) => {
    if (!f)
      return;
    if (mapRef.current && shouldMapFocus) {
      mapRef.current.fitBounds(f.getBounds());
      setShouldMapFocus(false);
    }
    f.eachLayer((layer: L.Layer) => {
      const geoJsonLayer = layer as L.GeoJSON;
      const feature = geoJsonLayer.feature as GeoJSON.Feature;
      const actualFillColor = feature?.id === hoveredFeature ? 'red' : fillColor;
      const pathLayer = layer as L.Path;
      pathLayer.setStyle({fillColor: actualFillColor});
      if (hoveredFeature && feature?.id === hoveredFeature) {
        mapRef.current?.setView(L.geoJSON(feature).getBounds().getCenter());
      }
    });
  }

  const handleLayerCreate = ({layer}: L.DrawEvents.Created) => {
    const id = (layer as typeof layer & {_leaflet_id: number})._leaflet_id;
    dispatch(addLayer({id, ...layer.toGeoJSON()}));
  }

  const handleLayerEdit = ({layers}: L.DrawEvents.Edited) => {
    layers.eachLayer((layer) => {
      if (layer instanceof L.Polygon || layer instanceof L.Marker) {
        const id = (layer as typeof layer & {_leaflet_id: number})._leaflet_id;
        if (id) {
          dispatch(editLayer({id, ...layer.toGeoJSON()}));
        }
      }
    });
  }

  const handleLayerDelete = ({layers}: L.DrawEvents.Deleted) => {
    layers.eachLayer((layer) => {
      const id = (layer as typeof layer & {_leaflet_id: number})._leaflet_id;
      if (id) {
        dispatch(deleteLayer(id));
      }
    })
  }

  useEffect(() => {
    if (status === 'succeeded') {
      setShouldMapFocus(true);
    }
  }, [status]);

  return (
    <MapContainer
      ref={mapRef}
      center={[47, 10]}
      zoom={5}
      zoomControl={false}
      scrollWheelZoom={true}
      style={{height: 'calc(100vh - 100px)'}}
      minZoom={3}
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
      { (status === 'succeeded' && data && data.features.length > 0) &&
        <FeatureGroup>
          <GeoJSON
            ref={geojsonCallback}
            data={data}
            pointToLayer={setIcon}
            style={{fillOpacity: 0.4, color: "grey", weight: 1}}
            onEachFeature={(f: Feature, layer: L.Path) => {
              layer.on('click', () => dispatch(setHoveredFeature(f.id || null)));
            }}
          />
        </FeatureGroup>
      }
    </MapContainer>
  );
}

export default Map;
