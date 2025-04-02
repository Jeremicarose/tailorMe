'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useSession } from 'next-auth/react'
import AddAvailabilityForm from './AddAvailabilityForm'

const localizer = momentLocalizer(moment)

interface Availability {
  id: string
  date: Date
  startTime: Date
  endTime: Date
  status: 'AVAILABLE' | 'BOOKED' | 'BLOCKED'
  isRecurring: boolean
  recurringDays: number[]
}

export default function TailorAvailability() {
  const { data: session } = useSession()
  const [availabilities, setAvailabilities] = useState<Availability[]>([])
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [isAddingAvailability, setIsAddingAvailability] = useState(false)

  useEffect(() => {
    fetchAvailabilities()
  }, [])

  const fetchAvailabilities = async () => {
    try {
      const response = await fetch('/api/tailor/availability')
      const data = await response.json()
      setAvailabilities(data.map((a: any) => ({
        ...a,
        date: new Date(a.date),
        startTime: new Date(a.startTime),
        endTime: new Date(a.endTime)
      })))
    } catch (error) {
      console.error('Error fetching availabilities:', error)
    }
  }

  const handleSelectSlot = (slotInfo: any) => {
    setSelectedSlot(slotInfo)
    setIsAddingAvailability(true)
  }

  const handleAddAvailability = async (formData: any) => {
    try {
      const response = await fetch('/api/tailor/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          isRecurring: formData.isRecurring,
          recurringDays: formData.recurringDays
        })
      })

      if (response.ok) {
        fetchAvailabilities()
        setIsAddingAvailability(false)
      }
    } catch (error) {
      console.error('Error adding availability:', error)
    }
  }

  const calendarEvents = availabilities.map(availability => ({
    id: availability.id,
    title: `Available: ${moment(availability.startTime).format('HH:mm')} - ${moment(availability.endTime).format('HH:mm')}`,
    start: availability.startTime,
    end: availability.endTime,
    status: availability.status
  }))

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Your Availability</h1>
      
      <div className="mb-4">
        <button
          onClick={() => setIsAddingAvailability(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Availability
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-4" style={{ height: '600px' }}>
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          selectable
          onSelectSlot={handleSelectSlot}
          eventPropGetter={(event) => ({
            className: `bg-${event.status === 'BOOKED' ? 'red' : 'green'}-500`
          })}
        />
      </div>

      {isAddingAvailability && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add Availability</h2>
            <AddAvailabilityForm
              selectedSlot={selectedSlot}
              onSubmit={handleAddAvailability}
              onCancel={() => setIsAddingAvailability(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
} 