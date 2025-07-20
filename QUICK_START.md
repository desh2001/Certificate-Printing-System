# Quick Start Guide

Get your Certificate Printing System up and running in minutes!

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Setup Script
```bash
npm run setup
```

### 3. Create Sample Template (Optional)
```bash
npm run create-template
```
This creates a sample certificate template for testing.

### 4. Start the Application
```bash
npm start
```

### 5. Open in Browser
Go to: http://localhost:3000

## 📋 What You Need

### For Basic Usage:
- ✅ Certificate template image (PNG, JPG, JPEG)
- ✅ Excel file with names in the first column
- ✅ Web browser

### For Google Drive Integration:
- ✅ Google Cloud Platform account
- ✅ Google Drive API enabled
- ✅ Service account credentials (credentials.json)

## 🎯 Quick Test

1. **Upload the sample template** (if you ran `npm run create-template`)
2. **Create a simple Excel file** with names:
   ```
   Name
   John Doe
   Jane Smith
   ```
3. **Click "Generate Certificates"**
4. **View results** - certificates will be generated and uploaded to Google Drive

## 📁 File Structure After Setup

```
certificate-system/
├── public/                    # Web interface
├── uploads/                   # Temporary uploads
├── certificates/              # Generated certificates
├── sample-certificate-template.png  # Sample template
├── sample-names.xlsx          # Sample Excel file
└── .env                       # Configuration
```

## 🔧 Troubleshooting

### Common Issues:

**"Module not found" errors:**
```bash
npm install
```

**Port already in use:**
```bash
# Change port in .env file
PORT=3001
```

**Google Drive not working:**
- Check that credentials.json exists
- Verify Google Drive API is enabled
- Ensure service account has proper permissions

## 📞 Need Help?

- Check the full [README.md](README.md) for detailed instructions
- Review the [troubleshooting section](README.md#troubleshooting)
- Open an issue in the repository

## 🎉 You're Ready!

Your Certificate Printing System is now running! Start creating beautiful certificates with personalized names. 