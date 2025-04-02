// src/app/components/BookingModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { FaTimes, FaCalculator } from 'react-icons/fa'
import MpesaPaymentModal from './MpesaPaymentModal'
import { BookingDetails } from '../tailors/[tailorId]/page'

// Pricing data for different garment types and complexities
const PRICING = {
  'Wedding Dress': {
    'Simple': 5000,
    'Moderate': 8000,
    'Complex': 12000
  },
  'Suit': {
    'Simple': 3000,
    'Moderate': 5000,
    'Complex': 7500
  },
  'Evening Gown': {
    'Simple': 4000,
    'Moderate': 6000,
    'Complex': 9000
  },
  'Casual Wear': {
    'Simple': 2000,
    'Moderate': 3500,
    'Complex': 5000
  }
}

interface BookingModalProps {
  tailorName: string
  onClose: () => void
  onBookAppointment: (bookingDetails: BookingDetails) => Promise<void>
}

export default function BookingModal({ tailorName, onClose, onBookAppointment }: BookingModalProps) {
  const [garmentType, setGarmentType] = useState('')
  const [complexity, setComplexity] = useState('')
  const [estimatedPrice, setEstimatedPrice] = useState(0)
  const [completionDate, setCompletionDate] = useState('')
  const [showEstimate, setShowEstimate] = useState(false)
  const [showMpesaModal, setShowMpesaModal] = useState(false)
  const [showBookingForm, setShowBookingForm] = useState(true)
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null)

  // Garment type options based on pricing data
  const garmentTypes = Object.keys(PRICING)

  // Calculate price and completion date when garment type or complexity changes
  useEffect(() => {
    if (garmentType && complexity && showEstimate) {
      // Calculate estimated price
      const price = PRICING[garmentType as keyof typeof PRICING]?.[complexity as keyof typeof PRICING['Wedding Dress']] || 0
      setEstimatedPrice(price)

      // Calculate estimated completion date based on complexity
      const today = new Date()
      let additionalDays = 0
      switch (complexity) {
        case 'Simple':
          additionalDays = 7
          break
        case 'Moderate':
          additionalDays = 14
          break
        case 'Complex':
          additionalDays = 21
          break
        default:
          additionalDays = 10
      }

      const completionDate = new Date(today)
      completionDate.setDate(today.getDate() + additionalDays)
      setCompletionDate(completionDate.toLocaleDateString())
    }
  }, [garmentType, complexity, showEstimate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prepare booking details
    const details: BookingDetails = {
      garmentType,
      complexity,
      estimatedPrice,
      completionDate,
      time: '', // Add default or derive from context
      date: '', // Add default or derive from context
      service: garmentType,
      tailorId: '' // Add default or derive from context
    }

    try {
      await onBookAppointment(details)
      onClose() // Close modal after successful booking
    } catch (error) {
      console.error('Booking failed:', error)
      // Optionally show an error message to the user
    }
  }

  const handlePaymentSuccess = () => {
    // Additional logic for successful booking (e.g., send to backend, close modal)
    console.log('Booking confirmed:', bookingDetails)
    onClose()
  }

  const handlePaymentCancel = () => {
    // Return to booking form
    setShowBookingForm(true)
    setShowMpesaModal(false)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      {/* Booking Form */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 relative">
            {/* Close button */}
            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
            >
              <FaTimes className="text-2xl" />
            </button>

            <h2 className="text-2xl font-bold mb-6 text-blue-700">Book Appointment with {tailorName}</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Garment Type Dropdown */}
              <div>
                <label htmlFor="garmentType" className="block mb-2 text-gray-700">Garment Type</label>
                <select
                  id="garmentType"
                  value={garmentType}
                  onChange={(e) => setGarmentType(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  required
                >
                  <option value="">Select Garment Type</option>
                  {garmentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Complexity Dropdown */}
              <div>
                <label htmlFor="complexity" className="block mb-2 text-gray-700">Complexity</label>
                <select
                  id="complexity"
                  value={complexity}
                  onChange={(e) => setComplexity(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  required
                  disabled={!garmentType}
                >
                  <option value="">Select Complexity</option>
                  <option value="Simple">Simple</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Complex">Complex</option>
                </select>
              </div>

              {/* Checkbox to show estimate */}
              <div className="flex items-center">
                <input 
                  type="checkbox" 
                  id="showEstimate" 
                  checked={showEstimate}
                  onChange={() => setShowEstimate(!showEstimate)}
                  className="mr-2"
                />
                <label htmlFor="showEstimate" className="text-gray-700">
                  Show Price Estimate
                </label>
              </div>

              {/* Estimated Price and Completion */}
              {showEstimate && estimatedPrice > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Estimated Price:</span>
                    <span className="font-bold text-blue-700">KSh {estimatedPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Estimated Completion:</span>
                    <span className="font-bold text-green-700">{completionDate}</span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button 
                type="submit" 
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
                disabled={!garmentType || !complexity}
              >
                Proceed to Payment
              </button>
            </form>
          </div>
        </div>
      )}

      {/* M-Pesa Payment Modal */}
      {showMpesaModal && bookingDetails && (
        <MpesaPaymentModal 
          amount={bookingDetails.estimatedPrice}
          bookingId={`BOOKING-${Date.now()}`}
          onClose={handlePaymentCancel}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}