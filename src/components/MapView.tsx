import { Box } from '@mantine/core';
import type { StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// Worker の場所は import.meta.url からの相対で決まり、ビルド後は見つからなくなるため、明示的に渡す
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { useEffect, useRef } from 'react';
import { MAP_CENTER } from '../config';
import type { LngLat, MapMarker } from '../data/types';

// 種別ごとのピンの色
const KIND_COLOR: Record<MapMarker['kind'], string> = {
  shop: '#c9791a',
  restaurant: '#c2417a',
  facility: '#2f6fb3',
  shelter: '#b3261e',
  park: '#2d8a4e',
  station: '#6b4fb3',
  event: '#0f7f7a',
  area: '#4b5a52',
};

const STYLE: StyleSpecification = {
  version: 8,
  sources: {
    gsi: {
      type: 'raster',
      tiles: ['https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 18,
      attribution:
        '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">国土地理院</a>',
    },
  },
  layers: [{ id: 'gsi', type: 'raster', source: 'gsi' }],
};

interface Props {
  markers: MapMarker[];
  center?: LngLat;
  zoom?: number;
  height?: number;
  label?: string;
}

function popupContent(m: MapMarker): HTMLElement {
  const box = document.createElement('div');
  const link = document.createElement('a');
  link.href = m.href;
  link.textContent = m.title;
  box.append(link);
  if (m.subtitle) {
    const sub = document.createElement('div');
    sub.textContent = m.subtitle;
    box.append(sub);
  }
  return box;
}

export default function MapView({ markers, center = MAP_CENTER, zoom = 14, height = 360, label = '地図' }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let map: import('maplibre-gl').Map | undefined;
    let cancelled = false;

    // 画面に近づいてから地図ライブラリを読み込んで描画する
    const observer = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const maplibregl = await import('maplibre-gl');
        if (cancelled) return;
        maplibregl.setWorkerUrl(workerUrl);
        map = new maplibregl.Map({ container: el, style: STYLE, center, zoom, cooperativeGestures: true });
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

        const bounds = new maplibregl.LngLatBounds();
        for (const m of markers) {
          new maplibregl.Marker({ color: KIND_COLOR[m.kind] })
            .setLngLat([m.lng, m.lat])
            .setPopup(new maplibregl.Popup({ offset: 24 }).setDOMContent(popupContent(m)))
            .addTo(map);
          bounds.extend([m.lng, m.lat]);
        }
        if (markers.length > 1) {
          map.fitBounds(bounds, { padding: 48, maxZoom: 16, duration: 0 });
        } else if (markers.length === 1) {
          map.setCenter([markers[0].lng, markers[0].lat]);
        }
      },
      { rootMargin: '300px' },
    );
    observer.observe(el);

    return () => {
      cancelled = true;
      observer.disconnect();
      map?.remove();
    };
  }, [markers, center, zoom]);

  return <Box ref={ref} h={height} role="region" aria-label={label} bd="1px solid var(--mantine-color-default-border)" />;
}
