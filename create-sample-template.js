const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create a sample certificate template
function createSampleTemplate() {
    const width = 1200;
    const height = 800;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f8f9fa');
    gradient.addColorStop(1, '#e9ecef');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Border
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Inner border
    ctx.strokeStyle = '#764ba2';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 40, width - 80, height - 80);

    // Title
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFICATE OF COMPLETION', width / 2, 120);

    // Subtitle
    ctx.font = '24px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText('This is to certify that', width / 2, 180);

    // Name placeholder (will be replaced during generation)
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#667eea';
    ctx.fillText('[NAME WILL BE INSERTED HERE]', width / 2, height / 2);

    // Additional text
    ctx.font = '20px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText('has successfully completed the course', width / 2, height / 2 + 60);
    ctx.fillText('and demonstrated proficiency in the subject matter.', width / 2, height / 2 + 90);

    // Date
    ctx.font = '18px Arial';
    ctx.fillText('Date: ' + new Date().toLocaleDateString(), width / 2, height - 120);

    // Signature line
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 100, height - 80);
    ctx.lineTo(width / 2 + 100, height - 80);
    ctx.stroke();

    ctx.font = '16px Arial';
    ctx.fillStyle = '#666';
    ctx.fillText('Authorized Signature', width / 2, height - 60);

    // Decorative elements
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    
    // Top left corner decoration
    ctx.beginPath();
    ctx.moveTo(60, 60);
    ctx.lineTo(120, 60);
    ctx.moveTo(60, 60);
    ctx.lineTo(60, 120);
    ctx.stroke();

    // Top right corner decoration
    ctx.beginPath();
    ctx.moveTo(width - 60, 60);
    ctx.lineTo(width - 120, 60);
    ctx.moveTo(width - 60, 60);
    ctx.lineTo(width - 60, 120);
    ctx.stroke();

    // Bottom left corner decoration
    ctx.beginPath();
    ctx.moveTo(60, height - 60);
    ctx.lineTo(120, height - 60);
    ctx.moveTo(60, height - 60);
    ctx.lineTo(60, height - 120);
    ctx.stroke();

    // Bottom right corner decoration
    ctx.beginPath();
    ctx.moveTo(width - 60, height - 60);
    ctx.lineTo(width - 120, height - 60);
    ctx.moveTo(width - 60, height - 60);
    ctx.lineTo(width - 60, height - 120);
    ctx.stroke();

    // Save the template
    const outputPath = path.join(__dirname, 'sample-certificate-template.png');
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    console.log('✅ Sample certificate template created: sample-certificate-template.png');
    console.log('📏 Dimensions: 1200x800 pixels');
    console.log('🎨 Design includes: gradient background, borders, title, and placeholder for name');
}

// Run the function
createSampleTemplate(); 