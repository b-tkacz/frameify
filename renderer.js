const { ipcRenderer } = require('electron');

let currentImagePath = null;
let originalImage = null;
let currentBorderSize = 5; // Default border size percentage
let currentBorderColor = '#ffffff'; // Default border color (white)
let imageQueue = []; // Array to store multiple images for bulk processing

// DOM elements
const selectImageBtn = document.getElementById('selectImageBtn');
const selectMultipleBtn = document.getElementById('selectMultipleBtn');
const addBorderBtn = document.getElementById('addBorderBtn');
const saveImageBtn = document.getElementById('saveImageBtn');
const bulkProcessBtn = document.getElementById('bulkProcessBtn');
const dropZone = document.getElementById('dropZone');
const previewContainer = document.getElementById('previewContainer');
const borderedContainer = document.getElementById('borderedContainer');
const originalCanvas = document.getElementById('originalCanvas');
const borderedCanvas = document.getElementById('borderedCanvas');
const status = document.getElementById('status');
const borderSlider = document.getElementById('borderSlider');
const borderValue = document.getElementById('borderValue');
const borderColor = document.getElementById('borderColor');
const colorValue = document.getElementById('colorValue');

// Bulk processing elements
const bulkSection = document.getElementById('bulkSection');
const imageList = document.getElementById('imageList');
const clearListBtn = document.getElementById('clearListBtn');
const bulkSaveBtn = document.getElementById('bulkSaveBtn');
const bulkProgress = document.getElementById('bulkProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

// Event listeners
selectImageBtn.addEventListener('click', selectImage);
selectMultipleBtn.addEventListener('click', selectMultipleImages);
addBorderBtn.addEventListener('click', addBorder);
saveImageBtn.addEventListener('click', saveImage);
bulkProcessBtn.addEventListener('click', processBulkImages);
clearListBtn.addEventListener('click', clearImageList);
bulkSaveBtn.addEventListener('click', saveBulkImages);

// Border slider event listener
borderSlider.addEventListener('input', (e) => {
    currentBorderSize = parseInt(e.target.value);
    borderValue.textContent = currentBorderSize + '%';

    // Auto-update border if image is loaded
    if (originalImage && previewContainer.style.display !== 'none') {
        addBorder();
    }
});

// Border color event listener
borderColor.addEventListener('input', (e) => {
    currentBorderColor = e.target.value;
    colorValue.textContent = currentBorderColor.toLowerCase();

    // Auto-update border if image is loaded
    if (originalImage && previewContainer.style.display !== 'none') {
        addBorder();
    }
});

// Initialize border value displays
borderValue.textContent = currentBorderSize + '%';
colorValue.textContent = currentBorderColor.toLowerCase();

// Drag and drop functionality
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file =>
        file.type.startsWith('image/') &&
        ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].some(ext =>
            file.name.toLowerCase().endsWith('.' + ext)
        )
    );

    if (imageFiles.length === 0) {
        showStatus('No valid image files found', 'error');
        return;
    }

    if (imageFiles.length === 1) {
        // Single image - load for preview
        loadImageFromFile(imageFiles[0]);
    } else {
        // Multiple images - add to bulk processing queue
        const imagePaths = imageFiles.map(file => file.name); // For drag&drop, we'll use file objects
        addFilesToQueue(imageFiles);
        showStatus(`Added ${imageFiles.length} images to bulk processing queue`, 'success');
    }
});

dropZone.addEventListener('click', selectImage);

// Functions
async function selectImage() {
    try {
        const imagePath = await ipcRenderer.invoke('select-image');
        if (imagePath) {
            currentImagePath = imagePath;
            loadImageFromPath(imagePath);
        }
    } catch (error) {
        showStatus('Error selecting image: ' + error.message, 'error');
    }
}

function loadImageFromFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        loadImageFromDataUrl(e.target.result);
        currentImagePath = file.name; // Store filename for saving
    };
    reader.readAsDataURL(file);
}

function loadImageFromPath(imagePath) {
    const img = new Image();
    img.onload = () => {
        loadImageData(img);
    };
    img.onerror = () => {
        showStatus('Error loading image from path', 'error');
    };
    // For local files in Electron, we need to use the file:// protocol
    img.src = 'file://' + imagePath;
}

function loadImageFromDataUrl(dataUrl) {
    const img = new Image();
    img.onload = () => {
        loadImageData(img);
    };
    img.onerror = () => {
        showStatus('Error loading image from data URL', 'error');
    };
    img.src = dataUrl;
}

function loadImageData(img) {
    originalImage = img;

    // Display original image
    displayImage(img, originalCanvas);

    // Show preview container and enable border button
    previewContainer.style.display = 'block';
    addBorderBtn.disabled = false;
    borderedContainer.style.display = 'none';
    saveImageBtn.disabled = true;

    showStatus('Image loaded successfully! Click "Add White Border" to process.', 'success');
}

function displayImage(img, canvas) {
    const ctx = canvas.getContext('2d');

    // Calculate display size while maintaining aspect ratio
    const maxWidth = 400;
    const maxHeight = 300;
    let { width, height } = calculateDisplaySize(img.width, img.height, maxWidth, maxHeight);

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(img, 0, 0, width, height);
}

function calculateDisplaySize(originalWidth, originalHeight, maxWidth, maxHeight) {
    const aspectRatio = originalWidth / originalHeight;

    let width = originalWidth;
    let height = originalHeight;

    if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
    }

    if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
    }

    return { width, height };
}

function addBorder() {
    if (!originalImage) {
        showStatus('No image loaded', 'error');
        return;
    }

    try {
        const borderedImage = createBorderedImage(originalImage);
        displayImage(borderedImage, borderedCanvas);

        borderedContainer.style.display = 'inline-block';
        saveImageBtn.disabled = false;

        const colorName = currentBorderColor === '#ffffff' ? 'white' : currentBorderColor;
        showStatus(`Border added successfully with ${currentBorderSize}% ${colorName} border! You can now save the image.`, 'success');
    } catch (error) {
        showStatus('Error adding border: ' + error.message, 'error');
    }
}

function createBorderedImage(img) {
    // Create a temporary canvas for the bordered image
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');

    // Calculate border size based on slider value
    const borderPercentage = currentBorderSize / 100;

    // 4x5 aspect ratio calculation
    const targetAspectRatio = 4 / 5; // 0.8
    const imageAspectRatio = img.width / img.height;

    let newWidth, newHeight;
    let imageWidth, imageHeight;
    let offsetX, offsetY;

    // First, determine the base dimensions for 4x5 ratio
    let baseWidth, baseHeight;

    if (imageAspectRatio > targetAspectRatio) {
        // Image is too wide, base on width
        baseWidth = img.width;
        baseHeight = img.width / targetAspectRatio;
    } else {
        // Image is too tall or perfect ratio, base on height
        baseHeight = img.height;
        baseWidth = img.height * targetAspectRatio;
    }

    // Add border based on percentage
    const borderWidth = baseWidth * borderPercentage;
    const borderHeight = baseHeight * borderPercentage;

    newWidth = baseWidth + (borderWidth * 2);
    newHeight = baseHeight + (borderHeight * 2);

    // Calculate image position (centered)
    imageWidth = img.width;
    imageHeight = img.height;
    offsetX = (newWidth - img.width) / 2;
    offsetY = (newHeight - img.height) / 2;

    // Set canvas size
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;

    // Fill with selected border color
    ctx.fillStyle = currentBorderColor;
    ctx.fillRect(0, 0, newWidth, newHeight);

    // Draw the original image centered
    ctx.drawImage(img, offsetX, offsetY, imageWidth, imageHeight);

    // Return a "fake" image object that contains the canvas data
    return {
        width: newWidth,
        height: newHeight,
        src: tempCanvas.toDataURL('image/png'),
        canvas: tempCanvas
    };
}

function displayBorderedImage(borderedImageData) {
    const ctx = borderedCanvas.getContext('2d');

    // Calculate display size
    const maxWidth = 400;
    const maxHeight = 300;
    let { width, height } = calculateDisplaySize(
        borderedImageData.width,
        borderedImageData.height,
        maxWidth,
        maxHeight
    );

    borderedCanvas.width = width;
    borderedCanvas.height = height;

    // Draw the bordered image data to the display canvas
    ctx.drawImage(borderedImageData.canvas, 0, 0, width, height);
}

// Update the displayImage function to handle our custom bordered image object
function displayImage(img, canvas) {
    const ctx = canvas.getContext('2d');

    if (img.canvas) {
        // This is our custom bordered image object
        const maxWidth = 400;
        const maxHeight = 300;
        let { width, height } = calculateDisplaySize(img.width, img.height, maxWidth, maxHeight);

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img.canvas, 0, 0, width, height);
    } else {
        // This is a regular image
        const maxWidth = 400;
        const maxHeight = 300;
        let { width, height } = calculateDisplaySize(img.width, img.height, maxWidth, maxHeight);

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
    }
}

async function saveImage() {
    if (!borderedCanvas.width || !borderedCanvas.height) {
        showStatus('No bordered image to save', 'error');
        return;
    }

    try {
        // Get the full-resolution bordered image
        const borderedImageData = createBorderedImage(originalImage);
        const dataUrl = borderedImageData.canvas.toDataURL('image/png');

        const result = await ipcRenderer.invoke('save-image', dataUrl, currentImagePath, currentBorderSize, currentBorderColor);

        if (result.success) {
            showStatus(`Image saved successfully to: ${result.path}`, 'success');
        } else {
            showStatus(`Error saving image: ${result.error}`, 'error');
        }
    } catch (error) {
        showStatus('Error saving image: ' + error.message, 'error');
    }
}

// Bulk processing functions
async function selectMultipleImages() {
    try {
        const imagePaths = await ipcRenderer.invoke('select-multiple-images');
        if (imagePaths.length > 0) {
            addImagesToQueue(imagePaths);
            showStatus(`Selected ${imagePaths.length} images for bulk processing`, 'success');
        }
    } catch (error) {
        showStatus('Error selecting multiple images: ' + error.message, 'error');
    }
}

function addImagesToQueue(imagePaths) {
    imagePaths.forEach(path => {
        if (!imageQueue.find(item => item.path === path)) {
            imageQueue.push({
                path: path,
                name: path.split('\\').pop() || path.split('/').pop(),
                processed: false,
                borderedImageData: null
            });
        }
    });

    updateImageList();
    updateBulkControls();
}

function addFilesToQueue(files) {
    files.forEach(file => {
        if (!imageQueue.find(item => item.name === file.name)) {
            imageQueue.push({
                path: file.name, // For display purposes
                name: file.name,
                file: file, // Store the file object for drag&drop
                processed: false,
                borderedImageData: null
            });
        }
    });

    updateImageList();
    updateBulkControls();
}

function updateImageList() {
    imageList.innerHTML = '';

    if (imageQueue.length === 0) {
        imageList.innerHTML = '<div style="padding: 20px; text-align: center; color: #6c757d;">No images selected</div>';
        return;
    }

    imageQueue.forEach((imageItem, index) => {
        const item = document.createElement('div');
        item.className = `image-item ${imageItem.processed ? 'processed' : ''}`;

        const statusText = imageItem.processed ? '✓ Processed' : 'Pending';

        item.innerHTML = `
      <span class="image-name" title="${imageItem.path}">${imageItem.name}</span>
      <span class="image-status">${statusText}</span>
    `;

        imageList.appendChild(item);
    });
}

function updateBulkControls() {
    const hasImages = imageQueue.length > 0;
    const hasProcessedImages = imageQueue.some(item => item.processed);

    bulkSection.style.display = hasImages ? 'block' : 'none';
    bulkProcessBtn.disabled = !hasImages;
    bulkSaveBtn.disabled = !hasProcessedImages;
    clearListBtn.disabled = !hasImages;
}

function clearImageList() {
    imageQueue = [];
    updateImageList();
    updateBulkControls();
    showStatus('Image list cleared', 'success');
}

async function processBulkImages() {
    if (imageQueue.length === 0) {
        showStatus('No images to process', 'error');
        return;
    }

    bulkProgress.style.display = 'block';
    bulkProcessBtn.disabled = true;

    const total = imageQueue.length;
    let processed = 0;

    for (let i = 0; i < imageQueue.length; i++) {
        const imageItem = imageQueue[i];

        // Update progress
        progressText.textContent = `Processing ${imageItem.name}... (${processed + 1}/${total})`;
        progressFill.style.width = `${(processed / total) * 100}%`;

        // Mark as processing
        const listItem = imageList.children[i];
        listItem.classList.add('processing');
        listItem.querySelector('.image-status').textContent = 'Processing...';

        try {
            // Load and process image
            const borderedImageData = await processImageFromPath(imageItem.path, imageItem.file);
            imageItem.borderedImageData = borderedImageData;
            imageItem.processed = true;

            // Update status
            listItem.classList.remove('processing');
            listItem.classList.add('processed');
            listItem.querySelector('.image-status').textContent = '✓ Processed';

            processed++;
        } catch (error) {
            console.error('Error processing image:', error);
            listItem.classList.remove('processing');
            listItem.querySelector('.image-status').textContent = '✗ Error';
        }

        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Update final progress
    progressFill.style.width = '100%';
    progressText.textContent = `Completed! Processed ${processed}/${total} images`;

    updateBulkControls();
    bulkProcessBtn.disabled = false;

    setTimeout(() => {
        bulkProgress.style.display = 'none';
    }, 2000);

    showStatus(`Bulk processing completed: ${processed}/${total} images processed successfully`, 'success');
}

async function processImageFromPath(imagePath, fileObj = null) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            try {
                const borderedImageData = createBorderedImage(img);
                resolve(borderedImageData);
            } catch (error) {
                reject(error);
            }
        };
        img.onerror = () => {
            reject(new Error('Failed to load image'));
        };

        if (fileObj) {
            // Handle file object (from drag&drop)
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
            };
            reader.readAsDataURL(fileObj);
        } else {
            // Handle file path
            img.src = 'file://' + imagePath;
        }
    });
}

async function saveBulkImages() {
    const processedImages = imageQueue.filter(item => item.processed && item.borderedImageData);

    if (processedImages.length === 0) {
        showStatus('No processed images to save', 'error');
        return;
    }

    try {
        bulkProgress.style.display = 'block';
        progressText.textContent = 'Preparing images for save...';
        progressFill.style.width = '0%';

        // Prepare image data array
        const imageDataArray = processedImages.map(item => ({
            dataUrl: item.borderedImageData.canvas.toDataURL('image/png'),
            originalPath: item.path
        }));

        progressText.textContent = 'Saving images...';
        progressFill.style.width = '50%';

        const result = await ipcRenderer.invoke('bulk-save-images', imageDataArray, currentBorderSize, currentBorderColor);

        progressFill.style.width = '100%';

        if (result.success) {
            const { summary } = result;
            progressText.textContent = `Saved ${summary.successful}/${summary.total} images`;
            showStatus(`Bulk save completed: ${summary.successful} images saved to ${summary.outputFolder}`, 'success');

            setTimeout(() => {
                bulkProgress.style.display = 'none';
            }, 3000);
        } else {
            progressText.textContent = 'Save failed';
            showStatus(`Error saving images: ${result.error}`, 'error');

            setTimeout(() => {
                bulkProgress.style.display = 'none';
            }, 2000);
        }
    } catch (error) {
        showStatus('Error during bulk save: ' + error.message, 'error');
        bulkProgress.style.display = 'none';
    }
}

function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';

    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            status.style.display = 'none';
        }, 5000);
    }
}
