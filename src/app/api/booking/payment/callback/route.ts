import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type MpesaCallbackMetadataItem = {
  Name: string
  Value?: string | number
}

type MpesaCallbackBody = {
  Body?: {
    stkCallback?: {
      MerchantRequestID?: string
      CheckoutRequestID?: string
      ResultCode?: number
      ResultDesc?: string
      CallbackMetadata?: {
        Item?: MpesaCallbackMetadataItem[]
      }
    }
  }
}

function getMetadataValue(
  metadata: MpesaCallbackMetadataItem[] | undefined,
  name: string
) {
  return metadata?.find((item) => item.Name === name)?.Value
}

function getRequestIps(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  const ips = [
    ...(forwarded ? forwarded.split(',').map((ip) => ip.trim()) : []),
    ...(realIp ? [realIp.trim()] : []),
  ]

  return ips.filter(Boolean)
}

export async function POST(request: Request) {
  try {
    const callbackToken = process.env.MPESA_CALLBACK_TOKEN
    if (callbackToken) {
      const token = new URL(request.url).searchParams.get('token')
      if (token !== callbackToken) {
        return NextResponse.json({ error: 'Invalid callback token' }, { status: 401 })
      }
    }

    const allowlist = (process.env.MPESA_CALLBACK_IP_ALLOWLIST || '')
      .split(',')
      .map((ip) => ip.trim())
      .filter(Boolean)

    if (allowlist.length > 0) {
      const requestIps = getRequestIps(request)
      const isAllowed = requestIps.some((ip) => allowlist.includes(ip))

      if (!isAllowed) {
        return NextResponse.json({ error: 'Callback source is not allowed' }, { status: 401 })
      }
    }

    const payload = (await request.json()) as MpesaCallbackBody
    const callback = payload.Body?.stkCallback

    if (!callback?.CheckoutRequestID || !callback.MerchantRequestID) {
      return NextResponse.json({ error: 'Invalid callback payload' }, { status: 400 })
    }

    const booking = await prisma.booking.findFirst({
      where: {
        paymentReference: callback.CheckoutRequestID,
        paymentMerchantRequestId: callback.MerchantRequestID,
        paymentMethod: 'MPESA',
      }
    })

    if (!booking) {
      return NextResponse.json({ success: true, ignored: true, reason: 'No matching MPESA booking found' })
    }

    if (booking.paymentStatus === 'PAID') {
      return NextResponse.json({ success: true, idempotent: true })
    }

    if (booking.paymentStatus !== 'INITIATED') {
      return NextResponse.json({
        success: true,
        ignored: true,
        reason: `Booking is not awaiting payment callback (${booking.paymentStatus})`
      })
    }

    const resultCode = Number(callback.ResultCode ?? -1)
    const resultDesc = callback.ResultDesc || 'Unknown payment callback result'
    const metadata = callback.CallbackMetadata?.Item

    const mpesaReceiptNumber = String(getMetadataValue(metadata, 'MpesaReceiptNumber') || '')
    const amount = Number(getMetadataValue(metadata, 'Amount') || booking.paymentAmount || 0)

    await prisma.$transaction(async (prisma) => {
      if (resultCode === 0) {
        const amountMismatch =
          Number.isFinite(amount) &&
          booking.paymentAmount !== null &&
          booking.paymentAmount !== undefined &&
          booking.paymentAmount !== amount

        if (amountMismatch) {
          throw new Error('Payment callback amount does not match expected booking amount')
        }

        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            paymentStatus: 'PAID',
            paymentAmount: Number.isFinite(amount) ? amount : booking.paymentAmount,
            paymentReference: mpesaReceiptNumber || callback.CheckoutRequestID,
            paymentMerchantRequestId: callback.MerchantRequestID || booking.paymentMerchantRequestId,
            paymentConfirmedAt: new Date(),
            paymentFailureReason: null,
          }
        })
      } else {
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            status: 'CANCELLED',
            paymentStatus: 'FAILED',
            paymentMerchantRequestId: callback.MerchantRequestID || booking.paymentMerchantRequestId,
            paymentFailureReason: resultDesc,
          }
        })

        await prisma.availability.update({
          where: { id: booking.availabilityId },
          data: { status: 'AVAILABLE' }
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process payment callback' },
      { status: 500 }
    )
  }
}
