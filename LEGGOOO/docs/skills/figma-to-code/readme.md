Figma to Code - Claude Code Skill
A Claude Code skill that generates production-ready React/Next.js code from Figma designs with systematic workflows, component reuse strategies, and Figma variant mapping.

Features
Systematic Figma MCP Tool Usage: Enforces proper metadata → context → screenshot → variables workflow
Component Reuse First: Prioritizes using existing components over creating new ones
Variant Mapping: Automatically maps Figma variant properties to code props
Frontend-Only Focus: Maintains strict boundaries between frontend and backend code
Type-Safe: Generates TypeScript components with proper typing
Accessible: Includes ARIA attributes and semantic HTML
Mock Data Support: Implements frontend with mock data when backend APIs are needed
Prerequisites
Claude Code (Claude Code CLI or Claude Desktop) installed
Figma MCP Server installed (installation guide)
Figma Desktop app running
React/Next.js project (or compatible framework)
Installation
For Claude Code CLI:

Clone or download this repository

Copy to your Claude Code skills directory:

# macOS/Linux

cp -r figma-to-code ~/.claude-code/skills/

# Windows

xcopy figma-to-code %USERPROFILE%\.claude-code\skills\figma-to-code\ /E /I
Configure for your project - Customize SKILL.md and examples.md by replacing placeholders:

Directory Structure:

[FRONTEND_DIR] - Your frontend directory (e.g., src, app, client)
[BACKEND_DIR] - Your backend directory (e.g., server, backend, api)
[COMPONENTS_DIR] - Components directory (e.g., components, src/components)
[PAGES_DIR] - Pages/routes directory (e.g., app, pages)
[TYPES_DIR] - TypeScript types directory (e.g., types, @/types)
Styling System:

[STYLING_UTILITY] - Your styling utility (e.g., cn, classNames, clsx)
[VARIANT_SYSTEM_IMPLEMENTATION] - Your variant system (e.g., CVA, styled-components)
[RESPONSIVE_LAYOUT_CLASSES], [THEME_AWARE_CLASSES] - Your styling patterns
Design Tokens:

[YOUR_PRIMARY_COLOR_TOKEN] - Primary color variable (e.g., primary-600, brand-blue)
💡 Tip: Use Claude Code to help! Ask: "Replace all placeholders in SKILL.md and examples.md with my project's implementation details"

Restart Claude Code

For Claude Desktop:

⚠️ Note: Claude Desktop App may have limited capabilities in code creation compared to Claude Code CLI, as this skill is primarily tailored for Claude Code's development environment.

Download or clone this repository

Configure according to steps above

Create a .zip file of the configured figma-to-code folder

Open Claude Desktop app → Settings → Capabilities → Skills → Upload skill

Select your figma-to-code.zip file and the skill will be validated and activated

Configuration
MCP Output Limits
When working with Figma designs, you may encounter MCP output limit warnings as the Figma MCP server can return large amounts of data (design metadata, screenshots, variables).

By default, Claude Code shows a warning when MCP tool output exceeds 10,000 tokens, with a maximum limit of 25,000 tokens.

If you encounter output warnings or limits, increase the maximum using the MAX_MCP_OUTPUT_TOKENS environment variable:

# Set higher limit before starting Claude Code

export MAX_MCP_OUTPUT_TOKENS=50000
claude
For more details, see the MCP output limits documentation.

Usage
Provide a Figma design link to Claude Code (e.g., "Generate code from this Figma design: [figma-link]").

The skill automatically:

Fetches design metadata, context, and screenshots using Figma MCP tools
Searches for existing components in your codebase
Generates TypeScript code following your project's conventions
Maps Figma variants to component props
Implements mock data patterns when backend APIs are needed
See examples.md for detailed workflow examples and common patterns.
