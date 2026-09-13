# debounce-ts

[![GitHub Repo](https://img.shields.io/badge/GitHub-debounce-blue?logo=github)](https://github.com/atif-c/debounce-ts)
[![npm Package](https://img.shields.io/npm/v/debounce-ts?logo=npm)](https://npmjs.com/package/debounce-ts)
[![Demo](https://img.shields.io/badge/Demo-blue)](https://atif-c.github.io/debounce-ts/demo)

A small TypeScript debounce utility for both sync and async functions. Supports leading-edge execution, maximum wait enforcement, and error handling.

## Features

- Debounces both sync and async functions
- Leading-edge (`immediate`) and trailing-edge execution (`immediate: true` means leading + trailing when re-triggered; there is no leading-only mode)
- Maximum wait enforcement to guarantee execution during continuous calls
- Error handling via `onError` callback (recommended, since the wrapper returns `void` and cannot throw to the caller)
- `.cancel()` and `.flush()` methods on the returned function (both safe to call when nothing is pending)
- Zero dependencies, fully typed

## Installation

```bash
npm install debounce-ts
```

## Usage

### Async function

```typescript
import { debounce } from 'debounce-ts';

const saveData = debounce(
	async (text: string) => {
		await fetch('/api/save', {
			method: 'POST',
			body: JSON.stringify({ text })
		});
	},
	{ delay: 500 }
);

// Fire-and-forget — function is invoked 500ms after last call
input.addEventListener('input', e => saveData(e.target.value));
```

### Sync function

```typescript
import { debounce } from 'debounce-ts';

const updateCounter = debounce(
	(count: number) => {
		document.getElementById('counter').textContent = count.toString();
	},
	{ delay: 300 }
);

button.addEventListener('click', () => updateCounter(++clicks));
```

### All options

```typescript
import { debounce } from 'debounce-ts';

const autoSave = debounce(
	async (text: string) => {
		const response = await fetch('/api/save', {
			method: 'POST',
			body: JSON.stringify({ text })
		});
		if (!response.ok) throw new Error('Save failed');
	},
	{
		immediate: true,
		delay: 500,
		maxWait: 5000,
		onError: error => {
			console.error('Auto-save failed:', error);
		}
	}
);

// Fire-and-forget — errors route to onError callback
textInput.addEventListener('input', e => autoSave(e.target.value));

// Force-save any pending data before page unload
window.addEventListener('beforeunload', () => autoSave.flush());

// Cancel pending save (e.g., user discards changes)
discardButton.addEventListener('click', () => autoSave.cancel());
```

### Error handling

The debounced wrapper returns `void` (fire-and-forget), so return values are discarded and failures cannot be `await`ed or caught by the caller. Use `onError` to handle them explicitly:

```typescript
import { debounce } from 'debounce-ts';

const save = debounce(
	async (data: string) => {
		throw new Error('Network error');
	},
	{
		delay: 500,
		onError: error => {
			console.error('Save failed:', error);
		}
	}
);
```

Without `onError`, sync errors throw from the timer callback (uncaught) and async rejections are left unhandled (Node's `unhandledRejection` event). Leading-edge (`immediate: true`) calls throw synchronously to the caller instead.

## API

### `debounce<TArgs extends readonly unknown[]>(fn: (...args: TArgs) => unknown, options?: DebounceOptions): DebouncedFunction<TArgs>`

Creates a debounced version of the provided function. Only the latest arguments are used when `fn` eventually runs.

**Parameters:**

- `fn` — Function to debounce (sync or async). Called with the latest caller `this` (e.g. `debounced.call(ctx, ...)`).
- `options` — Configuration object (optional):

| Option      | Type                       | Default | Description                                                                                                  |
| ----------- | -------------------------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| `delay`     | `number`                   | `1000`  | Wait time in ms after last call. Must be a non-negative integer                                              |
| `immediate` | `boolean`                  | `false` | Fire on leading edge. Also fires on trailing edge if called again during cooldown. No leading-only mode      |
| `maxWait`   | `number`                   | —       | Max time in ms from first call in a burst before forced execution. Must be a non-negative integer `>= delay` |
| `onError`   | `(error: unknown) => void` | —       | Error handler for sync errors and async rejections (recommended, since the wrapper returns `void`)           |

**Returns:** `DebouncedFunction` — Debounced wrapper. Always returns `void`; `fn`'s return value is discarded.

**Methods on returned function:**

- `.cancel()` — Cancel any pending invocation and clear timers. Safe to call when nothing is pending
- `.flush()` — Immediately execute the pending invocation (if any) with the latest arguments and clear timers. No-op when nothing is pending. Returns `void`, not `fn`'s result

**Throws:**

- `TypeError` if `delay` is not a non-negative integer (`NaN`/`Infinity`/floats rejected)
- `TypeError` if `maxWait` is not a non-negative integer
- `TypeError` if `maxWait` < `delay`

### TypeScript types

Type arguments are inferred — you rarely need to annotate:

```typescript
import { debounce } from 'debounce-ts';

const save = debounce(
	async (text: string) => {
		await api.save(text);
	},
	{ delay: 500 }
);
// `save` is `(text: string) => void` with `.cancel()` / `.flush()`
```

The `DebouncedFunction` interface is exported for explicit annotations. Its type parameter is the arguments tuple:

```typescript
import { debounce, DebouncedFunction } from 'debounce-ts';

const save: DebouncedFunction<[text: string]> = debounce(
	async (text: string) => {
		await api.save(text);
	},
	{ delay: 500 }
);
```

## Behavior notes

- Trailing-edge only by default (`immediate: false`). `immediate: true` means leading + trailing (when re-triggered); unlike `lodash.debounce`, there is no leading-only (`trailing: false`) mode.
- Only the latest arguments are used when `fn` eventually runs; intermediate calls are dropped.
- The wrapper and `flush()` always return `void` — `fn`'s return value is discarded and cannot be awaited.
- Pending timers keep the Node.js event loop alive until they fire, `cancel()`, or `flush()` is called. Call `cancel()` for cleanup on unmount.

## License

MIT
