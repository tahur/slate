// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			message: string;
			code?: string;
			traceId?: string;
		}
		interface Locals {
			user: {
				id: string;
				email: string;
				name: string;
				role: string;
				orgId: string;
			} | null;
			session: { id: string; token: string; expiresAt: Date | number } | null;
			flash: import('$lib/server/flash').FlashMessage | null;
			requestId: string;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export { };
