import { Navbar } from '@/components/navbar'
import { Footer } from '@/components/footer'
import { CheckCropView } from '@/components/detect/check-crop-view'

export const metadata = {
  title: 'Check my crop — Prahari',
  description:
    'Image-based potato leaf disease detection (healthy / early blight / late blight) using a trained, validated classifier. Reports real confidence, flags uncertainty, and never replaces an expert.',
}

export default function CheckCropPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <CheckCropView />
      <Footer />
    </main>
  )
}
