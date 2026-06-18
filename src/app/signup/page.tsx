'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaArrowRight, FaUser, FaCut } from 'react-icons/fa'
import { useSession } from 'next-auth/react'

export default function SignupPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // If already logged in, redirect to appropriate dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    role: 'CUSTOMER'
  })
  
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRoleSelect = (role: 'CUSTOMER' | 'TAILOR') => {
    setFormData(prev => ({
      ...prev,
      role
    }))
    setStep(2)
  }

  const validateForm = () => {
    if (!formData.name.trim()) return 'Name is required'
    if (!formData.email.trim()) return 'Email is required'
    if (!/\S+@\S+\.\S+/.test(formData.email)) return 'Email is invalid'
    if (!formData.password) return 'Password is required'
    if (formData.password.length < 8) return 'Password must be at least 8 characters'
    if (formData.password !== formData.confirmPassword) return 'Passwords do not match'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validateForm()
    
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phoneNumber: formData.phoneNumber,
          role: formData.role
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to login page with success message
        router.push(`/login?registered=true&role=${formData.role.toLowerCase()}`)
      } else {
        setError(data.error || 'Signup failed')
      }
    } catch (err) {
      console.error(err)
      setError('An error occurred during signup')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-center">
          <h2 className="text-2xl font-bold text-gray-800">Loading...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Create Your Account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join our community of tailors and customers
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {step === 1 ? (
          // Step 1: Role selection
          <div className="mt-8 space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">I am a...</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleRoleSelect('CUSTOMER')}
                className="flex flex-col items-center justify-center p-6 border-2 border-gray-300 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-colors"
              >
                <FaUser className="text-4xl text-orange-500 mb-4" />
                <span className="text-lg font-medium text-gray-900">Customer</span>
                <span className="text-sm text-gray-500 mt-2 text-center">
                  Looking for tailoring services
                </span>
              </button>
              
              <button
                type="button"
                onClick={() => handleRoleSelect('TAILOR')}
                className="flex flex-col items-center justify-center p-6 border-2 border-gray-300 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-colors"
              >
                <FaCut className="text-4xl text-orange-500 mb-4" />
                <span className="text-lg font-medium text-gray-900">Tailor</span>
                <span className="text-sm text-gray-500 mt-2 text-center">
                  Offering tailoring services
                </span>
              </button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        ) : (
          // Step 2: Account details
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Back
              </button>
              
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  <span className="flex items-center">
                    Create Account <FaArrowRight className="ml-2" />
                  </span>
                )}
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                  Log in
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
