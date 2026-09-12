# Original Game runtime guide

This is the navigation map for restoring the Original Game as the Web Port. It
records the structure that is present in the archive; it is not a file-parity
plan or a proposal to reproduce UIKit and OpenGL ES APIs literally.

## Source authority

Use evidence in this order:

1. `Classes/` is authoritative for observable runtime behavior and ownership.
2. The root property lists and `Assets/Stages/*.json` are authoritative for
   content and tuning. `Stages.plist` is the compiled form consumed at runtime;
   `Tools/compile_stages.rb` converts the 81 editable stage JSON files into it.
3. The player-facing XIBs are authoritative for screen composition, labels,
   controls, and transitions. The Xcode project is useful as an index of their
   intended grouping.
4. `Assets/` contains the shipped art, audio, and runtime meshes. Prefer the
   names referenced by source and data over similarly named working files.
5. `ReadMe/` and `Tools/StageEditor/readme.html` explain design intent where the
   runtime is terse. Code and shipped data win if they disagree.
6. `web-prototype/PORTING_NOTES.md` records browser behavior already proven by
   the Combat Prototype. It is reference evidence, not production structure.

The archive is intentionally non-buildable and still contains historical
references to removed integrations. OpenFeint, review solicitation, score
submission, and their UI are outside the Original Game and should be ignored.

## Application flow

`main.m` launches UIKit through `MainWindow.xib`; `VoidAppDelegate` then owns the
top-level transitions.

```text
launch
  -> cache static data and register settings defaults
  -> title/menu
       -> new or continue -> hyperspace shell
       -> instructions / settings / credits overlays
  -> hyperspace shell
       -> galaxy map -> validate loadout -> flight stage
       -> weapons
       -> equipment
       -> shipyard
       -> menu
  -> flight stage
       -> defeat -> hyperspace shell
       -> all required enemies destroyed + enter hypergate
            -> persist rewards/progress
            -> hyperspace shell + stage summary
```

If the native app terminates during combat, `VoidAppDelegate` archives the live
`Game` under `savedGameState`. The next launch bypasses the title, restores the
combat snapshot, removes the one-shot archive, and resumes paused. Normal player
progress is a separate dictionary under `player`.

### Title and utility screens

- `TitleController` + `Title.xib`: Continue, New Game, Instructions, Settings,
  and Credits. Starting over deletes the existing player dictionary only after
  confirmation. The same controller appears as the Menu tab in hyperspace,
  where Continue is hidden.
- `InstructionsController` + `Instructions.xib`: paged illustrated help.
- `SettingsViewController` + `Settings.xib`: music volume, turn sensitivity,
  and steering inversion. The registered defaults are `0.5`, `3.0`, and false.
- `CreditsController` + `Credits.xib`: credits overlay; the historical feedback
  action is not part of the porting boundary.

### Hyperspace screen family

`HyperspaceController` is a landscape tab-bar shell. It creates these five tabs
in order and plays `MusicHyperspace` while visible:

1. `GalaxyMapController` + `GalaxyMap`: draws the campaign graph from `Stages`,
   colors completed/reachable systems, opens stage detail, checks that the
   player has a ship, a mounted gun, and a non-empty weapon group, saves the
   selected current stage, and hands off to flight.
2. `WeaponsController` + shared `ItemController`: displays weapon stats and
   inventory, mounts/dismounts guns at hardpoints, assigns hardpoints to groups
   A/B/C, sells items, and supports a single buyback batch.
3. `EquipmentController` + shared `ItemController`: displays item effects,
   mounts one item per compatible effect group, sells items, and supports a
   single buyback batch.
4. `ShipyardController` + `GLShipPreview`: lists currently purchasable ships,
   buys, pilots, sells, and trades in ships. Completing configured stages makes
   additional pilotable ships purchasable.
5. `TitleController`: the in-game menu and utility overlays.

`HyperspaceScreenController` supplies common help-overlay and sound behavior to
the four domain tabs. The help artwork (`Help.<screen>.png`) is shown once per
screen using `Seen.Help.<screen>` settings keys.

`StageSummaryController` overlays hyperspace after a successful stage. It shows
kills, credits earned, newly unlocked ship, found weapons, and found equipment.

### Combat flow

`FlightInterface` + `FlightInterface.xib` hosts the OpenGL view, credit label,
pause overlay, abort action, and debug-only autocomplete action. `EAGLView` owns
the native graphics context, the animation timer, loading state, pause state,
and the current `Game`.

The timer runs at 40 Hz (`1 / 40` seconds). Every timer callback calls
`Game.update` once and then `Game.render` once, so nearly all tuning is expressed
per frame rather than per second. The Combat Prototype confirms that a browser
adapter should preserve a fixed 40 Hz simulation while rendering independently.

`Game` is the stage coordinator and live aggregate. Construction from a stage
name:

- reads the stage template;
- creates the player ship at the hypergate;
- creates fixed or randomized enemies from enemy loadouts;
- creates planets, nebulas, the star field, targets, effects, pickups, audio,
  and the combat HUD;
- connects device motion and multitouch input; and
- tracks per-stage rewards and summary statistics.

The update order is itself behavior: input, camera heading, projectiles, beams,
player ship, listener/camera/star field, enemies, pickups, nebulas, HUD,
projectile collisions, explosions, hypergate, then completion. Rendering uses a
perspective world pass followed by an orthographic HUD pass.

A stage becomes completable when no non-optional enemy remains. The gate then
opens; touching it begins a 60-frame exit. Surviving commits collected items,
marks the stage complete, saves the player, and shows the summary. Ship
destruction uses the same exit sequence but does not commit stage rewards or
show the summary. Aborting destroys the player ship.

## Runtime subsystems

The Xcode groups reveal the intended conceptual boundaries even though all
first-party files are now flat under `Classes/`.

### Stage orchestration

- `Game`: creates, updates, renders, serializes, and completes one stage.
- `Player`: persistent campaign/economy/loadout state and achievement checks.
- `EAGLView` / `FlightInterface`: platform loop, graphics surface, lifecycle,
  loading, pause, and handoff to the app shell.

### Simulation model

- `Vector` and `SpaceObject`: mutable vector math and the shared
  angle/acceleration/velocity/position update pipeline.
- `Ship`: ship-template loading, equipment bonuses, mounted weapons, mass,
  thrust/reverse/braking/inertia, arena bounds, shields, armor, energy, damage,
  and ship rendering.
- `Enemy`: a `Ship` with an AI strategy, optional-completion flag, mine contact
  damage, loot generation, and kill accounting.
- `AIBase`, `AIFighter`, `AIWarship`, `AIStationary`, `AICrate`: the implemented
  behavior families. The design notes mention additional ideas, but these five
  classes are the shipped runtime surface.
- `Weapon`, `Projectile`, and `Beam`: cooldown/energy/recoil, hardpoint and
  targeting arcs, spread, seeking, lifetime, collision candidates, direct or
  radial damage, knockback, and effects.
- `Pickup`, `Explosion`, and `Particle`: dropped rewards and transient effects.
- `Planet`, `Nebula`, `Hypergate`, `Star`, and `StarField`: stage scenery and
  environmental forces/effects.

There are no ship-to-ship collision checks in the selected runtime loop;
projectile/beam damage and special environment interactions are the relevant
collision behaviors.

### Rendering and presentation

- `Model3D` loads `.vmdl` files: face count, flattened positions, normals, and
  UVs on four lines. `Tools/convert_model.rb` shows the OBJ-to-VMdl coordinate
  and UV conversion.
- `Texture` loads PNGs, prefers `@2x`, falls back to `White.png`, generates
  mipmaps, and caches GPU textures.
- World objects render with fixed-function OpenGL ES 1 state. The Web Port must
  reproduce the observable transforms, materials, ordering, alpha/additive
  blending, and camera in WebGL 2 shaders—not reproduce the old API calls.
- `FlightUI`, `Button`, `Gauge`, and `Radar` render the combat HUD from atlases
  in the same GL surface. UIKit overlays only the credit label and pause/loading
  surfaces.
- `GalaxyMap` and `GLShipPreview` are specialized hyperspace views; the former
  is a 2D UIKit drawing/touch surface and the latter is a small OpenGL preview.

The retained runtime asset set includes 121 VMdl files, 121 CAF audio files, and
228 PNGs under `Assets/Images`. Source working files such as OBJ, JAS, PSD, TGA,
and MAX explain provenance but are not what the runtime loads.

### Input and lifecycle

- Device motion is sampled at 30 Hz; four heading samples smooth the camera,
  while the ship turns toward the oldest heading subject to its own turn rate.
- Multitouch regions independently drive thrust, reverse, brake, and three
  weapon groups. A two-touch gesture in the center changes camera height.
- Simulator-only steering uses touches in the center play area.
- Resigning active pauses combat. Returning from an archived combat state also
  starts paused.

The Combat Prototype already demonstrates a fixed-step browser loop, raw WebGL
2 rendering, letterboxed 480x320 controls, multitouch ownership, and an iOS
motion adapter. Its documented deliberate corrections (including swept
projectile collision) are evidence to review explicitly when production combat
is implemented; they are not silent changes to the Original Game.

### Audio

`BackgroundMusic` streams one named track for title, hyperspace, or the current
stage and honors the music-volume setting. `SoundEffect` caches positioned or
global effects for UI actions, weapons, hits, pickups, thrusters, explosions,
and gate transitions. Audio filenames are selected transitively by stage,
ship, enemy, and weapon data.

## Data ownership

`Utility.cacheDataFiles` eagerly loads the core property lists into a shared
cache. The important ownership chain is:

| Source | Runtime owner | Role |
| --- | --- | --- |
| `NewPlayer.plist` | `Player` | Default save: credits, current/completed stages, current ship/loadout, inventories, buyback batches, owned ships, and notification counts |
| `Stages.plist` | `GalaxyMap`, `GalaxyMapController`, `Game` | Campaign graph and display coordinates; tier/zone; stage introduction; music/background; gate, planets, nebulas, and enemy placements |
| `Assets/Stages/*.json` | build tooling | Editable source for the 81 entries compiled into `Stages.plist` |
| `Enemies.plist` | `Game`, `Enemy` | 112 enemy loadouts: ship type, guns, equipment, AI, mine behavior, and loot rolls |
| `ShipTypes.plist` | `Ship`, hyperspace screens | 107 hull/object templates: movement, defenses, energy, hardpoints, model parts, presentation, price, pilotability, and unlock stages |
| `Weapons.plist` | `Weapon`, item/summary screens | 53 weapon templates: simulation, targeting, projectile/beam, model, sprite, sound, display, mass, and value |
| `Equipment.plist` | `Ship`, item/summary screens | 95 item templates: stat effects, compatibility group, display, mass, and value |
| `LootTables.plist` | `Enemy` | Weighted weapon/equipment drop pools referenced by enemy loot rolls |
| `Achievements.plist` | `Player` | Local requirement evaluation remains useful gameplay logic; external submission does not |

`StageListLite.plist`, `NewPlayerDev.plist`, and `SolarSystems.plist` are
historical/debug or partial-data artifacts, not the primary full-game runtime
sources. The stage editor is also historical tooling; its JSON format is still
valuable because it documents the editable stage schema.

## Natural Web Port seams

These boundaries follow existing ownership and allow later sessions to work
without turning the Combat Prototype into the production foundation:

1. **Application shell and navigation**: title, overlays, hyperspace tabs,
   stage entry/exit, lifecycle, and route state.
2. **Static content pipeline**: validated loading/conversion of plists, stage
   JSON, VMdl, textures, sprite atlases, and audio, with stable logical names.
3. **Player profile and economy**: save schema, progression graph, inventory,
   loadouts, buyback, ship ownership/unlocks, and local achievement state.
4. **Simulation runtime**: math, fixed-step timing, space objects, ships,
   weapons, projectiles/beams, AI, collisions, pickups, scenery effects, and
   deterministic collection lifecycles. Keep browser APIs outside this seam.
5. **Stage assembly**: turn one stage template plus player loadout into a live
   simulation and turn its outcome into rewards and summary data.
6. **Rendering and asset presentation**: WebGL 2 resources, world passes,
   camera, sprite/effect passes, combat HUD, and reusable ship preview.
7. **Input and browser lifecycle adapters**: motion permission/sampling,
   pointer ownership, safe areas/orientation, pause/resume, and interruption.
8. **Audio**: user-gesture unlock, music ownership, effect lookup, positional
   behavior, volume, interruption, and cache lifetime.

The first production combat slice needs seams 2, 4, 5, 6, 7, and 8, but should
depend only on a narrow player-loadout/outcome contract from seam 3. The broader
hyperspace screens can then reuse the same content and player-profile APIs.

## Facts downstream tickets should preserve

- The design coordinate system and HUD are landscape 480x320, but the Web Port
  must adapt that presentation to safe areas and current phone viewports.
- Simulation tuning assumes 40 updates per second; do not multiply legacy
  per-frame values by variable render delta time.
- Campaign reachability is based on completed stages and the connections graph,
  with current and previously completed stages always selectable.
- A combat loadout requires a ship, at least one mounted gun, and at least one
  non-empty weapon group.
- Optional enemies do not gate completion. Rewards and stage completion commit
  only on a surviving hypergate exit.
- `Assets/Stages/*.json` and the root plists are a linked content graph. Validate
  names across stages, enemy loadouts, hulls, weapons, equipment, loot tables,
  models, textures, sprites, and sounds before runtime work depends on them.
- Runtime mesh assets are the VMdl files; OBJ/JAS and art-source files are
  provenance. Preserve `Tools/convert_model.rb`'s axis and UV conversion.
- Preserve the four implemented AI families (with `AIBase` as shared behavior),
  not every unimplemented idea in `ReadMe/AI.textile`.
- Treat XIBs as presentation evidence and interaction inventories, not as a
  requirement to mirror UIKit object boundaries in Preact.
- Keep `web-prototype/` unchanged until final validation, as required by the
  Wayfinder map.
