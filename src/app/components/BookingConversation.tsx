'use client'

import { useEffect, useState } from 'react'

interface MessageItem {
  id: string
  content: string
  createdAt: string
  sender: {
    id: string
    name: string | null
    email: string
    role: string
  }
}

interface BookingConversationProps {
  bookingId: string
  onConversationOpened?: () => void
}

export default function BookingConversation({ bookingId, onConversationOpened }: BookingConversationProps) {
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/bookings/${bookingId}/messages`)
        if (!response.ok) {
          throw new Error('Failed to load conversation')
        }

        const data = await response.json()
        setMessages(Array.isArray(data) ? data : [])
        onConversationOpened?.()
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load conversation')
      }
    }

    fetchMessages()
  }, [bookingId, onConversationOpened])

  const sendMessage = async () => {
    if (!draft.trim()) {
      return
    }

    try {
      setIsSending(true)
      setError(null)

      const response = await fetch(`/api/bookings/${bookingId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: draft })
      })

      const data = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to send message')
      }

      setMessages((previous) => [...previous, data])
      setDraft('')
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Failed to send message')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-slate-800">Conversation</h4>
      </div>

      <div className="max-h-64 space-y-3 overflow-y-auto rounded-lg bg-slate-50 p-3">
        {messages.length === 0 ? (
          <p className="text-sm text-slate-500">No messages yet.</p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="rounded-lg bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{message.sender.name || message.sender.email}</span>
                <span>{new Date(message.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-2 text-sm text-slate-700">{message.content}</p>
            </div>
          ))
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      <div className="mt-3 flex gap-2">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Type a message..."
          className="min-h-[80px] flex-1 rounded-lg border border-slate-300 p-3 text-sm"
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={isSending || !draft.trim()}
          className="self-end rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
