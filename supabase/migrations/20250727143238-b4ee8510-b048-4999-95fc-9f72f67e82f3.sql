-- Add category column to repair_requests table if it doesn't exist
ALTER TABLE repair_requests ADD COLUMN IF NOT EXISTS category text DEFAULT 'other';