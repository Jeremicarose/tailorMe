'use client'

import React, { useState, useEffect } from 'react'

interface Client {
  id: string
  name: string
  email: string
  phone: string
  bookingStatus?: string
  paymentStatus?: string
  paymentFailureReason?: string | null
  measurements?: {
    chest?: number
    waist?: number
    hips?: number
  }
}

interface ReminderRun {
  id: string
  triggerType: 'ADMIN' | 'TOKEN'
  status: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'DRY_RUN'
  triggeredBy?: string | null
  totalBookingsScanned: number
  appointmentRemindersDue: number
  appointmentRemindersSent: number
  deliveryRemindersDue: number
  deliveryRemindersSent: number
  errorMessage?: string | null
  startedAt: string
  completedAt?: string | null
}

function ClientManagement() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reminderRunResult, setReminderRunResult] = useState<string | null>(null)
  const [reminderRuns, setReminderRuns] = useState<ReminderRun[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsResponse, runsResponse] = await Promise.all([
          fetch('/api/admin/payment-overview'),
          fetch('/api/admin/reminders/run')
        ])

        if (!clientsResponse.ok) {
          throw new Error('Failed to load payment overview')
        }

        if (!runsResponse.ok) {
          throw new Error('Failed to load reminder history')
        }

        const data = await clientsResponse.json()
        const runsData = await runsResponse.json()
        const mappedClients: Client[] = Array.isArray(data)
          ? data.map((booking: any) => ({
              id: booking.id,
              name: booking.user?.name || 'Unknown Customer',
              email: booking.user?.email || 'N/A',
              phone: 'N/A',
              bookingStatus: booking.status,
              paymentStatus: booking.paymentStatus,
              paymentFailureReason: booking.paymentFailureReason ?? null,
              measurements: typeof booking.measurements === 'object' && booking.measurements
                ? {
                    chest: typeof booking.measurements.chest === 'number' ? booking.measurements.chest : undefined,
                    waist: typeof booking.measurements.waist === 'number' ? booking.measurements.waist : undefined,
                    hips: typeof booking.measurements.hips === 'number' ? booking.measurements.hips : undefined,
                  }
                : undefined,
            }))
          : []

        setClients(mappedClients)
        setReminderRuns(Array.isArray(runsData) ? runsData : [])
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load payment overview')
      }
    }

    fetchData()
  }, [])

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Client Management</h1>
        <button
          type="button"
          onClick={async () => {
            const response = await fetch('/api/admin/reminders/run', {
              method: 'POST'
            })
            const data = await response.json().catch(() => null)
            if (response.ok) {
              setReminderRunResult(`Sent ${data?.appointmentRemindersSent ?? 0} appointment reminders and ${data?.deliveryRemindersSent ?? 0} delivery reminders`)
              const refreshedRuns = await fetch('/api/admin/reminders/run')
              const runsData = await refreshedRuns.json().catch(() => [])
              setReminderRuns(Array.isArray(runsData) ? runsData : [])
            } else {
              setReminderRunResult(data?.error || 'Failed to run reminders')
            }
          }}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Run Reminders
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {reminderRunResult && (
        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          {reminderRunResult}
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Payment</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{client.name}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{client.email}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{client.phone}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{client.paymentStatus || 'N/A'}</td>
                <td className="whitespace-nowrap px-6 py-4 text-sm">
                  <button
                    onClick={() => {
                      setSelectedClient(client)
                      setIsDetailsOpen(true)
                    }}
                    className="rounded-md border border-orange-500 px-3 py-1.5 text-sm font-medium text-orange-500 hover:bg-orange-50 transition-colors"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Reminder Run History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Started</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Trigger</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Scanned</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Appointment</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Delivery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {reminderRuns.map((run) => (
                <tr key={run.id}>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{new Date(run.startedAt).toLocaleString()}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{run.triggerType}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{run.status}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{run.totalBookingsScanned}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{run.appointmentRemindersSent}/{run.appointmentRemindersDue}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{run.deliveryRemindersSent}/{run.deliveryRemindersDue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Dialog */}
      {isDetailsOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsDetailsOpen(false)}>
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Client Details</h2>
              <button onClick={() => setIsDetailsOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Name</span>
                <p className="text-sm text-gray-900">{selectedClient.name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Email</span>
                <p className="text-sm text-gray-900">{selectedClient.email}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Phone</span>
                <p className="text-sm text-gray-900">{selectedClient.phone}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Booking Status</span>
                <p className="text-sm text-gray-900">{selectedClient.bookingStatus || 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Payment Status</span>
                <p className="text-sm text-gray-900">{selectedClient.paymentStatus || 'N/A'}</p>
              </div>
              {selectedClient.paymentFailureReason && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Payment Failure</span>
                  <p className="text-sm text-red-600">{selectedClient.paymentFailureReason}</p>
                </div>
              )}
              {selectedClient.measurements && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Measurements</span>
                  <div className="mt-1 grid grid-cols-3 gap-2">
                    {selectedClient.measurements.chest && (
                      <div className="rounded bg-gray-50 p-2 text-center">
                        <span className="block text-xs text-gray-500">Chest</span>
                        <span className="text-sm font-medium">{selectedClient.measurements.chest}&quot;</span>
                      </div>
                    )}
                    {selectedClient.measurements.waist && (
                      <div className="rounded bg-gray-50 p-2 text-center">
                        <span className="block text-xs text-gray-500">Waist</span>
                        <span className="text-sm font-medium">{selectedClient.measurements.waist}&quot;</span>
                      </div>
                    )}
                    {selectedClient.measurements.hips && (
                      <div className="rounded bg-gray-50 p-2 text-center">
                        <span className="block text-xs text-gray-500">Hips</span>
                        <span className="text-sm font-medium">{selectedClient.measurements.hips}&quot;</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => setIsDetailsOpen(false)}
              className="mt-6 w-full rounded-md bg-orange-500 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Page() {
  return <ClientManagement />
}
