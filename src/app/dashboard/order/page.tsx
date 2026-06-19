'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BookingConversation from '@/app/components/BookingConversation'
import {
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2,
    Package,
    Search,
    Calendar,
    ChevronLeft,
    Filter,
    RefreshCw,
    ChevronRight,
    ArrowUp,
    ArrowDown,
    X
} from 'lucide-react'

// Define types for order data
interface Order {
    id: string
    status: 'completed' | 'in-progress' | 'pending' | 'cancelled'
    paymentStatus: 'UNPAID' | 'INITIATED' | 'PAID' | 'FAILED' | 'CANCELLED'
    unreadCount: number
    lastAppointmentReminderSentAt?: string
    lastDeliveryReminderSentAt?: string
    date: string
    estimatedCompletionTime?: string
    customerName?: string
    service?: string
    price?: number
    notes?: string
}

// Status badge configuration
const statusConfig = {
    'completed': {color: 'bg-green-100 text-green-800', icon: CheckCircle},
    'in-progress': {color: 'bg-blue-100 text-blue-800', icon: RefreshCw},
    'pending': {color: 'bg-yellow-100 text-yellow-800', icon: Clock},
    'cancelled': { color: 'bg-red-100 text-red-800', icon: AlertCircle }
}

const paymentStatusConfig = {
    UNPAID: 'bg-slate-100 text-slate-700',
    INITIATED: 'bg-amber-100 text-amber-800',
    PAID: 'bg-emerald-100 text-emerald-800',
    FAILED: 'bg-red-100 text-red-800',
    CANCELLED: 'bg-slate-200 text-slate-700'
} as const

const Orders: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [filter, setFilter] = useState<'all' | 'completed' | 'in-progress' | 'pending' | 'cancelled'>('all')
    const [sortBy, setSortBy] = useState<'date' | 'status'>('date')
    const [searchQuery, setSearchQuery] = useState('')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
    const [selectedOrder, setSelectedOrder] = useState('')
    const [isRefreshing, setIsRefreshing] = useState(false)

    const fetchOrders = async (refresh = false) => {
        if (refresh) {
            setIsRefreshing(true)
        }

        try {
            setError(null)

            const response = await fetch('/api/booking')

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`)
            }

            const bookings = await response.json()
            const normalizedOrders: Order[] = Array.isArray(bookings)
                ? bookings.map((booking: any) => ({
                    id: booking.id,
                    status:
                        booking.status === 'COMPLETED' ? 'completed' :
                        booking.status === 'IN_PROGRESS' ? 'in-progress' :
                        booking.status === 'CANCELLED' || booking.status === 'REJECTED' ? 'cancelled' :
                        'pending',
                    date: booking.createdAt,
                    estimatedCompletionTime: booking.requestedDeliveryDate,
                    customerName: booking.tailor?.user?.name || 'Tailor',
                    service: booking.description || 'Tailoring Service',
                    price: typeof booking.measurements?.estimatedPrice === 'number' ? booking.measurements.estimatedPrice : undefined,
                    notes: booking.notes || undefined,
                    paymentStatus: booking.paymentStatus ?? 'UNPAID',
                    unreadCount: Array.isArray(booking.messages) ? booking.messages.length : 0,
                    lastAppointmentReminderSentAt: booking.lastAppointmentReminderSentAt ?? undefined,
                    lastDeliveryReminderSentAt: booking.lastDeliveryReminderSentAt ?? undefined,
                }))
                : []

            const filteredOrders = normalizedOrders
                .filter((order) => filter === 'all' || order.status === filter)
                .filter((order) => {
                    if (!searchQuery) {
                        return true
                    }
                    const query = searchQuery.toLowerCase()
                    return (
                        order.customerName?.toLowerCase().includes(query) ||
                        order.service?.toLowerCase().includes(query) ||
                        order.id.toLowerCase().includes(query)
                    )
                })
                .sort((left, right) => {
                    if (sortBy === 'status') {
                        return sortDirection === 'asc'
                            ? left.status.localeCompare(right.status)
                            : right.status.localeCompare(left.status)
                    }

                    const leftDate = new Date(left.date).getTime()
                    const rightDate = new Date(right.date).getTime()
                    return sortDirection === 'asc' ? leftDate - rightDate : rightDate - leftDate
                })

            const computedTotalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize))
            const startIndex = (page - 1) * pageSize
            const pagedOrders = filteredOrders.slice(startIndex, startIndex + pageSize)

            setOrders(pagedOrders)
            setTotalPages(computedTotalPages)
        } catch (err: any) {
            setError(err.message || 'Failed to fetch orders')
        } finally {
            setLoading(false)
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [page, pageSize, filter, sortBy, sortDirection, searchQuery])

    const handSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value)
        setPage(1)
    }

    const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSortBy(e.target.value as 'date' | 'status')
    }

    const toggleSortDirection = () => {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    }

    const handlePrevPage = () => {
        if (page > 1) setPage(prev => prev - 1)
    }

    const handleNextPage = () => {
        if (page < totalPages) setPage(prev => prev + 1)
    }

    const handleRefresh = () => {
        fetchOrders(true)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    // Render loading state
    if (loading && !isRefreshing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                <Loader2 className="h-10 w-10 animate-spin text-slate-600 mx-auto" />
                <p className="mt-4 text-slate-600 font-medium">Loading orders...</p>
            </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Orders</h1>
                <p className="text-slate-500">Manage and track your customer orders</p>
            </div>

            {/* Controls */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Search orders..."
                            className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={searchQuery}
                            onChange={handSearch}
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 items-center">
                        <div className="flex items-center bg-slate-100 rounded-md">
                            <Filter className="h-4 w-4 ml-3 text-slate-500" />
                            <select 
                                className="bg-transparent py-2 pl-2 pr-8 focus:outline-none text-sm appearance-none"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value as any)}
                            >
                                <option value="all">All Orders</option>
                                <option value="completed">Completed</option>
                                <option value="in-progress">In Progress</option>
                                <option value="pending">Pending</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div className="flex items-center bg-slate-100 rounded-md">
                            <Calendar className="h-4 w-4 ml-3 text-slate-500" />
                            <select 
                                className="bg-transparent py-2 pl-2 pr-8 focus:outline-none text-sm appearance-none"
                                value={sortBy}
                                onChange={handleSortChange}
                            >
                                <option value="date">Date</option>
                                <option value="status">Status</option>
                            </select>
                        </div>

                        <button 
                            onClick={toggleSortDirection}
                            className="p-2 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
                            aria-label={sortDirection === 'asc' ? 'Sort descending' : 'Sort ascending'}
                        >
                            {sortDirection === 'asc' ? (
                                <ArrowUp className="h-4 w-4 text-slate-500" />
                            ) : (
                                <ArrowDown className="h-4 w-4 text-slate-500" />
                            )}
                        </button>

                        <button 
                            onClick={handleRefresh}
                            className={`p-2 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
                            disabled={isRefreshing}
                            aria-label="Refresh orders"
                        >
                            <RefreshCw className="h-4 w-4 text-slate-500" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span>{error}</span>
                </div>
            )}

            {/* Orders list */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {orders.length === 0 ? (
                    <div className="p-8 text-center">
                        <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-700 mb-1">No orders found</h3>
                        <p className="text-slate-500 mb-4">
                            {searchQuery 
                                ? `No results for "${searchQuery}"`
                                : filter !== 'all' 
                                    ? `No ${filter} orders found`
                                    : 'There are no orders to display'}
                        </p>
                        {(searchQuery || filter !== 'all') && (
                            <button 
                                onClick={() => {
                                    setSearchQuery('')
                                    setFilter('all')
                                }}
                                className="text-blue-500 hover:text-blue-700 font-medium"
                            >
                                Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">
                                            Order ID
                                        </th>
                                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">
                                            Customer
                                        </th>
                                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">
                                            Service
                                        </th>
                                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">
                                            Date
                                        </th>
                                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">
                                            Status
                                        </th>
                                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">
                                            Payment
                                        </th>
                                        <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider py-3 px-4">
                                            Price
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {orders.map((order) => {
                                            const StatusIcon = statusConfig[order.status].icon;
                                            return (
                                                <motion.tr 
                                                    key={order.id}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    layoutId={order.id}
                                                    className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer ${selectedOrder === order.id ? 'bg-blue-50' : ''}`}
                                                    onClick={() => setSelectedOrder(selectedOrder === order.id ? '' : order.id)}
                                                >
                                                    <td className="py-4 px-4 text-sm font-medium text-slate-700">
                                                        #{order.id.substring(0, 8)}
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-slate-600">
                                                        <div className="flex items-center gap-2">
                                                            <span>{order.customerName || 'N/A'}</span>
                                                            {order.unreadCount > 0 && (
                                                                <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-semibold text-white">
                                                                    {order.unreadCount} new
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-slate-600">
                                                        {order.service || 'N/A'}
                                                    </td>
                                                    <td className="py-4 px-4 text-sm text-slate-600">
                                                        {formatDate(order.date)}
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[order.status].color}`}>
                                                            <StatusIcon className="h-3 w-3 mr-1" />
                                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1).replace('-', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatusConfig[order.paymentStatus]}`}>
                                                            {order.paymentStatus}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4 text-sm font-medium text-slate-700 text-right">
                                                        {order.price ? `$${order.price.toFixed(2)}` : 'N/A'}
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>

                        {/* Order details panel */}
                        <AnimatePresence>
                            {selectedOrder && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-slate-100 overflow-hidden"
                                >
                                    {orders.filter(order => order.id === selectedOrder).map(order => (
                                        <div key={order.id} className="p-6 bg-slate-50">
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="text-lg font-medium text-slate-800">Order Details</h3>
                                                <button 
                                                    onClick={() => setSelectedOrder('')}
                                                    className="text-slate-400 hover:text-slate-600"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-slate-500 mb-1">Order ID</p>
                                                    <p className="text-sm font-medium mb-3">#{order.id}</p>
                                                    
                                                    <p className="text-sm text-slate-500 mb-1">Customer</p>
                                                    <p className="text-sm font-medium mb-3">{order.customerName || 'N/A'}</p>
                                                    
                                                    <p className="text-sm text-slate-500 mb-1">Service</p>
                                                    <p className="text-sm font-medium mb-3">{order.service || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-slate-500 mb-1">Date</p>
                                                    <p className="text-sm font-medium mb-3">{formatDate(order.date)}</p>
                                                    
                                                    <p className="text-sm text-slate-500 mb-1">Estimated Completion</p>
                                                    <p className="text-sm font-medium mb-3">{order.estimatedCompletionTime || 'N/A'}</p>
                                                    
                                                    <p className="text-sm text-slate-500 mb-1">Price</p>
                                                    <p className="text-sm font-medium mb-3">{order.price ? `$${order.price.toFixed(2)}` : 'N/A'}</p>

                                                    <p className="text-sm text-slate-500 mb-1">Payment Status</p>
                                                    <p className="text-sm font-medium mb-3">{order.paymentStatus}</p>

                                                    <p className="text-sm text-slate-500 mb-1">Last Appointment Reminder</p>
                                                    <p className="text-sm font-medium mb-3">
                                                      {order.lastAppointmentReminderSentAt ? new Date(order.lastAppointmentReminderSentAt).toLocaleString() : 'Not sent'}
                                                    </p>

                                                    <p className="text-sm text-slate-500 mb-1">Last Delivery Reminder</p>
                                                    <p className="text-sm font-medium mb-3">
                                                      {order.lastDeliveryReminderSentAt ? new Date(order.lastDeliveryReminderSentAt).toLocaleString() : 'Not sent'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex gap-3">
                                                <button
                                                  type="button"
                                                  onClick={async () => {
                                                    await fetch(`/api/bookings/${order.id}/reminder`, {
                                                      method: 'POST',
                                                      headers: { 'Content-Type': 'application/json' },
                                                      body: JSON.stringify({ target: 'TAILOR' })
                                                    })
                                                  }}
                                                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                                                >
                                                  Remind Tailor
                                                </button>
                                            </div>
                                            <BookingConversation
                                              bookingId={order.id}
                                              onConversationOpened={() => {
                                                setOrders((previous) =>
                                                  previous.map((item) =>
                                                    item.id === order.id ? { ...item, unreadCount: 0 } : item
                                                  )
                                                )
                                              }}
                                            />
                                            {order.notes && (
                                                <div className="mt-2">
                                                    <p className="text-sm text-slate-500 mb-1">Notes</p>
                                                    <p className="text-sm">{order.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Pagination */}
                        <div className="py-4 px-6 flex items-center justify-between border-t border-slate-100">
                            <div className="flex items-center text-sm text-slate-500">
                                <span>
                                    Showing page {page} of {totalPages}
                                </span>
                                <select
                                    className="ml-4 px-2 py-1 border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value))
                                        setPage(1)
                                    }}
                                >
                                    <option value="5">5 per page</option>
                                    <option value="10">10 per page</option>
                                    <option value="25">25 per page</option>
                                    <option value="50">50 per page</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={handlePrevPage}
                                    disabled={page <= 1}
                                    className={`p-2 rounded-md flex items-center justify-center ${page <= 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button 
                                    onClick={handleNextPage}
                                    disabled={page >= totalPages}
                                    className={`p-2 rounded-md flex items-center justify-center ${page >= totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default Orders
