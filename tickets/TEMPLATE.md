---
id: 0000
title: Short title
status: todo        # todo | in-progress | blocked | review | done
priority: 2         # 1 = high, 2 = normal, 3 = low
depends_on: []      # e.g. [0001, 0002]
agent: any          # claude | copilot | any
model:              # e.g. opus, sonnet, gpt-5.5; leave empty and Agent HQ's assign-tickets proposes one
plan:               # needed = the Architect writes a design plan before anyone builds; done = it has one
---

## Goal
What should be true when this is finished, in plain language.

## Context
Relevant files, links, decisions, or gotchas.

## Acceptance criteria
- [ ] ...
- [ ] App builds (or serves) and runs locally with no console errors, and existing features still work
- [ ] Follows the design rules in this repo's CLAUDE.md

## Log
<!-- Agents append entries here. Newest at the bottom. -->
