-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create guests table
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  invite_code TEXT NOT NULL UNIQUE,
  is_present BOOLEAN DEFAULT FALSE,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_guests_event_id ON guests(event_id);
CREATE INDEX idx_guests_invite_code ON guests(invite_code);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (can be restricted later with auth)
CREATE POLICY "Public can read events" ON events FOR SELECT USING (true);
CREATE POLICY "Public can insert events" ON events FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update events" ON events FOR UPDATE USING (true);
CREATE POLICY "Public can delete events" ON events FOR DELETE USING (true);

CREATE POLICY "Public can read guests" ON guests FOR SELECT USING (true);
CREATE POLICY "Public can insert guests" ON guests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update guests" ON guests FOR UPDATE USING (true);
CREATE POLICY "Public can delete guests" ON guests FOR DELETE USING (true);