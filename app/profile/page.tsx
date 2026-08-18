'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ChevronDown, Mail, MapPin, PackagePlus, Phone, ShieldCheck, Store, User } from 'lucide-react'
import { collection, getDocs, orderBy, query, Timestamp } from 'firebase/firestore'
import { getIdTokenResult } from 'firebase/auth'
import { useAuth } from '@/context/AuthContext'
import LogoutButton from '@/components/LogoutButton'
import { firestore } from '@/lib/firebase'
import { getColorDisplay, getProductById, getProductImage } from '@/lib/productUtils'
import type { CartItem } from '@/context/CartContext'

type AccountOrder = {
  id: string
  totalAmount: number
  totalItems: number
  status: string
  createdAt?: Timestamp
  items?: CartItem[]
  customer?: { name?: string; email?: string; phone?: string; address?: string }
  trackingNumber?: string
  carrier?: string
  trackingNote?: string
}

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const [orders, setOrders] = useState<AccountOrder[]>([])
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!user) return
    getDocs(query(collection(firestore, 'users', user.uid, 'orders'), orderBy('createdAt', 'desc')))
      .then((snapshot) => setOrders(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as AccountOrder))))
      .catch((error) => console.error('Unable to load order history:', error))
  }, [user])

  useEffect(() => {
    if (!user) return
    getIdTokenResult(user).then((token) => setIsAdmin(token.claims.admin === true)).catch(() => setIsAdmin(false))
  }, [user])

  if (loading) return <main className="min-h-screen bg-gray-50 pt-32 text-center">Loading profile...</main>
  if (!user) return <main className="min-h-screen bg-gray-50 pt-32 text-center"><p className="mb-4 text-gray-600">Sign in to view your profile.</p><Link href="/login" className="font-semibold text-forest-600">Go to login</Link></main>

  const name = user.displayName || 'Verde customer'
  const provider = user.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Email and password'

  return (
    <main className="min-h-screen bg-gradient-to-br from-forest-50 to-white pb-16 pt-32">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="h-28 bg-forest-700" />
          <div className="px-6 pb-8 sm:px-10">
            <div className="-mt-12 mb-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-forest-100 text-3xl font-semibold text-forest-700 shadow-md">
              {user.photoURL ? <Image src={user.photoURL} alt={name} width={96} height={96} className="h-full w-full object-cover" priority /> : name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-wrap items-center gap-3"><h1 className="font-serif text-3xl text-forest-800">{name}</h1><span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${isAdmin ? 'bg-gold-100 text-gold-700' : 'bg-forest-50 text-forest-700'}`}>{isAdmin ? 'Administrator' : 'Customer'}</span></div>
            <p className="mt-1 text-gray-500">Verde by Renzo account</p>
            <div className="mt-8 space-y-3 rounded-xl bg-gray-50 p-5">
              <div className="flex items-center gap-3 text-gray-700"><User size={19} className="text-forest-600" /><span>{name}</span></div>
              <div className="flex items-center gap-3 text-gray-700"><Mail size={19} className="text-forest-600" /><span className="break-all">{user.email}</span></div>
              <div className="flex items-center gap-3 text-gray-700"><ShieldCheck size={19} className="text-forest-600" /><span>{user.emailVerified ? 'Verified' : 'Unverified'} · Signed in with {provider}</span></div>
            </div>
            {isAdmin && (
              <section className="mt-6 rounded-xl border border-gold-200 bg-gold-50 p-5">
                <div className="mb-4"><h2 className="font-serif text-xl text-forest-800">Admin Dashboard</h2><p className="text-sm text-gray-600">Manage the Firestore catalog and review the public storefront.</p></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Link href="/admin" className="flex items-center justify-center gap-2 rounded-lg bg-forest-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-forest-700"><PackagePlus size={18} />Open Admin Dashboard</Link>
                  <Link href="/shop" className="flex items-center justify-center gap-2 rounded-lg border border-forest-600 px-4 py-3 font-semibold text-forest-700 transition-colors hover:bg-white"><Store size={18} />View Storefront</Link>
                </div>
              </section>
            )}
            <section className="mt-8">
              <h2 className="mb-3 font-serif text-xl text-forest-800">Order History ({orders.length})</h2>
              {orders.length ? (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div key={order.id} className="overflow-hidden rounded-xl border border-gray-200">
                      <button type="button" onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)} className="flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:bg-gray-50" aria-expanded={expandedOrderId === order.id}>
                        <div><p className="font-semibold text-gray-800">{order.totalItems} item{order.totalItems === 1 ? '' : 's'}</p><p className="text-xs text-gray-500">{order.createdAt?.toDate().toLocaleDateString('en-PH') || 'Processing'}</p></div>
                        <div className="flex items-center gap-3">
                          <div className="text-right"><p className="font-semibold text-forest-700">₱{order.totalAmount.toLocaleString('en-PH')}</p><p className="text-xs capitalize text-gray-500">{order.status}</p></div>
                          <ChevronDown size={18} className={`text-gray-400 transition-transform ${expandedOrderId === order.id ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      {expandedOrderId === order.id && (
                        <div className="border-t border-gray-100 bg-gray-50 p-4">
                          <div className="space-y-3">
                            {(order.items || []).map((item) => {
                              const product = getProductById(item.id)
                              if (!product) return null
                              const productImage = getProductImage(product, item.color)
                              return (
                                <div key={`${item.id}-${item.color}-${item.size || ''}-${item.hand || ''}`} className="flex gap-3 rounded-lg bg-white p-3">
                                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                                    {productImage && <Image src={productImage} alt={product.name} fill sizes="64px" className="object-cover" />}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-gray-800">{product.name}</p>
                                    <p className="text-xs text-gray-500">{getColorDisplay(item.color)}{item.size ? ` · Size ${item.size}` : ''}{item.hand ? ` · ${item.hand} hand` : ''}</p>
                                    <p className="mt-1 text-xs text-gray-600">Qty {item.quantity} × ₱{product.price.toLocaleString('en-PH')}</p>
                                  </div>
                                  <p className="text-sm font-semibold text-forest-700">₱{(product.price * item.quantity).toLocaleString('en-PH')}</p>
                                </div>
                              )
                            })}
                          </div>

                          {order.customer && (
                            <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-xs text-gray-600">
                              {order.customer.phone && <p className="flex items-center gap-2"><Phone size={14} />{order.customer.phone}</p>}
                              {order.customer.address && <p className="flex items-start gap-2"><MapPin size={14} className="mt-0.5 flex-shrink-0" />{order.customer.address}</p>}
                            </div>
                          )}
                          {(order.trackingNumber || order.trackingNote) && (
                            <div className="mt-4 rounded-lg border border-forest-100 bg-white p-4 text-sm">
                              <p className="mb-1 font-semibold text-forest-800">Shipment tracking</p>
                              {order.trackingNumber && <p><span className="text-gray-500">{order.carrier || 'Carrier'}:</span> <span className="font-medium">{order.trackingNumber}</span></p>}
                              {order.trackingNote && <p className="mt-2 text-xs text-gray-600">{order.trackingNote}</p>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">No account orders yet.</p>}
            </section>
            <LogoutButton className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 px-5 py-3 font-semibold text-red-600 transition-colors hover:bg-red-50" />
          </div>
        </div>
      </div>
    </main>
  )
}
