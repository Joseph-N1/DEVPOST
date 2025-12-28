<#
.SYNOPSIS
    Extract ZIP files from docs/skills subfolders into those same subfolders.

.DESCRIPTION
    This script extracts all ZIP archives found in LEGGOOO's docs/skills 
    subdirectories. It safely handles existing files and won't overwrite
    markdown documentation.

.PARAMETER SkillName
    Optional. Extract only a specific skill folder (e.g., "figma-to-code").
    If not provided, extracts all skill ZIPs.

.EXAMPLE
    .\scripts\unpack_skills.ps1
    Extracts all ZIP files from all skill folders.

.EXAMPLE
    .\scripts\unpack_skills.ps1 -SkillName "figma-to-code"
    Extracts only ZIPs from the figma-to-code skill folder.

.NOTES
    Author: LEGGOOO Team
    Safety: Does NOT overwrite existing .md files
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $false)]
    [string]$SkillName
)

# Script configuration
$ErrorActionPreference = "Stop"

# Get paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$SkillsDir = Join-Path $ProjectRoot "docs\skills"

# Colors for output
function Write-Success { param($Message) Write-Host $Message -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host $Message -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host $Message -ForegroundColor Red }
function Write-Info { param($Message) Write-Host $Message -ForegroundColor Cyan }

# Function to extract a single ZIP file
function Expand-SkillZip {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ZipPath
    )
    
    $TargetDir = Split-Path -Parent $ZipPath
    $ZipName = [System.IO.Path]::GetFileNameWithoutExtension($ZipPath)
    $TempDir = Join-Path $TargetDir ".tmp_extract_$([System.Guid]::NewGuid().ToString('N').Substring(0,8))"
    
    Write-Warning "Extracting: $ZipPath"
    
    try {
        # Create temp directory
        New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
        
        # Extract ZIP to temp directory
        Expand-Archive -Path $ZipPath -DestinationPath $TempDir -Force
        
        # Get all extracted files
        $ExtractedFiles = Get-ChildItem -Path $TempDir -Recurse -File
        
        foreach ($File in $ExtractedFiles) {
            $RelativePath = $File.FullName.Substring($TempDir.Length + 1)
            $TargetFile = Join-Path $TargetDir $RelativePath
            $TargetSubDir = Split-Path -Parent $TargetFile
            
            # Create subdirectory if needed
            if (-not (Test-Path $TargetSubDir)) {
                New-Item -ItemType Directory -Path $TargetSubDir -Force | Out-Null
            }
            
            # Check if it's a markdown file that already exists
            if ($TargetFile -like "*.md" -and (Test-Path $TargetFile)) {
                Write-Host "  Skipped (exists): $RelativePath" -ForegroundColor Yellow
            }
            else {
                Move-Item -Path $File.FullName -Destination $TargetFile -Force
                Write-Host "  Extracted: $RelativePath" -ForegroundColor Green
            }
        }
        
        Write-Success "Done: $ZipName"
        return $true
    }
    catch {
        Write-Error "Failed to extract: $ZipPath"
        Write-Error $_.Exception.Message
        return $false
    }
    finally {
        # Cleanup temp directory
        if (Test-Path $TempDir) {
            Remove-Item -Path $TempDir -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# Function to process a skill folder
function Process-SkillFolder {
    param(
        [Parameter(Mandatory = $true)]
        [string]$SkillDir
    )
    
    $SkillFolderName = Split-Path -Leaf $SkillDir
    $ZipFiles = Get-ChildItem -Path $SkillDir -Filter "*.zip" -File -ErrorAction SilentlyContinue
    
    if ($ZipFiles.Count -eq 0) {
        Write-Warning "No ZIP files in: $SkillFolderName"
        return
    }
    
    foreach ($ZipFile in $ZipFiles) {
        Expand-SkillZip -ZipPath $ZipFile.FullName
    }
}

# Main execution
function Main {
    Write-Host "==============================================" -ForegroundColor Cyan
    Write-Host "LEGGOOO Skills Unpacker (PowerShell)" -ForegroundColor Cyan
    Write-Host "==============================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Check if skills directory exists
    if (-not (Test-Path $SkillsDir)) {
        Write-Error "Error: Skills directory not found at:"
        Write-Error "  $SkillsDir"
        exit 1
    }
    
    # Check if specific skill was requested
    if ($SkillName) {
        $TargetSkill = Join-Path $SkillsDir $SkillName
        
        if (-not (Test-Path $TargetSkill)) {
            Write-Error "Error: Skill folder not found: $SkillName"
            Write-Host ""
            Write-Host "Available skills:" -ForegroundColor Yellow
            Get-ChildItem -Path $SkillsDir -Directory | ForEach-Object { Write-Host "  - $($_.Name)" }
            exit 1
        }
        
        Process-SkillFolder -SkillDir $TargetSkill
    }
    else {
        # Process all skill folders
        $SkillFolders = Get-ChildItem -Path $SkillsDir -Directory
        
        foreach ($Folder in $SkillFolders) {
            Process-SkillFolder -SkillDir $Folder.FullName
            Write-Host ""
        }
    }
    
    Write-Host "==============================================" -ForegroundColor Cyan
    Write-Success "Extraction complete!"
    Write-Host "==============================================" -ForegroundColor Cyan
}

# Run main function
Main
