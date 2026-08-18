'use client'

import { LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function LogoutButton({ className = '' }: { className?: string }) {
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    window.location.assign('/')
  }

  return (
    <button type="button" onClick={handleLogout} className={className}>
      <LogOut size={18} />
      Sign out
    </button>
  )
}
