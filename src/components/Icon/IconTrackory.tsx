import React from 'react';

interface IconTrackoryProps {
    width?: number | string;
    height?: number | string;
    className?: string;
    color?: string;
}

const IconTrackory: React.FC<IconTrackoryProps> = ({ width = 500, height = 150, className = '', color = '#2563eb' }) => {
    return (
        <svg width={width} height={height} viewBox="0 0 700 150" className={className} xmlns="http://www.w3.org/2000/svg">
            <text x="0" y="110" fill={color} fontSize="135" fontFamily="'sans-serif'" letterSpacing="10">
                TRAKORY
            </text>
        </svg>
    );
};

export default IconTrackory;
