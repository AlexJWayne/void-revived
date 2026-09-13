# The VOID Web Port

This directory is the production Web Port. The Combat Prototype in `../web-prototype/` remains a separate reference implementation.

## Commands

```sh
npm install
npm run dev
```

The development server uses HTTPS on port 5190 so motion controls work from a phone on the local network. `npm run dev` creates a local certificate authority and server certificate under `.certs/` when needed, then prints the phone URL. The generated certificates and private keys are local files and are ignored by Git.

The certificate covers `localhost`, `127.0.0.1`, `::1`, and the computer's current private IPv4 address. Run `npm run cert` after changing networks. Set `DEV_HTTPS_IP` if automatic address detection chooses the wrong interface:

```sh
DEV_HTTPS_IP=192.168.1.205 npm run cert
```

To use motion controls on a phone, put the phone on the same network, install `.certs/dev-ca.crt` as a trusted certificate authority, and open the printed `https://<address>:5190/` URL. On iOS, installing the profile is followed by enabling full trust under **Settings > General > About > Certificate Trust Settings**. On Android, install it as a CA certificate in the device's security or encryption settings; the exact menu name varies by device. Remove the certificate from the phone when it is no longer needed. The script never changes trust settings on the computer or phone.

`npm run build` creates the production bundle in `dist/`. `npm run preview` serves that bundle locally, and `npm run check` runs the tests followed by a strict TypeScript production build.

`npm run assets` deterministically converts the Original Game's authoritative plists and editable stage JSON, validates their linked content graph and VMdl meshes, and stages browser-ready data, textures, and models under `public/content/`. The generated manifest preserves each asset's source path, size, and SHA-256 digest. Generated files are build output and are not committed.

Set `VITE_BASE_PATH` when building for a non-root hosting path.

See [`src/README.md`](src/README.md) for the source organization.

## Physical-phone combat validation

The combat slice is implemented; phone validation remains open. Browser checks cover rendering, movement and equipped weapon fire, pause/reload, portrait interruption, and abandonment. The automated stage test exercises destruction, pickups, surviving gate exit, reward persistence, and defeat without rewards. These checks do not establish physical sensor direction, multitouch feel, or device performance.

After reloading the HTTPS page with the trusted local certificate:

1. Launch **Discipulus Minor**, allow motion access, and check steering in both landscape orientations. Try sensitivity and inversion in Settings.
2. Hold thrust and an equipped weapon group's fire button together; slide between thrust/reverse/brake and A/B/C. Release or cancel touches and confirm nothing stays pressed. Long presses should show no text selection or callout; double taps should not zoom the page. A center pinch should change only the flight camera.
3. Destroy the crate, collect its drops, enter the opened gate, and check the stage summary, inventory, credits, and newly reachable stage. Reload after returning to hyperspace and confirm the rewards persist.
4. During a stage, pause/resume, switch apps, rotate to portrait and back, and reload. Each interruption should resume paused, with the same damage and collected rewards. Abandoning should return to hyperspace without committing that stage's rewards.
5. Check the HUD, ship textures, effects, and shared title-style buttons on the phone, and report any rendering defect, frame-rate problem, or input mismatch.

Audio is intentionally absent. Record the phone/browser and the outcome of these checks before resolving **Attach combat to the production game skeleton**.
