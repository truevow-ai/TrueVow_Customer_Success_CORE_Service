# Word Document Generation

This directory contains Word (.docx) versions of the CS-Support Service documentation.

## Prerequisites

To generate Word documents from Markdown, you need one of the following:

### Option 1: Pandoc (Recommended)

**Install Pandoc:**
```powershell
# Using winget (Windows Package Manager)
winget install --id JohnMacFarlane.Pandoc

# OR using Chocolatey
choco install pandoc

# OR download from: https://pandoc.org/installing.html
```

**Generate Word Documents:**
```powershell
# From project root
powershell -ExecutionPolicy Bypass -File scripts/update-all-docx.ps1
```

### Option 2: Online Conversion

1. Open the markdown file in a text editor
2. Copy the content
3. Use an online converter:
   - https://www.markdowntoword.com/
   - https://cloudconvert.com/md-to-docx
   - https://convertio.co/md-docx/

### Option 3: VS Code Extension

1. Install "Markdown PDF" extension in VS Code
2. Open the markdown file
3. Right-click → "Markdown PDF: Export (docx)"

## Files to Convert

The following markdown files should be converted to Word:

1. **CS_SUPPORT_SERVICE_PRD.md** → `CS_SUPPORT_SERVICE_PRD.docx`
2. **CS_SUPPORT_SERVICE_IMPLEMENTATION_PLAN.md** → `CS_SUPPORT_SERVICE_IMPLEMENTATION_PLAN.docx`
3. **IMPLEMENTATION_UPDATE_SUMMARY.md** → `IMPLEMENTATION_UPDATE_SUMMARY.docx`
4. **PRD_UPDATE_NEW_FEATURES.md** → `PRD_UPDATE_NEW_FEATURES.docx`

## Manual Conversion Steps

If you prefer to convert manually:

1. **Using Pandoc (Command Line):**
   ```powershell
   pandoc docs/CS_SUPPORT_SERVICE_PRD.md -o docs/word/CS_SUPPORT_SERVICE_PRD.docx --toc --toc-depth=3
   pandoc docs/CS_SUPPORT_SERVICE_IMPLEMENTATION_PLAN.md -o docs/word/CS_SUPPORT_SERVICE_IMPLEMENTATION_PLAN.docx --toc --toc-depth=3
   pandoc docs/IMPLEMENTATION_UPDATE_SUMMARY.md -o docs/word/IMPLEMENTATION_UPDATE_SUMMARY.docx --toc --toc-depth=3
   pandoc docs/PRD_UPDATE_NEW_FEATURES.md -o docs/word/PRD_UPDATE_NEW_FEATURES.docx --toc --toc-depth=3
   ```

2. **Using Online Tools:**
   - Upload each markdown file to an online converter
   - Download the resulting .docx file
   - Save to `docs/word/` directory

## Notes

- The Word documents should preserve:
  - Table of contents (auto-generated)
  - Headings and formatting
  - Code blocks
  - Tables
  - Links

- After conversion, you may want to:
  - Adjust page margins
  - Add page numbers
  - Update header/footer
  - Adjust table formatting
