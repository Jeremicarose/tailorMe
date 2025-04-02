'use client'

import React, { useState } from 'react'
import moment from 'moment'

interface AddAvailabilityFormProps {
  selectedSlot?: any
  onSubmit: (data: any) => void
  onCancel: () => void
}

export default function AddAvailabilityForm({
  selectedSlot,
  onSubmit,
  onCancel
}: AddAvailabilityFormProps) {
  const [formData, setFormData] = useState({
    date: selectedSlot ? moment(selectedSlot.start).format('YYYY-MM-DD') : '',
    startTime: selectedSlot ? moment(selectedSlot.start).format('HH:mm') : '',
    endTime: selectedSlot ? moment(selectedSlot.end).format('HH:mm') : '',
    isRecurring: false,
    recurringDays: [] as number[]
  })

  const daysOfWeek = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
  ]

  const handleDayToggle = (dayIndex: number) => {
    setFormData(prev => {
      const days = prev.recurringDays.includes(dayIndex)
        ? prev.recurringDays.filter(d => d !== dayIndex)
        : [...prev.recurringDays, dayIndex]
      return { ...prev, recurringDays: days }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Date</label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Time</label>
          <input
            type="time"
            value={formData.startTime}
            onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">End Time</label>
          <input
            type="time"
            value={formData.endTime}
            onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isRecurring}
            onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-600">Repeat weekly</span>
        </label>
      </div>

      {formData.isRecurring && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Select days</label>
          <div className="flex flex-wrap gap-2">
            {daysOfWeek.map((day, index) => (
              <button
                key={day}
                type="button"
                onClick={() => handleDayToggle(index)}
                className={`px-3 py-1 rounded-full text-sm ${
                  formData.recurringDays.includes(index)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Save
        </button>
      </div>
    </form>
  )
} 