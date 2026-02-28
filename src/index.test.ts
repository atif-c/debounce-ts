import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { debounce } from './index.js';

describe('debounce', () => {
	const delay = 100;

	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('input validation', () => {
		it('should throw TypeError for non-number delay', () => {
			// @ts-expect-error – intentionally passing invalid type
			const call = () => debounce(async () => {}, { delay: true });
			expect(call).toThrow(new TypeError('delay must be a non-negative integer'));
		});

		it('should throw TypeError for NaN delay', () => {
			const call = () => debounce(async () => {}, { delay: NaN });
			expect(call).toThrow(new TypeError('delay must be a non-negative integer'));
		});

		it('should throw TypeError for float delay', () => {
			const call = () => debounce(async () => {}, { delay: 100.5 });
			expect(call).toThrow(new TypeError('delay must be a non-negative integer'));
		});

		it('should throw TypeError for negative delay', () => {
			const call = () => debounce(async () => {}, { delay: -1 });
			expect(call).toThrow(new TypeError('delay must be a non-negative integer'));
		});

		it('should throw for Infinity delay', () => {
			const call = () => debounce(async () => {}, { delay: Infinity });
			expect(call).toThrow(new TypeError('delay must be a non-negative integer'));
		});

		it('should throw TypeError for non-number maxWait', () => {
			// @ts-expect-error – intentionally passing invalid type
			const call = () => debounce(async () => {}, { delay, maxWait: true });
			expect(call).toThrow(new TypeError('maxWait must be a non-negative integer'));
		});

		it('should throw TypeError for NaN maxWait', () => {
			const call = () => debounce(async () => {}, { delay, maxWait: NaN });
			expect(call).toThrow(new TypeError('maxWait must be a non-negative integer'));
		});

		it('should throw TypeError for float maxWait', () => {
			const call = () => debounce(async () => {}, { delay, maxWait: 100.5 });
			expect(call).toThrow(new TypeError('maxWait must be a non-negative integer'));
		});

		it('should throw TypeError for negative maxWait', () => {
			const call = () => debounce(async () => {}, { delay, maxWait: -1 });
			expect(call).toThrow(new TypeError('maxWait must be a non-negative integer'));
		});

		it('should throw TypeError for Infinity maxWait', () => {
			const call = () => debounce(async () => {}, { delay, maxWait: Infinity });
			expect(call).toThrow(new TypeError('maxWait must be a non-negative integer'));
		});

		it('should throw TypeError if maxWait is less than delay', () => {
			const call = () => debounce(async () => {}, { delay: 200, maxWait: 100 });
			expect(call).toThrow(new TypeError('maxWait must be greater than or equal to delay'));
		});

		it('should accept maxWait equal to delay', () => {
			expect(() => debounce(async () => {}, { delay, maxWait: 100 })).not.toThrow();
		});
	});

	describe('basic behaviour', () => {
		it('should work without options', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn);

			debounced('first');
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(1000);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');
		});

		it('should call function once after delay', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay });

			debounced('first');
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');
		});

		it('should reset delay on each call', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay });

			debounced('first');
			await vi.advanceTimersByTimeAsync(delay / 2);
			expect(mockFn).not.toHaveBeenCalled();

			debounced('second');
			await vi.advanceTimersByTimeAsync(delay / 2);
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'second');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'second');
		});

		it('should use last args when called multiple times', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay });

			debounced('first');
			expect(mockFn).not.toHaveBeenCalled();

			debounced('second');
			expect(mockFn).not.toHaveBeenCalled();

			debounced('third');
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'third');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'third');
		});

		it('should return void (fire-and-forget)', () => {
			const mockFn = vi.fn(async (_arg: string) => 'result');
			const debounced = debounce(mockFn, { delay });

			const result = debounced('first');

			expect(result).toBeUndefined();
		});
	});

	// Here
	describe('immediate mode', () => {
		it('should fire on leading edge', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay, immediate: true });

			debounced('first');
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');
		});

		it('should fire leading AND trailing with new call', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay, immediate: true });

			debounced('first');
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			debounced('second');
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenNthCalledWith(2, 'second');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenNthCalledWith(2, 'second');
		});

		it('should NOT fire trailing if no new calls', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay, immediate: true });

			debounced('first');
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');
		});

		it('should treat next call after cooldown as new leading', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay, immediate: true });

			debounced('first');
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			await vi.advanceTimersByTimeAsync(delay);
			debounced('second');
			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenNthCalledWith(2, 'second');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenNthCalledWith(2, 'second');
		});

		it('should fire trailing with multiple rapid calls after leading', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay, immediate: true });

			debounced('first');
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			debounced('second');
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			debounced('third');
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			debounced('fourth');
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenNthCalledWith(2, 'fourth');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenNthCalledWith(2, 'fourth');
		});
	});

	describe('option combinations', () => {
		it('should work with immediate + delay (leading + trailing)', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay, immediate: true });

			debounced('first');
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			debounced('second');
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenNthCalledWith(2, 'second');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenNthCalledWith(2, 'second');
		});

		it('should work with immediate + maxWait', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay, maxWait: 200, immediate: true });

			debounced('first');
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			await vi.advanceTimersByTimeAsync(90);
			debounced('second');
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			await vi.advanceTimersByTimeAsync(90);
			debounced('third');
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			await vi.advanceTimersByTimeAsync(90);
			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenNthCalledWith(2, 'third');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenNthCalledWith(2, 'third');
		});

		it('should work with delay + maxWait (no immediate)', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay, maxWait: 200 });

			debounced('first');
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(90);
			expect(mockFn).not.toHaveBeenCalled();

			debounced('second');
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(90);
			expect(mockFn).not.toHaveBeenCalled();

			debounced('third');
			await vi.advanceTimersByTimeAsync(90);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'third');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'third');
		});

		it('should work with all options together', async () => {
			const onError = vi.fn();
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, {
				delay,
				maxWait: 300,
				immediate: true,
				onError
			});

			debounced('first');
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			debounced('second');
			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenNthCalledWith(2, 'second');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenNthCalledWith(2, 'second');
		});
	});

	describe('maxWait enforcement', () => {
		it('should force execution after maxWait', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay, maxWait: 200 });

			debounced('first');
			await vi.advanceTimersByTimeAsync(90);
			expect(mockFn).not.toHaveBeenCalled();

			debounced('second');
			await vi.advanceTimersByTimeAsync(90);
			expect(mockFn).not.toHaveBeenCalled();

			debounced('third');
			await vi.advanceTimersByTimeAsync(90);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'third');

			debounced('fourth');
			await vi.advanceTimersByTimeAsync(90);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'third');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenNthCalledWith(2, 'fourth');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenNthCalledWith(2, 'fourth');
		});

		it('should fire maxWait even if delay has not elapsed', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: delay, maxWait: 150 });

			debounced('first');
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(75);
			debounced('second');
			await vi.advanceTimersByTimeAsync(75);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'second');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'second');
		});

		it('should handle multiple maxWait intervals during sustained calling', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay, maxWait: 200 });

			// First interval
			debounced('first');
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(90);
			expect(mockFn).not.toHaveBeenCalled();

			debounced('second');
			expect(mockFn).not.toHaveBeenCalled();
			await vi.advanceTimersByTimeAsync(90);

			debounced('third');
			expect(mockFn).not.toHaveBeenCalled();
			await vi.advanceTimersByTimeAsync(90);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'third');

			// Second interval
			debounced('fourth');
			await vi.advanceTimersByTimeAsync(90);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'third');

			debounced('fifth');
			await vi.advanceTimersByTimeAsync(90);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'third');

			debounced('sixth');
			await vi.advanceTimersByTimeAsync(90);
			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenNthCalledWith(2, 'sixth');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenNthCalledWith(2, 'sixth');
		});

		it('should not fire maxWait if delay completes first', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay, maxWait: 1000 });

			debounced('first');
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			await vi.advanceTimersByTimeAsync(1000);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');
		});
	});

	describe('error handling (onError)', () => {
		it('should route async errors to onError callback', async () => {
			const error = new Error('test error');
			const mockFn = vi.fn(async () => {
				throw error;
			});
			const onError = vi.fn();
			const debounced = debounce(mockFn, { delay, onError });

			debounced();
			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(onError).toHaveBeenNthCalledWith(1, error);

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(onError).toHaveBeenNthCalledWith(1, error);
		});

		it('should receive the exact error instance', async () => {
			const error = new TypeError('custom error');
			const mockFn = vi.fn(async () => {
				throw error;
			});
			const onError = vi.fn();
			const debounced = debounce(mockFn, { delay, onError });

			debounced();
			await vi.advanceTimersByTimeAsync(delay);
			expect(onError).toHaveBeenCalledTimes(1);
			expect(onError).toHaveBeenNthCalledWith(1, error);
			expect(onError.mock.calls[0][0]).toBe(error);

			await vi.advanceTimersByTimeAsync(delay);
			expect(onError).toHaveBeenCalledTimes(1);
			expect(onError).toHaveBeenNthCalledWith(1, error);
			expect(onError.mock.calls[0][0]).toBe(error);
		});

		it('should not call onError when function succeeds', async () => {
			const onError = vi.fn();
			const mockFn = vi.fn(async () => 'success');
			const debounced = debounce(mockFn, { delay, onError });

			debounced();
			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(onError).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(onError).not.toHaveBeenCalled();
		});

		it('should handle errors without onError (unhandled rejection)', async () => {
			const mockFn = vi.fn(async () => {
				throw new Error('unhandled');
			});
			const debounced = debounce(mockFn, { delay });

			debounced();
			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			// No crash - unhandled rejection is the expected behavior

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
		});

		it('should handle sync function errors without onError (unhandled rejection)', async () => {
			const mockFn = vi.fn(() => {
				throw new Error('sync error');
			});
			const debounced = debounce(mockFn, { delay });

			debounced();
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
		});
	});

	describe('timer cleanup', () => {
		it('should clear timers after normal execution', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay });

			debounced('first');
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			await vi.advanceTimersByTimeAsync(delay * 2);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');
		});

		it('should not fire stale timer after cancel', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay });

			debounced('first');
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(delay / 2);
			expect(mockFn).not.toHaveBeenCalled();

			debounced('second');
			debounced.cancel();
			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).not.toHaveBeenCalled();
		});

		it('should not fire stale timer after flush', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay });

			debounced('first');
			expect(mockFn).not.toHaveBeenCalled();

			debounced.flush();
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');
		});
	});

	describe('cancel() method', () => {
		it('should cancel pending invocation', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay });

			debounced('first');
			expect(mockFn).not.toHaveBeenCalled();

			debounced.cancel();

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).not.toHaveBeenCalled();
		});

		it('should clear all timers', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay, maxWait: 200 });

			debounced('first');
			expect(mockFn).not.toHaveBeenCalled();
			debounced.cancel();
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).not.toHaveBeenCalled();
		});

		it('should be safe to call when nothing is pending', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay });

			expect(mockFn).not.toHaveBeenCalled();
			expect(() => debounced.cancel()).not.toThrow();

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).not.toHaveBeenCalled();
		});

		it('should start fresh debounce cycle after cancel', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay });

			debounced('first');
			expect(mockFn).not.toHaveBeenCalled();

			debounced.cancel();
			expect(mockFn).not.toHaveBeenCalled();

			debounced('second');
			expect(mockFn).not.toHaveBeenCalled();
			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'second');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'second');
		});

		it('should cancel immediate mode trailing call', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay, immediate: true });

			debounced('first');
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			debounced('second');
			debounced.cancel();

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');
		});
	});

	describe('flush() method', () => {
		it('should immediately invoke pending function', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay });

			debounced('first');
			expect(mockFn).not.toHaveBeenCalled();

			debounced.flush();
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');
		});

		it('should clear all timers', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay });

			debounced('first');
			expect(mockFn).not.toHaveBeenCalled();

			debounced.flush();
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');
		});

		it('should be no-op when nothing is pending', () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay });

			expect(() => debounced.flush()).not.toThrow();
			expect(mockFn).not.toHaveBeenCalled();
		});

		it('should start fresh debounce cycle after flush', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay });

			debounced('first');
			expect(mockFn).not.toHaveBeenCalled();

			debounced.flush();
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			debounced('second');
			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenNthCalledWith(2, 'second');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');
			expect(mockFn).toHaveBeenNthCalledWith(2, 'second');
		});

		it('should invoke with most recent call', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay });

			debounced('first');
			expect(mockFn).not.toHaveBeenCalled();

			debounced('second');
			expect(mockFn).not.toHaveBeenCalled();

			debounced('third');
			expect(mockFn).not.toHaveBeenCalled();

			debounced.flush();

			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'third');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'third');
		});
	});

	describe('synchronous functions', () => {
		it('should work with sync functions', async () => {
			const mockFn = vi.fn((x: number) => x);
			const debounced = debounce(mockFn, { delay });

			debounced(1);
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 1);

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 1);
		});

		it('should handle errors from sync functions', async () => {
			const onError = vi.fn();
			const mockFn = vi.fn(() => {
				throw new Error('test error');
			});
			const debounced = debounce(mockFn, { delay, onError });

			debounced();
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(onError).toHaveBeenCalledTimes(1);
			expect(onError).toHaveBeenNthCalledWith(1, new Error('test error'));

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(onError).toHaveBeenCalledTimes(1);
			expect(onError).toHaveBeenNthCalledWith(1, new Error('test error'));
		});

		it('should work with sync functions in immediate mode', async () => {
			const mockFn = vi.fn((x: string) => x);
			const debounced = debounce(mockFn, { delay, immediate: true });

			debounced('first');
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');
		});

		it('should work with sync functions and maxWait', async () => {
			const mockFn = vi.fn((x: number) => x);
			const debounced = debounce(mockFn, { delay, maxWait: 200 });

			debounced(1);
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(90);
			expect(mockFn).not.toHaveBeenCalled();

			debounced(2);
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(90);
			expect(mockFn).not.toHaveBeenCalled();

			debounced(3);
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(90);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 3);

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 3);
		});

		it('should handle cancel with sync functions', async () => {
			const mockFn = vi.fn((x: number) => x);
			const debounced = debounce(mockFn, { delay });

			debounced(1);
			expect(mockFn).not.toHaveBeenCalled();

			debounced.cancel();
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).not.toHaveBeenCalled();
		});

		it('should handle flush with sync functions', async () => {
			const mockFn = vi.fn((x: number) => x);
			const debounced = debounce(mockFn, { delay });

			debounced(1);
			expect(mockFn).not.toHaveBeenCalled();

			debounced.flush();
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 1);

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 1);
		});
	});

	describe('argument handling', () => {
		it('should handle no arguments', async () => {
			const mockFn = vi.fn(async () => 'called');
			const debounced = debounce(mockFn, { delay });

			debounced();
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1);

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1);
		});

		it('should handle undefined as argument', async () => {
			const mockFn = vi.fn(async (_x?: unknown) => {});
			const debounced = debounce(mockFn, { delay });

			debounced(undefined);
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, undefined);

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, undefined);
		});

		it('should handle null as argument', async () => {
			const mockFn = vi.fn(async (_x?: unknown) => {});
			const debounced = debounce(mockFn, { delay });

			debounced(null);
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, null);

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, null);
		});

		it('should handle multiple arguments', async () => {
			const mockFn = vi.fn(async (_a?: unknown, _b?: unknown, _c?: unknown) => {});
			const debounced = debounce(mockFn, { delay });

			debounced(1, 'test', true);
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 1, 'test', true);

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 1, 'test', true);
		});

		it('should handle object arguments without mutation', async () => {
			const mockFn = vi.fn(async (_obj?: unknown) => {});
			const debounced = debounce(mockFn, { delay });

			const testObj = { value: 1 };
			debounced(testObj);
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, testObj);
			expect(testObj).toEqual({ value: 1 });

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, testObj);
			expect(testObj).toEqual({ value: 1 });
		});

		it('should handle array arguments without mutation', async () => {
			const mockFn = vi.fn(async (_arr?: unknown) => {});
			const debounced = debounce(mockFn, { delay });
			const testArr = [1, 2, 3];

			debounced(testArr);
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, testArr);
			expect(testArr).toEqual([1, 2, 3]); // Unchanged

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, testArr);
			expect(testArr).toEqual([1, 2, 3]); // Unchanged
		});
	});

	describe('edge cases', () => {
		it('should handle zero delay', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 0 });

			debounced('first');
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(0);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');
		});

		it('should handle zero maxWait', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 0, maxWait: 0 });

			debounced('first');
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(0);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');
		});

		it('should handle zero delay and maxWait', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 0, maxWait: 0 });

			debounced('first');
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(0);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');
		});

		it('should handle maxWait equal to delay', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: delay, maxWait: delay });

			debounced('first');
			await vi.advanceTimersByTimeAsync(delay);

			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');
		});

		it('should handle rapid successive calls with zero delay', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 0 });

			debounced('first');
			expect(mockFn).not.toHaveBeenCalled();

			debounced('second');
			expect(mockFn).not.toHaveBeenCalled();

			debounced('third');
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(0);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'third');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'third');
		});

		it('should handle very large delay values', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: delay * 1000 });

			debounced('first');
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(delay * 900);
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(delay * 100);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');
		});

		it('should continue working after error in function', async () => {
			const mockFn = vi.fn(async (_arg: string) => {
				if (shouldThrow) throw error;
				return 'success';
			});
			const error = new Error('original error');
			const onError = vi.fn();
			let shouldThrow = true;
			const debounced = debounce(mockFn, { delay, onError });

			// First call with error
			debounced('first');
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(delay);

			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(onError).toHaveBeenNthCalledWith(1, error);

			// Second call should still work
			shouldThrow = false;

			debounced('second');
			await vi.advanceTimersByTimeAsync(delay);

			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenNthCalledWith(2, 'second');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenNthCalledWith(2, 'second');
		});

		it('should handle multiple independent debounced instances', async () => {
			const mockFn1 = vi.fn(async (_arg: string) => {});
			const mockFn2 = vi.fn(async (_arg: string) => {});
			const debounced1 = debounce(mockFn1, { delay });
			const debounced2 = debounce(mockFn2, { delay: delay * 2 });

			debounced1('a');
			debounced2('b');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn1).toHaveBeenCalledTimes(1);
			expect(mockFn1).toHaveBeenNthCalledWith(1, 'a');
			expect(mockFn2).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(delay);

			expect(mockFn1).toHaveBeenCalledTimes(1);
			expect(mockFn1).toHaveBeenNthCalledWith(1, 'a');
			expect(mockFn2).toHaveBeenCalledTimes(1);
			expect(mockFn2).toHaveBeenNthCalledWith(1, 'b');
		});

		it('should handle rapid cancel/flush calls', () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay });

			debounced('first');
			debounced.cancel();
			debounced.cancel();
			debounced.flush();
			debounced.flush();
			debounced.cancel();
			debounced.flush();

			expect(mockFn).not.toHaveBeenCalled();
		});

		it('should handle calling debounced function after flush', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay });

			debounced('first');
			debounced('second');
			debounced.flush();

			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'second');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(1);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'second');

			debounced('third');
			await vi.advanceTimersByTimeAsync(delay);

			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenNthCalledWith(2, 'third');

			await vi.advanceTimersByTimeAsync(delay);
			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenNthCalledWith(2, 'third');
		});
	});
});
