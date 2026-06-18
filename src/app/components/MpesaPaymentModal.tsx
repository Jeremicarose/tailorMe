'use client'

import React, { useState } from 'react'
import { FaMobileAlt, FaTimes } from 'react-icons/fa'

interface MpesaPaymentModalProps {
    amount: number
    bookingId: string
    onClose: () => void
    onPaymentSuccess: () => void
}

export default function MpesaPaymentModal({
    amount,
    bookingId,
    onClose, 
    onPaymentSuccess
}: MpesaPaymentModalProps) {
    const [phoneNumber, setPhoneNumber] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handlePayment = async () => {
        //Validate phone number (kenyan format)
        const cleanedNumber = phoneNumber.replace(/\D/g, '')
        const formattedNumber = cleanedNumber.startsWith('254')
            ? cleanedNumber
            : `254${cleanedNumber.slice(-9)}`

            if(formattedNumber.length !== 12) {
                setError('Invalid phone number. Use format 254712345678')
                return
            }

            setIsProcessing(true)
            setError(null)

            try {
                const response = await fetch(`/api/booking/${bookingId}/payment`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    phoneNumber: formattedNumber,
                    amount,
                  })
                })

                const data = await response.json().catch(() => null)

                if (!response.ok) {
                  throw new Error(data?.error || 'Payment initiation failed. Please try again.')
                }

                alert('Please complete the payment on your mobile phone')
                onPaymentSuccess()
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred during payment. Please try again')
            } finally {
                setIsProcessing(false)
            }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 relative">
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-600 hover:text-gray-900">
                    <FaTimes className="text-2xl" />
                  </button>

                  <div className="text-center">
                    <FaMobileAlt className="mx-auto text-5xl text-green-500 mb-4" />
                    <h2 className="text-2xl font-bold mb-4">M-Pesa Payment</h2>
                    <p className="mb-4 text-gray-600">Total Amount: <span className="font-bold text-blue-600">Ksh{amount}</span></p>

                    <div className="mb-4">
                        <label htmlFor="phoneNumber" className="block mb-2 text-gray-700">
                            Enter M-Pesa Registered Phone Number
                        </label>
                        <input 
                          type="tel" id="phoneNumber" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder = "254712345678"
                          className="w-full p-2 border rounded-lg"
                          disabled={isProcessing} />
                          {error && (
                            <p className="text-red-500 mt-2 text-sm">{error}</p>
                          )}
                    </div>

                    <button onClick={handlePayment} disabled={isProcessing || !phoneNumber} className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
                        {isProcessing ? 'Processing...' : 'Pay Now'}
                    </button>
                  </div>
            </div>
        </div>
    )
}
