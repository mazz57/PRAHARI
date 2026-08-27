'use client';
import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { bandToSemantic } from '@/lib/disease-risk/band';

/**
 * MapLibre field map – displays field points colored by risk band.
 * No district centre marker is added (per user request).
 */

/**
 * Resolve any CSS color — including custom-property references like
 * `var(--foreground)` and modern `oklch(...)` tokens — to a concrete color
 * string that MapLibre's WebGL parser understands.
 *
 * MapLibre parses colors itself and cannot read CSS variables (they only
 * resolve in the browser's DOM/CSS engine), so a raw `var(--foreground)` makes
 * it throw "Could not parse color". We resolve the value via a hidden probe
 * element whose computed `color` the browser always serialises to rgb().
 */
function resolveColor(value: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const probe = document.createElement('span');
  probe.style.color = fallback; // baseline; stays if `value` is invalid
  probe.style.color = value;
  probe.style.display = 'none';
  document.body.appendChild(probe);
  const computed = getComputedStyle(probe).color;
  document.body.removeChild(probe);
  return computed || fallback;
}

export function FieldMap({
  fields,
  district,
  selectedId,
  onSelect,
}: {
  fields: import('@/lib/disease-risk/api-types').FieldRiskResult[];
  district: import('@/lib/disease-risk/api-types').DistrictInfo;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Resolve all CSS tokens to concrete colors up front — MapLibre can't read var().
    const strokeSelected = resolveColor('var(--foreground)', '#111111');
    const geojson = {
      type: 'FeatureCollection' as const,
      features: fields.map((f) => {
        const semantic = bandToSemantic(f.band);
        return {
          type: 'Feature' as const,
          geometry: {
            type: 'Point' as const,
            coordinates: [f.coords.lon, f.coords.lat],
          },
          properties: {
            fieldId: f.fieldId,
            icon: semantic.icon,
            color: resolveColor(semantic.color, '#16a34a'),
            onColor: resolveColor(semantic.onColor, '#ffffff'),
          },
        };
      }),
    };

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/positron',
      center: [district.center.lon, district.center.lat],
      zoom: 13,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }));
    map.on('load', () => {
      map.addSource('fields', {
        type: 'geojson',
        data: geojson,
      });
      map.addLayer({
        id: 'field-circles',
        type: 'circle',
        source: 'fields',
        paint: {
          'circle-radius': ['case', ['==', ['get', 'fieldId'], selectedId ?? ''], 8, 6],
          'circle-color': ['get', 'color'],
          'circle-stroke-color': ['case', ['==', ['get', 'fieldId'], selectedId ?? ''], strokeSelected, 'white'],
          'circle-stroke-width': ['case', ['==', ['get', 'fieldId'], selectedId ?? ''], 2, 1],
        },
      });
      map.addLayer({
        id: 'field-labels',
        type: 'symbol',
        source: 'fields',
        layout: {
          'text-field': ['get', 'icon'],
          'text-size': 20,
          'text-anchor': 'top',
          'text-offset': [0, 0.6],
        },
        paint: {
          'text-color': ['get', 'onColor'],
        },
      });
    });
    if (onSelect) {
      map.on('click', 'field-circles', (e: maplibregl.MapLayerMouseEvent) => {
        const features = e.features;
        if (!features || !features[0]) return;
        const fieldId = (features[0].properties?.fieldId as unknown) as string;
        onSelect(fieldId);
      });
    }
    const handleResize = () => {
      map.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapRef.current = null;
    };
  }, [fields, district.center.lat, district.center.lon, selectedId, onSelect]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-lg border border-border bg-muted/30"
      style={{ minHeight: '300px' }}
    />
  );
}
