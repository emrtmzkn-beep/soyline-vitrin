-- Migration: Create launch_registrations table for SoyLine launch campaign
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS launch_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  launch_code TEXT NOT NULL
    CHECK (launch_code IN ('SOYLINE250', 'AYGIR30')),
  user_type TEXT NOT NULL
    CHECK (user_type IN ('horse_owner', 'stallion_owner')),
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS
  idx_launch_reg_email_code
  ON launch_registrations(email, launch_code);

ALTER TABLE launch_registrations
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert"
  ON launch_registrations FOR INSERT WITH CHECK (true);

CREATE POLICY "Only authenticated can select"
  ON launch_registrations FOR SELECT
  USING (auth.role() = 'authenticated');
