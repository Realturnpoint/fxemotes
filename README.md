# Fivem Emotes — Stream Deck Plugin

A Stream Deck plugin for triggering FiveM/RedM emotes via city-specific dropdown menus. Select your server, pick an emote, and play it with a single button press.

## Features

- **City dropdown** — select your RP server (Infinity RP, with room to add more)
- **Emote dropdown** — grouped by category (Greetings, Sitting, Dancing, RP, etc.)
- **On Press** — automatically sends the chosen emote command (`e wave`, `e sit`, etc.)
- **On Release** — configurable command, e.g. `e c` to cancel the emote when you let go
- **Optional button label** — override the key title displayed on the deck

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Stream Deck](https://www.elgato.com/stream-deck) 6.9+
- FiveM (or RedM) running on the same PC

## Setup

```powershell
# 1. Install Node.js from https://nodejs.org/ (LTS recommended)
# 2. Open this folder in a terminal, then:
npm install
```

## Build & Install

```powershell
# One-shot build + package (creates .streamDeckPlugin in dist/)
.\build.ps1

# Then double-click dist\com.turnpoint.fxemotes.streamDeckPlugin to install
# The build stamps a newer plugin version automatically, so this updates in-place
# over your existing install (no uninstall needed).
```

## Updates

- **Automatic inside Stream Deck app** is supported when the plugin is distributed through the Stream Deck Marketplace.
- **GitHub distribution** is supported via Releases: download the newest `.streamDeckPlugin` file and open it to update in-place.
- This repository includes a GitHub Actions release workflow that publishes a fresh `.streamDeckPlugin` asset on version tags.

```powershell
# Watch mode (auto-rebuilds on source changes, for development)
.\build.ps1 -Watch
```

## Usage

1. Drag the **Fivem emotes** action onto your Stream Deck
2. In the settings panel:
   - **City** — pick your server (e.g. *Infinity RP*)
   - **Emote** — choose an emote from the grouped list
   - **On Release** — type `e c` to cancel the emote on key-up (or leave blank)
3. Launch FiveM and press the button — the emote fires immediately

> The plugin talks to FiveM on `127.0.0.1:29200` using the IceCon CMND protocol,
> the same mechanism used by [fxcommands](https://github.com/josh-tf/fxcommands).

## Adding More Cities / Emotes

Edit `src/data/emotes.ts` to add new cities or emotes, then also mirror the same data into `plugin/ui/EmoteActionPI.js` (the `CITIES` object near the top), and rebuild.

## Project Structure

```
fxemotes/
├── src/
│   ├── actions/emote-command.ts   # Stream Deck action handler
│   ├── data/emotes.ts             # City + emote database (TypeScript)
│   ├── connection-manager.ts      # TCP connection to FiveM
│   └── plugin.ts                  # Entry point
├── plugin/
│   ├── manifest.json              # Plugin metadata
│   └── ui/
│       ├── EmoteActionPI.html     # Property Inspector UI
│       ├── EmoteActionPI.js       # PI logic + inline emote database
│       └── sdpi.css               # Standard Stream Deck styles
├── build.ps1                      # Build script (PowerShell)
├── rollup.config.mjs
├── tsconfig.json
└── package.json
```

## License

MIT
