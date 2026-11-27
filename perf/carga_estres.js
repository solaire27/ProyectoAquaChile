import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Considera 200 y 404 (búsqueda sin resultados) como respuestas HTTP válidas
http.setResponseCallback(http.expectedStatuses(200, 404));

export const options = {
  stages: [
    { duration: '10s', target: 10 }, // Calentamiento: 10 usuarios virtuales
    { duration: '20s', target: 30 }, // Carga normal: 30 usuarios concurrentes
    { duration: '15s', target: 60 }, // Estrés / pico: 60 usuarios concurrentes
    { duration: '10s', target: 0 },  // Enfriamiento
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'], // 95% de peticiones bajo 1.5s
    http_req_failed: ['rate<0.05'],    // Menos de 5% de errores
  },
};

export default function () {
  // 1. Consulta pública de ofertas laborales
  const resOfertas = http.get(`${BASE_URL}/api/ofertas/public`);
  check(resOfertas, {
    'GET /api/ofertas/public -> 200': (r) => r.status === 200,
  });

  // 2. Consulta pública de estado de postulación
  const payload = JSON.stringify({
    identificador: '12345678-9',
    correo: 'prueba@aquachile.cl',
  });
  const params = { headers: { 'Content-Type': 'application/json' } };
  const resEstado = http.post(`${BASE_URL}/api/solicitudes/estado`, payload, params);
  check(resEstado, {
    'POST /api/solicitudes/estado -> 200 o 404 controlado': (r) => r.status === 200 || r.status === 404,
  });

  sleep(0.5);
}