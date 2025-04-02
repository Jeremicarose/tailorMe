import NextAuth from "next-auth/next";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { authUtils } from "@/lib/auth";
import { User } from "next-auth";
import { NextApiRequest, NextApiResponse } from 'next';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "Email" },
        password: { label: "Password", type: "password", placeholder: "Password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }
      
        if (!authUtils.isValidEmail(credentials.email)) {
          throw new Error("Invalid email format");
        }
      
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: {
              tailorProfile: {
                include: {
                  services: true
                }
              }
            }
          });
      
          if (!user || !user.password) {
            throw new Error("Invalid credentials");
          }
      
          const isPasswordValid = await authUtils.comparePassword(
            credentials.password, 
            user.password
          );
      
          if (!isPasswordValid) {
            throw new Error("Invalid credentials");
          }
      
          return {
            id: user.id,
            email: user.email,
            role: user.role || UserRole.CUSTOMER,
            phoneNumber: user.phoneNumber,
            tailorProfile: user.tailorProfile ? {
              id: user.tailorProfile.id,
              specialty: user.tailorProfile.specialty,
              bio: user.tailorProfile.bio,
              location: user.tailorProfile.location,
              services: user.tailorProfile.services.map(service => ({
                id: service.id,
                name: service.name,
                description: service.description,
                price: service.price
              })),
              availability: user.tailorProfile.availability,
              maxDailyBookings: user.tailorProfile.maxDailyBookings,
              bookingNoticePeriod: user.tailorProfile.bookingNoticePeriod,
              unavailableDates: user.tailorProfile.unavailableDates 
                ? (typeof user.tailorProfile.unavailableDates === 'string' 
                   ? JSON.parse(user.tailorProfile.unavailableDates) 
                   : user.tailorProfile.unavailableDates)
                : null
            } : undefined
          } as User;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      }
    })
  ],
  
  callbacks: {
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
          phoneNumber: token.phoneNumber,
          tailorProfile: token.tailorProfile
        }
      };
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phoneNumber = user.phoneNumber;
        token.tailorProfile = user.tailorProfile;
      }

      if (trigger === 'update' && session) {
        token = { ...token, ...session.user };
      }

      return token;
    }
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },

  events: {
    async signIn(message) {
      console.log('Sign in event', { 
        user: message.user.email, 
        time: new Date().toISOString() 
      });
    },
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  debug: process.env.NODE_ENV === 'development'
};

export async function GET(req: NextApiRequest, res: NextApiResponse) {
  return await NextAuth(req, res, authOptions); // Use NextApiRequest and NextApiResponse
}

export async function POST(req: NextApiRequest, res: NextApiResponse) {
  return await NextAuth(req, res, authOptions); // Use NextApiRequest and NextApiResponse
}