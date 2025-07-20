const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const { createCanvas, loadImage } = require('canvas');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
}));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const certificatesDir = path.join(__dirname, 'certificates');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(certificatesDir)) {
    fs.mkdirSync(certificatesDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.fieldname === 'certificateTemplate') {
            // Allow only image files for certificate template
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed for certificate template'));
            }
        } else if (file.fieldname === 'excelFile') {
            // Allow only Excel files
            if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                file.mimetype === 'application/vnd.ms-excel') {
                cb(null, true);
            } else {
                cb(new Error('Only Excel files are allowed'));
            }
        } else {
            cb(null, true);
        }
    }
});

// Separate multer instance for preview (only handles certificate template)
const previewUpload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.fieldname === 'certificateTemplate') {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Only image files are allowed for certificate template'));
            }
        } else {
            cb(new Error('Invalid file type for preview'));
        }
    }
});

// Google OAuth 2.0 setup
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
);

// Google Drive API setup
let drive = null;

function getDriveInstance() {
    if (!drive) {
        drive = google.drive({ version: 'v3', auth: oauth2Client });
    }
    return drive;
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Google OAuth routes
app.get('/auth/google', (req, res) => {
    const scopes = ['https://www.googleapis.com/auth/drive.file'];
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
    });
    res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
    try {
        const { code } = req.query;
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        
        // Store tokens in session
        req.session.tokens = tokens;
        
        res.redirect('/?auth=success');
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect('/?auth=error');
    }
});

app.get('/auth/status', (req, res) => {
    const isAuthenticated = !!(req.session.tokens && req.session.tokens.access_token);
    res.json({ authenticated: isAuthenticated });
});

app.get('/auth/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/?auth=logout');
});

// Test endpoint to check if server is working
app.get('/test', (req, res) => {
    res.json({ 
        status: 'Server is running',
        timestamp: new Date().toISOString(),
        uploadsDir: uploadsDir,
        certificatesDir: certificatesDir
    });
});

// Test endpoint for position settings
app.post('/test-position', (req, res) => {
    console.log('Test position request body:', req.body);
    res.json({
        received: req.body,
        parsed: {
            nameX: parseFloat(req.body.nameX || 50),
            nameY: parseFloat(req.body.nameY || 50),
            nameSize: parseInt(req.body.nameSize || 48),
            nameColor: req.body.nameColor || '#000000',
            nameFont: req.body.nameFont || 'Arial',
            nameStyle: req.body.nameStyle || 'normal',
            nameWeight: req.body.nameWeight || 'normal'
        }
    });
});

// Preview endpoint
app.post('/preview', previewUpload.single('certificateTemplate'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Certificate template is required' });
        }

        const templatePath = req.file.path;
        const nameX = parseFloat(req.body.nameX || 50);
        const nameY = parseFloat(req.body.nameY || 50);
        const nameSize = parseInt(req.body.nameSize || 48);
        const nameColor = req.body.nameColor || '#000000';
        const nameFont = req.body.nameFont || 'Arial';
        const nameStyle = req.body.nameStyle || 'normal';
        const nameWeight = req.body.nameWeight || 'normal';
        const previewName = req.body.previewName || 'Sample Name';

        console.log('Preview request:', {
            templatePath,
            nameX,
            nameY,
            nameSize,
            nameColor,
            previewName
        });

        // Generate preview certificate
        const previewPath = await generateCertificates(templatePath, [previewName], {
            x: nameX,
            y: nameY,
            size: nameSize,
            color: nameColor,
            font: nameFont,
            style: nameStyle,
            weight: nameWeight
        });

        console.log('Preview generated at:', previewPath[0]);

        // Set content type for image
        res.setHeader('Content-Type', 'image/png');
        
        // Send the preview image
        res.sendFile(previewPath[0], (err) => {
            if (err) {
                console.error('Error sending preview file:', err);
            }
            // Clean up the temporary files
            try {
                if (fs.existsSync(templatePath)) {
                    fs.unlinkSync(templatePath);
                }
                if (fs.existsSync(previewPath[0])) {
                    fs.unlinkSync(previewPath[0]);
                }
            } catch (cleanupError) {
                console.error('Error cleaning up preview files:', cleanupError);
            }
        });

    } catch (error) {
        console.error('Error generating preview:', error);
        res.status(500).json({ error: error.message });
    }
});

// Upload certificate template and Excel file
app.post('/upload', upload.fields([
    { name: 'certificateTemplate', maxCount: 1 },
    { name: 'excelFile', maxCount: 1 }
]), async (req, res) => {
    try {
        if (!req.files.certificateTemplate || !req.files.excelFile) {
            return res.status(400).json({ error: 'Both certificate template and Excel file are required' });
        }

        const templatePath = req.files.certificateTemplate[0].path;
        const excelPath = req.files.excelFile[0].path;

        // Read Excel file
        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const names = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Extract names from first column (skip header if exists)
        const certificateNames = names.slice(1).map(row => row[0]).filter(name => name);

        if (certificateNames.length === 0) {
            return res.status(400).json({ error: 'No names found in Excel file' });
        }

        // Get position settings from form data
        console.log('Form body:', req.body);
        console.log('Form files:', req.files);
        
        const nameX = parseFloat(req.body.nameX || 50);
        const nameY = parseFloat(req.body.nameY || 50);
        const nameSize = parseInt(req.body.nameSize || 48);
        const nameColor = req.body.nameColor || '#000000';
        const nameFont = req.body.nameFont || 'Arial';
        const nameStyle = req.body.nameStyle || 'normal';
        const nameWeight = req.body.nameWeight || 'normal';
        
        console.log('Position settings:', { nameX, nameY, nameSize, nameColor, nameFont, nameStyle, nameWeight });

        // Generate certificates
        console.log('Generating certificates with settings:', { nameX, nameY, nameSize, nameColor, nameFont, nameStyle, nameWeight });
        const generatedCertificates = await generateCertificates(templatePath, certificateNames, {
            x: nameX,
            y: nameY,
            size: nameSize,
            color: nameColor,
            font: nameFont,
            style: nameStyle,
            weight: nameWeight
        });

        // Check if user is authenticated
        if (!req.session.tokens || !req.session.tokens.access_token) {
            return res.status(401).json({ 
                error: 'Google Drive authentication required. Please sign in with Google first.',
                requiresAuth: true 
            });
        }

        // Set credentials from session
        oauth2Client.setCredentials(req.session.tokens);

        // Upload to Google Drive
        const uploadedFiles = await uploadToGoogleDrive(generatedCertificates);

        // Clean up temporary files
        fs.unlinkSync(templatePath);
        fs.unlinkSync(excelPath);
        generatedCertificates.forEach(certPath => {
            if (fs.existsSync(certPath)) {
                fs.unlinkSync(certPath);
            }
        });

        res.json({
            success: true,
            message: `${certificateNames.length} certificates generated and uploaded to Google Drive`,
            uploadedFiles: uploadedFiles
        });

    } catch (error) {
        console.error('Error processing upload:', error);
        res.status(500).json({ error: error.message });
    }
});

// Generate certificates with names
async function generateCertificates(templatePath, names, positionSettings = {}) {
    const generatedPaths = [];
    
    // Default position settings
    const settings = {
        x: 50, // percentage from left
        y: 50, // percentage from top
        size: 48, // font size in pixels
        color: '#000000', // text color
        font: 'Arial', // font family
        style: 'normal', // font style
        weight: 'normal', // font weight
        ...positionSettings
    };
    
    try {
        console.log('Loading template from:', templatePath);
        const template = await loadImage(templatePath);
        console.log('Template loaded, dimensions:', template.width, 'x', template.height);
        
        for (let i = 0; i < names.length; i++) {
            const name = names[i];
            console.log('Generating certificate for:', name);
            
            const canvas = createCanvas(template.width, template.height);
            const ctx = canvas.getContext('2d');
            
            // Draw the template
            ctx.drawImage(template, 0, 0);
            
            // Configure text style for the name
            let fontString = '';
            if (settings.style !== 'normal') fontString += settings.style + ' ';
            if (settings.weight !== 'normal') fontString += settings.weight + ' ';
            fontString += `${settings.size}px ${settings.font}`;
            
            ctx.font = fontString;
            ctx.fillStyle = settings.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Calculate position for the name based on percentage
            const x = (canvas.width * settings.x) / 100;
            const y = (canvas.height * settings.y) / 100;
            
            console.log('Text position:', { x, y, settings });
            
            // Add the name to the certificate
            ctx.fillText(name, x, y);
            
            // Save the certificate
            const outputPath = path.join(certificatesDir, `certificate_${name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`);
            const buffer = canvas.toBuffer('image/png');
            fs.writeFileSync(outputPath, buffer);
            
            console.log('Certificate saved to:', outputPath);
            generatedPaths.push(outputPath);
        }
        
        return generatedPaths;
    } catch (error) {
        console.error('Error generating certificates:', error);
        throw error;
    }
}

// Upload files to Google Drive
async function uploadToGoogleDrive(filePaths) {
    const uploadedFiles = [];
    
    try {
        const driveInstance = getDriveInstance();
        
        for (const filePath of filePaths) {
            const fileName = path.basename(filePath);
            
            const fileMetadata = {
                name: fileName,
                parents: [process.env.GOOGLE_DRIVE_FOLDER_ID || 'root']
            };
            
            const media = {
                mimeType: 'image/png',
                body: fs.createReadStream(filePath)
            };
            
            const file = await driveInstance.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id,name,webViewLink'
            });
            
            uploadedFiles.push({
                id: file.data.id,
                name: file.data.name,
                link: file.data.webViewLink
            });
        }
        
        return uploadedFiles;
    } catch (error) {
        console.error('Error uploading to Google Drive:', error);
        throw error;
    }
}

// Error handling middleware
app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ error: error.message });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 