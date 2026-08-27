import { CheckCropView } from '@/components/detect/check-crop-view'

export const metadata = {
  title: 'Crop Health — PRAHARI',
  description:
    'Photograph a potato leaf to check for disease (healthy / early blight / late blight) with a trained, validated classifier. Reports real confidence, flags uncertainty, and never replaces an expert.',
}

export default function CropHealthPage() {
  return <CheckCropView />
}
