// Utility Functions for Map
import MarketData from '../public/market_data.json'

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


export const getNumberOfEntriesFromCO = () => {
    var entries = MarketData.map(el => el.State === "CO")

    console.log(entries.length)
}