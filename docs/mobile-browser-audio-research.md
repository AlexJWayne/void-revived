# Mobile browser audio for the Web Port

Researched 2026-09-13. This is a stack recommendation, not a change to the Original Game's behavior. Scope: reasonably recent iOS Safari and Android Chrome.

## Recommendation

Use browser APIs directly, behind readable TypeScript counterparts of `SoundEffect` and `BackgroundMusic`, plus a small shared browser audio owner. No runtime audio package is needed for the behavior present in the Objective-C implementation.

| Responsibility | Proposed primitive |
| --- | --- |
| Effects | Shared decoded `AudioBuffer` assets; separate `AudioBufferSourceNode` playback instances and per-instance `GainNode` |
| Music | One reused `HTMLAudioElement`, routed through `MediaElementAudioSourceNode` and a music `GainNode` |
| Output and lifecycle | One shared `AudioContext` |
| Assets | Compressed one-shot effects and music; PCM WAV for small loop-sensitive effects; preserve original asset names in the lookup |

The Web Audio specification defines reusable memory-resident buffers, scheduled playback and gain processing. It explicitly recommends an audio element plus `MediaElementAudioSourceNode` for long music. Buffer sources are single-use: the TypeScript wrapper must create a new node when restarting playback while retaining the shared buffer. [Web Audio specification](https://www.w3.org/TR/webaudio/).

## Why stream the music

Local inspection with macOS `afinfo` found seven stereo 44.1 kHz IMA4 CAF music tracks, lasting approximately 85–192 seconds. Keeping all seven as decoded float32 samples would consume about 313 MiB; individual tracks would consume about 29–65 MiB at 44.1 kHz. These estimates exclude browser overhead and become larger when resampled to 48 kHz. The 114 PCM effects total about 29 MiB decoded at 44.1 kHz; they include both mono and stereo recordings. Source files: `Assets/Audio/Music/` and `Assets/Audio/`.

Streaming gives a better mobile memory budget and avoids requiring a complete music download and decode before starting. Buffer-only playback remains a possible targeted choice if testing shows unacceptable loop seams, but should not mean predecoding the whole soundtrack.

`HTMLAudioElement.loop` repeats by seeking to the beginning; it does not promise a sample-accurate seam. Listen to every converted music loop on actual phones. Buffer sources provide explicit loop points. [HTML media loop algorithm](https://html.spec.whatwg.org/multipage/media.html#attr-media-loop), [Web Audio looping](https://www.w3.org/TR/webaudio/#looping).

## Mobile requirements

- **Start in a user gesture.** Call `AudioContext.resume()` and the initial music `play()` directly from the game's opening tap/click handler, before awaiting other work. Chrome documents its autoplay restriction and recovery through `resume()`; WebKit documents that a later loading callback does not retain the originating gesture. Handle rejected playback promises and retry from a subsequent intentional interaction. [Chrome autoplay](https://developer.chrome.com/blog/autoplay/), [WebKit gesture policy](https://webkit.org/blog/6784/new-video-policies-for-ios/).
- **Reuse the music element.** WebKit's media permission has historically been per element; changing the source on an activated element avoids creating a fresh activation requirement for every scene. This is a conservative design backed by a WebKit engineer's explanation, not a guarantee against all future policy changes. [WebKit issue 134925](https://bugs.webkit.org/show_bug.cgi?id=134925).
- **Control music gain through Web Audio.** Apple's archived iOS guide explicitly says JavaScript cannot set media-element volume. Route the music into a `GainNode` so the existing music-volume setting has an appropriate processing path. The archive contains other outdated statements; validate volume behavior on supported phones rather than treating the whole guide as current. [Apple volume restriction](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html), [Web Audio media source and gain](https://www.w3.org/TR/webaudio/).
- **Make interruption recovery explicit.** Pause music and suspend effects when the game becomes hidden; resume only audio still wanted by game state on return, with a tap recovery if needed. Safari has had real interruption regressions. The current Web Audio draft includes `interrupted`, but draft behavior is not evidence that every supported browser implements it identically. Test app switching, screen locking, calls and headphone changes. [WebKit interruption regression](https://bugs.webkit.org/show_bug.cgi?id=276016), [Web Audio interruption draft](https://webaudio.github.io/web-audio-api/#handling-an-interruption-on-the-audiocontext).

## Formats and packages

Convert CAF during asset preparation rather than shipping a decoder. CAF is Apple's flexible audio container. Apple documents WAV and AAC playback; Chromium documents WAV/PCM and Google Chrome AAC support. WAV retains effect sample boundaries without lossy-encoder padding. AAC-LC in `.m4a` is a suitable compressed baseline for the stated targets; check the actual exports on both browsers. No HLS, Media Source Extensions, AudioWorklet or runtime transcoding is justified here. [Apple CAF overview](https://developer.apple.com/library/archive/documentation/MusicAudio/Reference/CAFSpec/CAF_overview/CAF_overview.html), [Apple supported audio](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/AudioandVideoTagBasics/AudioandVideoTagBasics.html), [Chromium codecs](https://www.chromium.org/audio-video/).

### Download priority refinement

With fast first navigation a stated priority, do not ship all effects as WAV or preload the soundtrack. Use AAC-LC `.m4a` for music and ordinary one-shot effects initially, retaining WAV for small repeating effects whose seams must remain exact. This is an encoding recommendation, not a change to the Web Audio playback architecture. Compressed effects still decode to PCM in memory: transfer savings do not reduce their eventual buffer memory.

Opus is a useful optional alternative after listening and size comparisons. Use **Opus in WebM**, with AAC fallback if supporting older phones. WebKit announced full WebM support on iOS 17.4; **Opus in Ogg** was only added on iOS 18.4. These container distinctions matter more than the filename's apparent codec. [WebKit Safari 17.4](https://webkit.org/blog/15063/webkit-features-in-safari-17-4/), [WebKit Safari 18.4](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/), [Opus project](https://opus-codec.org/).

Verify an actual decode for effect formats; media playback support does not establish `decodeAudioData` support. WebKit fixed Opus-in-MP4 decoding in March 2026, with a subsequent Technology Preview release note, so that combination is not a sensible baseline for older supported Safari versions. [WebKit bug 307632](https://bugs.webkit.org/show_bug.cgi?id=307632), [Safari Technology Preview 240](https://webkit.org/blog/17896/release-notes-for-safari-technology-preview-240/).

AAC adds priming and remainder samples; metadata and decoder handling matter for tight timing and loops. Do not assume lossy compression makes accurate looping impossible, but validate decoded lengths, leading delay and audible seams before replacing loop-sensitive WAV assets. [Apple compressed-audio looping](https://developer.apple.com/library/archive/qa/qa1636/_index.html).

Proposed loading policy: render the first screen immediately; fetch only its small required effects; stream the selected music when playback begins; fetch and decode the next gameplay scene's effects during existing navigation/loading; retain shared effects and evict unused decoded assets at the Original Game's cache boundaries. Keep alternate encodings separately addressable so a device downloads only its selected format. Use versioned asset URLs and normal HTTP caching for repeat visits. These are proposed application choices; measure the first-screen and first-playable transfer totals before selecting final bitrates.

Howler provides useful pooling, unlocking and a common playback API; its `html5: true` option supports large/streamed files. However, its HTML audio volume path still assigns the media element's `volume`, so adding Howler does not itself solve iOS music gain. Its abstractions would also still need wrapping to preserve the Original Game's object and cache semantics. Recommendation: start without it; reconsider only for concrete compatibility work it demonstrably removes. [Howler documentation](https://github.com/goldfire/howler.js), [Howler volume implementation](https://github.com/goldfire/howler.js/blob/master/src/howler.core.js).

## Fidelity boundaries

`BackgroundMusic.isItunesPlaying` queries native other-app playback. The reviewed browser interfaces provide no portable equivalent. The emerging Audio Session API exposes this page's session type/state, not an inventory or boolean for other apps' music. Treat automatic suppression while another app plays as a platform limitation; retain the player's music setting instead of pretending detection works. This is an inference from the available API surface. [Audio Session draft interface](https://w3c.github.io/audio-session/#audiosession).

`Classes/VoidAppDelegate.mm` selects native `AVAudioSessionCategoryAmbient`, which mixes with other apps and respects the iPhone Silent switch. Browser playback and OS audio focus cannot be assumed to reproduce that contract. Audio Session's draft `ambient` type is worth a feature-detected, device-tested enhancement, but cannot be the portable baseline or a substitute for other-app detection. Include silent mode and concurrent external music in phone validation. [Apple ambient category](https://developer.apple.com/documentation/avfaudio/avaudiosession/category-swift.struct/ambient), [Audio Session draft types](https://w3c.github.io/audio-session/#audio-session-types).

Keep the behavior in `Classes/SoundEffect.m` and `Classes/BackgroundMusic.m` as the translation authority: cached effect objects coexist with separately owned instances; `stopAndDecay` currently stops immediately. `setPosition` currently sets volume to one below distance 8, zero above 20, but increases from zero to one between those limits. Flag that inconsistency explicitly before deciding whether to preserve or correct it; do not substitute the browser's built-in distance attenuation silently.

No device playback tests or implementation changes were performed for this research. Initial validation should cover first-tap startup, saved volume, rapid repeated effects, overlapping ship effects, music transitions and loops, and mobile interruption recovery.

## Implemented baseline

The initial audio port uses AAC-LC M4A at 128 kbps for stereo recordings and 64 kbps for mono recordings, preserving the original sample rate and channel count. Twenty-one loop-sensitive effects (including the Settings slider's Select recording) use PCM WAV. Music streams through a Web Audio gain node, while scene-specific effects are fetched and decoded before combat starts. No download-progress UI was added.

The previously flagged distance-volume curve is preserved. The stage-exit music fade is multiplied by the saved volume to avoid overriding mute. Native references to absent Thruster.Neutral and Thruster.Neutral.Reverse files remain silent and are recorded in the content manifest. See web/README.md for build tools and phone validation.
