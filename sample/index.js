'use strict';

const { emptyDir } = require('fs-extra');
const { config } = require('@phylum/cli');
const { Task } = require('@phylum/pipeline');
const { HotModuleReplacementPlugin } = require('webpack');
const { WebpackTask } = require('@phylum/webpack');

// const { WebpackNodeTask } = require('@phylum/webpack-node');
const { WebpackNodeTask } = require('..');

/**
 * This task is used for cleaning up the output directory:
 */
const clean = new Task(async () => {
	await emptyDir(`${__dirname}/dist`);
});

const bundle = new WebpackTask(new Task(async t => {
	const { command } = await t.use(config);
	return {
		name: 'main',
		context: `${__dirname}/..`,
		mode: 'production',
		entry: [
			// ...(command.dev ? ['@phylum/webpack-node/dist/hmr'] : []),
			...(command.dev ? ['./dist/hmr'] : []),
			'./sample/src'
		],
		target: 'node',
		output: {
			path: `${__dirname}/dist`,
			filename: 'index.js'
		},
		plugins: command.dev ? [
			new HotModuleReplacementPlugin()
		] : [],
		watch: command.dev,
		node: false,
		externals: (ctx, req, cb) => /[?!]/.test(req) || /^(\.\.|\.)([\\/]|$)/.test(req) || isAbsolute(req)
			? cb() : cb(null, `commonjs ${req}`)
	};
}));

/**
 * The following task adds minimal logging when a compilation completes:
 */
const bundleAndLog = bundle.transform(stats => {
	const data = stats.toJson();
	for (const msg of data.errors) {
		console.error(msg);
	}
	for (const msg of data.warnings) {
		console.warn(msg);
	}
	if (data.errors.length === 0) {
		console.log(`Bundle complete: ${stats.compilation.compiler.options.name}`);
	}
});

/**
 * The node task.
 */
const node = new WebpackNodeTask(Task.value({
	mainHmr: true,
	main: bundle
}));

/**
 * The main task that will be executed by the phylum cli:
 */
exports.default = new Task(async t => {
	const { command } = await t.use(config);
	await t.use(clean);
	await t.use(bundleAndLog);
	// Only start the node process when running in dev mode:
	if (command.dev) {
		await t.use(node);
	}
});

/**
 * Add a '--dev | -d' flag to be parsed by the phylum cli:
 */
exports.args = [
	{name: 'dev', alias: 'd', type: 'flag', defaultValue: false}
];
