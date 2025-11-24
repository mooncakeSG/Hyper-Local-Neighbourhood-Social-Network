# Supabase Storage Setup Guide

## Prerequisites

1. Supabase project created
2. Storage bucket configured
3. Service role key available

## Step 1: Create Storage Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** section
3. Click **New bucket**
4. Create bucket named: `post-images`
5. Set bucket to **Public** (for public image access)
6. Click **Create bucket**

## Step 2: Configure Bucket Policies

Run this SQL in Supabase SQL Editor to set up RLS policies:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'post-images');

-- Allow authenticated users to read images
CREATE POLICY "Users can read images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'post-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'post-images' AND (storage.foldername(name))[1] = auth.uid()::text);
```

## Step 3: Environment Variables

Ensure your `.env` file has:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Step 4: Test Upload

### Using curl
```bash
curl -X POST http://localhost:8000/api/v1/upload/image \
  -H "Authorization: Bearer {user_id_or_token}" \
  -F "file=@/path/to/image.jpg" \
  -F "folder=posts"
```

### Using PowerShell
```powershell
$headers = @{
    "Authorization" = "Bearer test-user-123"
}

$filePath = "C:\path\to\image.jpg"
$formData = @{
    file = Get-Item -Path $filePath
    folder = "posts"
}

Invoke-WebRequest -Uri http://localhost:8000/api/v1/upload/image `
  -Method POST `
  -Headers $headers `
  -Form $formData
```

### Using Python
```python
import requests

url = "http://localhost:8000/api/v1/upload/image"
headers = {"Authorization": "Bearer user-id-123"}
files = {"file": open("image.jpg", "rb")}
data = {"folder": "posts"}

response = requests.post(url, headers=headers, files=files, data=data)
print(response.json())
```

## Supported File Types

- JPEG/JPG
- PNG
- WebP
- GIF

## File Size Limits

- Maximum: 5MB per file
- Recommended: < 2MB for faster uploads

## Folder Structure

Images are organized as:
```
post-images/
  posts/
    {user_id}/
      {uuid}.{ext}
  businesses/
    {user_id}/
      {uuid}.{ext}
```

## API Endpoints

### Upload Image
```
POST /api/v1/upload/image
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- file: (required) Image file
- folder: (optional) Folder name (default: "posts")
```

**Response:**
```json
{
  "success": true,
  "url": "https://...supabase.co/storage/v1/object/public/post-images/posts/user-id/uuid.jpg",
  "message": "Image uploaded successfully"
}
```

### Delete Image
```
DELETE /api/v1/upload/image?image_url={url}
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

## Troubleshooting

### "Bucket not found"
- Verify bucket name is `post-images`
- Check bucket exists in Supabase Storage dashboard

### "Permission denied"
- Check RLS policies are set correctly
- Verify service role key has proper permissions

### "File too large"
- Reduce image size
- Compress image before upload

### "Invalid file type"
- Ensure file is JPEG, PNG, WebP, or GIF
- Check file extension matches content type

## Integration with Posts

After uploading, use the returned URL in post creation:

```javascript
// 1. Upload image
const formData = new FormData();
formData.append('file', imageFile);
formData.append('folder', 'posts');

const uploadResponse = await fetch('/api/v1/upload/image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const { url } = await uploadResponse.json();

// 2. Create post with image URL
await fetch('/api/v1/posts/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: 'Post with image',
    image_url: url
  })
});
```

