import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Camera, CheckCircle, XCircle, RefreshCw, AlertTriangle, Scan } from 'lucide-react';
import { parseQRData } from '@/lib/qr-utils';
import { storage } from '@/lib/storage';
import { Guest, Event } from '@/types';
import { toast } from 'sonner';
import jsQR from 'jsqr';

interface QRScannerProps {
  selectedEvent: Event | null;
  isScannerActive: boolean;
}

export function QRScanner({ selectedEvent, isScannerActive }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; guest?: Guest; message: string } | null>(null);
  const [recentScans, setRecentScans] = useState<Array<{ guest: Guest; timestamp: Date; success: boolean }>>([]);
  const [manualInput, setManualInput] = useState('');
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [browserCompatible, setBrowserCompatible] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const hasCanvas = !!document.createElement('canvas').getContext('2d');
    setBrowserCompatible(hasMediaDevices && hasCanvas);

    return () => stopScanning();
  }, []);

  useEffect(() => {
    if (isScannerActive && !isScanning) startScanning();
    if (!isScannerActive && isScanning) stopScanning();
  }, [isScannerActive]);

  const startScanning = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access not supported in this browser.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      streamRef.current = mediaStream;
      setIsScanning(true);
      setScanResult(null);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        requestAnimationFrame(scanVideoFrame);
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      if (error?.name === 'NotAllowedError') {
        toast.error('Camera permission denied. Please allow camera access.');
        setScanResult({ success: false, message: 'Camera permission denied. Please allow access and refresh.' });
      } else {
        toast.error('Failed to access camera.');
        setScanResult({ success: false, message: `Camera error: ${error.message || 'Unknown error'}` });
      }
    }
  };

  const scanVideoFrame = () => {
    if (!isScanning || !videoRef.current?.videoWidth) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });

    if (code) {
      setScannedData(code.data);
      processQRData(code.data);
      stopScanning();
    } else {
      requestAnimationFrame(scanVideoFrame);
    }
  };

  const stopScanning = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsScanning(false);
  };

  const processQRData = async (qrString: string) => {
    if (!selectedEvent?.id) {
      setScanResult({ success: false, message: 'Please select an event first' });
      return;
    }

    const qrData = parseQRData(qrString);
    if (!qrData) {
      setScanResult({ success: false, message: 'Invalid QR code format' });
      return;
    }

    if (qrData.eventId !== selectedEvent.id) {
      setScanResult({ success: false, message: 'QR code is for a different event' });
      return;
    }

    try {
      const guest = await storage.getGuestByInviteCode(qrData.inviteCode);
      if (!guest) {
        setScanResult({ success: false, message: 'Guest not found' });
        return;
      }

      if (guest.isPresent === true) {
        setScanResult({ success: false, guest, message: 'Guest already checked in' });
        return;
      }

      const now = new Date();
      await storage.updateGuest(guest.id, { isPresent: true, checkedInAt: now });

      const updatedGuest = { ...guest, isPresent: true, checkedInAt: now };
      setScanResult({ success: true, guest: updatedGuest, message: 'Successfully checked in!' });
      setRecentScans((prev) => [{ guest: updatedGuest, timestamp: now, success: true }, ...prev.slice(0, 9)]);

      toast.success(`${guest.name} checked in successfully!`);

      setTimeout(() => {
        setScanResult(null);
        setScannedData(null);
      }, 5000);
    } catch {
      setScanResult({ success: false, message: 'Error processing QR code' });
    }
  };

  const handleManualScan = async () => {
    if (manualInput.trim()) {
      setScannedData(manualInput.trim());
      await processQRData(manualInput.trim());
      setManualInput('');
    }
  };

  const restartScanning = () => {
    setScanResult(null);
    setScannedData(null);
    startScanning();
  };

  if (!selectedEvent) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Camera className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-center">Please select an event to start scanning</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" /> QR Scanner
          </CardTitle>
          <CardDescription>Scan guest QR codes to validate attendance for {selectedEvent.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!browserCompatible ? (
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertDescription className="text-sm">
                <div className="font-medium mb-1">Browser Not Compatible</div>
                Your browser doesn’t support camera access. Try Chrome, Firefox, or Edge.
              </AlertDescription>
            </Alert>
          ) : !isScanning ? (
            <Button onClick={startScanning}>
              <Camera className="h-4 w-4 mr-2" /> Start Camera Scanner
            </Button>
          ) : (
            <div className="relative max-w-md mx-auto">
              <video ref={videoRef} className="w-full rounded-lg border-2 border-blue-500" playsInline muted />
              <div className="absolute inset-4 border-2 border-blue-500 rounded-lg pointer-events-none opacity-70">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-xs text-white bg-blue-500 bg-opacity-70 px-2 py-1 rounded-md animate-pulse">
                    Scanning for QR code...
                  </div>
                </div>
              </div>
            </div>
          )}

          {scanResult && (
            <Alert className={scanResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
              <div className="flex items-center gap-2">
                {scanResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={scanResult.success ? 'text-green-800' : 'text-red-800'}>
                  <p className="font-bold">{scanResult.message}</p>
                  {scanResult.guest && (
                    <div className="mt-2">
                      <strong>{scanResult.guest.name}</strong> - {scanResult.guest.email}
                    </div>
                  )}
                  {scannedData && !scanResult.success && (
                    <div className="mt-2 text-xs bg-red-100 p-2 rounded">
                      <p className="font-bold">Scanned Data:</p>
                      <pre className="whitespace-pre-wrap break-all">{scannedData}</pre>
                    </div>
                  )}
                </AlertDescription>
              </div>
              {!isScanning && (
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm" onClick={restartScanning}>
                    <RefreshCw className="h-4 w-4 mr-2" /> Scan Again
                  </Button>
                </div>
              )}
            </Alert>
          )}

          {/* Manual QR Input */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-2">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <Scan className="h-4 w-4 mr-1" /> Manual QR Code Entry
            </h3>
            <p className="text-xs text-gray-500 mb-3">Enter the QR code data manually if scanning fails:</p>
            <div className="flex gap-2">
              <Input value={manualInput} onChange={(e) => setManualInput(e.target.value)} placeholder="Paste or type QR code data" />
              <Button onClick={handleManualScan} disabled={!manualInput.trim()}>
                Submit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Scans */}
      {recentScans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Check-ins</CardTitle>
            <CardDescription>Latest guest validations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentScans.map((scan, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{scan.guest.name}</p>
                    <p className="text-sm text-gray-600">{scan.guest.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={scan.success ? 'default' : 'destructive'}>
                      {scan.success ? 'Checked In' : 'Failed'}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">{scan.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
