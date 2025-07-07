# Image Border App - 4x5 Portrait Mode

A simple cross-platform desktop application built with Electron that adds white borders to images to create a perfect 4x5 portrait aspect ratio.

## Features

- 🖼️ **Easy Image Loading**: Drag and drop images or use the file browser
- 📐 **4x5 Aspect Ratio**: Automatically adds borders to achieve portrait orientation
- 🎚️ **Adjustable Border Size**: Use the slider to control how much border is added (0-50%)
- 🎨 **Custom Border Colors**: Pick any color for your border using the color picker
- 🔄 **Real-time Preview**: See changes instantly as you adjust the border size and color
- � **Bulk Processing**: Select and process multiple images at once with the same settings
- �💾 **Save Functionality**: Export individual images or save all processed images to a folder
- 🖥️ **Cross-Platform**: Works on both Windows and macOS
- 👀 **Preview**: See before and after comparisons
- 📁 **Multiple Formats**: Supports JPG, PNG, GIF, BMP, and WebP

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## How It Works

### Single Image Mode (Preview & Edit)
1. **Load an Image**: Drag and drop a single image or click "Select Single Image"
2. **Adjust Border Settings**: 
   - Use the slider to set your preferred border size (0-50%)
   - Use the color picker to choose your border color
3. **Preview**: See real-time updates as you change settings
4. **Save**: Click "Save Image" to export the result

### Bulk Processing Mode
1. **Select Multiple Images**: Click "Select Multiple Images" or drag and drop multiple files
2. **Configure Settings**: Set your preferred border size and color (applies to all images)
3. **Process All**: Click "Process All Images" to apply borders to all selected images
4. **Save All**: Click "Save All to Folder" to export all processed images to a chosen folder

The app automatically calculates the required border to transform any image into a 4x5 portrait aspect ratio while keeping the original image centered. Bulk processing allows you to apply the same settings to hundreds of images efficiently.

## Supported Image Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- BMP (.bmp)
- WebP (.webp)

## Technical Details

- **Framework**: Electron
- **Image Processing**: HTML5 Canvas API
- **File Handling**: Native Electron dialogs
- **UI**: Vanilla HTML/CSS/JavaScript

## Project Structure

```
framer/
├── main.js           # Main Electron process
├── index.html        # User interface
├── renderer.js       # Image processing logic
├── package.json      # Project configuration
└── README.md         # This file
```

## Future Enhancements

- Different aspect ratios (3x4, 16x9, etc.)
- Border width customization
- Image filters and effects
- Gradient borders
- Border patterns and textures
- Batch rename options
- Progress resume for interrupted bulk operations

## License

ISC License
