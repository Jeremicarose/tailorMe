import axios from 'axios'

// M-Pesa Configuration
export interface MpesaPaymentRequest {
    phoneNumber: string
    amount: number
    bookingId: string
}

export async function initiateMpesaPayment(paymentDetails: MpesaPaymentRequest) {
    try {
        //Simulate M-Pesa payment flow
        console.log('Initiating M-Pesa Payment:', paymentDetails)

        //Simulate API call
        return {
            ResponseCode: '0',
            ResponseDescription: 'Success',
            CheckoutRequestID:
        `MPESA-${Date.now()}`,
             MerchantRequestID:
        `MERCHANT-${Date.now()}`
        }
    } catch (error) {
        console.error('M-Pesa Payment Initiation Failed:', error)
        throw new Error('Payment initiation failed')
    }
}