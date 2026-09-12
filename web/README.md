# The VOID Web Port

This directory is the production Web Port. The Combat Prototype in `../web-prototype/` remains a separate reference implementation.

## Commands

```sh
npm install
npm run dev
```

`npm run build` creates the production bundle in `dist/`. `npm run preview` serves that bundle locally, and `npm run check` runs the capability-gate smoke tests followed by a strict TypeScript production build.

`npm run assets` deterministically converts the Original Game's authoritative plists and editable stage JSON, validates their linked content graph and VMdl meshes, and stages browser-ready data, textures, and models under `public/content/`. The generated manifest preserves each asset's source path, size, and SHA-256 digest. Generated files are build output and are not committed.

Set `VITE_BASE_PATH` when building for a non-root hosting path.

See [`src/README.md`](src/README.md) for the source organization.
