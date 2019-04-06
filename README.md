
# Webpack Node Task
[![Build Status](https://travis-ci.com/phylumjs/webpack-node.svg?branch=master)](https://travis-ci.com/phylumjs/webpack-node)
[![Coverage Status](https://coveralls.io/repos/github/phylumjs/webpack-node/badge.svg?branch=master)](https://coveralls.io/github/phylumjs/webpack-node?branch=master)
[![Latest](https://img.shields.io/npm/v/@phylum/webpack-node.svg?label=latest) ![License](https://img.shields.io/npm/l/@phylum/webpack-node.svg?label=license)](https://npmjs.org/package/@phylum/webpack-node)

This package exposes a task that runs a node process for webpack bundled code and supports hot module replacement.

## Installation
```bash
npm i webpack @phylum/webpack @phylum/webpack-node
```

# Usage
The webpack node task runs a node process from bundled sources.
*Note, that the webpack task will not be started automatically by the webpack node task.*

```ts
import { Task } from '@phylum/pipeline';
import { WebpackTask } from '@phylum/webpack';
import { WebpackNodeTask } from '@phylum/webpack-node';

const bundle = new WebpackTask(...);

const node = new WebpackNodeTask(Task.value({
	main: bundle
}));

new Task(async t => {
	// Run the webpack compiler:
	await t.use(bundle);
	// Start a node process:
	await t.use(node);
});
```
*Note that the electron task assumes, that the main bundle has already been compiled.*

## Hot Module Replacement
```ts
new WebpackNodeTask(Task.value({
	// Enable hot module replacement:
	mainHmr: true,
	main: bundle
}));
```
```ts
// Import the hmr client somewhere in your main process code...
import '@phylum/webpack-node/dist/hmr';
```
```ts
// ...or add it to your entry point:
entry: ['@phylum/webpack-node/dist/hmr', './src/main.js'],

// Optional. Include the hmr runtime:
plugins: [
	new webpack.HotModuleReplacementPlugin()
]
```
If the hmr runtime is not included or an update is rejected, the main process will be rebooted.
