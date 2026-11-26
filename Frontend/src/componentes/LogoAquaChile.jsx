import React from 'react';

const LogoAquaChile = ({ size = 22, conCaja = false, cajaSize = 36, className = '' }) => {
    const svg = (
        <svg
            width={size}
            height={size}
            viewBox="4 4 24 24"
            fill="none"
            aria-hidden="true"
            className={!conCaja ? className : undefined}
            style={{ display: 'block', flexShrink: 0 }}
        >
            <path
                d="M6 10 Q11 6 16 10 T26 10"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeOpacity="0.55"
            />
            <path
                d="M6 16 Q11 12 16 16 T26 16"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.8"
                strokeLinecap="round"
            />
            <path
                d="M6 22 Q11 18 16 22 T26 22"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeOpacity="0.55"
            />
        </svg>
    );

    if (!conCaja) return svg;

    return (
        <span
            aria-hidden="true"
            className={className}
            style={{
                width: `${cajaSize}px`,
                height: `${cajaSize}px`,
                borderRadius: `${Math.round(cajaSize * 0.28)}px`,
                background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 18px rgba(56, 189, 248, 0.35)',
                flexShrink: 0
            }}
        >
            {svg}
        </span>
    );
};

export default LogoAquaChile;