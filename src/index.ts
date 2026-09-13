/**
 * Configuration options for the debounce function.
 *
 * All options are optional. `delay` defaults to `1000ms`, `immediate`
 * defaults to `false` (trailing-edge only), `maxWait` is disabled by
 * default, and `onError` is unset by default (failures are then uncaught
 * / unhandled because the wrapper returns `void`).
 */
export interface DebounceOptions {
	/**
	 * If `true`, invokes on the leading edge. Also fires on the trailing edge
	 * if the debounced function is called again during the cooldown.
	 *
	 * There is no leading-only mode: `immediate: true` always means
	 * leading + trailing (when re-triggered). Use `immediate: false`
	 * (the default) for trailing-edge-only debouncing.
	 *
	 * @default false
	 * @example
	 * ```ts
	 * const save = debounce(saveFn, { immediate: true, delay: 500 });
	 * save('a'); // fires immediately (leading)
	 * save('b'); // fires ~500ms later (trailing, latest args)
	 * ```
	 */
	immediate?: boolean;

	/**
	 * Milliseconds to wait after the last call before executing.
	 * Must be a non-negative integer. Non-integers, `NaN`, and `Infinity`
	 * throw a `TypeError`.
	 *
	 * @default 1000
	 * @example
	 * ```ts
	 * const save = debounce(saveFn, { delay: 300 });
	 * ```
	 */
	delay?: number;

	/**
	 * Maximum time in milliseconds from the first call in a burst before
	 * forced execution. Must be a non-negative integer greater than or equal
	 * to `delay`, otherwise a `TypeError` is thrown.
	 *
	 * Useful to guarantee execution during continuous calls (e.g. save at
	 * least every 5s while typing).
	 *
	 * @default undefined (disabled)
	 * @example
	 * ```ts
	 * // Save at least every 5s, even during continuous typing
	 * const save = debounce(saveFn, { delay: 1000, maxWait: 5000 });
	 * ```
	 */
	maxWait?: number;

	/**
	 * Error handler for sync errors and async rejections thrown by `fn`.
	 *
	 * The debounced wrapper returns `void` (fire-and-forget), so without
	 * `onError` there is no way for the caller to observe failures:
	 * sync errors throw from the timer callback (uncaught) and async
	 * rejections are left unhandled (Node `unhandledRejection`). Provide
	 * `onError` to route failures explicitly.
	 *
	 * @example
	 * ```ts
	 * const save = debounce(saveFn, {
	 *   onError: (err) => console.error('Save failed:', err)
	 * });
	 * ```
	 */
	onError?: (error: unknown) => void;
}

/**
 * A debounced function with control methods.
 *
 * The wrapper is fire-and-forget: it always returns `void`, never the
 * wrapped function's return value. Results (and errors, unless `onError`
 * is set) are not observable by the caller.
 *
 * Note: the caller `this` is forwarded to `fn`.
 * The latest receiver is used when `fn` eventually runs.
 *
 * @template TArgs - Tuple of the wrapped function's argument types.
 */
export interface DebouncedFunction<TArgs extends readonly unknown[]> {
	/**
	 * Schedules (or re-schedules) execution with the given arguments.
	 * Only the latest arguments are used when `fn` eventually runs.
	 *
	 * @example
	 * ```ts
	 * const save = debounce(saveFn, { delay: 500 });
	 * save(data); // executes ~500ms after the last call
	 * ```
	 */
	(...args: TArgs): void;

	/**
	 * Cancels any pending invocation and clears all timers. Safe to call
	 * when nothing is pending. Use for cleanup on unmount.
	 *
	 * @example
	 * ```ts
	 * const save = debounce(saveFn, { delay: 500 });
	 * save(data);
	 * save.cancel(); // Prevents execution
	 * ```
	 */
	cancel(): void;

	/**
	 * Immediately executes the pending invocation (if any) using the latest
	 * arguments, bypassing the remaining delay, and clears all timers.
	 * No-op when nothing is pending. Returns `void`, not `fn`'s result.
	 *
	 * @example
	 * ```ts
	 * const save = debounce(saveFn, { delay: 1000 });
	 * save(data);
	 * save.flush(); // Executes immediately
	 * ```
	 */
	flush(): void;
}

/**
 * Creates a debounced version of a function (sync or async) that delays invoking it
 * until after `delay` milliseconds have elapsed since the last call.
 *
 * Supports leading-edge invocation (`immediate`), `maxWait` enforcement, and
 * error handling via an `onError` callback.
 *
 * The wrapper is fire-and-forget: it returns `void`, as does `flush()`.
 * Return values of `fn` are discarded. To observe failures, pass `onError`.
 *
 * @template TArgs - Tuple of the wrapped function's argument types.
 * @param fn - Function to debounce (sync or async). Called with the
 *   latest caller `this` (e.g. `debounced.call(ctx, ...)` or a detached
 *   method's receiver).
 * @param options - Configuration options.
 * @param options.immediate - Fire on the leading edge. Also fires on the
 *   trailing edge if called again during the cooldown. There is no
 *   leading-only mode. Defaults to `false` (trailing-edge only).
 * @param options.delay - Delay in ms after the last call. Must be a
 *   non-negative integer. Defaults to `1000`.
 * @param options.maxWait - Max time in ms from the first call in a burst
 *   before forced execution. Must be a non-negative integer `>= delay`.
 *   Disabled by default.
 * @param options.onError - Error handler for sync errors and async
 *   rejections. Without this, sync errors throw from the timer callback
 *   (uncaught) and async rejections are left unhandled (Node
 *   `unhandledRejection`), because the wrapper returns `void` and cannot
 *   propagate them to the caller.
 * @returns Debounced function (void return) with `cancel()` and `flush()` methods.
 *
 * @throws {TypeError} If fn is not a function.
 * @throws {TypeError} If options is not an object.
 * @throws {TypeError} If immediate is not a boolean.
 * @throws {TypeError} If onError is not a function.
 * @throws {TypeError} If delay is not a non-negative integer.
 * @throws {TypeError} If maxWait is not a non-negative integer.
 * @throws {TypeError} If maxWait is less than delay.
 *
 * @example
 * // Async function: runs ~500ms after the last call, at most every 5s
 * // during continuous calls. Failures are reported via `onError`.
 * const save = debounce(async (data: string) => {
 *     await api.save(data);
 * }, {
 *     delay: 500,
 *     maxWait: 5000,
 *     immediate: true,
 *     onError: (err) => console.error('Save failed:', err),
 * });
 *
 * // Sync function: updates the UI ~300ms after the last call.
 * const updateUI = debounce((value: string) => {
 *     element.textContent = value;
 * }, { delay: 300 });
 *
 * input.addEventListener('input', (e: Event) => save((e.target as HTMLInputElement).value));
 *
 * // Cleanup on unmount:
 * save.cancel();
 *
 * // Force save before navigation:
 * save.flush();
 */
export const debounce = <TArgs extends readonly unknown[]>(
	fn: (...args: TArgs) => unknown,
	options?: DebounceOptions
): DebouncedFunction<TArgs> => {
	if (typeof fn !== 'function') {
		throw new TypeError('fn must be a function');
	}
	if (options !== undefined && (typeof options !== 'object' || options === null)) {
		throw new TypeError('options must be an object');
	}

	const { immediate = false, delay = 1000, maxWait, onError } = options ?? {};

	if (typeof immediate !== 'boolean') {
		throw new TypeError('immediate must be a boolean');
	}
	if (onError !== undefined && typeof onError !== 'function') {
		throw new TypeError('onError must be a function');
	}

	if (typeof delay !== 'number' || Number.isNaN(delay) || !Number.isInteger(delay) || delay < 0) {
		throw new TypeError('delay must be a non-negative integer');
	}
	if (maxWait !== undefined) {
		if (
			typeof maxWait !== 'number' ||
			Number.isNaN(maxWait) ||
			!Number.isInteger(maxWait) ||
			maxWait < 0
		) {
			throw new TypeError('maxWait must be a non-negative integer');
		}
		if (maxWait < delay) {
			throw new TypeError('maxWait must be greater than or equal to delay');
		}
	}

	let timeout: ReturnType<typeof setTimeout> | null = null;
	let maxTimeout: ReturnType<typeof setTimeout> | null = null;

	let pendingArgs: TArgs | null = null;
	let lastThis: unknown = null;
	let firstCallTime: number | null = null;

	const invoke = () => {
		if (pendingArgs === null) return;
		const args = pendingArgs;
		const thisArg = lastThis;
		pendingArgs = null;
		lastThis = null;

		if (!onError) {
			// Without onError failures are unobservable: sync errors throw from
			// the timer callback (uncaught) and async rejections stay unhandled.
			// Leading-edge/flush calls throw synchronously to the caller instead.
			Reflect.apply(fn, thisArg, args);
			return;
		}

		// Only attach async handling for thenables to avoid a Promise.resolve()
		// allocation + microtask when `fn` returned a plain sync value.
		try {
			const result = Reflect.apply(fn, thisArg, args) as unknown;
			if (typeof (result as PromiseLike<unknown> | null | undefined)?.then === 'function') {
				Promise.resolve(result).catch(onError);
			}
		} catch (error) {
			onError(error);
		}
	};

	const clearTimers = () => {
		if (timeout !== null) {
			clearTimeout(timeout);
			timeout = null;
		}

		if (maxTimeout !== null) {
			clearTimeout(maxTimeout);
			maxTimeout = null;
		}
	};

	const startMaxWaitTimer = () => {
		if (maxWait === undefined || maxTimeout !== null || firstCallTime === null) return;

		const elapsed = Date.now() - firstCallTime;
		const remaining = Math.max(0, maxWait - elapsed);

		maxTimeout = setTimeout(() => {
			clearTimers();
			invoke();
			firstCallTime = null;
		}, remaining);
	};

	const debounced = function (this: unknown, ...args: TArgs): void {
		// eslint-disable-next-line @typescript-eslint/no-this-alias -- capture receiver for deferred invoke()
		lastThis = this;
		pendingArgs = args;

		if (firstCallTime === null) {
			firstCallTime = Date.now();
		}

		const shouldInvokeLeading = immediate && timeout === null;

		if (timeout !== null) {
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

			if (maxTimeout !== null) {
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
	} as DebouncedFunction<TArgs>;

	debounced.cancel = () => {
		clearTimers();
		pendingArgs = null;
		lastThis = null;
		firstCallTime = null;
	};

	debounced.flush = () => {
		clearTimers();
		invoke();
		firstCallTime = null;
	};

	return debounced;
};
