import { products as staticProducts, type Product } from '@/data/products'

let runtimeProducts: Product[] = staticProducts

export function getCatalogProducts() {
  return runtimeProducts
}

export function setCatalogProducts(products: Product[]) {
  runtimeProducts = products.length ? products : staticProducts
}
