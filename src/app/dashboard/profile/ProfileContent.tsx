'use client'

import React from 'react'
import { 
  User, 
  Clipboard, 
  MapPin, 
  Calendar, 
  Plus, 
  Trash2
} from 'lucide-react'
import AvailabilityCalendar from '@/app/components/AvailabilityCalendar'
import type { Service, TailorProfile } from './page'

interface ProfileContentProps {
  profile: TailorProfile
  isEditing: boolean
  setProfile: React.Dispatch<React.SetStateAction<TailorProfile>>
  addService: () => void
  removeService: (index: number) => void
  updateService: (index: number, field: keyof Service, value: string | number) => void
}

export default function ProfileContent({
  profile, 
  isEditing, 
  setProfile, 
  addService, 
  removeService, 
  updateService
}: ProfileContentProps) {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Professional Details Section */}
      <div className="md:col-span-2 space-y-6">
        {/* Professional Overview */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center border-b pb-4 mb-4">
            <User className="w-6 h-6 text-indigo-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-800">Professional Overview</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Specialty */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Professional Specialty</label>
              {isEditing ? (
                <select
                  value={profile.specialty || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, specialty: e.target.value }))}
                  className="w-full rounded-xl border-gray-300 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Your Specialty</option>
                  <option value="Wedding Attire">Wedding Attire</option>
                  <option value="Formal Wear">Formal Wear</option>
                  <option value="Casual Tailoring">Casual Tailoring</option>
                  <option value="Alterations">Alterations</option>
                </select>
              ) : (
                <p className="bg-gray-100 p-3 rounded-xl text-gray-700">
                  {profile.specialty || 'Not specified'}
                </p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Professional Bio</label>
              {isEditing ? (
                <textarea
                  value={profile.bio || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Share a brief description of your tailoring expertise"
                  className="w-full rounded-xl min-h-[120px] border-gray-300 focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <p className="bg-gray-100 p-3 rounded-xl min-h-[120px] text-gray-700">
                  {profile.bio || 'No bio available'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <div className="flex items-center">
              <Clipboard className="w-6 h-6 text-indigo-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-800">Professional Services</h2>
            </div>
            {isEditing && (
              <button 
                onClick={addService}
                className="btn btn-outline btn-primary flex items-center space-x-2 rounded-xl"
              >
                <Plus className="w-5 h-5" /> 
                <span>Add Service</span>
              </button>
            )}
          </div>

          {profile.services && profile.services.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {profile.services.map((service, index) => (
                <div 
                  key={index} 
                  className="bg-gray-50 p-4 rounded-xl relative border"
                >
                  {isEditing && (
                    <button 
                      onClick={() => removeService(index)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                  {isEditing ? (
                    <div className="space-y-3">
                      <input 
                        type="text"
                        placeholder="Service Name"
                        value={service.name}
                        onChange={(e) => updateService(index, 'name', e.target.value)}
                        className="w-full rounded-xl"
                      />
                      <textarea 
                        placeholder="Service Description"
                        value={service.description}
                        onChange={(e) => updateService(index, 'description', e.target.value)}
                        className="w-full rounded-xl"
                      />
                      <input 
                        type="number"
                        placeholder="Price"
                        value={service.price}
                        onChange={(e) => updateService(index, 'price', parseFloat(e.target.value))}
                        className="w-full rounded-xl"
                      />
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-gray-800">{service.name}</h3>
                      <p className="text-gray-600 mt-2">{service.description}</p>
                      <div className="mt-4 text-indigo-600 font-bold">
                        ${service.price.toFixed(2)}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">
              No services added yet. {isEditing && 'Click "Add Service" to get started!'}
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center border-b pb-4 mb-4">
            <User className="w-6 h-6 text-indigo-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-800">Verification</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-medium mb-2">Business Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.businessName || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, businessName: e.target.value }))}
                  className="w-full rounded-xl"
                  placeholder="Studio or business name"
                />
              ) : (
                <p className="bg-gray-100 p-3 rounded-xl text-gray-700">
                  {profile.businessName || 'Not provided'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Years of Experience</label>
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  value={profile.yearsOfExperience ?? ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, yearsOfExperience: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full rounded-xl"
                  placeholder="Years in tailoring"
                />
              ) : (
                <p className="bg-gray-100 p-3 rounded-xl text-gray-700">
                  {typeof profile.yearsOfExperience === 'number' ? `${profile.yearsOfExperience} years` : 'Not provided'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Identity Document URL</label>
              {isEditing ? (
                <input
                  type="url"
                  value={profile.identityDocumentUrl || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, identityDocumentUrl: e.target.value }))}
                  className="w-full rounded-xl"
                  placeholder="Link to identification or business proof"
                />
              ) : (
                <p className="bg-gray-100 p-3 rounded-xl text-gray-700 break-all">
                  {profile.identityDocumentUrl || 'Not provided'}
                </p>
              )}
            </div>

            <div className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-800">
              <p className="font-semibold">Verification Status: {profile.verificationStatus || 'UNVERIFIED'}</p>
              {profile.verificationNotes && (
                <p className="mt-2">Review Notes: {profile.verificationNotes}</p>
              )}
            </div>

            {isEditing && profile.verificationStatus !== 'VERIFIED' && (
              <button
                type="button"
                onClick={() => setProfile(prev => ({ ...prev, verificationStatus: 'PENDING' }))}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Submit for Verification
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Location and Availability Section */}
      <div className="space-y-6">
        {/* Location */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center border-b pb-4 mb-4">
            <MapPin className="w-6 h-6 text-indigo-600 mr-3" />
            <h2 className="text-2xl font-semibold text-gray-800">Location</h2>
          </div>
          {isEditing ? (
            <input
              type="text"
              placeholder="Your Business Location"
              value={profile.location || ''}
              onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
              className="w-full rounded-xl"
            />
          ) : (
            <p className="bg-gray-100 p-3 rounded-xl text-gray-700">
              {profile.location || 'Location not specified'}
            </p>
          )}
        </div>

        {/* Availability Management */}
        <div className="bg-gray-50 p-4 md:p-6 rounded-2xl shadow-sm">
          <div className="flex items-center space-x-2 md:space-x-4 border-b border-gray-200 pb-2 md:pb-4 mb-2 md:mb-4">
            <Calendar className="text-blue-600 text-xl md:text-2xl" />
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
              Availability
            </h2>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm md:text-lg font-medium text-gray-700">
                Manage Your Availability
              </h3>
              <p className="text-gray-500 text-xs md:text-sm">
                Select dates for bookings
              </p>
            </div>
          </div>

          {isEditing ? (
            <select 
              className="select select-bordered w-full rounded-xl text-sm md:text-base"
              value={profile.availabilityStatus || 'open'}
              onChange={(e) => setProfile(prev => ({ 
                ...prev, 
                availabilityStatus: e.target.value as 'open' | 'limited' | 'closed' 
              }))}
            >
              <option value="open">Open for Bookings</option>
              <option value="limited">Limited Availability</option>
              <option value="closed">Closed</option>
            </select>
          ) : (
            <p className="text-gray-600 bg-gray-100 p-2 md:p-3 rounded-xl text-sm md:text-base">
              {profile.availabilityStatus || 'Not set'}
            </p>
          )}

          {/* Optional: Availability Calendar */}
          {!isEditing && profile.id && <AvailabilityCalendar tailorId={profile.id} />}
        </div>
      </div>
    </div>
  )
}
