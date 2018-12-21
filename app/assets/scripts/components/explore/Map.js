import React from 'react';
import { render } from 'react-dom';
import mapboxgl from 'mapbox-gl';
import bbox from '@turf/bbox';
import { PropTypes as T } from 'prop-types';

import MapPopover from './connected/MapPopover';
import { mapboxAccessToken, environment, techLayers } from '../../config';

mapboxgl.accessToken = mapboxAccessToken;

const sourceId = 'gep-vt';
const sourceLayer = 'mw';

// Adds layers for points
const buildLayersForSource = (sourceId, sourceLayer) => [
  {
    id: `${sourceId}-line`,
    type: 'line',
    source: sourceId,
    'source-layer': sourceLayer,
    filter: ['==', '$type', 'LineString'],
    layout: {
      visibility: 'none'
    },
    paint: {
      'line-color': 'red'
    }
  },
  {
    id: `${sourceId}-polygon`,
    type: 'fill',
    source: sourceId,
    'source-layer': sourceLayer,
    filter: ['==', '$type', 'Polygon'],
    layout: {
      visibility: 'none'
    },
    paint: {
      'fill-color': 'blue'
    }
  },
  {
    id: `${sourceId}-point`,
    type: 'circle',
    source: sourceId,
    'source-layer': sourceLayer,
    filter: ['==', '$type', 'Point'],
    paint: {
      'circle-color': 'purple'
    }
  }
];

class Map extends React.Component {
  constructor (props) {
    super(props);

    this.updateScenario = this.updateScenario.bind(this);
    this.clearMap = this.clearMap.bind(this);
    this.zoomToFeatures = this.zoomToFeatures.bind(this);
    this.state = {
      mapLoaded: false
    };
  }

  componentDidMount () {
    this.initMap();
  }

  componentDidUpdate (prevProps) {
    const { scenario } = this.props;
    if (this.state.mapLoaded) {
      if (scenario.fetching && !prevProps.scenario.fetching) {
        this.clearMap();
      }
      if (scenario.fetched && !prevProps.scenario.fetched) {
        this.updateScenario();
      }
    }

    // Quick and dirty diffing.
    const prevLState = prevProps.layersState.join('');
    const lState = this.props.layersState.join('');
    if (prevLState !== lState) {
      this.toggleExternalLayers();
    }
  }

  componentWillUnmount () {
    if (this.map) {
      this.map.remove();
    }
  }

  initMap () {
    if (!mapboxgl.supported()) {
      return;
    }

    this.map = new mapboxgl.Map({
      container: this.refs.mapEl,
      style: 'mapbox://styles/devseed/cjpbi9n1811yd2snwl9ezys5p',
      bounds: [[32.34375, -9.145486056167277], [36.2109375, -17.35063837604883]]
    });

    // Disable map rotation using right click + drag.
    this.map.dragRotate.disable();

    // Disable map rotation using touch rotation gesture.
    this.map.touchZoomRotate.disableRotation();

    // Add zoom controls.
    this.map.addControl(new mapboxgl.NavigationControl(), 'bottom-left');

    // Remove compass.
    document.querySelector('.mapboxgl-ctrl .mapboxgl-ctrl-compass').remove();

    this.map.on('load', () => {
      this.setState({ mapLoaded: true });

      const mapLayersIds = techLayers.map(l => l.id);

      // Add external layers.
      // Layers come from the model. Each layer object must have:
      // id:            Id of the layer
      // label:         Label for display
      // type:          (vector|raster)
      // url:           Url to a tilejson or mapbox://. Use interchangeably with tiles
      // tiles:         Array of tile url. Use interchangeably with url
      // vectorLayers:  Array of source layers to show. Only in case of type vector
      this.props.externalLayers.forEach(layer => {
        if (layer.type === 'vector') {
          if (!layer.vectorLayers || !layer.vectorLayers.length) {
            // eslint-disable-next-line no-console
            return console.warn(
              `Layer [${layer.label}] has missing (vectorLayers) property.`
            );
          }
          if ((!layer.tiles || !layer.tiles.length) && !layer.url) {
            // eslint-disable-next-line no-console
            return console.warn(
              `Layer [${layer.label}] must have (url) or (tiles) property.`
            );
          }

          const sourceId = `ext-${layer.id}`;
          let options = { type: 'vector' };

          if (layer.tiles) {
            options.tiles = layer.tiles;
          } else if (layer.url) {
            options.url = layer.url;
          }

          this.map.addSource(sourceId, options);
          layer.vectorLayers.forEach(vt => {
            buildLayersForSource(sourceId, vt).forEach(l => {
              this.map.addLayer(l);
            });
          });

          // Raster layer type.
        } else if (layer.type === 'raster') {
          if (!layer.tiles || !layer.tiles.length) {
            // eslint-disable-next-line no-console
            return console.warn(
              `Layer [${layer.label}] must have (tiles) property.`
            );
          }
          const sourceId = `ext-${layer.id}`;
          this.map.addSource(sourceId, {
            type: 'raster',
            tiles: layer.tiles
          });
          this.map.addLayer({
            id: `${sourceId}-tiles`,
            type: 'raster',
            source: sourceId
          });
        } else {
          // eslint-disable-next-line no-console
          console.warn(
            `Layer [${
              layer.label
            }] has unsupported type [layer.type] and won't be added.`
          );
        }
      });

      this.toggleExternalLayers();

      this.map.addSource(sourceId, {
        type: 'vector',
        url: 'mapbox://devseed.2a5bvzlz'
      });

      // Init cluster polygon layers
      for (const layer of techLayers) {
        this.map.addLayer({
          id: layer.id,
          type: 'fill',
          source: sourceId,
          'source-layer': sourceLayer,
          filter: ['==', 'id_int', 'nothing'],
          paint: {
            'fill-color': layer.color
          }
        });
      }

      /**
       * Hover outline layer
       */
      this.map.addLayer({
        id: 'hovered-outline',
        type: 'line',
        source: sourceId,
        'source-layer': sourceLayer,
        filter: ['==', 'id_int', 'nothing'],
        paint: {
          'line-color': 'blue'
        }
      });

      /**
       * Hover fill layer
       */
      this.map.addLayer({
        id: 'hovered-fill',
        type: 'fill',
        source: sourceId,
        'source-layer': sourceLayer,
        filter: ['==', 'id_int', 'nothing'],
        paint: {
          'fill-color': 'red'
        }
      });

      /**
       * Selected feature layer
       */
      this.map.addLayer({
        id: 'selected',
        type: 'fill',
        source: sourceId,
        'source-layer': sourceLayer,
        filter: ['==', 'id_int', 'nothing'],
        paint: {
          'fill-color': 'red'
        }
      });

      this.map.on('mousemove', e => {
        const features = this.map.queryRenderedFeatures(e.point, {
          layers: mapLayersIds
        });

        if (features.length > 0) {
          this.map.getCanvas().style.cursor = 'pointer';

          const featureId = features[0].properties.id_int;
          this.map.setFilter('hovered-fill', ['==', 'id_int'].concat(featureId));
          this.map.setFilter('hovered-outline', ['==', 'id_int'].concat(featureId));
        } else {
          this.map.getCanvas().style.cursor = '';
        }
      });

      this.map.on('mouseleave', 'hovered-fill', () => {
        this.map.setFilter('hovered-fill', ['==', 'id_int', 'nothing']);
        this.map.setFilter('hovered-outline', ['==', 'id_int', 'nothing']);
      });

      this.map.on('click', e => {
        const features = this.map.queryRenderedFeatures(e.point, {
          layers: mapLayersIds
        });
        if (features.length) {
          this.showPopover(features[0], e.lngLat);
        }
      });

      const onSourceData = e => {
        if (e.sourceId === 'gep-vt' && e.isSourceLoaded && e.tile) {
          this.map.off('sourcedata', onSourceData);
          this.updateScenario();
        }
      };

      this.map.on('sourcedata', onSourceData);
    });
  }

  toggleExternalLayers () {
    if (!this.state.mapLoaded) return;

    const { externalLayers, layersState } = this.props;

    externalLayers.forEach((layer, lIdx) => {
      if (layer.type === 'vector') {
        const layers = [
          `ext-${layer.id}-line`,
          `ext-${layer.id}-polygon`,
          `ext-${layer.id}-point`
        ];
        const visibility = layersState[lIdx] ? 'visible' : 'none';
        layers.forEach(l =>
          this.map.setLayoutProperty(l, 'visibility', visibility)
        );
      } else if (layer.type === 'raster') {
        const visibility = layersState[lIdx] ? 'visible' : 'none';
        this.map.setLayoutProperty(
          `ext-${layer.id}-tiles`,
          'visibility',
          visibility
        );
      }
    });
  }

  zoomToFeatures (featuresIds) {
    const features = this.map.querySourceFeatures(sourceId, {
      sourceLayer,
      filter: ['in', 'id_int'].concat(featuresIds)
    });

    if (features.length > 0) {
      const mapBbox = bbox({
        type: 'FeatureCollection',
        features
      });
      this.map.fitBounds(mapBbox, { padding: 20 });
    }
  }

  clearMap () {
    for (const layer of techLayers) {
      this.map.setFilter(layer.id, ['==', 'id_int', 'nothing']);
    }
  }

  updateScenario () {
    const { fetched, getData } = this.props.scenario;

    this.clearMap();

    if (fetched) {
      const data = getData();
      const { layers } = data;
      const layerIds = Object.keys(layers);

      let featuresIds = [];
      for (const layerId of layerIds) {
        // Accumulate feature ids to perform map zoom
        featuresIds = featuresIds.concat(layers[layerId]);

        // Apply style to features on this layer
        this.map.setFilter(layerId, ['in', 'id_int'].concat(layers[layerId]));
      }
      this.zoomToFeatures(featuresIds);
    }
  }

  showPopover (feature, lngLat) {
    let popoverContent = document.createElement('div');

    const fid = feature.properties.id_int;
    const sid = this.props.scenario.getData().id;

    render(
      <MapPopover
        featureId={fid}
        scenarioId={sid}
        onCloseClick={e => {
          e.preventDefault();
          this.popover.remove();
        }}
      />,
      popoverContent
    );

    if (this.popover != null) {
      this.popover.remove();
    }

    // Populate the popup and set its coordinates
    // based on the feature found.
    this.popover = new mapboxgl.Popup({ closeButton: false, offset: 10 })
      .setLngLat(lngLat)
      .setDOMContent(popoverContent)
      .once('open', e => {
        this.map.setFilter('selected', ['in', 'id_int'].concat(fid));
      })
      .once('close', e => {
        this.map.setFilter('selected', ['in', 'id_int', 'nothing']);
      })
      .addTo(this.map);
  }

  render () {
    return (
      <section className='exp-map'>
        <h1 className='exp-map__title'>Map</h1>
        {mapboxgl.supported() ? (
          <div ref='mapEl' style={{ width: '100%', height: '100%' }} />
        ) : (
          <div className='mapbox-no-webgl'>
            <p>WebGL is not supported or disabled.</p>
          </div>
        )}
      </section>
    );
  }
}

if (environment !== 'production') {
  Map.propTypes = {
    scenario: T.object,
    externalLayers: T.array,
    layersState: T.array
  };
}

export default Map;
