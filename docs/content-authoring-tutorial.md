# Tutorial: authoring real election data

Start with the [complete starter folder](../examples/authoring/example-city-2027/manifest.yaml). It contains a fictional election with two polling stations, one lesson, a checklist, a repeatable stage and a complaint. It is **not registered in the app**, so it does not change the current campaigns.

The starter's dates, addresses, commission names and legal text are placeholders. Replace them with your real material.

## 1. What is happening here?

There are three different things:

| Thing | Where it lives | Who changes it |
|---|---|---|
| Election material shipped with the app | YAML and original files under `src/content/` | You, as the content author |
| A compiled copy of that material | Files ending in `.generated.json` | The build command |
| An observer's notes, checks, member edits, contacts and complaints | Local storage on their device | The observer, through the app |

**Edit the YAML. Run the build. The app reads the generated copy.** Editing a generated JSON file will be undone by the next build.

Adding a YAML file does not automatically publish an election. Its manifest must be listed in `catalog-manifest.yaml`.

The current implementation uses the field names below. They differ from some illustrative YAML in the original specification: use `title`, `topicIds`, `taskIds`, etc. Do not paste the specification's `name`, `tik_list`, or `days/stages/items` structures directly into these files.

## 2. The file map

All paths below are relative to the project folder.

```text
src/content/
  catalog-manifest.yaml                 EDIT: which elections are included
  catalog.generated.json               DO NOT EDIT: compiled content
  catalog.schema.json                  Developer validation rules

  global/
    app-settings.yaml                  EDIT: common notice and reconciliation times
    laws/laws.yaml                     EDIT: laws shared between elections
    documents/sources.yaml             EDIT: original-file descriptions
    documents/*.docx, *.pdf, *.rtf      ADD: original files
    videos/sources.yaml                EDIT: video descriptions
    videos/*.mp4                       ADD: local videos
    topics.yaml                        EDIT: shared lessons
    tasks.yaml                         EDIT: shared checklist questions
    blocks.yaml                        EDIT: groups of checklist questions
    roadmaps.yaml                      EDIT: order and days of those groups
    documents.yaml                     EDIT: named document entries
    contacts.yaml                      EDIT: default contact directory
    headquarters.yaml                  EDIT: headquarters and their contact lists

  elections/
    YOUR-ELECTION-ID/
      manifest.yaml                    REQUIRED: election name, dates and selections
      commissions.yaml                 REQUIRED: commissions and polling stations
      content/                         OPTIONAL: material specific to this election
        topics/*.yaml                  Lessons
        tasks/*.yaml                   Checklist questions
        blocks/*.yaml                  Groups of questions
        roadmaps/*.yaml                Checklist order
        laws/*.yaml                    Election-specific legal entries
        sources/*.yaml                 Election-specific file descriptions
        documents/*.yaml               Election-specific document entries
```

You may create more `.yaml` files and subfolders inside the listed `content/<table>/` folders. The loader reads them recursively. A file can be named `index.yaml`, `opening.yaml`, or another descriptive name.

It does **not** automatically load an arbitrary `theory.yaml`, `roadmap.yaml`, `.yml` file, or standalone `.md` file beside the manifest. Put Markdown inside a lesson's `markdown: |-` field.

For a new election, use the election-local `content/` folders. Use `global/` only when the material should be shared. Editing shared material changes every election that references it.

### Files outside that map

| File/location | What to do |
|---|---|
| `src/core/constants/app-settings.generated.json` | Do not edit; generated from `global/app-settings.yaml` |
| `src/content/source-assets.generated.ts` | Do not edit; file registrations are generated from source metadata |
| `src/content/lesson-videos.generated.ts` | Do not edit; generated from published `procedure-video` sources |
| Original files | Old bundled originals were removed; add your new files under `src/content/` |
| `src/screens/`, `src/features/`, `src/data/`, `src/ui/` | Application code; ordinary election authoring does not require changes |
| `catalog.schema.json`, `src/data/observation.schema.json` | Developer-maintained validation rules |
| `dist/`, `dist-native/`, `.expo/`, `node_modules/` | Build/runtime output; not content authoring locations |

## 3. IDs: the connections between files

An ID is a permanent internal name, not the text shown to the observer.

```yaml
example-city-2027:arrival-block:
  id: example-city-2027:arrival-block
  title: Прибытие на участок
```

The outer key and `id` must match. You can change the title later without changing the ID.

Rules:

- Choose the election ID once: for example, `city-council-2027`.
- Election-local content IDs must begin with that ID plus `:`: `city-council-2027:arrival-block`.
- IDs in a table must be unique. A local entry cannot overwrite a global entry.
- Polling-station IDs must also be unique across elections. Two elections may both have station number `1001`, but their station IDs must differ.
- The folder name should match the election ID for clarity, although the manifest's ID is authoritative.
- Once observers use an election, preserve its IDs and dates. For a different election or corrected campaign identity, create a new ID. Changing existing dates can make saved snapshots fail to load.

`city-council-2027:arrival-block` is just one string. The colon is a naming convention, not a folder path.

Older samples contain long generated IDs, including repeated prefixes. You do not have to imitate them. The starter uses short, readable IDs.

## 4. Create your first real election

### Step A: copy the starter

Copy this entire folder:

```text
examples/authoring/example-city-2027/
```

into:

```text
src/content/elections/city-council-2027/
```

Inside the copied folder, replace **every occurrence** of `example-city-2027` with `city-council-2027`. This includes outer YAML keys, `id`, `parentId`, `electionId` and references in other files. The starter now includes its own placeholder source. Keep any IDs for shared material unchanged.

The app currently has an empty catalog. Before building this starter, copy `examples/authoring/global/headquarters.yaml` to `src/content/global/headquarters.yaml` (or add a headquarters with ID `shared` yourself). The starter polling stations reference this headquarters. Its title is a placeholder; fill your real headquarters and contacts later.

### Step B: edit the manifest

[Starter manifest](../examples/authoring/example-city-2027/manifest.yaml):

```yaml
schemaVersion: 1
election:
  id: city-council-2027
  title: Выборы городского совета 2027
  dates:
    - "2027-09-12"
  roadmapConfigId: city-council-2027:route
  status: active
  infoId: city-council-2027:info
  topicIds:
    - city-council-2027:observer-introduction
  documentIds: []
info:
  id: city-council-2027:info
  title: Информация о выборах
  markdown: |-
    ## Организация работы
    Здесь разместите проверенную информацию о ваших выборах.
commissionsFile: commissions.yaml
```

| Field | Meaning |
|---|---|
| `schemaVersion` | Keep `1` |
| `election.id` | Permanent campaign ID |
| `title` | Name shown in the election selector |
| `dates` | Actual voting dates, quoted, in ascending order; one date per line |
| `roadmapConfigId` | ID of the route this election uses |
| `status` | `draft`, `active`, `archived`, or `training` |
| `infoId` / `info.id` | Must match |
| `topicIds` | Which lessons to show, in this order |
| `documentIds` | Named document entries, or `[]`; see the Sources limitation in section 9 |
| `info.markdown` | Election introduction shown in the information screen |
| `commissionsFile` | Relative path to the commission file; normally keep `commissions.yaml` |

Do **not** add manual `lawIds` or `sourceIds` to the manifest. They are calculated from the content.

Currently, `status` is descriptive: `draft` and `archived` do not hide an election. Registration in the next step controls whether it is included.

### Step C: register the election

In `src/content/catalog-manifest.yaml`, append one line to `campaigns`:

```yaml
schemaVersion: 1
revision: "2027-08-01.1"
campaigns:
  # Keep the existing campaigns you still want.
  - elections/city-council-2027/manifest.yaml
```

The example above shows the shape, not a request to remove all existing entries. Advance `revision` when publishing changed content; it is a revision label, not the election's voting date.

### Step D: fill the commissions and material

Use sections 5–9 below. Replace all `EXAMPLE` text in the copied starter.

### Step E: rebuild and check

From the project folder:

```text
npm run build:content
npm run check:content
npm run typecheck
```

Then start or rebuild the app:

```text
npm run web
```

For exported previews, run `npm run build:web` and `npm run preview`. For mobile JavaScript bundles, run `npm run build:mobile`.

Existing installed mobile apps will not read new files from your computer. Distribute a new app build/update containing the new bundle.

## 5. Commissions and polling stations

Open [starter commissions](../examples/authoring/example-city-2027/commissions.yaml). It contains two stations under one commission hierarchy.

The file is a flat table linked by `parentId`:

```text
IKSRF: regional commission, parentId: null
  OIK: district commission, parentId: regional commission ID
    TIK: territorial commission, parentId: district commission ID
      UIK: polling station, parentId: territorial commission ID
```

The current validator requires a regional `IKSRF` root. You may skip OIK and attach a TIK directly to IKSRF. UIK must be attached to TIK.

A polling station looks like this:

```yaml
city-council-2027:uik-1001:
  id: city-council-2027:uik-1001
  kind: UIK
  title: УИК № 1001
  parentId: city-council-2027:territorial
  number: "1001"
  region: Название региона
  address: Фактический адрес участка
  electionId: city-council-2027
  hqId: shared
  demo: false
  members:
    - id: officer-0
      role: Председатель
      name: Фамилия Имя Отчество
      party: Название партии или организации
    - id: officer-1
      role: Заместитель председателя
      name: ""
      party: ""
    - id: officer-2
      role: Секретарь
      name: ""
      party: ""
    - id: member-1
      role: Член комиссии
      name: Фамилия Имя Отчество
      party: ""
```

To add station `1003`, copy one UIK entry and change its outer key, `id`, `title`, `number` and address. Keep the same `parentId` if it belongs to the same TIK. Otherwise add the new parent commission first.

Keep station numbers quoted. `hqId` must exist in global `headquarters.yaml`. `demo: true` labels fictional data; use `false` for real data.

Use `officer-0`, `officer-1`, and `officer-2` for the three standard officers. Other member IDs need only be unique within that station. Unknown names may be empty strings.

These are the **initial** members. Once an observer saves local member edits, those edits take precedence on that device. Editing the seed does not erase their edits.

## 6. Lessons: `content/topics/`

Open [starter lesson](../examples/authoring/example-city-2027/content/topics/index.yaml).

Each lesson needs `id`, `title`, `description`, `icon`, `minutes`, `markdown`, `lawIds`, `sourceIds`, `references`, and `media`. Keep unused lists as `[]`.

```yaml
city-council-2027:observer-introduction:
  id: city-council-2027:observer-introduction
  title: Перед прибытием на участок
  description: Документы и подготовка наблюдателя
  icon: book-open
  minutes: 3
  markdown: |-
    ## Подготовка

    - Подготовьте документы.
    - Изучите инструкции для этих выборов.

    Здесь разместите ваш проверенный текст.
  lawIds: []
  sourceIds: []
  references: []
  media: []
```

To add a lesson, add an entry in this folder **and** add its ID to the manifest's `topicIds`. An unselected lesson will not appear merely because its file exists.

Use known icon names such as `book-open`, `shield`, `home`, or `file-text`. `minutes` is the reading-time value; it does not schedule a lesson.

## 7. Roadmap: three small pieces

The separation is deliberate:

```text
route: which stages, in what order and on which days
  block: stage heading + list of task IDs
    task: the individual checkbox text + legal/media references
```

Complete examples: [tasks](../examples/authoring/example-city-2027/content/tasks/index.yaml), [blocks](../examples/authoring/example-city-2027/content/blocks/index.yaml), [route](../examples/authoring/example-city-2027/content/roadmaps/index.yaml).

### A. Write checkbox items in `content/tasks/`

```yaml
city-council-2027:record-arrival:
  id: city-council-2027:record-arrival
  text: Запишите время прибытия на участок.
  lawIds: []
  sourceIds: []
  media: []
```

### B. Put items into a stage in `content/blocks/`

```yaml
city-council-2027:arrival-block:
  id: city-council-2027:arrival-block
  title: Прибытие на участок
  time: До открытия
  sourceHeading: Название исходного материала
  taskIds:
    - city-council-2027:record-arrival
```

`taskIds` controls the checkbox order. `time` is displayed text, not an alarm. `sourceHeading` records the heading from the material you used.

### C. Put stages into a route in `content/roadmaps/`

```yaml
city-council-2027:route:
  id: city-council-2027:route
  steps:
    - id: arrival
      blockId: city-council-2027:arrival-block
      days: each
  anytime: []
```

`steps` is the main ordered checklist. `anytime` contains stages available independently of that order. The manifest selects this route through `roadmapConfigId`.

| `days` value | When the stage appears |
|---|---|
| `each` | Every voting day |
| `first` | First voting day |
| `middle` | Days between the first and last |
| `last` | Last voting day, including a one-day election |
| `except-last` | All voting days except the last |
| `last-after-first` | Last day only when the election has more than one day |

The order refers to the manifest's `dates`, not Monday/Tuesday or consecutive calendar days.

To make an anytime stage repeatable:

```yaml
anytime:
  - id: home
    blockId: city-council-2027:home-block
    repeatable: true
```

`home-block` must exist. Each repetition receives separate checks and notes. Main `steps` also accept `repeatable: true`.

The step's `id` and the block's `id` serve different purposes: the step identifies its place in the route; the block identifies its content. Keep both stable once the election is in use. Do not reuse a step ID twice in one route.

YAML supports aliases such as `&a1` and `*a1`: `*a1` reuses the object marked `&a1`. They are not IDs. **The starter avoids aliases; keep your authored entries explicit** so an edit does not unexpectedly affect another shared route.

## 8. Complaints and legal references

Open [starter complaint](../examples/authoring/global/complaints.yaml) and [starter template](../examples/authoring/global/complaint-templates.yaml).

Bodies live in `global/complaints.yaml`: `id`, `templateId`, `title`, `description`, `text`, `lawIds`. Templates live in `global/complaint-templates.yaml`: `id`, `title`, `category`, `header_template`, `footer_template`.

Complaints are selected automatically by `complaintId` links in tasks used by the election roadmap. Election `complaintIds` adds entries manually. Duplicates are removed. `lawIds` provides legal citations only; laws do not select complaints. Task `complaintId` also opens its complaint directly.

| Placeholder | Filled from |
|---|---|
| `{{recipient}}` | Recipient field |
| `{{observer_name}}` | Observer name field |
| `{{uik_number}}` | Selected polling station |
| `{{date}}` | Current device date |
| `{{time}}` | Editable time field |
| Another name, e.g. `{{incident_location}}` | An extra field generated in the form |

Extra placeholder names must use letters, numbers or underscores. Blank observer names are shown as an editable placeholder. Use «Изменить сведения» to enter the recipient, observer name, time and facts, then regenerate the individual complaint. Facts entered by the observer are appended as literal text.

Multiple templates are supported using `templateId`. The dedicated original-template button opens the shared `complaint-source` file.

### How a law reaches the Laws screen

```text
selected lesson's lawIds
OR selected route's task lawIds
OR selected complaint lawIds
    → legal entry
        → its sourceIds
            → original document
```

You do not maintain a separate election law list.

Add laws shared between campaigns to `global/laws/laws.yaml`. A campaign-only entry may live in `content/laws/` and needs the campaign prefix.

A legal entry uses `title`, `text`, `status`, `source`, `sourceIds`, and `references`. `source` is a text description of provenance; `sourceIds` is the actual link to original files. A `references` item uses `sourceId`, `label`, and optionally `locator`.

The starter legal entry intentionally says **EXAMPLE**. Replace its title, exact excerpt, provenance, locator and source association together. `status` is descriptive text; changing it does not verify the law or hide the entry.

## 9. Original files, images and videos

### Original document: copy, describe and build

1. Copy the original into `src/content/global/documents/`.
2. Describe it in `global/documents/sources.yaml` (or a campaign-local `content/sources/` file).
3. Run `npm run build:content`. The file registration is generated automatically.

Example source entry:

```yaml
city-council-2027:regional-law-original:
  id: city-council-2027:regional-law-original
  title: Название исходного документа и редакция
  purpose: raw-law
  name: regional-law.pdf
  mime: application/pdf
  assetKey: regionalLaw2027
```

By default, a source with a non-null `assetKey` loads `global/documents/<name>` relative to `src/content/`. You do not edit TypeScript for each document.

For manual control, add an explicit `file` path:

```yaml
  name: Regional law.pdf
  file: elections/city-council-2027/originals/regional-law.pdf
```

`file` chooses the physical file; `name` is the filename offered when opening/sharing. If you omit `file`, `name` also determines the physical filename. Keep the file inside `src/content/`.

`assetKey` is a stable bundle key, generated into `source-assets.generated.ts`. `assetKey: null` deliberately leaves a source unavailable. Nothing is downloaded or discovered automatically. Only sources you list are bundled; missing files and conflicting keys fail the build. `npm run check:content` detects stale generated registrations.


Put the source ID in the legal entry's `sourceIds` and, when appropriate, its `references`. A law-linked source must have `purpose: raw-law`.

Useful file descriptions:

| File | `mime` |
|---|---|
| PDF | `application/pdf` |
| DOCX | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| RTF | `application/rtf` |
| PNG | `image/png` |
| JPEG | `image/jpeg` |
| MP4 | `video/mp4` |

Other `purpose` values are `template`, `filled-example`, `photo-example`, `procedure-video`, and `unclassified`.

### Images in lessons or checklist items

Describe the image as a source as above; set `file: global/images/your-image.png`. The build generates its registration. You may create `global/images/` for the image itself. In the lesson/task, include both the source link and the media description:

```yaml
sourceIds:
  - city-council-2027:room-diagram
media:
  - kind: image
    sourceId: city-council-2027:room-diagram
    alt: Схема помещения для голосования
```

The image source could use `purpose: photo-example`. Keep its ID in `sourceIds` as well as `media`; the current scope validator expects the source to be included. A path or URL alone does not bundle an image.

### Video at the top of a lesson

Copy the MP4 to `src/content/global/videos/` and describe it in `src/content/global/videos/sources.yaml`:

```yaml
introduction-video:
  id: introduction-video
  title: Название видео
  purpose: procedure-video
  name: introduction-2027.mp4
  file: global/videos/introduction-2027.mp4
  mime: video/mp4
  assetKey: introduction-video
```

Run `npm run build:content`. Both the bundled file registration and the lesson video list are generated automatically. No TypeScript edit is required. Video descriptions stay in `global/videos/sources.yaml`; document descriptions stay in `global/documents/sources.yaml`. Source IDs must be unique across both files.

Add the source ID to the lesson:

```yaml
videoId: introduction-video
```

For an election-local source, prefix the source ID with the election ID as usual. `videoId` always matches the source's `id`, which may differ from its `assetKey`. By default, videos use `global/videos/<name>`. Set `file` to control the physical path and `title` to control the displayed title. `assetKey: null` excludes the video from the player list; a lesson referencing an unknown or unpublished video fails the build. Published `procedure-video` sources must have a `video/` MIME type. `npm run check:content` verifies both generated registries.


### Sources-screen limitation

The Laws/Sources library shows originals linked to laws used by the active election. Registering an arbitrary file, or adding a `documentIds` entry, does not guarantee it appears there. A named document entry has `id`, `title`, and `sourceId`; it is displayed in that library only if its source is also in the active law-derived source set. Lesson/task media is opened from its lesson/task instead.

## 10. Default contacts and headquarters

These two tables are currently **global-only**. Election-local `content/contacts/` and `content/headquarters/` folders are not loaded.

Add a verified contact to `global/contacts.yaml`:

```yaml
city-council-2027:coordinator:
  id: city-council-2027:coordinator
  name: Фамилия Имя Отчество
  role: Координатор штаба
  phone: "+7XXXXXXXXXX" # Replace with the actual phone number.
```

Add its headquarters to `global/headquarters.yaml`:

```yaml
city-council-2027:headquarters:
  id: city-council-2027:headquarters
  title: Штаб городских выборов
  contactIds:
    - city-council-2027:coordinator
```

Set the relevant UIKs' `hqId` to `city-council-2027:headquarters`. That link decides which default contacts the observer sees. Personal contacts added in the app are separate and stay on the device.

If a file currently contains only `{}`, replace it with the new entries; do not leave `{}` above them.

## 11. What can I delete?

| Goal | Safe sequence |
|---|---|
| Hide/remove an election from the shipped selector | Remove its line from `catalog-manifest.yaml`; then delete its election folder if no longer needed |
| Remove a lesson | Remove its ID from `topicIds`; then delete its YAML entry if nothing else uses it |
| Remove a checkbox item | Remove its ID from every block's `taskIds`; then delete the task entry |
| Remove a stage | Remove the step from its route; delete the block/tasks only if no other route uses them |
| Remove a polling station | Delete its UIK entry; remove parent commissions only when they have no remaining children |
| Remove a complaint checkbox | Delete that item; leave at least one checkbox in the active template |
| Remove a legal entry | Remove all references to its ID from lessons, tasks and complaint items; then delete it |
| Remove an original file | Remove every legal/media/document reference and its source entry; remove the matching code registration; then delete the physical file |
| Remove a default contact | Remove it from every headquarters `contactIds` list, then delete its entry |

Do not delete the required `manifest.yaml` or `commissions.yaml` while the election is still registered. Do not delete an entire required global table file; use `{}` for an empty table where appropriate. Global roadmaps/content still need to satisfy all registered elections.

Deleting content does not erase device observations. Removing an election/station requires a new valid selection; historical observations may remain in local storage. It also does not recall an older already-distributed app bundle.

## 12. YAML basics and common errors

Use spaces, not tabs. Keep siblings at the same indentation. Use `|-` for multiline text and `[]` for an empty list. Keep phone numbers, station numbers and dates quoted.

| Error/symptom | Check |
|---|---|
| `Table key differs from ID` | Outer YAML key and inner `id` must be identical |
| `Local IDs must use campaign prefix` | A local entry must start with `election.id + ':'` |
| `Duplicate content ID` / duplicate YAML key | You copied an entry without giving it a new ID |
| `Unknown topic/block/task/law` or `Unknown reference` | A referenced ID is missing or misspelled |
| `missing file` / `Conflicting files for assetKey` | Check `file` (or default `global/documents/<name>`), the physical file and duplicate bundle keys |
| `Source outside campaign` | Include media/reference source IDs in the lesson/task's `sourceIds` |
| `Invalid commission hierarchy` | Check commission kinds and `parentId` links |
| `Only IKSRF can be a root` | Add the regional root instead of making OIK/TIK a root |
| `Incomplete UIK` | Supply number, region, address and members list |
| Build succeeds, lesson absent | Add it to `topicIds` |
| Build succeeds, original absent | Check active law references; Sources is not an unrestricted file list |
| Your edits disappear after rebuilding | You edited generated JSON instead of YAML |
| YAML parses but app unchanged | Rebuild/restart; distribute a new mobile bundle if needed |

The command validates relationships and formats. It does not confirm election dates, addresses, phone numbers or legal applicability for you.

## 13. Before publishing real data

- Replace all starter placeholders, including the example legal reference and complaint wording.
- Confirm dates, hierarchy, station numbers, addresses, member information and contact numbers.
- Check that every selected lesson and route is appropriate for this election.
- Open each original and media item from the app.
- Run the content build/check and test the election selector, checklist and complaint form.
- Keep the election's IDs and dates stable after people begin using it.

The complete starter can be checked without adding it to the app:

```text
npm run check:example
```

This uses the actual content builder in a temporary workspace and leaves the active campaigns and generated bundle unchanged.





