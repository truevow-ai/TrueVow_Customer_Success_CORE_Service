"""
Script to convert Implementation Update Summary from Markdown to Word (.docx) format.
"""

import os
import re
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
MD_FILE = os.path.join(CS_SUPPORT_DIR, "docs", "IMPLEMENTATION_UPDATE_SUMMARY.md")
DOCX_FILE = os.path.join(CS_SUPPORT_DIR, "IMPLEMENTATION_UPDATE_SUMMARY.docx")
TEMP_DOCX_FILE = os.path.join(CS_SUPPORT_DIR, "IMPLEMENTATION_UPDATE_SUMMARY-UPDATED.docx")

# Import conversion functions from the main script
sys.path.insert(0, os.path.dirname(__file__))
from convert_cs_support_prd_to_docx import (
    clean_text, process_markdown_line, process_inline_formatting, 
    add_formatted_text, convert_markdown_to_docx
)

def main():
    print("=" * 80)
    print("Converting Implementation Update Summary to Word Document")
    print("=" * 80)
    print()
    
    if not os.path.exists(MD_FILE):
        print(f"Error: Markdown file not found: {MD_FILE}")
        return
    
    if convert_markdown_to_docx(MD_FILE, DOCX_FILE):
        print()
        print("=" * 80)
        print("Conversion completed successfully!")
        print("=" * 80)
    else:
        print()
        print("=" * 80)
        print("Conversion failed!")
        print("=" * 80)

if __name__ == "__main__":
    import sys
    main()
