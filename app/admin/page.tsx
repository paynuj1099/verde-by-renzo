'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getIdTokenResult } from 'firebase/auth'
import { BarChart3, Bell, Boxes, ChevronDown, CircleDollarSign, Search, ShoppingCart, Users } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import AdminDashboardSkeleton from '@/components/AdminDashboardSkeleton'

const metricCards = [
  { label: 'Total Sales', value: '₱184,520', change: '+3.34%', icon: CircleDollarSign, accent: true },
  { label: 'Total Orders', value: '1,248', change: '+5.12%', icon: ShoppingCart },
  { label: 'Total Visitors', value: '18,760', change: '+8.02%', icon: Users },
]
const chartPoints = '0,125 65,98 130,110 195,73 260,82 325,42 390,68 455,61 520,96 585,53 650,72'
const chartPointsTwo = '0,155 65,180 130,143 195,164 260,142 325,105 390,150 455,137 520,176 585,145 650,165'

export default function AdminDashboardPage() {
  const { user, loading } = useAuth()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    if (loading) return
    if (!user) return setAllowed(false)
    getIdTokenResult(user, true).then((token) => setAllowed(token.claims.admin === true)).catch(() => setAllowed(false))
  }, [user, loading])

  if (loading || allowed === null) return <AdminDashboardSkeleton />
  if (!allowed) return <main className="min-h-screen bg-[#f4f0e7] pt-36 text-center"><h1 className="font-serif text-3xl text-forest-800">Administrator access required</h1><Link href="/login" className="mt-5 inline-block text-forest-600 underline">Sign in</Link></main>

  return <main className="min-h-screen bg-[#f2f6f0]">
      <section className="admin-dashboard mx-auto w-full max-w-[1480px] px-5 py-6 sm:py-8 lg:px-8">
        <header className="mb-7 flex flex-wrap items-center gap-4"><div className="mr-auto"><p className="text-xs font-semibold uppercase tracking-[.2em] text-gold-600">Administration</p><h1 className="font-serif text-3xl text-forest-950">Dashboard</h1></div><label className="relative hidden w-full max-w-xs md:block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/><input placeholder="Search stock, orders, etc." className="w-full rounded-xl border-0 bg-white py-3 pl-10 pr-4 text-sm shadow-sm outline-none ring-1 ring-gray-100 focus:ring-forest-300"/></label><button className="relative rounded-xl bg-white p-3 text-gray-500 shadow-sm"><Bell size={19}/><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold-500"/></button><div className="flex items-center gap-3 rounded-xl bg-white p-2 pr-3 shadow-sm">{user?.photoURL ? <Image src={user.photoURL} alt="" width={36} height={36} className="h-9 w-9 rounded-lg object-cover"/> : <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-100 font-semibold text-forest-700">{(user?.displayName || 'A')[0]}</div>}<div className="hidden sm:block"><p className="max-w-32 truncate text-sm font-semibold">{user?.displayName || 'Administrator'}</p><p className="text-[10px] text-gray-400">Admin</p></div><ChevronDown size={15}/></div></header>

        <div className="mb-5 rounded-lg border border-forest-200 bg-forest-50 px-4 py-2 text-xs text-forest-700">Dashboard analytics are placeholder data for layout preview only.</div>
        <div className="grid gap-4 md:grid-cols-3">{metricCards.map(({ label, value, change, icon: Icon, accent }) => <article key={label} className={`rounded-2xl border border-forest-100 p-5 ${accent ? 'bg-forest-700 text-white' : 'bg-gradient-to-br from-white to-forest-50'} shadow-sm`}><div className="mb-6 flex items-center justify-between"><p className={`text-sm ${accent ? 'text-forest-100' : 'text-gray-500'}`}>{label}</p><span className={`rounded-lg p-2 ${accent ? 'bg-white/15 text-gold-300' : 'bg-forest-100 text-forest-700'}`}><Icon size={19}/></span></div><div className="flex items-end justify-between"><strong className={`text-2xl sm:text-3xl ${accent ? 'text-white' : 'text-forest-950'}`}>{value}</strong><span className={`text-xs font-semibold ${accent ? 'text-gold-300' : 'text-emerald-600'}`}>{change}</span></div></article>)}</div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(280px,.8fr)]">
          <article className="rounded-2xl bg-white p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-serif text-xl text-forest-950">Revenue Analytics</h2><div className="mt-2 flex gap-4 text-xs text-gray-400"><span>— Revenue</span><span>-- Orders</span></div></div><button className="rounded-lg bg-forest-700 px-3 py-2 text-xs text-white">Last 8 Days</button></div><div className="relative h-64 overflow-hidden"><div className="absolute inset-0 flex flex-col justify-between py-2">{[16,12,8,4,0].map((item) => <div key={item} className="border-t border-dashed border-gray-100 text-[10px] text-gray-300">{item}K</div>)}</div><svg viewBox="0 0 650 210" preserveAspectRatio="none" className="absolute inset-0 h-full w-full"><polyline points={chartPoints} fill="none" stroke="#214f19" strokeWidth="4"/><polyline points={chartPointsTwo} fill="none" stroke="#c89c4a" strokeWidth="3" strokeDasharray="8 8"/></svg></div></article>
          <article className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-serif text-xl text-forest-950">Monthly Target</h2><div className="relative mx-auto mt-5 h-52 w-52"><svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-label="85 percent monthly target"><circle cx="60" cy="60" r="47" fill="none" stroke="#eadfc8" strokeWidth="14"/><circle cx="60" cy="60" r="47" fill="none" stroke="#214f19" strokeWidth="14" strokeLinecap="round" pathLength="100" strokeDasharray="85 15"/></svg><div className="absolute inset-0 flex flex-col items-center justify-center text-center"><strong className="text-3xl text-forest-950">85%</strong><p className="mt-1 text-[11px] text-emerald-600">+8.02% from last month</p></div></div><p className="mt-2 text-center font-semibold">Great progress!</p><p className="mx-auto mt-1 max-w-xs text-center text-xs leading-5 text-gray-400">This sample target will be connected to real order data later.</p><div className="mt-5 grid grid-cols-2 divide-x rounded-xl bg-[#f5eddf] p-3 text-center text-xs"><div><p className="text-gray-400">Target</p><strong>₱200,000</strong></div><div><p className="text-gray-400">Revenue</p><strong>₱170,000</strong></div></div></article>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[.8fr_1.5fr_1fr]">
          <article className="rounded-2xl bg-white p-5 shadow-sm"><div className="mb-5 flex justify-between"><h2 className="font-serif text-xl">Active Users</h2><Users size={19} className="text-gray-400"/></div><strong className="text-3xl text-forest-950">2,758</strong><p className="text-xs text-gray-400">sample users</p><div className="mt-6 space-y-4">{[['Philippines','48%'],['United States','24%'],['Singapore','17%'],['Other','11%']].map(([country,value]) => <div key={country}><div className="mb-1 flex justify-between text-xs"><span className="text-gray-500">{country}</span><strong>{value}</strong></div><div className="h-2 rounded-full bg-[#eee5d5]"><div className="h-full rounded-full bg-gold-500" style={{ width: value }}/></div></div>)}</div></article>
          <article className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-serif text-xl">Conversion Rate</h2><BarChart3 className="text-gray-400" size={19}/></div><div className="mt-8 flex h-56 items-end gap-3 border-b border-gray-100">{[['Views','100%'],['Cart','62%'],['Checkout','41%'],['Purchase','27%'],['Abandoned','15%']].map(([label,height], index) => <div key={label} className="flex h-full flex-1 flex-col justify-end"><div className="rounded-t-xl bg-forest-700/90" style={{ height, opacity: 1 - index * .12 }}/><p className="mt-2 truncate text-center text-[10px] text-gray-400">{label}</p></div>)}</div></article>
          <article className="rounded-2xl bg-white p-5 shadow-sm"><div className="mb-6 flex justify-between"><h2 className="font-serif text-xl">Top Categories</h2><Boxes className="text-gray-400" size={19}/></div><div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full bg-[conic-gradient(#214f19_0_42%,#c89c4a_42%_72%,#dfcfad_72%_100%)]"><div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white"><span className="text-xs text-gray-400">Sales</span><strong className="text-xl">100%</strong></div></div><div className="mt-6 space-y-3 text-xs">{[['Apparel','42%'],['Accessories','30%'],['Bags','28%']].map(([name,value], index) => <div key={name} className="flex items-center"><span className={`mr-2 h-2 w-2 rounded-sm ${index === 0 ? 'bg-forest-700' : index === 1 ? 'bg-gold-500' : 'bg-[#dfcfad]'}`}/><span className="text-gray-500">{name}</span><strong className="ml-auto">{value}</strong></div>)}</div></article>
        </div>
      </section>
  </main>
}
