import { registerHooks } from 'node:module';

// Domain tests use historical fixtures; these records are never bundled in the app.
registerHooks({
  resolve(specifier, context, nextResolve) {
    const result = nextResolve(specifier, context);
    if (result.url === new URL('../src/content/catalog.generated.json', import.meta.url).href) {
      return { ...result, url: new URL('./fixtures/catalog.json', import.meta.url).href };
    }
    return result;
  },
});
