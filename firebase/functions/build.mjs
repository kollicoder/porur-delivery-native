// Bundles src/index.ts (+ the shared pure logic in packages/shared/src/models.ts) into lib/index.js. firebase-* stay external.
import { build } from '/workspace/porur-prototype/node_modules/esbuild/lib/main.js';
await build({ entryPoints: ['src/index.ts'], bundle: true, platform: 'node', target: 'node22', format: 'cjs', outfile: 'lib/index.js', external: ['firebase-admin', 'firebase-functions'] });
console.log('built lib/index.js');
