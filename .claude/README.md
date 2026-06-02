# Claude Code Configuration for AllOnePage (website-for-business)

## Directory Structure

```
.claude/
├── settings.json          # Claude Code configuration (hooks, permissions, env)
├── CLAUDE.md              # Development guidelines and conventions
├── README.md              # This file
└── hooks/
    └── branch-protection.sh  # Prevents direct commits to main
```

## Key Settings

- **Package Manager**: pnpm (auto-install hook on package.json change)
- **Branch Protection**: Cannot edit files on main branch
- **Co-author**: All commits include Claude attribution
- **Timeout**: 7 min default for bash commands
- **Context Compression**: Auto-summarize before compaction
