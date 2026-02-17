# debounce-ts

A lightweight, type-safe debounce utility for both sync and async functions with support for leading-edge execution, maximum wait enforcement, and error handling.

## Installation

```bash
npm install debounce-ts
```

## Basic Usage

```typescript
import { debounce } from 'debounce-ts';

// Async function example
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

// Sync function example
const updateCounter = debounce(
	(count: number) => {
		document.getElementById('counter').textContent = count.toString();
	},
	{ delay: 300 }
);

button.addEventListener('click', () => updateCounter(++clicks));
```

## API

### debounce(fn, options?)

**Parameters:**

- `fn` (Function): Function to debounce (can be sync or async)
- `options` (object, optional):
  - `immediate` (boolean, default: `false`) — Fire on leading edge. Also fires trailing if new args arrive during cooldown.
  - `delay` (number, default: `1000`) — Wait time in ms after last call
  - `maxWait` (number, optional) — Max time before forced execution
  - `onError` ((error: unknown) => void, optional) — Error handler for async rejections. Without this, errors surface as unhandled rejections.

**Returns:** `DebouncedFunction` — Debounced function (void return, fire-and-forget)

**Methods on returned function:**

- `.cancel()` — Cancel all pending invocations and clear timers
- `.flush()` — Immediately execute pending invocation (if any) and clear timers

**Throws:**

- `TypeError` if delay is not a non-negative number
- `TypeError` if maxWait is not a non-negative number
- `TypeError` if maxWait < delay

## [Debounce Example](https://atif-c.github.io/debounce-ts/demo)

## Comprehensive Example

```typescript
import { debounce } from 'debounce-ts';

// Real-world: Auto-save user input
// - Immediate feedback (save on first keystroke)
// - Debounced API calls (wait 500ms after typing stops)
// - Maximum 5-second delay (force-save during continuous typing)
// - Error handling via onError callback

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
			showNotification('Failed to save. Will retry...');
		}
	}
);

// Fire-and-forget — errors route to onError callback
const textInput = document.querySelector('textarea');
textInput.addEventListener('input', e => {
	autoSave(e.target.value);
});

// Force-save any pending data before page unload
window.addEventListener('beforeunload', () => {
	autoSave.flush();
});

// Cancel pending save (e.g., user discards changes)
function handleDiscard() {
	autoSave.cancel();
}
```

## Error Handling

By default, errors from the debounced function (both sync and async) surface as **unhandled rejections** (Node's standard behavior). To handle errors explicitly:

```typescript
const save = debounce(
	async data => {
		throw new Error('Network error');
	},
	{
		onError: error => {
			// Handle error here
			console.error('Save failed:', error);
		}
	}
);
```

Without `onError`, the error will trigger Node's `unhandledRejection` event, making it visible in logs and crash reporters.

## TypeScript Support

This package is written in TypeScript and exports full type definitions. The `DebouncedFunction` interface is exported for use in your code:

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
