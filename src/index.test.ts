import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from './index.js';

describe('debounce', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('basic behavior', () => {
		it('should call function once after delay', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100 });

			debounced('test');
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).toHaveBeenCalledOnce();
			expect(mockFn).toHaveBeenCalledWith('test');
		});

		it('should use last args when called multiple times', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100 });

			debounced('a');
			debounced('b');
			debounced('c');

			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).toHaveBeenCalledOnce();
			expect(mockFn).toHaveBeenCalledWith('c');
		});

		it('should return void (fire-and-forget)', () => {
			const mockFn = vi.fn(async (_arg: string) => 'result');
			const debounced = debounce(mockFn, { delay: 100 });

			const result = debounced('test');

			expect(result).toBeUndefined();
		});

		it('should reset delay on each call', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100 });

			debounced('a');
			await vi.advanceTimersByTimeAsync(50);

			debounced('b');
			await vi.advanceTimersByTimeAsync(50);

			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(50);

			expect(mockFn).toHaveBeenCalledOnce();
			expect(mockFn).toHaveBeenCalledWith('b');
		});
	});

	describe('immediate mode (leading + trailing)', () => {
		it('should fire on leading edge', () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100, immediate: true });

			debounced('first');

			expect(mockFn).toHaveBeenCalledOnce();
			expect(mockFn).toHaveBeenCalledWith('first');
		});

		it('should fire leading AND trailing with new args', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100, immediate: true });

			debounced('first');
			expect(mockFn).toHaveBeenCalledWith('first'); // leading

			debounced('second'); // new args during cooldown

			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenLastCalledWith('second'); // trailing
		});

		it('should NOT fire trailing if no new args', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100, immediate: true });

			debounced('only');

			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).toHaveBeenCalledOnce();
			expect(mockFn).toHaveBeenCalledWith('only');
		});

		it('should treat next call after cooldown as new leading', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100, immediate: true });

			debounced('first');
			expect(mockFn).toHaveBeenCalledTimes(1);

			await vi.advanceTimersByTimeAsync(100);

			debounced('second');
			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenLastCalledWith('second');
		});

		it('should fire trailing with multiple rapid calls after leading', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100, immediate: true });

			debounced('first');
			debounced('second');
			debounced('third');
			debounced('fourth');

			expect(mockFn).toHaveBeenCalledOnce();
			expect(mockFn).toHaveBeenCalledWith('first');

			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenLastCalledWith('fourth');
		});
	});

	describe('maxWait enforcement', () => {
		it('should force execution after maxWait', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100, maxWait: 200 });

			debounced('a');
			await vi.advanceTimersByTimeAsync(90);

			debounced('b');
			await vi.advanceTimersByTimeAsync(90);

			debounced('c');
			await vi.advanceTimersByTimeAsync(90);

			expect(mockFn).toHaveBeenCalledOnce();
			expect(mockFn).toHaveBeenCalledWith('c');
		});

		it('should fire maxWait even if delay has not elapsed', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 200, maxWait: 300 });

			debounced('test');
			await vi.advanceTimersByTimeAsync(150);
			debounced('test2');
			await vi.advanceTimersByTimeAsync(150);

			expect(mockFn).toHaveBeenCalledOnce();
			expect(mockFn).toHaveBeenCalledWith('test2');
		});

		it('should handle multiple maxWait intervals during sustained calling', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100, maxWait: 200 });

			// First interval
			debounced('a');
			await vi.advanceTimersByTimeAsync(90);
			debounced('b');
			await vi.advanceTimersByTimeAsync(90);
			debounced('c');
			await vi.advanceTimersByTimeAsync(90);

			expect(mockFn).toHaveBeenCalledOnce();

			// Second interval
			debounced('d');
			await vi.advanceTimersByTimeAsync(90);
			debounced('e');
			await vi.advanceTimersByTimeAsync(90);
			debounced('f');
			await vi.advanceTimersByTimeAsync(90);

			expect(mockFn).toHaveBeenCalledTimes(2);
		});

		it('should not fire maxWait if delay completes first', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100, maxWait: 1000 });

			debounced('test');
			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).toHaveBeenCalledOnce();
		});
	});

	describe('error handling (onError)', () => {
		it('should route async errors to onError callback', async () => {
			const error = new Error('test error');
			const onError = vi.fn();
			const mockFn = vi.fn(async () => {
				throw error;
			});
			const debounced = debounce(mockFn, { delay: 100, onError });

			debounced();
			await vi.advanceTimersByTimeAsync(100);

			expect(onError).toHaveBeenCalledWith(error);
		});

		it('should receive the exact error instance', async () => {
			const error = new TypeError('custom error');
			const onError = vi.fn();
			const mockFn = vi.fn(async () => {
				throw error;
			});
			const debounced = debounce(mockFn, { delay: 100, onError });

			debounced();
			await vi.advanceTimersByTimeAsync(100);

			expect(onError).toHaveBeenCalledOnce();
			expect(onError).toHaveBeenCalledWith(error);
			expect(onError.mock.calls[0][0]).toBe(error);
		});

		it('should not call onError when function succeeds', async () => {
			const onError = vi.fn();
			const mockFn = vi.fn(async () => 'success');
			const debounced = debounce(mockFn, { delay: 100, onError });

			debounced();
			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).toHaveBeenCalled();
			expect(onError).not.toHaveBeenCalled();
		});

		it('should handle errors without onError (unhandled rejection)', async () => {
			const mockFn = vi.fn(async () => {
				throw new Error('unhandled');
			});
			const debounced = debounce(mockFn, { delay: 100 });

			debounced();
			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).toHaveBeenCalled();
			// No crash - unhandled rejection is the expected behavior
		});
	});

	describe('input validation', () => {
		it('should throw TypeError for negative delay', () => {
			expect(() => debounce(async () => {}, { delay: -1 })).toThrow(TypeError);
			expect(() => debounce(async () => {}, { delay: -1 })).toThrow(
				'delay must be a non-negative number'
			);
		});

		it('should throw TypeError for NaN delay', () => {
			expect(() => debounce(async () => {}, { delay: NaN })).toThrow(TypeError);
			expect(() => debounce(async () => {}, { delay: NaN })).toThrow(
				'delay must be a non-negative number'
			);
		});

		it('should throw TypeError for non-number delay', () => {
			expect(() => debounce(async () => {}, { delay: 100 })).toThrow(TypeError);
			expect(() => debounce(async () => {}, { delay: 100 })).toThrow(
				'delay must be a non-negative number'
			);
		});

		it('should throw TypeError for negative maxWait', () => {
			expect(() => debounce(async () => {}, { delay: 100, maxWait: -1 })).toThrow(TypeError);
			expect(() => debounce(async () => {}, { delay: 100, maxWait: -1 })).toThrow(
				'maxWait must be a non-negative number'
			);
		});

		it('should throw TypeError for NaN maxWait', () => {
			expect(() => debounce(async () => {}, { delay: 100, maxWait: NaN })).toThrow(TypeError);
		});

		it('should throw TypeError for non-number maxWait', () => {
			expect(() => debounce(async () => {}, { delay: 100, maxWait: 200 })).toThrow(TypeError);
		});

		it('should throw TypeError for maxWait < delay', () => {
			expect(() => debounce(async () => {}, { delay: 200, maxWait: 100 })).toThrow(TypeError);
			expect(() => debounce(async () => {}, { delay: 200, maxWait: 100 })).toThrow(
				'maxWait must be greater than or equal to delay'
			);
		});

		it('should accept zero delay', () => {
			expect(() => debounce(async () => {}, { delay: 0 })).not.toThrow();
		});

		it('should accept maxWait equal to delay', () => {
			expect(() => debounce(async () => {}, { delay: 100, maxWait: 100 })).not.toThrow();
		});
	});

	describe('cancel() method', () => {
		it('should cancel pending invocation', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100 });

			debounced('test');
			debounced.cancel();

			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).not.toHaveBeenCalled();
		});

		it('should clear all timers', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100, maxWait: 200 });

			debounced('test');
			debounced.cancel();

			await vi.advanceTimersByTimeAsync(300);

			expect(mockFn).not.toHaveBeenCalled();
		});

		it('should be safe to call when nothing is pending', () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100 });

			expect(() => debounced.cancel()).not.toThrow();
		});

		it('should start fresh debounce cycle after cancel', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100 });

			debounced('first');
			debounced.cancel();

			debounced('second');
			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).toHaveBeenCalledOnce();
			expect(mockFn).toHaveBeenCalledWith('second');
		});

		it('should cancel immediate mode trailing call', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100, immediate: true });

			debounced('first');
			expect(mockFn).toHaveBeenCalledOnce();

			debounced('second');
			debounced.cancel();

			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).toHaveBeenCalledOnce();
		});
	});

	describe('flush() method', () => {
		it('should immediately invoke pending function', () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100 });

			debounced('test');
			debounced.flush();

			expect(mockFn).toHaveBeenCalledWith('test');
		});

		it('should clear all timers', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100 });

			debounced('test');
			debounced.flush();

			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).toHaveBeenCalledOnce();
		});

		it('should be no-op when nothing is pending', () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100 });

			expect(() => debounced.flush()).not.toThrow();
			expect(mockFn).not.toHaveBeenCalled();
		});

		it('should start fresh debounce cycle after flush', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100 });

			debounced('first');
			debounced.flush();

			debounced('second');
			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenNthCalledWith(1, 'first');
			expect(mockFn).toHaveBeenNthCalledWith(2, 'second');
		});

		it('should invoke with most recent args', () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100 });

			debounced('a');
			debounced('b');
			debounced('c');
			debounced.flush();

			expect(mockFn).toHaveBeenCalledOnce();
			expect(mockFn).toHaveBeenCalledWith('c');
		});
	});

	describe('timer cleanup', () => {
		it('should clear timers after normal execution', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100 });

			debounced('test');
			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).toHaveBeenCalledOnce();

			await vi.advanceTimersByTimeAsync(1000);

			expect(mockFn).toHaveBeenCalledOnce();
		});

		it('should not fire stale timer after cancel', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100 });

			debounced('first');
			await vi.advanceTimersByTimeAsync(50);

			debounced('second');
			debounced.cancel();

			await vi.advanceTimersByTimeAsync(150);

			expect(mockFn).not.toHaveBeenCalled();
		});

		it('should not fire stale timer after flush', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100 });

			debounced('test');
			debounced.flush();

			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).toHaveBeenCalledOnce();
		});
	});

	describe('option combinations', () => {
		it('should work with immediate + delay (leading + trailing)', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100, immediate: true });

			debounced('first');
			expect(mockFn).toHaveBeenCalledWith('first');

			debounced('second');
			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenLastCalledWith('second');
		});

		it('should work with immediate + maxWait', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100, maxWait: 200, immediate: true });

			debounced('first');
			expect(mockFn).toHaveBeenCalledOnce();

			await vi.advanceTimersByTimeAsync(90);
			debounced('second');

			await vi.advanceTimersByTimeAsync(90);
			debounced('third');

			await vi.advanceTimersByTimeAsync(90);

			expect(mockFn).toHaveBeenCalledTimes(2);
		});

		it('should work with delay + maxWait (no immediate)', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100, maxWait: 200 });

			debounced('a');
			await vi.advanceTimersByTimeAsync(90);

			debounced('b');
			await vi.advanceTimersByTimeAsync(90);

			debounced('c');
			await vi.advanceTimersByTimeAsync(90);

			expect(mockFn).toHaveBeenCalledOnce();
			expect(mockFn).toHaveBeenCalledWith('c');
		});

		it('should work with all options together', async () => {
			const onError = vi.fn();
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, {
				delay: 100,
				maxWait: 300,
				immediate: true,
				onError
			});

			debounced('first');
			expect(mockFn).toHaveBeenCalledOnce();

			debounced('second');
			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).toHaveBeenCalledTimes(2);
		});
	});

	describe('synchronous functions', () => {
		it('should work with sync functions', async () => {
			const mockFn = vi.fn((x: number) => x * 2);
			const debounced = debounce(mockFn, { delay: 100 });

			debounced(5);
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).toHaveBeenCalledOnce();
			expect(mockFn).toHaveBeenCalledWith(5);
		});

		it('should handle errors from sync functions', async () => {
			const onError = vi.fn();
			const mockFn = vi.fn(() => {
				throw new Error('sync error');
			});
			const debounced = debounce(mockFn, { delay: 100, onError });

			debounced();
			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).toHaveBeenCalledOnce();
			expect(onError).toHaveBeenCalledOnce();
			expect(onError).toHaveBeenCalledWith(new Error('sync error'));
		});

		it('should work with sync functions in immediate mode', () => {
			const mockFn = vi.fn((x: string) => x.toUpperCase());
			const debounced = debounce(mockFn, { delay: 100, immediate: true });

			debounced('hello');

			expect(mockFn).toHaveBeenCalledOnce();
			expect(mockFn).toHaveBeenCalledWith('hello');
		});

		it('should work with sync functions and maxWait', async () => {
			const mockFn = vi.fn((x: number) => x + 1);
			const debounced = debounce(mockFn, { delay: 100, maxWait: 200 });

			debounced(1);
			await vi.advanceTimersByTimeAsync(90);

			debounced(2);
			await vi.advanceTimersByTimeAsync(90);

			debounced(3);
			await vi.advanceTimersByTimeAsync(90);

			expect(mockFn).toHaveBeenCalledOnce();
			expect(mockFn).toHaveBeenCalledWith(3);
		});

		it('should handle cancel with sync functions', async () => {
			const mockFn = vi.fn((x: number) => x * 2);
			const debounced = debounce(mockFn, { delay: 100 });

			debounced(5);
			debounced.cancel();

			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).not.toHaveBeenCalled();
		});

		it('should handle flush with sync functions', () => {
			const mockFn = vi.fn((x: number) => x * 2);
			const debounced = debounce(mockFn, { delay: 100 });

			debounced(5);
			debounced.flush();

			expect(mockFn).toHaveBeenCalledOnce();
			expect(mockFn).toHaveBeenCalledWith(5);
		});
	});

	describe('argument handling', () => {
		it('should handle no arguments', async () => {
			const mockFn = vi.fn(async () => 'called');
			const debounced = debounce(mockFn, { delay: 100 });

			debounced();
			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).toHaveBeenCalledOnce();
			expect(mockFn).toHaveBeenCalledWith();
		});

		it('should handle undefined as argument', async () => {
			const mockFn = vi.fn(async (_x?: unknown) => {});
			const debounced = debounce(mockFn, { delay: 100 });

			debounced(undefined);
			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).toHaveBeenCalledOnce();
			expect(mockFn).toHaveBeenCalledWith(undefined);
		});

		it('should handle null as argument', async () => {
			const mockFn = vi.fn(async (_x?: unknown) => {});
			const debounced = debounce(mockFn, { delay: 100 });

			debounced(null);
			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).toHaveBeenCalledOnce();
			expect(mockFn).toHaveBeenCalledWith(null);
		});

		it('should handle multiple arguments', async () => {
			const mockFn = vi.fn(async (_a?: unknown, _b?: unknown, _c?: unknown) => {});
			const debounced = debounce(mockFn, { delay: 100 });

			debounced(42, 'test', true);
			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).toHaveBeenCalledOnce();
			expect(mockFn).toHaveBeenCalledWith(42, 'test', true);
		});

		it('should handle object arguments without mutation', async () => {
			const mockFn = vi.fn(async (_obj?: unknown) => {});
			const debounced = debounce(mockFn, { delay: 100 });

			const testObj = { value: 42 };
			debounced(testObj);

			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).toHaveBeenCalledWith(testObj);
			expect(testObj).toEqual({ value: 42 }); // Unchanged
		});

		it('should handle array arguments without mutation', async () => {
			const mockFn = vi.fn(async (_arr?: unknown) => {});
			const debounced = debounce(mockFn, { delay: 100 });

			const testArr = [1, 2, 3];
			debounced(testArr);

			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).toHaveBeenCalledWith(testArr);
			expect(testArr).toEqual([1, 2, 3]); // Unchanged
		});
	});

	describe('edge cases', () => {
		it('should handle zero delay', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 0 });

			debounced('test');
			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(0);

			expect(mockFn).toHaveBeenCalledOnce();
			expect(mockFn).toHaveBeenCalledWith('test');
		});

		it('should handle rapid successive calls with zero delay', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 0 });

			debounced('a');
			debounced('b');
			debounced('c');

			await vi.advanceTimersByTimeAsync(0);

			expect(mockFn).toHaveBeenCalledOnce();
			expect(mockFn).toHaveBeenCalledWith('c');
		});

		it('should handle very large delay values', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 1000000 });

			debounced('test');
			await vi.advanceTimersByTimeAsync(1000);

			expect(mockFn).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(999000);

			expect(mockFn).toHaveBeenCalledOnce();
		});

		it('should handle flush() resetting maxWait timer state', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 150, maxWait: 250 });

			// Start first maxWait window - trigger via maxWait
			debounced('first');
			await vi.advanceTimersByTimeAsync(100);
			debounced('second');
			await vi.advanceTimersByTimeAsync(100);
			debounced('third');
			await vi.advanceTimersByTimeAsync(100);

			// maxWait fires at 250ms with 'third'
			expect(mockFn).toHaveBeenCalledOnce();
			expect(mockFn).toHaveBeenCalledWith('third');

			// Start fresh after maxWait - should get full maxWait window again
			debounced('fourth');
			await vi.advanceTimersByTimeAsync(100);
			debounced('fifth');
			await vi.advanceTimersByTimeAsync(100);
			debounced('sixth');
			await vi.advanceTimersByTimeAsync(100);

			// Should fire again via maxWait after 250ms from 'fourth' call
			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenLastCalledWith('sixth');
		});

		it('should continue working after error in function', async () => {
			const error = new Error('original error');
			const onError = vi.fn();
			let shouldThrow = true;
			const mockFn = vi.fn(async (_arg: string) => {
				if (shouldThrow) throw error;
				return 'success';
			});
			const debounced = debounce(mockFn, { delay: 100, onError });

			// First call with error
			debounced('first');
			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).toHaveBeenCalledOnce();
			expect(onError).toHaveBeenCalledWith(error);

			// Second call should still work
			shouldThrow = false;
			debounced('second');
			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenLastCalledWith('second');
		});

		it('should handle multiple independent debounced instances', async () => {
			const mockFn1 = vi.fn(async (_arg: string) => {});
			const mockFn2 = vi.fn(async (_arg: string) => {});
			const debounced1 = debounce(mockFn1, { delay: 100 });
			const debounced2 = debounce(mockFn2, { delay: 200 });

			debounced1('a');
			debounced2('b');

			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn1).toHaveBeenCalledOnce();
			expect(mockFn1).toHaveBeenCalledWith('a');
			expect(mockFn2).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn2).toHaveBeenCalledOnce();
			expect(mockFn2).toHaveBeenCalledWith('b');
		});

		it('should handle rapid cancel/flush calls', () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100 });

			debounced('test');
			debounced.cancel();
			debounced.cancel();
			debounced.flush();
			debounced.flush();

			expect(mockFn).not.toHaveBeenCalled();
		});

		it('should handle calling debounced function after flush', async () => {
			const mockFn = vi.fn(async (_arg: string) => {});
			const debounced = debounce(mockFn, { delay: 100 });

			debounced('first');
			debounced('second');
			debounced.flush();

			expect(mockFn).toHaveBeenCalledOnce();
			expect(mockFn).toHaveBeenCalledWith('second');

			debounced('third');
			await vi.advanceTimersByTimeAsync(100);

			expect(mockFn).toHaveBeenCalledTimes(2);
			expect(mockFn).toHaveBeenLastCalledWith('third');
		});
	});
});
