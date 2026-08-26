'use client'

import { bandToSemantic } from '@/lib/disease-risk/band'
import type { FieldRiskResult, DistrictInfo } from '@/lib/disease-risk/api-types'

/**
 * Minimal field map — an SVG scatter of the district's fields, coloured by band. Deliberately not a
 * tiled web map: it needs no API key, no network tiles, and no extra dependency, which keeps the
 * prototype honest and self-contained. Positions are the fields' real coordinates, projected to the
 * view box; it is a schematic, not a survey.
 */
export function FieldMap({
  fields,
  district,
  selectedId,
  onSelect,
}: {
  fields: FieldRiskResult[]
  district: DistrictInfo
  selectedId?: string | null
  onSelect?: (id: string) => void
}) {
  const pts = fields.map((f) => ({ lat: f.coords.lat, lon: f.coords.lon }))
  pts.push({ lat: district.center.lat, lon: district.center.lon })
  const lats = pts.map((p) => p.lat)
  const lons = pts.map((p) => p.lon)
  const pad = 0.03
  const minLat = Math.min(...lats) - pad
  const maxLat = Math.max(...lats) + pad
  const minLon = Math.min(...lons) - pad
  const maxLon = Math.max(...lons) + pad
  const W = 100
  const H = 100
  // Latitude increases upward, so invert Y.
  const x = (lon: number) => ((lon - minLon) / (maxLon - minLon)) * W
  const y = (lat: number) => H - ((lat - minLat) / (maxLat - minLat)) * H

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full rounded-lg border border-border bg-muted/30" role="img" aria-label="Field map">
      {/* faint grid */}
      {[20, 40, 60, 80].map((g) => (
        <g key={g} stroke="var(--border)" strokeWidth={0.2}>
          <line x1={g} y1={0} x2={g} y2={H} />
          <line x1={0} y1={g} x2={W} y2={g} />
        </g>
      ))}
      {/* district centre */}
      <circle cx={x(district.center.lon)} cy={y(district.center.lat)} r={1.4} fill="var(--muted-foreground)" />
      <text x={x(district.center.lon) + 2} y={y(district.center.lat) - 2} fontSize={3} fill="var(--muted-foreground)">
        {district.nameEn}
      </text>
      {/* fields */}
      {fields.map((f) => {
        const s = bandToSemantic(f.band)
        const selected = selectedId === f.fieldId
        return (
          <g key={f.fieldId} onClick={() => onSelect?.(f.fieldId)} style={{ cursor: onSelect ? 'pointer' : 'default' }}>
            <circle
              cx={x(f.coords.lon)}
              cy={y(f.coords.lat)}
              r={selected ? 4.2 : 3.4}
              fill={s.color}
              stroke={selected ? 'var(--foreground)' : 'white'}
              strokeWidth={selected ? 1 : 0.6}
            />
            <text x={x(f.coords.lon)} y={y(f.coords.lat) + 0.9} fontSize={3.4} textAnchor="middle" fill={s.onColor} fontWeight="bold">
              {s.icon}
            </text>
            <text x={x(f.coords.lon)} y={y(f.coords.lat) + 7} fontSize={2.8} textAnchor="middle" fill="var(--foreground)">
              {f.fieldName}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
