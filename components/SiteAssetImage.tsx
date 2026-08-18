'use client'

import Image from 'next/image'
import { useSiteAssets } from '@/context/SiteAssetsContext'

type SiteAssetImageProps = {
  assetId: string
  alt: string
  className?: string
  sizes?: string
  priority?: boolean
  fill?: boolean
}

export default function SiteAssetImage({ assetId, alt, className, sizes, priority }: SiteAssetImageProps) {
  const { getAsset } = useSiteAssets()
  const src = getAsset(assetId)
  if (!src) return <div className="absolute inset-0 animate-pulse bg-gray-100" aria-label={`Loading ${alt}`} />
  return <Image src={src} alt={alt} fill className={className} sizes={sizes} priority={priority} />
}
