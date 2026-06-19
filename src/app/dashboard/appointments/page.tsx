'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Scissors, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import BookingConversation from '@/app/components/BookingConversation'

interface Appointment {
  id: string
  customerName: string
  date: string
  time: string
  service: string
  status: 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'READY_FOR_FITTING' | 'CANCELLED'
  paymentStatus: 'UNPAID' | 'INITIATED' | 'PAID' | 'FAILED' | 'CANCELLED'
  unreadCount: number
  lastAppointmentReminderSentAt?: string
  lastDeliveryReminderSentAt?: string
}

export default function UpcomingAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await fetch('/api/tailor/appointments')
        if (!response.ok) throw new Error('Failed to fetch appointments')
        const data = await response.json()
        setAppointments(data)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
        setLoading(false)
      }
    }
    fetchAppointments()
  }, [])

  const handleUpdateAppointmentStatus = async (id: string, status: 'ACCEPTED' | 'CANCELLED') => {
    try {
      const response = await fetch(`/api/tailor/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!response.ok) throw new Error('Failed to update appointment')
      setAppointments(prev => 
        prev.map(appointment => 
          appointment.id === id ? { ...appointment, status } : appointment
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while updating')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <p className="text-lg font-medium text-red-500">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Upcoming Appointments</h1>
          <p className="mt-2 text-gray-600">Manage your scheduled appointments</p>
        </div>
        
        {appointments.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-4 py-8">
                <Calendar className="w-12 h-12 text-gray-400" />
                <p className="text-lg font-medium text-gray-500">No upcoming appointments</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <User className="w-5 h-5 text-gray-500" />
                        <h2 className="text-xl font-semibold text-gray-900">
                          {appointment.customerName}
                        </h2>
                        {appointment.unreadCount > 0 && (
                          <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-semibold text-white">
                            {appointment.unreadCount} new
                          </span>
                        )}
                      </div>
                      
                      <div className="grid gap-2">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{appointment.date}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{appointment.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Scissors className="w-4 h-4" />
                          <span>{appointment.service}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="font-medium">Payment:</span>
                          <span>{appointment.paymentStatus}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="font-medium">Last Reminder:</span>
                          <span>
                            {appointment.lastAppointmentReminderSentAt
                              ? new Date(appointment.lastAppointmentReminderSentAt).toLocaleString()
                              : 'Not sent'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-4">
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold
                        ${appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                          appointment.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' : 
                          appointment.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          appointment.status === 'READY_FOR_FITTING' ? 'bg-purple-100 text-purple-800' :
                          'bg-red-100 text-red-800'}`}>
                        {appointment.status}
                      </span>
                      
                      {appointment.status === 'PENDING' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateAppointmentStatus(appointment.id, 'ACCEPTED')}
                            className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => handleUpdateAppointmentStatus(appointment.id, 'CANCELLED')}
                            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={async () => {
                        await fetch(`/api/bookings/${appointment.id}/reminder`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ target: 'CUSTOMER' })
                        })
                      }}
                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                      Remind Customer
                    </button>
                  </div>
                  <BookingConversation
                    bookingId={appointment.id}
                    onConversationOpened={() => {
                      setAppointments((previous) =>
                        previous.map((item) =>
                          item.id === appointment.id ? { ...item, unreadCount: 0 } : item
                        )
                      )
                    }}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
