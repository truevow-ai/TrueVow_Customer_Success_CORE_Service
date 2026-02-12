"""
Script to convert all CS-Support Service documentation from Markdown to Word (.docx) format.
"""

import os
import sys
from convert_cs_support_prd_to_docx import convert_markdown_to_docx, clean_text, process_markdown_line, process_inline_formatting, add_formatted_text
from convert_implementation_plan_to_docx import convert_markdown_to_docx as convert_impl_plan
from datetime import datetime

try:
    from docx import Document
    from docx.shared import Pt
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False
    print("Error: python-docx not installed. Install with: pip install python-docx")
    exit(1)

# Paths
CS_SUPPORT_DIR = r"C:\Users\yasha\OneDrive\Documents\TrueVow\Cursor\TrueVow-CS-Support"
DOCS_DIR = os.path.join(CS_SUPPORT_DIR, "docs")

# Files to convert
FILES_TO_CONVERT = [
    {
        "md": os.path.join(DOCS_DIR, "CS_SUPPORT_SERVICE_PRD.md"),
        "docx": os.path.join(CS_SUPPORT_DIR, "CS_SUPPORT_SERVICE_PRD.docx"),
        "temp": os.path.join(CS_SUPPORT_DIR, "CS_SUPPORT_SERVICE_PRD-UPDATED.docx"),
        "name": "CS-Support Service PRD"
    },
    {
        "md": os.path.join(DOCS_DIR, "CS_SUPPORT_SERVICE_IMPLEMENTATION_PLAN.md"),
        "docx": os.path.join(CS_SUPPORT_DIR, "CS_SUPPORT_SERVICE_IMPLEMENTATION_PLAN.docx"),
        "temp": os.path.join(CS_SUPPORT_DIR, "CS_SUPPORT_SERVICE_IMPLEMENTATION_PLAN-UPDATED.docx"),
        "name": "CS-Support Service Implementation Plan"
    },
    {
        "md": os.path.join(DOCS_DIR, "IMPLEMENTATION_UPDATE_SUMMARY.md"),
        "docx": os.path.join(CS_SUPPORT_DIR, "IMPLEMENTATION_UPDATE_SUMMARY.docx"),
        "temp": os.path.join(CS_SUPPORT_DIR, "IMPLEMENTATION_UPDATE_SUMMARY-UPDATED.docx"),
        "name": "Implementation Update Summary"
    },
    {
        "md": os.path.join(DOCS_DIR, "PRD_UPDATE_NEW_FEATURES.md"),
        "docx": os.path.join(CS_SUPPORT_DIR, "PRD_UPDATE_NEW_FEATURES.docx"),
        "temp": os.path.join(CS_SUPPORT_DIR, "PRD_UPDATE_NEW_FEATURES-UPDATED.docx"),
        "name": "PRD Update - New Features"
    }
]

def main():
    print("=" * 80)
    print("Converting All CS-Support Service Documentation to Word Documents")
    print("=" * 80)
    print()
    
    success_count = 0
    fail_count = 0
    
    for file_info in FILES_TO_CONVERT:
        md_file = file_info["md"]
        docx_file = file_info["docx"]
        temp_file = file_info["temp"]
        name = file_info["name"]
        
        print(f"Processing: {name}")
        print("-" * 80)
        
        if not os.path.exists(md_file):
            print(f"  ERROR: Markdown file not found: {md_file}")
            fail_count += 1
            print()
            continue
        
        # Use the conversion function
        if convert_markdown_to_docx(md_file, docx_file):
            success_count += 1
        else:
            fail_count += 1
        
        print()
    
    print("=" * 80)
    print("Conversion Summary")
    print("=" * 80)
    print(f"Success: {success_count}")
    print(f"Failed: {fail_count}")
    print()
    
    if success_count > 0:
        print("Word documents created in project root directory.")
        print()
        print("Files created:")
        for file_info in FILES_TO_CONVERT:
            if os.path.exists(file_info["docx"]):
                print(f"  ✓ {os.path.basename(file_info['docx'])}")
            elif os.path.exists(file_info["temp"]):
                print(f"  ✓ {os.path.basename(file_info['temp'])} (alternative file)")

if __name__ == "__main__":
    main()
