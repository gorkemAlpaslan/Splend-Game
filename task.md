# Tasks

- `[x]` Install `three` and `@types/three` dependencies
- `[x]` Implement `ThreeBg.tsx` for the 3D particle background
- `[x]` Update `styles/globals.sass` with modern styling variables & Google Fonts
- `[x]` Refactor `components/games/score-game.tsx` (fix state logic, add SFX, high scores, streaks)
- `[x]` Update `components/games/score-game-style.module.sass` with glassmorphic styles
- `[x]` Update `pages/index.tsx` layout and modal styling
- `[x]` Enlarge the board (780px) and dashboard (700px) layout on desktop & scale sizes proportionally
- `[x]` Implement the Proximity Radar Scanner on cell hover (real-time Coordinates, Neighbor Sum, Composition readout)
- `[x]` Add dynamic glowing hover borders on the grid based on neighbor sums (green/red/purple)
- `[x]` Display Minesweeper-style neighbor sum clues inside opened cells
- `[x]` Update instructions in the "How to Play" modal to explain scanner and deduction rules
- `[x]` Add Game Setup screen for selecting Harita Boyutu (Map Size), Zorluk Dereceleri (Difficulty), and Radar Sensor Toggle
- `[x]` Implement dynamic multiplier scoring math (getSizeMultiplier * getDiffMultiplier * getRadarMultiplier)
- `[x]` Modify grid coordinates, cells, and neighbor scanning bounds to scale dynamically to 12x12, 16x16, and 20x20 sizes
- `[x]` Implement hardcore sensor-disabled gameplay mode (suppressing hover glows, indicators, and corner clues)
- `[x]` Design "Abort Mission" return-to-menu action button
- `[x]` Make the maximum "CLoSES REMAINING" limit and reset lock dynamically scale based on selected difficulty (12 for Easy, 8 for Medium, 5 for Hard)
