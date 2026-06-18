'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { UserRole } from '@prisma/client'
import { motion } from 'framer-motion'
import {
  User, ClipboardList, Calendar, MapPin, Settings,
  ChevronRight, Loader2, Bell, Scissors, Users
} from "lucide-react"

interface DashboardStats {
  totalOrders?: number
  pendingOrders?: number
  totalRevenue?: number
  newMessages?: number
}

export default function Dashboard() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/login')
    }
  })

  const [dashboardSections, setDashboardSections] = useState<any[]>([])
  const [stats, setStats] = useState<DashboardStats>({})
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) {
        throw new Error('Failed to load dashboard statistics')
      }

      const data = await response.json()
      setStats(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load dashboard statistics')
    }
  }

  const initializeDashboard = async () => {
    try {
      const sections = getUserDashboardSections(session?.user?.role)
      setDashboardSections(sections)
    } catch {
      setError('Unable to load dashboard. Please try again.')
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role === 'TAILOR') {
        const hasCompletedProfile = !!session.user.tailorProfile?.specialty
        if (!hasCompletedProfile) {
          redirect('/dashboard/profile')
          return
        }
      }

      Promise.all([
        fetchDashboardStats(),
        initializeDashboard()
      ]).finally(() => setIsLoading(false))
    }
  }, [session, status])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-orange-500 mx-auto" />
          <p className="mt-4 text-slate-600 font-medium">Preparing your dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Dashboard Error</h3>
            <p className="text-slate-600">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  function getUserDashboardSections(userRole?: UserRole) {
    switch (userRole) {
      case UserRole.TAILOR:
        return [
          {
            icon: <User className="h-6 w-6 text-orange-500" />,
            title: 'Profile Management',
            description: 'Update your profile, portfolio, and services.',
            action: 'Edit Profile',
            link: '/dashboard/profile',
            bgGradient: 'from-orange-50 to-orange-100/50'
          },
          {
            icon: <ClipboardList className="h-6 w-6 text-blue-500" />,
            title: 'Orders & Projects',
            description: 'Manage ongoing and upcoming projects.',
            action: 'View Orders',
            link: '/dashboard/order',
            bgGradient: 'from-blue-50 to-blue-100/50',
            badge: stats.pendingOrders ? `${stats.pendingOrders} pending` : null
          },
          {
            icon: <Calendar className="h-6 w-6 text-violet-500" />,
            title: 'Appointments',
            description: 'Organize appointments and availability.',
            action: 'Open Calendar',
            link: '/dashboard/appointments',
            bgGradient: 'from-violet-50 to-violet-100/50'
          },
          {
            icon: <MapPin className="h-6 w-6 text-emerald-500" />,
            title: 'Map Presence',
            description: 'Review how customers see your location and listing.',
            action: 'Open Map',
            link: '/dashboard/map',
            bgGradient: 'from-emerald-50 to-emerald-100/50'
          }
        ]
      case UserRole.CUSTOMER:
        return [
          {
            icon: <MapPin className="h-6 w-6 text-orange-500" />,
            title: 'Discover Tailors',
            description: 'Find skilled tailors in your area.',
            action: 'Open Map',
            link: '/dashboard/map',
            bgGradient: 'from-orange-50 to-orange-100/50'
          },
          {
            icon: <Scissors className="h-6 w-6 text-blue-500" />,
            title: 'Quick Booking',
            description: 'Schedule your next fitting session.',
            action: 'Book Now',
            link: '/dashboard/quickBooking',
            bgGradient: 'from-blue-50 to-blue-100/50'
          },
          {
            icon: <ClipboardList className="h-6 w-6 text-violet-500" />,
            title: 'My Orders',
            description: 'Track your orders and measurements.',
            action: 'View Orders',
            link: '/dashboard/order',
            bgGradient: 'from-violet-50 to-violet-100/50',
            badge: stats.totalOrders ? `${stats.totalOrders} total` : null
          },
          {
            icon: <MapPin className="h-6 w-6 text-amber-500" />,
            title: 'Discover Tailors',
            description: 'Browse tailor locations, portfolios, and reviews.',
            action: 'Explore Map',
            link: '/dashboard/map',
            bgGradient: 'from-amber-50 to-amber-100/50'
          }
        ]
      case UserRole.ADMIN:
        return [
          {
            icon: <Users className="h-6 w-6 text-slate-500" />,
            title: 'Client Management',
            description: 'Review customers and measurement records.',
            action: 'Manage Clients',
            link: '/dashboard/ClientManagement',
            bgGradient: 'from-slate-50 to-slate-100/50'
          },
          {
            icon: <Settings className="h-6 w-6 text-indigo-500" />,
            title: 'Tailor Verification',
            description: 'Review and approve tailor trust submissions.',
            action: 'Open Queue',
            link: '/dashboard/verification',
            bgGradient: 'from-indigo-50 to-indigo-100/50'
          },
          {
            icon: <Settings className="h-6 w-6 text-slate-500" />,
            title: 'Profile',
            description: 'Review account configuration.',
            action: 'Open Profile',
            link: '/dashboard/profile',
            bgGradient: 'from-slate-50 to-slate-100/50'
          }
        ]
      default:
        return []
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                  <User className="h-8 w-8 text-orange-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    Welcome back, {session?.user?.name || 'User'}
                  </h1>
                  <p className="text-slate-500 mt-1">
                    Here&apos;s what&apos;s happening with your {session?.user?.role?.toLowerCase()} account
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
                  <Bell className="h-6 w-6" />
                  {stats.newMessages && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-orange-500 rounded-full text-white text-xs flex items-center justify-center">
                      {stats.newMessages}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            {session?.user?.role === UserRole.TAILOR && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
                {[
                  { label: 'Total Orders', value: stats.totalOrders || 0, color: 'text-blue-600' },
                  { label: 'Pending Orders', value: stats.pendingOrders || 0, color: 'text-orange-600' },
                  { label: 'Revenue', value: `$${stats.totalRevenue?.toLocaleString() || 0}`, color: 'text-emerald-600' },
                  { label: 'New Messages', value: stats.newMessages || 0, color: 'text-violet-600' }
                ].map((stat, index) => (
                  <div key={index} className="bg-slate-50 rounded-2xl p-4">
                    <p className="text-slate-600 text-sm">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Dashboard Sections */}
          <div className="grid md:grid-cols-2 gap-6">
            {dashboardSections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={section.link} className="group block">
                  <div className={`bg-gradient-to-br ${section.bgGradient} rounded-3xl p-6 shadow-lg 
                    transition-all duration-300 hover:shadow-xl hover:scale-[1.02]`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="bg-white p-3 rounded-2xl shadow-md">
                          {section.icon}
                        </div>
                        <div className="ml-4">
                          <h2 className="text-xl font-semibold text-slate-900">
                            {section.title}
                          </h2>
                          {section.badge && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-900 text-white mt-1">
                              {section.badge}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-400 
                        group-hover:text-slate-600 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="mt-4 text-slate-600 leading-relaxed">
                      {section.description}
                    </p>
                    <div className="mt-4 inline-flex items-center text-sm font-medium 
                      text-slate-900 group-hover:text-slate-700">
                      {section.action}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
