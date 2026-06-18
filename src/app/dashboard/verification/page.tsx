'use client'

import { useEffect, useState } from 'react'

interface TailorReview {
  id: string
  specialty?: string | null
  businessName?: string | null
  yearsOfExperience?: number | null
  identityDocumentUrl?: string | null
  verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED'
  verificationSubmittedAt?: string | null
  verificationReviewedAt?: string | null
  verificationNotes?: string | null
  portfolioApproved: boolean
  user: {
    name?: string | null
    email: string
    phoneNumber?: string | null
  }
  services: {
    name: string
  }[]
}

export default function VerificationDashboardPage() {
  const [tailors, setTailors] = useState<TailorReview[]>([])
  const [selectedTailor, setSelectedTailor] = useState<TailorReview | null>(null)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchTailors = async () => {
      try {
        const response = await fetch('/api/admin/tailors')
        if (!response.ok) {
          throw new Error('Failed to load verification queue')
        }

        const data = await response.json()
        setTailors(Array.isArray(data) ? data : [])
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load verification queue')
      }
    }

    fetchTailors()
  }, [])

  const reviewTailor = async (
    tailor: TailorReview,
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'
  ) => {
    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch(`/api/admin/tailors/${tailor.id}/verification`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          verificationStatus,
          verificationNotes: notes,
          portfolioApproved: verificationStatus === 'VERIFIED'
        })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to update verification status')
      }

      setTailors((previous) =>
        previous.map((item) =>
          item.id === tailor.id
            ? {
                ...item,
                verificationStatus,
                verificationNotes: notes,
                verificationReviewedAt: new Date().toISOString(),
                portfolioApproved: verificationStatus === 'VERIFIED'
              }
            : item
        )
      )
      setSelectedTailor(null)
      setNotes('')
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Failed to review tailor')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tailor Verification</h1>
          <p className="mt-2 text-slate-600">Review submitted profiles and approve trusted listings.</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tailor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Business</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Submitted</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tailors.map((tailor) => (
                <tr key={tailor.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 text-sm">
                    <div className="font-medium text-slate-900">{tailor.user.name || 'Unnamed Tailor'}</div>
                    <div className="text-slate-500">{tailor.user.email}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    {tailor.businessName || tailor.specialty || 'Not provided'}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">{tailor.verificationStatus}</td>
                  <td className="px-4 py-4 text-sm text-slate-500">
                    {tailor.verificationSubmittedAt ? new Date(tailor.verificationSubmittedAt).toLocaleString() : 'Not submitted'}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <button
                      onClick={() => {
                        setSelectedTailor(tailor)
                        setNotes(tailor.verificationNotes || '')
                      }}
                      className="rounded-lg border border-orange-300 px-3 py-1.5 font-medium text-orange-700 hover:bg-orange-50"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedTailor && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{selectedTailor.user.name || 'Unnamed Tailor'}</h2>
                <p className="text-slate-500">{selectedTailor.user.email}</p>
              </div>
              <button
                onClick={() => setSelectedTailor(null)}
                className="text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-slate-500">Business Name</p>
                <p className="mt-1 text-sm text-slate-900">{selectedTailor.businessName || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Experience</p>
                <p className="mt-1 text-sm text-slate-900">
                  {typeof selectedTailor.yearsOfExperience === 'number' ? `${selectedTailor.yearsOfExperience} years` : 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Phone</p>
                <p className="mt-1 text-sm text-slate-900">{selectedTailor.user.phoneNumber || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-500">Services</p>
                <p className="mt-1 text-sm text-slate-900">
                  {selectedTailor.services.length > 0 ? selectedTailor.services.map((service) => service.name).join(', ') : 'No services listed'}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-semibold text-slate-500">Identity Document</p>
                <p className="mt-1 break-all text-sm text-slate-900">
                  {selectedTailor.identityDocumentUrl || 'Not provided'}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-semibold text-slate-700">Review Notes</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="mt-2 min-h-[120px] w-full rounded-xl border border-slate-300 p-3"
                placeholder="Add internal notes or rejection reasons"
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => reviewTailor(selectedTailor, 'PENDING')}
                disabled={isSubmitting}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Mark Pending
              </button>
              <button
                onClick={() => reviewTailor(selectedTailor, 'VERIFIED')}
                disabled={isSubmitting}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                Verify Tailor
              </button>
              <button
                onClick={() => reviewTailor(selectedTailor, 'REJECTED')}
                disabled={isSubmitting}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
