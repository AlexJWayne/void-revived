# The VOID — combat prototype

A throwaway mobile Safari experiment: can the original flight, tilt steering, and combat feel work in a browser? This is one battle, not a campaign port. The original iOS project is unchanged.

## Published prototype

Pushes to the configured deployment branch that change `web-prototype/` automatically build and publish the prototype with GitHub Pages. The repository's Pages source must be set to **GitHub Actions** under Settings → Pages before the first deployment. The workflow can also be started manually from the Actions tab.

## Run on your Mac

Requires Node.js 24 (tested with 24.11.0), npm, and OpenSSL. The selected original assets are already included; Python 3 is only needed to reimport them.

```sh
cd web-prototype
npm ci
npm run cert
npm run dev
```

The server uses HTTPS on port **5186**. `npm run cert` prints your Mac's current Wi-Fi address and includes it in the certificate. Keep the server running and connect the iPhone to the same Wi-Fi. If the Mac's address changes, rerun `npm run cert` and restart the server.

## One-time iPhone certificate setup

The certificate command creates a local certificate authority inside the ignored `.certs/` folder. It does **not** change trust settings on either device.

1. AirDrop **only** `web-prototype/.certs/VOID-local-ca.cer` to your iPhone. To find the hidden folder, use Finder → Go → Go to Folder and select `web-prototype/.certs` inside your checkout.
2. Open Settings → **Profile Downloaded**, then install the **VOID Local Development CA** certificate. Follow the phone's prompts. See [Apple's profile installation instructions](https://support.apple.com/en-us/102400).
3. In Settings → General → About → **Certificate Trust Settings**, enable full trust for **VOID Local Development CA**. See [Apple's certificate trust instructions](https://support.apple.com/en-us/102390).
4. Open the HTTPS game address in Safari. Turn off Portrait Orientation Lock, rotate to landscape, tap **Enable motion & fly**, and allow Motion & Orientation.

The CA is only for this local experiment. Keep the private keys on your Mac; remove the certificate profile from the phone when finished testing. Server certificates last 30 days; rerunning `npm run cert` renews the server certificate using the same CA, so you do not need to reinstall the phone profile.

## Recover the space used by Safari’s toolbar

For an immediate improvement, use Safari’s **More → Hide Toolbar** option ([Apple’s guide](https://support.apple.com/guide/iphone/iphb3100d149/ios)). The game automatically resizes when the available viewport changes.

On **iOS 26**, use **Share → Add to Home Screen**, leave **Open as Web App** enabled, and launch the new Home Screen icon. This opens the game without Safari’s address bar; iOS 26 supports this for any website, without requiring a manifest or service worker. See [Apple’s instructions](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios) and [WebKit’s explanation](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/). The local Mac server must still be running. Motion permission may be requested again in this separate app context.

If the Home Screen app was installed before the full-screen metadata was added, delete that icon and add the page to the Home Screen again. iOS records the viewport/status-bar mode when the web app is installed; an existing installation can otherwise keep the incorrect portrait-height layout in landscape and crop the 3:2 game vertically.

The standard `requestFullscreen()` API exists, but iPhone Safari’s general element-fullscreen support remains unsuitable for ordinary touch-only game use ([WebKit issue](https://bugs.webkit.org/show_bug.cgi?id=206854)). No nonfunctional fullscreen button has been added. The old 480×320 game view preserves its 3:2 aspect ratio, so losing vertical space also reduces its displayed width. Home Screen launch should help substantially; it does not stretch the game to the phone’s wider aspect ratio.

## Fly

Tilt either edge down to turn that way. Both landscape orientations are supported. The camera turns with the intended heading; the ship follows with its original delay and maximum turn speed.

- Left upper button: thrust.
- Left lower button: reverse.
- Red stop button: brake.
- A: Vulcan Cannon. B: Mass Driver. C: both.
- Hold movement and fire with separate thumbs. Slide between weapon groups without lifting.
- Red gauge: energy. Yellow inner gauge: armor. Blue outer gauge: shields. Radar dots: enemies.

No restart or completion screen. Reload to reset, including after the ship is destroyed. Switching apps or rotating to portrait pauses the simulation and releases held controls.

## Two-minute phone check still needed

1. At rest, the view should not turn. Lower the right edge gently: you should turn right. Check left, then rotate the phone 180° and repeat.
2. Hold thrust and A together, slide A → B → C, and release each thumb independently. Check that movement and firing stop responding to that thumb when released. Drift continues until you brake.
3. Approach the two red radar dots. The fighter should pursue and fire; the turret should turn in place and fire at close range. Shoot both and watch shields, armor, energy, and explosions.
4. Rotate to portrait and return; switch to another app and return. There should be no jump forward or stuck button. Reload for a fresh battle.

Please report the iPhone/iOS version, which landscape orientation you used, and whether steering is reversed, too sensitive, too sluggish, or drifting when level. Physical motion, Safari's certificate/permission flow on a real iPhone, and real simultaneous touch feel have **not** been verified by the agent

## Checks and development

```sh
npm test       # 10 math, timing, input and combat checks
npm run build  # strict TypeScript check + production bundle
npm run preview # HTTPS production bundle on port 4186
npm run assets # reimport only the selected plists and 14 assets
```

Tests cover fixed 40 Hz behavior at 60/120 Hz render rates, gravity conversion and both landscape signs, camera lag, multitouch ownership, force/mass movement, braking, weapon groups/cooldowns/energy, shield overflow/recharge, destruction, both AI modes, projectile collision, arena bounds, and reset state.

Browser verification was performed in Codex's desktop browser at 844×390 and 390×844. Original meshes, textures, HUD, projectiles, thrusters and shield effects rendered; the combat check reported 5 meshes, 10 textures (including the white utility texture), and zero WebGL errors. Pointer down/up reached the flight surface and cleared controls. Portrait rotation stopped the simulation tick count; denied motion access blocked entry. Desktop Safari app verification could not be completed because native browser control was unavailable. This is not a claim of a physical iPhone test.

For desktop inspection only, the Vite development server accepts:

- `/?dev=1&scenario=combat`: paused combat snapshot, injected thrust/fire and shield hit, visible rendering diagnostics.
- `/?dev=1&scenario=live`: live battle with touch buttons; no tilt input unless injected.
- `/?dev=1`: opt-in `window.__void` debugger with `start()`, `pause()`, `step(ticks)`, `sample(x,y,screenAngle)` and `state()`.

These hooks and the verification module are removed from the production bundle. There are no visible alternative steering controls in the default game. An optional loopback-only test server uses `VOID_QA_HTTP=1 npm run dev -- --host 127.0.0.1` on port 5187; this is for local desktop visual checks, not for the phone. Normal development and production preview use HTTPS.

See [PORTING_NOTES.md](PORTING_NOTES.md) for source mappings and deviations.
