declare module '@react-google-maps/api' {
  import React from 'react';

  export interface LoadScriptProps {
    googleMapsApiKey: string;
    libraries?: string[];
    language?: string;
    region?: string;
    version?: string;
    loadingElement?: React.ReactNode;
    onLoad?: () => void;
    onError?: (error: Error) => void;
  }

  export const LoadScript: React.FC<LoadScriptProps>;

  export interface GoogleMapProps {
    center: { lat: number; lng: number };
    zoom: number;
    mapContainerStyle?: React.CSSProperties;
    options?: google.maps.MapOptions;
    onLoad?: (map: google.maps.Map) => void;
    children?: React.ReactNode;
  }

  export const GoogleMap: React.FC<GoogleMapProps>;

  export interface MarkerProps {
    position: { lat: number; lng: number };
    title?: string;
    onClick?: () => void;
    icon?: string | google.maps.Icon;
  }

  export const Marker: React.FC<MarkerProps>;
}
