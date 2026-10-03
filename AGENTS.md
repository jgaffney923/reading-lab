# AGENTS.md — Reading Lab Jr.

A reading game for a 5-year-old. Read these before changing anything:
1. **PLAN.md**: the design, teaching approach (section 5), milestones and rules.
2. **STATUS.md**: where things stand and what's next.

The rules that matter most:
- **Teaching:** letters before pictures; pure sounds; only words he can sound out with the letters he has (PLAN.md sections 5 and 11). Run `node tools/check-content.mjs` after editing `src/data/phonics.json` or `src/data/narration.json`.
- **Feedback:** never "wrong", never a fail state. When he picks something else, tell him what he picked, replay the sounds, glow the right answer, let him tap it, then celebrate (PLAN.md section 5.3).
- **Kid-safe and offline:** no network calls, no new dependencies, no CDN, no text input.
- **Shell:** shared with `../chemistry app`. Fix bugs found in shared files (audio, save, drag, sw, tools) in both projects when they apply to both.
- Every spoken line lives in `src/data/narration.json`; every word and picture lives in `src/data/phonics.json`.
- Touch targets at least 200 game units (96 CSS px). Test with touch, not just mouse.
