# Historical test data

`catalog.json` exercises populated-catalog workflows and migration behavior. It is test-only and is not imported into the application or exported bundles.

Node domain tests redirect catalog imports with `fixture-catalog-loader.mjs`; Jest uses its test-only module mapping. `empty-catalog.test.mjs` launches a separate process without that mapping to verify the actual empty application catalog and storage behavior. Browser tests exercise the actual empty app.
