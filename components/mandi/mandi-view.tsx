'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  TrendingUp,
  Building2,
  Calendar,
  AlertCircle,
  RefreshCw,
  Search,
  CheckCircle2,
  Tag,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { MandiRecord, MandiResponse } from '@/lib/mandi/types'

const QUICK_DISTRICTS = ['All', 'Farrukhabad', 'Agra', 'Kannauj', 'Kanpur', 'Mainpuri', 'Aligarh']

export function MandiView() {
  const [commodity, setCommodity] = useState('Potato')
  const [state, setState] = useState('Uttar Pradesh')
  const [district, setDistrict] = useState('Farrukhabad')
  const [marketSearch, setMarketSearch] = useState('')
  const [data, setData] = useState<MandiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPrices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (commodity) params.set('commodity', commodity)
      if (state) params.set('state', state)
      if (district && district !== 'All') params.set('district', district)

      const res = await fetch(`/api/mandi?${params.toString()}`)
      const json: MandiResponse = await res.json()

      setData(json)
      if (json.dataStatus === 'unavailable' && json.message) {
        setError(json.message)
      }
    } catch {
      setError('Unable to load mandi prices. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }, [commodity, state, district])

  useEffect(() => {
    fetchPrices()
  }, [fetchPrices])

  // Filter records by market text search if user types in search bar
  const filteredRecords = useMemo(() => {
    if (!data || !Array.isArray(data.records)) return []
    if (!marketSearch.trim()) return data.records

    const q = marketSearch.toLowerCase().trim()
    return data.records.filter(
      (r) =>
        r.market.toLowerCase().includes(q) ||
        r.district.toLowerCase().includes(q) ||
        r.variety.toLowerCase().includes(q)
    )
  }, [data, marketSearch])

  // Find the highest reported modal price
  const highestModalRecord = useMemo<MandiRecord | null>(() => {
    if (filteredRecords.length === 0) return null
    return filteredRecords.reduce((max, r) => (r.modalPrice > (max?.modalPrice ?? 0) ? r : max), filteredRecords[0])
  }, [filteredRecords])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Mandi Intelligence</h1>
            {data?.dataStatus === 'live' ? (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Live Gov Data
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Live Feed Offline
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time wholesale market prices and arrivals for agricultural produce.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPrices()}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <a
            href="https://data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            Source: data.gov.in <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Filter controls */}
      <Card className="border border-border bg-card">
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Commodity */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Commodity</label>
              <div className="flex items-center gap-2">
                <Input
                  value={commodity}
                  onChange={(e) => setCommodity(e.target.value)}
                  placeholder="e.g. Potato"
                  className="bg-background"
                />
              </div>
            </div>

            {/* State */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">State</label>
              <Input
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Uttar Pradesh"
                className="bg-background"
              />
            </div>

            {/* District */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">District</label>
              <Input
                value={district === 'All' ? '' : district}
                onChange={(e) => setDistrict(e.target.value || 'All')}
                placeholder="Filter district or leave empty"
                className="bg-background"
              />
            </div>

            {/* Market Search */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Search Market / Mandi</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={marketSearch}
                  onChange={(e) => setMarketSearch(e.target.value)}
                  placeholder="Filter table..."
                  className="pl-9 bg-background"
                />
              </div>
            </div>
          </div>

          {/* Quick district selector */}
          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border/50">
            <span className="text-xs text-muted-foreground">Quick districts:</span>
            {QUICK_DISTRICTS.map((d) => (
              <Button
                key={d}
                variant={district === d ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setDistrict(d)}
              >
                {d}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Key Missing or Service Offline Alert */}
      {data?.dataStatus === 'unavailable' && (
        <Alert variant="destructive" className="border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
          <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="font-semibold text-amber-800 dark:text-amber-300">
            Government Mandi Live Feed Unavailable
          </AlertTitle>
          <AlertDescription className="text-sm mt-1 text-amber-700 dark:text-amber-300/90">
            {error ||
              'The live feed from data.gov.in requires a DATA_GOV_IN_API_KEY configured in the server environment. No synthetic or fake prices are generated.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Highest Modal Price Highlight Card */}
      {highestModalRecord && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <CardTitle className="text-base font-semibold">Highest Reported Modal Price</CardTitle>
              </div>
              <Badge variant="outline" className="text-xs">
                {highestModalRecord.commodity} • {highestModalRecord.variety}
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Highest modal selling rate among reported markets in this query. Net farmer return depends on transport costs and local mandi arrival volumes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <span className="text-xs text-muted-foreground">Mandi / Market</span>
                <p className="text-lg font-bold text-foreground flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-4 h-4 text-primary" />
                  {highestModalRecord.market}
                </p>
                <span className="text-xs text-muted-foreground">{highestModalRecord.district}, {highestModalRecord.state}</span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground">Modal Price</span>
                <p className="text-2xl font-extrabold text-primary mt-0.5">
                  ₹{highestModalRecord.modalPrice.toLocaleString('en-IN')}
                  <span className="text-xs font-normal text-muted-foreground ml-1">/ quintal</span>
                </p>
                <span className="text-xs text-muted-foreground">
                  Range: ₹{highestModalRecord.minPrice.toLocaleString('en-IN')} – ₹{highestModalRecord.maxPrice.toLocaleString('en-IN')}
                </span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground">Reported Date & Grade</span>
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  {highestModalRecord.arrivalDate}
                </p>
                <span className="text-xs text-muted-foreground">Grade: {highestModalRecord.grade}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Table / Grid View */}
      <Card className="border border-border bg-card">
        <CardHeader className="pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Mandi Rates Summary
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Source: Government of India — data.gov.in / AGMARKNET
              {data?.updatedAt ? ` • Updated ${data.updatedAt}` : ''}
            </CardDescription>
          </div>
          {data?.records && (
            <Badge variant="secondary" className="text-xs">
              {filteredRecords.length} {filteredRecords.length === 1 ? 'Record' : 'Records'}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3 py-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-muted/60 mx-auto flex items-center justify-center text-muted-foreground">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">No mandi records to display</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {data?.dataStatus === 'unavailable'
                  ? 'Connect a valid DATA_GOV_IN_API_KEY to fetch live daily prices directly from the Ministry of Agriculture.'
                  : 'No active arrivals reported for the selected filters. Try broadening the district or commodity search.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                    <th className="py-3 px-4 font-semibold">Market / Mandi</th>
                    <th className="py-3 px-4 font-semibold">District</th>
                    <th className="py-3 px-4 font-semibold">Variety</th>
                    <th className="py-3 px-4 font-semibold">Grade</th>
                    <th className="py-3 px-4 font-semibold text-right">Min Price</th>
                    <th className="py-3 px-4 font-semibold text-right">Modal Price</th>
                    <th className="py-3 px-4 font-semibold text-right">Max Price</th>
                    <th className="py-3 px-4 font-semibold text-center">Arrival Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredRecords.map((r, i) => (
                    <tr
                      key={`${r.market}-${r.variety}-${r.arrivalDate}-${i}`}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                          <span>{r.market}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{r.district}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className="text-xs font-normal">
                          {r.variety}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{r.grade}</td>
                      <td className="py-3 px-4 text-right text-muted-foreground font-mono">
                        ₹{r.minPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-foreground font-mono">
                        ₹{r.modalPrice.toLocaleString('en-IN')}
                        <span className="text-[10px] font-normal text-muted-foreground block">/ quintal</span>
                      </td>
                      <td className="py-3 px-4 text-right text-muted-foreground font-mono">
                        ₹{r.maxPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-muted-foreground">
                        {r.arrivalDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
