# Storage Policies Migration for Menu Images

## Issue Description

The error "Image upload service error: Error: Failed to upload image: new row violates row-level security policy" occurs because Supabase Storage requires explicit Row Level Security (RLS) policies on the `storage.objects` table to allow any operations on storage buckets.

By default, Supabase Storage blocks all operations (INSERT, SELECT, UPDATE, DELETE) unless there are specific RLS policies that allow them.

## Root Cause

Your `uploadMenuItemImage` function in `supabaseService.ts` creates a bucket called `menu-images` but there are no RLS policies configured to allow:
1. **INSERT** operations (uploading files)
2. **SELECT** operations (reading/displaying files)
3. **UPDATE** operations (overwriting files with upsert)
4. **DELETE** operations (removing files)

## Migration Files

### 1. `20240124000000_create_menu_images_storage_policies.sql` (Recommended)

This is the comprehensive migration that includes:
- Creates the `menu-images` bucket with proper configuration
- Restricts uploads to the `menu-items/` folder structure
- Allows authenticated users to upload, update, and delete images
- Allows public read access for displaying images in the app
- Includes optional admin-only policies (commented out)

**Features:**
- ✅ Folder-based restrictions (`menu-items/` only)
- ✅ File type restrictions (JPEG, PNG, WebP)
- ✅ File size limit (5MB)
- ✅ Public read access for image display
- ✅ Authenticated user upload/management
- ✅ Optional admin-only access patterns

### 2. `20240124000001_simple_menu_images_storage_policies.sql` (Alternative)

This is a simpler version that:
- Creates the `menu-images` bucket
- Allows all authenticated users full access to the entire bucket
- Allows public read access

**Use this if:**
- You want simpler policies
- You don't need folder restrictions
- You trust all authenticated users with image management

## How to Apply the Migration

### Option 1: Using Supabase CLI (Recommended)
```bash
# Navigate to your project root
cd /home/user/Development/table-touch-order-pwa

# Apply the migration
supabase db push

# Or apply a specific migration
supabase db push --include-all
```

### Option 2: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the content of one of the migration files
4. Execute the SQL

### Option 3: Manual Application
If you don't have Supabase CLI set up, you can run the SQL directly in your Supabase dashboard's SQL editor.

## Verification

After applying the migration, test the image upload functionality:

1. Go to your admin menu management page
2. Try to upload an image for a menu item
3. The upload should now work without the RLS policy error

## Current Code Analysis

Your current `uploadMenuItemImage` function in `supabaseService.ts`:
- ✅ Creates bucket with proper configuration
- ✅ Uses correct file path structure (`menu-items/filename`)
- ✅ Has proper error handling
- ❌ Missing RLS policies (fixed by these migrations)

## Security Considerations

### Current Setup (After Migration)
- **Public Read**: Anyone can view uploaded images (good for displaying in customer app)
- **Authenticated Upload**: Only logged-in users can upload images
- **Folder Restriction**: Uploads are restricted to `menu-items/` folder
- **File Type Restriction**: Only image files (JPEG, PNG, WebP) allowed
- **Size Limit**: 5MB maximum file size

### If You Need More Security
Uncomment the admin-only policy section in the main migration file and adjust the role checking logic based on your authentication setup.

## Troubleshooting

If you still get RLS errors after applying the migration:

1. **Check if policies were created:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
   ```

2. **Verify bucket exists:**
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'menu-images';
   ```

3. **Check user authentication:**
   Make sure the user is properly authenticated when uploading images.

4. **Test with service key:**
   For debugging, you can temporarily use the service key (but never in production client-side code).

## Next Steps

1. Apply one of the migration files
2. Test image upload functionality
3. Monitor for any remaining issues
4. Consider implementing image optimization/compression if needed
5. Set up proper backup policies for uploaded images
