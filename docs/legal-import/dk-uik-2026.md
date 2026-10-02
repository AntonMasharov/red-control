# Legal provisions from the 2026 UIK checklist

The authored set is in `src/content/global/laws/laws.yaml`: 107 distinct entries, comprising 84 provisions of 67-ФЗ and 23 CEC provisions/annexes. Repeated citations reuse an ID. The reference map records 116 citation locations from `dk-uik-2026.docx`, including its complaint example and observer-status appendix.

## Sources and editions

- **67-ФЗ:** the uploaded `fz-67.docx` contains older wording, including article 30(9)(a) without electronic voter lists. It was preserved and was not used for the final excerpts. The cited articles were retrieved from КонсультантПлюс on 2 October 2026, in the edition identified by that site as 26 July 2026. Their offline copy is `src/content/global/documents/fz67-2026-cited-articles.txt`, registered as `fz67-2026-excerpts`. This copy includes only the 13 cited articles, not the entire statute. Each article's retrieval URL is in the file and the reference map.
- **CEC № 86/718-8:** excerpts come from the uploaded `cik-08_06_2022_N_86_718_8.rtf`, identified as amended on 24 June 2026. Entries link to `cik-multiday-voting`.
- The voter-list instruction `pril-6-66-9.1.docx` is not separately cited by the checklist's legal-reference column, so no provisions from it were added by inference.

These are source excerpts, not a certification that each checklist instruction or reference is legally correct for a particular election. The checklist's text and the newer statute can differ; the extracted legal wording was not rewritten to match the checklist.

## Splitting rules

- `п. 3, 5 ст. 30` produces two entries.
- `п. 10–11.1 ст. 66` produces points 10, 11 and 11.1.
- A continuous range includes existing decimal-numbered points between its endpoints: `п. 3–8 ст. 61` includes 3.1 and 7.1 as well as the integer points. This interpretation is explicit in the reference map and can be narrowed by editing those mappings before authoring tasks.
- A cited subclause such as `подп. «к» п. 9 ст. 30` is its own entry containing that subclause, rather than the whole point.
- The observer-status appendix separately cites whole points 9 and 10 of article 30; those full-point entries coexist with individually cited subclauses.
- CEC annexes 1 and 2 are separate entries containing their form text and explanatory footnotes. Table cells are represented as plain text, so use the original RTF for form layout.
- Repealed provisions explicitly cited by a range are retained with `status: repealed-in-source`; article 61(5) is one such entry. They must not be treated as a current requirement.
- Cross-references embedded inside the quoted laws are preserved as text, not recursively expanded into additional entries.

Formatting-only cleanup removes document hyperlink field instructions, amendment-history annotations, and empty paragraphs. It preserves statutory wording, clause numbers and substantive paragraphs.

## Traceability and editing

`dk-uik-2026-reference-map.json` records each checklist citation, its separate `lawIds`, source paragraph ranges, file hashes, excerpt hashes and retrieval URLs. Paragraph numbers are one-based extracted-text positions, not Word page numbers. Federal-law paragraph ranges refer to the combined extracted article paragraphs; CEC ranges refer to the RTF's extracted text lines.

To connect a checklist task, copy its `lawIds` from the reference map into the task's `lawIds` field. No elections, tasks or roadmaps were added during this import. Laws become visible when election material references them.

Edit the YAML if you need to correct an excerpt, preserving IDs used by tasks. Then run `npm run build:content` and `npm run check:content`. Update the audit record when replacing source excerpts; its hashes describe this import, not all future edits.
