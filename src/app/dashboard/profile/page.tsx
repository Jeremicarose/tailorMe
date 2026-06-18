'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Alert from '@/app/components/ui/Alert'
import AlertDescription from '@/app/components/ui/AlertDescription'
import ProfileHeader from './ProfileHeader'
import ProfileContent from './ProfileContent'

export interface Service {
  id?: string
  name: string
  description: string
  price: number
}

export interface TailorProfile {
  id?: string
  specialty?: string
  bio?: string
  location?: string
  services?: Service[]
  availabilityStatus?: 'open' | 'limited' | 'closed'
  verificationStatus?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED'
  verificationSubmittedAt?: string
  verificationReviewedAt?: string
  verificationNotes?: string
  identityDocumentUrl?: string
  businessName?: string
  yearsOfExperience?: number
  portfolioApproved?: boolean
  maxDailyBookings?: number
  bookingNoticePeriod?: string
  unavailableDates?: string[]
  phoneNumber?: string
  profileImage?: string
}

export default function TailorProfilePage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/login')
    }
  })

  // Add loading state
  const [isLoading, setIsLoading] = useState(true)
  // Add error state
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const initialProfile: TailorProfile = {
    specialty: '',
    bio: '',
    location: '',
    services: [],
    availabilityStatus: 'open',
    verificationStatus: 'UNVERIFIED',
    maxDailyBookings: 10,
    bookingNoticePeriod: '24h',
    unavailableDates: []
  }

  const [profile, setProfile] = useState<TailorProfile>(initialProfile)

  const fetchTailorProfile = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/tailor/profile')
      
      if (!response.ok) {
        if (response.status === 404) {
          setProfile(initialProfile)
          return
        }
        
        const errorText = await response.text()
        throw new Error(errorText || `HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      const processedProfile: TailorProfile = {
        ...data,
        unavailableDates: data.unavailableDates || [],
        availabilityStatus: (data.availabilityStatus?.toLowerCase() as TailorProfile['availabilityStatus']) || 'open',
        services: data.services || [],
        maxDailyBookings: data.maxDailyBookings || 10,
        bookingNoticePeriod: data.bookingNoticePeriod || '24h'
      }
      
      setProfile(processedProfile)
    } catch (error) {
      console.error('Profile fetch error:', error)
      setError(error instanceof Error ? error.message : 'Failed to load profile')
      setProfile(initialProfile)
    } finally {
      setIsLoading(false)
    }
  }

  // Redirect non-tailors
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'TAILOR') {
      redirect('/dashboard')
    }
  }, [status, session])

  useEffect(() => {
    if (session?.user?.id) {
      fetchTailorProfile()
    }
  }, [session?.user?.id, fetchTailorProfile])

  const validateProfile = (profile: TailorProfile): string | null => {
    if (!profile.specialty?.trim()) {
      return 'Specialty is required'
    }
    if (!profile.location?.trim()) {
      return 'Location is required'
    }
    if (profile.services?.some(service => !service.name.trim() || service.price <= 0)) {
      return 'All services must have a name and valid price'
    }
    return null
  }

  const handleSave = async () => {
    const validationError = validateProfile(profile)
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      const profileToSave = {
        ...profile
      }

      const response = await fetch('/api/tailor/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileToSave),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save profile')
      }

      setIsEditing(false)
      await fetchTailorProfile()
    } catch (error) {
      console.error('Error saving profile:', error)
      setError(error instanceof Error ? error.message : 'Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  const addService = () => {
    setProfile(prev => ({
      ...prev,
      services: [...(prev.services || []), {
        name: '',
        description: '',
        price: 0
      }]
    }))
  }

  const removeService = (index: number) => {
    setProfile(prev => ({
      ...prev,
      services: prev.services?.filter((_, i) => i !== index)
    }))
  }

  const updateService = (index: number, field: keyof Service, value: string | number) => {
    setProfile(prev => {
      const newServices = [...(prev.services || [])]
      newServices[index] = {
        ...newServices[index],
        [field]: field === 'price' ? Number(value) : value
      }
      return { ...prev, services: newServices }
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 p-4 md:p-8 flex items-center justify-center">
        <div className="animate-pulse text-lg">Loading profile...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 p-4 md:p-8">
      <div className="container mx-auto max-w-5xl space-y-8">
        {error && (
          <Alert variant="error">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <ProfileHeader 
          isEditing={isEditing} 
          setIsEditing={setIsEditing} 
          handleSave={handleSave}
          isSaving={isSaving}
          verificationStatus={profile.verificationStatus}
        />
        
        <ProfileContent 
          profile={profile}
          isEditing={isEditing}
          setProfile={setProfile}
          addService={addService}
          removeService={removeService}
          updateService={updateService}
        />
      </div>
    </div>
  )
}
