document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    const certificateTemplateInput = document.getElementById('certificateTemplate');
    const excelFileInput = document.getElementById('excelFile');
    const templatePreview = document.getElementById('templatePreview');
    const excelPreview = document.getElementById('excelPreview');
    const generateBtn = document.getElementById('generateBtn');
    const resetBtn = document.getElementById('resetBtn');
    const progressSection = document.getElementById('progressSection');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const resultsSection = document.getElementById('resultsSection');
    const resultsMessage = document.getElementById('resultsMessage');
    const uploadedFiles = document.getElementById('uploadedFiles');
    const errorSection = document.getElementById('errorSection');
    const errorMessage = document.getElementById('errorMessage');
    const authSection = document.getElementById('authSection');
    const authStatus = document.getElementById('authStatus');
    const loginBtn = document.getElementById('loginBtn');
    
    // Email settings elements
    const sendEmailsCheckbox = document.getElementById('sendEmails');
    const emailFieldsContainer = document.getElementById('emailFields');
    const emailSubjectInput = document.getElementById('emailSubject');
    const emailBodyInput = document.getElementById('emailBody');
    const resultsTableBody = document.getElementById('resultsTableBody');

    // Position controls
    const nameX = document.getElementById('nameX');
    const nameY = document.getElementById('nameY');
    const nameSize = document.getElementById('nameSize');
    const nameColor = document.getElementById('nameColor');
    const nameFont = document.getElementById('nameFont');
    const nameStyle = document.getElementById('nameStyle');
    const nameWeight = document.getElementById('nameWeight');
    const nameXValue = document.getElementById('nameXValue');
    const nameYValue = document.getElementById('nameYValue');
    const nameSizeValue = document.getElementById('nameSizeValue');

    const teamX = document.getElementById('teamX');
    const teamY = document.getElementById('teamY');
    const teamSize = document.getElementById('teamSize');
    const teamColor = document.getElementById('teamColor');
    const teamFont = document.getElementById('teamFont');
    const teamStyle = document.getElementById('teamStyle');
    const teamWeight = document.getElementById('teamWeight');
    const teamXValue = document.getElementById('teamXValue');
    const teamYValue = document.getElementById('teamYValue');
    const teamSizeValue = document.getElementById('teamSizeValue');

    // Canvas preview elements
    const certificateCanvas = document.getElementById('certificateCanvas');
    const canvasCtx = certificateCanvas.getContext('2d');
    const canvasPlaceholder = document.getElementById('canvasPlaceholder');
    let templateImage = null;

    // Check authentication status on page load
    checkAuthStatus();

    // Handle URL parameters for auth feedback
    const urlParams = new URLSearchParams(window.location.search);
    const authParam = urlParams.get('auth');
    if (authParam === 'success') showAuthSuccess();
    else if (authParam === 'error')  showAuthError();
    else if (authParam === 'logout') showAuthLogout();

    // Google login button (re-bound after DOM update)
    document.getElementById('loginBtn').addEventListener('click', () => {
        window.location.href = '/auth/google';
    });

    // Position / style control listeners
    nameX.addEventListener('input', updateNamePreview);
    nameY.addEventListener('input', updateNamePreview);
    nameSize.addEventListener('input', updateNamePreview);
    nameColor.addEventListener('input', updateNamePreview);
    nameFont.addEventListener('change', updateNamePreview);
    nameStyle.addEventListener('change', updateNamePreview);
    nameWeight.addEventListener('change', updateNamePreview);

    teamX.addEventListener('input', updateNamePreview);
    teamY.addEventListener('input', updateNamePreview);
    teamSize.addEventListener('input', updateNamePreview);
    teamColor.addEventListener('input', updateNamePreview);
    teamFont.addEventListener('change', updateNamePreview);
    teamStyle.addEventListener('change', updateNamePreview);
    teamWeight.addEventListener('change', updateNamePreview);

    // Color preset dots - Name
    document.querySelectorAll('.color-dot-name').forEach(dot => {
        dot.addEventListener('click', () => {
            nameColor.value = dot.dataset.color;
            document.querySelectorAll('.color-dot-name').forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            updateNamePreview();
        });
    });

    // Color preset dots - Team
    document.querySelectorAll('.color-dot-team').forEach(dot => {
        dot.addEventListener('click', () => {
            teamColor.value = dot.dataset.color;
            document.querySelectorAll('.color-dot-team').forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            updateNamePreview();
        });
    });

    // Tab switcher logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active-tab-content'));
            
            btn.classList.add('active');
            const targetEl = document.getElementById(targetId);
            if (targetEl) targetEl.classList.add('active-tab-content');
        });
    });

    // Canvas action buttons
    document.getElementById('previewOnTemplate').addEventListener('click', previewOnTemplate);
    document.getElementById('resetPosition').addEventListener('click', resetPosition);
    document.getElementById('testPreview').addEventListener('click', testPreview);

    // Drag-over styles for dropzones
    ['templateDropzone','excelDropzone'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('drag-over'); });
        el.addEventListener('dragleave',  () => el.classList.remove('drag-over'));
        el.addEventListener('drop', e => {
            e.preventDefault();
            el.classList.remove('drag-over');
            const input = el.nextElementSibling; // the hidden <input type="file">
            if (input && e.dataTransfer.files.length) {
                const dt = new DataTransfer();
                dt.items.add(e.dataTransfer.files[0]);
                input.files = dt.files;
                input.dispatchEvent(new Event('change'));
            }
        });
    });

    // Load default template on start
    loadDefaultTemplate();

    // Initialize preview labels
    updateNamePreview();

    // Email settings toggle
    sendEmailsCheckbox.addEventListener('change', function() {
        emailFieldsContainer.style.display = this.checked ? 'flex' : 'none';
    });

    // File preview handlers
    certificateTemplateInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            showFilePreview(templatePreview, file, true);

            // Load the image into memory for canvas redraws
            const objectUrl = URL.createObjectURL(file);
            const img = new Image();
            img.onload = function() {
                templateImage = img;
                // Size canvas to full image resolution for pixel-perfect output
                certificateCanvas.width  = img.naturalWidth;
                certificateCanvas.height = img.naturalHeight;
                // Show canvas, hide placeholder
                certificateCanvas.style.display = 'block';
                canvasPlaceholder.style.display  = 'none';
                document.getElementById('previewHint').textContent =
                    `${img.naturalWidth} × ${img.naturalHeight}px — drag sliders to position`;
                drawCanvasPreview();
            };
            img.src = objectUrl;
        }
    });

    excelFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            showFilePreview(excelPreview, file, false);
        }
    });

    // Form submission
    uploadForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData();
        let certificateFile = certificateTemplateInput.files[0];
        const excelFile = excelFileInput.files[0];

        if (!certificateFile && templateImage) {
            // Fetch the default template image and convert to File
            try {
                const response = await fetch('printable-certificates-without-borders-3.jpg');
                const blob = await response.blob();
                certificateFile = new File([blob], 'printable-certificates-without-borders-3.jpg', { type: 'image/jpeg' });
            } catch (err) {
                console.error('Failed to load default template file:', err);
            }
        }

        if (!certificateFile || !excelFile) {
            showError('Please select both certificate template and Excel file.');
            return;
        }

        formData.append('certificateTemplate', certificateFile);
        formData.append('excelFile', excelFile);
        
        // Add position settings to form data
        formData.append('nameX', nameX.value);
        formData.append('nameY', nameY.value);
        formData.append('nameSize', nameSize.value);
        formData.append('nameColor', nameColor.value);
        formData.append('nameFont', nameFont.value);
        formData.append('nameStyle', nameStyle.value);
        formData.append('nameWeight', nameWeight.value);

        formData.append('teamX', teamX.value);
        formData.append('teamY', teamY.value);
        formData.append('teamSize', teamSize.value);
        formData.append('teamColor', teamColor.value);
        formData.append('teamFont', teamFont.value);
        formData.append('teamStyle', teamStyle.value);
        formData.append('teamWeight', teamWeight.value);

        // Add email settings to form data
        formData.append('sendEmails', sendEmailsCheckbox.checked);
        formData.append('emailSubject', emailSubjectInput.value);
        formData.append('emailBody', emailBodyInput.value);

        // Show progress and disable form
        showProgress();
        disableForm();

        try {
            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (response.ok) {
                showResults(result);
            } else {
                const errorMessage = result.error || 'An error occurred while processing the files.';
                showError(errorMessage, result.requiresAuth);
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Network error. Please check your connection and try again.');
        } finally {
            hideProgress();
            enableForm();
        }
    });

    // Authentication functions
    async function checkAuthStatus() {
        try {
            const response = await fetch('/auth/status');
            const data = await response.json();
            
            if (data.authenticated) {
                showAuthenticated();
            } else {
                showNotAuthenticated();
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            showNotAuthenticated();
        }
    }

    function showAuthenticated() {
        authStatus.innerHTML = `
            <span class="auth-text auth-success">Connected to Google Drive</span>
            <button class="btn btn-google connected" onclick="window.location.href='/auth/logout'">
                <i class="fas fa-sign-out-alt"></i>
                Sign Out
            </button>
        `;
    }

    function showNotAuthenticated() {
        authStatus.innerHTML = `
            <span class="auth-text">Not connected to Google Drive</span>
            <button id="loginBtn" class="btn btn-google">
                <i class="fab fa-google"></i>
                Sign in with Google
            </button>
        `;
        
        // Re-attach event listener
        document.getElementById('loginBtn').addEventListener('click', function() {
            window.location.href = '/auth/google';
        });
    }

    function showAuthSuccess() {
        const authText = document.querySelector('.auth-text');
        if (authText) {
            authText.textContent = 'Successfully connected to Google Drive!';
            authText.className = 'auth-text auth-success';
        }
        checkAuthStatus();
    }

    function showAuthError() {
        const authText = document.querySelector('.auth-text');
        if (authText) {
            authText.textContent = 'Failed to connect to Google Drive';
            authText.className = 'auth-text auth-error';
        }
    }

    function showAuthLogout() {
        const authText = document.querySelector('.auth-text');
        if (authText) {
            authText.textContent = 'Signed out from Google Drive';
            authText.className = 'auth-text';
        }
        checkAuthStatus();
    }

    // ── Core canvas renderer ──────────────────────────────────────────────────
    // Mirrors server-side generateCertificates() exactly.
    // IMPORTANT: we do NOT use save()/restore() here — those preserve stale
    // font state across redraws and cause the canvas to silently ignore the
    // new font assignment.  Instead we reset every property we touch
    // explicitly at the start of every frame.
    function drawCanvasPreview() {
        if (!templateImage) return;

        const W = certificateCanvas.width;
        const H = certificateCanvas.height;

        // ── Step 1: Reset ALL canvas text/shadow state before drawing ─────────
        canvasCtx.shadowColor   = 'transparent';
        canvasCtx.shadowBlur    = 0;
        canvasCtx.shadowOffsetX = 0;
        canvasCtx.shadowOffsetY = 0;
        canvasCtx.globalAlpha   = 1;
        canvasCtx.globalCompositeOperation = 'source-over';

        // ── Step 2: Draw certificate template background ──────────────────────
        canvasCtx.clearRect(0, 0, W, H);
        canvasCtx.drawImage(templateImage, 0, 0);

        // ── Step 3: Draw Member Name ──────────────────────────────────────────
        const sizePx   = Math.max(8, parseInt(nameSize.value)  || 48);
        const style    = nameStyle.value  || 'normal';
        const weight   = nameWeight.value || 'normal';
        const fontName = nameFont.value   || 'Arial';
        const color    = nameColor.value  || '#000000';

        const quotedFamily = fontName.includes(' ') ? `"${fontName}"` : fontName;

        const fontParts = [];
        if (style  !== 'normal') fontParts.push(style);
        if (weight !== 'normal') fontParts.push(weight);
        fontParts.push(`${sizePx}px`);
        fontParts.push(quotedFamily);
        const cssFont = fontParts.join(' ');

        canvasCtx.textAlign    = 'center';
        canvasCtx.textBaseline = 'middle';
        canvasCtx.font         = cssFont;

        const dark = isColorDark(color);
        canvasCtx.shadowColor   = dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.35)';
        canvasCtx.shadowBlur    = Math.max(2, sizePx * 0.04);
        canvasCtx.shadowOffsetX = 0;
        canvasCtx.shadowOffsetY = 0;

        const px = (W * parseFloat(nameX.value)) / 100;
        const py = (H * parseFloat(nameY.value)) / 100;
        canvasCtx.fillStyle = color;
        canvasCtx.fillText('Sample Name', px, py);

        // Clear shadow before drawing team layer
        canvasCtx.shadowColor = 'transparent';
        canvasCtx.shadowBlur  = 0;

        // ── Step 4: Draw Team Name ──────────────────────────────────────────
        const teamSizePx   = Math.max(8, parseInt(teamSize.value)  || 36);
        const teamStyleVal = teamStyle.value  || 'normal';
        const teamWeightVal= teamWeight.value || 'normal';
        const teamFontName = teamFont.value   || 'Arial';
        const teamColorVal = teamColor.value  || '#7c3aed';

        const quotedTeamFamily = teamFontName.includes(' ') ? `"${teamFontName}"` : teamFontName;

        const teamFontParts = [];
        if (teamStyleVal  !== 'normal') teamFontParts.push(teamStyleVal);
        if (teamWeightVal !== 'normal') teamFontParts.push(teamWeightVal);
        teamFontParts.push(`${teamSizePx}px`);
        teamFontParts.push(quotedTeamFamily);
        const cssTeamFont = teamFontParts.join(' ');

        canvasCtx.font = cssTeamFont;

        const teamDark = isColorDark(teamColorVal);
        canvasCtx.shadowColor   = teamDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.35)';
        canvasCtx.shadowBlur    = Math.max(2, teamSizePx * 0.04);

        const tx = (W * parseFloat(teamX.value)) / 100;
        const ty = (H * parseFloat(teamY.value)) / 100;
        canvasCtx.fillStyle = teamColorVal;
        canvasCtx.fillText('Sample Team', tx, ty);

        // Clear shadow
        canvasCtx.shadowColor = 'transparent';
        canvasCtx.shadowBlur  = 0;
    }

    // Returns true when a hex color is perceived as dark (WCAG relative luminance < 0.5)
    function isColorDark(hex) {
        const clean = hex.replace('#', '');
        const r = parseInt(clean.substring(0, 2), 16) / 255;
        const g = parseInt(clean.substring(2, 4), 16) / 255;
        const b = parseInt(clean.substring(4, 6), 16) / 255;
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        return luminance < 0.5;
    }

    // Update name preview — update labels + redraw canvas
    function updateNamePreview() {
        const x      = nameX.value;
        const y      = nameY.value;
        const size   = nameSize.value;
        const color  = nameColor.value;

        const tx     = teamX.value;
        const ty     = teamY.value;
        const tsize  = teamSize.value;
        const tcolor = teamColor.value;

        // Update display values
        nameXValue.textContent = x + '%';
        nameYValue.textContent = y + '%';
        nameSizeValue.textContent = size + 'px';

        teamXValue.textContent = tx + '%';
        teamYValue.textContent = ty + '%';
        teamSizeValue.textContent = tsize + 'px';

        // Update current-settings readout
        document.getElementById('currentX').textContent      = x + '%';
        document.getElementById('currentY').textContent      = y + '%';
        document.getElementById('currentSize').textContent   = size + 'px';
        document.getElementById('currentColor').textContent  = color;

        document.getElementById('currentTeamX').textContent      = tx + '%';
        document.getElementById('currentTeamY').textContent      = ty + '%';
        document.getElementById('currentTeamSize').textContent   = tsize + 'px';
        document.getElementById('currentTeamColor').textContent  = tcolor;

        // Sync the color hex display and swatch pill
        const colorHexEl   = document.getElementById('colorHex');
        const colorSwatchEl = document.getElementById('colorSwatch');
        if (colorHexEl)   colorHexEl.textContent = color;
        if (colorSwatchEl) colorSwatchEl.style.background = color;

        const teamColorHexEl   = document.getElementById('teamColorHex');
        const teamColorSwatchEl = document.getElementById('teamColorSwatch');
        if (teamColorHexEl)   teamColorHexEl.textContent = tcolor;
        if (teamColorSwatchEl) teamColorSwatchEl.style.background = tcolor;

        // Re-render canvas with new settings
        drawCanvasPreview();
    }

    // "Open Full Size" — export the canvas as PNG and open it in a new tab
    function previewOnTemplate() {
        if (!templateImage) {
            showError('Please upload a certificate template first.');
            return;
        }
        // The canvas already holds the current render; export it
        certificateCanvas.toBlob(function(blob) {
            const url = URL.createObjectURL(blob);
            const win = window.open(url, '_blank');
            if (win) win.document.title = 'Certificate Preview';
        }, 'image/png');
    }

    // Reset position to default values
    function resetPosition() {
        nameX.value = 50;
        nameY.value = 50;
        nameSize.value = 48;
        nameColor.value = '#000000';
        nameFont.value = 'Arial';
        nameStyle.value = 'normal';
        nameWeight.value = 'normal';

        teamX.value = 50;
        teamY.value = 60;
        teamSize.value = 36;
        teamColor.value = '#7c3aed';
        teamFont.value = 'Times New Roman';
        teamStyle.value = 'italic';
        teamWeight.value = 'normal';

        updateNamePreview();
    }

    // Test preview functionality
    function testPreview() {
        console.log('Testing preview functionality...');
        
        // Test server connection
        fetch('/test')
            .then(response => response.json())
            .then(data => {
                console.log('Server test response:', data);
                
                // Test position settings
                const testData = new FormData();
                testData.append('nameX', nameX.value);
                testData.append('nameY', nameY.value);
                testData.append('nameSize', nameSize.value);
                testData.append('nameColor', nameColor.value);
                testData.append('nameFont', nameFont.value);
                testData.append('nameStyle', nameStyle.value);
                testData.append('nameWeight', nameWeight.value);
                
                return fetch('/test-position', {
                    method: 'POST',
                    body: testData
                });
            })
            .then(response => response.json())
            .then(data => {
                console.log('Position test response:', data);
                alert('Server and position settings are working. Check console for details.');
            })
            .catch(error => {
                console.error('Test failed:', error);
                alert('Test failed. Check console for details.');
            });
    }

    // Reset button
    resetBtn.addEventListener('click', function() {
        resetForm();
    });

    // File preview function
    function showFilePreview(previewElement, file, isImage) {
        previewElement.innerHTML = '';
        previewElement.classList.add('show');

        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';

        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.textContent = file.name;

        const fileSize = document.createElement('div');
        fileSize.className = 'file-size';
        fileSize.textContent = formatFileSize(file.size);

        fileInfo.appendChild(fileName);
        fileInfo.appendChild(fileSize);

        if (isImage) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.alt = 'Certificate Template Preview';
            previewElement.appendChild(img);
        }

        previewElement.appendChild(fileInfo);
    }

    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Show progress
    function showProgress() {
        progressSection.style.display = 'flex';
        resultsSection.style.display = 'none';
        errorSection.style.display = 'none';

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 12;
            if (progress > 90) progress = 90;
            progressFill.style.width = progress + '%';
            progressText.textContent = 'Generating certificates…';
        }, 250);
        window.progressInterval = interval;
    }

    // Hide progress
    function hideProgress() {
        progressSection.style.display = 'none';
        if (window.progressInterval) clearInterval(window.progressInterval);
        progressFill.style.width = '0%';
    }

    // Show results
    function showResults(result) {
        resultsSection.style.display = 'block';
        errorSection.style.display = 'none';

        resultsMessage.textContent = result.message;
        resultsTableBody.innerHTML = '';

        if (result.recipientResults && result.recipientResults.length > 0) {
            result.recipientResults.forEach((res, idx) => {
                const tr = document.createElement('tr');

                // Row number
                const tdNum = document.createElement('td');
                tdNum.textContent = idx + 1;
                tdNum.style.color = 'var(--text-muted)';
                tdNum.style.fontVariantNumeric = 'tabular-nums';
                tr.appendChild(tdNum);

                // Name
                const tdName = document.createElement('td');
                tdName.textContent = res.name;
                tdName.style.fontWeight = '600';
                tr.appendChild(tdName);

                // Team Name
                const tdTeam = document.createElement('td');
                tdTeam.textContent = res.team || 'N/A';
                tdTeam.style.color = 'var(--text-secondary)';
                tr.appendChild(tdTeam);

                // Email
                const tdEmail = document.createElement('td');
                tdEmail.textContent = res.email;
                tdEmail.style.color = 'var(--text-secondary)';
                tr.appendChild(tdEmail);

                // Google Drive Link
                const tdLink = document.createElement('td');
                if (res.driveLink && res.driveLink !== '#') {
                    const a = document.createElement('a');
                    a.href = res.driveLink;
                    a.target = '_blank';
                    a.innerHTML = '<i class="fab fa-google-drive"></i> Open in Drive';
                    tdLink.appendChild(a);
                } else {
                    tdLink.innerHTML = '<span style="color:var(--text-muted)">Not uploaded</span>';
                }
                tr.appendChild(tdLink);

                // Email Status badge
                const tdStatus = document.createElement('td');
                let badgeClass = 'badge-na';
                let icon = 'fa-minus';
                const s = res.emailStatus || 'N/A';
                if (s === 'Sent')         { badgeClass = 'badge-sent';    icon = 'fa-check'; }
                else if (s === 'Skipped') { badgeClass = 'badge-skipped'; icon = 'fa-forward'; }
                else if (s.startsWith('Failed')) { badgeClass = 'badge-failed'; icon = 'fa-xmark'; }
                tdStatus.innerHTML = `<span class="badge-status ${badgeClass}"><i class="fas ${icon}"></i> ${s}</span>`;
                tr.appendChild(tdStatus);

                resultsTableBody.appendChild(tr);
            });
        } else {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="5" style="text-align:center;color:var(--text-muted)">No recipient data returned.</td>';
            resultsTableBody.appendChild(tr);
        }

        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Show error
    function showError(message, requiresAuth = false) {
        errorSection.style.display = 'block';
        resultsSection.style.display = 'none';
        errorMessage.textContent = message;
        
        if (requiresAuth) {
            errorMessage.innerHTML += '<br><br><button class="btn btn-google" onclick="window.location.href=\'/auth/google\'">Sign in with Google</button>';
        }
        
        // Scroll to error
        errorSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Disable form
    function disableForm() {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Generating…';
        certificateTemplateInput.disabled = true;
        excelFileInput.disabled = true;
        resetBtn.disabled = true;
    }

    // Enable form
    function enableForm() {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate Certificates';
        certificateTemplateInput.disabled = false;
        excelFileInput.disabled = false;
        resetBtn.disabled = false;
    }

    // Reset form
    function resetForm() {
        uploadForm.reset();
        templatePreview.classList.remove('show');
        excelPreview.classList.remove('show');
        resultsSection.style.display = 'none';
        errorSection.style.display = 'none';
        progressSection.style.display = 'none';
        
        // Clear file previews
        templatePreview.innerHTML = '';
        excelPreview.innerHTML = '';
        
        // Reset position settings
        resetPosition();
        
        // Clear canvas and show placeholder again
        templateImage = null;
        canvasCtx.clearRect(0, 0, certificateCanvas.width, certificateCanvas.height);
        certificateCanvas.width  = 0;
        certificateCanvas.height = 0;
        certificateCanvas.style.display = 'none';
        canvasPlaceholder.style.display  = 'flex';
        document.getElementById('previewHint').textContent = 'Upload a template image to see a live preview';

        // Hide email fields
        emailFieldsContainer.style.display = 'none';
        
        // Reset progress
        progressFill.style.width = '0%';
        progressText.textContent = 'Processing...';
        
        // Clear any intervals
        if (window.progressInterval) {
            clearInterval(window.progressInterval);
        }
    }

    // Drag and drop functionality
    const uploadLabels = document.querySelectorAll('.upload-label');
    
    uploadLabels.forEach(label => {
        label.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.borderColor = '#667eea';
            this.style.background = '#f0f2ff';
        });

        label.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.borderColor = '#ddd';
            this.style.background = '#f8f9fa';
        });

        label.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.borderColor = '#ddd';
            this.style.background = '#f8f9fa';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const file = files[0];
                const input = this.querySelector('input[type="file"]');
                
                if (input) {
                    input.files = files;
                    input.dispatchEvent(new Event('change'));
                }
            }
        });
    });

    // Add click handlers for upload labels
    uploadLabels.forEach(label => {
        label.addEventListener('click', function() {
            const input = this.querySelector('input[type="file"]');
            if (input) {
                input.click();
            }
        });
    });

    // Load default template for preview on page load
    function loadDefaultTemplate() {
        const defaultSrc = 'printable-certificates-without-borders-3.jpg';
        const img = new Image();
        img.onload = function() {
            templateImage = img;
            // Size canvas to full image resolution
            certificateCanvas.width  = img.naturalWidth;
            certificateCanvas.height = img.naturalHeight;
            // Show canvas, hide placeholder
            certificateCanvas.style.display = 'block';
            canvasPlaceholder.style.display  = 'none';
            document.getElementById('previewHint').textContent =
                `${img.naturalWidth} × ${img.naturalHeight}px — drag sliders to position`;
            drawCanvasPreview();
        };
        img.onerror = function() {
            console.warn('Default template image not found at public/printable-certificates-without-borders-3.jpg');
        };
        img.src = defaultSrc;
    }
}); 