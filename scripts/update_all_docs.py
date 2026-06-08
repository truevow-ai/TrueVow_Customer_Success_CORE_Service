#!/usr/bin/env python3
"""
Master script to update all TrueVow documentation files.
Runs all three update scripts in sequence.
"""

import subprocess
import sys
import os

def run_script(script_name):
    """Run a Python script and return success status."""
    try:
        print("")
        print("[RUNNING] {}...".format(script_name))
        result = subprocess.run([
            sys.executable, 
            "scripts/{}".format(script_name)
        ], capture_output=True, text=True, cwd=os.getcwd())
        
        if result.returncode == 0:
            print(result.stdout)
            return True
        else:
            print("[FAILED] {}:".format(script_name))
            print(result.stderr)
            return False
    except Exception as e:
        print("[ERROR] running {}: {}".format(script_name, e))
        return False

def main():
    """Run all documentation update scripts."""
    scripts = [
        "update_prd.py",
        "update_sysdoc.py", 
        "update_devdoc.py"
    ]
    
    print("[START] Updating all TrueVow documentation files...")
    print("=" * 50)
    
    success_count = 0
    total_scripts = len(scripts)
    
    for script in scripts:
        if run_script(script):
            success_count += 1
        else:
            print("[WARNING] {} failed - continuing with others...".format(script))
    
    print("")
    print("=" * 50)
    print("[RESULTS] {}/{} scripts succeeded".format(success_count, total_scripts))
    
    if success_count == total_scripts:
        print("[SUCCESS] ALL DOCUMENTATION UPDATES COMPLETED")
        print("STATUS: DONE")
        return 0
    elif success_count > 0:
        print("[PARTIAL] Some updates failed")
        print("STATUS: UNVERIFIED")
        return 1
    else:
        print("[FAILED] NO UPDATES COMPLETED")
        print("STATUS: BLOCKED")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)