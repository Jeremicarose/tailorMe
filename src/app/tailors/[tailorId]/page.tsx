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
import AvailabilityCalendar from '../../components/AvailabilityCalendar'
import BookingModal from '../../components/BookingModal'

// Add interface for BookingDetails
interface BookingDetails {
  date: string;
  time: string;
  service: string;
  tailorId: string;
}

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
}

export default function TailorDetailPage({
    params
}: {
    params: { tailorId: string }
}) {
    const { data: session } = useSession()
    const [tailor, setTailor] = useState<Tailor | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showBookingModal, setShowBookingModal] = useState(false)
    const [selectedAvailability, setSelectedAvailability] = useState(null)

    useEffect(() => {
        const fetchTailorDetails = async () => {
            try {
                setIsLoading(true)
                
                const response = await fetch(`/api/tailors/${params.tailorId}`)
                
                if (!response.ok) {
                    throw new Error('Failed to fetch tailor details')
                }

                const transformedTailor = await response.json()
                setTailor(transformedTailor)
            } catch (err) {
                console.error('Tailor fetch error:', err)
                setError(err instanceof Error ? err.message : 'An unknown error occurred')
            } finally {
                setIsLoading(false)
            }
        }

        fetchTailorDetails()
    }, [params.tailorId])

    const handleBookAppointment = async ({
        date,
        time,
        service
    }: BookingDetails) => {
        if (!session?.user?.id) {
            alert('Please log in to book an appointment');
            return;
        }

        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tailorId: params.tailorId,
                    userId: session.user.id,
                    date,
                    time,
                    service
                })
            });

            if (!response.ok) {
                throw new Error('Failed to book appointment');
            }

            alert('Appointment booked successfully!');
            setShowBookingModal(false);
        } catch (error) {
            alert('Failed to book appointment. Please try again.');
        }
    };

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
                            className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Book Appointment
                        </button>
                    </div>
                </div>

                {/* Tailor Details and Portfolio */}
                <div className="md:col-span-2 space-y-6">
                    {/* Bio Section */}
                    <div className="bg-white shadow-md rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-blue-700 mb-4">About Me</h2>
                        <p className="text-gray-700">{tailor.bio || 'No bio available'}</p>
                    </div>

                    {/* Availability Calendar */}
                    <div className="bg-white shadow-md rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-blue-700 mb-4">Availability</h2>
                        <AvailabilityCalendar 
                            tailorId={tailor.id} 
                            isEditing={false} 
                        />
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
                    onBookAppointment={handleBookAppointment}
                />
            )}
        </div>
    )
}