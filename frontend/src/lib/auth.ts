export const apiBaseUrl =
	import.meta.env.PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:8000';

export const authStorageKey = 'money-manager-auth';

export interface AuthSession {
	email: string;
	token: string;
}

export function readAuthSession(): AuthSession | null {
	if (typeof window === 'undefined') {
		return null;
	}

	const rawSession = window.localStorage.getItem(authStorageKey);
	if (!rawSession) {
		return null;
	}

	try {
		return JSON.parse(rawSession) as AuthSession;
	} catch {
		window.localStorage.removeItem(authStorageKey);
		return null;
	}
}

export function saveAuthSession(session: AuthSession): void {
	window.localStorage.setItem(authStorageKey, JSON.stringify(session));
}

export function clearAuthSession(): void {
	window.localStorage.removeItem(authStorageKey);
}
