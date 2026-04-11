# Mureka Imaging Drop Folder

This folder is the landing zone for sung station imaging generated on the
[Mureka web UI](https://www.mureka.ai). Drop the files you downloaded from
Mureka here, edit `manifest.json`, then run the ingestion script — it will
trim, upload, and wire the assets into the live station.

## Workflow (web-tier / $10 plan)

1. **Generate on Mureka's web UI.** For each asset type, generate one or two
   takes and download the mp3. Good prompts to try:
   - *Sung station logo (3-5 sec hook):*
     `short sung country radio station ID, female voice, upbeat, "North Country Radio", 5 seconds`
   - *Sung sweeper (3-5 sec):*
     `sung acoustic country sweeper, male voice, "the best of today and yesterday", 4 seconds`
   - *Sung TOH bumper (5-8 sec):*
     `sung country radio top of the hour, "North Country Radio — the heart of Americana"`
   - *Sung show jingle:*
     `sung Americana jingle for "Morning Drive with Hank Westwood", warm male voice`
2. **Drop the downloaded mp3s into `drop/mureka-imaging/`.**
3. **Copy `manifest.example.json` to `manifest.json`** and fill in one entry
   per file. See "Manifest format" below.
4. **Run the ingestion script:**
   ```bash
   npx tsx scripts/ingest-mureka-assets.ts
   ```
   It will:
   - Trim each file to your chosen hook window using ffmpeg
   - Upload the trimmed mp3 to R2 (production) or `/public/audio/` (dev)
   - scp the file to Hetzner at `/mnt/audio_library/station_assets/truefans-radio-assets/<folder>/<category>/`
   - Create a `ProducedImaging` DB row so the imaging rotation sees it
   - Move the processed source file into `drop/mureka-imaging/processed/`
5. **Wait one clock cycle** — Liquidsoap will pick up the new file on the next
   category rotation. No restart needed.

## Workflow (API tier)

If you later upgrade to Mureka's API tier (starts around $30 pay-as-you-go):

1. Set `MUREKA_API_KEY` in `.env`.
2. Run `npx tsx scripts/generate-mureka-imaging.ts` — it will generate the
   full imaging pack automatically and pipe the results through the same
   ingestion pipeline.

## Manifest format

`manifest.json` is a JSON array. Each entry:

```json
{
  "file": "sung_logo_01.mp3",
  "folder": "station_male",
  "category": "openers",
  "trimStartSec": 8.5,
  "trimDurationSec": 5.0,
  "name": "NCR Sung Logo 1 — female upbeat",
  "prompt": "short sung country radio station ID, female voice, 'North Country Radio'"
}
```

| field             | required | notes                                                                       |
| ----------------- | -------- | --------------------------------------------------------------------------- |
| `file`            | yes      | Filename in `drop/mureka-imaging/` — include the `.mp3` extension           |
| `folder`          | yes      | Target folder on Hetzner: `station_male`, `station_female`, `hank_westwood`, `loretta_merrick`, `doc_holloway`, `cody_rampart`, `night_owl` |
| `category`        | yes      | Subfolder: `openers`, `sweepers`, `toh`, `teasers`, `features`              |
| `trimStartSec`    | yes      | Where the hook starts in the Mureka source file (seconds, decimals ok)      |
| `trimDurationSec` | yes      | How many seconds of the hook to keep (3-8 is typical for a logo)            |
| `name`            | yes      | Human-readable name, stored in DB `ProducedImaging.name`                    |
| `prompt`          | no       | Original Mureka prompt, stored in DB metadata for provenance                |

**Picking `trimStartSec` and `trimDurationSec`:** play the Mureka file in any
audio player, note the seconds where the best sung hook begins, enter that as
`trimStartSec`. Keep `trimDurationSec` short — 3-6 seconds is perfect for a
station ID; 8-12 seconds for a full TOH bumper. The trim is lossless — rerun
the script with different numbers if you want to tweak.

## Gitignore

Everything in this folder except `README.md` and `manifest.example.json` is
gitignored. The source mp3s from Mureka stay local to your machine; only the
trimmed, processed versions get uploaded to R2 and Hetzner.
