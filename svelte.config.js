import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		warningFilter: (warning) => {
			// Suppress state_referenced_locally — we intentionally capture initial
			// $props() values for superForm() calls and $state() initializers.
			if (warning.code === 'state_referenced_locally') return false;
			// Suppress a11y_invalid_attribute for placeholder href="#" links
			if (warning.code === 'a11y_invalid_attribute') return false;
			return true;
		}
	},
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter()
	}
};

export default config;
