import Link from 'next/link'
import { ArrowUpRight, MapPin } from 'lucide-react'
import { ProductPage, PageIntro, Surface } from '@/components/product-shell'
import { DEMO_FIELDS } from '@/lib/fields'
export const metadata = { title: 'My Fields — PRAVAAH' }
export default function FieldsPage(){return <ProductPage><PageIntro eyebrow="Your farm" title="My Fields" description="See how each field is doing."/><div className="field-list">{DEMO_FIELDS.map((field,i)=><Surface key={field.id} className="field-row"><div className={`field-image field-image-${i}`}><span>{field.areaLocal}</span></div><div className="field-copy"><p className="eyebrow">Potato · {field.district}</p><h2>{field.nameEn}</h2><p><MapPin className="inline h-4 w-4"/> {field.center.lat.toFixed(2)}° N, {field.center.lon.toFixed(2)}° E</p></div><div className="field-status"><span className="status-dot status-unknown"/>Data available to check<p>Risk is calculated from live weather</p></div><Link href="/field-risk" className="icon-button" aria-label={`Open ${field.nameEn}`}><ArrowUpRight/></Link></Surface>)}</div></ProductPage>}
