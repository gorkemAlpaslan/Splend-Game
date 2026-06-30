# Implementation Plan - Rebalancing, 3D Enhancements, and 6 New Games

We are expanding the **Splend Game** matrix by balancing the scoring metrics across all games to match the Positive & Negative scale, fixing the rotation direction anomaly in Quantum Link, upgrading the global Three.js particle background with interactive event-based warp drives, and adding **6 new mini-games** to make it a total catalog of 9 puzzle games.

---

## 🛠️ User Review Required

> [!IMPORTANT]
> - **Global Score Re-balancing**: All games will be configured to award between **1 to 5 points** (factoring in difficulty and setup multipliers). This preserves the competitive value of the leaderboard where a single point is highly prized.
> - **Database Expansion**: The new games' scores will sync seamlessly under `stats.games.<game_id>` via `AuthContext.tsx`.

---

## 📂 Proposed Changes

### 1. State Management & Leaderboard Integration

#### [MODIFY] [AuthContext.tsx](file:///c:/Users/gorke/Documents/GitHub/Splend-Game/context/AuthContext.tsx)
- Add initial states in `DEFAULT_STATS` for the 6 new game IDs:
  - `wave_tuner`, `firewall_defuse`, `matrix_runner`, `protocol_stack`, `cipher_decryptor`, `hex_sudoku`.

#### [MODIFY] [leaderboard.tsx](file:///c:/Users/gorke/Documents/GitHub/Splend-Game/pages/leaderboard.tsx)
- Integrate tabs and fetch queries for the 6 new games, rendering leaderboard metrics (Score, Losses, Streak) dynamically.

#### [MODIFY] [index.tsx](file:///c:/Users/gorke/Documents/GitHub/Splend-Game/pages/index.tsx)
- Render all 9 games inside the **Deployment Directory** catalog.
- Adjust the layout style to support a multi-row grid system for game cards.

---

### 2. Gameplay Fixes & 3D Upgrades

#### [MODIFY] [grid-solver-game.tsx](file:///c:/Users/gorke/Documents/GitHub/Splend-Game/components/games/grid-solver-game.tsx)
- **Continuous Rotation Bug**: Let the `tile.rotation` increment grow indefinitely (instead of mapping modulo 4 in the state) to ensure CSS transforms rotate the conduits clockwise continuously without rotating backwards.
- **Score Re-balancing**: Scale down points to 1 point (Easy), 2 points (Medium), 3 points (Hard).

#### [MODIFY] [memory-matrix-game.tsx](file:///c:/Users/gorke/Documents/GitHub/Splend-Game/components/games/memory-matrix-game.tsx)
- **Score Re-balancing**: Update game over/victory stats dispatcher to grant 1 point (Easy), 2 points (Medium), 3 points (Hard) upon completing Level 10.

#### [MODIFY] [ThreeBg.tsx](file:///c:/Users/gorke/Documents/GitHub/Splend-Game/components/games/ThreeBg.tsx)
- **Digital Wave Flow**: Refactor particle positions inside the render loop using a sine wave function `Math.sin(elapsedTime + position.x)` to create a floating digital network mesh.
- **Interactive Event Listener**: Add window event listeners for `'matrix-event'`. On `'victory'` or `'defeat'`, temporarily color-flash the particles (Green/Red) and increase speed (Warp Drive), then ease back to the original blue/purple state.

---

### 3. Six New Games Implementation

#### [NEW] Wave Tuner (Frequency Matcher)
- **Components**: `components/games/wave-tuner-game.tsx`, `components/games/wave-tuner-style.module.sass`, `pages/game/wave-tuner.tsx`
- **Concept**: Use a `<canvas>` to draw two overlapping sine waves: target (green) and player (blue). Adjust Sliders (Amplitude, Frequency, Phase) until waves match.

#### [NEW] Firewall Defuse (Lights Out Puzzle)
- **Components**: `components/games/firewall-defuse-game.tsx`, `components/games/firewall-defuse-style.module.sass`, `pages/game/firewall-defuse.tsx`
- **Concept**: A grid of cells (3x3 to 5x5). Clicking one toggles its state and its immediate neighbors (UP/DOWN/LEFT/RIGHT). Turn all cells off to solve.

#### [NEW] Matrix Runner (Cyber Snake)
- **Components**: `components/games/matrix-runner-game.tsx`, `components/games/matrix-runner-style.module.sass`, `pages/game/matrix-runner.tsx`
- **Concept**: Retro snake game inside a cyber grid canvas. Collect green data-packets to grow; avoid walls and self-collision.

#### [NEW] Protocol Stack (Packet Hanoi Tower)
- **Components**: `components/games/protocol-stack-game.tsx`, `components/games/protocol-stack-style.module.sass`, `pages/game/protocol-stack.tsx`
- **Concept**: Move a stack of network packets from Terminal A to C using B. A larger packet cannot be placed on top of a smaller one.

#### [NEW] Cipher Decryptor (Hex Code Mastermind)
- **Components**: `components/games/cipher-decryptor-game.tsx`, `components/games/cipher-decryptor-style.module.sass`, `pages/game/cipher-decryptor.tsx`
- **Concept**: Guess a hidden 4-digit hexadecimal code. Clues indicate how many digits are correct in digit & position (Green lock) vs correct digit but wrong position (Yellow alert).

#### [NEW] Hex Matrix Sudoku (Hex Sudoku)
- **Components**: `components/games/hex-sudoku-game.tsx`, `components/games/hex-sudoku-style.module.sass`, `pages/game/hex-sudoku.tsx`
- **Concept**: 4x4 Sudoku grid using values `1`, `2`, `3`, `4`. Complete the empty slots such that no value repeats in any row, column, or 2x2 sector.

---

## 🚀 Verification Plan

### Automated Verification
- Observe background Next.js dev server output to verify zero TypeScript compile errors.

### Manual Verification
- Navigate through all 9 games in the lobby directory and test launching them.
- Check that tab selections on Leaderboard correctly display all 9 tabs.
- Verify that solving Quantum Link rotates conduits clockwise continuously.
- Win games to verify Three.js particle bursts (Warp Drive and color shifting).
