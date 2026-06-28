# Walkthrough - Negative & Positive Upgrades

I have redesigned and completely updated the **Negative & Positive** game! Below is a summary of the improvements, structural modifications, and animations introduced.

---

## 🛠️ Summary of Changes

### 1. Modern Glassmorphism Theme & Design System
- Added global design system tokens to [globals.sass](file:///c:/Users/gorke/Documents/GitHub/Splend-Game/styles/globals.sass) using custom CSS properties for cybernetic glowing primary colors, success states, and error alerts.
- Configured Google Fonts integration: **Orbitron** (for cyberpunk and scoreboard displays) and **Plus Jakarta Sans** (for clean UI/rules text).
- Re-architected layouts using full-screen viewport settings, customized scrollbars, and card highlights.

### 2. Interactive 3D Background (Three.js)
- Implemented a WebGL-based [ThreeBg.tsx](file:///c:/Users/gorke/Documents/GitHub/Splend-Game/components/games/ThreeBg.tsx) component.
- Dynamically generates a field of **1,800 custom particle stars** shaded with neon blues, cyans, and purples.
- Integrates continuous clock-based rotation and smooth easing calculations that map mouse coordinates to shift the starfield coordinates, providing a beautiful 3D parallax effect.
- Features server-side rendering checks (wrapping Three.js initialization inside React `useEffect` hooks) and full browser window resize safety.

### 3. State Management & Core Game Logic Upgrades
- **Fixed State Updates Bug**: Rebuilt the click and retreat handlers in [score-game.tsx](file:///c:/Users/gorke/Documents/GitHub/Splend-Game/components/games/score-game.tsx) using functional setters (e.g. `SetTotalWin(prev => prev + tier)`) to prevent multiple race-condition points triggers.
- **Unified Target Evaluator**: Implemented a standalone helper function `getHighestTierReached` to evaluate Easy, Medium, and Hard target thresholds for both positive and negative target types.
- **Win Streaks & Persistence**: Added `localStorage` synchronization for total wins, losses, current win streaks, and high score records.
- **Closes Indicator**: Programmed a graphical dot-meter that glows green/blue and pulses red when critical threshold is crossed (closes &le; 3).

### 4. Synthesized Audio Engine (Web Audio API)
- Designed an on-the-fly sound effects generator. Programmed purely with code oscillators and filter envelopes so that **no external audio asset files** are required:
  - **Neutral Click**: Subtly tick sound when opening a standard tile.
  - **Positive Tile Reveal**: Happy arpeggio chord progression.
  - **Negative Tile Reveal**: Descending slide-tone with a low-pass filter.
  - **Close (Undo)**: Sliding up frequency swoop.
  - **Victory**: Major chord melody.
  - **Defeat**: Descending minor slide tones.
- Added a mute toggle button in the HUD which persists the preference in browser storage.

### 5. UI Elements
- **Custom Dual Progress Bar**: Replaced standard MUI controls with a custom horizontal double progress bar split at 0, filled towards the left (red) for negative values and towards the right (green) for positive values.
- **Goal Pins**: Placed interactive marker badges ('E' for Easy, 'M' for Medium, 'H' for Hard) on the bar track that highlight in emerald green when reached.
- **Glassmorphic Modal**: Updated the help popup into a beautiful backdrop-blur modal overlay with glowing step numbers.

### 6. Skill-Based Deduction Upgrade (Anti-RNG)
- **Proximity Radar Scanner**: Hovering over any cell triggers real-time scanning:
  - Displays grid **Coordinates** (Row & Column).
  - Displays the **Neighbor Sum** (sum of adjacent 8 hidden values).
  - Displays neighborhood **Composition** (number of positive vs. negative cells).
  - Triggers a dynamic glowing border on the hovered box: **emerald green** (positive sum), **ruby red** (negative sum), or **purple** (neutral sum).
- **Persistent Cell Clues**: Opened cells display their value in the center, and a small subscript indicating the sum of their 8 neighbors, allowing players to cross-reference multiple clues.
- **Enlarged Layout**: Increased the board max-width to **`860px`** and the dashboard max-width to **`760px`** with balanced heights at **`calc(100vh - 140px)`** to create a stunning high-resolution presence. All typography, padding, and gaps are scaled proportionally.
- **Rules Documentation**: Updated the "How to Play" modal inside [index.tsx](file:///c:/Users/gorke/Documents/GitHub/Splend-Game/pages/index.tsx) to document the proximity sensor and deduction rules.

---

## 🗺️ 7. Harita Seçimi, Zorluk Dereceleri ve Puan Çarpanı (Dynamic Setup)
We have added a custom launch lobby (setup screen) allowing players to configure dimensions, severity levels, and sensor access:

- **Launch Configuration Menu**:
  - **Sector Dimensions (Grid Size)**: Options for `12x12` (Small), `16x16` (Standard), and `20x20` (Large) grid boundaries.
  - **Anomaly Severity (Difficulty)**: Choice of `Kolay` (values [-3, +3]), `Orta` (values [-4, +4]), and `Zor` (values [-5, +5]).
  - **Proximity Radar Switch**: Option to enable/disable neighbor sum hints entirely.
- **Point Multipliers**: Setup selections dynamically factor into a cumulative scoring multiplier:
  - Size multipliers: `12x12` (0.8x), `16x16` (1.0x), `20x20` (1.3x).
  - Difficulty multipliers: `Easy` (1.0x), `Medium` (1.5x), `Hard` (2.0x).
  - Sensor multipliers: `Enabled` (1.0x), `Disabled` (2.0x).
  - Final win points are calculated as `Math.round(basePoints * multiplier)`.
- **Dynamic CSS Columns**: Grid columns and rows are passed as React inline styles using `repeat(gridSize, 1fr)` to scale layout rendering seamlessly.
- **Hardcore Blind Mode**: Disabling the radar sensor turns off cell glows, cell clue subscripts, and coordinate scanner readings. Displays `PROXIMITY RADAR OFFLINE` with the 2x score multiplier warning.
- **Abort Mission Route**: A dedicated red exit button is added under the dashboard actions, allowing players to abort a running mission and return to the main setup screen.
- **Dynamic Closes Limit**: The maximum number of undo closes scales dynamically with difficulty:
  - **Easy**: `12` closes (reset lock threshold: used &le; 5 closes)
  - **Medium**: `8` closes (reset lock threshold: used &le; 3 closes)
  - **Hard**: `5` closes (reset lock threshold: used &le; 2 closes)
  - Warning colors trigger dynamically when closes reach &le; 1/3 of the max limit.
