#!/usr/bin/env python3
"""
Verify and update TrueVow documentation status.
"""

import os

# Documentation files
files = [
    r"C:\Users\yasha\OneDrive\Documents\TrueVow\Cursor\TrueVow-Documentation\TrueVow_PRD.md",
    r"C:\Users\yasha\OneDrive\Documents\TrueVow\Cursor\TrueVow-Documentation\TRUEVOW_COMPLETE_SYSTEM_DOCUMENTATION.txt",
    r"C:\Users\yasha\OneDrive\Documents\TrueVow\Cursor\TrueVow-Documentation\TrueVow-Complete-System-Technical-Documentation-for-Developers.md"
]

print("Documentation Update Verification")
print("=" * 40)

for file_path in files:
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        filename = os.path.basename(file_path)
        print(f"\n{filename}:")
        
        # Check for key indicators
        if "6-service" in content.lower():
            print("  ✓ 6-service model mentioned")
        else:
            print("  ✗ 6-service model not found")
            
        if "February 15, 2026" in content:
            print("  ✓ Updated date present")
        else:
            print("  ✗ Updated date missing")
            
        if "Customer-Success-CORE-Service" in content:
            print("  ✓ CORE service mentioned")
        else:
            print("  ✗ CORE service not found")
            
        if "First-Line-Support-Service" in content:
            print("  ✓ First-Line service mentioned")
        else:
            print("  ✗ First-Line service not found")
    else:
        print(f"{file_path}: NOT FOUND")

print("\n" + "=" * 40)
print("STATUS: UNVERIFIED - Manual verification needed")