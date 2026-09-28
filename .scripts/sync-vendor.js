// Preserve the theme's public asset URLs while sourcing assets from the npm lockfile.
const { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');

const assets = {
  katex: ['dist/katex.min.js', 'dist/katex.min.css', 'dist/fonts', 'LICENSE'],
  webfontloader: ['webfontloader.js', 'LICENSE'],
  html5shiv: ['dist', 'MIT and GPL2 licenses.md'],
};

for (const [name, files] of Object.entries(assets)) {
  const source = resolve('node_modules', name);
  const destination = resolve('assets/bower_components', name);
  const { version } = JSON.parse(readFileSync(resolve(source, 'package.json'), 'utf8'));
  rmSync(destination, { recursive: true, force: true });
  mkdirSync(destination, { recursive: true });
  for (const file of files) {
    const target = resolve(destination, file);
    mkdirSync(require('node:path').dirname(target), { recursive: true });
    cpSync(resolve(source, file), target, { recursive: true });
  }
  writeFileSync(resolve(destination, 'VERSION'), `${name} ${version}\n`);
}
