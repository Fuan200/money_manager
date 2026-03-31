import type { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { apiBaseUrl, clearAuthSession, readAuthSession } from '../lib/auth';
import { formatCurrencyValue } from '../lib/currency';
import { AccountFormModal, type AccountFormState } from './AccountFormModal';
import { AppHeader } from './AppHeader';
import { LoadingOverlay } from './LoadingOverlay';
import { SectionActionButton } from './SectionActionButton';

interface SessionState {
	email: string;
	token: string;
}

interface UserAccount {
	id: string;
	name: string;
	balance: string;
	balance_include: boolean;
	saving: boolean;
	is_debit: boolean;
}

interface AccountApiResponse {
	success: true;
	data: UserAccount;
}

interface AccountsListResponse {
	success: true;
	data: UserAccount[];
}

const defaultFormState: AccountFormState = {
	name: '',
	balance: '',
	isDebit: true,
	balanceInclude: true,
	saving: false,
};

export function AccountsDashboard() {
	const [sessionState, setSessionState] = useState<SessionState | null>(null);
	const [hasCheckedSession, setHasCheckedSession] = useState<boolean>(false);
	const [accounts, setAccounts] = useState<UserAccount[]>([]);
	const [isLoadingAccounts, setIsLoadingAccounts] = useState<boolean>(true);
	const [accountsError, setAccountsError] = useState<string>('');
	const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
	const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [submitError, setSubmitError] = useState<string>('');
	const [submitSuccess, setSubmitSuccess] = useState<string>('');
	const [formState, setFormState] = useState<AccountFormState>(defaultFormState);

	useEffect(() => {
		const session = readAuthSession();
		setSessionState(session ? { email: session.email, token: session.token } : null);
		setHasCheckedSession(true);
	}, []);

	useEffect(() => {
		if (!hasCheckedSession || sessionState) {
			return;
		}

		if (!sessionState) {
			window.location.replace('/');
		}
	}, [hasCheckedSession, sessionState]);

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

	const updateField = <K extends keyof AccountFormState>(field: K, value: AccountFormState[K]) => {
		setFormState((currentState) => ({
			...currentState,
			[field]: value,
		}));
	};

	const resetForm = () => {
		setFormState(defaultFormState);
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
			isDebit: account.is_debit,
			balanceInclude: account.balance_include,
			saving: account.saving,
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

	const handleAccountSubmit = async (event: JSX.TargetedEvent<HTMLFormElement, SubmitEvent>) => {
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
			setSubmitError('Current balance is required.');
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
						is_debit: formState.isDebit,
					}),
				},
			);

			if (!response.ok) {
				const errorPayload = (await response.json().catch(() => null)) as
					| { error?: string; detail?: string }
					| null;
				const backendError = errorPayload?.error ?? errorPayload?.detail ?? 'Unable to save account.';
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

	const handleAccountDelete = async () => {
		if (!sessionState || !selectedAccountId) {
			return;
		}

		const selectedAccount = accounts.find((account) => account.id === selectedAccountId);
		const accountName = selectedAccount?.name ?? 'this account';
		const shouldDelete = window.confirm(`Delete "${accountName}"? This action cannot be undone.`);

		if (!shouldDelete) {
			return;
		}

		setIsSubmitting(true);
		setSubmitError('');
		setSubmitSuccess('');

		try {
			const response = await fetch(`${apiBaseUrl}/accounts/delete-account/${selectedAccountId}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${sessionState.token}`,
				},
			});

			if (!response.ok) {
				const errorPayload = (await response.json().catch(() => null)) as
					| { error?: string; detail?: string }
					| null;
				const backendError = errorPayload?.error ?? errorPayload?.detail ?? 'Unable to delete account.';
				throw new Error(backendError);
			}

			const payload = (await response.json()) as AccountApiResponse;
			setSubmitSuccess(`Account "${payload.data.name}" deleted successfully.`);
			closeModal();
			await loadAccounts(sessionState.token);
		} catch (error) {
			setSubmitError(error instanceof Error ? error.message : 'Unable to delete account.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<section>
			{sessionState ? (
				<AppHeader activeTab="accounts" onSignOut={handleSignOut}>
					<div class="dashboard-section-stack">
						<SectionActionButton label="Create account" onClick={openCreateModal} />

						{submitSuccess ? (
							<p class="success-banner" role="status">
								{submitSuccess}
							</p>
						) : null}

						<section class="item-list-section">
							{accountsError ? (
								<p class="error-banner" role="alert">
									{accountsError}
								</p>
							) : null}

							{!isLoadingAccounts && !accountsError && accounts.length === 0 ? (
								<div class="item-stack">
									<div class="item-row-card">
										<p class="panel-copy">No accounts found for this user yet.</p>
									</div>
								</div>
							) : null}

							{!isLoadingAccounts && accounts.length > 0 ? (
								<div class="account-grid" role="list" aria-label="Accounts">
									{accounts.map((account) => (
										<button
											type="button"
											class="account-card"
											key={account.id}
											onClick={() => openEditModal(account)}
											role="listitem"
										>
											<div class="account-card-top">
												<div class="item-icon-wrap account-card-icon" aria-hidden="true">
													<span class="item-icon-fallback">
														{account.name.slice(0, 1).toUpperCase()}
													</span>
												</div>

												<h3 class="account-card-title">{account.name}</h3>
											</div>

											<div class="account-card-copy">
												<p class="item-meta">
													{account.balance_include ? 'Included in total' : 'Excluded from total'}
												</p>
											</div>

											<p class={`account-card-balance ${account.is_debit ? 'is-debit' : 'is-credit'}`}>
												{formatCurrencyValue(account.balance, account.is_debit ? { positivePrefix: '+' } : { multiplier: -1 })}
											</p>
										</button>
									))}
								</div>
							) : null}
						</section>
					</div>
				</AppHeader>
			) : null}

			{!hasCheckedSession || !sessionState || isLoadingAccounts ? <LoadingOverlay label="Loading accounts" /> : null}

			{modalMode ? (
				<AccountFormModal
					mode={modalMode}
					formState={formState}
					isSubmitting={isSubmitting}
					submitError={submitError}
					onClose={closeModal}
					onSubmit={handleAccountSubmit}
					onDelete={modalMode === 'edit' ? handleAccountDelete : undefined}
					onFieldChange={updateField}
				/>
			) : null}
		</section>
	);
}
