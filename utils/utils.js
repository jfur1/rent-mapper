// Utility Functions for Map
import * as turf from '@turf/turf';

// Degrees to radians
export const deg2rad = (degrees) => {
    return Math.PI * degrees / 180.0
}
// Radians to degrees
export const rad2deg = (radians) => {
    return 180.0 * radians / Math.PI
}

// Semi-axes of WGS-84 geoidal reference
const WGS84_a = 6378137.0  // Major semiaxis [m]
const WGS84_b = 6356752.3  // Minor semiaxis [m]

// Earth radius at a given latitude, according to the WGS-84 ellipsoid [m]
export const WGS84EarthRadius = (lat) => {
    // http://en.wikipedia.org/wiki/Earth_radius
    const An = WGS84_a * WGS84_a * Math.cos(lat)
    const Bn = WGS84_b * WGS84_b * Math.sin(lat)
    const Ad = WGS84_a * Math.cos(lat)
    const Bd = WGS84_b * Math.sin(lat)
    return Math.sqrt( (An*An + Bn*Bn) / (Ad*Ad + Bd*Bd) )
}

// Bounding box surrounding the point at given coordinates, assuming local approximation of Earth surface as a sphere of radius given by WGS84: https://stackoverflow.com/questions/238260/how-to-calculate-the-bounding-box-for-a-given-lat-lng-location
export const boundingBox = (longitudeInDegrees, latitudeInDegrees, halfSideInKm) => {
    const lat = deg2rad(latitudeInDegrees)
    const lon = deg2rad(longitudeInDegrees)
    const halfSide = 1000 * halfSideInKm

    // Radius of Earth at given latitude
    const radius = WGS84EarthRadius(lat)
    // Radius of the parallel at given latitude
    const pradius = radius * Math.cos(lat)

    const latMin = lat - halfSide/radius
    const latMax = lat + halfSide/radius
    const lonMin = lon - halfSide/pradius
    const lonMax = lon + halfSide/pradius

    return [
        rad2deg(lonMin), 
        rad2deg(latMin), 
        rad2deg(lonMax), 
        rad2deg(latMax)
    ]
}


export const randomIntFromInterval = (min, max) => { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
}

/* Generate a random string with 32 characters.

    Session Token is a user-generated token to identify a session for billing purposes. 
    Learn more about session tokens.
    https://docs.foursquare.com/reference/session-tokens
*/
export const generateRandomSessionToken = (length = 32) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < length; i++) {
      result += characters[Math.floor(Math.random() * characters.length)];
    }
    return result;
}

// Takes json response from API and converts to geojson standard
export const jsonToGeoJson = (data, score) => {
    var geojson = {
        'type': 'FeatureCollection',
        "features": []
    }

    if(typeof(data) === 'undefined'){
        console.log('No data to convert. Returning tempalte.');
        return geojson;
    }

    for(var i = 0; i < data.length ; i++){
        var point = {
            "type": "Feature",
            "id": 'business',
            "geometry" :{
                "type": "Point",
                "coordinates" : [
                    data[i].geocodes.main.longitude,
                    data[i].geocodes.main.latitude
                ]
            },
            "properties" : {
                "fsq_id" : data[i].fsq_id,
                "name" : data[i].name,
                "location" : data[i].location,
                "score" : score
            }
        }
        geojson.features.push(point);
    }

    return geojson;
}

// Converts a geojson object to an array of turf points
export const geoJsonToPoints = (geojson) => {
    var points = []

    for(var i=0; i < geojson.features.length; i++){
        points.push(geojson.features[i].geometry.coordinates)
    }

    return turf.points(points)
}