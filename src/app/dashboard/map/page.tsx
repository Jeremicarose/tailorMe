'use client'

import React, { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import the map component to ensure it only loads on client-side
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <p>Loading map...</p>
})

// Map container style
const mapContainerStyle = {
  width: '100%',
  height: '600px'
}

// Default map center (you can adjust based on your location)
const defaultCenter = {
  latitude: -1.292066, // Nairobi coordinates as an example
  longitude: 36.821946
}

interface TailorMapData {
  id: string
  name: string
  profileImage?: string
  latitude: number
  longitude: number
  specialty?: string
  address?: string
  averageRating: number
  services: string[]
  totalReviews: number
  completionRate: number
  verificationStatus?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED'
  portfolioApproved?: boolean
}

export default function MapPage() {
  const [tailors, setTailors] = useState<TailorMapData[]>([])
  const [selectedTailor, setSelectedTailor] = useState<TailorMapData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false)

  useEffect(() => {
    async function fetchTailors() {
      try {
        const response = await fetch('/api/tailor/map')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json()
        
        if (Array.isArray(data) && data.length > 0) {
          setTailors(data)
        } else {
          setError('No tailors found in your area')
        }
      } catch {
        setError('Failed to load tailors')
      }
    }
    fetchTailors()
  }, [])

  const renderStars = (rating: number) => {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating))
  }

  const visibleTailors = showVerifiedOnly
    ? tailors.filter((tailor) => tailor.verificationStatus === 'VERIFIED')
    : tailors

  return (
    <div className="relative min-h-screen">
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-4">Find Tailors Near You</h1>
          <div className="mb-4 flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={showVerifiedOnly}
                onChange={() => setShowVerifiedOnly((value) => !value)}
              />
              Show verified tailors only
            </label>
          </div>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
        </div>
      </div>
      <div className="h-screen">
        <MapComponent
          tailors={visibleTailors}
          selectedTailor={selectedTailor}
          setSelectedTailor={setSelectedTailor}
          renderStars={renderStars}
        />
      </div>
    </div>
  )
}
