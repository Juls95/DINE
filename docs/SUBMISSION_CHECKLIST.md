# Submission checklist · NEAR HACKATHON (track `thesis`)

Deadline: **2026-11-14T23:59:00Z** (17:59 local time, UTC-6). Every step marked "human" is not done by the agent.

## Repository

- [ ] `pnpm check` is green and `DATA_MODE=live pnpm verify` is green with the real data committed.
- [ ] `git status` shows no `.env`, `gcp-*.json`, `docsReplicate/`, `BLUEPRINT.md` or `data/mock/`.
- [ ] `THESIS.md` is the live version (no "SIMULATED DATA" strip).
- [ ] README: confirm whether the team has another project in the hackathon (Q-015) and, if so, name it.
- [ ] (human) Make the repository public before the deadline.

## Demo

- [ ] (human) Render: create the Static Site from `render.yaml`, branch `main`, deploy after CI passes. Paste `NOTION_TOKEN` as a secret of the service (not in git). Keep it online until 2026-11-25.
- [ ] (human) Record a short video: Agora, open Bison, open a dashboard query and show `pnpm verify` failing on a hand-written number.
- [ ] (human) Publish the post on X with the video.

### Draft of the X post (the human edits and publishes it)

> I built an investment thesis on NEAR at NEAR HACKATHON where no figure is written by hand: three agents (Beary reads X, Bison queries BigQuery and NEAR Intents, Bul writes the thesis) and a verifier that breaks the build when a number without a source appears.
>
> Every chart shows its query. Which on-chain metric would you add to invalidate the thesis?
>
> Demo: <Render URL> · Repo: <repo URL>
>
> @NEARProtocol #NEARHackathon @NearLegion @NearBuilders

## Submission (one time only)

- [ ] Build the payload with `SubmissionPayload` (`src/schemas/submission.ts`): track `thesis`, `demoUrl` = URL of the X post, `projectUrl` = public repo, no `website` field.
- [ ] (human) Review the full JSON and confirm with an explicit "yes".
- [ ] A single POST to `https://nearhackathon.com/api/applications`. A 409 means it already exists: do not resend.
- [ ] Do not commit the payload (it contains personal data).
- [ ] Later errors: (human) `https://nearhackathon.com/request-changes`.
