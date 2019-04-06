
import { Task } from '@phylum/pipeline';
import { WebpackTask } from '@phylum/webpack';
import { StdioOptions, fork } from 'child_process';
import { resolve } from 'path';
import { inspect } from 'util';

export class WebpackNodeTask extends Task<WebpackNodeResult> {
	public constructor(optionsTask: Task<WebpackNodeOptions>) {
		super(async t => {
			const options = await t.use(optionsTask);
			const mainCompiler = await t.use(options.main.getCompiler);
			const context = mainCompiler.options.context || process.cwd();

			let proc = fork(
				options.entry ? resolve(context, options.entry) : mainCompiler.options.output.path,
				options.args || [],
				{
					cwd: options.cwd || context,
					stdio: options.stdio || [0, 1, 2, 'ipc']
				}
			);
			proc.on('message', message => {
				if (message && message.name === 'phylum-node-update-rejected') {
					t.reset();
				}
			});

			const done = new Promise<void>(resolve => {
				proc.on('error', resolve);
				proc.on('exit', resolve);
			}).then(() => {
				proc = null;
			});
			const result = new Promise<WebpackNodeResult>((resolve, reject) => {
				proc.on('error', reject);
				proc.on('exit', (code, signal) => {
					resolve({code, signal});
				});
			});
			t.using(() => {
				if (proc && !proc.killed) {
					proc.kill();
					proc = null;
				}
				return done;
			});
			if (options.mainHmr) {
				t.using(options.main.pipe(state => {
					state.then(stats => {
						if (proc) {
							proc.send({
								name: 'phylum-node-update',
								stats: stats.toJson({ all: false, errors: true, warnings: true })
							});
						} else {
							t.reset();
						}
					}).catch(error => {
						if (proc) {
							proc.send({
								name: 'phylum-node-update',
								error: error.stack || inspect(error)
							});
						} else {
							t.reset();
						}
					});
				}));
			}
			return result;
		});
	}
}

export interface WebpackNodeOptions {
	readonly main: WebpackTask;
	readonly mainHmr?: boolean;
	readonly entry?: string;
	readonly cwd?: string;
	readonly args?: string[];
	readonly stdio?: StdioOptions;
}

export interface WebpackNodeResult {
	readonly code: number;
	readonly signal: string;
}
