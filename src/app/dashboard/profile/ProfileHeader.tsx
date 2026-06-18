'use client'

import { User, Edit, Save, X } from 'lucide-react'

interface ProfileHeaderProps {
    isEditing: boolean
    setIsEditing: (editing: boolean) => void
    handleSave: () => void
    isSaving: boolean
    verificationStatus?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED'
}

export default function ProfileHeader ({
    isEditing,
    setIsEditing,
    handleSave,
    isSaving,
    verificationStatus
}: ProfileHeaderProps) {
    return (
        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border-gray-100">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-6 md:p-8 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-6">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                        <User className="w-10 h-10 text-white/80" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Professional Profile</h1>
                        <p className="text-white/80 mt-2">Showcase your tailoring expertise</p>
                        {verificationStatus && (
                            <span className="mt-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
                                Verification: {verificationStatus}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex space-x-4">
                    {!isEditing ? (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="btn btn-ghost text-white hover:bg-white/20 flex items-center space-x-2 px-4 py-2 rounded-xl"
                        >
                            <Edit className="w-5 h-5" />
                            <span>Edit Profile</span>
                        </button>
                    ) : (
                        <div className="flex space-x-4">
                            <button 
                                onClick={handleSave}
                                className="btn btn-success bg-green-500 text-white hover:bg-green-600 flex items-center space-x-2 px-4 py-2 rounded-xl"
                            >
                                <Save className="w-5 h-5" />
                                <span>Save Changes</span>
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="btn btn-ghost text-white hover:bg-white/20 flex items-center space-x-2 px-4 py-2 rounded-xl"
                            >
                                <X className="w-5 h-5" />
                                <span>Cancel</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
