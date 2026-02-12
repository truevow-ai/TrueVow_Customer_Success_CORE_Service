"""
Script to update the two main CS-Support Service Word documents:
1. CS_SUPPORT_SERVICE_PRD.docx
2. CS_SUPPORT_SERVICE_IMPLEMENTATION_PLAN.docx

This script converts the markdown files to Word format, preserving version numbers.
"""

import os
import sys
from datetime import datetime

# Add scripts directory to path to import conversion functions
sys.path.insert(0, os.path.dirname(__file__))

from convert_cs_support_prd_to_docx import convert_markdown_to_docx
from convert_implementation_plan_to_docx import convert_markdown_to_docx as convert_impl_plan

# Paths
CS_SUPPORT_DIR = r"C:\Users\yasha\OneDrive\Documents\TrueVow\Cursor\TrueVow-CS-Support"
DOCS_DIR = os.path.join(CS_SUPPORT_DIR, "docs")

# Main documents to update
DOCUMENTS = [
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
    }
]

def main():
    print("=" * 80)
    print("Updating CS-Support Service Word Documents")
    print("=" * 80)
    print()
    
    success_count = 0
    fail_count = 0
    
    for doc_info in DOCUMENTS:
        md_file = doc_info["md"]
        docx_file = doc_info["docx"]
        name = doc_info["name"]
        
        print(f"Updating: {name}")
        print("-" * 80)
        
        if not os.path.exists(md_file):
            print(f"  ERROR: Markdown file not found: {md_file}")
            fail_count += 1
            print()
            continue
        
        # Convert markdown to docx
        if name == "CS-Support Service PRD":
            success = convert_markdown_to_docx(md_file, docx_file)
        else:
            success = convert_impl_plan(md_file, docx_file)
        
        if success:
            success_count += 1
            print(f"  [OK] Successfully updated")
        else:
            fail_count += 1
            print(f"  [FAIL] Failed to update")
        
        print()
    
    print("=" * 80)
    print("Update Summary")
    print("=" * 80)
    print(f"Success: {success_count}")
    print(f"Failed: {fail_count}")
    print()
    
    if success_count == len(DOCUMENTS):
        print("[SUCCESS] All documents updated successfully!")
        print()
        print("Updated files:")
        for doc_info in DOCUMENTS:
            if os.path.exists(doc_info["docx"]):
                file_size = os.path.getsize(doc_info["docx"]) / 1024
                print(f"  - {os.path.basename(doc_info['docx'])} ({file_size:.0f} KB)")
            elif os.path.exists(doc_info["temp"]):
                print(f"  - {os.path.basename(doc_info['temp'])} (alternative file - original was locked)")
    else:
        print("[WARNING] Some documents failed to update. Please check the errors above.")

if __name__ == "__main__":
    main()
