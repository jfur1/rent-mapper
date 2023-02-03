import React from 'react'
import styles from '../styles/Map.module.scss'
const test = () => {
  return (
    <div style={{display: 'flex', width: '100%', height: '100%'}}>
        <div className={styles["legend"]}>

            <div className={styles["small-bar-chart"]}>
                <div className={styles["small-bar-chart-bar-container"]}>
                    <span 
                    className={styles["small-bar-chart-bar"]}
                    id={'small-bar-chart-bar-1'}
                    style={{height: '25% !important', 'backgroundColor': 'red'}}
                    />
                </div>
                <div className={styles["small-bar-chart-bar-container"]}>
                    <span 
                    className={styles["small-bar-chart-bar"]}
                    id={styles['small-bar-chart-bar-2']}
                    style={{height: '45% !important', 'backgroundColor': 'blue'}}
                    />
                </div>
                <div className={styles["small-bar-chart-bar-container"]}>
                    <span 
                    className={styles["small-bar-chart-bar"]}
                    id={'small-bar-chart-bar-3'}
                    style={{height: '60% !important', 'backgroundColor': 'green'}}
                    />
                </div>
                <div className={styles["small-bar-chart-bar-container"]}>
                    <span 
                    className={styles["small-bar-chart-bar"]}
                    id={'small-bar-chart-bar-4'}
                    style={{height: '80% !important', 'backgroundColor': 'orange'}}
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
  )
}

// map.current.addLayer({
//     'id': 'businesses-layer-1',
//     'type': 'circle',
//     'source': {
//         'type': 'geojson',
//         'data': businesses
//     },
//     'layout': {},
//     'paint': {
//       'circle-radius': 4,
//       'circle-stroke-width': 2,
//       'circle-color': 'red',
//       'circle-stroke-color': 'white',
//       'circle-stroke-opacity': {
//         stops: [[12.5, 0], [15, 1]]
//       },
//       'circle-opacity': {
//         stops: [[12.5, 0], [15, 1]]
//       }
//     }
//   });
//   map.current.addLayer({
//     'id': 'businesses-layer-2',
//     'type': 'circle',
//     'source': {
//         'type': 'geojson',
//         'data': businesses2
//     },
//     'layout': {},
//     'paint': {
//       'circle-radius': 4,
//       'circle-stroke-width': 2,
//       'circle-color': 'blue',
//       'circle-stroke-color': 'white',
//       'circle-stroke-opacity': {
//         stops: [[12.5, 0], [15, 1]]
//       },
//       'circle-opacity': {
//         stops: [[12.5, 0], [15, 1]]
//       }
//     }
//   });
//   map.current.addLayer({
//     'id': 'businesses-layer-3',
//     'type': 'circle',
//     'source': {
//         'type': 'geojson',
//         'data': businesses3
//     },
//     'layout': {},
//     'paint': {
//       'circle-radius': 4,
//       'circle-stroke-width': 2,
//       'circle-color': 'green',
//       'circle-stroke-color': 'white',
//       'circle-stroke-opacity': {
//         stops: [[12.5, 0], [15, 1]]
//       },
//       'circle-opacity': {
//         stops: [[12.5, 0], [15, 1]]
//       }
//     }
//   });
//   map.current.addLayer({
//       'id': 'businesses-layer-4',
//       'type': 'circle',
//       'source': {
//           'type': 'geojson',
//           'data': businesses4
//       },
//       'layout': {},
//       'paint': {
//         'circle-radius': 4,
//         'circle-stroke-width': 2,
//         'circle-color': 'orange',
//         'circle-stroke-color': 'white',
//         'circle-stroke-opacity': {
//           stops: [[12.5, 0], [15, 1]]
//         },
//         'circle-opacity': {
//           stops: [[12.5, 0], [15, 1]]
//         }
//       }
//     });

export default test