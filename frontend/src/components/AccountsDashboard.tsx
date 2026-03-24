import { useEffect, useState } from 'preact/hooks';
import { apiBaseUrl, clearAuthSession, readAuthSession } from '../lib/auth';
import { AppHeader } from './AppHeader';

interface SessionState {
	email: string;
	token: string;
}

interface CreateAccountState {
	name: string;
	balance: string;
	balanceInclude: boolean;
	saving: boolean;
	iconId: string;
}

interface AccountApiResponse {
	success: true;
	data: {
		id: string;
		name: string;
		balance: string;
		balance_include: boolean;
		saving: boolean;
	};
}

interface UserAccount {
	id: string;
	name: string;
	balance: string;
	balance_include: boolean;
	saving: boolean;
	icon: {
		id: string;
		label: string;
		url: string;
	} | null;
}

interface AccountsListResponse {
	success: true;
	data: UserAccount[];
}

export function AccountsDashboard() {
	const [sessionState, setSessionState] = useState<SessionState | null>(null);
	const [accounts, setAccounts] = useState<UserAccount[]>([]);
	const [isLoadingAccounts, setIsLoadingAccounts] = useState<boolean>(true);
	const [accountsError, setAccountsError] = useState<string>('');
	const [isCreateFormOpen, setIsCreateFormOpen] = useState<boolean>(false);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [submitError, setSubmitError] = useState<string>('');
	const [submitSuccess, setSubmitSuccess] = useState<string>('');
	const [formState, setFormState] = useState<CreateAccountState>({
		name: '',
		balance: '',
		balanceInclude: true,
		saving: false,
		iconId: '',
	});

	useEffect(() => {
		const session = readAuthSession();
		if (!session) {
			window.location.replace('/');
			return;
		}

		setSessionState({ email: session.email, token: session.token });
	}, []);

	useEffect(() => {
		if (!sessionState) {
			return;
		}

		void loadAccounts(sessionState.token);
	}, [sessionState]);

	const handleSignOut = () => {
		clearAuthSession();
		window.location.replace('/');
	};

	const updateField = <K extends keyof CreateAccountState>(
		field: K,
		value: CreateAccountState[K],
	) => {
		setFormState((currentState) => ({
			...currentState,
			[field]: value,
		}));
	};

	const resetForm = () => {
		setFormState({
			name: '',
			balance: '',
			balanceInclude: true,
			saving: false,
			iconId: '',
		});
	};

	const loadAccounts = async (token: string) => {
		setIsLoadingAccounts(true);
		setAccountsError('');

		try {
			const response = await fetch(`${apiBaseUrl}/accounts/get-all-accounts-by-user`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				const errorPayload = (await response.json().catch(() => null)) as
					| { error?: string; detail?: string }
					| null;
				const backendError = errorPayload?.error ?? errorPayload?.detail ?? 'Unable to load accounts.';
				throw new Error(backendError);
			}

			const payload = (await response.json()) as AccountsListResponse;
			setAccounts(payload.data);
		} catch (error) {
			setAccountsError(error instanceof Error ? error.message : 'Unable to load accounts.');
		} finally {
			setIsLoadingAccounts(false);
		}
	};

	const handleCreateAccount = async (event: Event) => {
		event.preventDefault();

		if (!sessionState) {
			return;
		}

		setSubmitError('');
		setSubmitSuccess('');

		if (!formState.name.trim()) {
			setSubmitError('Account name is required.');
			return;
		}

		if (!formState.balance.trim()) {
			setSubmitError('Initial balance is required.');
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await fetch(`${apiBaseUrl}/accounts/create-account`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${sessionState.token}`,
				},
				body: JSON.stringify({
					name: formState.name.trim(),
					balance: formState.balance.trim(),
					balance_include: formState.balanceInclude,
					saving: formState.saving,
					icon_id: formState.iconId.trim() || null,
				}),
			});

			if (!response.ok) {
				const errorPayload = (await response.json().catch(() => null)) as
					| { error?: string; detail?: string }
					| null;
				const backendError = errorPayload?.error ?? errorPayload?.detail ?? 'Unable to create account.';
				throw new Error(backendError);
			}

			const payload = (await response.json()) as AccountApiResponse;
			setSubmitSuccess(`Account "${payload.data.name}" created successfully.`);
			resetForm();
			setIsCreateFormOpen(false);
			await loadAccounts(sessionState.token);
		} catch (error) {
			setSubmitError(error instanceof Error ? error.message : 'Unable to create account.');
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!sessionState) {
		return (
			<section class="app-shell">
				<div class="app-content">
					<div class="summary-card">
						<p class="panel-label">Loading session</p>
						<h1>Preparing your accounts view...</h1>
					</div>
				</div>
			</section>
		);
	}

	return (
		<section class="app-shell">
			<AppHeader activeTab="accounts" onSignOut={handleSignOut} />

			<div class="app-content">
				<button
					type="button"
					class="primary-button"
					onClick={() => {
						setIsCreateFormOpen(true);
						setSubmitError('');
						setSubmitSuccess('');
					}}
				>
					New account
				</button>

				{submitSuccess ? (
					<p class="success-banner" role="status">
						{submitSuccess}
					</p>
				) : null}

				<section class="accounts-list-section">
					<div class="section-heading">
						<div>
							<p class="panel-label">Your accounts</p>
						</div>
					</div>

					{accountsError ? (
						<p class="error-banner" role="alert">
							{accountsError}
						</p>
					) : null}

					{isLoadingAccounts ? (
						<div class="accounts-stack">
							<div class="account-row-card">
								<p class="panel-copy">Loading accounts...</p>
							</div>
						</div>
					) : null}

					{!isLoadingAccounts && !accountsError && accounts.length === 0 ? (
						<div class="accounts-stack">
							<div class="account-row-card">
								<p class="panel-copy">No accounts found for this user yet.</p>
							</div>
						</div>
					) : null}

					{!isLoadingAccounts && accounts.length > 0 ? (
						<div class="accounts-stack">
							{accounts.map((account) => (
								<article class="account-row-card" key={account.id}>
									<div class="account-leading">
										<div class="account-icon-wrap" aria-hidden="true">
											{account.icon?.url ? (
												<img
													src={account.icon.url}
													alt=""
													class="account-icon"
													loading="lazy"
												/>
											) : (
												<span class="account-icon-fallback">
													{account.name.slice(0, 1).toUpperCase()}
												</span>
											)}
										</div>

										<div class="account-copy">
											<h3>{account.name}</h3>
											<p class="account-meta">
												{account.saving ? 'Savings' : 'Standard'}
												{account.balance_include ? ' | Included in totals' : ' | Excluded from totals'}
											</p>
										</div>
									</div>

									<p class="account-balance">${account.balance}</p>
								</article>
							))}
						</div>
					) : null}
				</section>
			</div>

			{isCreateFormOpen ? (
				<div class="modal-backdrop" onClick={() => setIsCreateFormOpen(false)}>
					<section
						class="modal-card account-form-card"
						role="dialog"
						aria-modal="true"
						aria-labelledby="create-account-title"
						onClick={(event) => event.stopPropagation()}
					>
						<div class="modal-header">
							<div class="form-card-header">
								<p class="panel-label">Create account</p>
								<h2 id="create-account-title">Enter the backend account fields</h2>
							</div>

							<button
								type="button"
								class="ghost-button"
								onClick={() => setIsCreateFormOpen(false)}
							>
								Close
							</button>
						</div>

						<form class="account-form" onSubmit={handleCreateAccount}>
							<label class="field">
								<span>Name</span>
								<input
									type="text"
									name="name"
									value={formState.name}
									onInput={(event) => updateField('name', event.currentTarget.value)}
									placeholder="Main checking"
									required
								/>
							</label>

							<label class="field">
								<span>Balance</span>
								<input
									type="number"
									name="balance"
									value={formState.balance}
									onInput={(event) => updateField('balance', event.currentTarget.value)}
									placeholder="0.00"
									step="0.01"
									required
								/>
							</label>

							{/* <label class="field">
								<span>Icon ID</span>
								<input
									type="text"
									name="iconId"
									value={formState.iconId}
									onInput={(event) => updateField('iconId', event.currentTarget.value)}
									placeholder="Optional UUID"
								/>
							</label> */}

							<label class="checkbox-field">
								<input
									type="checkbox"
									name="balanceInclude"
									checked={formState.balanceInclude}
									onInput={(event) =>
										updateField('balanceInclude', event.currentTarget.checked)}
								/>
								<div>
									<span>Include balance in totals</span>
									<p class="field-help">Maps to `balance_include` in the backend schema.</p>
								</div>
							</label>

							{/* <label class="checkbox-field">
								<input
									type="checkbox"
									name="saving"
									checked={formState.saving}
									onInput={(event) => updateField('saving', event.currentTarget.checked)}
								/>
								<div>
									<span>Savings account</span>
									<p class="field-help">Maps to `saving` in the backend schema.</p>
								</div>
							</label> */}

							{submitError ? (
								<p class="error-banner" role="alert">
									{submitError}
								</p>
							) : null}

							<div class="form-actions">
								<button type="submit" class="primary-button" disabled={isSubmitting}>
									{isSubmitting ? 'Creating...' : 'Create account'}
								</button>
							</div>
						</form>
					</section>
				</div>
			) : null}
		</section>
	);
}
