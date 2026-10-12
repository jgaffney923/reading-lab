# Tickets

Each ticket is one markdown file in this folder: `NNNN-short-slug.md`. Agents follow [PROTOCOL.md](PROTOCOL.md).

## Create a ticket from your phone

1. In the GitHub app or github.com, open `tickets/TEMPLATE.md` and copy its text.
2. **Add file → Create new file** in `tickets/`, named with the next unused number, e.g. `0007-rain-sounds.md`.
3. Paste, then fill in `id`, `title`, `priority`, `depends_on`, `agent`, Goal, Context, and Acceptance criteria. Leave `status: todo` and the Log empty. Set `model` only if you want a specific one; otherwise leave it empty and the coordinator proposes one.
4. Commit straight to `main`. (Ticket files aren't app code.)

Keep tickets free of personal information: the repo may be public.

## Assign and run tickets from Agent HQ

`.\scripts\next.ps1` (in Agent HQ) shows what's waiting for you and what the agents can do; `next.ps1 -Run` does it. The steps behind it:

1. `write-tickets.ps1`: drafts tickets from an idea or a section of PLAN.md (PR).
2. `assign-tickets.ps1`: picks an agent and model for each new ticket, or `plan: needed` for big ones (PR).
3. `plan-tickets.ps1`: the Architect writes a design plan into each `plan: needed` ticket, checked by the other tool (PR; merging approves it).
4. `run-tickets.ps1`: builds each ready ticket in its own worktree and pushes a `ticket/*` branch.
5. `test-tickets.ps1` and `review-tickets.ps1`: the Tester, UX designer and reviewer comment on the PR.
6. You add the `ready to merge` label; `merge-tickets.ps1` merges it.

## Start work in VS Code

- **Claude Code:** "Work ticket 0007", or "work the next ticket".
- **Copilot:** pick the **coordinator** agent and say "work the next ticket", or tell normal Copilot chat "work ticket 0007".

The agent works on a branch `ticket/<id>-<slug>` and stops at `status: review` (finished) or `status: blocked` (has a question for you in the Log).

## Review loop

1. Check the branch: read the ticket's Log, look at the diff, and try the app.
2. If it's good, merge the branch into `main` (a pull request on GitHub works from your phone).
3. On `main`, set the ticket's `status: done`.
4. If it's blocked, answer the question in the Log on the ticket branch, set `status: in-progress`, and ask the agent to continue.
