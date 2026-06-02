#!/bin/bash
# Branch protection hook - prevents edits on main branch
set -e

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

if [ "$CURRENT_BRANCH" = "main" ] || [ "$CURRENT_BRANCH" = "master" ]; then
  echo "❌ Cannot edit files on main branch. Create a feature branch first:"
  echo "   git checkout -b feature/your-feature-name"
  exit 2
fi

exit 0
