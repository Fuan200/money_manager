import type { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { apiBaseUrl, readAuthSession, saveAuthSession } from '../lib/auth';

interface LoginState {
	email: string;
	password: string;
}

type AuthMode = 'signIn' | 'createAccount';

interface LoginApiSuccess {
	success: true;
	data: {
		email: string;
		token: string;
	};
}

interface LoginApiError {
	detail?: string;
	error?: string;
}

const initialState: LoginState = {
	email: '',
	password: '',
};

export function LoginForm() {
	const [authMode, setAuthMode] = useState<AuthMode>('signIn');
	const [formState, setFormState] = useState<LoginState>(initialState);
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

	useEffect(() => {
		if (readAuthSession()) {
			window.location.replace('/home');
		}
	}, []);

	const signInLabel = isSubmitting
		? authMode === 'signIn'
			? 'Signing in...'
			: 'Creating account...'
		: authMode === 'signIn'
			? 'Sign in'
			: 'Create account';

	const updateField = (field: keyof LoginState, value: string) => {
		setFormState((currentState) => ({
			...currentState,
			[field]: value,
		}));
	};

	const loginUser = async (credentials: LoginState) => {
		const response = await fetch(`${apiBaseUrl}/users/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(credentials),
		});

		if (!response.ok) {
			const errorPayload = (await response.json().catch(() => null)) as LoginApiError | null;
			const backendError = errorPayload?.error ?? errorPayload?.detail;
			throw new Error(
				backendError === 'INVALID_CREDENTIALS'
					? 'Invalid email or password.'
					: 'Unable to sign in right now.',
			);
		}

		const payload = (await response.json()) as LoginApiSuccess;
		saveAuthSession(payload.data);
		window.location.replace('/home');
	};

	const handleSubmit = async (event: JSX.TargetedEvent<HTMLFormElement, SubmitEvent>) => {
		event.preventDefault();
		setErrorMessage('');
		setIsSubmitting(true);

		try {
			if (authMode === 'signIn') {
				await loginUser(formState);
				return;
			}

			const response = await fetch(`${apiBaseUrl}/users/create-user-with-demo-data`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formState),
			});

			if (!response.ok) {
				const errorPayload = (await response.json().catch(() => null)) as LoginApiError | null;
				const backendError = errorPayload?.error ?? errorPayload?.detail;

				if (backendError === 'Email already registered') {
					throw new Error('That email is already registered.');
				}

				throw new Error('Unable to create the account right now.');
			}

			await loginUser(formState);
		} catch (error) {
			setErrorMessage(
				error instanceof Error ? error.message : 'Unable to sign in right now.',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<section class="login-card" aria-labelledby="login-title">
			<div class="card-header">
				<h1 id="login-title">Money Manager</h1>
			</div>

			<div class="auth-toggle" role="tablist" aria-label="Authentication mode">
				<button
					type="button"
					class={`auth-toggle-button ${authMode === 'signIn' ? 'is-active' : ''}`}
					aria-pressed={authMode === 'signIn'}
					onClick={() => {
						setAuthMode('signIn');
						setErrorMessage('');
					}}
				>
					Sign in
				</button>
				<button
					type="button"
					class={`auth-toggle-button ${authMode === 'createAccount' ? 'is-active' : ''}`}
					aria-pressed={authMode === 'createAccount'}
					onClick={() => {
						setAuthMode('createAccount');
						setErrorMessage('');
					}}
				>
					Create user
				</button>
			</div>

			<form class="login-form" onSubmit={handleSubmit}>
				<label class="field">
					<span>Email</span>
					<input
						type="email"
						name="email"
						autocomplete="email"
						placeholder="name@company.com"
						value={formState.email}
						onInput={(event) => updateField('email', event.currentTarget.value)}
						required
					/>
				</label>

				<label class="field">
					<div class="field-label-row">
						<span>Password</span>
						{/* <a href="/" class="secondary-link">
							Forgot password?
						</a> */}
					</div>
					<input
						type="password"
						name="password"
						autocomplete="current-password"
						placeholder="Enter your password"
						value={formState.password}
						onInput={(event) => updateField('password', event.currentTarget.value)}
						required
					/>
				</label>

				{errorMessage ? (
					<p class="error-banner" role="alert">
						{errorMessage}
					</p>
				) : null}

				<button type="submit" class="submit-button" disabled={isSubmitting}>
					{signInLabel}
				</button>
			</form>
		</section>
	);
}
