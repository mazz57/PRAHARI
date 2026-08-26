'use client';
import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { bandToSemantic } from '@/lib/disease-risk/band';

/**
 * MapLibre field map – displays field points colored by risk band.
 * No district centre marker is added (per user request).
 */
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

  // Build GeoJSON source from fields
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
          color: semantic.color,
          onColor: semantic.onColor,
        },
      };
    }),
  };

  useEffect(() => {
    if (!containerRef.current) return;
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
          'circle-stroke-color': ['case', ['==', ['get', 'fieldId'], selectedId ?? ''], 'var(--foreground)', 'white'],
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
  }, [containerRef, geojson, district.center.lat, district.center.lon, selectedId, onSelect]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-lg border border-border bg-muted/30"
      style={{ minHeight: '300px' }}
    />
  );
}
