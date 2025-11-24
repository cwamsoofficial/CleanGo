-- Add in_progress status to pickup_status enum
ALTER TYPE pickup_status ADD VALUE IF NOT EXISTS 'in_progress' AFTER 'pending';