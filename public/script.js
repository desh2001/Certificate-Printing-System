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
    const namePreview = document.getElementById('namePreview');

    // Check authentication status on page load
    checkAuthStatus();

    // Handle URL parameters for auth feedback
    const urlParams = new URLSearchParams(window.location.search);
    const authParam = urlParams.get('auth');
    if (authParam === 'success') {
        showAuthSuccess();
    } else if (authParam === 'error') {
        showAuthError();
    } else if (authParam === 'logout') {
        showAuthLogout();
    }

    // Google login button
    loginBtn.addEventListener('click', function() {
        window.location.href = '/auth/google';
    });

    // Position control event listeners
    nameX.addEventListener('input', updateNamePreview);
    nameY.addEventListener('input', updateNamePreview);
    nameSize.addEventListener('input', updateNamePreview);
    nameColor.addEventListener('input', updateNamePreview);
    nameFont.addEventListener('change', updateNamePreview);
    nameStyle.addEventListener('change', updateNamePreview);
    nameWeight.addEventListener('change', updateNamePreview);

    // Preview on template button
    document.getElementById('previewOnTemplate').addEventListener('click', previewOnTemplate);

    // Reset position button
    document.getElementById('resetPosition').addEventListener('click', resetPosition);

    // Test preview button
    document.getElementById('testPreview').addEventListener('click', testPreview);

    // Initialize name preview
    updateNamePreview();

    // File preview handlers
    certificateTemplateInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            showFilePreview(templatePreview, file, true);
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
        const certificateFile = certificateTemplateInput.files[0];
        const excelFile = excelFileInput.files[0];

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

    // Update name preview function
    function updateNamePreview() {
        const x = nameX.value;
        const y = nameY.value;
        const size = nameSize.value;
        const color = nameColor.value;
        const font = nameFont.value;
        const style = nameStyle.value;
        const weight = nameWeight.value;

        // Update display values
        nameXValue.textContent = x + '%';
        nameYValue.textContent = y + '%';
        nameSizeValue.textContent = size + 'px';

        // Update current settings display
        document.getElementById('currentX').textContent = x + '%';
        document.getElementById('currentY').textContent = y + '%';
        document.getElementById('currentSize').textContent = size + 'px';
        document.getElementById('currentColor').textContent = color;
        document.getElementById('currentFont').textContent = font;
        document.getElementById('currentStyle').textContent = style;
        document.getElementById('currentWeight').textContent = weight;

        // Build font string
        let fontString = '';
        if (style !== 'normal') fontString += style + ' ';
        if (weight !== 'normal') fontString += weight + ' ';
        fontString += size + 'px ' + font;

        // Update preview
        namePreview.style.left = x + '%';
        namePreview.style.top = y + '%';
        namePreview.style.font = fontString;
        namePreview.style.color = color;
        namePreview.style.transform = 'translate(-50%, -50%)';
    }

    // Preview on actual template
    function previewOnTemplate() {
        const certificateFile = certificateTemplateInput.files[0];
        if (!certificateFile) {
            showError('Please upload a certificate template first.');
            return;
        }

        // Show loading state
        const previewBtn = document.getElementById('previewOnTemplate');
        const originalText = previewBtn.innerHTML;
        previewBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating Preview...';
        previewBtn.disabled = true;

        const formData = new FormData();
        formData.append('certificateTemplate', certificateFile);
        formData.append('nameX', nameX.value);
        formData.append('nameY', nameY.value);
        formData.append('nameSize', nameSize.value);
        formData.append('nameColor', nameColor.value);
        formData.append('nameFont', nameFont.value);
        formData.append('nameStyle', nameStyle.value);
        formData.append('nameWeight', nameWeight.value);
        formData.append('previewName', 'Sample Name');

        fetch('/preview', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.error || 'Preview generation failed');
                });
            }
            return response.blob();
        })
        .then(blob => {
            const url = URL.createObjectURL(blob);
            const newWindow = window.open(url, '_blank');
            if (newWindow) {
                newWindow.document.title = 'Certificate Preview';
            } else {
                // Fallback: show in current window
                window.location.href = url;
            }
        })
        .catch(error => {
            console.error('Error generating preview:', error);
            showError('Error generating preview: ' + error.message);
        })
        .finally(() => {
            // Reset button state
            previewBtn.innerHTML = originalText;
            previewBtn.disabled = false;
        });
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
        progressSection.style.display = 'block';
        resultsSection.style.display = 'none';
        errorSection.style.display = 'none';
        
        // Simulate progress animation
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            progressFill.style.width = progress + '%';
            progressText.textContent = 'Processing files...';
        }, 200);

        // Store interval for cleanup
        window.progressInterval = interval;
    }

    // Hide progress
    function hideProgress() {
        progressSection.style.display = 'none';
        if (window.progressInterval) {
            clearInterval(window.progressInterval);
        }
        progressFill.style.width = '0%';
    }

    // Show results
    function showResults(result) {
        resultsSection.style.display = 'block';
        errorSection.style.display = 'none';
        
        resultsMessage.textContent = result.message;
        
        // Display uploaded files
        uploadedFiles.innerHTML = '';
        if (result.uploadedFiles && result.uploadedFiles.length > 0) {
            result.uploadedFiles.forEach(file => {
                const fileLink = document.createElement('a');
                fileLink.href = file.link;
                fileLink.target = '_blank';
                fileLink.className = 'file-link';
                fileLink.innerHTML = `
                    <i class="fas fa-external-link-alt"></i>
                    <div>
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">Click to view in Google Drive</div>
                    </div>
                `;
                uploadedFiles.appendChild(fileLink);
            });
        }

        // Scroll to results
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
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        certificateTemplateInput.disabled = true;
        excelFileInput.disabled = true;
        resetBtn.disabled = true;
    }

    // Enable form
    function enableForm() {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Certificates';
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
}); 