# Garage S3 File Upload Implementation Guide

## Prerequisites from Your Side

### 1. **S3 Credentials Required**
You need to provide the following credentials:

```env
# Add these to server/.env file
S3_ENDPOINT=https://kebs3ui.velgen.tech
S3_REGION=garage           # or your Garage region
S3_ACCESS_KEY_ID=your_access_key_here
S3_SECRET_ACCESS_KEY=your_secret_key_here
S3_BUCKET_NAME=veew-documents  # or your preferred bucket name
```

### 2. **Create S3 Bucket**
You need to create a bucket in Garage for VEEW OS documents:

**Option A: Via Garage Web UI** (`https://kebs3ui.velgen.tech/`)
1. Navigate to "Buckets" section
2. Click "Create Bucket"
3. Name: `veew-documents` (or your preference)
4. Set appropriate permissions

**Option B: Via AWS CLI** (if you have CLI configured for Garage)
```bash
aws s3 mb s3://veew-documents --endpoint-url https://kebs3ui.velgen.tech
```

### 3. **Generate Access Keys**
In Garage Web UI:
1. Go to "Keys" section
2. Create a new key pair
3. Copy Access Key ID and Secret Access Key
4. Grant permissions to the bucket

### 4. **Bucket Permissions**
Recommended bucket policy for VEEW OS:
- **Private**: Files accessible only with signed URLs
- **CORS**: Allow uploads from your frontend domain

---

## What I'll Implement

### Backend Changes:
1. ✅ Install AWS SDK for Node.js
2. ✅ Create S3 upload service
3. ✅ Add file upload endpoint (`POST /api/upload`)
4. ✅ Modify document creation to store S3 URLs
5. ✅ Add signed URL generation for downloads
6. ✅ Environment variable configuration

### Frontend Changes:
1. ✅ Update file inputs to send actual files
2. ✅ Add progress indicators for uploads
3. ✅ Handle multipart/form-data
4. ✅ Display upload errors
5. ✅ Show file previews/download links

### File Structure:
```
server/
  src/
    config/
      s3.config.ts         (NEW)
    services/
      upload.service.ts    (NEW)
      document.service.ts  (MODIFY)
    routes/
      upload.routes.ts     (NEW)
      index.ts            (UPDATE)
```

---

## S3 File Organization

Files will be stored with this structure:
```
veew-documents/
  customers/
    CUS-2026-10001/
      aadhaar.pdf
      pan.pdf
  properties/
    PROP-2026-20001/
      e-swathu.pdf
  projects/
    PRJ-2026-40001/
      site-photo.jpg
      work-order.pdf
```

---

## Security Measures

1. **File Type Validation**: Only PDF and images allowed
2. **File Size Limits**: Max 10MB per file
3. **Virus Scanning**: Optional ClamAV integration
4. **Signed URLs**: Pre-signed URLs with 1-hour expiry for downloads
5. **Access Control**: Files accessible only by authenticated users

---

## Environment Variables Needed

Create/update `server/.env`:

```env
# Existing variables
NODE_ENV=development
PORT=4000
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# NEW: S3/Garage Configuration
S3_ENDPOINT=https://kebs3ui.velgen.tech
S3_REGION=garage
S3_ACCESS_KEY_ID=your_access_key_id_here
S3_SECRET_ACCESS_KEY=your_secret_access_key_here
S3_BUCKET_NAME=veew-documents
S3_USE_PATH_STYLE=true  # Required for Garage compatibility
```

---

## Testing Checklist

After implementation, test:
- [ ] Upload Aadhaar PDF from customer form
- [ ] Upload PAN PDF from customer form
- [ ] Upload site photo from project form
- [ ] Download document from customer detail page
- [ ] Verify file appears in Garage bucket
- [ ] Test with 10MB file
- [ ] Test with invalid file type (should reject)
- [ ] Test download signed URL expiry

---

## Costs & Storage

**Garage Storage**:
- Self-hosted, so no per-GB AWS charges
- Monitor your Garage instance disk space
- Typical file sizes:
  - Aadhaar PDF: 200-500 KB
  - PAN PDF: 100-300 KB
  - Site photos: 1-5 MB
  - Estimate: ~10-20 MB per customer on average

---

## Migration Plan

### Phase 1: Add Upload (New Customers)
- New customers will upload files to S3
- Existing customers still show metadata only

### Phase 2: Backfill (Optional)
- Add UI for existing customers to upload documents
- Bulk upload tool for admin

### Phase 3: Cleanup
- Remove old metadata-only code
- Archive old documents table

---

## What You Need to Provide:

### ✅ Required Now:
1. **S3_ACCESS_KEY_ID** - From Garage Keys section
2. **S3_SECRET_ACCESS_KEY** - From Garage Keys section
3. **S3_BUCKET_NAME** - Create bucket in Garage (suggest: `veew-documents`)

### ℹ️ Optional (Can use defaults):
- `S3_ENDPOINT` - Default: `https://kebs3ui.velgen.tech`
- `S3_REGION` - Default: `garage`
- `S3_USE_PATH_STYLE` - Default: `true`

---

## Next Steps:

1. **You**: Create bucket and generate access keys in Garage
2. **Me**: Implement complete S3 upload integration
3. **You**: Add credentials to `.env` file
4. **Test**: Upload first document and verify in Garage
5. **Deploy**: Push to production

---

## Estimated Time:
- **My implementation**: ~2-3 hours
- **Your setup**: ~15 minutes (create bucket + keys)
- **Testing**: ~30 minutes

---

## Questions to Confirm:

1. **Bucket name preference?** (I'll use `veew-documents`)
2. **File size limit?** (I'll use 10MB)
3. **Allowed file types?** (I'll use PDF and images: jpg, png, jpeg)
4. **Signed URL expiry?** (I'll use 1 hour)
5. **Should old customers be able to upload later?** (I'll add UI for this)

Let me know when you have the credentials ready, and I'll implement everything!
