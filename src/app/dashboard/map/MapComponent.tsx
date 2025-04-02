'use client'

import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import mapboxgl from 'mapbox-gl'
import Image from 'next/image'
import { FaUser, FaMapMarker, FaTools, FaCheckCircle } from 'react-icons/fa'
import Link from 'next/link'

// Initialize Mapbox token
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

if (!MAPBOX_TOKEN) {
  console.error('Mapbox token is required');
}

// Ensure RTL plugin is set only once
if (typeof window !== 'undefined' && MAPBOX_TOKEN) {
  try {
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    if (!mapboxgl.getRTLTextPluginStatus()) {
      mapboxgl.setRTLTextPlugin(
        'https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.2.3/mapbox-gl-rtl-text.js',
        null,
        true // Lazy load the plugin
      );
    }
  } catch (error) {
    console.error('Error initializing Mapbox:', error);
  }
}

interface MapComponentProps {
  tailors: TailorMapData[]
  selectedTailor: TailorMapData | null
  setSelectedTailor: (tailor: TailorMapData | null) => void
  renderStars: (rating: number) => string
}

interface TailorMapData {
  id: string
  name: string
  profileImage?: string
  latitude: number
  longitude: number
  specialty?: string
  address?: string
  averageRating: number
  services: string[]
  totalReviews: number
  completionRate: number
}

const TailorMarker = ({ name, isSelected }: { name: string; isSelected: boolean }) => (
  <div className={`
    group relative p-3 rounded-lg shadow-lg 
    ${isSelected ? 'bg-blue-500' : 'bg-white'}
    hover:scale-110 transform transition-all duration-200
    cursor-pointer
  `}>
    {/* Scissors icon */}
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={isSelected ? 'white' : '#E11D48'} 
      className="w-6 h-6"
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="6" cy="6" r="3"/>
      <circle cx="6" cy="18" r="3"/>
      <line x1="20" y1="4" x2="8.12" y2="15.88"/>
      <line x1="14.47" y1="14.48" x2="20" y2="20"/>
      <line x1="8.12" y1="8.12" x2="12" y2="12"/>
    </svg>

    {/* Hover tooltip */}
    <div className="
      absolute -top-10 left-1/2 transform -translate-x-1/2
      bg-black text-white px-2 py-1 rounded text-sm whitespace-nowrap
      opacity-0 group-hover:opacity-100 transition-opacity duration-200
      pointer-events-none
    ">
      {name}
    </div>
  </div>
);

/**
 * MapComponent renders an interactive Mapbox map displaying tailor locations.
 * It allows users to interact with tailor markers and view detailed information.
 * 
 * Props:
 * - tailors: Array of tailor data to be displayed on the map.
 * - selectedTailor: Currently selected tailor.
 * - setSelectedTailor: Function to update the selected tailor.
 * - renderStars: Function to render rating stars for tailors.
 */
export default function MapComponent({ 
  tailors, 
  selectedTailor, 
  setSelectedTailor, 
  renderStars 
}: MapComponentProps) {
  const mapRef = useRef<any>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // Initialize map with error handling
  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      setMapError('Mapbox token is missing');
    }
  }, []);

  type ViewportState = {
    latitude: number;
    longitude: number;
    zoom: number;
    bearing: number;
    pitch: number;
    projection: { readonly name: "globe" };
  };

  const defaultCenter = {
    latitude: -1.292066,
    longitude: 36.821946
  }

  const [viewport, setViewport] = useState<ViewportState>({
    latitude: 0,
    longitude: 0,
    zoom: 1.5,
    bearing: 0,
    pitch: 45,
    projection: { name: "globe" }
  });

  const flyToLocation = useCallback((lat: number, lng: number, zoom: number) => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: zoom,
        duration: 3000,
        essential: true
      });
    }
  }, []);

  const zoomToNairobi = useCallback(() => {
    flyToLocation(defaultCenter.latitude, defaultCenter.longitude, 5);
  }, [flyToLocation]);

  const handleTailorClick = useCallback((tailor: TailorMapData) => {
    setSelectedTailor(tailor)
    // Optional: If you want to programmatically navigate
    // router.push(`/tailors/${tailor.id}`)
  }, [setSelectedTailor]);

  // Memoize the markers to prevent unnecessary re-renders
  const markers = useMemo(() => {
    return Array.isArray(tailors) && tailors.map((tailor) => (
      <Marker
        key={tailor.id}
        latitude={tailor.latitude}
        longitude={tailor.longitude}
        onClick={() => handleTailorClick(tailor)}
      >
        <TailorMarker 
          name={tailor.name} 
          isSelected={selectedTailor?.id === tailor.id}
        />
      </Marker>
    ));
  }, [tailors, handleTailorClick, setSelectedTailor, selectedTailor]);

  // Debounce viewport updates
  const handleMove = useCallback((evt: any) => {
    setViewport({
      ...evt.viewState,
      projection: { name: "globe" }
    });
  }, []);

  return (
    <div className="relative w-full h-full">
      {mapError ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <p className="text-red-500">{mapError}</p>
        </div>
      ) : (
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={viewport}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
          projection={{ name: "globe" }}
          fog={{
            range: [1, 2],
            color: "#ffffff",
            "horizon-blend": 0.03
          }}
          terrain={{ source: "mapbox-dem", exaggeration: 1.5 }}
          attributionControl={false}
          onLoad={() => {
            setTimeout(zoomToNairobi, 2000);
          }}
          onMove={handleMove}
          onError={(e) => {
            console.error('Map error:', e);
            setMapError('Error loading map');
          }}
        >
          <NavigationControl position="top-right" />
          {markers}
          {selectedTailor && (
            <Popup
              latitude={selectedTailor.latitude}
              longitude={selectedTailor.longitude}
              closeButton={true}
              closeOnClick={false}
              onClose={() => setSelectedTailor(null)}
              anchor="bottom"
              className="custom-popup"
            >
              <div className="p-4 max-w-sm mx-auto bg-white rounded-xl shadow-lg">
                <div className="flex items-center space-x-4 mb-4">
                  {selectedTailor.profileImage ? (
                    <Image 
                      src={selectedTailor.profileImage} 
                      alt={selectedTailor.name} 
                      width={80} 
                      height={80} 
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                      <FaUser className="text-gray-500 text-3xl" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{selectedTailor.name}</h2>
                    <p className="text-sm text-gray-500">{selectedTailor.specialty}</p>
                    <div className="flex items-center">
                      {renderStars(selectedTailor.averageRating)}
                      <span className="ml-2 text-sm text-gray-600">
                        ({selectedTailor.totalReviews} reviews)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-700 mb-2">
                    <FaMapMarker className="inline mr-2 text-blue-500" />
                    {selectedTailor.address || 'Location not specified'}
                  </p>
                  <p className="text-sm text-gray-700 mb-2">
                    <FaTools className="inline mr-2 text-green-500" />
                    Services: {selectedTailor.services.join(', ')}
                  </p>
                  <p className="text-sm text-gray-700">
                    <FaCheckCircle className="inline mr-2 text-green-600" />
                    Completion Rate: {selectedTailor.completionRate}%
                  </p>
                </div>

                <div className="flex space-x-2">
                  <Link 
                    href={`/tailors/${selectedTailor.id}`}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-center hover:bg-blue-700 transition-colors"
                  >
                    View Profile
                  </Link>
                  <Link 
                    href={`/booking/${selectedTailor.id}`}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg text-center hover:bg-gray-300 transition-colors"
                  >
                    Book Appointment
                  </Link>
                </div>
              </div>
            </Popup>
          )}
        </Map>
      )}
      
      <button 
        onClick={zoomToNairobi}
        className="absolute bottom-4 left-4 z-10 bg-white p-2 rounded shadow-md hover:bg-gray-100"
      >
        Reset View
      </button>
    </div>
  )
}