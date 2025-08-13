import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, CheckCircle, XCircle, RefreshCw, AlertTriangle, Scan } from 'lucide-react';
import { parseQRData } from '@/lib/qr-utils';
import { storage } from '@/lib/storage';
import { Guest, Event } from '@/types';
import { toast } from 'sonner';

interface QRScannerProps {
  selectedEvent: Event | null;
}

export function QRScanner({ selectedEvent }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    guest?: Guest;
    message: string;
  } | null>(null);
  const [recentScans, setRecentScans] = useState<Array<{
    guest: Guest;
    timestamp: Date;
    success: boolean;
  }>>([]);
  const [manualInput, setManualInput] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      setIsScanning(true);
      setScanResult(null);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Failed to access camera. Please check permissions.');
    }
  };

  const stopScanning = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsScanning(false);
  };

  const processQRData = async (qrString: string) => {
    if (!selectedEvent) {
      setScanResult({
        success: false,
        message: 'Please select an event first'
      });
      return;
    }

    const qrData = parseQRData(qrString);
    if (!qrData) {
      setScanResult({
        success: false,
        message: 'Invalid QR code format'
      });
      return;
    }

    if (qrData.eventId !== selectedEvent.id) {
      setScanResult({
        success: false,
        message: 'QR code is for a different event'
      });
      return;
    }

    try {
      const guest = await storage.getGuestByInviteCode(qrData.inviteCode);
      if (!guest) {
        setScanResult({
          success: false,
          message: 'Guest not found'
        });
        return;
      }

      if (guest.isPresent) {
        setScanResult({
          success: false,
          guest,
          message: 'Guest already checked in'
        });
        return;
      }

      // Mark guest as present
      await storage.updateGuest(guest.id, {
        isPresent: true,
        checkedInAt: new Date()
      });

      const updatedGuest = { ...guest, isPresent: true, checkedInAt: new Date() };

      setScanResult({
        success: true,
        guest: updatedGuest,
        message: 'Successfully checked in!'
      });

      // Add to recent scans
      setRecentScans(prev => [{
        guest: updatedGuest,
        timestamp: new Date(),
        success: true
      }, ...prev.slice(0, 9)]);

      toast.success(`${guest.name} checked in successfully!`);
      
      // Auto-hide result after 3 seconds
      setTimeout(() => {
        setScanResult(null);
      }, 3000);
    } catch (error) {
      setScanResult({
        success: false,
        message: 'Error processing QR code'
      });
    }
  };

  const handleManualScan = async () => {
    if (manualInput.trim()) {
      await processQRData(manualInput.trim());
      setManualInput('');
    }
  };

  if (!selectedEvent) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Camera className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-center">
            Please select an event to start scanning
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            QR Scanner
          </CardTitle>
          <CardDescription>
            Scan guest QR codes to validate attendance for {selectedEvent.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            {!isScanning ? (
              <Button onClick={startScanning}>
                <Camera className="h-4 w-4 mr-2" />
                Start Camera Scanner
              </Button>
            ) : (
              <Button onClick={stopScanning} variant="outline">
                <XCircle className="h-4 w-4 mr-2" />
                Stop Scanner
              </Button>
            )}
          </div>

          {isScanning && (
            <div className="relative max-w-md mx-auto">
              <video
                ref={videoRef}
                className="w-full rounded-lg border-2 border-blue-500"
                playsInline
                muted
              />
              <div className="absolute inset-4 border-2 border-white rounded-lg pointer-events-none opacity-50">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-white rounded-br-lg"></div>
              </div>
            </div>
          )}

          <Separator />

          {/* Manual QR Input for testing */}
          <div className="space-y-2">
            <Label htmlFor="manual-qr">Manual QR Code Input (for testing)</Label>
            <div className="flex gap-2">
              <Input
                id="manual-qr"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Paste QR code data here"
              />
              <Button onClick={handleManualScan} disabled={!manualInput.trim()}>
                <Scan className="h-4 w-4 mr-2" />
                Scan
              </Button>
            </div>
          </div>

          {scanResult && (
            <Alert className={scanResult.success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
              <div className="flex items-center gap-2">
                {scanResult.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={scanResult.success ? "text-green-800" : "text-red-800"}>
                  {scanResult.message}
                  {scanResult.guest && (
                    <div className="mt-2">
                      <strong>{scanResult.guest.name}</strong> - {scanResult.guest.email}
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}
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
                    <Badge variant={scan.success ? "default" : "destructive"}>
                      {scan.success ? "Checked In" : "Failed"}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {scan.timestamp.toLocaleTimeString()}
                    </p>
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