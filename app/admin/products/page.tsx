'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc } from 'firebase/firestore'
import { getIdTokenResult } from 'firebase/auth'
import { upload } from '@imagekit/next'
import { Eye, Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { firestore } from '@/lib/firebase'
import type { Product } from '@/data/products'
import { getColorClass, getColorDisplay, getColorStyle } from '@/lib/productUtils'

type ProductRecord = Product & { docId: string; active?: boolean; newArrivalOrder?: number }
type ProductForm = {
  name: string
  category: string
  price: string
  colors: string[]
  colorHexes: Record<string, string>
  image: string
  images: Record<string, string>
  imageFileIds: Record<string, string>
  description: string
  longDescription: string
  materials: string
  features: string
  care: string
  includes: string
  sizeGuideHref: string
  isNew: boolean
  isPopular: boolean
  active: boolean
}

const availableColors = ['forest', 'black', 'gold', 'ivory', 'navy', 'cream', 'khaki', 'white', 'burgundy', 'green-gold']
const emptyForm: ProductForm = { name: '', category: 'ACCESSORIES', price: '', colors: [], colorHexes: {}, image: '', images: {}, imageFileIds: {}, description: '', longDescription: '', materials: '', features: '', care: '', includes: '', sizeGuideHref: '', isNew: true, isPopular: false, active: true }
const parseList = (value: string) => value.split(/\n|,/).map((item) => item.trim()).filter(Boolean)

export default function ProductAdminPage() {
  const { user, loading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checkingRole, setCheckingRole] = useState(true)
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ProductRecord | null>(null)
  const [editingDocId, setEditingDocId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [customColorName, setCustomColorName] = useState('')
  const [customColorHex, setCustomColorHex] = useState('#808080')
  const [uploadingColor, setUploadingColor] = useState<string | null>(null)
  const [uploadingArrivalDocId, setUploadingArrivalDocId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [arrivalFilter, setArrivalFilter] = useState('ALL')
  const [catalogPage, setCatalogPage] = useState(1)
  const [newArrivalSearch, setNewArrivalSearch] = useState('')
  const [newArrivalCategory, setNewArrivalCategory] = useState('ALL')
  const [newArrivalStatus, setNewArrivalStatus] = useState('ALL')
  const [newArrivalPage, setNewArrivalPage] = useState(1)

  const loadProducts = async () => {
    const snapshot = await getDocs(collection(firestore, 'products'))
    setProducts(snapshot.docs.map((item) => ({ ...item.data(), docId: item.id } as ProductRecord)).sort((a, b) => b.id - a.id))
  }

  useEffect(() => {
    if (!user) {
      setCheckingRole(false)
      return
    }
    getIdTokenResult(user, true).then((token) => {
      const allowed = token.claims.admin === true
      setIsAdmin(allowed)
      setCheckingRole(false)
      if (allowed) loadProducts().catch(console.error)
    }).catch(() => setCheckingRole(false))
  }, [user])

  useEffect(() => {
    if (!message) return
    const timeout = window.setTimeout(() => setMessage(''), 3000)
    return () => window.clearTimeout(timeout)
  }, [message])

  useEffect(() => {
    if (!formOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) cancelEdit()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [formOpen, saving])

  const saveProduct = async (event: FormEvent) => {
    event.preventDefault()
    const colors = form.colors
    if (!form.name || !form.price || !colors.length) return
    const fallbackImage = form.image.trim()
    const missingImage = colors.some((color) => !(form.images[color]?.trim() || fallbackImage))
    if (missingImage) {
      setMessage('Add an image for every selected color, or provide a fallback image.')
      return
    }
    setSaving(true)
    setMessage('')
    try {
      const images = Object.fromEntries(colors.map((color) => [
        color,
        form.images[color]?.trim() || fallbackImage,
      ]))
      const productFields = {
        name: form.name.trim(),
        category: form.category.trim().toUpperCase(),
        price: Number(form.price),
        colors,
        colorHexes: Object.fromEntries(colors.filter((color) => form.colorHexes[color]).map((color) => [color, form.colorHexes[color]])),
        images,
        imageFileIds: Object.fromEntries(colors.filter((color) => form.imageFileIds[color]).map((color) => [color, form.imageFileIds[color]])),
        description: form.description.trim(),
        longDescription: form.longDescription.trim() || form.description.trim(),
        materials: parseList(form.materials),
        features: parseList(form.features),
        care: parseList(form.care),
        includes: parseList(form.includes),
        sizeGuideHref: form.sizeGuideHref.trim(),
        isNew: form.isNew,
        isPopular: form.isPopular,
        active: form.active,
        updatedAt: serverTimestamp(),
      }
      if (editingDocId) {
        await updateDoc(doc(firestore, 'products', editingDocId), productFields)
      } else {
        const nextArrivalOrder = products.filter((product) => product.isNew).length + 1
        await addDoc(collection(firestore, 'products'), {
          ...productFields,
          id: Date.now(),
          newArrivalOrder: form.isNew ? nextArrivalOrder : undefined,
          createdAt: serverTimestamp(),
        })
      }
      setForm(emptyForm)
      setEditingDocId(null)
      setFormOpen(false)
      await loadProducts()
      setCatalogPage(1)
      setMessage(editingDocId ? 'Product updated successfully.' : 'Product added successfully.')
    } catch (error) {
      console.error(error)
      setMessage('Unable to save product. Confirm your admin role and Firestore rules.')
    } finally {
      setSaving(false)
    }
  }

  const editProduct = (product: ProductRecord) => {
    setEditingDocId(product.docId)
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      colors: product.colors,
      colorHexes: product.colorHexes || {},
      image: Object.values(product.images)[0] || '',
      images: product.images || {},
      imageFileIds: product.imageFileIds || {},
      description: product.description,
      longDescription: product.longDescription || '',
      materials: (product.materials || []).join('\n'),
      features: (product.features || []).join('\n'),
      care: (product.care || []).join('\n'),
      includes: (product.includes || []).join('\n'),
      sizeGuideHref: product.sizeGuideHref || '',
      isNew: product.isNew === true,
      isPopular: product.isPopular === true,
      active: product.active !== false,
    })
    setMessage('')
    setFormOpen(true)
  }

  const cancelEdit = () => {
    setEditingDocId(null)
    setForm(emptyForm)
    setFormOpen(false)
  }

  const openAddProduct = () => {
    setEditingDocId(null)
    setForm(emptyForm)
    setMessage('')
    setFormOpen(true)
  }

  const uploadColorImage = async (color: string, file?: File) => {
    if (!file || !user) return
    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file.')
      return
    }
    setUploadingColor(color)
    setMessage('')
    try {
      const idToken = await user.getIdToken()
      const authResponse = await fetch('/api/imagekit-auth', {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      const auth = await authResponse.json()
      if (!authResponse.ok) throw new Error(auth.error || 'Unable to authorize upload.')
      const result = await upload({
        file,
        fileName: `${form.name || 'product'}-${color}-${file.name}`.replace(/[^a-zA-Z0-9._-]/g, '-'),
        folder: `/verdebyrenzo/products/${(form.name || 'unassigned').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unassigned'}`,
        useUniqueFileName: true,
        token: auth.token,
        signature: auth.signature,
        expire: auth.expire,
        publicKey: auth.publicKey,
      })
      if (!result.url || !result.fileId) throw new Error('ImageKit did not return complete file details.')
      const uploadedUrl = result.url
      const uploadedFileId = result.fileId
      setForm((current) => ({ ...current, images: { ...current.images, [color]: uploadedUrl }, imageFileIds: { ...current.imageFileIds, [color]: uploadedFileId } }))
      setMessage(`${getColorDisplay(color)} image uploaded successfully.`)
    } catch (error) {
      console.error(error)
      setMessage(error instanceof Error ? error.message : 'Unable to upload image to ImageKit.')
    } finally {
      setUploadingColor(null)
    }
  }

  const updateNewArrival = async (product: ProductRecord, isNew: boolean, order?: number) => {
    setSaving(true)
    setMessage('')
    try {
      await updateDoc(doc(firestore, 'products', product.docId), {
        isNew,
        newArrivalOrder: Number.isFinite(order) ? order : product.newArrivalOrder ?? products.filter((item) => item.isNew && item.docId !== product.docId).length + 1,
        updatedAt: serverTimestamp(),
      })
      await loadProducts()
      setMessage('New Arrivals updated successfully.')
    } catch (error) {
      console.error(error)
      setMessage('Unable to update New Arrivals.')
    } finally {
      setSaving(false)
    }
  }

  const uploadNewArrivalImage = async (product: ProductRecord, file?: File) => {
    if (!file || !user) return
    if (!file.type.startsWith('image/')) {
      setMessage('Please select an image file.')
      return
    }
    setUploadingArrivalDocId(product.docId)
    setMessage('')
    try {
      const idToken = await user.getIdToken()
      const authResponse = await fetch('/api/imagekit-auth', { headers: { Authorization: `Bearer ${idToken}` } })
      const auth = await authResponse.json()
      if (!authResponse.ok) throw new Error(auth.error || 'Unable to authorize upload.')
      const productSlug = product.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'product'
      const result = await upload({
        file,
        fileName: `${productSlug}-new-arrival-${file.name}`.replace(/[^a-zA-Z0-9._-]/g, '-'),
        folder: `/verdebyrenzo/products/${productSlug}`,
        useUniqueFileName: true,
        token: auth.token,
        signature: auth.signature,
        expire: auth.expire,
        publicKey: auth.publicKey,
      })
      if (!result.url || !result.fileId) throw new Error('ImageKit did not return complete file details.')
      await updateDoc(doc(firestore, 'products', product.docId), {
        newArrivalImage: result.url,
        newArrivalFileId: result.fileId,
        updatedAt: serverTimestamp(),
      })
      const previousFileId = product.newArrivalFileId
      const previousIsShared = previousFileId && Object.values(product.imageFileIds || {}).includes(previousFileId)
      if (previousFileId && previousFileId !== result.fileId && !previousIsShared) {
        await fetch('/api/imagekit-files', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ fileIds: [previousFileId] }),
        })
      }
      await loadProducts()
      setMessage('New Arrival image uploaded successfully.')
    } catch (error) {
      console.error(error)
      setMessage(error instanceof Error ? error.message : 'Unable to upload the New Arrival image.')
    } finally {
      setUploadingArrivalDocId(null)
    }
  }

  const deleteProduct = (product: ProductRecord) => {
    setDeleteTarget(product)
  }

  const confirmDeleteProduct = async () => {
    if (!deleteTarget) return
    const product = deleteTarget
    setSaving(true)
    setMessage('')
    try {
      const fileIds = Array.from(new Set([...Object.values(product.imageFileIds || {}), product.newArrivalFileId || ''].filter(Boolean)))
      if (fileIds.length) {
        const idToken = await user!.getIdToken()
        const response = await fetch('/api/imagekit-files', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ fileIds }),
        })
        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || 'Unable to delete product images from ImageKit.')
        }
      }
      await deleteDoc(doc(firestore, 'products', product.docId))
      if (editingDocId === product.docId) cancelEdit()
      await loadProducts()
      setDeleteTarget(null)
      setMessage(`${product.name} was deleted from the shop.`)
    } catch (error) {
      console.error(error)
      setMessage('Unable to delete the product.')
    } finally {
      setSaving(false)
    }
  }

  const categories = Array.from(new Set(products.map((product) => product.category))).sort()
  const filteredProducts = products.filter((product) => {
    const matchesSearch = `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'ALL' || product.category === categoryFilter
    const matchesArrival = arrivalFilter === 'ALL' || (arrivalFilter === 'NEW' ? product.isNew === true : product.isNew !== true)
    return matchesSearch && matchesCategory && matchesArrival
  })
  const catalogPageSize = 5
  const catalogPageCount = Math.max(1, Math.ceil(filteredProducts.length / catalogPageSize))
  const currentCatalogPage = Math.min(catalogPage, catalogPageCount)
  const paginatedCatalogProducts = filteredProducts.slice((currentCatalogPage - 1) * catalogPageSize, currentCatalogPage * catalogPageSize)
  const arrivalEditorProducts = [...products].filter((product) => {
    const matchesSearch = `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(newArrivalSearch.toLowerCase())
    const matchesCategory = newArrivalCategory === 'ALL' || product.category === newArrivalCategory
    const matchesStatus = newArrivalStatus === 'ALL' || (newArrivalStatus === 'SHOWN' ? product.isNew === true : product.isNew !== true)
    return matchesSearch && matchesCategory && matchesStatus
  }).sort((a, b) => {
    if (a.isNew !== b.isNew) return a.isNew ? -1 : 1
    const aOrder = a.newArrivalOrder ?? a.id
    const bOrder = b.newArrivalOrder ?? b.id
    return aOrder - bOrder
  })
  const newArrivalPageSize = 8
  const newArrivalPageCount = Math.max(1, Math.ceil(arrivalEditorProducts.length / newArrivalPageSize))
  const currentNewArrivalPage = Math.min(newArrivalPage, newArrivalPageCount)
  const paginatedArrivalProducts = arrivalEditorProducts.slice((currentNewArrivalPage - 1) * newArrivalPageSize, currentNewArrivalPage * newArrivalPageSize)

  if (loading || checkingRole) return <main className="min-h-screen bg-gray-50 pt-32 text-center">Checking access...</main>
  if (!user) return <main className="min-h-screen bg-gray-50 pt-32 text-center"><p className="mb-4">Sign in to access product management.</p><Link href="/login" className="font-semibold text-forest-600">Go to login</Link></main>
  if (!isAdmin) return <main className="min-h-screen bg-gray-50 pt-32 text-center"><h1 className="font-serif text-2xl text-forest-800">Administrator access required</h1><p className="mx-auto mt-3 max-w-lg text-gray-600">Sign out and sign in again to refresh this account’s administrator access.</p></main>

  return (
    <main className="min-h-screen bg-gray-50 pb-16 pt-32">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div><h1 className="font-serif text-3xl text-forest-800">Product Management</h1><p className="text-gray-500">{products.length} products in Firestore</p></div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={openAddProduct} className="flex items-center gap-2 rounded-lg bg-forest-600 px-5 py-3 font-semibold text-white"><Plus size={18} />Add Product</button>
          </div>
        </div>
        {message && <div className="mb-6 flex items-center justify-between gap-4 rounded-lg bg-white p-4 text-sm text-gray-700 shadow" role="status"><span>{message}</span><button type="button" onClick={() => setMessage('')} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Dismiss notification"><X size={17} /></button></div>}

        {deleteTarget && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4" role="alertdialog" aria-modal="true" aria-labelledby="delete-product-title" aria-describedby="delete-product-description" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) setDeleteTarget(null) }}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600"><Trash2 size={21} /></div>
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={saving} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50" aria-label="Close delete confirmation"><X size={19} /></button>
            </div>
            <h2 id="delete-product-title" className="mt-4 font-serif text-2xl text-gray-900">Delete product?</h2>
            <p id="delete-product-description" className="mt-2 text-sm leading-6 text-gray-600"><span className="font-semibold text-gray-800">{deleteTarget.name}</span> will be permanently removed from Firestore, the shop, and New Arrivals. This action cannot be undone.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={saving} className="rounded-lg border px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
              <button type="button" onClick={confirmDeleteProduct} disabled={saving} className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:bg-red-300"><Trash2 size={16} />{saving ? 'Deleting...' : 'Delete Product'}</button>
            </div>
          </div>
        </div>}

        {formOpen && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="product-form-title" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) cancelEdit() }}>
          <form onSubmit={saveProduct} className="max-h-[90vh] w-full max-w-3xl space-y-4 overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 id="product-form-title" className="flex items-center gap-2 font-serif text-xl text-forest-800">{editingDocId ? <Pencil size={20} /> : <Plus size={20} />}{editingDocId ? 'Edit Product' : 'Add Product'}</h2>
              <button type="button" onClick={cancelEdit} disabled={saving} className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50" aria-label="Close product form"><X size={20} /></button>
            </div>
            <label className="block text-sm font-medium text-gray-700">Product name<input required placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border p-3 font-normal" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium text-gray-700">Category<select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 w-full rounded-lg border bg-white p-3 font-normal"><option value="APPAREL">Apparel</option><option value="BAGS">Bags</option><option value="ACCESSORIES">Accessories</option></select></label>
              <label className="block text-sm font-medium text-gray-700">Price (PHP)<input required min="0" step="0.01" type="number" placeholder="0.00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1 w-full rounded-lg border p-3 font-normal" /></label>
            </div>
            <fieldset>
              <legend className="text-sm font-medium text-gray-700">Available colors <span className="font-normal text-gray-400">(select all that apply)</span></legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {Array.from(new Set([...availableColors, ...form.colors])).map((color) => {
                  const selected = form.colors.includes(color)
                  return <button key={color} type="button" aria-pressed={selected} onClick={() => setForm({ ...form, colors: selected ? form.colors.filter((item) => item !== color) : [...form.colors, color] })} className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs transition ${selected ? 'border-forest-600 bg-forest-50 font-semibold text-forest-800 ring-1 ring-forest-600' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                    <span className={`h-5 w-5 flex-shrink-0 rounded-full border border-black/15 ${getColorClass(color)}`} style={getColorStyle(color, form.colorHexes)} />
                    <span>{getColorDisplay(color)}</span>
                  </button>
                })}
              </div>
              <div className="mt-3 flex flex-wrap items-end gap-2 rounded-lg bg-gray-50 p-3">
                <label className="min-w-40 flex-1 text-xs font-medium text-gray-600">New color name<input value={customColorName} onChange={(e) => setCustomColorName(e.target.value)} placeholder="e.g. Sage Green" className="mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm font-normal" /></label>
                <label className="text-xs font-medium text-gray-600">Color<input type="color" value={customColorHex} onChange={(e) => setCustomColorHex(e.target.value)} className="mt-1 block h-10 w-14 cursor-pointer rounded-lg border bg-white p-1" /></label>
                <button type="button" onClick={() => {
                  const color = customColorName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
                  if (!color) return
                  setForm({ ...form, colors: Array.from(new Set([...form.colors, color])), colorHexes: { ...form.colorHexes, [color]: customColorHex } })
                  setCustomColorName('')
                }} className="rounded-lg border border-forest-600 px-3 py-2 text-sm font-semibold text-forest-700 hover:bg-forest-50"><Plus size={16} className="inline" /> Add Color</button>
              </div>
              {form.colors.length === 0 && <p className="mt-1 text-xs text-red-600">Select at least one color.</p>}
            </fieldset>
            <label className="block text-sm font-medium text-gray-700">Fallback product image URL <span className="font-normal text-gray-400">(optional when every color has an image)</span><input placeholder="Paste an existing image URL" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="mt-1 w-full rounded-lg border p-3 font-normal" /></label>
            {form.colors.length > 0 && <fieldset className="rounded-lg border p-4">
              <legend className="px-1 text-sm font-medium text-gray-700">Images paired to colors</legend>
              <p className="mb-3 text-xs text-gray-500">Add a different local image path or external URL for each color. Leave one blank to use the fallback image.</p>
              <div className="space-y-3">
                {form.colors.map((color) => {
                  const imagePath = form.images[color] || ''
                  const previewPath = imagePath || form.image
                  return <div key={`image-${color}`} className="grid items-center gap-3 rounded-lg bg-gray-50 p-3 sm:grid-cols-[2.5rem_8rem_1fr]">
                    <span className={`h-8 w-8 rounded-full border border-black/15 ${getColorClass(color)}`} style={getColorStyle(color, form.colorHexes)} title={getColorDisplay(color)} />
                    <span className="text-sm font-semibold text-gray-700">{getColorDisplay(color)}</span>
                    <div onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }} onDrop={(e) => { e.preventDefault(); void uploadColorImage(color, e.dataTransfer.files?.[0]) }} className="rounded-lg border border-dashed border-gray-300 p-2 transition hover:border-forest-500 hover:bg-forest-50/40">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input value={imagePath} onChange={(e) => { const nextFileIds = { ...form.imageFileIds }; delete nextFileIds[color]; setForm({ ...form, images: { ...form.images, [color]: e.target.value }, imageFileIds: nextFileIds }) }} placeholder={form.image || 'Paste an image URL'} className="min-w-0 flex-1 rounded-lg border bg-white px-3 py-2 text-sm font-normal" aria-label={`${getColorDisplay(color)} image path or URL`} />
                        <label className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-forest-600 px-3 py-2 text-sm font-semibold text-forest-700 hover:bg-forest-50 ${uploadingColor ? 'pointer-events-none opacity-50' : ''}`}><Upload size={15} />{uploadingColor === color ? 'Uploading...' : 'Choose file'}<input type="file" accept="image/*" className="sr-only" disabled={Boolean(uploadingColor)} onChange={(e) => { void uploadColorImage(color, e.target.files?.[0]); e.currentTarget.value = '' }} /></label>
                      </div>
                      <p className="mt-1 text-center text-[11px] text-gray-400">Drop an image here, choose a file, or paste a URL. Uploaded URLs fill automatically.</p>
                      {previewPath && <div className="mt-2 h-24 rounded-lg bg-white bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url("${previewPath.replace(/"/g, '%22')}")` }} role="img" aria-label={`${getColorDisplay(color)} product image preview`} />}
                    </div>
                  </div>
                })}
              </div>
            </fieldset>}
            <label className="block text-sm font-medium text-gray-700">Short description<textarea required placeholder="Short summary shown in the catalog" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-lg border p-3 font-normal" /></label>
            <label className="block text-sm font-medium text-gray-700">Full description<textarea placeholder="Detailed product description" rows={4} value={form.longDescription} onChange={(e) => setForm({ ...form, longDescription: e.target.value })} className="mt-1 w-full rounded-lg border p-3 font-normal" /></label>
            <label className="block text-sm font-medium text-gray-700">Materials<textarea placeholder="One material per line" rows={3} value={form.materials} onChange={(e) => setForm({ ...form, materials: e.target.value })} className="mt-1 w-full rounded-lg border p-3 font-normal" /></label>
            <label className="block text-sm font-medium text-gray-700">Features<textarea placeholder="One feature per line" rows={3} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} className="mt-1 w-full rounded-lg border p-3 font-normal" /></label>
            <label className="block text-sm font-medium text-gray-700">Care instructions<textarea placeholder="One instruction per line" rows={3} value={form.care} onChange={(e) => setForm({ ...form, care: e.target.value })} className="mt-1 w-full rounded-lg border p-3 font-normal" /></label>
            <label className="block text-sm font-medium text-gray-700">Package includes<textarea placeholder="One included item per line" rows={3} value={form.includes} onChange={(e) => setForm({ ...form, includes: e.target.value })} className="mt-1 w-full rounded-lg border p-3 font-normal" /></label>
            <label className="block text-sm font-medium text-gray-700">Size guide link <span className="font-normal text-gray-400">(optional)</span><input placeholder="/size-guide" value={form.sizeGuideHref} onChange={(e) => setForm({ ...form, sizeGuideHref: e.target.value })} className="mt-1 w-full rounded-lg border p-3 font-normal" /></label>
            <div className="space-y-2 rounded-lg bg-gray-50 p-3">
              <label className="flex items-center gap-3 text-sm font-medium text-gray-700"><input type="checkbox" checked={form.isNew} onChange={(e) => setForm({ ...form, isNew: e.target.checked })} className="h-4 w-4 rounded text-forest-600" />Include in New Arrivals</label>
              <label className="flex items-center gap-3 text-sm font-medium text-gray-700"><input type="checkbox" checked={form.isPopular} onChange={(e) => setForm({ ...form, isPopular: e.target.checked })} className="h-4 w-4 rounded text-forest-600" />Mark as popular</label>
              <label className="flex items-center gap-3 text-sm font-medium text-gray-700"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 rounded text-forest-600" />Active and visible in Shop</label>
            </div>
            <button disabled={saving} className="w-full rounded-lg bg-forest-600 py-3 font-semibold text-white disabled:bg-gray-400">{saving ? 'Saving...' : editingDocId ? 'Save Changes' : 'Add Product'}</button>
          </form>
        </div>}

        <div className="grid gap-8">
          <div className="rounded-xl bg-white p-6 shadow">
            <div className="mb-4 flex items-end justify-between"><h2 className="font-serif text-xl text-forest-800">Firestore Catalog</h2><span className="text-xs text-gray-500">{paginatedCatalogProducts.length} of {filteredProducts.length} shown</span></div>
            <div className="mb-4 space-y-3">
              <div className="relative"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={search} onChange={(e) => { setSearch(e.target.value); setCatalogPage(1) }} placeholder="Search products..." className="w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCatalogPage(1) }} className="rounded-lg border p-2.5 text-sm"><option value="ALL">All categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
                <select value={arrivalFilter} onChange={(e) => { setArrivalFilter(e.target.value); setCatalogPage(1) }} className="rounded-lg border p-2.5 text-sm"><option value="ALL">All products</option><option value="NEW">New arrivals</option><option value="STANDARD">Not new</option></select>
              </div>
            </div>
            <div className="max-h-[560px] space-y-3 overflow-y-auto">
              {paginatedCatalogProducts.map((product) => {
                const image = Object.values(product.images)[0]
                return <div key={product.docId} className={`flex items-center gap-3 rounded-lg p-3 ${editingDocId === product.docId ? 'bg-forest-50 ring-1 ring-forest-300' : 'bg-gray-50'}`}>
                  <div className="h-16 w-16 flex-shrink-0 rounded-md bg-gray-200 bg-cover bg-center" style={image ? { backgroundImage: `url("${image.replace(/"/g, '%22')}")` } : undefined} aria-label={image ? `${product.name} image` : 'No image'} />
                  <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate font-semibold text-gray-800">{product.name}</p>{product.isNew && <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-gold-700">New</span>}</div><p className="truncate text-xs text-gray-500">{product.category} · {product.colors.join(', ')}</p><p className="font-semibold text-forest-700">₱{product.price.toLocaleString('en-PH')}</p></div>
                  <div className="flex flex-shrink-0 items-center gap-2"><Link href={`/shop/${product.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1 rounded-lg border border-gold-500 px-3 py-2 text-sm font-semibold text-gold-700 hover:bg-gold-50" aria-label={`Preview ${product.name} product details`}><Eye size={15} />Preview</Link><button type="button" onClick={() => editProduct(product)} className="flex items-center justify-center gap-1 rounded-lg border border-forest-600 px-3 py-2 text-sm font-semibold text-forest-600 hover:bg-forest-50"><Pencil size={15} />Edit</button><button type="button" disabled={saving} onClick={() => deleteProduct(product)} className="flex items-center justify-center gap-1 rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 size={15} />Delete</button></div>
                </div>
              })}
              {!filteredProducts.length && <p className="rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">No products match these filters.</p>}
            </div>
            {filteredProducts.length > catalogPageSize && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
              <p className="text-sm text-gray-500">Page {currentCatalogPage} of {catalogPageCount}</p>
              <div className="flex gap-2">
                <button type="button" disabled={currentCatalogPage === 1} onClick={() => setCatalogPage((page) => Math.max(1, page - 1))} className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
                {Array.from({ length: catalogPageCount }, (_, index) => index + 1).map((page) => <button key={`catalog-page-${page}`} type="button" onClick={() => setCatalogPage(page)} aria-current={page === currentCatalogPage ? 'page' : undefined} className={`h-10 min-w-10 rounded-lg border px-3 text-sm font-semibold ${page === currentCatalogPage ? 'border-forest-600 bg-forest-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}>{page}</button>)}
                <button type="button" disabled={currentCatalogPage === catalogPageCount} onClick={() => setCatalogPage((page) => Math.min(catalogPageCount, page + 1))} className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
              </div>
            </div>}
          </div>
        </div>

        <section className="mt-8 rounded-xl bg-white p-6 shadow">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div><h2 className="font-serif text-2xl text-forest-800">New Arrivals Editor</h2><p className="text-sm text-gray-500">Choose homepage products and set their display order. Hiding one here keeps it available in the shop.</p></div>
            <span className="rounded-full bg-gold-100 px-3 py-1 text-sm font-semibold text-gold-700">{products.filter((product) => product.isNew).length} selected</span>
          </div>
          <div className="mb-5 space-y-3">
            <div className="relative"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input value={newArrivalSearch} onChange={(e) => { setNewArrivalSearch(e.target.value); setNewArrivalPage(1) }} placeholder="Search New Arrivals products..." className="w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm" /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <select value={newArrivalCategory} onChange={(e) => { setNewArrivalCategory(e.target.value); setNewArrivalPage(1) }} className="rounded-lg border bg-white p-2.5 text-sm"><option value="ALL">All categories</option>{categories.map((category) => <option key={`arrival-${category}`} value={category}>{category}</option>)}</select>
              <select value={newArrivalStatus} onChange={(e) => { setNewArrivalStatus(e.target.value); setNewArrivalPage(1) }} className="rounded-lg border bg-white p-2.5 text-sm"><option value="ALL">All products</option><option value="SHOWN">Shown in New Arrivals</option><option value="HIDDEN">Not in New Arrivals</option></select>
            </div>
            <p className="text-xs text-gray-500">Showing {paginatedArrivalProducts.length} of {arrivalEditorProducts.length} matching products</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {paginatedArrivalProducts.map((product) => {
              const image = Object.values(product.images)[0]
              const displayImage = product.newArrivalImage || image
              return (
                <div key={`arrival-${product.docId}`} className={`overflow-hidden rounded-lg border ${product.isNew ? 'border-gold-300 bg-gold-50' : 'border-gray-200 bg-white'}`}>
                  <div onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }} onDrop={(e) => { e.preventDefault(); if (!uploadingArrivalDocId) void uploadNewArrivalImage(product, e.dataTransfer.files?.[0]) }} className="group relative aspect-[2/1] min-h-40 bg-gray-100 bg-cover bg-center" style={displayImage ? { backgroundImage: `url("${displayImage.replace(/"/g, '%22')}")` } : undefined}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <label className={`absolute bottom-3 right-3 inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-xs font-semibold text-forest-700 shadow transition hover:bg-white ${uploadingArrivalDocId ? 'pointer-events-none opacity-60' : ''}`}><Upload size={14} />{uploadingArrivalDocId === product.docId ? 'Uploading...' : product.newArrivalImage ? 'Replace Image' : 'Choose Image'}<input type="file" accept="image/*" className="sr-only" disabled={Boolean(uploadingArrivalDocId)} onChange={(e) => { void uploadNewArrivalImage(product, e.target.files?.[0]); e.currentTarget.value = '' }} /></label>
                    <span className="absolute bottom-4 left-3 text-[11px] text-white/90">Drop image here</span>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-gray-800">{product.name}</p><p className="text-xs text-gray-500">{product.category}</p></div>
                      <label className="flex items-center gap-2 text-[10px] uppercase text-gray-500"><span>Order</span><input type="number" min="1" defaultValue={product.newArrivalOrder ?? product.id} disabled={!product.isNew || saving} onBlur={(e) => updateNewArrival(product, true, Number(e.target.value))} className="w-14 rounded border px-2 py-1 text-center text-sm text-gray-700 disabled:bg-gray-100" /></label>
                    </div>
                    <button type="button" disabled={saving} onClick={() => updateNewArrival(product, !product.isNew)} className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50 ${product.isNew ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-forest-300 text-forest-700 hover:bg-forest-50'}`}>{product.isNew ? <><X size={16} />Hide from New Arrivals</> : <><Plus size={16} />Add to New Arrivals</>}</button>
                  </div>
                </div>
              )
            })}
            {!paginatedArrivalProducts.length && <p className="col-span-full rounded-lg bg-gray-50 p-6 text-center text-sm text-gray-500">No products match these filters.</p>}
          </div>
          {arrivalEditorProducts.length > newArrivalPageSize && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4">
            <p className="text-sm text-gray-500">Page {currentNewArrivalPage} of {newArrivalPageCount}</p>
            <div className="flex gap-2">
              <button type="button" disabled={currentNewArrivalPage === 1} onClick={() => setNewArrivalPage((page) => Math.max(1, page - 1))} className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
              {Array.from({ length: newArrivalPageCount }, (_, index) => index + 1).map((page) => <button key={page} type="button" onClick={() => setNewArrivalPage(page)} aria-current={page === currentNewArrivalPage ? 'page' : undefined} className={`h-10 min-w-10 rounded-lg border px-3 text-sm font-semibold ${page === currentNewArrivalPage ? 'border-forest-600 bg-forest-600 text-white' : 'text-gray-700 hover:bg-gray-50'}`}>{page}</button>)}
              <button type="button" disabled={currentNewArrivalPage === newArrivalPageCount} onClick={() => setNewArrivalPage((page) => Math.min(newArrivalPageCount, page + 1))} className="rounded-lg border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
            </div>
          </div>}
        </section>
      </div>
    </main>
  )
}
