import type { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { apiBaseUrl, clearAuthSession, readAuthSession } from '../lib/auth';
import { AccountFormModal, type AccountFormState } from './AccountFormModal';
import { AppHeader } from './AppHeader';

interface SessionState {
	email: string;
	token: string;
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
	const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
	const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [submitError, setSubmitError] = useState<string>('');
	const [submitSuccess, setSubmitSuccess] = useState<string>('');
	const [formState, setFormState] = useState<AccountFormState>({
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

	const updateField = <K extends keyof AccountFormState>(
		field: K,
		value: AccountFormState[K],
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

	const closeModal = () => {
		setModalMode(null);
		setSelectedAccountId(null);
		setSubmitError('');
	};

	const openCreateModal = () => {
		resetForm();
		setSelectedAccountId(null);
		setSubmitError('');
		setSubmitSuccess('');
		setModalMode('create');
	};

	const openEditModal = (account: UserAccount) => {
		setFormState({
			name: account.name,
			balance: account.balance,
			balanceInclude: account.balance_include,
			saving: account.saving,
			iconId: account.icon?.id ?? '',
		});
		setSelectedAccountId(account.id);
		setSubmitError('');
		setSubmitSuccess('');
		setModalMode('edit');
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

	const handleAccountSubmit = async (
		event: JSX.TargetedEvent<HTMLFormElement, SubmitEvent>,
	) => {
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
			const isEditMode = modalMode === 'edit' && selectedAccountId;
			const response = await fetch(
				isEditMode
					? `${apiBaseUrl}/accounts/update-account/${selectedAccountId}`
					: `${apiBaseUrl}/accounts/create-account`,
				{
				method: isEditMode ? 'PATCH' : 'POST',
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
				},
			);

			if (!response.ok) {
				const errorPayload = (await response.json().catch(() => null)) as
					| { error?: string; detail?: string }
					| null;
				const backendError = errorPayload?.error ?? errorPayload?.detail ?? 'Unable to create account.';
				throw new Error(backendError);
			}

			const payload = (await response.json()) as AccountApiResponse;
			setSubmitSuccess(
				modalMode === 'edit'
					? `Account "${payload.data.name}" updated successfully.`
					: `Account "${payload.data.name}" created successfully.`,
			);
			resetForm();
			closeModal();
			await loadAccounts(sessionState.token);
		} catch (error) {
			setSubmitError(
				error instanceof Error
					? error.message
					: modalMode === 'edit'
						? 'Unable to update account.'
						: 'Unable to create account.',
			);
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
					onClick={openCreateModal}
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
								<button
									type="button"
									class="account-row-card"
									key={account.id}
									onClick={() => openEditModal(account)}
								>
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
								</button>
							))}
						</div>
					) : null}
				</section>
			</div>

			{modalMode ? (
				<AccountFormModal
					mode={modalMode}
					formState={formState}
					isSubmitting={isSubmitting}
					submitError={submitError}
					onClose={closeModal}
					onSubmit={handleAccountSubmit}
					onFieldChange={updateField}
				/>
			) : null}
		</section>
	);
}
