<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Image Border App - Copilot Instructions

This is an Electron application that adds white borders to images to create a 4x5 portrait aspect ratio.

## Project Structure
- `main.js` - Main Electron process that handles window creation and file operations
- `index.html` - User interface for the application
- `renderer.js` - Renderer process that handles image processing and user interactions
- `package.json` - Project configuration and dependencies

## Key Features
- Cross-platform Electron app (Windows and macOS)
- Drag and drop image support
- File dialog for image selection
- Canvas-based image processing to add white borders
- Automatic 4x5 aspect ratio conversion
- Save functionality for processed images

## Technology Stack
- Electron for cross-platform desktop app
- HTML5 Canvas for image processing
- Native file dialogs for file operations
- No external image processing libraries (uses browser Canvas API)

## Development Notes
- The app uses `nodeIntegration: true` for simplicity (should be updated for production)
- Images are processed client-side using Canvas API
- Border calculations maintain image center positioning
- Supports common image formats: JPG, PNG, GIF, BMP, WebP
