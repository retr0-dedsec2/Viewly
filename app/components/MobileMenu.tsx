'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Sidebar from '@/components/Sidebar'

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-spotify-light rounded-lg text-white"
        aria-label="Toggle menu"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
      
      {isOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="lg:hidden fixed inset-y-0 left-0 z-40 transform transition-transform">
            <Sidebar />
          </div>
        </>
      )}
    </>
  )
}

