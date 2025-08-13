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
        guest = guests.find((g) => g.id === qrData.guestId);
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
    if (!isScanning || !videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Only process frames if video is actually playing and has dimensions
    if (video.readyState !== video.HAVE_ENOUGH_DATA || video.videoWidth === 0 || video.videoHeight === 0) {
      requestAnimationFrame(scanVideoFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      
      if (code) {
        console.log('QR code detected:', code.data);
        stopScanning();
        processQRData(code.data);
        return;
      }
    } catch (err) {
      console.error('Error scanning QR code:', err);
    }

    requestAnimationFrame(scanVideoFrame);
  };

  const startScanning = async () => {
    setScanResult(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraPermission('granted');
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
          setIsScanning(true);
          requestAnimationFrame(scanVideoFrame);
        };
      }
    } catch (error: any) {
      if ((error as any)?.name === 'NotAllowedError') {
        setCameraPermission('denied');
      }
      console.error('Error accessing camera:', error);
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
    <Card>
      <CardHeader>
        <CardTitle>QR Code Scanner</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!isScanning ? (
            <Button onClick={startScanning} className="w-full">
              <Camera className="mr-2 h-4 w-4" /> Start Scanning
            </Button>
          ) : (
            <Button onClick={stopScanning} variant="destructive" className="w-full">
              Stop Scanning
            </Button>
          )}

          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
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
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <Input
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Enter QR code data"
            />
            <Button type="submit">Submit</Button>
          </form>

          {/* Scan result */}
          {scanResult && (
            <Alert variant={scanResult.success ? 'default' : 'destructive'}>
              {scanResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>{scanResult.message}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
