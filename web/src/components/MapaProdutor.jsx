import { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const marcadorVermelho = L.divIcon({
  className: 'marcador-vermelho',
  html: `
    <svg width="32" height="42" viewBox="0 0 32 42"
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 40S2 23.5 2 16a14 14 0 1 1 28 0C30 23.5 16 40 16 40Z"
        fill="#dc2626"
        stroke="#ffffff"
        stroke-width="2"
      />
      <circle cx="16" cy="16" r="5.5" fill="#ffffff"/>
    </svg>
  `,
  iconSize: [32, 42],
  iconAnchor: [16, 40]
});

export default function MapaProdutor({ localidade, localizacao }) {
  const mapaRef = useRef(null);

  const lat = localizacao?.lat;
  const lng = localizacao?.lng;

  const temCoordenadas =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180;

  const localizacaoExata =
    temCoordenadas &&
    localizacao?.origem === 'exploracao';

  useEffect(() => {
    if (!temCoordenadas || !mapaRef.current) return;

    const mapa = L.map(mapaRef.current, {
      scrollWheelZoom: false
    }).setView([lat, lng], 13);

    L.tileLayer(
      'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }
    ).addTo(mapa);

    L.marker([lat, lng], {
      icon: marcadorVermelho
    }).addTo(mapa);

    return () => {
      mapa.remove();
    };
  }, [lat, lng, temCoordenadas]);

  if (!temCoordenadas) {
    return (
      <div className="produtor-publico__mapa">
        <h2 className="h5">Localização</h2>
        <p className="texto-secundario">
          {localidade || 'Localidade não indicada'}
        </p>
        <p className="texto-secundario small">
          Ainda não foi possível obter as coordenadas
          para apresentar o mapa.
        </p>
      </div>
    );
  }

  const urlCompleto =
    `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=13/${lat}/${lng}`;

  return (
    <div className="produtor-publico__mapa">
      <div
        ref={mapaRef}
        aria-label={`Mapa da zona de ${localidade}`}
        style={{
          width: '100%',
          height: '280px',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      />

      <p className="texto-secundario small mt-2 mb-1">
        {localizacaoExata
          ? 'Localização da exploração indicada pelo produtor.'
          : `Exploração localizada na zona de ${localidade}. O marcador indica apenas uma localização aproximada.`}
      </p>

      <a
        href={urlCompleto}
        target="_blank"
        rel="noopener noreferrer"
        className="small"
      >
        Ver mapa completo no OpenStreetMap
      </a>
    </div>
  );
}