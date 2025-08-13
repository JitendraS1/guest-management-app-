import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, QrCode, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Guest, Event, QRData } from '@/types';
import { storage } from '@/lib/storage';
import { generateInviteCode, generateQRCode } from '@/lib/qr-utils';
import { toast } from 'sonner';

interface GuestManagerProps {
  selectedEvent: Event | null;
}

export function GuestManager({ selectedEvent }: GuestManagerProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    if (selectedEvent) {
      loadGuests();
      const interval = setInterval(loadGuests, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [selectedEvent]);

  const loadGuests = async () => {
    if (!selectedEvent) return;
    try {
      const eventGuests = await storage.getGuestsByEventId(selectedEvent.id);
      setGuests(eventGuests);
    } catch (error) {
      console.error('Error loading guests:', error);
    }
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    
    if (!formData.name || !formData.email) {
      toast.error('Please fill in required fields');
      return;
    }

    const newGuest: Guest = {
      id: crypto.randomUUID(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      inviteCode: generateInviteCode(),
      isPresent: false,
      eventId: selectedEvent.id
    };

    try {
      await storage.addGuest(newGuest);
      await loadGuests();
      setFormData({ name: '', email: '', phone: '' });
      setIsAddOpen(false);
      toast.success('Guest added successfully');
    } catch (error) {
      toast.error('Failed to add guest');
    }
  };

  const handleDeleteGuest = async (guestId: string) => {
    if (confirm('Are you sure you want to delete this guest?')) {
      try {
        await storage.deleteGuest(guestId);
        await loadGuests();
        toast.success('Guest deleted successfully');
      } catch (error) {
        toast.error('Failed to delete guest');
      }
    }
  };

  const handleGenerateQR = async (guest: Guest) => {
    if (!selectedEvent) return;
    
    try {
      const qrData: QRData = {
        guestId: guest.id,
        eventId: selectedEvent.id,
        inviteCode: guest.inviteCode
      };
      
      const qrUrl = await generateQRCode(qrData);
      setQrCodeUrl(qrUrl);
      setSelectedGuest(guest);
      setQrDialogOpen(true);
    } catch (error) {
      toast.error('Failed to generate QR code');
    }
  };

  const downloadQR = () => {
    if (!qrCodeUrl || !selectedGuest) return;
    
    const link = document.createElement('a');
    link.download = `qr-${selectedGuest.name.replace(/\s+/g, '-')}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  if (!selectedEvent) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-6 sm:py-8">
          <UserPlus className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-3 sm:mb-4" />
          <p className="text-sm sm:text-base text-gray-500 text-center">
            Please select an event to manage guests
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
        <h2 className="text-xl sm:text-2xl font-bold">Guests for {selectedEvent.name}</h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Guest
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[90vw] sm:max-w-md">
            <DialogHeader className="space-y-1 sm:space-y-2">
              <DialogTitle className="text-lg sm:text-xl">Add New Guest</DialogTitle>
              <DialogDescription className="text-sm">
                Add a new guest to {selectedEvent.name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddGuest} className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="guestName" className="text-sm sm:text-base">Name *</Label>
                <Input
                  id="guestName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter guest name"
                  className="mt-1 sm:mt-2"
                />
              </div>
              <div>
                <Label htmlFor="guestEmail" className="text-sm sm:text-base">Email *</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter guest email"
                  className="mt-1 sm:mt-2"
                />
              </div>
              <div>
                <Label htmlFor="guestPhone" className="text-sm sm:text-base">Phone</Label>
                <Input
                  id="guestPhone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter guest phone"
                  className="mt-1 sm:mt-2"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto">Add Guest</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {guests.length > 0 ? (
        <Card className="w-full mx-auto">
          <CardHeader className="pb-2 sm:pb-6">
            <CardTitle className="text-xl sm:text-2xl">Guest List</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Total: {guests.length} | Present: {guests.filter(g => g.isPresent).length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px] sm:w-auto">Name</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guests.map((guest) => (
                    <TableRow key={guest.id}>
                      <TableCell className="font-medium">{guest.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">{guest.email}</TableCell>
                      <TableCell className="hidden md:table-cell">{guest.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={guest.isPresent ? "default" : "secondary"}
                          className={guest.isPresent ? "bg-green-500" : ""}
                        >
                          {guest.isPresent ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Present</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              <span className="hidden sm:inline">Not Present</span>
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1 sm:space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleGenerateQR(guest)}
                            className="p-1 sm:p-2"
                          >
                            <QrCode className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteGuest(guest.id)}
                            className="text-red-500 hover:text-red-700 p-1 sm:p-2"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-6 sm:py-8">
            <UserPlus className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-3 sm:mb-4" />
            <p className="text-gray-500 text-center text-sm sm:text-base mb-3 sm:mb-4 px-2 sm:px-4">
              No guests added yet. Add guests to generate QR codes for invitations.
            </p>
            <Button className="w-full sm:w-auto" onClick={() => setIsAddOpen(true)}>Add First Guest</Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-md">
          <DialogHeader className="space-y-1 sm:space-y-2">
            <DialogTitle className="text-lg sm:text-xl">QR Code for {selectedGuest?.name}</DialogTitle>
            <DialogDescription className="text-sm">
              Share this QR code with the guest for event check-in
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-3 sm:space-y-4">
            {qrCodeUrl && (
              <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48 sm:w-64 sm:h-64" />
            )}
            <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-2 sm:space-y-0 sm:space-x-2">
              <Button className="w-full" onClick={downloadQR}>Download QR Code</Button>
              <Button className="w-full" variant="outline" onClick={() => setQrDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}