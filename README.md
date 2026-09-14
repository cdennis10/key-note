# Piano Note Trainer

A private-by-default note-reading practice app for piano students. It is a static React + TypeScript site and needs no backend, API key, database, or runtime service.

## Classroom access and roster

The app opens on a four-digit PIN screen. The administrator PIN is `0842`. After signing in, the administrator can:

- Add a student and assign or generate a unique four-digit PIN.
- View cumulative notes practiced, unassisted first-try accuracy, best streak, completed fixed-length sessions, and last-practiced date.
- Reset a student’s progress or remove the student.
- Open the practice setup without recording progress against a student.

Students use their assigned PIN and see their own practice setup. Each completed question updates their record, including Free Practice. Hints, reveals, and retries do not receive first-try credit.

Because this version remains a static GitHub Pages app, the roster, PINs, and progress are stored only in that browser’s local storage. An administrator adding a student on one computer does **not** create that student on another device. The PIN screen is a classroom convenience barrier, not secure server-backed authentication: someone with access to the browser’s stored data or published source can inspect it. Do not reuse sensitive PINs. Shared, cross-device accounts require a backend authentication and database service.

## Practice modes

- **Easy:** four unique letter-name choices, with number keys 1–4.
- **Medium:** type one letter, A–G. Case and surrounding spaces are ignored.
- **Hard:** play the exact written pitch into the microphone, or choose the clearly labeled on-screen piano alternative. Teachers can optionally accept any octave.

The microphone is requested only after the student clicks **Enable microphone**. Audio is analyzed in memory on the device using normalized autocorrelation and is never recorded, stored, or uploaded. A pitch must be clear and stable for about 300 ms and within 40 cents. Those values are practical starting points, not a guarantee across every room, instrument, or device.

## Exact note ranges

Only natural notes are used.

| Clef | Beginner (within staff) | Expanded (ledger notes included) |
| --- | --- | --- |
| Treble | E4 through F5 | C4 (middle C) through A5 |
| Bass | G2 through A3 | E2 through C4 (middle C) |

Octave numbering follows scientific pitch notation: middle C is C4, and concert A is A4 = 440 Hz.

## Run locally

Install [Node.js 22 or newer](https://nodejs.org/), open a terminal in this folder, and run:

```bash
npm install
npm run dev
```

Open the local address Vite prints. `localhost` is considered secure by browsers, so microphone testing works there.

Before publishing, run the same checks used by GitHub Actions:

```bash
npm run check
npm test
npm run build
```

The production files are written to `dist/`. Vite uses a relative base path, so scripts and styles work from a repository subdirectory without guessing a GitHub username or repository name. The app uses no client-side routes that need server rewrites.

## Publish with GitHub Pages

1. Create a new GitHub repository. Public repositories support Pages on GitHub Free; private-repository Pages availability depends on the account/organization plan and policy.
2. Add this folder to that repository and push it to the repository’s default branch (`main` is recommended). Do not reuse a repository that already publishes an unrelated Pages site.
3. On GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, set **Source** to **GitHub Actions**.
5. Open the **Actions** tab. The “Test and deploy to GitHub Pages” workflow runs after a push to `main` or `master`; it can also be started with **Run workflow**.
6. When the deploy job succeeds, its summary and **Settings → Pages** show the public HTTPS URL. Open that exact URL in a private browser window to verify it before sharing it with students.

The workflow installs from `package-lock.json` with `npm ci`, type-checks, tests, builds, and deploys `dist`. No repository secrets are needed.

To publish future changes, commit and push them to the default branch. The workflow redeploys automatically.

## Sharing a configured practice

Use **Copy practice link** on the setup screen. The link includes only difficulty, clef, range, and session length. It never includes results or personal information. If clipboard access is blocked, the app shows the link in a copyable browser prompt.

## Microphone troubleshooting

- The published page must use HTTPS. GitHub Pages does this automatically.
- If permission was denied, use the lock/site-controls icon beside the browser address, allow microphone access for the site, reload, and click **Enable microphone** again.
- Check the operating system’s microphone privacy settings and confirm that the intended microphone is connected.
- Play one note at a time, reduce background noise, and move the device closer to the piano.
- Some browsers and school-managed devices block microphone access. Easy, Medium, and the on-screen piano remain available.
- App-generated “Hear this note” audio pauses microphone scoring until the sound decays, preventing the app from answering itself.

## Missing assets or a blank published page

Confirm the GitHub Actions deploy job completed, that Pages uses **GitHub Actions** rather than “Deploy from a branch,” and that the repository contains the generated `package-lock.json`. Inspect the failed Actions step for the exact type-check, test, or build error. All production asset links are emitted relative to the current Pages directory.

## Testing scope and privacy

Automated tests cover PIN validation and uniqueness, administrator and student sign-in, roster persistence, per-student progress recording, note/range mapping, staff positions, typed validation, choice uniqueness, no-repeat generation, scoring, share parameters, pitch conversion, synthetic pitch detection, silence/noise rejection, stable-note gating, octave behavior, and prevention of repeat scoring during a sustained note.

Synthetic waveform tests are not real acoustic-piano validation. Microphone results vary with tuning, harmonics, room noise, device processing, distance, and browser hardware. Validate Hard mode on the actual devices and pianos students will use.

Student display names, classroom PINs, preferences, and progress stay in this browser’s local storage and do not sync or leave the device through the app. The app collects no emails, analytics, or advertising identifiers. The hosting provider may retain ordinary web access logs under its own policies.
