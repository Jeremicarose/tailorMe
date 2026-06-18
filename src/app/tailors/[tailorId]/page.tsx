'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import {
    FaUser,
    FaStar,
    FaMapMarkerAlt,
    FaPhone,
    FaEnvelope,
    FaTools,
    FaCheckCircle
} from 'react-icons/fa'
import { useSession } from 'next-auth/react'
import TailorPortfolio from '../../components/TailorPortfolio'
import AvailabilityCalendar, { type TailorAvailability } from '../../components/AvailabilityCalendar'
import BookingModal, { type BookingDetails } from '../../components/BookingModal'

// Add type definition for Tailor
interface Tailor {
    id: string;
    name: string;
    specialty: string;
    averageRating: number;
    distance: number;
    availability: string[];
    bio: string;
    contactNumber: string;
    email: string;
    profileImage: string;
    services: string[];
    completionRate: number;
    verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
    verificationNotes?: string | null;
    businessName?: string | null;
    yearsOfExperience?: number | null;
    portfolioApproved?: boolean;
}

export default function TailorDetailPage({
    params
}: {
    params: Promise<{ tailorId: string }>
}) {
    const { data: session } = useSession()
    const [tailor, setTailor] = useState<Tailor | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showBookingModal, setShowBookingModal] = useState(false)
    const [selectedAvailability, setSelectedAvailability] = useState<TailorAvailability | null>(null)
    const [tailorId, setTailorId] = useState<string>('')

    useEffect(() => {
        let isMounted = true

        const fetchTailorDetails = async () => {
            try {
                setIsLoading(true)
                const resolvedParams = await params
                if (!isMounted) return
                setTailorId(resolvedParams.tailorId)
                
                const response = await fetch(`/api/tailors/${resolvedParams.tailorId}`)
                
                if (!response.ok) {
                    throw new Error('Failed to fetch tailor details')
                }

                const transformedTailor = await response.json()
                setTailor(transformedTailor)
            } catch (err) {
                console.error('Tailor fetch error:', err)
                setError(err instanceof Error ? err.message : 'An unknown error occurred')
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        fetchTailorDetails()
        return () => {
            isMounted = false
        }
    }, [params])

    const prepareBooking = async (bookingDetails: BookingDetails) => {
        if (!session?.user?.id) {
            throw new Error('Please log in to book an appointment')
        }

        if (!selectedAvailability) {
            throw new Error('Please select an availability slot first')
        }

        const response = await fetch('/api/booking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tailorId,
                availabilityId: selectedAvailability.id,
                requestedDeliveryDate: bookingDetails.requestedDeliveryDate,
                description: bookingDetails.description,
                measurements: {
                    garmentType: bookingDetails.garmentType,
                    complexity: bookingDetails.complexity,
                    estimatedPrice: bookingDetails.estimatedPrice,
                },
            })
        })

        if (!response.ok) {
            const data = await response.json().catch(() => null)
            throw new Error(data?.error || 'Failed to book appointment')
        }

        const booking = await response.json()
        return { bookingId: booking.id as string }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-blue-500"></div>
            </div>
        )
    }

    if (error || !tailor) {
        return (
            <div className="flex justify-center items-center h-screen text-red-500">
                {error || 'Tailor not found'}
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid md:grid-cols-3 gap-8">
                {/* Tailor Profile Section */}
                <div className="md:col-span-1 bg-white shadow-md rounded-lg p-6">
                    <div className="text-center">
                        <div className="w-32 h-32 mx-auto mb-4 relative">
                            <Image 
                                src={tailor.profileImage} 
                                alt={tailor.name} 
                                fill 
                                className="rounded-full object-cover" 
                                sizes="(max-width: 768px) 100px, 150px" 
                            />
                        </div>
                        <h1 className="text-2xl font-bold text-blue-700">{tailor.name}</h1>
                        <p className="text-gray-600">{tailor.specialty}</p>
                        <div className="mt-3 flex justify-center gap-2">
                            {tailor.verificationStatus === 'VERIFIED' && (
                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                    Verified Tailor
                                </span>
                            )}
                            {tailor.portfolioApproved && (
                                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                    Portfolio Approved
                                </span>
                            )}
                        </div>

                        {/* Rating and Details */}
                        <div className="flex justify-center items-center mt-4 space-x-4">
                            <div className="flex items-center">
                                <FaStar className="text-yellow-500 mr-1"/>
                                <span>{tailor.averageRating?.toFixed(1) || 'N/A'}/5</span>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="mt-4">
                            <div className="flex items-center justify-center mb-2">
                                <FaEnvelope className="mr-2 text-red-500" />
                                <span>{tailor.email}</span>
                            </div>
                        </div>

                        {/* Book Appointment Button */}
                        <button 
                            onClick={() => setShowBookingModal(true)}
                            className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:bg-blue-300"
                            disabled={!selectedAvailability || tailor.verificationStatus !== 'VERIFIED'}
                        >
                            Book Appointment
                        </button>
                        {tailor.verificationStatus !== 'VERIFIED' ? (
                            <p className="mt-3 text-sm text-amber-600">
                                This tailor must be verified before online bookings are enabled.
                            </p>
                        ) : !selectedAvailability && (
                            <p className="mt-3 text-sm text-gray-500">
                                Select an available time slot before booking.
                            </p>
                        )}
                    </div>
                </div>

                {/* Tailor Details and Portfolio */}
                <div className="md:col-span-2 space-y-6">
                    {/* Bio Section */}
                    <div className="bg-white shadow-md rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-blue-700 mb-4">About Me</h2>
                        <p className="text-gray-700">{tailor.bio || 'No bio available'}</p>
                        {(tailor.businessName || tailor.yearsOfExperience) && (
                            <div className="mt-4 space-y-1 text-sm text-gray-600">
                                {tailor.businessName && <p><span className="font-semibold">Business:</span> {tailor.businessName}</p>}
                                {typeof tailor.yearsOfExperience === 'number' && <p><span className="font-semibold">Experience:</span> {tailor.yearsOfExperience} years</p>}
                            </div>
                        )}
                    </div>

                    {/* Availability Calendar */}
                    <div className="bg-white shadow-md rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-blue-700 mb-4">Availability</h2>
                        <AvailabilityCalendar 
                            tailorId={tailor.id} 
                            onAvailabilitySelect={setSelectedAvailability}
                        />
                        {selectedAvailability && (
                            <p className="mt-4 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
                                Selected slot: {new Date(selectedAvailability.startTime).toLocaleString()} to {new Date(selectedAvailability.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        )}
                    </div>

                    {/* Tailor Portfolio */}
                    <TailorPortfolio tailorId={tailor.id} />
                </div>
            </div>

            {/* Booking Modal */}
            {showBookingModal && (
                <BookingModal 
                    tailorName={tailor.name}
                    onClose={() => setShowBookingModal(false)}
                    onPrepareBooking={prepareBooking}
                />
            )}
        </div>
    )
}
