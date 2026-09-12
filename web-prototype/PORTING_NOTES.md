# Porting notes

## Question and status

This throwaway slice asks whether the original combat and tilt steering translate to mobile Safari. The runnable loop, original visuals, and source-derived combat are in place. The machine checks pass; the feel verdict is pending a physical iPhone pass. No decision about a full port follows from the desktop results.

## Translated from the original

- `Game.mm`: 40 Hz simulation, camera frustum `(-1.5, 1.5, -1, 1, 4, 200)`, 480×320 layout, camera offset `-0.08 * height`, camera rotation, four-entry heading queue, touch rectangles, steering sensitivity 3, 0.2 dead zone, multiplier −3, two-sample average.
- `Ship.m` / `SpaceObject.m`: shortest-angle turn cap; bank limit 30 and filter 0.05; force divided by hull plus weapon mass; inertia, reverse, braking, maximum speed; radius-80 reflecting boundary; shield overflow into armor, recharge delay, energy refill and recoil.
- `ShipTypes.plist`, `Weapons.plist`, `Enemies.plist`, `Equipment.plist`: Chromate/Cyber Frigate, Cyber Light Fighter, Cyber Gun; the four specified weapons; original enemy Handicap 20 effects. No player equipment. The player has 630 shields, 630 armor, 300 energy, and loaded mass 111.
- `AIFighter.m` / `AIStationary.m`: notice/drop distances and tendencies, facing and velocity checks, range-based firing and braking. Fighter tendencies are randomized once at creation.
- `Weapon.m`: per-hardpoint offsets, cooldown, energy cost, source-velocity compensation for targeting arcs, spread, inherited velocity and shot recoil. Both selected player weapons and both enemy weapons use non-seeking, non-accelerating projectiles.
- `Model3D.m`: read existing face count / vertices / normals / UV rows directly. `Tools/convert_model.rb` already flips V, so browser uploads do not flip it again. The old OBJ loader is not used.
- `FlightUI.m`, `Gauge.m`, `Radar.m`: original atlas and rectangle geometry; bottom-up gauges, pressed feedback, camera-relative enemy radar dots. Retina atlas is used at all pixel densities.
- Ship, thruster, shield, projectile, hit, and cyber explosion assets are byte-for-byte copies. `public/assets/manifest.json` records each source. The authoritative projectile atlas is `Assets/Images/Content/Weapons/Projectiles/Projectiles.png`, as referenced by the Xcode project, not the older file with the same name under FlightUI.

## iOS motion mapping

Device motion axes remain relative to natural portrait orientation. For screen angle θ, lateral screen-right acceleration is `x*cos(θ) - y*sin(θ)`. Negate this and divide by 9.80665 before the original curve. Lowering the right edge therefore makes the camera heading decrease, producing a clockwise turn; the opposite landscape angle reverses the device-Y sign.

This intentionally targets iOS WebKit: its [WebCoreMotionManager](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/platform/ios/WebCoreMotionManager.mm) passes `(userAcceleration + gravity) * 9.80665` from Core Motion without reversing its sign. That convention differs from the face-up positive-Z example in the [W3C motion specification](https://www.w3.org/TR/orientation-event/). Do not assume this adapter is portable to Android without testing. Screen angle handling follows the [Screen Orientation specification](https://www.w3.org/TR/screen-orientation/), with Safari's legacy `window.orientation` as fallback.

The permission API is called directly from the start button gesture. Entry waits for a finite, non-placeholder gravity sample; denial, insecure context, absent API or a four-second sensor timeout blocks play. Two seconds without fresh samples pauses the battle. Resizing, orientation changes, pointer cancellation, lost capture and backgrounding clear input. No neutral calibration or alternative steering is added.

## Deliberate simplifications and corrections

- Purpose-built stage: player at `(0,0)`, fighter at `(-3,12)`, turret at `(2,5)`. No planet, campaign, loot, replenishment, completion, inventory, audio, persistence or network services. Reload is the only reset.
- Camera height is fixed at 32 (within the original 8–40 limits); tilt follows the source formula. Pinch zoom and the UIKit pause screen are omitted. Browser background/portrait suspension supplies the unavoidable pause behavior.
- Raw WebGL 2 vertex/fragment shaders replace fixed-function OpenGL. Lighting approximates the original ambient/diffuse material; specular highlights are omitted. Thrusters, projectile sprites and animated explosions use additive light; HUD and shields use alpha blending. No compatibility layer or external game engine.
- Render transforms interpolate between fixed simulation states. Catch-up after a long frame is capped at 250 ms; returning from background never fast-forwards the battle. Display pixel ratio is capped at 3.
- Swept projectile collision replaces point sampling to avoid fast rounds skipping a target. A projectile damages only the first eligible ship it hits, fixing the original loop's ability to hit multiple targets after expiration. Ship-body collisions are not introduced (the original selected collision loop only checks projectiles).
- C combines both guns; simultaneous A/B holds also combine, instead of relying on unordered legacy touch iteration. Gun energy priority alternates by tick rather than using the original mutable shuffled-gun collection.
- Hit and explosion sprite animation, growth and crossfade are retained; debris particles are omitted. Star positions are deterministically generated using the original 1,500-star count, radius and depth range.
- Player death stops input and weapon fire and leaves the combat canvas with a small reload message. There is no death menu or restart button.
- DOM elements provide transparent semantic touch targets above the WebGL HUD; all visual HUD artwork is rendered in WebGL. The original touch rectangles are scaled with the same letterboxed 480×320 plane, inside device safe areas.

## Validation boundaries

`npm test` and `npm run build` pass. Browser visual/input checks found and fixed a cross-shader precision mismatch. The default denied-permission gate and portrait pause were exercised. Local HTTPS was fetched using the generated CA with certificate verification enabled. No certificate trust was installed automatically. Native desktop Safari control was unavailable; physical iPhone performance, motion direction/feel, simultaneous finger input and permission onboarding remain human verification items in README.md.
