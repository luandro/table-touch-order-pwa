-- Alternative Migration: Simple storage policies for menu-images bucket
-- This is a simpler version that allows all authenticated users to manage menu images
-- Use this if you want less restrictive policies or if the main migration is too complex

-- Create the menu-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'menu-images',
  'menu-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Simple policy: Allow authenticated users full access to menu-images bucket
CREATE POLICY "Allow authenticated users full access to menu images"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'menu-images')
WITH CHECK (bucket_id = 'menu-images');

-- Allow public read access for displaying images
CREATE POLICY "Allow public read access to menu images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'menu-images');
