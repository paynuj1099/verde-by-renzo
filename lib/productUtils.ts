import type { Product } from '@/data/products'
import { getCatalogProducts } from '@/lib/productCatalog'

export function getProductById(
  id: number
): Product | undefined {
  return getCatalogProducts().find(
    (product) =>
      product.id === id
  )
}

export function getProductImage(
  product: Product,
  color?: string
): string | null {
  const selectedColor =
    color ||
    product.colors[0]

  if (
    selectedColor &&
    product.images[selectedColor]
  ) {
    return product.images[
      selectedColor
    ]
  }

  const firstImage =
    Object.values(
      product.images
    )[0]

  return firstImage || null
}

export function getColorDisplay(
  color: string
): string {
  const colors: Record<
    string,
    string
  > = {
    forest:
      'Forest Green',

    black:
      'Black',

    gold:
      'Gold',

    ivory:
      'Ivory',

    navy:
      'Navy Blue',

    cream:
      'Cream',

    khaki:
      'Khaki',

    white:
      'White',

    burgundy:
      'Burgundy',

    'green-gold':
      'Green / Gold',
  }

  return (
    colors[color] ||
    color.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
  )
}

export function getColorClass(
  color: string
): string {
  const classes: Record<
    string,
    string
  > = {
    forest:
      'bg-[#123C2D]',

    black:
      'bg-black',

    gold:
      'bg-[#C9A15B]',

    ivory:
      'bg-[#F5F1E8]',

    navy:
      'bg-[#1F2A44]',

    cream:
      'bg-[#FFF4D6]',

    khaki:
      'bg-[#C3B091]',

    white:
      'bg-white',

    burgundy:
      'bg-[#800020]',

    'green-gold':
      'bg-[repeating-linear-gradient(45deg,#123C2D_0px,#123C2D_6px,#C9A15B_6px,#C9A15B_12px)]',
  }

  return (
    classes[color] ||
    'bg-gray-400'
  )
}

export function getColorStyle(
  color: string,
  colorHexes?: Record<string, string>
): { backgroundColor?: string } {
  return colorHexes?.[color]
    ? { backgroundColor: colorHexes[color] }
    : {}
}
