// Compatibility entry point for the former JSON content checker.
if (!process.argv.includes('--check')) process.argv.push('--check');
await import('./build-content.mjs');
