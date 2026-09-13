# Web Port source map

The production source tree follows the Original Game's classes and responsibilities, with browser adapters at the edges.

- `application/`: startup, capability checks, navigation, settings, and the browser accelerometer adapter
- `graphics/`: the shared WebGL 2 renderer, GPU resources, and OpenGL matrix operations
- `assets/`: VMdl parsing; asset conversion lives in `../scripts/`
- `combat/`: `Game` owns the native update sequence; ships, enemies, AI, weapons, effects, and HUD retain their original responsibilities. `FlightInterface` owns the browser animation, input, interruption, and resume lifecycle. `game-state.ts` validates and restores the separate combat archive.
- `content/`: loading definitions and assets produced from the Original Game data
- `hyperspace/`: campaign map and non-combat navigation
- `loadout/`: shipyard, equipment, weapons, and ship preview
- `player/`: committed campaign state and local persistence
- `ui/`: shared controls
- `styles/`: presentation, gesture policy, and safe-area layout

The compiled Objective-C sources listed in `Void.xcodeproj/project.pbxproj`, their XIBs, and original assets govern appearance and behavior. One explicit exception is `GenericButton`: all controls that originally used stretchable button artwork share the existing Web Port title-button styling. The Combat Prototype is only evidence for narrow technical questions; its organization and coding style are not a template.

`Game` extends the shared physics and timing foundation directly. The preliminary simulation coordinator has been retired so there is only one production update sequence. Combat advances at 40 Hz, independently of browser refresh rate. Motion sampling converts browser measurements to the original accelerometer units and landscape direction before applying native steering calculations.

The combat archive and committed player profile remain separate: surviving a gate exit commits collected rewards; defeat and abandonment retain the preflight profile. Browser interruption clears physical touches and restores paused. Audio remains deferred.
