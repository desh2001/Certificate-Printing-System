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

    // Color preset dots
    document.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            nameColor.value = dot.dataset.color;
            document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            updateNamePreview();
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
        // Shadow must be cleared BEFORE setting ctx.font — some browsers
        // re-validate the font property when shadow metrics change, and a
        // dirty shadow state can cause the font assignment to be silently
        // discarded.
        canvasCtx.shadowColor   = 'transparent';
        canvasCtx.shadowBlur    = 0;
        canvasCtx.shadowOffsetX = 0;
        canvasCtx.shadowOffsetY = 0;
        canvasCtx.globalAlpha   = 1;
        canvasCtx.globalCompositeOperation = 'source-over';

        // ── Step 2: Draw certificate template background ──────────────────────
        canvasCtx.clearRect(0, 0, W, H);
        canvasCtx.drawImage(templateImage, 0, 0);

        // ── Step 3: Build CSS font shorthand ──────────────────────────────────
        // CSS font shorthand syntax:  [style] [weight] size family
        // Rules the Canvas 2D API enforces:
        //  • size (with px unit) and family are REQUIRED
        //  • family names containing spaces MUST be quoted with double-quotes
        //  • numeric weights (100–900) are valid, but must come before size
        //  • if the browser can't parse the string it silently keeps the old font
        const sizePx   = Math.max(8, parseInt(nameSize.value)  || 48);
        const style    = nameStyle.value  || 'normal';
        const weight   = nameWeight.value || 'normal';
        const fontName = nameFont.value   || 'Arial';
        const color    = nameColor.value  || '#000000';

        // Quote multi-word families: "Times New Roman", "Comic Sans MS", etc.
        const quotedFamily = fontName.includes(' ') ? `"${fontName}"` : fontName;

        // Assemble: optional style → optional weight → size → family
        const fontParts = [];
        if (style  !== 'normal') fontParts.push(style);
        if (weight !== 'normal') fontParts.push(weight);
        fontParts.push(`${sizePx}px`);
        fontParts.push(quotedFamily);
        const cssFont = fontParts.join(' ');

        // ── Step 4: Apply font FIRST, then check it was accepted ─────────────
        canvasCtx.textAlign    = 'center';
        canvasCtx.textBaseline = 'middle';
        canvasCtx.font         = cssFont;

        // Read back: if the browser rejected the string it reverts to the
        // previous value.  Log both so DevTools shows what actually rendered.
        const appliedFont = canvasCtx.font;
        console.log(`[Preview] requested="${cssFont}"  applied="${appliedFont}"`);

        // ── Step 5: Shadow (applied after font to avoid repaint conflicts) ─────
        const dark = isColorDark(color);
        canvasCtx.shadowColor   = dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.35)';
        canvasCtx.shadowBlur    = Math.max(2, sizePx * 0.04);
        canvasCtx.shadowOffsetX = 0;
        canvasCtx.shadowOffsetY = 0;

        // ── Step 6: Draw text ─────────────────────────────────────────────────
        const px = (W * parseFloat(nameX.value)) / 100;
        const py = (H * parseFloat(nameY.value)) / 100;
        canvasCtx.fillStyle = color;
        canvasCtx.fillText('Sample Name', px, py);

        // Clear shadow so future clearRect / drawImage calls are clean
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
        const font   = nameFont.value;
        const style  = nameStyle.value;
        const weight = nameWeight.value;

        // Update display values
        nameXValue.textContent = x + '%';
        nameYValue.textContent = y + '%';
        nameSizeValue.textContent = size + 'px';

        // Update current-settings readout
        document.getElementById('currentX').textContent      = x + '%';
        document.getElementById('currentY').textContent      = y + '%';
        document.getElementById('currentSize').textContent   = size + 'px';
        document.getElementById('currentColor').textContent  = color;
        document.getElementById('currentFont').textContent   = font;
        document.getElementById('currentStyle').textContent  = style;
        document.getElementById('currentWeight').textContent = weight;

        // Sync the color hex display and swatch pill
        const colorHexEl   = document.getElementById('colorHex');
        const colorSwatchEl = document.getElementById('colorSwatch');
        if (colorHexEl)   colorHexEl.textContent = color;
        if (colorSwatchEl) colorSwatchEl.style.background = color;

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