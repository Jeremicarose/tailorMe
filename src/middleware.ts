import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
    // Get the pathname
    const path = request.nextUrl.pathname

    // Define protected routes that require authentication
    const protectedPaths = [
        '/dashboard',
        '/dashboard/profile',
        '/dashboard/map',
        '/dashboard/order',
        '/dashboard/quickBooking',
        '/dashboard/appointments',
        '/dashboard/verification',
        '/tailor',
    ]

    // Check if the path is a protected path
    const isPathProtected = protectedPaths.some(protectedPath => {
        return path.startsWith(protectedPath)
    })

    // If the path is not protected, allow the request
    if (!isPathProtected) {
        return NextResponse.next()
    }

    // Get the token from the request
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET
    })

    // if there's no token and the path is protected, redirect to the loggin page
    if (!token && isPathProtected) {
        const url = new URL('/login', request.url)
        url.searchParams.set('callbackUrl', encodeURI(path))
        return NextResponse.redirect(url)
    }

    // Role-based protection for tailor dashboard
    if (path.startsWith('/dashboard/profile') && token?.role !== 'TAILOR') {
        // Redirect non-tailors to general dashboard
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (path.startsWith('/dashboard/verification') && token?.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }
      // Allow the request
    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
