import { useRef, useEffect, useState } from 'react'
import Head from 'next/head'
import styles from '../styles/Map.module.scss'
import type { NextPage } from 'next';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import 'mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { 
  boundingBox, 
  randomIntFromInterval, 
  generateRandomSessionToken, 
  jsonToGeoJson,
  geoJsonToPoints,
  categorizeBusinesses
 } from '../utils/utils.js'
import MapboxGeocoder from 'mapbox-gl-geocoder'
import * as turf from '@turf/turf';
import MarketData from '../utils/geoJSON_market_data.json'
import LoadingSpinner from '../components/Loading.tsx'

const Map : NextPage = () => {
  const mapContainer = useRef<any>(null);
  const map = useRef<mapboxgl.Map | any>(null);
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
  
  const getData = async() => {
    try {
      console.log(`%c Fetching data for center: ${center}... `, 'background: #111; color: #bada55')
      var searchParams = {
        query: 'food',
        ll: center[1]+','+center[0],
        radius: 10000,
        min_price:1,
        max_price:1,
        session_token: sessionToken,
        limit: 50
      }
      var searchParams2 = {...searchParams, min_price:2, max_price:2}
      var searchParams3 = {...searchParams, min_price:3, max_price:3}
      var searchParams4 = {...searchParams, min_price:4, max_price:4}
      // Formatting
      searchParams = new URLSearchParams(searchParams).toString();
      searchParams2 = new URLSearchParams(searchParams2).toString();
      searchParams3 = new URLSearchParams(searchParams3).toString();
      searchParams4 = new URLSearchParams(searchParams4).toString();

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

      console.log('businesses', geo1)
      console.log('businesses2', geo2)
      console.log('businesses3', geo3)
      console.log('businesses4', geo4)

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
    
    setLoading(true)
    if(map.current !== null)
      map.current.remove();

    const update = async() => {
      await getData();
      setLoading(false)
    }
    update();

    // showMap();

  }, [center])
  

  const showMap = async() => {
      // Initialize New Map
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN;
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: center,
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
      var bbox = boundingBox(center[0], center[1], 3);
      const cellSide = 0.16;
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
  
      // console.log(turfPoints)
      var max_pts = 0;
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
          
          if(nPointsWithin > 0 && nPointsWithin > max_pts)
            max_pts = nPointsWithin;
    
            // console.log('N Points within Polyon:', nPointsWithin)
            var avgPriceWithinFeature = ((nPointsWithin1) + (2 * nPointsWithin2) + (3 * nPointsWithin3) + (4 * nPointsWithin4)) / nPointsWithin;
            avgPriceWithinFeature = parseFloat(parseFloat(avgPriceWithinFeature).toFixed(2))

            // Get color based on rgb(238, 83, 83) main color
            const r = (137 * (avgPriceWithinFeature * 25)) / 100
            const g = (245 * (avgPriceWithinFeature * 25)) / 100
            const b = (118 * (avgPriceWithinFeature * 25)) / 100
    
            // console.log(f.geometry.coordinates[0][0])
            f.id = idx;
            const center_x = (f.geometry.coordinates[0][0][0] + f.geometry.coordinates[0][3][0]) / 2
            const center_y =(f.geometry.coordinates[0][0][1] + f.geometry.coordinates[0][3][1]) / 2
    
            f.properties = { 
              x: center_x,
              y: center_y,
              coordinates: f.geometry.coordinates,
              avgPriceWithinFeature: avgPriceWithinFeature, 
              nPointsWithin: nPointsWithin,
              height: avgPriceWithinFeature * 1000,
              color: `rgb(${r}, ${g}, ${b})`,
              nRestaurantsWithinHex: nRestaurantsWithinHex,
              nBarsWithinHex: nBarsWithinHex, 
              nFastFoodWithinHex: nFastFoodWithinHex,
              nDessertsWithinHex: nDessertsWithinHex,
              nOtherWithinHex: nOtherWithinHex
            };
            nonEmptyHexBins.push(f)

            if(nRestaurantsWithinHex)
              restaurantBins.push(f)
            if(nBarsWithinHex)
              barsBins.push(f)
            if(nFastFoodWithinHex)  
              fastFoodBins.push(f)
            if(nDessertsWithinHex)
              dessertBins.push(f)
            if(nOtherWithinHex)
              otherBins.push(f)

          }
      });

      // console.log("HEX BINS WITH NO DATA: ", emptyHexBins)
      // console.log("HEX BINS WITH WITH DATA: ", nonEmptyHexBins)
      
      map.current.on('load', async () => {  
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
        })
          
        map.current.on('mouseleave', ['grid-extrusion', 'businesses-layer-1', 'businesses-layer-2','businesses-layer-3','businesses-layer-4', , 'grid-extrusion-restaurants','grid-extrusion-bars','grid-extrusion-fast-food','grid-extrusion-desserts','grid-extrusion-other'], (e) => {
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
              // const features = map.current.queryRenderedFeatures(e.point);
              // console.log(e.features[0])
              map.current.getCanvas().style.cursor = 'pointer';
              const height = e.features[0].properties.height;
              const avgPriceWithinFeature = e.features[0].properties.avgPriceWithinFeature;
              const nPointsWithin = e.features[0].properties.nPointsWithin
              const id = e.features[0].id;
              hoveredStateId = e.features[0].id;
              const text = `<div><p>Average Cost:</p><p>$ ${avgPriceWithinFeature} / 4 $</p><p>nPointsWithin : ${nPointsWithin}</p></div>`

                map.current.setFeatureState({
                  source: e.features[0].layer.id,
                  id: hoveredStateId
                }, { hover: true })
  
              popup.setLngLat(e.lngLat).setHTML(text).addTo(map.current);
            } else {
              map.current.getCanvas().style.cursor = '';
              popup.remove();
            }
          } 
        }); 

        

        const zoomThreshold = 14;
        let hexagonSelected = false;
        const layoutLoaded = map.current.getLayoutProperty('grid-extrusion', 'visibility')
        // If we zoom in more than Nx, then hide grid-extrusion layer
        map.current.on('zoom', () => {
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
          else if (map.current.getZoom() <= zoomThreshold && typeof(map.current.getSource('selected-area')) === 'undefined' ) {
            // console.log('UNHIDE EXTRUSIONS', map.current.getSource('selected-area'))
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
              console.log('Clicked on polygon:', e.features[0].id)
              console.log('Clicked on polygon:', e.features[0].geometry.coordinates)
              console.log('Clicked on polygon:', e.features[0])
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

  setSelectedTab(tabID)
}

// Takes filter name as a parameter
// Hide all layers except for this filter
const setFilter = (filterName) => {

  if(filterName ==='init'){
    // Show default business layers and hide categorized layers
    map.current.setLayoutProperty('grid-extrusion', 'visibility', 'visible');
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
      map.current.setLayoutProperty('grid-extrusion-bars', 'visibility', 'visible');
    } 
    else if(filterName === 'Desserts') {
      map.current.setLayoutProperty('businesses-layer-restaurants', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-bars', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-fast-food', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-desserts', 'visibility', 'visible');
      map.current.setLayoutProperty('businesses-layer-other', 'visibility', 'none');
      map.current.setLayoutProperty('grid-extrusion-desserts', 'visibility', 'visible');
    } 
    else if(filterName === 'Fast Food'){
      map.current.setLayoutProperty('businesses-layer-restaurants', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-bars', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-fast-food', 'visibility', 'visible');
      map.current.setLayoutProperty('grid-extrusion-fast-food', 'visibility', 'visible');
      map.current.setLayoutProperty('businesses-layer-desserts', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-other', 'visibility', 'none');
    }
    // Check for restaurant label last, for better dist
    else if(filterName === 'Restaurants'){
      map.current.setLayoutProperty('grid-extrusion-restaurants', 'visibility', 'visible');
      map.current.setLayoutProperty('businesses-layer-restaurants', 'visibility', 'visible');
      map.current.setLayoutProperty('businesses-layer-bars', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-fast-food', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-desserts', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-other', 'visibility', 'none');
    } 
    else if(filterName === 'Other'){ // Other
      map.current.setLayoutProperty('businesses-layer-restaurants', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-bars', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-fast-food', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-desserts', 'visibility', 'none');
      map.current.setLayoutProperty('businesses-layer-other', 'visibility', 'visible');
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

  return (
    <main className={styles["container"]}>
      
      {loading ? <LoadingSpinner/>
      : 
        <>
        <div className={styles["menu-container"]}>
          <h2 className={styles["title"]}>{`Where to Eat in ${place}`}</h2>
          <p className={styles["description"]}>
            {`What parts of ${place} have the priciest menus? Data source: `}
            <a href='https://location.foursquare.com/developer/reference/place-search' target='blank' rel='norefferer'>{`Foursquare`}</a>
          </p>

          <div className={styles["legend"]}>

            <div className={styles["chart-container"]}>
              <h3 className={styles["chart-title"]}>LEGEND</h3>
              <div className={styles["small-bar-chart"]}>
                  <div className={styles["small-bar-chart-bar-container"]}>
                      <div 
                      className={styles["small-bar-chart-bar"]}
                      id={styles['small-bar-chart-bar-1']}
                      style={{'height': '25%'}}
                      />
                  </div>
                  <div className={styles["small-bar-chart-bar-container"]}>
                      <div 
                      className={styles["small-bar-chart-bar"]}
                      id={styles['small-bar-chart-bar-2']}
                      style={{'height': '45%'}}
                      />
                  </div>
                  <div className={styles["small-bar-chart-bar-container"]}>
                      <div 
                      className={styles["small-bar-chart-bar"]}
                      id={styles['small-bar-chart-bar-3']}
                      style={{'height': '60%'}}
                      />
                  </div>
                  <div className={styles["small-bar-chart-bar-container"]}>
                      <div 
                      className={styles["small-bar-chart-bar"]}
                      id={styles['small-bar-chart-bar-4']}
                      style={{"height": '80%'}}
                      />
                  </div>
                </div>
                <div className={styles["bar-chart-label"]}>
                  <p className={styles['metric-left']}>$</p>
                  <h4 className={styles["label-text"]}>{`Price`}</h4>
                  <p className={styles['metric-right']}>$$$$</p>
                </div>
              </div>
            </div>

          <h4 className={styles['filters-title']}>Toggle Features</h4>
            <ul className={styles["layerToggles"]}>
              <li className={styles["toggleItem"]+' '+(selectedTab === 1 ? styles["active"] : '')} onClick={() => handleClick(1)}>
                Restaurants
              </li>
              <li className={styles["toggleItem"]+' '+(selectedTab === 2 ? styles["active"] : '')} onClick={() => handleClick(2)}>
                Bars
              </li>
              <li className={styles["toggleItem"]+' '+(selectedTab === 3 ? styles["active"] : '')} onClick={() => handleClick(3)}>
                Fast Food
              </li>
              <li className={styles["toggleItem"]+' '+(selectedTab === 4 ? styles["active"] : '')} onClick={() => handleClick(4)}>
                Desserts
              </li>
              <li className={styles["toggleItem"]+' '+(selectedTab === 5 ? styles["active"] : '')} onClick={() => handleClick(5)}>
                Other
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