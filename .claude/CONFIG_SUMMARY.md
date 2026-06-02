# Claude Code Configuration Summary

## ✅ Applied Configuration from claude-code-showcase Reference

This project now follows the best practices from ChrisWiles/claude-code-showcase repository.

### Configuration Structure

```
.claude/
├── settings.json              # Main configuration (hooks, env, permissions)
├── CLAUDE.md                  # Development guidelines & conventions
├── README.md                  # Configuration documentation
├── CONFIG_SUMMARY.md          # This file
└── hooks/
    └── branch-protection.sh   # Prevents editing on main branch
```

### What Was Configured

#### 0. **Token & Context Optimization** (NEW - settings.json)
```json
{
  "cleanupPeriodDays": 7,                    // Auto-delete transcripts after 7 days
  "showClearContextOnPlanAccept": true,      // Show "clear context" on plan approval
  "hooks": {
    "PreCompact": [{                         // Auto-summarize before compression
      "type": "prompt",
      "prompt": "Summarize: 1) task/goal, 2) key decisions, 3) state, 4) next steps"
    }]
  }
}
```

**What it does:**
- Automatically summarizes conversation before context compression happens
- Shows "Clear context" button when you approve a plan (reduces token usage mid-session)
- Deletes old chat transcripts after 7 days to save storage
- Provides checkpoint opportunities to reduce ongoing token consumption

#### 1. **Environment Variables** (settings.json)
```json
{
  "env": {
    "INSIDE_CLAUDE_CODE": "1",
    "BASH_DEFAULT_TIMEOUT_MS": "420000",  // 7 minutes
    "BASH_MAX_TIMEOUT_MS": "420000"
  }
}
```

#### 2. **Automation Hooks** (settings.json)
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "package.json",
        "hooks": [{
          "type": "command",
          "command": "npm install",
          "timeout": 60
        }]
      }
    ]
  }
}
```

**What it does:**
- Automatically runs `npm install` when `package.json` is modified
- Non-blocking (won't stop workflow if it fails)
- 60-second timeout

#### 3. **Permissions** (settings.json)

**Allowed Commands:**
- Node ecosystem: `npm`, `npx`, `node`
- Utilities: `curl`, `find`, `grep`, `ls`, `cat`, `wc`, `du`
- Containerization: `docker`, `docker-compose`
- Cloud: `cloudflared` (Cloudflare tunnels)
- VCS: `git`, `gh` (GitHub CLI)
- Other: `python`, `python3`, `nslookup`, `taskkill`

**Web Access:**
- All domains via WebFetch
- Specific APIs: Ticketmaster Developer, PredictHQ, Docker Hub
- Dev resources: ITNEXT, Dev.to

**File Access:**
- Read: Full access to `/d/allonepage/` directory
- Additional directories: Memory, event, ticket, venue, messages screens

#### 4. **Co-authored Commits**
```json
{
  "includeCoAuthoredBy": true
}
```

**Effect:** All commits include Claude attribution trailer:
```
Co-Authored-By: Claude <noreply@anthropic.com>
```

#### 5. **Development Guidelines** (CLAUDE.md)

Comprehensive guide including:
- Branch protection workflow
- Code quality standards
- TypeScript conventions
- Design system patterns (Turkish UI strings)
- NestJS backend structure
- React Native mobile patterns
- Prisma + MongoDB best practices
- API endpoint conventions
- Testing guidelines
- Environment configuration
- Common development tasks

### Comparison with Reference Repository

| Feature | Reference | Co-Eventier |
|---------|-----------|-------------|
| Environment Variables | ✅ Yes | ✅ Yes |
| Git Branch Protection | ✅ Shell script hook | ✅ Yes (branch-protection.sh) |
| Code Formatting | ✅ Prettier post-hook | ⏳ Manual (npm run format) |
| Test Auto-run | ✅ Post-hook | ⏳ Manual (npm test) |
| npm install hook | ✅ Yes | ✅ Yes |
| Type checking | ✅ tsc hook | ⏳ Manual (npm run lint) |
| Commit attribution | ✅ Yes | ✅ Yes |
| Development docs | ✅ CLAUDE.md | ✅ Yes (comprehensive) |

**Legend:**
- ✅ Fully configured
- ⏳ Available manually (can be added to hooks if needed)

### Token Optimization Features

**Automatic Context Management:**
- PreCompact hook summarizes conversation before compression (saves tokens)
- Old transcripts auto-deleted after 7 days
- "Clear context" button on plan approval (checkpoint to reduce token waste)

**Best Practices:**
- Use specific file paths with line ranges: `Read(file.ts:42-51)` vs reading entire file
- Break large tasks into separate conversations
- Leverage auto-memory instead of repeating context
- Clear context after finishing major features

### Next Steps (Optional Enhancements)

To further match the reference repository, you could add:

1. **Pre-commit formatting hook** (currently manual):
   ```bash
   npm run format  // Run prettier on modified files
   ```

2. **Automated test hook** (currently manual):
   ```bash
   npm test  // Run tests when test files change
   ```

3. **Type checking hook** (currently manual):
   ```bash
   npm run lint  // Run TypeScript compiler
   ```

4. **Pre-commit hook** (git hook):
   ```bash
   husky install  // Set up git hooks with lint-staged
   ```

5. **Skills** (Claude Code domain knowledge):
   - Create `.claude/skills/` directory
   - Add YAML files with project-specific expertise
   - Example: `project-structure.yaml`, `api-patterns.yaml`

6. **Agents** (specialized assistants):
   - Create `.claude/agents/` directory
   - Define agents for specific tasks
   - Example: `backend-agent.yaml`, `mobile-agent.yaml`

### How It Works

#### Session Start
1. Claude Code loads `settings.json` → applies permissions & env vars
2. Claude Code loads `.claude/CLAUDE.md` → reads development guidelines
3. Auto-memory loads from `~/.claude/projects/d--allonepage-co-eventier/memory/`

#### During Development
1. You make file edits using Claude Code
2. Branch protection hook prevents edits to main branch
3. If `package.json` changes → `npm install` runs automatically
4. You commit with claude co-author attribution

#### File Changes
- **settings.json** changes: Restart Claude Code session for new permissions
- **CLAUDE.md** changes: Automatically loaded in new sessions
- **hooks/\*.sh** changes: Take effect on next PostToolUse event

### Troubleshooting

**"Cannot edit files on main branch" error**
→ Create feature branch: `git checkout -b feature/name`

**npm install not running**
→ Make sure you edited `package.json` and the PostToolUse hook is enabled

**Settings not applying**
→ Restart Claude Code session to reload `settings.json`

**Command permission denied**
→ Add permission to `settings.json` "permissions.allow" array and restart

### Files to Keep in Sync

- `.claude/settings.json` - Share with team via git
- `.claude/CLAUDE.md` - Update as project evolves
- `.claude/hooks/*.sh` - Add team-specific automation
- `.claude/README.md` - Document any custom setup

### Resources

- **Claude Code Official Docs**: https://claude.com/claude-code
- **Settings JSON Schema**: https://json.schemastore.org/claude-code-settings.json
- **Reference Repository**: https://github.com/ChrisWiles/claude-code-showcase
- **Co-Eventier CLAUDE.md**: See `.claude/CLAUDE.md` in this project

---

**Last Updated**: 2026-03-27
**Configuration Version**: 1.0
**Reference Repository**: ChrisWiles/claude-code-showcase
