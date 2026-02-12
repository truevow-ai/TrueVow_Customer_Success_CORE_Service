# Convert Markdown to Word Document
# Requires: pandoc (https://pandoc.org/installing.html)

param(
    [string]$InputFile,
    [string]$OutputFile
)

# Check if pandoc is installed
$pandocPath = Get-Command pandoc -ErrorAction SilentlyContinue

if (-not $pandocPath) {
    Write-Host "ERROR: pandoc is not installed." -ForegroundColor Red
    Write-Host "Please install pandoc from: https://pandoc.org/installing.html" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "On Windows, you can install via:" -ForegroundColor Yellow
    Write-Host "  winget install --id JohnMacFarlane.Pandoc" -ForegroundColor Cyan
    Write-Host "  OR" -ForegroundColor Yellow
    Write-Host "  choco install pandoc" -ForegroundColor Cyan
    exit 1
}

# Check if input file exists
if (-not (Test-Path $InputFile)) {
    Write-Host "ERROR: Input file not found: $InputFile" -ForegroundColor Red
    exit 1
}

# Create output directory if it doesn't exist
$outputDir = Split-Path -Parent $OutputFile
if ($outputDir -and -not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

# Convert markdown to docx
Write-Host "Converting: $InputFile -> $OutputFile" -ForegroundColor Green

pandoc "$InputFile" -o "$OutputFile" `
    --from markdown `
    --to docx `
    --reference-doc=scripts/reference.docx `
    --toc `
    --toc-depth=3 `
    --standalone

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Created $OutputFile" -ForegroundColor Green
} else {
    Write-Host "ERROR: Conversion failed" -ForegroundColor Red
    exit 1
}
