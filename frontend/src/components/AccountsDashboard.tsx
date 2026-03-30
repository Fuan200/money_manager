import type { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { apiBaseUrl, clearAuthSession, readAuthSession } from '../lib/auth';
import { currencyFormatter, formatCurrencyValue } from '../lib/currency';
import { AccountFormModal, type AccountFormState } from './AccountFormModal';
import { AnimatedAmount } from './AnimatedAmount';
import { AppHeader } from './AppHeader';
import { LoadingOverlay } from './LoadingOverlay';
import { TotalBalanceCard } from './TotalBalanceCard';

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
		is_debit: boolean;
	};
}

interface UserAccount {
	id: string;
	name: string;
	balance: string;
	balance_include: boolean;
	saving: boolean;
	is_debit: boolean;
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

interface AccountsTotalResponse {
	success: true;
	data: {
		total_accounts: string;
	};
}

export function AccountsDashboard() {
	const [sessionState, setSessionState] = useState<SessionState | null>(null);
	const [hasCheckedSession, setHasCheckedSession] = useState<boolean>(false);
	const [accounts, setAccounts] = useState<UserAccount[]>([]);
	const [totalBalance, setTotalBalance] = useState<string>(currencyFormatter.format(0));
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
		isDebit: true,
		iconId: '',
	});

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
			isDebit: true,
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
			isDebit: account.is_debit,
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
			const [accountsResponse, totalsResponse] = await Promise.all([
				fetch(`${apiBaseUrl}/accounts/get-all-accounts-by-user`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}),
				fetch(`${apiBaseUrl}/accounts/get-accounts-total`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}),
			]);

			if (!accountsResponse.ok || !totalsResponse.ok) {
				const failedResponse = accountsResponse.ok ? totalsResponse : accountsResponse;
				const errorPayload = (await failedResponse.json().catch(() => null)) as
					| { error?: string; detail?: string }
					| null;
				const backendError = errorPayload?.error ?? errorPayload?.detail ?? 'Unable to load accounts.';
				throw new Error(backendError);
			}

			const accountsPayload = (await accountsResponse.json()) as AccountsListResponse;
			const totalsPayload = (await totalsResponse.json()) as AccountsTotalResponse;
			const totalAccounts = Number.parseFloat(totalsPayload.data.total_accounts ?? '0');

			setAccounts(accountsPayload.data);
			setTotalBalance(currencyFormatter.format(totalAccounts));
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
					is_debit: formState.isDebit,
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
		<section class="app-shell">
			{sessionState ? <AppHeader activeTab="accounts" onSignOut={handleSignOut} /> : null}

			<div class="app-content">
				{sessionState ? (
					<TotalBalanceCard totalBalance={totalBalance} />
				) : null}

				{sessionState ? (
					<button
						type="button"
						class="primary-button"
						onClick={openCreateModal}
					>
						New account
					</button>
				) : null}

				{submitSuccess ? (
					<p class="success-banner" role="status">
						{submitSuccess}
					</p>
				) : null}

				<section class="accounts-list-section">
					{accountsError ? (
						<p class="error-banner" role="alert">
							{accountsError}
						</p>
					) : null}

					{sessionState && !isLoadingAccounts && !accountsError && accounts.length === 0 ? (
						<div class="accounts-stack">
							<div class="account-row-card">
								<p class="panel-copy">No accounts found for this user yet.</p>
							</div>
						</div>
					) : null}

					{sessionState && !isLoadingAccounts && accounts.length > 0 ? (
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
												{account.is_debit ? 'Debit' : 'Credit'}
												{account.saving ? ' | Savings' : ' | Standard'}
												{account.balance_include ? ' | Included in totals' : ' | Excluded from totals'}
											</p>
										</div>
									</div>

									<AnimatedAmount
										value={formatCurrencyValue(account.balance, {
											multiplier: account.is_debit ? 1 : -1,
										})}
										className={`account-balance ${account.is_debit ? 'is-debit' : 'is-credit'}`}
									/>
								</button>
							))}
						</div>
					) : null}
				</section>
			</div>

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
