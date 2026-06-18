'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, dateFnsLocalizer, Event } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = { 'en-US': enUS }
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

export interface TailorAvailability {
  id: string
  status: string
  date: string
  startTime: string
  endTime: string
}

interface AvailabilityEvent extends Event {
  resource: TailorAvailability
}

interface AvailabilityCalendarProps {
  tailorId: string
  onAvailabilitySelect?: (availability: TailorAvailability) => void
}

export default function AvailabilityCalendar({
  tailorId,
  onAvailabilitySelect
}: AvailabilityCalendarProps) {
  const [events, setEvents] = useState<AvailabilityEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tailorId) {
      setError('No Tailor ID provided. Please log in or complete your profile.')
      setIsLoading(false)
      return
    }

    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [tailorId])

  useEffect(() => {
    if (!tailorId) return

    const fetchAvailabilities = async () => {
      try {
        const response = await fetch(`/api/tailor/${tailorId}/availability`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format received')
        }

        const calendarEvents = data.map((availability: TailorAvailability) => ({
          title: `${new Date(availability.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(availability.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          start: new Date(availability.startTime),
          end: new Date(availability.endTime),
          resource: availability,
        }))
        setEvents(calendarEvents)
      } catch (error) {
        console.error('Failed to fetch availabilities', error)
        setError(error instanceof Error ? error.message : 'Unknown error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAvailabilities()
  }, [tailorId])

  if (isLoading) {
    return <div>Loading availability...</div>
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 bg-red-50 rounded-xl">
        <p>{error}</p>
        <p>Please ensure you are logged in and have completed your profile.</p>
      </div>
    )
  }

  return (
    <div>
      {events.length > 0 ? (
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={(event) => onAvailabilitySelect?.(event.resource)}
          style={{ height: 500 }}
        />
      ) : (
        <p className="text-gray-500 text-center">
          No availability data found. Set your availability to get started.
        </p>
      )}
    </div>
  )
}
