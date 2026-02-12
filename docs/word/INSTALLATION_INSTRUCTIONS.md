# Installation Instructions for Word Document Generation

## Quick Start (Recommended: Pandoc)

### Step 1: Install Pandoc

**Windows (using winget):**
```powershell
winget install --id JohnMacFarlane.Pandoc
```

**Windows (using Chocolatey):**
```powershell
choco install pandoc
```

**Windows (Manual):**
1. Download from: https://github.com/jgm/pandoc/releases/latest
2. Run the installer
3. Add to PATH if not automatically done

**macOS:**
```bash
brew install pandoc
```

**Linux:**
```bash
sudo apt-get install pandoc  # Ubuntu/Debian
# OR
sudo yum install pandoc      # CentOS/RHEL
```

### Step 2: Verify Installation

```powershell
pandoc --version
```

You should see version information.

### Step 3: Generate Word Documents

From the project root directory:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/update-all-docx.ps1
```

This will create Word documents in `docs/word/` directory.

## Alternative: Online Conversion

If you cannot install pandoc, use online converters:

1. **Markdown to Word Converter:**
   - https://www.markdowntoword.com/
   - https://cloudconvert.com/md-to-docx
   - https://convertio.co/md-docx/

2. **Steps:**
   - Open the markdown file (e.g., `docs/CS_SUPPORT_SERVICE_PRD.md`)
   - Copy all content
   - Paste into the online converter
   - Download the .docx file
   - Save to `docs/word/` directory

## Files to Convert

Convert these markdown files to Word:

1. `docs/CS_SUPPORT_SERVICE_PRD.md` → `docs/word/CS_SUPPORT_SERVICE_PRD.docx`
2. `docs/CS_SUPPORT_SERVICE_IMPLEMENTATION_PLAN.md` → `docs/word/CS_SUPPORT_SERVICE_IMPLEMENTATION_PLAN.docx`
3. `docs/IMPLEMENTATION_UPDATE_SUMMARY.md` → `docs/word/IMPLEMENTATION_UPDATE_SUMMARY.docx`
4. `docs/PRD_UPDATE_NEW_FEATURES.md` → `docs/word/PRD_UPDATE_NEW_FEATURES.docx`

## Troubleshooting

### Pandoc not found
- Make sure pandoc is installed
- Restart your terminal/PowerShell after installation
- Check PATH: `echo $env:PATH` (PowerShell) or `echo $PATH` (bash)

### Permission denied
- Run PowerShell as Administrator
- Or use: `powershell -ExecutionPolicy Bypass -File scripts/update-all-docx.ps1`

### Conversion errors
- Check that markdown files exist
- Ensure output directory exists: `docs/word/`
- Check file paths are correct

## Manual Conversion (Single File)

To convert a single file:

```powershell
pandoc docs/CS_SUPPORT_SERVICE_PRD.md -o docs/word/CS_SUPPORT_SERVICE_PRD.docx --toc --toc-depth=3 --standalone
```

Options:
- `--toc`: Generate table of contents
- `--toc-depth=3`: Include headings up to level 3
- `--standalone`: Create standalone document
