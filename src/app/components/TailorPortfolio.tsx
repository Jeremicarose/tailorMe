// src/app/components/TailorPortfolio.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { FaExpand } from 'react-icons/fa'

interface PortfolioItem {
  id: string
  imageUrl: string
  description: string
  garmentType: string
}

interface TailorPortfolioProps {
  tailorId: string
}

export default function TailorPortfolio({ tailorId }: TailorPortfolioProps) {
  const [selectedImage, setSelectedImage] = useState<PortfolioItem | null>(null)
  
  // Updated portfolio items with placeholder images
  const portfolioItems: PortfolioItem[] = [
    {
      id: '1',
      imageUrl: '/portfolio/Valine5.jpg',
      description: 'Elegant wedding dress with intricate lace details',
      garmentType: 'Wedding Dress'
    },
    {
      id: '2',
      imageUrl: '/portfolio/Valine1.jpg',
      description: 'Custom-tailored three-piece suit',
      garmentType: 'Formal Wear'
    },
    {
      id: '3',
      imageUrl: '/portfolio/Valine2.jpg',
      description: 'Stunning evening gown with silk finish',
      garmentType: 'Evening Wear'
    }
  ]

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-blue-700">Portfolio</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {portfolioItems.map(item => (
          <div 
            key={item.id} 
            className="relative group cursor-pointer"
            onClick={() => setSelectedImage(item)}
          >
            <div className="w-full h-48 relative">
              <Image 
                src={item.imageUrl} 
                alt={item.description}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                <FaExpand className="text-white opacity-0 group-hover:opacity-100 text-2xl" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox for selected image */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl max-h-full relative w-full h-[80vh]">
            <Image 
              src={selectedImage.imageUrl}
              alt={selectedImage.description}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
              className="object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 text-white text-center bg-black bg-opacity-50 p-4">
              <h3 className="text-xl font-bold">{selectedImage.description}</h3>
              <p className="text-gray-300">{selectedImage.garmentType}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}