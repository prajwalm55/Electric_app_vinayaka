# Aadhaar & PAN Card Data Storage - VEEW OS

## Current Implementation Status

### Where Data is Saved:

#### 1. **Aadhaar & PAN Numbers** (Text)
**Location**: `customers` table in `server/data/db.json`

**Saved in Customer Object:**
```json
{
  "id": "CUS-2026-10001",
  "name": "Customer Name",
  "aadhaar": "123456789012",  // 12-digit number (spaces removed)
  "pan": "ABCDE1234F",         // Optional, 10-character alphanumeric
  ...
}
```

**Code Location**: `client/src/pages/CustomersPage.tsx`
- Lines 407-408: Customer creation with Aadhaar/PAN
- Line 324-325: Form state initialization
- Line 382: Validation (12 digits for Aadhaar)

---

#### 2. **Aadhaar & PAN PDF Files** (Metadata Only)
**Location**: `documents` table in `server/data/db.json`

**Saved as Document Metadata:**
```json
{
  "id": "DOC-2026-00001",
  "type": "Aadhaar",
  "fileName": "aadhaar.pdf",      // Only filename saved, not actual file
  "description": "Customer Aadhaar",
  "customerId": "CUS-2026-10001",
  "uploadDate": "2026-10-04T03:47:36.082Z"
}
```

**Code Location**: `client/src/pages/CustomersPage.tsx`
- Lines 431-437: Save Aadhaar PDF metadata
- Lines 440-446: Save PAN PDF metadata
- Lines 514-529: File input UI with helper text

**Important Note on Line 528:**
```
"File metadata is saved now; binary upload storage comes with the next backend phase."
```

---

## Current Behavior:

### ✅ What IS Saved:
1. **Aadhaar Number**: 12-digit number stored in customer record
2. **PAN Number**: Optional, stored in customer record
3. **File Names**: PDF filenames stored in documents table
4. **Upload Date**: Timestamp when metadata was saved

### ❌ What is NOT Saved:
1. **Actual PDF Files**: Binary file content is not uploaded to server
2. **File Size**: Not tracked
3. **File Path**: No actual storage location (files don't exist on server)

---

## Technical Details:

### File Input Handling (Lines 514-527):
```typescript
<Input
  label="Aadhaar PDF"
  type="file"
  accept=".pdf,image/*"
  onChange={(e) => setAadhaarFile(e.target.files?.[0]?.name || '')}
/>
```

**What happens:**
- User selects a file from their device
- **Only the filename** is extracted: `e.target.files?.[0]?.name`
- Filename is stored in state: `aadhaarFile`
- Actual file bytes are **ignored**

### Save Flow (Lines 431-446):
```typescript
if (aadhaarFile) {
  await addDocument({
    type: 'Aadhaar',
    fileName: aadhaarFile,           // Just the name, e.g., "my_aadhaar.pdf"
    description: 'Customer Aadhaar',
    customerId: customer.id,
  })
}
```

---

## Database Structure:

### Customers Table:
```json
{
  "customers": [
    {
      "id": "CUS-2026-10001",
      "name": "Rajesh Kumar",
      "aadhaar": "123456789012",
      "pan": "ABCDE1234F",
      ...
    }
  ]
}
```

### Documents Table:
```json
{
  "documents": [
    {
      "id": "DOC-2026-00001",
      "type": "Aadhaar",
      "fileName": "rajesh_aadhaar.pdf",
      "description": "Customer Aadhaar",
      "customerId": "CUS-2026-10001",
      "uploadDate": "2026-01-25T10:30:00Z"
    },
    {
      "id": "DOC-2026-00002",
      "type": "PAN",
      "fileName": "rajesh_pan.pdf",
      "description": "Customer PAN card",
      "customerId": "CUS-2026-10001",
      "uploadDate": "2026-01-25T10:30:00Z"
    }
  ]
}
```

---

## Why Only Metadata?

This is **by design** per the frontend migration brief (FRONTEND_MIGRATION_BRIEF.md):

> **Line 56-57**: "Binary file storage: File inputs save **filename metadata only**. There is no upload of bytes. Show a note that binary storage is a later backend phase."

### Reasons:
1. **Phase 1**: Metadata tracking for business logic
2. **Phase 2**: Actual file storage (S3, local storage, etc.) to be implemented
3. **Simplification**: JSON file storage doesn't handle binary data well
4. **User Awareness**: Helper text explicitly states this limitation

---

## Future Implementation:

To add actual file upload, you'll need:

1. **Backend Changes:**
   - Add file upload endpoint (multipart/form-data)
   - Storage solution (AWS S3, local disk, etc.)
   - Store file path/URL in documents table

2. **Frontend Changes:**
   - Change from `e.target.files?.[0]?.name` to `e.target.files?.[0]`
   - Use FormData API to send file
   - Update API client to handle multipart uploads

3. **Database Schema:**
   ```json
   {
     "fileName": "aadhaar.pdf",
     "fileSize": 245632,
     "filePath": "/uploads/customers/CUS-2026-10001/aadhaar.pdf",
     "fileUrl": "https://storage.example.com/...",
     "mimeType": "application/pdf"
   }
   ```

---

## Summary:

**Currently Saving:**
- ✅ Aadhaar number (text) → `customers.aadhaar`
- ✅ PAN number (text) → `customers.pan`
- ✅ PDF filenames (metadata only) → `documents` table
- ❌ Actual PDF files (not implemented yet)

**Location in Code:**
- Customer creation: `CustomersPage.tsx` lines 371-473
- Aadhaar/PAN fields: Lines 506-507
- File inputs: Lines 514-527
- Document metadata save: Lines 431-446

**Database Location:**
- `server/data/db.json`
  - Aadhaar/PAN numbers: `customers` array
  - File metadata: `documents` array

The system tracks **what documents should exist** but doesn't store the actual files yet.
