#!/usr/bin/env bash
# index_skills.sh — Generate INDEX.txt for every ZIP in docs/skills/
# Created by Claude — 2024-12-28 — skills indexing infrastructure
#
# Usage:
#   chmod +x scripts/index_skills.sh
#   ./scripts/index_skills.sh
#
# Description:
#   Iterates through docs/skills/**/*.zip and writes an INDEX.txt file
#   next to each ZIP containing its internal file listing.
#   Does NOT extract any files — purely generates an index.
#
# Requirements:
#   - unzip (standard on most Unix systems, install via apt/brew if missing)
#   - bash 4.x or later (for globstar)
#
# Output:
#   For each file like docs/skills/foo/bar.zip, creates:
#   docs/skills/foo/bar.INDEX.txt
#
###############################################################################

set -euo pipefail

# Enable globstar for **/*.zip matching
shopt -s globstar nullglob

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SKILLS_DIR="$PROJECT_ROOT/docs/skills"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}   LEGGOOO Skills Indexer${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Check if unzip is available
if ! command -v unzip &> /dev/null; then
    echo -e "${RED}ERROR: 'unzip' command not found.${NC}"
    echo "Please install unzip:"
    echo "  - Ubuntu/Debian: sudo apt install unzip"
    echo "  - macOS: brew install unzip"
    echo "  - Windows (Git Bash): should be included"
    exit 1
fi

# Check if skills directory exists
if [[ ! -d "$SKILLS_DIR" ]]; then
    echo -e "${RED}ERROR: Skills directory not found at: $SKILLS_DIR${NC}"
    exit 1
fi

# Find all ZIP files
ZIP_FILES=("$SKILLS_DIR"/**/*.zip)

if [[ ${#ZIP_FILES[@]} -eq 0 ]]; then
    echo -e "${YELLOW}No ZIP files found in $SKILLS_DIR${NC}"
    exit 0
fi

echo -e "Found ${GREEN}${#ZIP_FILES[@]}${NC} ZIP file(s) to index."
echo ""

INDEXED=0
FAILED=0

for zip_file in "${ZIP_FILES[@]}"; do
    # Skip if not a file (safety check)
    [[ -f "$zip_file" ]] || continue
    
    # Generate INDEX.txt path: foo.zip -> foo.INDEX.txt
    index_file="${zip_file%.zip}.INDEX.txt"
    rel_path="${zip_file#$PROJECT_ROOT/}"
    
    echo -e "Indexing: ${CYAN}$rel_path${NC}"
    
    # Generate the index header
    {
        echo "# INDEX for: $(basename "$zip_file")"
        echo "# Generated: $(date -Iseconds 2>/dev/null || date)"
        echo "# Generator: scripts/index_skills.sh"
        echo "#"
        echo "# This file lists the contents of the ZIP archive."
        echo "# To extract, run: scripts/unpack_skills.sh"
        echo "#"
        echo "# =============================================="
        echo ""
    } > "$index_file"
    
    # Append the ZIP listing
    if unzip -l "$zip_file" >> "$index_file" 2>&1; then
        echo -e "  -> Created: ${GREEN}${index_file#$PROJECT_ROOT/}${NC}"
        ((INDEXED++))
    else
        echo -e "  -> ${RED}FAILED to index${NC}"
        echo "# ERROR: Could not read ZIP contents" >> "$index_file"
        ((FAILED++))
    fi
done

echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "Summary:"
echo -e "  Indexed: ${GREEN}$INDEXED${NC}"
echo -e "  Failed:  ${RED}$FAILED${NC}"
echo -e "${CYAN}========================================${NC}"

if [[ $FAILED -gt 0 ]]; then
    exit 1
fi

echo ""
echo -e "${GREEN}Done! INDEX.txt files created for all ZIPs.${NC}"
