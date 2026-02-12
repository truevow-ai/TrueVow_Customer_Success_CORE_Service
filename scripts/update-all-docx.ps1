# Update all Word documents from markdown files
# This script converts the main PRD and Implementation Plan to Word documents

$ErrorActionPreference = "Stop"

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

# Create docs/word directory if it doesn't exist
$wordDir = "docs\word"
if (-not (Test-Path $wordDir)) {
    New-Item -ItemType Directory -Path $wordDir -Force | Out-Null
    Write-Host "Created directory: $wordDir" -ForegroundColor Green
}

# Files to convert
$filesToConvert = @(
    @{
        Input = "docs\CS_SUPPORT_SERVICE_PRD.md"
        Output = "docs\word\CS_SUPPORT_SERVICE_PRD.docx"
        Name = "CS-Support Service PRD"
    },
    @{
        Input = "docs\CS_SUPPORT_SERVICE_IMPLEMENTATION_PLAN.md"
        Output = "docs\word\CS_SUPPORT_SERVICE_IMPLEMENTATION_PLAN.docx"
        Name = "CS-Support Service Implementation Plan"
    },
    @{
        Input = "docs\IMPLEMENTATION_UPDATE_SUMMARY.md"
        Output = "docs\word\IMPLEMENTATION_UPDATE_SUMMARY.docx"
        Name = "Implementation Update Summary"
    },
    @{
        Input = "docs\PRD_UPDATE_NEW_FEATURES.md"
        Output = "docs\word\PRD_UPDATE_NEW_FEATURES.docx"
        Name = "PRD Update - New Features"
    }
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Converting Markdown to Word Documents" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$successCount = 0
$failCount = 0

foreach ($file in $filesToConvert) {
    $inputFile = $file.Input
    $outputFile = $file.Output
    $name = $file.Name
    
    Write-Host "Processing: $name" -ForegroundColor Yellow
    
    # Check if input file exists
    if (-not (Test-Path $inputFile)) {
        Write-Host "  ERROR: Input file not found: $inputFile" -ForegroundColor Red
        $failCount++
        continue
    }
    
    # Convert markdown to docx
    # Try with reference doc first, fall back to basic conversion
    $referenceDoc = "scripts\reference.docx"
    $pandocArgs = @(
        $inputFile,
        "-o", $outputFile,
        "--from", "markdown",
        "--to", "docx",
        "--toc",
        "--toc-depth=3",
        "--standalone"
    )
    
    # Add reference doc if it exists
    if (Test-Path $referenceDoc) {
        $pandocArgs += "--reference-doc=$referenceDoc"
    }
    
    try {
        & pandoc $pandocArgs 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  SUCCESS: Created $outputFile" -ForegroundColor Green
            $successCount++
        } else {
            Write-Host "  ERROR: Conversion failed (exit code: $LASTEXITCODE)" -ForegroundColor Red
            $failCount++
        }
    } catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $failCount++
    }
    
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Conversion Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Success: $successCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($successCount -gt 0) {
    Write-Host "Word documents created in: docs\word\" -ForegroundColor Green
}
