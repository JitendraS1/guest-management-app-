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
        <CardContent className="flex flex-col items-center justify-center py-8">
          <UserPlus className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-center">
            Please select an event to manage guests
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Guests for {selectedEvent.name}</h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add Guest
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Guest</DialogTitle>
              <DialogDescription>
                Add a new guest to {selectedEvent.name}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddGuest} className="space-y-4">
              <div>
                <Label htmlFor="guestName">Name *</Label>
                <Input
                  id="guestName"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter guest name"
                />
              </div>
              <div>
                <Label htmlFor="guestEmail">Email *</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter guest email"
                />
              </div>
              <div>
                <Label htmlFor="guestPhone">Phone</Label>
                <Input
                  id="guestPhone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter guest phone"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Guest</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {guests.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Guest List</CardTitle>
            <CardDescription>
              Total: {guests.length} | Present: {guests.filter(g => g.isPresent).length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {guests.map((guest) => (
                  <TableRow key={guest.id}>
                    <TableCell className="font-medium">{guest.name}</TableCell>
                    <TableCell>{guest.email}</TableCell>
                    <TableCell>{guest.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={guest.isPresent ? "default" : "secondary"}
                        className={guest.isPresent ? "bg-green-500" : ""}
                      >
                        {guest.isPresent ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Present
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Not Present
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateQR(guest)}
                        >
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteGuest(guest.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <UserPlus className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center mb-4">
              No guests added yet. Add guests to generate QR codes for invitations.
            </p>
            <Button onClick={() => setIsAddOpen(true)}>Add First Guest</Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code for {selectedGuest?.name}</DialogTitle>
            <DialogDescription>
              Share this QR code with the guest for event check-in
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            {qrCodeUrl && (
              <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
            )}
            <div className="flex space-x-2">
              <Button onClick={downloadQR}>Download QR Code</Button>
              <Button variant="outline" onClick={() => setQrDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}