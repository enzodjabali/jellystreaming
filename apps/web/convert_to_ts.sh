#!/bin/bash
# Helper script to show which files need TypeScript conversion
echo "=== Files that need TypeScript conversion ==="
echo "Components:"
ls -1 src/components/*.js 2>/dev/null | wc -l
echo "Pages:"
ls -1 src/pages/*.js 2>/dev/null | wc -l
