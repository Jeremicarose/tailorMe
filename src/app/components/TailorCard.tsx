'use client'

import React from 'react'
import { FaMapMarkerAlt, FaStar } from 'react-icons/fa'
import Link from 'next/link'

interface Tailor {
    id: string
    name: string
    speciality: string
    rating: number
    distance: number
    availability: string[]
}

interface TailorCardProps {
    tailor: Tailor
    
}

export default function TailorCard({ tailor }: TailorCardProps) {
    return (
        <div className="bg-white shadow-md rounded-lg p-5 hover:shadow-xl transition-all">
            <div className="flex justify-between items-center mb-3">
                <Link href={`/tailors/${tailor.id}`} className="text-xl font-bold text-blue-700 hover:text-blue-900">
                {tailor.name}
                </Link>
                
                <div className="flex items-center">
                    <FaStar className="text-yellow-400 mr-1" />
                    <span className="font-semibold">
                        {tailor.rating}
                    </span>
                </div>
            </div>
            <p className="text-gray-600 mb-2">{tailor.speciality}</p>
            <div className="flex items-center text-sm text-gray-500 mb-3">
                <FaMapMarkerAlt className="mr-2 text-blue-500" />
                <span>{tailor.distance}</span>
            </div>
            <div className="text-sm mb-4">
                <strong className="text-gray-700">Available:</strong>
                <p className="text-gray-600">
                    {tailor.availability.join(' | ')}
                </p>
            </div>
            <Link href={`/tailors/${tailor.id}`} className="w-full block text-center bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors">
            View Profile
            </Link>
           
        </div>
    )
}