# VOID Revived

This is a sanitized reference archive of the original VOID game project.

The Objective-C and Ruby code is preserved to document gameplay behavior, data
formats, tuning, and asset usage for translation into modern implementations. It
is not expected to compile or run. Obsolete third-party service SDKs, analytics,
review prompts, deployment scripts, credentials, machine-specific project state,
and local filesystem inventories have intentionally been removed.

The most useful reference material is:

- `Classes/` for gameplay and simulation behavior.
- The root property lists and `Assets/Stages/` for game data and tuning.
- `Assets/` for original art, audio, and models.
- `Tools/StageEditor/` for the stage data model and editing behavior.
- `web-prototype/` for the runnable browser-based combat prototype.

The Xcode project is retained only as an index of the historical source layout.
Missing references to removed integrations are expected.
