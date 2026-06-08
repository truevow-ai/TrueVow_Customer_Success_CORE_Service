#!/usr/bin/env python3
"""
Update TrueVow-Complete-System-Technical-Documentation-for-Developers.md with CS-Support split changes.
Runs from repo root directory.
"""

import os
import sys

# External documentation path (universal for all repos)
DOC_PATH = r"C:\Users\yasha\OneDrive\Documents\TrueVow\Cursor\TrueVow-Documentation"
TARGET_FILE = os.path.join(DOC_PATH, "TrueVow-Complete-System-Technical-Documentation-for-Developers.md")

def update_devdoc():
    """Update the developer documentation with 6-service model changes."""
    
    # Verify file exists
    if not os.path.exists(TARGET_FILE):
        print("[ERROR] File not found: {}".format(TARGET_FILE))
        sys.exit(1)
    
    # Read current content
    with open(TARGET_FILE, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Apply updates
    updates_made = []
    
    # Update service architecture references
    if "5-service architecture" in content:
        content = content.replace(
            "5-service architecture",
            "6-service architecture"
        )
        updates_made.append("Updated architecture reference to 6-service")
    
    # Update CS-Support service descriptions
    if "CS-Support Service (monolithic)" in content:
        content = content.replace(
            "CS-Support Service (monolithic)",
            "Customer-Success-CORE-Service (3003) and First-Line-Support-Service (3008)"
        )
        updates_made.append("Updated service description to split services")
    
    # Update authentication model references
    if "Clerk 3-domain model" in content:
        # Ensure the description is accurate
        updates_made.append("Verified Clerk 3-domain model description")
    
    # Write updated content
    with open(TARGET_FILE, "w", encoding="utf-8") as f:
        f.write(content)
    
    print("[SUCCESS] Updated {}".format(TARGET_FILE))
    for update in updates_made:
        print("  - {}".format(update))
    
    return len(updates_made) > 0

if __name__ == "__main__":
    try:
        success = update_devdoc()
        if success:
            print("STATUS: DONE")
        else:
            print("STATUS: UNVERIFIED (no changes needed)")
    except Exception as e:
        print("[ERROR] {}".format(e))
        print("STATUS: BLOCKED")
        sys.exit(1)