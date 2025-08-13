'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Camera, CheckCircle, XCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { parseQRData } from '@/lib/qr-utils';
import { storage } from '@/lib/storage';
import jsQR from 'jsqr';

interface QRScannerProps {
  selectedEvent: { id: string; title: string } | null;
}

export default function QRScanner({ selectedEvent }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopScanning = () => {
    setIsScanning(false);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const processQRData = async (data: string) => {
    console.log('Processing QR data:', data);
    try {
      const qrData = parseQRData(data);
      console.log('Parsed QR data:', qrData);
      
      if (!qrData) {
        setScanResult({ success: false, message: 'Invalid QR code format' });
        return;
      }
      if (!selectedEvent?.id) {
        setScanResult({ success: false, message: 'Please select an event first' });
        return;
      }
      
      console.log('Fetching guests...');
      const guests = await storage.getGuests();
      console.log('Guests fetched:', guests.length);
      
      let guest;
      
      // If we have an invite code but unknown guest ID, try to find the guest by invite code
      if (qrData.guestId === 'unknown' && qrData.inviteCode) {
        console.log('Looking up guest by invite code:', qrData.inviteCode);
        guest = guests.find(g => g.inviteCode === qrData.inviteCode && g.eventId === selectedEvent.id);
      } else {
        // Otherwise, check if the event ID matches and find the guest by ID
        if (qrData.eventId !== 'unknown' && qrData.eventId !== selectedEvent.id) {
          setScanResult({ success: false, message: `QR code does not match the selected event. QR event: ${qrData.eventId}, Selected: ${selectedEvent.id}` });
          return;
        }
        // Find guest by ID and ensure they belong to the selected event
        guest = guests.find((g) => g.id === qrData.guestId && g.eventId === selectedEvent.id);
      }
      
      // If no guest found yet, try treating the raw data as an invite code
      if (!guest && typeof data === 'string' && data.trim().length > 0) {
        const inviteCode = data.trim();
        guest = guests.find(g => g.inviteCode === inviteCode && g.eventId === selectedEvent.id);
        console.log('Looking up guest by raw invite code:', inviteCode, guest);
      }
      
      console.log('Found guest:', guest);
      
      if (!guest) {
        setScanResult({ success: false, message: 'Guest not found. Please check the QR code or invite code.' });
        return;
      }
      if (guest.isPresent === true) {
        setScanResult({ success: false, message: `${guest.name} is already marked as present` });
        return;
      }
      
      console.log('Updating guest:', guest.id);
      await storage.updateGuest(guest.id, { isPresent: true, checkedInAt: new Date() });
      setScanResult({ success: true, message: `Welcome, ${guest.name}!` });
    } catch (error) {
      console.error('Error processing QR code:', error);
      setScanResult({ success: false, message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  };

  const scanVideoFrame = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) {
      console.log('Scanning conditions not met:', { isScanning, hasVideo: !!videoRef.current, hasCanvas: !!canvasRef.current });
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      console.error('Could not get canvas context');
      setScanResult({ success: false, message: 'Could not initialize scanner - canvas context unavailable' });
      stopScanning();
      return;
    }

    // Only process frames if video is actually playing and has dimensions
    if (video.readyState !== video.HAVE_ENOUGH_DATA || video.videoWidth === 0 || video.videoHeight === 0) {
      console.log('Video not ready:', { readyState: video.readyState, width: video.videoWidth, height: video.videoHeight });
      requestAnimationFrame(scanVideoFrame);
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Clear canvas before drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the current video frame to the canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Get image data from the center portion of the frame for better performance
      const centerSize = Math.min(canvas.width, canvas.height) * 0.7; // Use 70% of the smaller dimension
      const centerX = (canvas.width - centerSize) / 2;
      const centerY = (canvas.height - centerSize) / 2;
      
      const imageData = ctx.getImageData(centerX, centerY, centerSize, centerSize);
      
      // Process the image data with jsQR
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      });
      
      if (code) {
        console.log('QR code detected:', code.data);
        stopScanning();
        processQRData(code.data);
        return;
      }
    } catch (err) {
      console.error('Error scanning QR code:', err);
      // Don't stop scanning on error, just continue with next frame
    }

    // Continue scanning with next animation frame
    requestAnimationFrame(scanVideoFrame);
  };

  const startScanning = async () => {
    setScanResult(null);
    try {
      console.log('Requesting camera access...');
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser');
      }
      
      const constraints = { 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera access granted');
      setCameraPermission('granted');
      streamRef.current = mediaStream;
      
      if (videoRef.current) {
        console.log('Setting up video element');
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded, dimensions:', {
            width: videoRef.current?.videoWidth,
            height: videoRef.current?.videoHeight
          });
          
          videoRef.current?.play()
            .then(() => {
              console.log('Video playback started');
              setIsScanning(true);
              requestAnimationFrame(scanVideoFrame);
            })
            .catch(err => {
              console.error('Error starting video playback:', err);
              setScanResult({ success: false, message: `Error starting camera: ${err.message}` });
              stopScanning();
            });
        };
        
        // Add error handler for video element
        videoRef.current.onerror = (event) => {
          console.error('Video element error:', event);
          setScanResult({ success: false, message: 'Error with video stream' });
          stopScanning();
        };
      } else {
        console.error('Video element reference not available');
        setScanResult({ success: false, message: 'Could not initialize camera - video element not available' });
      }
    } catch (error: any) {
      if (error?.name === 'NotAllowedError') {
        console.log('Camera permission denied by user');
        setCameraPermission('denied');
        setScanResult({ success: false, message: 'Camera access denied. Please allow camera access and try again.' });
      } else if (error?.name === 'NotFoundError') {
        console.error('No camera found on this device');
        setScanResult({ success: false, message: 'No camera found on this device' });
      } else if (error?.name === 'NotReadableError') {
        console.error('Camera is already in use');
        setScanResult({ success: false, message: 'Camera is already in use by another application' });
      } else {
        console.error('Error accessing camera:', error);
        setScanResult({ success: false, message: `Camera error: ${error.message || 'Unknown error'}` });
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      processQRData(manualInput.trim());
      setManualInput('');
    }
  };

  useEffect(() => {
    return () => stopScanning();
  }, []);

  return (
    <Card className="mx-auto max-w-md w-full">
      <CardHeader className="pb-2 sm:pb-6">
        <CardTitle className="text-xl sm:text-2xl">QR Code Scanner</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 sm:space-y-4">
          {!isScanning ? (
            <Button onClick={startScanning} className="w-full">
              <Camera className="mr-2 h-4 w-4" /> Start Scanning
            </Button>
          ) : (
            <Button onClick={stopScanning} variant="destructive" className="w-full">
              Stop Scanning
            </Button>
          )}

          <div className="relative aspect-video bg-black rounded-lg overflow-hidden max-h-[50vh] md:max-h-[60vh]">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-64 sm:h-64 border-2 border-green-500 animate-pulse"></div>
                <div className="absolute left-0 w-full h-1 bg-green-500 animate-scanline"></div>
                <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-md">Scanning...</div>
              </div>
            )}
          </div>

          {cameraPermission === 'denied' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Camera access denied. Please enable camera permissions in your browser settings.
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          {/* Manual QR Input */}
          <form onSubmit={handleManualSubmit} className="flex flex-col sm:flex-row gap-2">
            <Input
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Enter QR code data"
              className="flex-1"
            />
            <Button type="submit" className="w-full sm:w-auto">Submit</Button>
          </form>
          
          <div className="mt-2 text-center sm:text-left">
            <a href="/test-qr-code.html" target="_blank" className="text-sm text-blue-500 hover:underline">
              Open Test QR Code Generator
            </a>
          </div>

          {/* Scan result */}
          {scanResult && (
            <Alert variant={scanResult.success ? 'default' : 'destructive'} className="animate-fadeIn">
              {scanResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{scanResult.message}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
