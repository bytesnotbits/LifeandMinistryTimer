# WOL Importer Notes

## Current Import Model

- Treat numbered markdown headings as meeting parts, for example `### **3. Bible Reading**`.
- Keep part numbers in the visible part name.
- Do not create timer rows for standalone songs or prayers.
- Opening and closing rows are timed as comments only:
  - `Opening Comments` defaults to 1 minute if no explicit time is found.
  - `Concluding Comments` defaults to 3 minutes if no explicit time is found.
- For every part, scan the full block from its heading until the next part/section boundary and use the first `(N min.)` found.
- Use inferred durations only when the imported text does not include a usable time.
- Mark inferred durations with `durationSource: "inferred"` and add a note like `Review time: inferred 4 min.`

## Known Constraints

- GitHub Pages cannot fetch `wol.jw.org` directly because WOL does not allow cross-origin browser fetches.
- URL import uses the readable text fallback first.
- That fallback sometimes omits timing lines from WOL output, so URL imports may infer a few standard times.
- Paste-text import is the most accurate path when WOL reader output is incomplete.

## Regression Test

Run:

```powershell
node .\tests\importer-fixtures.test.cjs
```

The fixture test verifies:

- Songs/prayers are not timer rows.
- Numbered part names are preserved.
- Real `(N min.)` values inside a part block override defaults.
- Missing known times are marked as inferred.
- Bible Reading and Congregation Bible Study are captured.
