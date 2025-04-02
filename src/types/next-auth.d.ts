import { UserRole } from "@prisma/client"
import NextAuth from "next-auth"

declare module "next-auth" {
    interface User {
        id: string
        role: UserRole
        phoneNumber?: string | null
        tailorProfile?: {
            id: string
            specialty?: string | null
            bio?: string | null
            location?: string | null
            services?: {
                id?: string
                name: string
                description?: string | null
                price: number
            }[]
            availability?: string | null
            maxDailyBookings?: number | null
            bookingNoticePeriod?: string | null
            unavailableDates?: string | null
        }
    }

    interface Session {
        user: User & {
            id: string
            role: UserRole
            phoneNumber?: string | null
            tailorProfile?: {
                id: string
                specialty?: string | null
                bio?: string | null
                location?: string | null
                services?: {
                    id?: string
                    name: string
                    description?: string | null
                    price: number
                }[]
                availabilityStatus?: string | null
                maxDailyBookings?: number | null
                bookingNoticePeriod?: string | null
                unavailableDates?: string | null
            }
        }
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: UserRole
        phoneNumber?: string | null
        tailorProfile?: {
            id: string
            specialty?: string | null
            bio?: string | null
            location?: string | null
            services?: {
                id?: string
                name: string
                description?: string | null
                price: number
            }[]
            availabilityStatus?: string | null
            maxDailyBookings?: number | null
            bookingNoticePeriod?: string | null
            unavailableDates?: string | null
        }
    }
}

export {}