export interface DebounceOptions {
	immediate?: boolean;
	delay?: number;
	maxWait?: number;
	onError?: (error: unknown) => void;
}

export interface DebouncedFunction<TArgs extends readonly unknown[]> {
	(...args: TArgs): void;
	cancel(): void;
	flush(): void;
}

/**
 * Creates a debounced version of a function (sync or async) that delays invoking it
 * until after a specified wait time has elapsed since the last call.
 *
 * Supports leading-edge invocation (immediate), max wait enforcement, and
 * error handling via an onError callback.
 *
 * @template TArgs - Function argument types
 * @template TReturn - Function return type
 * @param {Function} fn - Function to debounce (can be sync or async)
 * @param {DebounceOptions} [options] - Configuration options
 * @param {boolean} [options.immediate=false] - Fire on leading edge. Also fires
 *   trailing if new args arrive during cooldown.
 * @param {number} [options.delay=1000] - Delay in ms after last call
 * @param {number} [options.maxWait] - Max time in ms before forced execution
 * @param {Function} [options.onError] - Error handler for async rejections.
 *   Without this, errors surface as unhandled rejections.
 * @returns {DebouncedFunction} Debounced function (void return) with
 *   cancel() and flush() methods
 *
 * @throws {TypeError} If delay is not a non-negative number
 * @throws {TypeError} If maxWait is not a non-negative number
 * @throws {TypeError} If maxWait < delay
 *
 * @example
 * // Async function
 * const save = debounce(async (data) => {
 *     await api.save(data);
 * }, {
 *     delay: 500,
 *     maxWait: 5000,
 *     immediate: true,
 *     onError: (err) => console.error('Save failed:', err),
 * });
 *
 * // Sync function
 * const updateUI = debounce((value) => {
 *     element.textContent = value;
 * }, { delay: 300 });
 *
 * input.addEventListener('input', (e) => save(e.target.value));
 *
 * // Cleanup on unmount:
 * save.cancel();
 *
 * // Force save before navigation:
 * save.flush();
 */
export const debounce = <TArgs extends readonly unknown[], TReturn>(
	fn: (...args: TArgs) => TReturn | Promise<TReturn>,
	options?: DebounceOptions
): DebouncedFunction<TArgs> => {
	const { immediate = false, delay = 1000, maxWait, onError } = options ?? {};

	// Input validation
	if (typeof delay !== 'number' || Number.isNaN(delay) || delay < 0) {
		throw new TypeError('delay must be a non-negative number');
	}
	if (maxWait !== undefined) {
		if (typeof maxWait !== 'number' || Number.isNaN(maxWait) || maxWait < 0) {
			throw new TypeError('maxWait must be a non-negative number');
		}
		if (maxWait < delay) {
			throw new TypeError('maxWait must be greater than or equal to delay');
		}
	}

	let timeout: ReturnType<typeof setTimeout> | null = null;
	let maxTimeout: ReturnType<typeof setTimeout> | null = null;

	let pendingArgs: TArgs | null = null;
	let firstCallTime: number | null = null;

	const invoke = () => {
		if (!pendingArgs) return;
		const args = pendingArgs;
		pendingArgs = null;

		// Wrap in try-catch to handle sync errors, then Promise.resolve() for async
		try {
			const result = fn(...args);
			const promise = Promise.resolve(result);
			if (onError) {
				promise.catch(onError);
			}
			// Without onError, the rejection is unhandled → triggers
			// Node's unhandledRejection event (standard, visible behavior)
		} catch (error) {
			// Handle synchronous errors
			if (onError) {
				onError(error);
			} else {
				// Re-throw to maintain unhandled rejection behavior
				Promise.reject(error);
			}
		}
	};

	const clearTimers = () => {
		if (timeout) {
			clearTimeout(timeout);
			timeout = null;
		}

		if (maxTimeout) {
			clearTimeout(maxTimeout);
			maxTimeout = null;
		}
	};

	const startMaxWaitTimer = () => {
		if (maxWait === undefined || maxTimeout || firstCallTime === null) return;

		const elapsed = Date.now() - firstCallTime;
		const remaining = Math.max(0, maxWait - elapsed);

		maxTimeout = setTimeout(() => {
			clearTimers();
			invoke();
			firstCallTime = null;
		}, remaining);
	};

	const debounced = ((...args: TArgs) => {
		pendingArgs = args;

		if (firstCallTime === null) {
			firstCallTime = Date.now();
		}

		const shouldInvokeLeading = immediate && timeout === null;

		if (timeout) {
			clearTimeout(timeout);
		}

		timeout = setTimeout(() => {
			timeout = null;

			// Fire trailing call if:
			// - Not in immediate mode (standard trailing behavior), OR
			// - In immediate mode AND new args arrived after the leading call
			if (!immediate || pendingArgs !== null) {
				invoke();
			}

			if (maxTimeout) {
				clearTimeout(maxTimeout);
				maxTimeout = null;
			}

			firstCallTime = null;
		}, delay);

		if (shouldInvokeLeading) {
			invoke();
			// invoke() nulls pendingArgs. Any subsequent call during cooldown
			// sets pendingArgs to new args, which the trailing timeout detects.
		}

		startMaxWaitTimer();
	}) as DebouncedFunction<TArgs>;

	debounced.cancel = () => {
		clearTimers();
		pendingArgs = null;
		firstCallTime = null;
	};

	debounced.flush = () => {
		clearTimers();
		invoke();
	};

	return debounced;
};
