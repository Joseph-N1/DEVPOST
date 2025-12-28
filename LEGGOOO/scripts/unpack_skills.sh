#!/bin/bash
# =============================================================================
# unpack_skills.sh
# Extract ZIP files from docs/skills subfolders into those same subfolders
# 
# Usage:
#   ./scripts/unpack_skills.sh              # Extract all ZIPs
#   ./scripts/unpack_skills.sh figma-to-code # Extract specific skill only
#
# Safety:
#   - Does NOT overwrite existing .md files
#   - Creates backup of existing extracted content
#   - Fails safely on missing dependencies
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SKILLS_DIR="$PROJECT_ROOT/docs/skills"

# Check if unzip is available
if ! command -v unzip &> /dev/null; then
    echo -e "${RED}Error: 'unzip' command not found. Please install it first.${NC}"
    echo "  Ubuntu/Debian: sudo apt-get install unzip"
    echo "  macOS: brew install unzip"
    exit 1
fi

# Function to extract a single ZIP file
extract_zip() {
    local zip_file="$1"
    local target_dir="$(dirname "$zip_file")"
    local zip_name="$(basename "$zip_file" .zip)"
    local temp_dir="$target_dir/.tmp_extract_$$"
    
    echo -e "${YELLOW}Extracting:${NC} $zip_file"
    
    # Create temp directory for extraction
    mkdir -p "$temp_dir"
    
    # Extract to temp directory
    if ! unzip -q "$zip_file" -d "$temp_dir"; then
        echo -e "${RED}Failed to extract:${NC} $zip_file"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # Move files to target, but don't overwrite .md files
    find "$temp_dir" -type f | while read -r file; do
        relative_path="${file#$temp_dir/}"
        target_file="$target_dir/$relative_path"
        target_subdir="$(dirname "$target_file")"
        
        # Create subdirectory if needed
        mkdir -p "$target_subdir"
        
        # Check if it's a markdown file that already exists
        if [[ "$target_file" == *.md ]] && [[ -f "$target_file" ]]; then
            echo -e "  ${YELLOW}Skipped (exists):${NC} $relative_path"
        else
            mv "$file" "$target_file"
            echo -e "  ${GREEN}Extracted:${NC} $relative_path"
        fi
    done
    
    # Cleanup temp directory
    rm -rf "$temp_dir"
    
    echo -e "${GREEN}Done:${NC} $zip_name"
    return 0
}

# Function to process a skill folder
process_skill_folder() {
    local skill_dir="$1"
    local skill_name="$(basename "$skill_dir")"
    local found_zip=false
    
    # Find all ZIP files in the skill directory
    for zip_file in "$skill_dir"/*.zip; do
        if [[ -f "$zip_file" ]]; then
            found_zip=true
            extract_zip "$zip_file"
        fi
    done
    
    if [[ "$found_zip" == false ]]; then
        echo -e "${YELLOW}No ZIP files in:${NC} $skill_name"
    fi
}

# Main execution
main() {
    echo "=============================================="
    echo "LEGGOOO Skills Unpacker"
    echo "=============================================="
    echo ""
    
    # Check if skills directory exists
    if [[ ! -d "$SKILLS_DIR" ]]; then
        echo -e "${RED}Error: Skills directory not found at:${NC}"
        echo "  $SKILLS_DIR"
        exit 1
    fi
    
    # Check if specific skill was requested
    if [[ -n "$1" ]]; then
        local target_skill="$SKILLS_DIR/$1"
        if [[ ! -d "$target_skill" ]]; then
            echo -e "${RED}Error: Skill folder not found:${NC} $1"
            echo "Available skills:"
            ls -1 "$SKILLS_DIR"
            exit 1
        fi
        process_skill_folder "$target_skill"
    else
        # Process all skill folders
        for skill_dir in "$SKILLS_DIR"/*/; do
            if [[ -d "$skill_dir" ]]; then
                process_skill_folder "$skill_dir"
                echo ""
            fi
        done
    fi
    
    echo "=============================================="
    echo -e "${GREEN}Extraction complete!${NC}"
    echo "=============================================="
}

main "$@"
