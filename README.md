# debounce-ts

[![GitHub Repo](https://img.shields.io/badge/GitHub-debounce-blue?logo=github)](https://github.com/atif-c/debounce-ts)
[![npm Package](https://img.shields.io/npm/v/debounce-ts?logo=npm)](https://npmjs.com/package/debounce-ts)
[![Demo](https://img.shields.io/badge/Demo-blue)](https://atif-c.github.io/debounce-ts/demo)

A small TypeScript debounce utility for both sync and async functions. Supports leading-edge execution, maximum wait enforcement, and error handling.

## Features

- Debounces both sync and async functions
- Leading-edge (`immediate`) and trailing-edge execution
- Maximum wait enforcement to guarantee execution during continuous calls
- Error handling via `onError` callback
- `.cancel()` and `.flush()` methods on the returned function
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

By default, errors from the debounced function surface as unhandled rejections. Use `onError` to handle them explicitly:

```typescript
import { debounce } from 'debounce-ts';

const save = debounce(
	async data => {
		throw new Error('Network error');
	},
	{
		onError: error => {
			console.error('Save failed:', error);
		}
	}
);
```

Without `onError`, errors trigger Node's `unhandledRejection` event.

## API

### `debounce<T>(fn: T, options?: DebounceOptions): DebouncedFunction<T>`

Creates a debounced version of the provided function.

**Parameters:**

- `fn` — Function to debounce (sync or async)
- `options` — Configuration object (optional):

| Option      | Type                       | Default | Description                                                                  |
| ----------- | -------------------------- | ------- | ---------------------------------------------------------------------------- |
| `delay`     | `number`                   | `1000`  | Wait time in ms after last call                                              |
| `immediate` | `boolean`                  | `false` | Fire on leading edge. Also fires trailing if new args arrive during cooldown |
| `maxWait`   | `number`                   | —       | Max time in ms before forced execution                                       |
| `onError`   | `(error: unknown) => void` | —       | Error handler for async rejections                                           |

**Returns:** `DebouncedFunction` — Debounced wrapper (void return, fire-and-forget).

**Methods on returned function:**

- `.cancel()` — Cancel all pending invocations and clear timers
- `.flush()` — Immediately execute pending invocation (if any) and clear timers

**Throws:**

- `TypeError` if `delay` is not a non-negative number
- `TypeError` if `maxWait` is not a non-negative number
- `TypeError` if `maxWait` < `delay`

### TypeScript types

The `DebouncedFunction` interface is exported for use in your code:

```typescript
import { debounce, DebouncedFunction } from 'debounce-ts';

const save: DebouncedFunction<[string]> = debounce(
	async (text: string) => {
		await api.save(text);
	},
	{ delay: 500 }
);
```

## License

MIT
