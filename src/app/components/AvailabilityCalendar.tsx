'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Calendar, momentLocalizer, Event, SlotInfo } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'

// Define event type
interface TailorAvailability extends Event {
  id: string
  status: 'available' | 'booked' | 'unavailable' | 'selected'
  date: Date | string
}

interface AvailabilityCalendarProps {
  tailorId: string
  isEditing?: boolean
  initialSelectedDates?: Date[]
  onDateSelect?: (date: Date) => void
}

export default function AvailabilityCalendar({ 
  tailorId, 
  isEditing = false,
  initialSelectedDates = [],
  onDateSelect 
}: AvailabilityCalendarProps) {
  const localizer = momentLocalizer(moment)
  
  // Always create a stable array of dates, even if empty
  const safeInitialSelectedDates = useMemo(() => {
    if (!initialSelectedDates || initialSelectedDates.length === 0) {
      return [];
    }
    
    return initialSelectedDates.map(date => {
      try {
        return moment(date).startOf('day').toDate();
      } catch (error) {
        console.error('Error parsing date:', date, error);
        return new Date(); // Fallback to current date
      }
    });
  }, [initialSelectedDates]);

  // Always use useState, even with an empty array
  const [selectedDates, setSelectedDates] = useState<Date[]>(safeInitialSelectedDates);
  
  // Separate state for events and other dependencies
  const [events, setEvents] = useState<Event[]>([]);
  const [availabilities, setAvailabilities] = useState<TailorAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comprehensive logging at component initialization
  useEffect(() => {
    console.group('AvailabilityCalendar Initialization')
    console.log('Tailor ID:', tailorId)
    console.log('Is Editing:', isEditing)
    console.log('Initial Selected Dates:', initialSelectedDates)
    console.log('Initial Selected Dates Count:', initialSelectedDates.length)
    console.log('On Date Select Function:', !!onDateSelect)
    console.groupEnd()

    // Validate tailorId
    if (!tailorId) {
      const errorMessage = 'No Tailor ID provided. Please log in or complete your profile.'
      console.error('AvailabilityCalendar Error:', errorMessage)
      setError(errorMessage)
      setIsLoading(false)
      return
    }

    // Simulate loading for better UX
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [tailorId, isEditing, initialSelectedDates, onDateSelect])

  // Fetch availabilities when component mounts or tailorId changes
  useEffect(() => {
    const fetchAvailabilities = async () => {
      // Only attempt to fetch if tailorId is valid
      if (!tailorId) {
        console.warn('Cannot fetch availabilities: No Tailor ID')
        return
      }

      try {
        const response = await fetch(`/api/tailors/${tailorId}/availabilities`);
        
        // Check if response is ok
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Validate data
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format received');
        }

        setAvailabilities(data);
        
        // Convert availabilities to calendar events
        const calendarEvents = data.map((avail: TailorAvailability) => ({
          title: avail.status,
          start: new Date(avail.date),
          end: new Date(avail.date),
          // Add additional event properties as needed
        }));
        
        setEvents(calendarEvents);
      } catch (error) {
        console.error('Failed to fetch availabilities', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
      }
    }

    // Only fetch if tailorId is valid
    if (tailorId) {
      fetchAvailabilities();
    }
  }, [tailorId])

  // Render loading or error state if necessary
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

  // Render calendar or placeholder
  return (
    <div>
      {events.length > 0 ? (
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
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