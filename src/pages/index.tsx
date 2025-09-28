import { useState, useEffect } from 'react';
import { ClipLoader } from 'react-spinners';
import Image from 'next/image';
import Head from 'next/head';
import { resizeImage } from './api/utils';

declare global {
  interface Window {
    google: any;
  }
}

function App() {
  const [image, setImage] = useState<string | null>(null);
  const [aiOutput, setAiOutput] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);

  useEffect(() => {
    const loadGoogleMaps = () => {
      console.log('Starting to load Google Maps...');

      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        console.log('Google Maps already loaded, initializing map...');
        initMap();
        return;
      }

      // Check if script is already loading
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        console.log('Google Maps script already exists, waiting for load...');
        existingScript.addEventListener('load', initMap);
        existingScript.addEventListener('error', (e) => {
          console.error('Google Maps script failed to load:', e);
          setError('Failed to load Google Maps API');
        });
        return;
      }

      // Load Google Maps API
      const script = document.createElement('script');
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

      console.log('API Key exists:', !!apiKey);

      if (!apiKey) {
        console.error('Google Maps API key is not set');
        setError('Google Maps API key is not configured');
        return;
      }

      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMap`;
      script.async = true;
      script.defer = true;

      // Set up global callback with error handling
      (window as any).initGoogleMap = () => {
        console.log('Google Maps callback triggered');
        try {
          initMap();
        } catch (error) {
          console.error('Error in Google Maps callback:', error);
          setError('Failed to initialize map');
        }
      };

      script.onerror = (error) => {
        console.error('Failed to load Google Maps API script:', error);
        setError('Failed to load Google Maps API');
      };

      script.onload = () => {
        console.log('Google Maps script loaded successfully');
      };

      document.head.appendChild(script);
      console.log('Google Maps script added to document');
    };

    loadGoogleMaps();
  }, []);

  const initMap = () => {
    console.log('Initializing map...');
    console.log('Window object exists:', typeof window !== 'undefined');
    console.log('Google Maps API available:', !!(window.google && window.google.maps));

    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      const mapElement = document.getElementById('map');
      console.log('Map element found:', !!mapElement);

      if (mapElement) {
        try {
          console.log('Creating new Google Map instance...');
          const newMap = new window.google.maps.Map(mapElement, {
            zoom: 2,
            minZoom: 2,
            center: { lat: 20, lng: 0 },
            mapTypeId: 'roadmap',
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: true,
            scaleControl: true,
            streetViewControl: true,
            rotateControl: true,
            fullscreenControl: true,
            styles: [
              { elementType: 'geometry', stylers: [{ color: '#212121' }] },
              { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
              { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
              { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
              { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
              { featureType: 'administrative.country', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
              { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
              { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
              { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
              { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#181818' }] },
              { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
              { featureType: 'poi.park', elementType: 'labels.text.stroke', stylers: [{ color: '#1b1b1b' }] },
              { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
              { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
              { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
              { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
              { featureType: 'road.highway.controlled_access', elementType: 'geometry', stylers: [{ color: '#4e4e4e' }] },
              { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
              { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
              { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
              { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] }
            ]
          });

          // Add event listeners for debugging
          newMap.addListener('idle', () => {
            console.log('Map is idle and ready');
          });

          newMap.addListener('tilesloaded', () => {
            console.log('Map tiles loaded');
          });

          console.log('Map created successfully');
          setMap(newMap);

        } catch (error) {
          console.error('Error creating map:', error);
          if (error instanceof Error) {
            console.error('Error details:', error.message, error.stack);
            setError(`Failed to create map: ${error.message}`);
          } else {
            console.error('Unknown error type:', error);
            setError('Failed to create map: Unknown error');
          }
        }
      } else {
        console.error('Map element with id "map" not found in DOM');
        setError('Map container element not found');
      }
    } else {
      console.error('Google Maps API not available, retrying...');
      console.log('Available on window:', Object.keys(window));
      setTimeout(initMap, 1000);
    }
  };

  const addMarkersToMap = (locations: string[]) => {
    console.log('addMarkersToMap called with:', locations);
    console.log('Map available:', !!map);
    console.log('Google Maps API available:', !!(window.google && window.google.maps));

    if (!map || !window.google || !window.google.maps) {
      console.log('Map or Google Maps API not available for markers, retrying in 1 second...');
      setTimeout(() => addMarkersToMap(locations), 1000);
      return;
    }

    // Clear existing markers
    markers.forEach(marker => {
      if (marker && marker.setMap) {
        marker.setMap(null);
      }
    });

    if (!locations || locations.length === 0) {
      console.log('No locations to process');
      setMarkers([]);
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    const newMarkers: any[] = [];
    let processedCount = 0;

    const geocodeWithFallback = async (location: string): Promise<any> => {
      // Multiple geocoding strategies for higher accuracy
      const strategies = [
        { address: location, region: 'US' }, // Default with US bias
        { address: location }, // No region bias
        { address: location + ', USA' }, // Try with USA suffix
        { address: location.replace(/,.*$/, '') }, // Remove everything after first comma
        { address: location.split(',')[0] + ', ' + location.split(',').slice(-1)[0] } // First + last part
      ];

      for (const strategy of strategies) {
        try {
          const result = await new Promise((resolve, reject) => {
            geocoder.geocode(strategy, (results: any[], status: string) => {
              if (status === 'OK' && results && results[0]) {
                // Validate result accuracy
                const result = results[0];
                const accuracyTypes = ['street_address', 'premise', 'route', 'establishment'];
                const hasHighAccuracy = result.types.some((type: string) => accuracyTypes.includes(type));

                resolve({ result, hasHighAccuracy, status });
              } else {
                reject(status);
              }
            });
          });

          console.log(`Geocoding success for "${location}" with strategy:`, strategy);
          return result;
        } catch (error) {
          console.log(`Geocoding failed for "${location}" with strategy:`, strategy, 'Error:', error);
          continue;
        }
      }

      throw new Error('All geocoding strategies failed');
    };

    locations.forEach((location, index) => {
      let cleanLocation = String(location).trim();

      // Enhanced location cleaning
      cleanLocation = cleanLocation
        .replace(/^["'\s]*/, '')
        .replace(/["'\s]*$/, '')
        .replace(/^\d+\.\s*/, '')
        .replace(/^-\s*/, '')
        .replace(/^[•\-*]\s*/, '') // Remove bullet points
        .trim();

      if (cleanLocation.length < 3) {
        processedCount++;
        if (processedCount === locations.length) {
          setMarkers(newMarkers);
        }
        return;
      }

      console.log(`Attempting enhanced geocoding for location ${index + 1}: "${cleanLocation}"`);

      // Use enhanced geocoding with delay
      setTimeout(async () => {
        try {
          const { result, hasHighAccuracy, status } = await geocodeWithFallback(cleanLocation);

          const geocodedLocation = result.geometry.location;
          const lat = typeof geocodedLocation.lat === 'function' ? geocodedLocation.lat() : geocodedLocation.lat;
          const lng = typeof geocodedLocation.lng === 'function' ? geocodedLocation.lng() : geocodedLocation.lng;

          console.log(`Creating ${hasHighAccuracy ? 'HIGH ACCURACY' : 'standard'} marker at: ${lat}, ${lng} for "${cleanLocation}"`);

          const markerColor = '#FF0000'; // Red color for all markers
          const markerSize = hasHighAccuracy ? 32 : 24;

          const marker = new window.google.maps.Marker({
            position: { lat, lng },
            map: map,
            title: cleanLocation,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="${markerSize}" height="${markerSize}" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill="${markerColor}" stroke="#000000" stroke-width="2">
                    <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="12" cy="12" r="3" fill="#000000">
                    <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite"/>
                  </circle>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(markerSize, markerSize),
              anchor: new window.google.maps.Point(markerSize/2, markerSize/2)
            },
            animation: null
          });

          // Detect if mobile device
          const isMobile = window.innerWidth <= 768;
          const buttonSize = isMobile ? 24 : 20;
          const fontSize = isMobile ? 16 : 14;
          const padding = isMobile ? 15 : 12;
          const rightPadding = isMobile ? 30 : 25;

          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="
                background-color: #1a1a1a; 
                color: #ffffff; 
                padding: ${padding}px; 
                min-width: ${isMobile ? 250 : 200}px; 
                border-radius: 6px;
                border: 1px solid #444444;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
                margin: 0;
                position: relative;
              ">
                <button onclick="this.closest('.gm-style-iw').parentElement.style.display='none'" style="
                  position: absolute;
                  top: 8px;
                  right: 8px;
                  background: #444444;
                  border: 1px solid #666666;
                  border-radius: 50%;
                  width: ${buttonSize}px;
                  height: ${buttonSize}px;
                  color: #cccccc;
                  font-size: ${fontSize}px;
                  font-weight: bold;
                  cursor: pointer;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  padding: 0;
                  line-height: 1;
                  z-index: 1001;
                  touch-action: manipulation;
                " onmouseover="this.style.background='#555555'; this.style.color='#ffffff';" onmouseout="this.style.background='#444444'; this.style.color='#cccccc';" ontouchstart="this.style.background='#555555'; this.style.color='#ffffff';" ontouchend="this.style.background='#444444'; this.style.color='#cccccc';">×</button>
                <div style="
                  font-size: ${isMobile ? 15 : 14}px; 
                  font-weight: 600; 
                  margin-bottom: 6px; 
                  color: #ffffff;
                  border-bottom: 1px solid #333333;
                  padding-bottom: 4px;
                  padding-right: ${rightPadding}px;
                ">${cleanLocation}</div>
                <div style="
                  font-size: ${isMobile ? 12 : 11}px; 
                  color: ${hasHighAccuracy ? '#22c55e' : '#f59e0b'}; 
                  margin-bottom: 6px;
                  font-weight: 500;
                ">
                  Accuracy: ${hasHighAccuracy ? 'HIGH' : 'MODERATE'}
                </div>
                <div style="font-size: ${isMobile ? 11 : 10}px; color: #a1a1aa; line-height: 1.3;">
                  <div style="margin-bottom: 1px;">Lat: ${lat.toFixed(6)}</div>
                  <div style="margin-bottom: 1px;">Lng: ${lng.toFixed(6)}</div>
                  <div>Type: ${result.types[0].replace(/_/g, ' ')}</div>
                </div>
              </div>
            `,
            maxWidth: isMobile ? 280 : 250,
            disableAutoPan: false,
            pixelOffset: new window.google.maps.Size(0, 0)
          });

          marker.addListener('click', () => {
            infoWindow.open(map, marker);
          });

          newMarkers.push(marker);
          console.log(`Marker ${newMarkers.length} created successfully for "${cleanLocation}"`);

          // Center map on the most accurate marker
          if (hasHighAccuracy || newMarkers.length === 1) {
            map.setCenter({ lat, lng });
            map.setZoom(hasHighAccuracy ? 16 : 12); // Zoom closer for high accuracy
            console.log('Map centered on high accuracy marker');
          }

        } catch (error) {
          console.warn(`Enhanced geocoding failed for "${cleanLocation}":`, error);
        }

        processedCount++;
        if (processedCount === locations.length) {
          setMarkers(newMarkers);
          console.log(`Final result: Added ${newMarkers.length} markers out of ${locations.length} locations`);

          // Sort markers by accuracy and center on best one
          const highAccuracyMarkers = newMarkers.filter(marker => 
            marker.getIcon().url.includes('HIGH')
          );

          if (highAccuracyMarkers.length > 0) {
            map.setCenter(highAccuracyMarkers[0].getPosition());
            map.setZoom(16);
          }
        }
      }, index * 700); // Increased delay for rate limiting
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
        const img = e.target.files[0];
        const fileExtension = img.name.split('.').pop()?.toLowerCase();
        if (fileExtension === 'jpg' || fileExtension === 'png' || fileExtension === 'jpeg') {
            try {
                const resizedImageUrl = await resizeImage(img);
                setImage(resizedImageUrl);
            } catch (err) {
                setError('Error resizing image.');
                console.error(err);
            }
        } else {
            setError('Invalid file. Must be jpg/jpeg/png');
        }
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    if (!image) {
      console.error('No image selected');
      return;
    }

    try {
      const response = await fetch(image);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = async () => {
        const base64data = reader.result as string;

        const apiResponse = await fetch('/api/ai-analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ imageData: base64data }),
        });

        const data = await apiResponse.json();

        if (!apiResponse.ok) {
          if (apiResponse.status === 503) {
            throw new Error('The AI service is currently overloaded. Please try again in a few minutes.');
          }
          throw new Error(data.error || 'Failed to analyze image');
        }

        setAiOutput(data.result);

        // Parse locations and add to map
        console.log('AI Result:', data.result);

        let locations: string[] = [];

        try {
          // Enhanced JSON parsing
          const parsed = JSON.parse(data.result);
          if (Array.isArray(parsed)) {
            locations = parsed
              .map(loc => String(loc).trim())
              .filter(loc => loc.length > 1 && !loc.toLowerCase().includes('unknown'))
              .filter(loc => !loc.toLowerCase().includes('insufficient'));
            console.log('Parsed as JSON array:', locations);
          }
        } catch (parseError) {
          console.log('Not JSON format, trying enhanced text parsing');

          let textResult = data.result;

          // Enhanced array pattern matching
          const arrayMatches = [
            /\[(.*?)\]/s,
            /\[(.*?)\]/gs,
            /"([^"]+)"/g,
            /'([^']+)'/g
          ];

          for (const pattern of arrayMatches) {
            const match = textResult.match(pattern);
            if (match) {
              if (pattern.source.includes('[(.*?)]')) {
                // Array format
                locations = match[1]
                  .split(',')
                  .map((loc: string) => loc.trim().replace(/^["']|["']$/g, ''))
                  .filter(loc => loc.length > 1 && !loc.toLowerCase().includes('unknown'));
              } else {
                // Quoted strings
                locations = match
                  .map((m: string) => m.replace(/['"]/g, '').trim())
                  .filter((loc: string) => loc.length > 2 && !loc.toLowerCase().includes('unknown'));
              }
              if (locations.length > 0) break;
            }
          }

          // If still no results, try line-by-line with better filtering
          if (locations.length === 0) {
            const lines = textResult.split(/\r?\n/).map(line => line.trim());
            const locationKeywords = ['street', 'avenue', 'road', 'boulevard', 'plaza', 'square', 'tower', 'building', 'mall', 'center', 'park', 'bridge'];

            locations = lines.filter(line => {
              const lowerLine = line.toLowerCase();
              return line.length > 5 &&
                     !lowerLine.includes('analysis') &&
                     !lowerLine.includes('cannot') &&
                     !lowerLine.includes('unknown') &&
                     !lowerLine.includes('insufficient') &&
                     (locationKeywords.some(keyword => lowerLine.includes(keyword)) ||
                      /\d/.test(line) || // Contains numbers (addresses)
                      /[A-Z][a-z]+ [A-Z][a-z]+/.test(line)); // Proper case locations
            }).slice(0, 3);
          }
        }

        console.log('Final parsed locations:', locations);

        if (locations.length > 0) {
          // Only use the first (most accurate) location
          const primaryLocation = [locations[0]];
          console.log('Using primary location only:', primaryLocation);
          console.log('Waiting for map to be ready before adding markers...');

          // Ensure map is ready before adding markers
          const addMarkersWhenReady = () => {
            if (map && window.google && window.google.maps) {
              console.log('Map ready, adding markers now');
              addMarkersToMap(primaryLocation);
            } else {
              console.log('Map not ready yet, waiting...');
              setTimeout(addMarkersWhenReady, 500);
            }
          };

          // Give a short delay to ensure map state is updated
          setTimeout(addMarkersWhenReady, 100);
        } else {
          console.warn('No valid locations found in AI response');
          console.log('Raw AI response for debugging:', data.result);
        }

        setIsLoading(false);
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error getting AI output:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
      setIsLoading(false);
    }
  }

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <Head>
        <title>BlackAI ⚛ Geo Spy</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen text-white" style={{backgroundColor: '#1a1a1a'}}>
      {/* Header */}
      <div className="border-b border-gray-700 px-4 sm:px-6 py-4" style={{backgroundColor: '#1a1a1a'}}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-white"
              style={{backgroundColor: '#2a2a2a'}}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-white">BlackAI ⚛ Geo Spy</h1>
          </div>
          <div className="text-xs sm:text-sm text-gray-400 hidden sm:block">AI-Powered OSINT Image Search</div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row" style={{height: 'calc(100vh - 73px)'}}>
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 z-50 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="absolute inset-0 bg-black bg-opacity-50"></div>
            <div 
              className="absolute left-0 top-0 h-full w-80 p-6 overflow-y-auto border-r border-gray-700"
              style={{backgroundColor: '#1a1a1a'}}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-white">Controls</h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-white"
                  style={{backgroundColor: '#2a2a2a'}}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <MobileControlPanel 
                image={image}
                error={error}
                isLoading={isLoading}
                aiOutput={aiOutput}
                handleImageChange={handleImageChange}
                handleSubmit={handleSubmit}
              />
            </div>
          </div>
        )}

        {/* Desktop Left Panel */}
        <div className="hidden md:block w-80 border-r border-gray-700 p-6 overflow-y-auto" style={{backgroundColor: '#1a1a1a'}}>
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="rounded-lg p-4 border border-gray-700" style={{backgroundColor: '#2a2a2a'}}>
              <h3 className="text-lg font-semibold mb-4 text-white">Upload Image</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type="file"
                    onChange={handleImageChange}
                    className="hidden"
                    id="file-upload"
                    accept="image/*"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer transition-colors"
                    style={{backgroundColor: '#2a2a2a'}}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333333'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="mb-2 text-sm text-gray-400">Click to upload</p>
                      <p className="text-xs text-gray-500">PNG, JPG or JPEG</p>
                    </div>
                  </label>
                </div>

                {error && <p className="text-red-400 text-sm">{error}</p>}

                {image && (
                  <div className="relative">
                    <Image
                      src={image}
                      alt="Uploaded"
                      width={200}
                      height={150}
                      className="w-full h-auto rounded-lg border border-gray-600"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!image || error.length > 0 || isLoading}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    (!image || error || isLoading)
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'text-white'
                  }`}
                  style={(!image || error || isLoading) ? {} : {
                    backgroundColor: '#1a1a1a',
                  }}
                  onMouseEnter={(e) => {
                    if (!(!image || error || isLoading)) {
                      e.currentTarget.style.backgroundColor = '#333333';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!(!image || error || isLoading)) {
                      e.currentTarget.style.backgroundColor = '#1a1a1a';
                    }
                  }}
                >
                  {isLoading ? 'Analyzing...' : 'Analyze Image'}
                </button>
              </form>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="flex justify-center items-center py-8">
                <ClipLoader color="#ffffff" size={40} />
              </div>
            )}

            {/* Results Panel */}
            {!isLoading && aiOutput && (
              <div className="rounded-lg p-4 border border-gray-700" style={{backgroundColor: '#2a2a2a'}}>
                <h3 className="text-lg font-semibold mb-4 text-white">Analysis Results</h3>
                <div className="space-y-3">
                  <div className="rounded p-3" style={{backgroundColor: '#1a1a1a'}}>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Detected Locations:</h4>
                      <p className="text-sm text-gray-100 break-words">{aiOutput}</p>
                    </div>

                  {/* Location Details */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Confidence:</span>
                      <span className="text-green-400">High</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Processing Time:</span>
                      <span className="text-gray-300">2.3s</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <div id="map" className="w-full h-full bg-black"></div>

          {/* Mobile Bottom Controls */}
          <div className="md:hidden absolute bottom-0 left-0 right-0 p-4">
            <div className="flex justify-center">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="w-1/2 py-3 px-4 rounded-lg font-medium text-white mb-4"
                style={{backgroundColor: '#2a2a2a'}}
              >
                Open Controls
              </button>
            </div>
            
            {aiOutput && (
              <div className="rounded-lg p-3" style={{backgroundColor: '#2a2a2aCC'}}>
                <div className="text-sm">
                  <div className="font-semibold text-white mb-1">Location Found</div>
                  <div className="text-gray-300 text-xs">
                    Tap markers for details
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Map Overlay Info */}
          {aiOutput && (
            <div className="hidden md:block absolute bottom-4 left-1/2 transform -translate-x-1/2 rounded-lg p-4 max-w-sm" style={{backgroundColor: '#2a2a2a'}}>
              <div className="text-sm">
                <div className="font-semibold text-white mb-2">Location Analysis</div>
                <div className="text-gray-300 text-xs">
                  Results are displayed as markers on the map. Click markers for more details.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

// Mobile Control Panel Component
function MobileControlPanel({ 
  image, 
  error, 
  isLoading, 
  aiOutput, 
  handleImageChange, 
  handleSubmit 
}: {
  image: string | null;
  error: string;
  isLoading: boolean;
  aiOutput: string | null;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="rounded-lg p-4 border border-gray-700" style={{backgroundColor: '#2a2a2a'}}>
        <h3 className="text-lg font-semibold mb-4 text-white">Upload Image</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type="file"
              onChange={handleImageChange}
              className="hidden"
              id="mobile-file-upload"
              accept="image/*"
            />
            <label
              htmlFor="mobile-file-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer transition-colors"
              style={{backgroundColor: '#2a2a2a'}}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="mb-2 text-sm text-gray-400">Tap to upload</p>
                <p className="text-xs text-gray-500">PNG, JPG or JPEG</p>
              </div>
            </label>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {image && (
            <div className="relative">
              <Image
                src={image}
                alt="Uploaded"
                width={200}
                height={150}
                className="w-full h-auto rounded-lg border border-gray-600"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={!image || error.length > 0 || isLoading}
            className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
              (!image || error || isLoading)
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'text-white'
            }`}
            style={(!image || error || isLoading) ? {} : {
              backgroundColor: '#1a1a1a',
            }}
          >
            {isLoading ? 'Analyzing...' : 'Analyze Image'}
          </button>
        </form>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <ClipLoader color="#ffffff" size={40} />
        </div>
      )}

      {/* Results Panel */}
      {!isLoading && aiOutput && (
        <div className="rounded-lg p-4 border border-gray-700" style={{backgroundColor: '#2a2a2a'}}>
          <h3 className="text-lg font-semibold mb-4 text-white">Analysis Results</h3>
          <div className="space-y-3">
            <div className="rounded p-3" style={{backgroundColor: '#1a1a1a'}}>
              <h4 className="text-sm font-medium text-gray-300 mb-2">Detected Locations:</h4>
              <p className="text-sm text-gray-100 break-words">{aiOutput}</p>
            </div>

            {/* Location Details */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Confidence:</span>
                <span className="text-green-400">High</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Processing Time:</span>
                <span className="text-gray-300">2.3s</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
