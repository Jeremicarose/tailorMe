'use client'

import React, { useEffect, useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, Scissors, CheckCircle, AlertCircle, X } from 'lucide-react'

interface BookingFormData {
  tailorId: string
  availabilityId: string
  requestedDeliveryDate: Date | null
  description: string
  measurements: Record<string, any>
}

interface TailorOption {
  id: string
  name: string
  specialty?: string | null
  averageRating?: number
  verificationStatus?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED'
}

interface AvailabilityOption {
  id: string
  date: string
  startTime: string
  endTime: string
  status: string
}

const QuickBooking: React.FC = () => {
  const [formData, setFormData] = useState<BookingFormData>({
    tailorId: '',
    availabilityId: '',
    requestedDeliveryDate: null,
    description: '',
    measurements: {}
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [tailors, setTailors] = useState<TailorOption[]>([])
  const [availabilities, setAvailabilities] = useState<AvailabilityOption[]>([])
  const [isTailorsLoading, setIsTailorsLoading] = useState(true)
  const [isAvailabilitiesLoading, setIsAvailabilitiesLoading] = useState(false)

  const handleInputChange = (field: keyof BookingFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  useEffect(() => {
    const fetchTailors = async () => {
      try {
        setIsTailorsLoading(true)
        const response = await fetch('/api/tailor/map')
        if (!response.ok) {
          throw new Error('Failed to load tailors')
        }

        const data = await response.json()
        const mappedTailors: TailorOption[] = Array.isArray(data)
          ? data.map((tailor: any) => ({
              id: tailor.id,
              name: tailor.name,
              specialty: tailor.specialty,
              averageRating: tailor.averageRating,
              verificationStatus: tailor.verificationStatus,
            }))
          : []

        setTailors(mappedTailors)
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load tailors')
      } finally {
        setIsTailorsLoading(false)
      }
    }

    fetchTailors()
  }, [])

  useEffect(() => {
    if (!formData.tailorId) {
      setAvailabilities([])
      return
    }

    const fetchAvailabilities = async () => {
      try {
        setIsAvailabilitiesLoading(true)
        const response = await fetch(`/api/tailor/${formData.tailorId}/availability`)
        if (!response.ok) {
          throw new Error('Failed to load availability')
        }

        const data = await response.json()
        setAvailabilities(Array.isArray(data) ? data : [])
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load availability')
        setAvailabilities([])
      } finally {
        setIsAvailabilitiesLoading(false)
      }
    }

    fetchAvailabilities()
  }, [formData.tailorId])

  const availabilityOptions = useMemo(() => {
    return availabilities.map((availability) => {
      const start = new Date(availability.startTime)
      const end = new Date(availability.endTime)
      return {
        id: availability.id,
        label: `${start.toLocaleDateString()} • ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      }
    })
  }, [availabilities])

  const validateForm = () => {
    if (!formData.tailorId) return 'Please select a tailor'
    if (!formData.availabilityId) return 'Please select an available time slot'
    if (!formData.requestedDeliveryDate) return 'Please select a delivery date'
    if (!formData.description.trim()) return 'Please provide a description of your requirements'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create booking')
      }

      setSuccess("Booking created successfully! We'll send you a confirmation email shortly.")
      setFormData({
        tailorId: '',
        availabilityId: '',
        requestedDeliveryDate: null,
        description: '',
        measurements: {}
      })
      setCurrentStep(1)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Tailor
              </label>
              <select
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
                value={formData.tailorId}
                onChange={(e) => {
                  handleInputChange('tailorId', e.target.value)
                  handleInputChange('availabilityId', '')
                }}
                required
                disabled={isTailorsLoading}
              >
                <option value="">
                  {isTailorsLoading ? 'Loading tailors...' : 'Choose a tailor...'}
                </option>
                {tailors
                  .filter((tailor) => tailor.verificationStatus === 'VERIFIED')
                  .map((tailor) => (
                  <option key={tailor.id} value={tailor.id}>
                    {tailor.name}{tailor.specialty ? ` - ${tailor.specialty}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Available Time Slots
              </label>
              <select
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
                value={formData.availabilityId}
                onChange={(e) => handleInputChange('availabilityId', e.target.value)}
                required
                disabled={!formData.tailorId || isAvailabilitiesLoading}
              >
                <option value="">
                  {!formData.tailorId
                    ? 'Select a tailor first...'
                    : isAvailabilitiesLoading
                      ? 'Loading available slots...'
                      : availabilityOptions.length === 0
                        ? 'No available slots found'
                        : 'Select a time slot...'}
                </option>
                {availabilityOptions.map((availability) => (
                  <option key={availability.id} value={availability.id}>
                    {availability.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Requested Delivery Date
              </label>
              <div className="relative">
                <DatePicker
                  selected={formData.requestedDeliveryDate}
                  onChange={(date) => handleInputChange('requestedDeliveryDate', date)}
                  minDate={new Date()}
                  placeholderText="Select your preferred delivery date"
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow"
                  required
                />
                <Calendar className="absolute right-3 top-3 h-5 w-5 text-slate-400" />
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description of Requirements
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow min-h-[120px]"
                placeholder="Describe what you need (e.g., suit alteration, dress fitting)"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                required
              />
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="h-16 w-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Scissors className="h-8 w-8 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Quick Booking</h2>
            <p className="mt-2 text-slate-600">Schedule your tailoring appointment in minutes</p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2].map((step) => (
              <div
                key={step}
                className="flex items-center"
                onClick={() => setCurrentStep(step)}
              >
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center cursor-pointer
                    ${currentStep >= step 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-slate-100 text-slate-500'}`}
                >
                  {step}
                </div>
                {step < 2 && (
                  <div 
                    className={`h-1 w-24 mx-2
                      ${currentStep > step ? 'bg-orange-500' : 'bg-slate-100'}`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Error Message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 text-red-600 px-4 py-3 rounded-lg flex items-center"
                >
                  <AlertCircle className="h-5 w-5 mr-2" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-green-50 text-green-600 px-4 py-3 rounded-lg flex items-center"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="px-6 py-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Back
                </button>
              )}
              
              {currentStep < 2 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="ml-auto px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="ml-auto px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Booking...' : 'Confirm Booking'}
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default QuickBooking
