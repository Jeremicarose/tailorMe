'use client'

import Link from 'next/link'
import { 
  FaSearch, 
  FaCalendarCheck, 
  FaStar, 
  FaUserFriends, 
  FaMapMarkerAlt,
  FaArrowRight 
} from 'react-icons/fa'
import { MapPin, Clock, Star, Scissors, Calendar } from "lucide-react";
import { motion } from 'framer-motion'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with AI-Inspired Design */}
      <div className="relative bg-gradient-to-br from-indigo-50 via-white to-orange-50 overflow-hidden">
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Craft Your Perfect Fit
                <span className="text-orange-500">.</span>
              </h1>
              <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                AI-powered tailoring that understands your unique style. 
                Connect with expert tailors who bring your vision to life with precision and personalization.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/tailors" 
                  className="bg-orange-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-orange-600 transition-all flex items-center justify-center group shadow-lg hover:shadow-xl"
                >
                  Find Your Tailor
                  <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  href="/how-it-works" 
                  className="border border-gray-300 text-gray-800 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all flex items-center justify-center"
                >
                  I'm a Tailor
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="hidden md:block"
            >
              <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-gray-100">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-orange-50 rounded-xl p-6 text-center">
                    <FaSearch className="mx-auto text-4xl text-orange-500 mb-4" />
                    <h3 className="font-semibold text-gray-800">Expert Tailors</h3>
                  </div>
                  <div className="bg-indigo-50 rounded-xl p-6 text-center">
                    <FaCalendarCheck className="mx-auto text-4xl text-indigo-500 mb-4" />
                    <h3 className="font-semibold text-gray-800">Easy Booking</h3>
                  </div>
                  <div className="bg-green-50 rounded-xl p-6 text-center">
                    <FaStar className="mx-auto text-4xl text-green-500 mb-4" />
                    <h3 className="font-semibold text-gray-800">Quality Assured</h3>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-6 text-center">
                    <FaUserFriends className="mx-auto text-4xl text-purple-500 mb-4" />
                    <h3 className="font-semibold text-gray-800">Personal Style</h3>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
      </div>

      {/* Process Section with Modern Flow */}
      <div className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Your Tailoring Journey
            </h2>
            <p className="text-xl text-gray-600">
              A seamless, AI-enhanced process designed for your convenience
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { number: "01", title: "Style Profile", description: "Create your unique style fingerprint" },
              { number: "02", title: "AI Matching", description: "Find your perfect tailor match" },
              { number: "03", title: "Virtual Consultation", description: "Discuss details remotely" },
              { number: "04", title: "Perfect Fit", description: "Enjoy your custom garment" }
            ].map((step, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative group"
              >
                <div className="bg-white p-8 rounded-2xl hover:shadow-lg transition-all border border-gray-100">
                  <div className="text-5xl font-bold text-orange-500/20 mb-4">{step.number}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-orange-200"></div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
        <div className="mt-32">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-[#1A2B4B]">
              The Perfect Fit in Three Steps
            </h2>
            <div className="grid md:grid-cols-3 gap-12">
              {[
                {
                  icon: <MapPin size={32} />,
                  step: "1. Discover",
                  description:
                    "Find expert tailors near you and explore their specialties",
                },
                {
                  icon: <Clock size={32} />,
                  step: "2. Schedule",
                  description:
                    "Book your fitting session at your preferred time",
                },
                {
                  icon: <Scissors size={32} />,
                  step: "3. Transform",
                  description:
                    "Experience the perfect fit with our skilled artisans",
                },
              ].map((step, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center relative"
                >
                  <div className="w-20 h-20 bg-[#1A2B4B] rounded-full flex items-center justify-center mb-6 shadow-lg">
                    <div className="text-white">{step.icon}</div>
                  </div>
                  <h3 className="text-2xl font-semibold mb-3 text-[#1A2B4B]">
                    {step.step}
                  </h3>
                  <p className="text-center text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
      </div>

      {/* CTA Section with Modern Gradient */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 py-24">
        <div className="container mx-auto px-4 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Your Perfect Fit Awaits
            </h2>
            <p className="text-xl text-white/90 mb-10">
              Transform your wardrobe with AI-powered precision tailoring
            </p>
           
          </motion.div>
        </div>
      </div>
      <footer className="bg-[#1A2B4B] w-full py-12 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-300">
              © 2025 TailorLink. Crafting Excellence in Every Stitch.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}