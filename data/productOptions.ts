export type GloveHand =
  | 'left'
  | 'right'

export const POLO_SIZES = [
  'S',
  'M',
  'L',
  'XL',
  'XXL',
] as const

export const GLOVE_SIZES = [
  'S',
  'M',
  'L',
  'XL',
  'XXL',
] as const

export const GLOVE_HANDS: {
  value: GloveHand
  label: string
}[] = [
  {
    value: 'left',
    label: 'Left Hand',
  },
  {
    value: 'right',
    label: 'Right Hand',
  },
]

export const getProductSizeOptions = (
  productId: number
): readonly string[] => {
  if (productId === 1) {
    return POLO_SIZES
  }

  if (productId === 9) {
    return GLOVE_SIZES
  }

  return []
}

export const productRequiresSize = (
  productId: number
) =>
  getProductSizeOptions(
    productId
  ).length > 0

export const productRequiresGloveHand = (
  productId: number
) =>
  productId === 9

export const isValidProductSize = (
  productId: number,
  size?: string
) => {
  if (
    !productRequiresSize(
      productId
    )
  ) {
    return true
  }

  if (!size) {
    return false
  }

  return getProductSizeOptions(
    productId
  ).includes(size)
}

export const isValidGloveHand = (
  productId: number,
  hand?: string
) => {
  if (
    !productRequiresGloveHand(
      productId
    )
  ) {
    return true
  }

  return (
    hand === 'left' ||
    hand === 'right'
  )
}

export const getGloveHandDisplay = (
  hand?: string
) => {
  if (hand === 'left') {
    return 'Left Hand'
  }

  if (hand === 'right') {
    return 'Right Hand'
  }

  return ''
}
