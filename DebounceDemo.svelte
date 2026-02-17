<script lang="ts">
	import { debounce, type DebouncedFunction } from 'debounce-ts';

	// State
	let textInputValue = $state('');
	let delay = $state(250);
	let maxWait = $state(1000);
	let immediate = $state(false);

	let totalCalls = $state(0);
	let debouncedCalls = $state(0);
	/**
	 * @type {string | any[] | null | undefined}
	 */

	type LogEntry = {
		id: number;
		time: string;
		type: string;
		value: string;
	};
	let logEntries = $state<LogEntry[]>([]);

	let currentDebounced: DebouncedFunction<[string]> | null = null;

	// derived state
	let savedCalls = $derived(totalCalls - debouncedCalls);

	// Create debounced function whenever settings change
	$effect(() => {
		if (currentDebounced) {
			currentDebounced.cancel();
		}

		currentDebounced = createDebouncedFunction();

		// optional cleanup when effect re-runs or component unmounts
		return () => {
			if (currentDebounced) {
				currentDebounced.cancel();
			}
		};
	});

	// Create debounced function
	function createDebouncedFunction() {
		return debounce(
			(value: string) => {
				logCall(value, immediate && totalCalls === 1 ? 'leading' : 'normal');
			},
			{
				delay,
				maxWait: maxWait || undefined,
				immediate,
				onError: error => {
					console.error('Debounce error:', error);
				}
			}
		);
	}

	// Log function call
	function logCall(value: string, type = 'normal') {
		debouncedCalls++;

		const now = new Date();
		const timeString = now.toLocaleTimeString('en-US', {
			hour12: false,
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			fractionalSecondDigits: 3
		});

		const typeLabel =
			type === 'flush' ? '(FLUSHED)' : type === 'leading' ? '(LEADING)' : '(TRAILING)';

		logEntries = [
			{
				id: Date.now(),
				time: timeString,
				type: typeLabel,
				value: value || '<empty>'
			},
			...logEntries
		];
	}

	// Handle text input
	function handleTextInput(event: Event) {
		totalCalls++;
		textInputValue = (event.currentTarget as HTMLTextAreaElement).value;
		currentDebounced?.(textInputValue);
	}

	// Flush button handler
	function handleFlush() {
		if (currentDebounced) {
			currentDebounced.flush();
		}
	}

	// Cancel button handler
	function handleCancel() {
		if (currentDebounced) {
			currentDebounced.cancel();
		}
	}

	// Clear log handler
	function handleClearLog() {
		logEntries = [];
		debouncedCalls = 0;
		totalCalls = 0;
		textInputValue = '';
	}
</script>

<div class="container">
	<div class="header">
		<div>
			<h1>Debounce Function Demo</h1>
			<p class="subtitle">
				Type in the text area and watch the debounced function calls in real-time
			</p>
		</div>
		<div class="header-links">
			<a href="https://github.com/atif-c/debounce-ts" target="_blank" rel="noopener noreferrer">
				<img
					src="https://img.shields.io/badge/GitHub-atif--c%2Fdebounce-blue?logo=github"
					alt="View on GitHub"
				/>
			</a>
			<a href="https://www.npmjs.com/package/debounce-ts" target="_blank" rel="noopener noreferrer">
				<img
					src="https://img.shields.io/npm/v/atif-c-debounce?logo=npm&label=NPM"
					alt="View on NPM"
				/>
			</a>
		</div>
	</div>

	<div class="section">
		<h2 class="section-title">Configuration</h2>
		<div class="info-box">
			Change these settings in real-time to see how they affect the debounce behavior
		</div>
		<div class="controls">
			<div class="control-group">
				<label>Delay (ms)</label>
				<input type="text" inputmode="numeric" bind:value={delay} min="0" step="100" />
			</div>
			<div class="control-group">
				<label>Max Wait (ms)</label>
				<input
					type="text"
					inputmode="numeric"
					bind:value={maxWait}
					min="0"
					step="100"
					placeholder="None"
				/>
			</div>
			<div class="control-group">
				<label> Immediate (Leading Edge) </label>
				<input type="checkbox" bind:checked={immediate} />
			</div>
		</div>
	</div>

	<div class="section">
		<h2 class="section-title">Text Input</h2>
		<div class="input-group">
			<label>Type something here:</label>
			<textarea bind:value={textInputValue} oninput={handleTextInput} placeholder="Start typing..."
			></textarea>
		</div>
		<div class="button-group">
			<button class="btn btn-primary" onclick={handleFlush}>Flush (Execute Now)</button>
			<button class="btn btn-secondary" onclick={handleCancel}>Cancel Pending</button>
		</div>
	</div>

	<div class="section">
		<h2 class="section-title">Statistics</h2>
		<div class="stats">
			<div class="stat-card">
				<div class="stat-value">
					{totalCalls}
				</div>
				<div class="stat-label">Input Changes</div>
			</div>
			<div class="stat-card">
				<div class="stat-value">
					{debouncedCalls}
				</div>
				<div class="stat-label">Debounced Calls</div>
			</div>
			<div class="stat-card">
				<div class="stat-value">
					{savedCalls}
				</div>
				<div class="stat-label">Calls Prevented</div>
			</div>
		</div>
	</div>

	<div class="section">
		<h2 class="section-title">Function Call Log</h2>
		<div class="log-container">
			<div class="log-header">
				<span class="log-count">Calls: <span>{debouncedCalls}</span></span>
				<button class="clear-btn" onclick={handleClearLog}>Clear Log</button>
			</div>
			<div class="log-entries">
				{#if logEntries.length === 0}
					<div class="log-empty">No function calls yet. Start typing!</div>
				{:else}
					{#each logEntries as entry (entry.id)}
						<div class="log-entry">
							<div class="log-time">
								{entry.time}
								{entry.type}
							</div>
							<div class="log-value">{entry.value}</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	:root {
		/* Light theme */
		--clr-light: rgb(255, 255, 255);
		--clr-light-surface: rgb(220, 220, 220);
		--clr-light-alt-surface: rgb(210, 210, 210);

		/* Dark theme */
		--clr-dark: rgb(0, 0, 0);
		--clr-dark-surface: rgb(35, 35, 35);
		--clr-dark-alt-surface: rgb(45, 45, 45);

		/* Unified neumorphic shadows */
		--clr-shadow-light: rgba(255, 255, 255, 0.05);
		--clr-shadow-dark: rgba(0, 0, 0, 0.5);

		/* General UI */
		--clr-selected: rgb(150, 150, 255);
		--clr-positive: rgb(150, 255, 150);
		--clr-negative: rgb(255, 150, 150);
		--clr-border: rgb(100, 100, 100);
		--clr-muted: rgb(140, 140, 140);

		/* Shadows */
		--shadow-sm:
			-2px 0px 3px var(--clr-shadow-light), 0px -2px 3px var(--clr-shadow-light),
			-2px -2px 3px var(--clr-shadow-light), 2px 0px 3px var(--clr-shadow-dark),
			0px 2px 3px var(--clr-shadow-dark), 2px 2px 3px var(--clr-shadow-dark);

		--shadow-md:
			-4px 0px 6px var(--clr-shadow-light), 0px -4px 6px var(--clr-shadow-light),
			-4px -4px 6px var(--clr-shadow-light), 4px 0px 6px var(--clr-shadow-dark),
			0px 4px 6px var(--clr-shadow-dark), 4px 4px 6px var(--clr-shadow-dark);

		--shadow-lg:
			-8px 0px 12px var(--clr-shadow-light), 0px -8px 12px var(--clr-shadow-light),
			-8px -8px 12px var(--clr-shadow-light), 8px 0px 12px var(--clr-shadow-dark),
			0px 8px 12px var(--clr-shadow-dark), 8px 8px 12px var(--clr-shadow-dark);

		--shadow-xlg:
			-16px 0px 24px var(--clr-shadow-light), 0px -16px 24px var(--clr-shadow-light),
			-16px -16px 24px var(--clr-shadow-light), 16px 0px 24px var(--clr-shadow-dark),
			0px 16px 24px var(--clr-shadow-dark), 16px 16px 24px var(--clr-shadow-dark);

		--shadow-sm-inset:
			inset -2px 0px 3px var(--clr-shadow-light), inset 0px -2px 3px var(--clr-shadow-light),
			inset -2px -2px 3px var(--clr-shadow-light), inset 2px 0px 3px var(--clr-shadow-dark),
			inset 0px 2px 3px var(--clr-shadow-dark), inset 2px 2px 3px var(--clr-shadow-dark);

		--shadow-md-inset:
			inset -4px 0px 6px var(--clr-shadow-light), inset 0px -4px 6px var(--clr-shadow-light),
			inset -4px -4px 6px var(--clr-shadow-light), inset 4px 0px 6px var(--clr-shadow-dark),
			inset 0px 4px 6px var(--clr-shadow-dark), inset 4px 4px 6px var(--clr-shadow-dark);

		--shadow-lg-inset:
			inset -8px 0px 12px var(--clr-shadow-light), inset 0px -8px 12px var(--clr-shadow-light),
			inset -8px -8px 12px var(--clr-shadow-light), inset 8px 0px 12px var(--clr-shadow-dark),
			inset 0px 8px 12px var(--clr-shadow-dark), inset 8px 8px 12px var(--clr-shadow-dark);
	}

	*,
	*::before,
	*::after {
		box-sizing: border-box;
		margin: 0;
		padding: 0;
		color: var(--clr-light);
	}

	.container {
		width: 100%;
		background-color: transparent;
		box-shadow: var(--shadow-xlg);
		border-radius: 1rem;
		padding: 2rem;

		.header {
			h1 {
				margin-bottom: 1rem;
			}

			.subtitle {
				margin-bottom: 1rem;
			}

			.header-links {
				margin-bottom: 1rem;
			}
		}

		.section {
			margin-top: 2rem;
			box-shadow: var(--shadow-lg);
			border-radius: 0.75rem;
			padding: 2rem;

			.section-title {
				display: flex;
				align-items: center;

				&::before {
					width: 0.25rem;
					height: 1rem;
					margin-right: 0.75rem;
					border-radius: 1rem;
					background: var(--clr-selected);
					content: '';
				}
			}

			.info-box {
				margin-top: 0.5rem;
			}

			.controls {
				display: flex;
				justify-content: space-between;
				align-items: center;
				gap: 1rem;

				margin-top: 1rem;

				.control-group {
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: space-evenly;

					input {
						margin-top: 0.5rem;
						&[type='text'] {
							margin-top: 0.5rem;
							box-shadow: var(--shadow-md-inset);
							border-radius: 0.5rem;
							border: transparent;
							padding: 0.5rem 1rem;
							background-color: transparent;
							color: var(--color-text-white);
							text-align: center;

							&:focus {
								outline: 0.1rem solid var(--clr-selected);
							}
						}

						&[type='checkbox'] {
							cursor: pointer;
							width: 1rem;
							height: 1rem;
							accent-color: var(--color-primary);
						}
					}
				}
			}

			.input-group {
				margin-top: 1rem;

				label {
					display: block;
				}

				textarea {
					width: 100%;
					margin-top: 0.5rem;
					box-shadow: var(--shadow-md-inset);
					border-radius: 0.5rem;
					border: transparent;
					padding: 1rem;
					font-family: inherit;
					background: var(--color-bg-input);
					color: var(--color-text-white);

					&:focus {
						outline: 0.1rem solid var(--clr-selected);
					}

					&::placeholder {
						color: var(--color-text-muted);
					}
				}
			}

			.button-group {
				display: flex;
				gap: 1rem;
				margin-top: 1rem;
				button {
					cursor: pointer;
					height: fit-content;
					width: fit-content;
					box-shadow: var(--shadow-md);
					border: none;
					border-radius: 0.25rem;
					background-color: transparent;
					padding: 0.5rem 1rem;

					&.btn-primary {
						color: var(--clr-selected);
					}

					&.btn-secondary {
						color: var(--clr-negative);
					}
				}
			}

			.stats {
				display: flex;
				justify-content: space-around;
				margin-top: 1rem;

				.stat-card {
					display: flex;
					gap: 0.25rem;
					flex-direction: column;
					align-items: center;

					box-shadow: var(--shadow-md);
					border: none;
					border-radius: 0.25rem;
					background-color: transparent;
					padding: 0.5rem 1rem;
					transition: all 0.5s ease;

					&:hover {
						transform: translateY(-0.25rem);
					}

					.stat-value {
						font-size: 1.5rem;
					}

					.stat-label {
						opacity: 50%;
					}
				}
			}
		}
	}

	.log-container {
		.log-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-top: 1rem;
			button {
				cursor: pointer;
				height: fit-content;
				width: fit-content;
				box-shadow: var(--shadow-md);
				border: none;
				border-radius: 0.25rem;
				background-color: transparent;
				padding: 0.5rem 1rem;
				color: var(--clr-negative);
			}
		}

		.log-empty {
			padding: 2rem;
			text-align: center;
			color: var(--clr-muted);
			font-style: italic;
		}

		.log-entries {
			display: flex;
			flex-direction: column;
			gap: 1rem;

			.log-entry {
				&:first-child {
					margin-top: 1rem;
				}
				background: transparent;
				padding: 1rem;
				border-radius: 0.25rem;
				animation: slideIn 0.3s ease-out;
				box-shadow: var(--shadow-lg);
			}

			.log-time {
				color: var(--clr-muted);
			}

			.log-value {
				color: var(--clr-light);
				margin-top: 0.5rem;
				word-break: break-word;
			}
		}
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateX(-20px);
		}

		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
</style>
