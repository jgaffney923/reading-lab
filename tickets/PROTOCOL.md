# Ticket protocol

Every agent (Claude Code, GitHub Copilot, or anything else) follows these rules when working a ticket in this folder. This repo's `CLAUDE.md` adds app-specific rules: how to check your work, design rules, and anything that must never happen. Follow both. If they disagree about how to write code, `CLAUDE.md` wins; if they disagree about branches, status, or logging, this file wins.

## Tickets

- One file per ticket: `tickets/NNNN-short-slug.md` (four-digit id, lowercase slug), copied from `TEMPLATE.md`.
- `status` moves: `todo` → `in-progress` → `review` → `done`, or `blocked` along the way.
- **Tickets are committed to the repo and may be public.** Never put personal information in a ticket, log, or commit message: no names of family members or children, ages, photos, addresses, emails, locations, or anything else that identifies a person. Say "the owner" or "the kids".

## Picking the next ticket

When asked to "work the next ticket", choose the ticket that:

1. has `status: todo`,
2. has `agent` set to your tool (`claude` or `copilot`) or `any`,
3. has every ticket in `depends_on` at `status: done`,
4. isn't waiting for a design plan (`plan: needed`), and
5. has no `ticket/<id>-*` branch yet (someone else is on it).

Take the lowest `priority` number first, then the lowest id. If nothing qualifies, say so and say what is blocking.

A ticket's `model` says which model Agent HQ's runner launches for it. If you're working it some other way, that's fine; just log the model you are.

Big tickets get a **design plan** first: `plan: needed` means Agent HQ's Architect will write a `## Design plan` section into the ticket and the owner approves it by merging; then `plan: done`.

## Working a ticket

1. **One ticket per session.** Read the ticket, and every ticket in its `depends_on`, before starting.
2. **Branch:** work on `ticket/<id>-<slug>`, created from an up-to-date `main`. Never commit to `main`, push to `main`, or merge anything into `main`. The owner reviews and merges every ticket.
3. **Claim it:** set `status: in-progress`, add a log entry, and commit that first.
4. **Follow existing patterns** in the codebase. Read similar code before writing new code. If the ticket has a `## Design plan`, the owner approved it: follow it. If something in it turns out wrong or impossible, do the sensible thing and explain the change in the log; if it's a big change, block and ask.
5. **Stay in scope.** If you find extra work, create a new ticket from `TEMPLATE.md` (next unused id, `status: todo`, log line "created by agent from ticket <id>") instead of doing it.
6. **If blocked:** set `status: blocked`, write the specific question in the log, commit, and stop. Don't guess at decisions that belong to the owner.
7. **Log as you go:** append a short log line at each meaningful step (claimed, plan, main change done, checks run), not just at the end. The dashboard reads these.
8. **When finished:** tick every acceptance criterion you met, run the checks described in `CLAUDE.md`, set `status: review`, and append a log entry covering what was done, how it was checked, and anything left over. If a criterion isn't met, say so in the log instead of ticking it.
9. **Commit messages:** `ticket <id>: <summary>`.
10. **Only the owner sets `done`**, after reviewing and merging.

## Content tickets

A ticket with `kind: content` adds or changes facts, data, text or spoken lines rather than code (for example a batch of plant facts, word lists, or narration). On top of the rules above:

- **Every fact has a source** you actually read: a link or a book and page, recorded where the app keeps sources. Prefer primary, reliable sources (government agencies, university extension services, recognised references).
- **Your own words.** Never copy text from a source; facts aren't owned, but wording is.
- **Never guess.** If no reliable source gives a value, leave it blank or mark it unknown, as the app does.
- **Note disagreements.** When sources differ, record the range or each source's value, not an average you made up.
- Follow the app's own data format and run its checks, as for any ticket.
- Agent HQ reviews content tickets with a fact-check: the checker opens each cited source and confirms it says what the ticket claims.

## Log entries

One line each, newest at the bottom:

```
- YYYY-MM-DD [claude|copilot] (model): what happened
```

Example: `- 2026-10-07 [copilot] (sonnet): added sound effects`. Include the model name if you know it; leave out the parentheses if you don't.
