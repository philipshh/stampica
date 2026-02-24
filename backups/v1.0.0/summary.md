# Checkpoint v1.0.0 - "The Refined Dither Engine"
**Date:** 2025-12-26

## Key Features in this Version:
1. **Dynamic Header Colors**: Rectangles in the poster header now live-sync with the selected dither palette (Modes: Mono, Duo, Trio, Quad, RGB).
2. **OMDb TV Show Support**: The movie search now includes TV Shows with intelligent "Director" fallback (Writer/Actor) for series.
3. **Refined UI**:
   - Dither Algorithms (Atkinson/Threshold) moved to the top of the Effects tab as quick-select buttons.
   - Simplified Color Mode selection.
   - Header rectangles limited to 4 for a balanced aesthetic.
4. **Streamlined Engine**: Removed Stucki and Floyd-Steinberg algorithms to focus on the highest quality results.
5. **Fixed Imports**: Resolved issues with Web Worker imports.

## How to restore:
Files are backed up in `/Users/filipsosevic/Desktop/Antigravity/Posters/backups/v1.0.0/`.
To restore, copy the contents of that folder back into the root directory.
