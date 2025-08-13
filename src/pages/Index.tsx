import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { EventManager } from '@/components/EventManager';
import { GuestManager } from '@/components/GuestManager';
import { QRScanner } from '@/components/QRScanner';
import { Dashboard } from '@/components/Dashboard';
import { Event } from '@/types';
import { storage } from '@/lib/storage';
import { Calendar, Users, QrCode, BarChart3, LogOut } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Index() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { user, signOut } = useAuthContext();

  useEffect(() => {
    // Load the first event as default selection
    const loadDefaultEvent = async () => {
      try {
        const events = await storage.getEvents();
        if (events.length > 0 && !selectedEvent) {
          setSelectedEvent(events[0]);
        }
      } catch (error) {
        console.error('Error loading events:', error);
      }
    };
    
    loadDefaultEvent();
  }, []);

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">QR Event Validator</h1>
              <p className="text-gray-600">Manage events, guests, and validate attendance</p>
            </div>
            <div className="flex items-center gap-4">
              {selectedEvent && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">Selected Event:</p>
                  <p className="font-medium text-gray-900">{selectedEvent.name}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="text-sm text-gray-500">
                  {user?.email}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={async () => {
                    await signOut();
                    toast.success('Logged out successfully');
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="guests" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Guests
            </TabsTrigger>
            <TabsTrigger value="scanner" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Scanner
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard selectedEvent={selectedEvent} />
          </TabsContent>

          <TabsContent value="events">
            <EventManager 
              onEventSelect={handleEventSelect}
              selectedEvent={selectedEvent}
            />
          </TabsContent>

          <TabsContent value="guests">
            <GuestManager selectedEvent={selectedEvent} />
          </TabsContent>

          <TabsContent value="scanner">
            <QRScanner selectedEvent={selectedEvent} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}