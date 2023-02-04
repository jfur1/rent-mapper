import '@/styles/globals.scss'
import mapboxgl from '!mapbox-gl';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_TOKEN;

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}
