import { useRef, useEffect } from 'react'
import Head from 'next/head'
import styles from '../styles/Map.module.css'
import type { NextPage } from 'next';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import 'mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { boundingBox, randomIntFromInterval } from '../utils/utils.js'
import MapboxGeocoder from 'mapbox-gl-geocoder'
import * as turf from '@turf/turf';
import MarketData from '../utils/geoJSON_market_data.json'

const Map : NextPage = () => {
  const mapContainer = useRef<any>(null);
  const map = useRef<mapboxgl.Map | any>(null);

  useEffect(() => {
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN;
    // Initialize Map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [ -104.991531, 39.742043], // center map on Denver
      zoom: 12,
      pitch: 55,
      bearing: 25,
      attributionControl: false
    })

    // Add zoom buttons & compass
    const nav = new mapboxgl.NavigationControl();
    map.current.addControl(nav, 'top-right');
    // Add the control to the map.
    map.current.addControl(
      new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        placeholder: "Search new city"
      }),
      'top-left'
    );

    // Initialize hexGrid
    var bbox = boundingBox(-104.991531, 39.742043, 6)
    const cellSide = 0.25;
    const options = {};
    const hexGrid = turf.hexGrid(bbox, cellSide, options);
    // console.log(hexGrid)
    hexGrid.features.forEach(f => {
      f.properties = { 
        density: Math.random(), 
        height: randomIntFromInterval(1, 1300) 
      };  
    });

    map.current.on('load', () => {
      // Create a hex grid
      map.current.addLayer({
        'id': 'hexGrid',
        'type': 'fill',
        'source': {
            'type': 'geojson',
            'data': hexGrid
        },
        'layout': {},
        'paint': {
            'fill-color': '#088',
            'fill-opacity': [
              "interpolate", ["linear"], ["get", "density"],
              0, 0.3,
              1, 1
            ],
        }
      });

      // Plot geoJSON points from market_data
      map.current.addLayer({
        'id': 'market-data-layer',
        'type': 'circle',
        'source': {
            'type': 'geojson',
            'data': MarketData
        },
        'layout': {},
        'paint': {
          'circle-radius': 4,
          'circle-stroke-width': 2,
          'circle-color': 'red',
          'circle-stroke-color': 'white'
        }
      });
        
    // Give height to hex grid
    map.current.addLayer({
        'id': 'grid-extrusion',
        'type': 'fill-extrusion',
        'source': {
          'type': 'geojson',
          'data': hexGrid
        },
        'layout': {},
        'paint' : {
          // Get the `fill-extrusion-color` from the source `color` property.
          'fill-extrusion-color': 'hsl(78, 51%, 73%)',
          // Get `fill-extrusion-height` from the source `height` property.
          'fill-extrusion-height': [
            "interpolate", ["linear"], ["get", "height"],
            // height is 500 (or less) -> extrusion-height will be 500px
            500, 500,
            // height is 501 (or greater) -> extrusion-height will be 1300px
            501, 1300
          ],
          // Get `fill-extrusion-base` from the source `base_height` property.
          'fill-extrusion-base': 1,
          // Make extrusions slightly opaque to see through indoor walls.
          'fill-extrusion-opacity': 0.5
        }
      })
      // Create a popup, but don't add it to the map yet.
      const popup = new mapboxgl.Popup({
        "text-size": 24,
      
        closeButton: false,
        closeOnClick: false
      });
      map.current.on('mouseenter', 'market-data-layer', (e) => {
        // Change the cursor style as a UI indicator.
        map.current.getCanvas().style.cursor = 'pointer';
        
        // Copy coordinates array.
        const coordinates = e.features[0].geometry.coordinates.slice();
        const description = e.features[0].properties.CountyName;
        
        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        console.log(coordinates)
        
        // Populate the popup and set its coordinates
        // based on the feature found.
        popup.setLngLat(coordinates)
        .setHTML(`<h1>Hello World from ${description}!</h1>`)
        .addTo(map.current);
      });
        
        map.current.on('mouseleave', 'market-data-layer', () => {
          map.current.getCanvas().style.cursor = '';
          popup.remove();
        });
    });

  }, [])

  return (
    <main className={styles["container"]}>
      <div className={styles["menu-container"]}>
        <h1 className={styles["title"]}>Rent Prices in Denver</h1>
        <p className={styles["description"]}>
          {`What parts of Denver have the highest rent prices? Data source: `}
          <a href='https://www.zillow.com/research/data/' target='blank' rel='norefferer'>{`Zillow`}</a>
        </p>
      </div>
      <div className={styles["map-container"]} ref={mapContainer}/>
      <div className={styles["help"]}>Right click and drag to rotate</div>
    </main>
  )
}

export default Map