#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🎨 Certificate Printing System Setup\n');

// Check if Node.js version is compatible
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 14) {
    console.error('❌ Error: Node.js version 14 or higher is required.');
    console.error(`Current version: ${nodeVersion}`);
    process.exit(1);
}

console.log('✅ Node.js version check passed');

// Check if package.json exists
if (!fs.existsSync('package.json')) {
    console.error('❌ Error: package.json not found. Please run this script from the project root directory.');
    process.exit(1);
}

// Check if dependencies are installed
if (!fs.existsSync('node_modules')) {
    console.log('📦 Installing dependencies...');
    const { execSync } = require('child_process');
    try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ Dependencies installed successfully');
    } catch (error) {
        console.error('❌ Error installing dependencies:', error.message);
        process.exit(1);
    }
} else {
    console.log('✅ Dependencies already installed');
}

// Check for .env file
if (!fs.existsSync('.env')) {
    console.log('\n📝 Creating .env file...');
    try {
        fs.copyFileSync('env.example', '.env');
        console.log('✅ .env file created from template');
    } catch (error) {
        console.error('❌ Error creating .env file:', error.message);
        process.exit(1);
    }
} else {
    console.log('✅ .env file already exists');
}

// Check for OAuth credentials
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasOAuthConfig = envContent.includes('GOOGLE_CLIENT_ID') && 
                          envContent.includes('GOOGLE_CLIENT_SECRET') &&
                          !envContent.includes('your_client_id_here');
    
    if (!hasOAuthConfig) {
        console.log('\n⚠️  Google OAuth 2.0 Setup Required');
        console.log('To use Google Drive integration, you need to:');
        console.log('1. Go to https://console.cloud.google.com/');
        console.log('2. Create a new project or select an existing one');
        console.log('3. Enable the Google Drive API');
        console.log('4. Go to "APIs & Services" > "Credentials"');
        console.log('5. Create an "OAuth 2.0 Client ID"');
        console.log('6. Set the redirect URI to: http://localhost:3000/auth/google/callback');
        console.log('7. Copy the Client ID and Client Secret to your .env file');
        console.log('\nFor now, the application will work without Google Drive integration.');
    } else {
        console.log('✅ Google OAuth credentials found');
    }
} else {
    console.log('\n⚠️  Google OAuth 2.0 Setup Required');
    console.log('Please configure your .env file with Google OAuth credentials.');
}

// Create necessary directories
const directories = ['uploads', 'certificates'];
directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
        console.log(`✅ Created ${dir} directory`);
    } else {
        console.log(`✅ ${dir} directory already exists`);
    }
});

console.log('\n🎉 Setup completed successfully!');
console.log('\nNext steps:');
console.log('1. If you want Google Drive integration, follow the setup instructions above');
console.log('2. Start the application with: npm start');
console.log('3. Open http://localhost:3000 in your browser');
console.log('\nFor more information, see README.md');

rl.close(); 