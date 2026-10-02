# Roadmap import

Checklist wording comes from [the supplied Google Doc](https://docs.google.com/document/d/1SM58QzuWTpygzH_jHyAblsd__kxxEuvhfhhEP1VKRE0/edit?tab=t.0), read on 2 October 2026. `google-doc-source.txt` preserves the fetched text. The Google Doc was not edited.

The app contains eight global blocks and 89 checklist items. Seven checklists are accompanied by the violations memo. Heading-only bullets become context for their child items, not extra checkboxes. The introductory document glossary stays in the saved source; it is not turned into a checklist or substituted for the existing theory content.

Editable content:

- `src/content/global/tasks.yaml`: checklist wording and atomic `lawIds`.
- `src/content/global/blocks.yaml`: groups of checklist items.
- `src/content/global/roadmaps.yaml`: the reusable `observer-multiday-route`.
- `src/content/elections/deputy-2026/manifest.yaml`: connects the election to that route.

Morning and in-room voting appear each day. The early-evening block appears on all days except the last. Counting and protocol checks appear on the last day. Evidence reminders and the violations memo are available at any time. Home voting is an anytime block with a separate checklist for each trip.

`task-law-map.json` records the Google heading, item wording and the DOCX legal-citation paragraphs used for each task. Only the legal-reference map from `dk-uik-2026.docx` supplies those links; none of its checklist wording was imported. The links open individual provisions through the `(i)` button, then their original files from the legal reader.

83 items have related legal citations. Six practical reminders have no direct citation in the DOCX: recording officer names, recording turnout intervals, later checking published results, delivering protocol copies, requesting a receipt on a complaint, and contacting headquarters/escalating a complaint. No legal reference was invented for these reminders.

The Google Doc's operational recommendations, phone numbers, dates and delivery address were preserved. Related-law links do not certify every recommendation as a statutory obligation; specific checklist claims may need editorial review against the linked provisions. In particular, 07:00–07:30 arrival, the more-than-30-applications threshold, mandatory photographs, and the delivery address are instructions from the Google Doc.

After editing YAML, run `npm run build:content` and `npm run check:content`. Changing a used task or step ID changes its saved progress identity; keep IDs stable when editing wording.
