import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, CheckCircle, XCircle, Calendar, TrendingUp } from 'lucide-react';
import { Event, Guest } from '@/types';
import { storage } from '@/lib/storage';

interface DashboardProps {
  selectedEvent: Event | null;
}

export function Dashboard({ selectedEvent }: DashboardProps) {
  const [stats, setStats] = useState({
    totalGuests: 0,
    presentGuests: 0,
    absentGuests: 0,
    attendanceRate: 0
  });
  const [recentActivity, setRecentActivity] = useState<Guest[]>([]);

  useEffect(() => {
    if (selectedEvent) {
      loadStats();
    }
  }, [selectedEvent]);

  const loadStats = async () => {
    if (!selectedEvent) return;

    try {
      const eventGuests = await storage.getGuestsByEventId(selectedEvent.id);
      const presentGuests = eventGuests.filter(g => g.isPresent);
      const absentGuests = eventGuests.filter(g => !g.isPresent);
      
      const attendanceRate = eventGuests.length > 0 
        ? Math.round((presentGuests.length / eventGuests.length) * 100)
        : 0;

      setStats({
        totalGuests: eventGuests.length,
        presentGuests: presentGuests.length,
        absentGuests: absentGuests.length,
        attendanceRate
      });

      // Get recent check-ins (sorted by checkedInAt)
      const recentCheckIns = presentGuests
        .filter(g => g.checkedInAt)
        .sort((a, b) => new Date(b.checkedInAt!).getTime() - new Date(a.checkedInAt!).getTime())
        .slice(0, 5);
      
      setRecentActivity(recentCheckIns);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  if (!selectedEvent) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-center">
            Please select an event to view dashboard
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Dashboard - {selectedEvent.name}</h2>
        <p className="text-gray-600">{selectedEvent.description}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Guests</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGuests}</div>
            <p className="text-xs text-muted-foreground">
              Registered for this event
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.presentGuests}</div>
            <p className="text-xs text-muted-foreground">
              Checked in guests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.absentGuests}</div>
            <p className="text-xs text-muted-foreground">
              Not yet checked in
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              Of total guests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Progress</CardTitle>
          <CardDescription>
            Real-time attendance tracking for {selectedEvent.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{stats.presentGuests} / {stats.totalGuests}</span>
            </div>
            <Progress value={stats.attendanceRate} className="h-2" />
          </div>
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                {stats.presentGuests} Present
              </Badge>
            </span>
            <span>
              <Badge variant="outline" className="text-red-600 border-red-600">
                {stats.absentGuests} Absent
              </Badge>
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Event Details */}
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">Date & Time:</span>
              <span>{new Date(selectedEvent.date).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Location:</span>
              <span>{selectedEvent.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Created:</span>
              <span>{new Date(selectedEvent.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Check-ins</CardTitle>
            <CardDescription>Latest guest arrivals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((guest) => (
                <div key={guest.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <p className="font-medium text-green-800">{guest.name}</p>
                    <p className="text-sm text-green-600">{guest.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Checked In
                    </Badge>
                    {guest.checkedInAt && (
                      <p className="text-xs text-green-600 mt-1">
                        {new Date(guest.checkedInAt).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {stats.totalGuests === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Users className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center mb-4">
              No guests added to this event yet.
            </p>
            <p className="text-sm text-gray-400 text-center">
              Add guests to start tracking attendance and generate QR codes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}