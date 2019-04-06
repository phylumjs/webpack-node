/// <reference path="../types/webpack.d.ts"/>

process.on('message', message => {
	if (message && message.name === 'phylum-node-update') {
		applyUpdates();
	}
});

function applyUpdates() {
	function rejectUpdates() {
		process.send({ name: 'phylum-node-update-rejected' });
	}
	if (module.hot && module.hot.status() === 'idle') {
		let reject = false;
		module.hot.check({
			onUnaccepted: () => reject = true,
			onDeclined: () => reject = true
		}).catch(() => {
			reject = true;
		}).then(() => {
			if (reject) {
				rejectUpdates();
			}
		});
	} else {
		rejectUpdates();
	}
}
