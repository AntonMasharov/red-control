# Offline content authoring

For step-by-step examples and the editable file map, read [the practical election-data tutorial](content-authoring-tutorial.md). A complete fictional starter is in `examples/authoring/example-city-2027/`.

Source file registrations are generated from `sources.yaml` during the content build. A non-null `assetKey` uses `global/documents/<name>` by default for documents, and `global/videos/<name>` for videos. Set optional `file` to an explicit path relative to `src/content/` for manual control, or `assetKey: null` to leave a source unpublished. Do not edit `source-assets.generated.ts`.

Run `npm run build:content` after editing YAML, then `npm run check:content` to verify the generated bundle. YAML is parsed and validated at build time; the mobile app reads only the precompiled, immutable catalog and never needs a YAML parser or network connection at runtime.

- `src/content/catalog-manifest.yaml` lists election manifests.
- `src/content/global/laws/laws.yaml` contains shared legal citations.
- `src/content/global/documents/sources.yaml` describes bundled document originals.
- `src/content/global/videos/sources.yaml` describes videos; lesson video registration is generated automatically.
- Other global YAML tables contain reusable theory, tasks, stages, roadmaps, contacts and headquarters.
- `src/content/elections/<id>/manifest.yaml` identifies a campaign and its theory and roadmap selections.
- `commissions.yaml` stores the campaign's commission tree through stable parent IDs.
- `complaints.yaml` contains header/footer templates, selectable violations, text and legal references.
- Optional `content/<table>/*.yaml` files override nothing: they add campaign-prefixed entries to global tables.

Use YAML block scalars (`|-`) for Markdown and multiline complaint text. Preserve IDs once users have observations; changing an ID creates a new record identity. Duplicate keys, broken references, impossible dates, hierarchy cycles and missing bundled asset keys cause the build to fail.

Complaint placeholders are `{{recipient}}`, `{{observer_name}}`, `{{uik_number}}`, `{{date}}` `{{time}}`, and additional variables discovered automatically from the selected template. Extra fields appear in the existing complaint form. Missing variables fail generation instead of leaving unresolved placeholders. Additional facts remain literal user text. Legal references are appended once for the selected violations.

Laws are derived from theory, roadmap tasks and complaint checkboxes. Sources are derived from those laws. Election manifests contain no manual law/source lists; the builder derives `lawIds` and `sourceIds` in the normalized runtime schema. Source documents must be registered with a literal `require` in `src/content/repository.ts`; no remote fallback is used.

Observer data stays in SQLite on mobile and local browser storage on web. Members, contacts, progress, repeated stages (including home-voting trips), stage/item notes, unfinished complaint inputs and saved drafts survive reloads. Existing snapshots are migrated and retained; refactoring does not erase observations.

## Verification

- `npm test`: domain, storage migration and failure, scoping, complaint assembly tests.
- `npm run test:integration`: Jest and React Native Testing Library workflows.
- `npm run typecheck`: strict TypeScript.
- `npm run build:web`: production bundle, including local originals and media.
- `npm run test:e2e`: Cypress happy paths; first run `npm run build:web` and keep `npm run preview` running on port 8082. Run `npx cypress install` once on a new machine.

The federal and municipal 2026 campaigns are explicitly labelled training examples. Existing sourced legal placeholders retain their status; the rewrite does not invent missing law text or confirm real election schedules. Native iOS/Android device validation requires the corresponding build environment.

Compatibility choices: the rewrite retains the existing atomic SQLite snapshots and typed tab/modal navigation, instead of replacing them with AsyncStorage/MMKV and React Navigation. YAML uses the normalized catalog contracts to preserve existing content IDs and observation keys; it does not use every illustrative field name from the specification verbatim. Test execution covers the main workflows; no claim of measured 100% coverage is made.

