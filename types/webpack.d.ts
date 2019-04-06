
declare interface NodeModule {
	hot: {
		status(): string;
		check(applyOptions: {
			onUnaccepted: () => void,
			onDeclined: () => void
		}): Promise<void>;
	};
}
