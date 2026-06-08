#!/usr/bin/env python3
"""
Update TrueVow_PRD.md with CS-Support split changes.
Runs from repo root directory.
"""

import os
import sys

# External documentation path (universal for all repos)
DOC_PATH = r"C:\Users\yasha\OneDrive\Documents\TrueVow\Cursor\TrueVow-Documentation"
TARGET_FILE = os.path.join(DOC_PATH, "TrueVow_PRD.md")

def update_prd():
    """Update the PRD with 6-service model changes."""
    
    # Verify file exists
    if not os.path.exists(TARGET_FILE):
        print("[ERROR] File not found: {}".format(TARGET_FILE))
        sys.exit(1)
    
    # Read current content
    with open(TARGET_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Apply updates
    updates_made = []
    
    # Update section title and metadata
    if "5-SERVICE MODEL" in content:
        content = content.replace(
            "## [MAP] TRUEVOW ENTERPRISE ARCHITECTURE - 5-SERVICE MODEL",
            "## [MAP] TRUEVOW ENTERPRISE ARCHITECTURE - 6-SERVICE MODEL"
        )
        content = content.replace(
            "## 🗺️ TRUEVOW ENTERPRISE ARCHITECTURE - 5-SERVICE MODEL",
            "## 🗺️ TRUEVOW ENTERPRISE ARCHITECTURE - 6-SERVICE MODEL"
        )
        updates_made.append("Updated section title to 6-service model")
    
    if "Version: 1.0" in content:
        content = content.replace(
            "**Version:** 1.0",
            "**Version:** 2.0"
        )
        updates_made.append("Updated version to 2.0")
    
    if "Date: December 26, 2025" in content:
        content = content.replace(
            "**Date:** December 26, 2025",
            "**Date:** February 15, 2026"
        )
        updates_made.append("Updated date to February 15, 2026")
    
    # Update service descriptions
    if "[STAR] NEW (Split from CS-Support)" in content:
        content = content.replace(
            "5. **Customer-Success-CORE-Service** (`truevow-customer-success-core-service`) [STAR] NEW (Split from CS-Support)",
            "5. **Customer-Success-CORE-Service** (`truevow-customer-success-core-service`) [STAR] SPLIT FROM CS-SUPPORT"
        )
        content = content.replace(
            "6. **First-Line-Support-Service** (`truevow-first-line-support-service`) [STAR] NEW (Split from CS-Support)",
            "6. **First-Line-Support-Service** (`truevow-first-line-support-service`) [STAR] SPLIT FROM CS-SUPPORT"
        )
        updates_made.append("Updated service labels to SPLIT FROM CS-SUPPORT")
    
    # Write updated content
    with open(TARGET_FILE, "w", encoding="utf-8") as f:
        f.write(content)
    
    print("[SUCCESS] Updated {}".format(TARGET_FILE))
    for update in updates_made:
        print("  - {}".format(update))
    
    return len(updates_made) > 0

if __name__ == "__main__":
    try:
        success = update_prd()
        if success:
            print("STATUS: DONE")
        else:
            print("STATUS: UNVERIFIED (no changes needed)")
    except Exception as e:
        print("[ERROR] {}".format(e))
        print("STATUS: BLOCKED")
        sys.exit(1)