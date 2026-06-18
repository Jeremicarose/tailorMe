// M-Pesa Daraja API Integration
export interface MpesaPaymentRequest {
  phoneNumber: string
  amount: number
  bookingId: string
}

interface MpesaTokenResponse {
  access_token: string
  expires_in: string
}

interface MpesaStkPushResponse {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResponseCode: string
  ResponseDescription: string
  CustomerMessage: string
  errorCode?: string
  errorMessage?: string
}

const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY || '',
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
  shortcode: process.env.MPESA_SHORTCODE || '174379',
  passkey: process.env.MPESA_PASSKEY || '',
  callbackUrl: process.env.MPESA_CALLBACK_URL || '',
  callbackToken: process.env.MPESA_CALLBACK_TOKEN || '',
  // Use sandbox for development, production URL for live
  baseUrl: process.env.NODE_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke',
}

function getMpesaCallbackUrl(): string {
  if (!MPESA_CONFIG.callbackToken) {
    return MPESA_CONFIG.callbackUrl
  }

  const callbackUrl = new URL(MPESA_CONFIG.callbackUrl)
  callbackUrl.searchParams.set('token', MPESA_CONFIG.callbackToken)
  return callbackUrl.toString()
}

async function getMpesaToken(): Promise<string> {
  const auth = Buffer.from(
    `${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`
  ).toString('base64')

  const response = await fetch(
    `${MPESA_CONFIG.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
    {
      headers: { Authorization: `Basic ${auth}` },
    }
  )

  if (!response.ok) {
    const details = await response.text()
    throw new Error(
      `Failed to get M-Pesa access token (${response.status}): ${details || response.statusText}`
    )
  }

  const data: MpesaTokenResponse = await response.json()

   if (!data.access_token) {
    throw new Error('M-Pesa access token response did not include an access token')
  }

  return data.access_token
}

function generateTimestamp(): string {
  const now = new Date()
  return now
    .toISOString()
    .replace(/[-T:.Z]/g, '')
    .slice(0, 14)
}

function generatePassword(timestamp: string): string {
  return Buffer.from(
    `${MPESA_CONFIG.shortcode}${MPESA_CONFIG.passkey}${timestamp}`
  ).toString('base64')
}

export async function initiateMpesaPayment(
  paymentDetails: MpesaPaymentRequest
): Promise<MpesaStkPushResponse> {
  // If credentials are not fully configured, use simulation mode
  if (
    !MPESA_CONFIG.consumerKey ||
    !MPESA_CONFIG.consumerSecret ||
    !MPESA_CONFIG.passkey ||
    !MPESA_CONFIG.callbackUrl
  ) {
    console.warn('M-Pesa credentials not configured - using simulation mode')
    return {
      ResponseCode: '0',
      ResponseDescription: 'Success (Simulated)',
      CheckoutRequestID: `SIM-${Date.now()}`,
      MerchantRequestID: `MERCHANT-${Date.now()}`,
      CustomerMessage: 'Simulated STK push sent',
    }
  }

  const token = await getMpesaToken()
  const timestamp = generateTimestamp()
  const password = generatePassword(timestamp)
  const amount = Math.max(1, Math.ceil(paymentDetails.amount))

  const response = await fetch(
    `${MPESA_CONFIG.baseUrl}/mpesa/stkpush/v1/processrequest`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        BusinessShortCode: MPESA_CONFIG.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: paymentDetails.phoneNumber,
        PartyB: MPESA_CONFIG.shortcode,
        PhoneNumber: paymentDetails.phoneNumber,
        CallBackURL: getMpesaCallbackUrl(),
        AccountReference: paymentDetails.bookingId,
        TransactionDesc: `Booking payment for ${paymentDetails.bookingId}`,
      }),
    }
  )

  const data = (await response.json()) as MpesaStkPushResponse

  if (!response.ok) {
    throw new Error(
      data.errorMessage ||
        data.ResponseDescription ||
        `M-Pesa STK push failed with status ${response.status}`
    )
  }

  return data
}
