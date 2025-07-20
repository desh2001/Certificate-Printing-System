# Certificate Printing System

A modern web application for generating personalized certificates by uploading a certificate template and an Excel file with names. The generated certificates are automatically uploaded to Google Drive.

## Features

- 🎨 **Certificate Template Upload**: Upload your certificate design (PNG, JPG, JPEG)
- 📊 **Excel Integration**: Import names from Excel files (.xlsx, .xls)
- ✨ **Automatic Name Printing**: Names are automatically printed in the center of certificates
- ☁️ **Google Drive Integration**: Generated certificates are uploaded to Google Drive
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices
- 🎯 **Drag & Drop**: Easy file upload with drag and drop functionality
- 📈 **Progress Tracking**: Real-time progress indication during processing
- 🔗 **Direct Links**: Direct access to uploaded certificates via Google Drive links

## Prerequisites

- Node.js (version 14 or higher)
- npm or yarn
- Google Cloud Platform account with Google Drive API enabled

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd certificate-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Google OAuth 2.0**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google Drive API
   - Go to "APIs & Services" > "Credentials"
   - Create an "OAuth 2.0 Client ID"
   - Set the redirect URI to: `http://localhost:3000/auth/google/callback`
   - Copy the Client ID and Client Secret

4. **Configure environment variables**
   ```bash
   cp env.example .env
   ```
   Edit `.env` file and update the following:
   - `GOOGLE_CLIENT_ID`: Your OAuth 2.0 Client ID
   - `GOOGLE_CLIENT_SECRET`: Your OAuth 2.0 Client Secret
   - `GOOGLE_REDIRECT_URI`: OAuth redirect URI (default: http://localhost:3000/auth/google/callback)
   - `GOOGLE_DRIVE_FOLDER_ID`: (Optional) Google Drive folder ID where certificates will be uploaded
   - `SESSION_SECRET`: A random string for session management

## Usage

1. **Start the application**
   ```bash
   npm start
   ```
   For development with auto-restart:
   ```bash
   npm run dev
   ```

2. **Access the application**
   Open your browser and go to `http://localhost:3000`

3. **Upload files**
   - Upload your certificate template (image file)
   - Upload your Excel file with names in the first column
   - Click "Generate Certificates"

4. **Sign in with Google**
   - Click "Sign in with Google" to authenticate with your Google account
   - This allows the application to upload certificates to your Google Drive

5. **Download certificates**
   - After processing, certificates will be uploaded to your Google Drive
   - Click on the provided links to access your certificates

## Excel File Format

Create an Excel file with the following format:

| Name |
|------|
| John Doe |
| Jane Smith |
| Bob Johnson |

**Important Notes:**
- The first row should be a header (e.g., "Name")
- Names should be in the first column
- The application will skip the header row and process all names below it

## Certificate Template Requirements

- **Format**: PNG, JPG, or JPEG
- **Quality**: High resolution recommended (at least 1200x800 pixels)
- **Design**: Leave space in the center for the name to be printed
- **Text**: The name will be printed in black, bold Arial font, 48px size

## API Endpoints

- `GET /` - Main application page
- `POST /upload` - Upload certificate template and Excel file

## File Structure

```
certificate-system/
├── public/
│   ├── index.html          # Main application page
│   ├── styles.css          # Application styles
│   └── script.js           # Frontend JavaScript
├── uploads/                # Temporary upload directory
├── certificates/           # Temporary certificate directory
├── server.js              # Express.js server
├── package.json           # Dependencies and scripts
├── env.example            # Environment variables example
├── credentials.json       # Google Drive API credentials (not included)
└── README.md              # This file
```

## Configuration Options

### Environment Variables

- `PORT`: Server port (default: 3000)
- `GOOGLE_CLIENT_ID`: OAuth 2.0 Client ID from Google Cloud Console
- `GOOGLE_CLIENT_SECRET`: OAuth 2.0 Client Secret from Google Cloud Console
- `GOOGLE_REDIRECT_URI`: OAuth redirect URI (default: http://localhost:3000/auth/google/callback)
- `GOOGLE_DRIVE_FOLDER_ID`: Google Drive folder ID for uploads (optional)
- `SESSION_SECRET`: Secret key for session management
- `NODE_ENV`: Environment mode (development/production)

### Certificate Customization

You can customize the certificate generation by modifying the `generateCertificates` function in `server.js`:

- **Font**: Change `ctx.font` property
- **Color**: Modify `ctx.fillStyle` property
- **Position**: Adjust `x` and `y` coordinates
- **Size**: Modify font size in the font property

## Troubleshooting

### Common Issues

1. **Google Drive API Error**
   - Ensure your OAuth 2.0 credentials are properly configured in .env
   - Verify that Google Drive API is enabled in your Google Cloud project
   - Check that the redirect URI matches your OAuth client configuration
   - Make sure you're signed in with Google before uploading files

2. **File Upload Issues**
   - Ensure files are in the correct format
   - Check file size limits
   - Verify that both certificate template and Excel file are selected

3. **Excel File Not Processing**
   - Ensure names are in the first column
   - Check that the Excel file is not corrupted
   - Verify the file format (.xlsx or .xls)

### Error Messages

- **"Only image files are allowed for certificate template"**: Upload a valid image file
- **"Only Excel files are allowed"**: Upload a valid Excel file (.xlsx or .xls)
- **"No names found in Excel file"**: Check your Excel file format and ensure names are in the first column

## Security Considerations

- Keep your OAuth credentials secure and never commit them to version control
- Use environment variables for sensitive configuration
- Consider implementing user authentication for production use
- Regularly rotate your OAuth client secrets
- The application uses session-based authentication for Google Drive access

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please open an issue in the repository or contact the development team. 