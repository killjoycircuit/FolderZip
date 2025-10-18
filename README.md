# FolderZip

Convert ASCII folder structures into downloadable ZIP files instantly.

## What is FolderZip?

A simple web tool that transforms ASCII tree formatted folder structures into ready to download ZIP files. No backend, no setup just paste and download.

## Features

- ✨ Paste ASCII structure, download ZIP
-  Real-time validation & error detection
- Live preview before download
-  Auto-sanitizes invalid characters
- Runs entirely in browser
-  Supports all file types

## How to Use

1. **Paste** your folder structure in ASCII format
2. **Validate** to check for errors
3. **Download** the ZIP file

## Format

```
project/
├─ src/
│  ├─ index.js
│  └─ style.css
├─ assets/
│  └─ logo.png
└─ README.md
```

**Rules:**
- Use `├─` for items (folders/files)
- Use `└─` for last item in section
- Use `│` for indentation
- Files need extensions (.js, .py, .html, etc.)
- Folders have no extensions

## Getting Started

```bash
# Clone repo
git clone https://github.com/killjoycircuit/folderzip.git

# Install & run
cd client
npm install
npm run dev
```

## Supported File Types

JavaScript, TypeScript, Python, Java, C++, C#, PHP, Go, Rust, Swift, HTML, CSS, JSON, XML, YAML, PNG, JPG, SVG, MP3, MP4, PDF, and more.

## Tech Stack

- React
- Tailwind CSS
- JSZip
- Vite
