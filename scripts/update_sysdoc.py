#!/usr/bin/env python3
"""
Update TRUEVOW_COMPLETE_SYSTEM_DOCUMENTATION.txt with CS-Support split changes.
Runs from repo root directory.
"""

import os
import sys

# External documentation path (universal for all repos)
DOC_PATH = r"C:\Users\yasha\OneDrive\Documents\TrueVow\Cursor\TrueVow-Documentation"
TARGET_FILE = os.path.join(DOC_PATH, "TRUEVOW_COMPLETE_SYSTEM_DOCUMENTATION.txt")

def update_sysdoc():
    """Update the system documentation with 6-service model changes."""
    
    # Verify file exists
    if not os.path.exists(TARGET_FILE):
        print("[ERROR] File not found: {}".format(TARGET_FILE))
        sys.exit(1)
    
    # Read current content
    with open(TARGET_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Apply updates
    updates_made = []
    
    # Update version
    if "Version: 10.6" in content:
        content = content.replace(
            "Version: 10.6",
            "Version: 10.7"
        )
        updates_made.append("Updated version to 10.7")
    
    # Update date
    if "Last Updated: January" in content:
        content = content.replace(
            "Last Updated: January",
            "Last Updated: February 15, 2026"
        )
        updates_made.append("Updated date to February 15, 2026")
    
    # Update architecture section references
    if "5-service model" in content:
        content = content.replace(
            "5-service model",
            "6-service model"
        )
        updates_made.append("Updated model reference to 6-service")
    
    # Write updated content
    with open(TARGET_FILE, "w", encoding="utf-8") as f:
        f.write(content)
    
    print("[SUCCESS] Updated {}".format(TARGET_FILE))
    for update in updates_made:
        print("  - {}".format(update))
    
    return len(updates_made) > 0

if __name__ == "__main__":
    try:
        success = update_sysdoc()
        if success:
            print("STATUS: DONE")
        else:
            print("STATUS: UNVERIFIED (no changes needed)")
    except Exception as e:
        print("[ERROR] {}".format(e))
        print("STATUS: BLOCKED")
        sys.exit(1)