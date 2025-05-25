# VNK - Vietnamese Input Method for Chrome

A modern Vietnamese Input Method extension for Chrome, supporting Telex and VNI input methods.

## Features

- Support both Telex and VNI input methods
- Modern UI/UX with a clean and simple interface
- High performance and stability
- Support for all text input fields
- Quick toggle with Ctrl+Ctrl
- Spell checking support
- Works in all frames and iframes
- Works offline
- Open source and free

## Installation

### From Chrome Web Store

1. Visit the [Chrome Web Store page](https://chrome.google.com/webstore/detail/vnk/...)
2. Click "Add to Chrome"
3. Click "Add extension" in the popup

### From Source

1. Clone the repository:
```bash
git clone https://github.com/chithanh12/avim-chrome.git
cd vnk-chrome
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked" and select the `dist` folder

## Development

### Setup

1. Install dependencies:
```bash
npm install
```

2. Start development build with watch mode:
```bash
npm run dev
```

### Build

To create a production build:
```bash
npm run build
```

The built extension will be in the `dist` folder.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
