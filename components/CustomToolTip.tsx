import React from 'react'

const CustomToolTip = ({ features }) => {

    console.log('INSIDE CUSTOM TOOLTIP! Received: ', features)
    const renderFeature = (feature, i) => {
        return (
            <div key={i}>
                <strong>{'Strong'}</strong>
                <span>{feature.name}</span>
                <span>{feature.businessType}</span>
                <span>{feature.address}</span>
            </div>
        )
    }

    return (
        <div>
            {/* {features.map(renderFeature)} */}
            <span className="flex-child color-gray-dark triangle triangle--d"></span>
        </div>
    )
}

export default CustomToolTip