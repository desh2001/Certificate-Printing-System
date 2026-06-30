const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const { createCanvas, loadImage } = require('canvas');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const session = require('express-session');
const nodemailer = require('nodemailer');
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

// Nodemailer SMTP Transporter helper
function getMailTransporter() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        return null;
    }
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
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

        const teamX = parseFloat(req.body.teamX || 50);
        const teamY = parseFloat(req.body.teamY || 60);
        const teamSize = parseInt(req.body.teamSize || 36);
        const teamColor = req.body.teamColor || '#7c3aed';
        const teamFont = req.body.teamFont || 'Arial';
        const teamStyle = req.body.teamStyle || 'normal';
        const teamWeight = req.body.teamWeight || 'normal';
        const previewTeam = req.body.previewTeam || 'Sample Team';

        console.log('Preview request:', {
            templatePath,
            nameX,
            nameY,
            nameSize,
            nameColor,
            previewName,
            teamX,
            teamY,
            teamSize,
            teamColor,
            previewTeam
        });

        // Generate preview certificate
        const previewPath = await generateCertificates(templatePath, [{ name: previewName, team: previewTeam }], {
            nameX,
            nameY,
            nameSize,
            nameColor,
            nameFont,
            nameStyle,
            nameWeight,
            teamX,
            teamY,
            teamSize,
            teamColor,
            teamFont,
            teamStyle,
            teamWeight
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
    let templatePath = null;
    let excelPath = null;
    let generatedCertificates = [];

    try {
        if (!req.files.certificateTemplate || !req.files.excelFile) {
            return res.status(400).json({ error: 'Both certificate template and Excel file are required' });
        }

        templatePath = req.files.certificateTemplate[0].path;
        excelPath = req.files.excelFile[0].path;

        // Read Excel file
        const workbook = XLSX.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Extract recipients (Name from first column, Email from second column, Team from third column, skip header)
        const recipients = rows.slice(1).map(row => {
            const name = row[0] ? row[0].toString().trim() : '';
            const email = row[1] ? row[1].toString().trim() : '';
            const team = row[2] ? row[2].toString().trim() : '';
            return { name, email, team };
        }).filter(recipient => recipient.name);

        if (recipients.length === 0) {
            return res.status(400).json({ error: 'No names found in Excel file' });
        }

        // Get email settings from request
        const sendEmails = req.body.sendEmails === 'true';
        const emailSubject = req.body.emailSubject || 'Your Certificate';
        const emailBody = req.body.emailBody || 'Dear {name},\n\nPlease find your certificate attached.';

        let transporter = null;
        if (sendEmails) {
            transporter = getMailTransporter();
            if (!transporter) {
                // Clean up before returning error
                if (fs.existsSync(templatePath)) fs.unlinkSync(templatePath);
                if (fs.existsSync(excelPath)) fs.unlinkSync(excelPath);
                return res.status(400).json({
                    error: 'Email sending is enabled, but SMTP is not configured in the server\'s .env file. Please configure SMTP_HOST, SMTP_USER, and SMTP_PASS.'
                });
            }
        }

        // Get position settings from form data
        console.log('Form body:', req.body);
        
        const nameX = parseFloat(req.body.nameX || 50);
        const nameY = parseFloat(req.body.nameY || 50);
        const nameSize = parseInt(req.body.nameSize || 48);
        const nameColor = req.body.nameColor || '#000000';
        const nameFont = req.body.nameFont || 'Arial';
        const nameStyle = req.body.nameStyle || 'normal';
        const nameWeight = req.body.nameWeight || 'normal';

        const teamX = parseFloat(req.body.teamX || 50);
        const teamY = parseFloat(req.body.teamY || 60);
        const teamSize = parseInt(req.body.teamSize || 36);
        const teamColor = req.body.teamColor || '#7c3aed';
        const teamFont = req.body.teamFont || 'Arial';
        const teamStyle = req.body.teamStyle || 'normal';
        const teamWeight = req.body.teamWeight || 'normal';

        // Check if user is authenticated with Google Drive
        if (!req.session.tokens || !req.session.tokens.access_token) {
            // Clean up before returning error
            if (fs.existsSync(templatePath)) fs.unlinkSync(templatePath);
            if (fs.existsSync(excelPath)) fs.unlinkSync(excelPath);
            return res.status(401).json({ 
                error: 'Google Drive authentication required. Please sign in with Google first.',
                requiresAuth: true 
            });
        }

        // Generate certificates
        console.log('Generating certificates with settings:', { nameX, nameY, nameSize, nameColor, nameFont, nameStyle, nameWeight, teamX, teamY, teamSize, teamColor, teamFont, teamStyle, teamWeight });
        generatedCertificates = await generateCertificates(templatePath, recipients, {
            nameX,
            nameY,
            nameSize,
            nameColor,
            nameFont,
            nameStyle,
            nameWeight,
            teamX,
            teamY,
            teamSize,
            teamColor,
            teamFont,
            teamStyle,
            teamWeight
        });

        // Set credentials from session and upload to Google Drive
        oauth2Client.setCredentials(req.session.tokens);
        const uploadedFiles = await uploadToGoogleDrive(generatedCertificates);

        // Process email sending and build recipient results
        const recipientResults = [];
        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];
            const certPath = generatedCertificates[i];
            const driveFile = uploadedFiles[i];
            
            let emailStatus = 'Skipped (Email disabled)';
            
            if (sendEmails) {
                if (!recipient.email) {
                    emailStatus = 'Skipped (No email address)';
                } else {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(recipient.email)) {
                        emailStatus = 'Failed (Invalid email format)';
                    } else {
                        try {
                            const subject = emailSubject.replace(/{name}/g, recipient.name).replace(/{team}/g, recipient.team || '');
                            const text = emailBody.replace(/{name}/g, recipient.name).replace(/{team}/g, recipient.team || '');
                            
                            const mailOptions = {
                                from: process.env.EMAIL_FROM || process.env.SMTP_USER,
                                to: recipient.email,
                                subject: subject,
                                text: text,
                                attachments: [
                                    {
                                        filename: path.basename(certPath),
                                        path: certPath
                                    }
                                ]
                            };
                            
                            await transporter.sendMail(mailOptions);
                            emailStatus = 'Sent';
                        } catch (emailError) {
                            console.error(`Failed to send email to ${recipient.email}:`, emailError);
                            emailStatus = `Failed (${emailError.message})`;
                        }
                    }
                }
            }
            
            recipientResults.push({
                name: recipient.name,
                email: recipient.email || 'N/A',
                team: recipient.team || 'N/A',
                driveLink: driveFile ? driveFile.link : '#',
                driveFileId: driveFile ? driveFile.id : null,
                emailStatus: emailStatus
            });
        }

        // Clean up temporary files
        if (fs.existsSync(templatePath)) fs.unlinkSync(templatePath);
        if (fs.existsSync(excelPath)) fs.unlinkSync(excelPath);
        generatedCertificates.forEach(certPath => {
            if (fs.existsSync(certPath)) {
                fs.unlinkSync(certPath);
            }
        });

        res.json({
            success: true,
            message: `${recipients.length} certificates generated, uploaded to Google Drive${sendEmails ? ' and processed for emailing' : ''}`,
            uploadedFiles: uploadedFiles,
            recipientResults: recipientResults
        });

    } catch (error) {
        console.error('Error processing upload:', error);
        // Clean up files on error
        try {
            if (templatePath && fs.existsSync(templatePath)) fs.unlinkSync(templatePath);
            if (excelPath && fs.existsSync(excelPath)) fs.unlinkSync(excelPath);
            generatedCertificates.forEach(certPath => {
                if (fs.existsSync(certPath)) fs.unlinkSync(certPath);
            });
        } catch (cleanupError) {
            console.error('Error cleaning up files on upload error:', cleanupError);
        }
        res.status(500).json({ error: error.message });
    }
});

// Generate certificates with names and teams
async function generateCertificates(templatePath, recipients, positionSettings = {}) {
    const generatedPaths = [];
    
    // Default position settings with backward compatibility fallbacks
    const settings = {
        nameX: positionSettings.x !== undefined ? positionSettings.x : (positionSettings.nameX || 50),
        nameY: positionSettings.y !== undefined ? positionSettings.y : (positionSettings.nameY || 50),
        nameSize: positionSettings.size !== undefined ? positionSettings.size : (positionSettings.nameSize || 48),
        nameColor: positionSettings.color !== undefined ? positionSettings.color : (positionSettings.nameColor || '#000000'),
        nameFont: positionSettings.font !== undefined ? positionSettings.font : (positionSettings.nameFont || 'Arial'),
        nameStyle: positionSettings.style !== undefined ? positionSettings.style : (positionSettings.nameStyle || 'normal'),
        nameWeight: positionSettings.weight !== undefined ? positionSettings.weight : (positionSettings.nameWeight || 'normal'),
        
        teamX: positionSettings.teamX || 50,
        teamY: positionSettings.teamY || 60,
        teamSize: positionSettings.teamSize || 36,
        teamColor: positionSettings.teamColor || '#7c3aed',
        teamFont: positionSettings.teamFont || 'Arial',
        teamStyle: positionSettings.teamStyle || 'normal',
        teamWeight: positionSettings.teamWeight || 'normal',
        
        ...positionSettings
    };
    
    try {
        console.log('Loading template from:', templatePath);
        const template = await loadImage(templatePath);
        console.log('Template loaded, dimensions:', template.width, 'x', template.height);
        
        for (let i = 0; i < recipients.length; i++) {
            const item = recipients[i];
            const name = typeof item === 'object' ? (item.name || '') : item;
            const team = typeof item === 'object' ? (item.team || '') : '';
            console.log(`Generating certificate for name="${name}", team="${team}"`);
            
            const canvas = createCanvas(template.width, template.height);
            const ctx = canvas.getContext('2d');
            
            // Draw the template
            ctx.drawImage(template, 0, 0);
            
            // 1. Draw Name
            const nameFontFamily = settings.nameFont.includes(' ')
                ? `"${settings.nameFont}"`
                : settings.nameFont;

            let nameFontString = '';
            if (settings.nameStyle !== 'normal') nameFontString += settings.nameStyle + ' ';
            if (settings.nameWeight !== 'normal') nameFontString += settings.nameWeight + ' ';
            nameFontString += `${settings.nameSize}px ${nameFontFamily}`;
            
            ctx.font = nameFontString;
            ctx.fillStyle = settings.nameColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const nx = (canvas.width * settings.nameX) / 100;
            const ny = (canvas.height * settings.nameY) / 100;
            
            ctx.fillText(name, nx, ny);

            // 2. Draw Team (only if present)
            if (team) {
                const teamFontFamily = settings.teamFont.includes(' ')
                    ? `"${settings.teamFont}"`
                    : settings.teamFont;

                let teamFontString = '';
                if (settings.teamStyle !== 'normal') teamFontString += settings.teamStyle + ' ';
                if (settings.teamWeight !== 'normal') teamFontString += settings.teamWeight + ' ';
                teamFontString += `${settings.teamSize}px ${teamFontFamily}`;
                
                ctx.font = teamFontString;
                ctx.fillStyle = settings.teamColor;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                const tx = (canvas.width * settings.teamX) / 100;
                const ty = (canvas.height * settings.teamY) / 100;
                
                ctx.fillText(team, tx, ty);
            }
            
            // Save the certificate
            const safeName = name ? name.replace(/[^a-zA-Z0-9]/g, '_') : 'recipient';
            const outputPath = path.join(certificatesDir, `certificate_${safeName}_${Date.now()}.png`);
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