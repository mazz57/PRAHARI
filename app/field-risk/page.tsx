import { FieldRiskView } from '@/components/risk/field-risk-view'

export const metadata = {
  title: 'Field Risk — PRAVAAH',
  description:
    'Weather-driven early warning for crop disease, using the Hutton criterion and Wallin severity.',
}

export default function FieldRiskPage() {
  return <FieldRiskView />
}
