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

export default test