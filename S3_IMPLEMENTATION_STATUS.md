# S3 File Upload - Complete Implementation Code

## ✅ COMPLETED: Backend Files Created

### 1. Dependencies Installed ✅
```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner multer
npm install --save-dev @types/multer
```

### 2. Files Created:

#### ✅ `server/src/config/s3.config.ts` - DONE
S3 client configuration with Garage endpoint

#### ✅ `server/src/services/upload.service.ts` - DONE
- `uploadFile()` - Upload single file to S3
- `uploadMultipleFiles()` - Upload multiple files
- `getFileDownloadUrl()` - Generate signed URLs
- `deleteFile()` - Delete from S3

#### ✅ `server/src/routes/upload.routes.ts` - DONE
API Endpoints:
- `POST /api/upload/single` - Upload one file
- `POST /api/upload/multiple` - Upload multiple files  
- `GET /api/upload/download-url?s3Key=...` - Get signed URL
- `DELETE /api/upload?s3Key=...` - Delete file

#### ✅ `server/src/config/env.ts` - UPDATED
Added S3 environment variables with defaults

#### ✅ `server/src/routes/index.ts` - UPDATED
Imported and mounted upload routes

---

## 📋 WHAT YOU NEED TO DO:

### Step 1: Add Credentials to `.env`

Create/update `server/.env`:

```env
# Existing variables (keep these)
NODE_ENV=development
PORT=4000
JWT_SECRET=your_existing_secret
JWT_EXPIRES_IN=7d

# NEW: Add these S3 credentials
S3_ENDPOINT=https://kebs3ui.velgen.tech
S3_REGION=garage
S3_ACCESS_KEY_ID=YOUR_ACCESS_KEY_HERE
S3_SECRET_ACCESS_KEY=YOUR_SECRET_KEY_HERE
S3_BUCKET_NAME=veew-documents
S3_USE_PATH_STYLE=true
```

### Step 2: Create Bucket in Garage

1. Go to https://kebs3ui.velgen.tech/
2. Click "Buckets" → "Create Bucket"
3. Name: `veew-documents`
4. Click "Keys" → Create new key → Copy credentials

### Step 3: Test Backend

```bash
cd server
npm run dev
```

Server should start without errors. Check console for S3 connection.

---

## 🚀 NEXT: Frontend Implementation

### Files to Update (I'll do this next):

1. **`client/src/api/client.ts`**
   - Add `uploadFile()` function
   - Handle FormData uploads

2. **`client/src/pages/CustomersPage.tsx`**
   - Update file inputs to upload to S3
   - Show upload progress
   - Display file URLs

3. **`client/src/components/ui/FileUpload.tsx`** (NEW)
   - Reusable file upload component
   - Progress bar
   - Preview/download links

---

## 📊 How It Works:

### Upload Flow:
```
1. User selects file → Frontend
2. FormData sent to POST /api/upload/single → Backend
3. Multer processes file → Memory buffer
4. upload.service uploads to S3 → Garage
5. Returns { fileUrl, s3Key, fileName }
6. Frontend saves to documents table with s3Key
```

### Download Flow:
```
1. User clicks download → Frontend
2. GET /api/upload/download-url?s3Key=... → Backend
3. Generates signed URL (1 hour expiry)
4. Returns { url }
5. Frontend opens URL → User downloads
```

### File Structure in S3:
```
veew-documents/
├── customers/
│   └── CUS-2026-10001/
│       ├── aadhaar_1696340960000_a1b2c3.pdf
│       └── pan_1696340970000_d4e5f6.pdf
├── properties/
│   └── PROP-2026-20001/
│       └── eswathu_1696340980000_g7h8i9.pdf
└── projects/
    └── PRJ-2026-40001/
        ├── site_1696340990000_j0k1l2.jpg
        └── workorder_1696341000000_m3n4o5.pdf
```

---

## 🔒 Security Features Built-In:

✅ File type validation (only PDF, JPG, PNG)  
✅ File size limit (10MB max)  
✅ Authenticated uploads only  
✅ Signed URLs with 1-hour expiry  
✅ Private bucket (no public access)  
✅ Unique filenames prevent collisions  

---

## ⚙️ Configuration Options:

All configurable via `.env`:

```env
# File size limit (bytes) - default 10MB
MAX_FILE_SIZE=10485760

# Allowed MIME types (comma-separated)
ALLOWED_FILE_TYPES=application/pdf,image/jpeg,image/jpg,image/png

# Signed URL expiry (seconds) - default 1 hour
SIGNED_URL_EXPIRY=3600
```

---

## 🧪 Testing:

### Test Upload with cURL:
```bash
curl -X POST http://localhost:4000/api/upload/single \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/test.pdf" \
  -F "folder=customers" \
  -F "entityId=CUS-2026-10001" \
  -F "fileType=aadhaar"
```

### Expected Response:
```json
{
  "fileUrl": "veew-documents/customers/CUS-2026-10001/test_1696340960000_a1b2c3.pdf",
  "fileName": "test.pdf",
  "fileSize": 245632,
  "mimeType": "application/pdf",
  "s3Key": "customers/CUS-2026-10001/test_1696340960000_a1b2c3.pdf"
}
```

---

## 📝 Document Type Updates:

Update `Document` interface to include S3 fields:

```typescript
export interface Document {
  id: string
  type: DocumentType
  fileName: string
  description?: string
  uploadDate: string
  
  // NEW S3 fields
  s3Key?: string          // S3 object key
  fileUrl?: string        // S3 bucket + key
  fileSize?: number       // Bytes
  mimeType?: string       // MIME type
  
  customerId?: string
  propertyId?: string
  projectId?: string
}
```

---

## ✅ Implementation Checklist:

### Backend (DONE):
- [x] Install AWS SDK dependencies
- [x] Create S3 config service
- [x] Create upload service
- [x] Create upload routes
- [x] Update env.ts for S3 variables
- [x] Mount upload routes in index.ts

### Your Setup (TODO):
- [ ] Create S3 bucket in Garage
- [ ] Generate access keys
- [ ] Add credentials to `.env`
- [ ] Test server starts without errors

### Frontend (NEXT SESSION):
- [ ] Add uploadFile() to api/client.ts
- [ ] Update CustomerFormPage file inputs
- [ ] Add progress indicators
- [ ] Update Document display with download links
- [ ] Test end-to-end flow

---

## 🎯 Current Status:

**Backend**: ✅ 100% Complete (code written, waiting for credentials)  
**Frontend**: ⏳ Ready to implement (2-3 hours work)  
**Testing**: ⏳ After credentials provided

---

## 🚨 Important Notes:

1. **Credentials**: Keep S3 credentials in `.env`, NEVER commit to git
2. **Bucket Policy**: Ensure bucket is private in Garage
3. **CORS**: May need to configure CORS in Garage for direct uploads
4. **Migration**: Existing metadata-only documents will keep working
5. **Backward Compat**: System handles both old (metadata) and new (S3) documents

---

## 📞 Next Steps:

**When you're ready:**
1. Provide S3 credentials
2. I'll update `.env`
3. Test backend upload endpoint
4. Implement frontend (2-3 hours)
5. End-to-end testing
6. Commit and push

**Estimated total time**: 3-4 hours including testing

The backend is ready and waiting for your credentials! 🚀
