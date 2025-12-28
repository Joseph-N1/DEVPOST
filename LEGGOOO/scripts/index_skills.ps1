<#
.SYNOPSIS
    Generate INDEX.txt for every ZIP in docs/skills/

.DESCRIPTION
    Iterates through docs/skills/**/*.zip and writes an INDEX.txt file
    next to each ZIP containing its internal file listing.
    Does NOT extract any files — purely generates an index.

.NOTES
    Created by Claude — 2024-12-28 — skills indexing infrastructure
    
.EXAMPLE
    .\scripts\index_skills.ps1
#>

[CmdletBinding()]
param()

# Strict mode for better error handling
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$SkillsDir = Join-Path $ProjectRoot "docs\skills"

# Output helpers
function Write-ColorLine {
    param([string]$Message, [ConsoleColor]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

Write-ColorLine "========================================" Cyan
Write-ColorLine "   LEGGOOO Skills Indexer (PowerShell)" Cyan
Write-ColorLine "========================================" Cyan
Write-Host ""

# Check if skills directory exists
if (-not (Test-Path $SkillsDir)) {
    Write-ColorLine "ERROR: Skills directory not found at: $SkillsDir" Red
    exit 1
}

# Find all ZIP files recursively
$ZipFiles = Get-ChildItem -Path $SkillsDir -Filter "*.zip" -Recurse -File

if ($ZipFiles.Count -eq 0) {
    Write-ColorLine "No ZIP files found in $SkillsDir" Yellow
    exit 0
}

Write-Host "Found " -NoNewline
Write-Host "$($ZipFiles.Count)" -ForegroundColor Green -NoNewline
Write-Host " ZIP file(s) to index."
Write-Host ""

$Indexed = 0
$Failed = 0

# Load .NET assembly for ZIP handling
Add-Type -AssemblyName System.IO.Compression.FileSystem

foreach ($ZipFile in $ZipFiles) {
    # Generate INDEX.txt path: foo.zip -> foo.INDEX.txt
    $IndexFile = $ZipFile.FullName -replace '\.zip$', '.INDEX.txt'
    $RelPath = $ZipFile.FullName.Replace($ProjectRoot, "").TrimStart("\", "/")
    
    Write-Host "Indexing: " -NoNewline
    Write-ColorLine $RelPath Cyan
    
    try {
        # Generate the index header
        $Header = @"
# INDEX for: $($ZipFile.Name)
# Generated: $(Get-Date -Format "o")
# Generator: scripts/index_skills.ps1
#
# This file lists the contents of the ZIP archive.
# To extract, run: scripts/unpack_skills.ps1
#
# ==============================================

"@

        # Open and read ZIP contents
        $Archive = [System.IO.Compression.ZipFile]::OpenRead($ZipFile.FullName)
        
        $Listing = @()
        $Listing += "Archive: $($ZipFile.Name)"
        $Listing += "  Length      Date    Time    Name"
        $Listing += "---------  ---------- -----   ----"
        
        $TotalSize = 0
        foreach ($Entry in $Archive.Entries) {
            $Size = $Entry.Length
            $TotalSize += $Size
            $Date = $Entry.LastWriteTime.ToString("yyyy-MM-dd")
            $Time = $Entry.LastWriteTime.ToString("HH:mm")
            $Name = $Entry.FullName
            
            # Format similar to unzip -l output
            $Line = "{0,9}  {1} {2}   {3}" -f $Size, $Date, $Time, $Name
            $Listing += $Line
        }
        
        $Listing += "---------                     -------"
        $Listing += "{0,9}                     {1} file(s)" -f $TotalSize, $Archive.Entries.Count
        
        $Archive.Dispose()
        
        # Write to file
        $Content = $Header + ($Listing -join "`n")
        Set-Content -Path $IndexFile -Value $Content -Encoding UTF8
        
        $IndexRelPath = $IndexFile.Replace($ProjectRoot, "").TrimStart("\", "/")
        Write-Host "  -> Created: " -NoNewline
        Write-ColorLine $IndexRelPath Green
        $Indexed++
    }
    catch {
        Write-Host "  -> " -NoNewline
        Write-ColorLine "FAILED to index: $_" Red
        
        # Write error to index file
        $ErrorContent = @"
# INDEX for: $($ZipFile.Name)
# Generated: $(Get-Date -Format "o")
# Generator: scripts/index_skills.ps1
#
# ERROR: Could not read ZIP contents
# Exception: $_
"@
        Set-Content -Path $IndexFile -Value $ErrorContent -Encoding UTF8
        $Failed++
    }
}

Write-Host ""
Write-ColorLine "========================================" Cyan
Write-Host "Summary:"
Write-Host "  Indexed: " -NoNewline
Write-ColorLine "$Indexed" Green
Write-Host "  Failed:  " -NoNewline
Write-ColorLine "$Failed" Red
Write-ColorLine "========================================" Cyan

if ($Failed -gt 0) {
    exit 1
}

Write-Host ""
Write-ColorLine "Done! INDEX.txt files created for all ZIPs." Green
