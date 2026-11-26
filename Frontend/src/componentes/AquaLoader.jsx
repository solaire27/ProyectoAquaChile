import React from 'react';
import LogoAquaChile from './LogoAquaChile';
import './AquaLoader.css';

const BURBUJAS = [
    { left: '8%', size: 10, duracion: '5.5s', delay: '0s' },
    { left: '16%', size: 18, duracion: '7.2s', delay: '1.1s' },
    { left: '25%', size: 8, duracion: '4.8s', delay: '0.4s' },
    { left: '34%', size: 14, duracion: '6.4s', delay: '2.0s' },
    { left: '44%', size: 7, duracion: '5.0s', delay: '0.8s' },
    { left: '53%', size: 22, duracion: '8.0s', delay: '1.6s' },
    { left: '62%', size: 11, duracion: '5.9s', delay: '0.3s' },
    { left: '71%', size: 16, duracion: '6.8s', delay: '2.4s' },
    { left: '80%', size: 9, duracion: '4.9s', delay: '1.3s' },
    { left: '89%', size: 20, duracion: '7.5s', delay: '0.6s' },
    { left: '94%', size: 12, duracion: '6.1s', delay: '1.9s' },
    { left: '48%', size: 13, duracion: '6.6s', delay: '2.8s' }
];

const AquaLoader = ({ mensaje = 'Cargando espacio de trabajo de AquaChile...' }) => {
    return (
        <div className="aqua-loader-screen" role="status" aria-live="polite">
            {/* Rayos de luz desde la superficie del agua */}
            <div className="aqua-light-rays" aria-hidden="true" />

            {/* Burbujas ascendentes */}
            <div className="aqua-bubbles-layer" aria-hidden="true">
                {BURBUJAS.map((b, idx) => (
                    <span
                        key={idx}
                        className="aqua-bubble"
                        style={{
                            '--bubble-left': b.left,
                            '--bubble-size': `${b.size}px`,
                            '--bubble-duration': b.duracion,
                            '--bubble-delay': b.delay
                        }}
                    />
                ))}
            </div>

            {/* Centro: esfera con líquido ondulando + marca */}
            <div className="aqua-loader-center">
                <div className="aqua-orb-wrapper">
                    <div className="aqua-orb-ring" />
                    <div className="aqua-orb">
                        <div className="aqua-orb-liquid aqua-orb-liquid-back" />
                        <div className="aqua-orb-liquid aqua-orb-liquid-front" />
                        <span className="aqua-orb-icon" aria-hidden="true">
                            <LogoAquaChile size={36} />
                        </span>
                    </div>
                </div>

                <h2 className="aqua-loader-brand">AquaChile</h2>
                <p className="aqua-loader-text">{mensaje}</p>

                <div className="aqua-progress-track">
                    <div className="aqua-progress-bar" />
                </div>
            </div>

            {/* Olas inferiores en doble capa */}
            <div className="aqua-bottom-waves" aria-hidden="true">
                <svg
                    className="aqua-wave-svg wave-back"
                    viewBox="0 0 1440 160"
                    preserveAspectRatio="none"
                >
                    <path d="M0,74 C240,140 480,10 720,74 C960,138 1200,12 1440,74 L1440,160 L0,160 Z" />
                </svg>
                <svg
                    className="aqua-wave-svg wave-front"
                    viewBox="0 0 1440 160"
                    preserveAspectRatio="none"
                >
                    <path d="M0,96 C260,28 520,146 780,84 C1040,22 1260,128 1440,86 L1440,160 L0,160 Z" />
                </svg>
            </div>
        </div>
    );
};

export default AquaLoader;