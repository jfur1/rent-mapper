import { useRef, useEffect, useState } from 'react'
import Head from 'next/head'
import styles from '../styles/Map.module.scss'
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { 
  boundingBox, 
  randomIntFromInterval, 
  generateRandomSessionToken, 
  jsonToGeoJson,
  geoJsonToPoints,
  categorizeBusinesses
 } from '../utils/utils.js'
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'
import * as turf from '@turf/turf';
import LoadingSpinner from '../components/Loading'
import { BsInfoCircle, BsThreeDots } from 'react-icons/bs'
import { FaBeer } from "react-icons/fa";
import { GiCupcake } from "react-icons/gi";
import { MdRoomService, MdFastfood } from "react-icons/md";

const Map = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const INIT_X = -104.991531
  const INIT_Y = 39.742043
  let sessionToken = generateRandomSessionToken();
  const geoJsonStructure = {
    'type': 'FeatureCollection',
    "features": []
  }
  const [selectedTab, setSelectedTab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [zoomed, setZoomed] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [businesses, setBusinesses] = useState(geoJsonStructure);
  const [businesses2, setBusinesses2] = useState(geoJsonStructure);
  const [businesses3, setBusinesses3] = useState(geoJsonStructure);
  const [businesses4, setBusinesses4] = useState(geoJsonStructure);
  const [allBusinesses, setAllBusinesses] = useState(geoJsonStructure);
  const [center, setCenter] = useState([INIT_X, INIT_Y]);
  const [place, setPlace] = useState("Denver, Colorado");
  const [maxCounts, setMaxCounts] = useState(null);
  const [moreInfoToggle, setMoreInfoToggle] = useState(false);
  
  const getData = async() => {
    try {
      console.log(`%c Fetching data for center: ${center}... `, 'background: #111; color: #bada55')
      var searchParams = {
        query: 'food',
        ll: center[1]+','+center[0],
        radius: 11000,
        min_price:1,
        max_price:1,
        session_token: sessionToken.toString(),
        limit: 50
      }
      var searchParams2 = {...searchParams, min_price:2, max_price:2}
      var searchParams3 = {...searchParams, min_price:3, max_price:3}
      var searchParams4 = {...searchParams, min_price:4, max_price:4}
      // Formatting
      searchParams = new URLSearchParams(searchParams).toString()
      searchParams2  = new URLSearchParams(searchParams2).toString()
      searchParams3  = new URLSearchParams(searchParams3).toString()
      searchParams4  = new URLSearchParams(searchParams4).toString()

      const headers = new Headers({
        Accept: 'application/json',
        Authorization: process.env.NEXT_PUBLIC_FOURSQUARE_API_KEY,
      })

      const [res1, res2, res3, res4] = await Promise.all([
        fetch(`https://api.foursquare.com/v3/places/search?${searchParams}`, {
          method: 'get',
          headers
        }),
        fetch(`https://api.foursquare.com/v3/places/search?${searchParams2}`, {
          method: 'get',
          headers
        }),
        fetch(`https://api.foursquare.com/v3/places/search?${searchParams3}`, {
          method: 'get',
          headers
        }),
        fetch(`https://api.foursquare.com/v3/places/search?${searchParams4}`, {
          method: 'get',
          headers
        }),
      ])

      const [json1, json2, json3, json4] = await Promise.all([
        res1.json(), res2.json(), res3.json(), res4.json()
      ])

      const geo1 = jsonToGeoJson(json1.results, 1);
      const geo2 = jsonToGeoJson(json2.results, 2);
      const geo3 = jsonToGeoJson(json3.results, 3);
      const geo4 = jsonToGeoJson(json4.results, 4);

      setBusinesses(geo1)
      setBusinesses2(geo2)
      setBusinesses3(geo3)
      setBusinesses4(geo4)

      const geoTotal = {
        "type": "FeatureCollection",
        "features": [
          ...geo1.features,
          ...geo2.features,
          ...geo3.features,
          ...geo4.features
        ]
      }
      setAllBusinesses(geoTotal)

      // console.log('businesses', geo1)
      // console.log('businesses2', geo2)
      // console.log('businesses3', geo3)
      // console.log('businesses4', geo4)

      console.log(`API Returned ${geoTotal.features.length} total results`)
      console.log('%c Finished fetching data!\n', 'background: #111; color: #bada55')
      return;
    } catch (error) {
      throw error;
    }
  }

  // Before render -- Fetch Data --> set loading false
  useEffect(() => {
    const init = async() => {
      await getData();
      setLoading(false)
    }
    init();
  }, [])
  
  // Once data finished loading, show map
  useEffect(() => {
    console.log(`%c Finished loading data for center: ${center}... `, 'background: #111; color: #bada55')

    const show = async() => {
      await showMap();
    }
    if(loading)
      return

    else{
      show()
    }
  }, [loading])

  useEffect(() => {
    console.log(`%c Center updated: ${center}! Fetching updated data...`, 'background: #111; color: aliceblue')
    setSelectedTab(null)
    setZoomed(false);
    setLoading(true);
    setMoreInfoToggle(false);
    if(typeof(map.current) !=='undefined' && map.current !== null){
      map.current.remove();
    }

    const update = async() => {
      await getData();
      setLoading(false)
    }
    update();

    // showMap();

  }, [center])


  const showMap = async() => {
      // Initialize New Map
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [center[0], center[1]],
        zoom: 12.5,
        pitch: 45,
        bearing: 20,
        attributionControl: false
      })
      // Add zoom buttons & compass
      const nav = new mapboxgl.NavigationControl();
      map.current.addControl(nav, 'top-right');
        // Construct new geocoder
      var geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        placeholder: "Search new city"
      });
      // Listen for the `result` event from the Geocoder // `result` event is triggered when a user makes a selection
      //  Add a marker at the result's coordinates
      geocoder.on('result', ({ result }) => {
        console.log('geocoder result', result);
        setPlace(result.place_name)
        console.log('New Location! Setting center: ', result.center[0], result.center[1])
        setCenter([result.center[0], result.center[1]]);
      });
      // Add the geocodder control to the map.
      map.current.addControl( geocoder, 'top-left');
      

      // Initialize hexGrid
      var bbox = boundingBox(center[0], center[1], 4);
      const cellSide = 0.14;
      const options = {};
      const hexGrid = turf.hexGrid(bbox, cellSide, options);
      // console.log(hexGrid);
  
      // Keep track of max pointsWithinPolygon for density
      const turfPoints1 = geoJsonToPoints(businesses)
      const turfPoints2 = geoJsonToPoints(businesses2)
      const turfPoints3 = geoJsonToPoints(businesses3)
      const turfPoints4 = geoJsonToPoints(businesses4)

      const {
        turfPointsRestaurants,
        turfPointsBars,
        turfPointsFastFood,
        turfPointsDesserts,
        turfPointsOther,
      } = categorizeBusinesses(allBusinesses) 
      console.log('FINISHED CATEGORIZING:', turfPointsRestaurants)


      const turfRestaurants = geoJsonToPoints({
        "type": "FeatureCollection",
        "features": turfPointsRestaurants.points
      })
      const turfBars = geoJsonToPoints({
        "type": "FeatureCollection",
        "features": turfPointsBars.points
      })
      const turfFastFood = geoJsonToPoints({
        "type": "FeatureCollection",
        "features": turfPointsFastFood.points
      })
      const turfDesserts = geoJsonToPoints({
        "type": "FeatureCollection",
        "features": turfPointsDesserts.points
      })
      const turfOthers = geoJsonToPoints({
        "type": "FeatureCollection",
        "features": turfPointsOther.points
      })

      console.log(turfRestaurants)
      // const turfPointsRestaurants = turfRestaurants.points

      const turfPoints = {
        "type": "FeatureCollection",
        "features": [
          ...turfPoints1.features,
          ...turfPoints2.features,
          ...turfPoints3.features,
          ...turfPoints4.features,
        ]
      }
      // Counts for the maximum number of points found in any hexagon
      var max_total = 0, max_restaurants = 0, max_bars = 0, max_fast_food = 0, max_desserts = 0, max_other = 0
      // console.log(turfPoints)
      var restaurantBins = [], barsBins=[], fastFoodBins=[], dessertBins=[], otherBins=[]
      var nonEmptyHexBins = []
      // Get point data (if any) that resides within the current polygon
      hexGrid.features.forEach((f, idx) => {
        // Check for base case before any computation
        var pointsWithin = turf.pointsWithinPolygon(turfPoints, f)
        const nPointsWithin = pointsWithin.features.length;
        if(!nPointsWithin){
          // console.log('skipping')
          return;
        } else{
          var pointsWithin1 = turf.pointsWithinPolygon(turfPoints1, f)
          var pointsWithin2 = turf.pointsWithinPolygon(turfPoints2, f)
          var pointsWithin3 = turf.pointsWithinPolygon(turfPoints3, f)
          var pointsWithin4 = turf.pointsWithinPolygon(turfPoints4, f)
          var restaurantsWithinHex = turf.pointsWithinPolygon(turfRestaurants, f)
          var barsWithinHex = turf.pointsWithinPolygon(turfBars, f)
          var fastFoodWithinHex = turf.pointsWithinPolygon(turfFastFood, f)
          var dessertsWithinHex = turf.pointsWithinPolygon(turfDesserts, f)
          var otherWithinHex = turf.pointsWithinPolygon(turfOthers, f)
    
          const nPointsWithin = pointsWithin.features.length;
          const nPointsWithin1 = pointsWithin1.features.length;
          const nPointsWithin2 = pointsWithin2.features.length;
          const nPointsWithin3 = pointsWithin3.features.length;
          const nPointsWithin4 = pointsWithin4.features.length;

          const nRestaurantsWithinHex = restaurantsWithinHex.features.length;
          const nBarsWithinHex = barsWithinHex.features.length;
          const nFastFoodWithinHex = fastFoodWithinHex.features.length;
          const nDessertsWithinHex = dessertsWithinHex.features.length;
          const nOtherWithinHex = otherWithinHex.features.length;
    
          // console.log('Point Counts: ', nPointsWithin, nPointsWithin1, nPointsWithin2, nPointsWithin3, nPointsWithin4)

          if(nPointsWithin > 0)
            max_total = Math.max(nPointsWithin, max_total)
            max_restaurants = Math.max(nRestaurantsWithinHex, max_restaurants)
            max_bars = Math.max(nBarsWithinHex, max_bars)
            max_fast_food = Math.max(nFastFoodWithinHex, max_fast_food)
            max_desserts = Math.max(nDessertsWithinHex, max_desserts)
            max_other = Math.max(nOtherWithinHex, max_other)
            // console.log('N Points within Polyon:', nPointsWithin)
            var avgPriceWithinFeature = ((nPointsWithin1) + (2 * nPointsWithin2) + (3 * nPointsWithin3) + (4 * nPointsWithin4)) / nPointsWithin;
            avgPriceWithinFeature = parseFloat(parseFloat(avgPriceWithinFeature).toFixed(2))

            // Get color based on rgb(137, 245, 118) main color
            const r = (137 * (avgPriceWithinFeature * 25)) / 100
            const g = (245 * (avgPriceWithinFeature * 25)) / 100
            const b = (118 * (avgPriceWithinFeature * 25)) / 100
    
            // console.log(f.geometry.coordinates[0][0])
            f.id = idx;
            const center_x = (f.geometry.coordinates[0][0][0] + f.geometry.coordinates[0][3][0]) / 2
            const center_y =(f.geometry.coordinates[0][0][1] + f.geometry.coordinates[0][3][1]) / 2
            const FILTERED_SCALING_FACTOR = 1000.0

            f.properties = { 
              x: center_x,
              y: center_y,
              coordinates: f.geometry.coordinates,
              avgPriceWithinFeature: avgPriceWithinFeature, 
              nPointsWithin: nPointsWithin,
              // height: avgPriceWithinFeature * 900,
              height: Math.pow(nPointsWithin, 0.6) * FILTERED_SCALING_FACTOR,
              color: `rgb(${r}, ${g}, ${b})`,
              nRestaurantsWithinHex: nRestaurantsWithinHex,
              nBarsWithinHex: nBarsWithinHex, 
              nFastFoodWithinHex: nFastFoodWithinHex,
              nDessertsWithinHex: nDessertsWithinHex,
              nOtherWithinHex: nOtherWithinHex
            };
            nonEmptyHexBins.push(f)
            
            if(nRestaurantsWithinHex){
              f = {
                ...f,
                properties: {
                  ...f.properties,
                  height: Math.pow((2 * nRestaurantsWithinHex), 0.45) * FILTERED_SCALING_FACTOR
                }
              }
              restaurantBins.push(f)
            }
            if(nBarsWithinHex){
              f = {
                ...f,
                properties: {
                  ...f.properties,
                  height: Math.pow((2 * nBarsWithinHex), 0.4) * FILTERED_SCALING_FACTOR
                }
              }
              console.log("Update height before pushing bin:", f)
              barsBins.push(f)
            }
            if(nFastFoodWithinHex){
              f = {
                ...f,
                properties: {
                  ...f.properties,
                  height: Math.pow((2 * nFastFoodWithinHex), 0.4) * FILTERED_SCALING_FACTOR
                }
              }
              fastFoodBins.push(f)
            }
            if(nDessertsWithinHex){
              f = {
                ...f,
                properties: {
                  ...f.properties,
                  height: Math.pow((2 * nDessertsWithinHex), 0.4) * FILTERED_SCALING_FACTOR
                }
              }
              dessertBins.push(f)
            }
            if(nOtherWithinHex){
              f = {
                ...f,
                properties: {
                  ...f.properties,
                  height: Math.pow((2 * nOtherWithinHex), 0.4) * FILTERED_SCALING_FACTOR
                }
              }
              otherBins.push(f)
            }
          }
      });

      // console.log("max_restaurants:",max_restaurants)
      // console.log("max_fast_food:",max_fast_food)
      setMaxCounts({
        "max_restaurants" : turfRestaurants.features.length,
        "max_bars" : turfBars.features.length,
        "max_fast_food" : turfFastFood.features.length,
        "max_desserts" : turfDesserts.features.length,
        "max_other" : turfOthers.features.length 
      })
      
      // console.log("HEX BINS WITH NO DATA: ", emptyHexBins)
      // console.log("HEX BINS WITH WITH DATA: ", nonEmptyHexBins)
      
      map.current.on('load', async () => {  
        console.log(maxCounts)
        const { lng, lat } = map.current.getCenter();
        // Plot geoJSON points from market_data
        map.current.addLayer({
          'id': 'businesses-layer-1',
          'type': 'circle',
          'source': {
              'type': 'geojson',
              'data': businesses
          },
          'layout': {
            // Make the layer visible by default.
            'visibility': 'visible'
          },
          'paint': {
            'circle-radius': 4,
            'circle-stroke-width': 2,
            'circle-color': 'red',
            'circle-stroke-color': 'white',
            'circle-stroke-opacity': {
              stops: [[12.5, 0], [15, 1]]
            },
            'circle-opacity': {
              stops: [[12.5, 0], [15, 1]]
            }
          }
        });
        map.current.addLayer({
          'id': 'businesses-layer-2',
          'type': 'circle',
          'source': {
              'type': 'geojson',
              'data': businesses2
          },
          'layout': {
              // Make the layer visible by default.
              'visibility': 'visible'
          },
          'paint': {
            'circle-radius': 4,
            'circle-stroke-width': 2,
            'circle-color': 'blue',
            'circle-stroke-color': 'white',
            'circle-stroke-opacity': {
              stops: [[12.5, 0], [15, 1]]
            },
            'circle-opacity': {
              stops: [[12.5, 0], [15, 1]]
            }
          }
        });
        map.current.addLayer({
          'id': 'businesses-layer-3',
          'type': 'circle',
          'source': {
              'type': 'geojson',
              'data': businesses3
          },
          'layout': {
            // Make the layer visible by default.
            'visibility': 'visible'
          },
          'paint': {
            'circle-radius': 4,
            'circle-stroke-width': 2,
            'circle-color': 'green',
            'circle-stroke-color': 'white',
            'circle-stroke-opacity': {
              stops: [[12.5, 0], [15, 1]]
            },
            'circle-opacity': {
              stops: [[12.5, 0], [15, 1]]
            }
          }
        });
        map.current.addLayer({
            'id': 'businesses-layer-4',
            'type': 'circle',
            'source': {
                'type': 'geojson',
                'data': businesses4
            },
            'layout': {
              // Make the layer visible by default.
              'visibility': 'visible'
            },
            'paint': {
              'circle-radius': 4,
              'circle-stroke-width': 2,
              'circle-color': 'orange',
              'circle-stroke-color': 'white',
              'circle-stroke-opacity': {
                stops: [[12.5, 0], [15, 1]]
              },
              'circle-opacity': {
                stops: [[12.5, 0], [15, 1]]
              }
            }
        });
        map.current.addLayer({
          'id': 'businesses-layer-restaurants',
          'type': 'circle',
          'source': {
              'type': 'geojson',
              'data': {
                "type": "FeatureCollection",
                "features": turfPointsRestaurants.points
              }
          },
          'layout': {
            // Make the layer invisible by default.
            'visibility': 'none'
          },
          'paint': {
            'circle-radius': 4,
            'circle-stroke-width': 2,
            'circle-color': 'purple',
            'circle-stroke-color': 'white',
            'circle-stroke-opacity': {
              stops: [[12.5, 0], [15, 1]]
            },
            'circle-opacity': {
              stops: [[12.5, 0], [15, 1]]
            }
          }
        });
        map.current.addLayer({
          'id': 'businesses-layer-bars',
          'type': 'circle',
          'source': {
              'type': 'geojson',
              'data': {
                "type": "FeatureCollection",
                "features": turfPointsBars.points
              }
          },
          'layout': {
            // Make the layer invisible by default.
            'visibility': 'none'
          },
          'paint': {
            'circle-radius': 4,
            'circle-stroke-width': 2,
            'circle-color': 'purple',
            'circle-stroke-color': 'white',
            'circle-stroke-opacity': {
              stops: [[12.5, 0], [15, 1]]
            },
            'circle-opacity': {
              stops: [[12.5, 0], [15, 1]]
            }
          }
        });
        map.current.addLayer({
          'id': 'businesses-layer-fast-food',
          'type': 'circle',
          'source': {
              'type': 'geojson',
              'data':  {
                "type": "FeatureCollection",
                "features": turfPointsFastFood.points
              }
          },
          'layout': {
            // Make the layer invisible by default.
            'visibility': 'none'
          },
          'paint': {
            'circle-radius': 4,
            'circle-stroke-width': 2,
            'circle-color': 'purple',
            'circle-stroke-color': 'white',
            'circle-stroke-opacity': {
              stops: [[12.5, 0], [15, 1]]
            },
            'circle-opacity': {
              stops: [[12.5, 0], [15, 1]]
            }
          }
        });
        map.current.addLayer({
          'id': 'businesses-layer-desserts',
          'type': 'circle',
          'source': {
              'type': 'geojson',
              'data':  {
                "type": "FeatureCollection",
                "features": turfPointsDesserts.points
              }
          },
          'layout': {
            // Make the layer invisible by default.
            'visibility': 'none'
          },
          'paint': {
            'circle-radius': 4,
            'circle-stroke-width': 2,
            'circle-color': 'purple',
            'circle-stroke-color': 'white',
            'circle-stroke-opacity': {
              stops: [[12.5, 0], [15, 1]]
            },
            'circle-opacity': {
              stops: [[12.5, 0], [15, 1]]
            }
          }
        });
        map.current.addLayer({
          'id': 'businesses-layer-other',
          'type': 'circle',
          'source': {
              'type': 'geojson',
              'data': {
                "type": "FeatureCollection",
                "features": turfPointsOther.points
              }
          },
          'layout': {
            // Make the layer invisible by default.
            'visibility': 'none'
          },
          'paint': {
            'circle-radius': 4,
            'circle-stroke-width': 2,
            'circle-color': 'purple',
            'circle-stroke-color': 'white',
            'circle-stroke-opacity': {
              stops: [[12.5, 0], [15, 1]]
            },
            'circle-opacity': {
              stops: [[12.5, 0], [15, 1]]
            }
          }
        });
        map.current.addLayer({
          'id': 'grid-extrusion-restaurants',
          'type': 'fill-extrusion',
          'source': {
            'type': 'geojson',
            'data': {
              "type": "FeatureCollection",
              "features": restaurantBins
            }
          },
          'layout': {
            // Make the layer visible by default.
            'visibility': 'none'
          },
          'paint' : {
            // Get the `fill-extrusion-color` from the source `color` property.
            // 'fill-extrusion-color': ["get", "color"],
            'fill-extrusion-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              '#66b2ff',
              ["get", "color"]
            ],
            // Get `fill-extrusion-height` from the source `height` property.
            'fill-extrusion-height': ["get", "height"],
            // Get `fill-extrusion-base` from the source `base_height` property.
            'fill-extrusion-base': 0,
            // Make extrusions slightly opaque to see through indoor walls.
            'fill-extrusion-opacity': 0.5
          }
        }) 
        map.current.addLayer({
          'id': 'grid-extrusion-bars',
          'type': 'fill-extrusion',
          'source': {
            'type': 'geojson',
            'data': {
              "type": "FeatureCollection",
              "features": barsBins
            }
          },
          'layout': {
            // Make the layer visible by default.
            'visibility': 'none'
          },
          'paint' : {
            // Get the `fill-extrusion-color` from the source `color` property.
            // 'fill-extrusion-color': ["get", "color"],
            'fill-extrusion-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              '#66b2ff',
              ["get", "color"]
            ],
            // Get `fill-extrusion-height` from the source `height` property.
            'fill-extrusion-height': ["get", "height"],
            // Get `fill-extrusion-base` from the source `base_height` property.
            'fill-extrusion-base': 0,
            // Make extrusions slightly opaque to see through indoor walls.
            'fill-extrusion-opacity': 0.5
          }
        }) 
        map.current.addLayer({
          'id': 'grid-extrusion-fast-food',
          'type': 'fill-extrusion',
          'source': {
            'type': 'geojson',
            'data': {
              "type": "FeatureCollection",
              "features": fastFoodBins
            }
          },
          'layout': {
            // Make the layer visible by default.
            'visibility': 'none'
          },
          'paint' : {
            // Get the `fill-extrusion-color` from the source `color` property.
            // 'fill-extrusion-color': ["get", "color"],
            'fill-extrusion-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              '#66b2ff',
              ["get", "color"]
            ],
            // Get `fill-extrusion-height` from the source `height` property.
            'fill-extrusion-height': ["get", "height"],
            // Get `fill-extrusion-base` from the source `base_height` property.
            'fill-extrusion-base': 0,
            // Make extrusions slightly opaque to see through indoor walls.
            'fill-extrusion-opacity': 0.5
          }
        }) 
        map.current.addLayer({
          'id': 'grid-extrusion-desserts',
          'type': 'fill-extrusion',
          'source': {
            'type': 'geojson',
            'data': {
              "type": "FeatureCollection",
              "features": dessertBins
            }
          },
          'layout': {
            // Make the layer visible by default.
            'visibility': 'none'
          },
          'paint' : {
            // Get the `fill-extrusion-color` from the source `color` property.
            // 'fill-extrusion-color': ["get", "color"],
            'fill-extrusion-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              '#66b2ff',
              ["get", "color"]
            ],
            // Get `fill-extrusion-height` from the source `height` property.
            'fill-extrusion-height': ["get", "height"],
            // Get `fill-extrusion-base` from the source `base_height` property.
            'fill-extrusion-base': 0,
            // Make extrusions slightly opaque to see through indoor walls.
            'fill-extrusion-opacity': 0.5
          }
        }) 
        map.current.addLayer({
          'id': 'grid-extrusion-other',
          'type': 'fill-extrusion',
          'source': {
            'type': 'geojson',
            'data': {
              "type": "FeatureCollection",
              "features": otherBins
            }
          },
          'layout': {
            // Make the layer visible by default.
            'visibility': 'none'
          },
          'paint' : {
            // Get the `fill-extrusion-color` from the source `color` property.
            // 'fill-extrusion-color': ["get", "color"],
            'fill-extrusion-color': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              '#66b2ff',
              ["get", "color"]
            ],
            // Get `fill-extrusion-height` from the source `height` property.
            'fill-extrusion-height': ["get", "height"],
            // Get `fill-extrusion-base` from the source `base_height` property.
            'fill-extrusion-base': 0,
            // Make extrusions slightly opaque to see through indoor walls.
            'fill-extrusion-opacity': 0.5
          }
        })

        // Give height to hex grid
        map.current.addLayer({
            'id': 'grid-extrusion',
            'type': 'fill-extrusion',
            'source': {
              'type': 'geojson',
              'data': {
                "type": "FeatureCollection",
                "features": nonEmptyHexBins
              }
            },
            'layout': {
              // Make the layer visible by default.
              'visibility': 'visible'
            },
            'paint' : {
              // Get the `fill-extrusion-color` from the source `color` property.
              // 'fill-extrusion-color': ["get", "color"],
              'fill-extrusion-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                '#66b2ff',
                ["get", "color"]
              ],
              // Get `fill-extrusion-height` from the source `height` property.
              'fill-extrusion-height': ["get", "height"],
              // Get `fill-extrusion-base` from the source `base_height` property.
              'fill-extrusion-base': 0,
              // Make extrusions slightly opaque to see through indoor walls.
              'fill-extrusion-opacity': 0.5
            }
        })

        // Static helper dict
        const extrusionIdDict = {
          "grid-extrusion-restaurants": "Restaurants",
          "grid-extrusion-bars": "Bars",
          "grid-extrusion-fast-food": "Fast Food",
          "grid-extrusion-desserts": "Desserts",
          "grid-extrusion-other": "Other Types",
        }

        // // Create a popup, but don't add it to the map yet.
        const popup = new mapboxgl.Popup({
          className: styles["popup"],
          closeButton: false,
          closeOnClick: false
        });
        let hoveredStateId = null;
    
        map.current.on('mousemove', ['businesses-layer-1', 'businesses-layer-2','businesses-layer-3','businesses-layer-4',
        'businesses-layer-restaurants' , 'businesses-layer-bars', 'businesses-layer-fast-food', 'businesses-layer-desserts', 'businesses-layer-other'], (e) => {
          console.log('MouseEnter Point: ', e.features[0])
          console.log('MouseEnter Point: ', popup)
          // console.log('MouseEnter Point: ', e.features[0].properties.categories[0].name)
          console.log('MouseEnter Point: ', e.features[0].geometry.coordinates)
          map.current.getCanvas().style.cursor = 'pointer';
          const name = e.features[0].properties.name
          const score = e.features[0].properties.score
          const address = e.features[0].properties.address
          const businessType = e.features[0].properties.businessType
          const text = `<div><h4>${name}</h4><p>Price: $ ${score} / 4 $</p><p>Business Type: ${businessType}</p><p>Address: ${address}</p></div>`
          popup.setLngLat(e.features[0].geometry.coordinates)
              .setHTML(text)
              .addTo(map.current);
          popup._tip.style['border-top-color']='rgb(39, 39, 39)'
          popup._content.style.backgroundColor='rgb(39, 39, 39)'
          popup._content.style.opacity='0.9'
        })
          
        map.current.on('mouseleave', ['grid-extrusion', 'businesses-layer-1', 'businesses-layer-2','businesses-layer-3','businesses-layer-4','businesses-layer-restaurants', 'businesses-layer-bars', 
        'businesses-layer-fast-food','businesses-layer-desserts', 'businesses-layer-other', 'grid-extrusion-restaurants','grid-extrusion-bars','grid-extrusion-fast-food','grid-extrusion-desserts','grid-extrusion-other'], (e) => {
          map.current.getCanvas().style.cursor = '';
          map.current.removeFeatureState({ source: 'grid-extrusion' });
          map.current.removeFeatureState({ source: 'grid-extrusion-restaurants' });
          map.current.removeFeatureState({ source: 'grid-extrusion-bars' });
          map.current.removeFeatureState({ source: 'grid-extrusion-fast-food' });
          map.current.removeFeatureState({ source: 'grid-extrusion-desserts' });
          map.current.removeFeatureState({ source: 'grid-extrusion-other' });
          popup.remove();
          hoveredStateId = null;
        })
  
        map.current.on('mousemove', ['grid-extrusion', 'grid-extrusion-restaurants','grid-extrusion-bars','grid-extrusion-fast-food','grid-extrusion-desserts','grid-extrusion-other'], (e) => {
          map.current.removeFeatureState({ source: 'grid-extrusion' });
          map.current.removeFeatureState({ source: 'grid-extrusion-restaurants' });
          map.current.removeFeatureState({ source: 'grid-extrusion-bars' });
          map.current.removeFeatureState({ source: 'grid-extrusion-fast-food' });
          map.current.removeFeatureState({ source: 'grid-extrusion-desserts' });
          map.current.removeFeatureState({ source: 'grid-extrusion-other' });
          
          if(e.features.length > 0){
            if(e.features[0].properties.height > 0 && 
              e.features[0].layer.id === 'grid-extrusion' 
              || e.features[0].layer.id === 'grid-extrusion-restaurants' 
              ||  e.features[0].layer.id === 'grid-extrusion-bars'
              ||  e.features[0].layer.id === 'grid-extrusion-fast-food'
              ||  e.features[0].layer.id === 'grid-extrusion-desserts'
              ||  e.features[0].layer.id === 'grid-extrusion-other'
              ){
              const filterRestaurants = (map.current.getLayoutProperty('grid-extrusion-restaurants', 'visibility') === 'visible' || map.current.getLayoutProperty('businesses-layer-restaurants', 'visibility') === 'visible') ? "grid-extrusion-restaurants" : null
              const filterBars = (map.current.getLayoutProperty('grid-extrusion-bars', 'visibility') === 'visible' || map.current.getLayoutProperty('businesses-layer-bars', 'visibility') === 'visible') ? "grid-extrusion-bars" : null
              const filterDesserts = (map.current.getLayoutProperty('grid-extrusion-fast-food', 'visibility') === 'visible' || map.current.getLayoutProperty('businesses-layer-fast-food', 'visibility') === 'visible') ? "grid-extrusion-fast-food" : null
              const filterFastFood = (map.current.getLayoutProperty('grid-extrusion-desserts', 'visibility') === 'visible' || map.current.getLayoutProperty('businesses-layer-desserts', 'visibility') === 'visible') ? "grid-extrusion-desserts" : null
              const filterOthers = (map.current.getLayoutProperty('grid-extrusion-other', 'visibility') === 'visible' || map.current.getLayoutProperty('businesses-layer-other', 'visibility') === 'visible') ? "grid-extrusion-other" : null
              const selectedFilter = (filterRestaurants || filterBars || filterDesserts || filterFastFood || filterOthers)
              console.log(e.features[0])
              console.log("selectedFilter:", selectedFilter)

              map.current.getCanvas().style.cursor = 'pointer';
              const height = e.features[0].properties.height;
              const avgPriceWithinFeature = e.features[0].properties.avgPriceWithinFeature;
              const nPointsWithin = e.features[0].properties.nPointsWithin
              const id = e.features[0].id;
              hoveredStateId = e.features[0].id;
              
              const nPointsDict = {
                "grid-extrusion-restaurants": e.features[0].properties.nRestaurantsWithinHex,
                "grid-extrusion-bars": e.features[0].properties.nBarsWithinHex,
                "grid-extrusion-fast-food": e.features[0].properties.nFastFoodWithinHex,
                "grid-extrusion-desserts": e.features[0].properties.nDessertsWithinHex,
                "grid-extrusion-other": e.features[0].properties.nOtherWithinHex,
              }

              const HTML = `
                <div id='${styles['container']}'>
                  <div id='${styles['row']}'>
                    <div id='${styles["col"]}'>
                      <p id='${styles["average"]}'> ${avgPriceWithinFeature}  / 4 </p>
                      <p id='${styles["desc"]}'>Average prices</p>
                    </div>
                    <div id='${styles["col"]}'>
                      <p id='${styles["number"]}'>${
                        !!selectedFilter 
                          ? nPointsDict[selectedFilter]
                          : nPointsWithin
                      }</p>
                      <p id='${styles["desc"]}'>${
                        !!selectedFilter 
                          ? extrusionIdDict[selectedFilter]
                          : "Businesses"
                      }</p>
                    </div>
                  </div>
                  <span>Click to learn more.</span>
                </div>
                `
              
              map.current.setFeatureState({
                  source: e.features[0].layer.id,
                  id: hoveredStateId
                }, { hover: true })
  
              popup.setLngLat(e.lngLat).setHTML(HTML).addTo(map.current);
              popup._tip.style['border-top-color']='rgb(39, 39, 39)'
              popup._content.style.backgroundColor='rgb(39, 39, 39)'
              popup._content.style.opacity='0.9'

            } else {
              map.current.getCanvas().style.cursor = '';
              popup.remove();
            }
          } 
        }); 

        

        const zoomThreshold = 14;
        let hexagonSelected = false;
        // If we zoom in more than Nx, then hide grid-extrusion layer
        map.current.on('zoom', (e) => {

          // Check if at least one filter layer is visible
          const filterRestaurants = (map.current.getLayoutProperty('grid-extrusion-restaurants', 'visibility') === 'visible' || map.current.getLayoutProperty('businesses-layer-restaurants', 'visibility') === 'visible') ? "grid-extrusion-restaurants" : null
          const filterBars = (map.current.getLayoutProperty('grid-extrusion-bars', 'visibility') === 'visible' || map.current.getLayoutProperty('businesses-layer-bars', 'visibility') === 'visible') ? "grid-extrusion-bars" : null
          const filterDesserts = (map.current.getLayoutProperty('grid-extrusion-fast-food', 'visibility') === 'visible' || map.current.getLayoutProperty('businesses-layer-fast-food', 'visibility') === 'visible') ? "grid-extrusion-fast-food" : null
          const filterFastFood = (map.current.getLayoutProperty('grid-extrusion-desserts', 'visibility') === 'visible' || map.current.getLayoutProperty('businesses-layer-desserts', 'visibility') === 'visible') ? "grid-extrusion-desserts" : null
          const filterOthers = (map.current.getLayoutProperty('grid-extrusion-other', 'visibility') === 'visible' || map.current.getLayoutProperty('businesses-layer-other', 'visibility') === 'visible') ? "grid-extrusion-other" : null
          const selectedFilter = (filterRestaurants || filterBars || filterDesserts || filterFastFood || filterOthers)
          
          // console.log('FILTERS UPON ZOOM:')
          // console.log('SELECTED FILTER:', selectedFilter)
          // console.log('filterRestaurants:',filterRestaurants)
          // console.log('filterBars:',filterBars)
          // console.log('filterDesserts:',filterDesserts)
          // console.log('filterFastFood:',filterFastFood)
          // console.log('filterOthers:',filterOthers)

          if (map.current.getZoom() > zoomThreshold ) {
            // console.log('HIDING EXTRUSIONS', map.current.getSource('selected-area'))
            map.current.setLayoutProperty('grid-extrusion', 'visibility', 'none');
            map.current.setLayoutProperty('grid-extrusion-restaurants', 'visibility', 'none');
            map.current.setLayoutProperty('grid-extrusion-bars', 'visibility', 'none');
            map.current.setLayoutProperty('grid-extrusion-fast-food', 'visibility', 'none');
            map.current.setLayoutProperty('grid-extrusion-desserts', 'visibility', 'none');
            map.current.setLayoutProperty('grid-extrusion-other', 'visibility', 'none');
          } 
          // User zooms out -- only set visible if the user is also NOT focused on selected hexagon
          else if (map.current.getZoom() <= zoomThreshold && (typeof(map.current.getSource('selected-area')) === 'undefined') ) {
            // console.log('UNHIDE EXTRUSIONS', map.current.getSource('selected-area'))
            if(selectedFilter){
              // Hide total extrusion grid if a filter is selected, and also set the selected filter's extrusion layer to visible
              map.current.setLayoutProperty('grid-extrusion', 'visibility', 'none');
              map.current.setLayoutProperty(selectedFilter, 'visibility', 'visible');
            }
            else
              map.current.setLayoutProperty('grid-extrusion', 'visibility', 'visible');
          } else {
            map.current.setLayoutProperty('grid-extrusion', 'visibility', 'none');
            map.current.setLayoutProperty('grid-extrusion-restaurants', 'visibility', 'none');
            map.current.setLayoutProperty('grid-extrusion-bars', 'visibility', 'none');
            map.current.setLayoutProperty('grid-extrusion-fast-food', 'visibility', 'none');
            map.current.setLayoutProperty('grid-extrusion-desserts', 'visibility', 'none');
            map.current.setLayoutProperty('grid-extrusion-other', 'visibility', 'none');
          }
        })

        map.current.on('click', ['grid-extrusion', 'grid-extrusion-restaurants','grid-extrusion-bars','grid-extrusion-fast-food','grid-extrusion-desserts','grid-extrusion-other'], (e) => {
          if(e.features.length > 0){
            if(e.features[0].properties.height > 0){
              hexagonSelected = true;
              console.log('%c setting zoom TRUE ', 'background: #222, color: red')
              setZoomed(true)
              console.log('Clicked on polygon:', e.features[0])
              console.log('Clicked on polygon:', e.features[0].geometry.coordinates)
              console.log('Clicked on polygon:', e.features[0].properties)
              const target = {
                center: [e.features[0].properties.x, e.features[0].properties.y],
                zoom: 16,
                bearing: 45,
                pitch: 0
              };

              const visibility = map.current.getLayoutProperty('grid-extrusion', 'visibility');
              // console.log('Visibility: ',visibility )
              if (visibility === 'visible') {
                map.current.setLayoutProperty('grid-extrusion', 'visibility', 'none');
                e.features[0].className = '';
              } else {
                e.features[0].className = 'active';
                map.current.setLayoutProperty('grid-extrusion', 'visibility', 'visible');
              }
              
              if(!map.current.getSource('selected-area')){
                // Construct the source for selected hexagon
                map.current.addSource('selected-area', {
                  'type': 'geojson',
                  'data' : {
                    'type' : 'Feature',
                    'geometry': {
                      'type': 'Polygon',
                      'coordinates': e.features[0].geometry.coordinates
                    } 
                  }
                }) 
              }
              
              if(!map.current.getLayer('selected-hexagon')){
                // Style the selected hexagon
                map.current.addLayer({
                  'id': 'selected-hexagon',
                  'type':'fill',
                  'source' : 'selected-area',
                  'layout': {},
                  'paint': {
                    'fill-color': '#0080ff', // blue color fill
                    'fill-opacity': 0.2
                  }
                }) 
              }
              map.current.flyTo({
                ...target, // Fly to the selected target
                duration: 4000, // Animate over x seconds
                essential: true // This animation is considered essential with
                                //respect to prefers-reduced-motion
              });
            }
          }
        });
      });
}


const handleClick = (tabID) => {
  // Base Case: Click on the selectedTab
  console.log("tabID:", tabID)
  console.log("selectedTab:", selectedTab)
  if(tabID === selectedTab){
    setFilter('init')
    setSelectedTab(null)
    return
  } 
  setSelectedTab(tabID)
  
  if(tabID === 1)
    setFilter('Restaurants')
  else if(tabID === 2)
    setFilter('Bars')
  else if(tabID === 3)
    setFilter('Fast Food')
  else if(tabID === 4)
    setFilter('Desserts')
  else if(tabID === 5)
    setFilter('Other')

// /  setSelectedTab(tabID)
}

// Takes filter name as a parameter
// Hide all layers except for this filter
const setFilter = (filterName) => {
  var showExtrusions = false
  const zoomThreshold = 14;

  // Check if extrusion for the selectedTab should be show, based on zoom
  if (map.current.getZoom() > zoomThreshold ) {
    map.current.setLayoutProperty('grid-extrusion', 'visibility', 'none');
    map.current.setLayoutProperty('grid-extrusion-bars', 'visibility', 'none');
    map.current.setLayoutProperty('grid-extrusion-desserts', 'visibility', 'none');
    map.current.setLayoutProperty('grid-extrusion-fast-food', 'visibility', 'none');
    map.current.setLayoutProperty('grid-extrusion-restaurants', 'visibility', 'none');
    map.current.setLayoutProperty('grid-extrusion-other', 'visibility', 'none');
  }
  // User is zoomed out -- only set visible if the user is also NOT focused on selected hexagon
  else if(map.current.getZoom() <= zoomThreshold && (typeof(map.current.getSource('selected-area')) === 'undefined')){
    showExtrusions = true
  }

  if(filterName ==='init'){
    // Show default business layers and hide categorized layers
    map.current.setLayoutProperty('businesses-layer-restaurants', 'visibility', 'none');
    map.current.setLayoutProperty('businesses-layer-bars', 'visibility', 'none');
    map.current.setLayoutProperty('businesses-layer-fast-food', 'visibility', 'none');
    map.current.setLayoutProperty('businesses-layer-desserts', 'visibility', 'none');
    map.current.setLayoutProperty('businesses-layer-other', 'visibility', 'none');
    map.current.setLayoutProperty('businesses-layer-1', 'visibility', 'visible');
    map.current.setLayoutProperty('businesses-layer-2', 'visibility', 'visible');
    map.current.setLayoutProperty('businesses-layer-3', 'visibility', 'visible');
    map.current.setLayoutProperty('businesses-layer-4', 'visibility', 'visible');
    map.current.setLayoutProperty('grid-extrusion-restaurants', 'visibility', 'none');
    map.current.setLayoutProperty('grid-extrusion-bars', 'visibility', 'none');
    map.current.setLayoutProperty('grid-extrusion-fast-food', 'visibility', 'none');
    map.current.setLayoutProperty('grid-extrusion-desserts', 'visibility', 'none');
    map.current.setLayoutProperty('grid-extrusion-other', 'visibility', 'none');
    if(showExtrusions)
      map.current.setLayoutProperty('grid-extrusion', 'visibility', 'visible');
    return;
  } else {

    map.current.setLayoutProperty('grid-extrusion', 'visibility', 'none');
    map.current.setLayoutProperty('businesses-layer-1', 'visibility', 'none');
    map.current.setLayoutProperty('businesses-layer-2', 'visibility', 'none');
    map.current.setLayoutProperty('businesses-layer-3', 'visibility', 'none');
    map.current.setLayoutProperty('businesses-layer-4', 'visibility', 'none');
    map.current.setLayoutProperty('grid-extrusion-restaurants', 'visibility', 'none');
    map.current.setLayoutProperty('grid-extrusion-bars', 'visibility', 'none');
    map.current.setLayoutProperty('grid-extrusion-fast-food', 'visibility', 'none');
    map.current.setLayoutProperty('grid-extrusion-desserts', 'visibility', 'none');
    map.current.setLayoutProperty('grid-extrusion-other', 'visibility', 'none');

    if(filterName === 'Bars'){
      map.current.setLayoutProperty('businesses-layer-restaurants', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-bars', 'visibility', 'visible');
      map.current.setLayoutProperty('businesses-layer-fast-food', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-desserts', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-other', 'visibility', 'none');
      if(showExtrusions)
        map.current.setLayoutProperty('grid-extrusion-bars', 'visibility', 'visible');
    } 
    else if(filterName === 'Desserts') {
      map.current.setLayoutProperty('businesses-layer-restaurants', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-bars', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-fast-food', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-desserts', 'visibility', 'visible');
      map.current.setLayoutProperty('businesses-layer-other', 'visibility', 'none');
      if(showExtrusions)
        map.current.setLayoutProperty('grid-extrusion-desserts', 'visibility', 'visible');
    } 
    else if(filterName === 'Fast Food'){
      map.current.setLayoutProperty('businesses-layer-restaurants', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-bars', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-fast-food', 'visibility', 'visible');
      map.current.setLayoutProperty('businesses-layer-desserts', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-other', 'visibility', 'none');
      if(showExtrusions)
        map.current.setLayoutProperty('grid-extrusion-fast-food', 'visibility', 'visible');
    }
    // Check for restaurant label last, for better dist
    else if(filterName === 'Restaurants'){
      map.current.setLayoutProperty('businesses-layer-restaurants', 'visibility', 'visible');
      map.current.setLayoutProperty('businesses-layer-bars', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-fast-food', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-desserts', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-other', 'visibility', 'none');
      if(showExtrusions)
        map.current.setLayoutProperty('grid-extrusion-restaurants', 'visibility', 'visible');
    } 
    else if(filterName === 'Other'){ // Other
      map.current.setLayoutProperty('businesses-layer-restaurants', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-bars', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-fast-food', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-desserts', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-other', 'visibility', 'visible');
      if(showExtrusions)
        map.current.setLayoutProperty('grid-extrusion-other', 'visibility', 'visible');
    }
  }
}
  

  // Zoom back out of overview to init
  const backToOverview = () => {
    setFilter('init')
    const start = {
      center: center,
      zoom: 12.5,
      pitch: 45,
      bearing: 20,
    }
    map.current.flyTo({
      ...start, // Fly to the selected target
      duration: 4000, // Animate over x seconds
      essential: true // This animation is considered essential with
                      //respect to prefers-reduced-motion
    });
    setZoomed(false);
    setSelectedTab(null)
    if(typeof(map.current.getLayer('selected-hexagon')) !== 'undefined')
      map.current.removeLayer('selected-hexagon');

    if(typeof(map.current.getSource('selected-area')) !== 'undefined')
      map.current.removeSource('selected-area');
      
    map.current.setLayoutProperty('grid-extrusion', 'visibility', 'visible');
  }

  const legendDict = {
    1 : 'max_restaurants',
    2 : 'max_bars',
    3 : 'max_fast_food',
    4 : 'max_desserts',
    5 : 'max_other'
  }

  const heightForBar = (selectedTab, barIdx) =>{

    const maxTotal = allBusinesses.features.length
    const defaultHeights = { 
      1 :(maxTotal * 0.1), 
      2 :(maxTotal * 0.2), 
      3 : (maxTotal * 0.4)
    }
    
    if(selectedTab === null)
      return defaultHeights[barIdx]

    const maxVal = maxCounts[legendDict[selectedTab]]
    console.log('max val for tab: ', selectedTab, maxVal)
    var height = 0

    if(barIdx === 3){
      height = ((maxVal * 0.75) / maxTotal) * 100
    }
    else if(barIdx === 2){
      height = ((maxVal * 0.55) / maxTotal) * 100
    }
    else if(barIdx === 1){
      height = ((maxVal * 0.35) / maxTotal) * 100
    }

    console.log("HEGIHT FOR BAR ", selectedTab, height)
    return height.toString()
  }

  return (
    <main className={styles["container"]}>
      
      {loading ? <LoadingSpinner/>
      : 
        <>
        <div className={styles["menu-container"]}>
          <h2 className={styles["title"]}>{`Where should we eat?`}</h2>
          <p className={styles["description"]}>
            {`What parts of: `}
          </p>
          <p className={styles["location"]}>{place}</p>
          <p className={styles["description"]}>
            {`have the priciest menus?`}
          </p>
          <div className={styles["legend"]}>
            <div className={styles["chart-container"]}>
              <span  className={styles["legend-header"]}>
                <h3 className={styles["chart-title"]}>LEGEND</h3>
                <BsInfoCircle onClick={() => setMoreInfoToggle(!moreInfoToggle)} className={styles['more-info-toggle']} style={{ marginLeft: '3px', transform: 'scale(0.85)'}} />
              </span>
              {moreInfoToggle === true
                ? <span className={styles['more-info']}>{`This graph shows the average price from businesses, per hexabin. Height is drawn from the average number of businesses, while the color cooresponds to average prices in the area.`} </span>
                : null
              }
              <div className={styles["small-bar-chart"]}>
                  <div className={styles["small-bar-chart-bar-container"]}>
                      <div 
                      className={styles["small-bar-chart-bar"]}
                      id={styles['small-bar-chart-bar-1']}
                      style={{'height': `${heightForBar(selectedTab, 1)}%`}}
                      />
                  </div>
                  <div className={styles["small-bar-chart-bar-container"]}>
                      <div 
                      className={styles["small-bar-chart-bar"]}
                      id={styles['small-bar-chart-bar-2']}
                      style={{'height': `${heightForBar(selectedTab, 2)}%`}}
                      />
                  </div>
                  <div className={styles["small-bar-chart-bar-container"]}>
                      <div 
                      className={styles["small-bar-chart-bar"]}
                      id={styles['small-bar-chart-bar-3']}
                      style={{'height': `${heightForBar(selectedTab, 3)}%`}}
                      />
                  </div>
                  <div className={styles["small-bar-chart-bar-container"]}>
                      <div 
                      className={styles["small-bar-chart-bar"]}
                      id={styles['small-bar-chart-bar-4']}
                      style={{"height": '94%'}}
                      />
                  </div>
                </div>
                <div className={styles["bar-chart-label"]}>
                  <p className={styles['metric-left']}>1</p>
                  <h4 className={styles["label-text"]}>{`Total Businesses`}</h4>
                  <p className={styles['metric-right']}>{
                    !!maxCounts && allBusinesses.features.length > 0
                      ?  (!!selectedTab ? maxCounts[legendDict[selectedTab]] : allBusinesses.features.length)
                      : null
                    }</p>
                </div>
              </div>
            </div>

          <h4 className={styles['filters-title']}>Toggle Features</h4>
            <ul className={styles["layerToggles"]}>
              <li className={styles["toggleItem"]+' '+(selectedTab === 1 ? styles["active"] : '')} onClick={() => handleClick(1)}>
                <MdRoomService  style={{ marginRight: '10px'}}/>
                <p>Restaurants</p>
              </li>
              <li className={styles["toggleItem"]+' '+(selectedTab === 2 ? styles["active"] : '')} onClick={() => handleClick(2)}>
                <FaBeer style={{ marginRight: '10px'}}/>
                <p>Bars</p>
              </li>
              <li className={styles["toggleItem"]+' '+(selectedTab === 3 ? styles["active"] : '')} onClick={() => handleClick(3)}>
                <MdFastfood style={{ marginRight: '10px'}}/>
                <p>Fast Food</p>
              </li>
              <li className={styles["toggleItem"]+' '+(selectedTab === 4 ? styles["active"] : '')} onClick={() => handleClick(4)}>
                <GiCupcake  style={{ marginRight: '10px'}}/>
                <p>Desserts</p>
              </li>
              <li className={styles["toggleItem"]+' '+(selectedTab === 5 ? styles["active"] : '')} onClick={() => handleClick(5)}>
                <BsThreeDots style={{ marginRight: '10px'}}/>
                <p>Other</p>
              </li>
            </ul>

        </div>
        
        <div className={styles["map-container"]} ref={mapContainer}/>
        <button 
          onClick={backToOverview} 
          className={styles["zoomOut"]} 
          style={ 
            zoomed ? { visibility: 'visible'} : null
          }>
            Back to Overview
          </button>
          <div className={styles["help"]}>Right click and drag to rotate</div>
        </>
      }
    </main>
  )
}

export default Map