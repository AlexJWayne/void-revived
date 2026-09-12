# Web Port source map

The production source tree follows the Original Game's conceptual organization while using browser-native modules:

- `application/`: startup, capability checks, lifecycle, and top-level navigation
- `graphics/`: the direct WebGL 2 renderer and graphics resources
- `assets/`: source-asset conversion and runtime loading
- `audio/`: music and sound playback
- `combat/`: flight simulation and combat presentation
- `content/`: typed game definitions derived from the Original Game data
- `hyperspace/`: title, map, shipyard, equipment, and other non-combat flows
- `persistence/`: local save data
- `ui/`: shared presentation modules
- `styles/`: global styling and safe-area primitives

Only modules with current behavior are present. Add the remaining directories when their first implementation ticket lands rather than filling the tree with placeholders.
