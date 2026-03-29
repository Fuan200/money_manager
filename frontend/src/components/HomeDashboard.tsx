import { useEffect, useState } from 'preact/hooks';
import { apiBaseUrl, clearAuthSession, readAuthSession } from '../lib/auth';
import { AppHeader } from './AppHeader';
import { LoadingOverlay } from './LoadingOverlay';
import { TransactionFormModal, type TransactionFormState } from './TransactionFormModal';
import type { JSX } from 'preact/jsx-runtime';

interface SessionState {
	email: string;
	token: string;
}

interface SelectItem {
	id: string;
	name: string;
	type?: boolean;
	icon?: {
		id: string;
		label: string;
		url: string;
	} | null;
}

interface UserTransaction {
	id: string;
	amount: string;
	description: string;
	type: boolean;
	external_expense: boolean;
	transaction_date: string;
	account_id: string;
	category_id: string;
}

export function HomeDashboard() {
	const [sessionState, setSessionState] = useState<SessionState | null>(() => {
		const session = readAuthSession();
		return session ? { email: session.email, token: session.token } : null;
	});
	const [accounts, setAccounts] = useState<SelectItem[]>([]);
	const [categories, setCategories] = useState<SelectItem[]>([]);
	const [transactions, setTransactions] = useState<UserTransaction[]>([]);
	const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(true);
	const [isTransactionModalOpen, setIsTransactionModalOpen] = useState<boolean>(false);
	const [submitError, setSubmitError] = useState<string>('');
	const [submitSuccess, setSubmitSuccess] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [transactionFormState, setTransactionFormState] = useState<TransactionFormState>({
		amount: '',
		description: '',
		type: false,
		transactionDate: new Date().toISOString().slice(0, 16),
		accountId: '',
		categoryId: '',
	});

	useEffect(() => {
		if (!sessionState) {
			window.location.replace('/');
		}
	}, [sessionState]);

	useEffect(() => {
		if (!sessionState) {
			return;
		}

		void loadTransactionOptions(sessionState.token);
	}, [sessionState]);

	const handleSignOut = () => {
		clearAuthSession();
		window.location.replace('/');
	};

	const expenseCategories = categories.filter((category) => !category.type);
	const incomeCategories = categories.filter((category) => category.type);
	const availableCategories = transactionFormState.type ? incomeCategories : expenseCategories;
	const findAccount = (accountId: string) => accounts.find((account) => account.id === accountId);
	const findCategory = (categoryId: string) => categories.find((category) => category.id === categoryId);

	const loadTransactionOptions = async (token: string) => {
		setIsLoadingOptions(true);

		try {
			const [accountsResponse, categoriesResponse] = await Promise.all([
				fetch(`${apiBaseUrl}/accounts/get-all-accounts-by-user`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}),
				fetch(`${apiBaseUrl}/categories/get-all-categories-by-user`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}),
			]);

			if (!accountsResponse.ok || !categoriesResponse.ok) {
				throw new Error('Unable to load transaction options.');
			}

			const accountsPayload = (await accountsResponse.json()) as { data: SelectItem[] };
			const categoriesPayload = (await categoriesResponse.json()) as { data: SelectItem[] };

			setAccounts(accountsPayload.data);
			setCategories(categoriesPayload.data);
			await loadTransactions(token);
		} catch (error) {
			setSubmitError(error instanceof Error ? error.message : 'Unable to load transaction options.');
		} finally {
			setIsLoadingOptions(false);
		}
	};

	const loadTransactions = async (token: string) => {
		const response = await fetch(`${apiBaseUrl}/transactions/get-all-transactions-by-user`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		if (!response.ok) {
			throw new Error('Unable to load transactions.');
		}

		const payload = (await response.json()) as { data: UserTransaction[] };
		setTransactions(payload.data);
	};

	const resetTransactionForm = () => {
		setTransactionFormState({
			amount: '',
			description: '',
			type: false,
			transactionDate: new Date().toISOString().slice(0, 16),
			accountId: '',
			categoryId: '',
		});
	};

	const openTransactionModal = () => {
		setSubmitError('');
		setIsTransactionModalOpen(true);
	};

	const closeTransactionModal = () => {
		setIsTransactionModalOpen(false);
		setSubmitError('');
	};

	const updateTransactionField = <K extends keyof TransactionFormState>(
		field: K,
		value: TransactionFormState[K],
	) => {
		setTransactionFormState((currentState) => {
			const nextState = {
				...currentState,
				[field]: value,
			};

			if (field === 'type') {
				nextState.categoryId = '';
			}

			return nextState;
		});
	};

	const handleTransactionSubmit = async (
		event: JSX.TargetedEvent<HTMLFormElement, SubmitEvent>,
	) => {
		event.preventDefault();

		if (!sessionState) {
			return;
		}

		setSubmitError('');
		setSubmitSuccess('');

		if (!transactionFormState.amount.trim()) {
			setSubmitError('Amount is required.');
			return;
		}

		if (!transactionFormState.description.trim()) {
			setSubmitError('Description is required.');
			return;
		}

		if (!transactionFormState.accountId) {
			setSubmitError('Account is required.');
			return;
		}

		if (!transactionFormState.categoryId) {
			setSubmitError('Category is required.');
			return;
		}

		if (!transactionFormState.transactionDate) {
			setSubmitError('Transaction date is required.');
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await fetch(`${apiBaseUrl}/transactions/create-transaction`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${sessionState.token}`,
				},
				body: JSON.stringify({
					amount: transactionFormState.amount.trim(),
					description: transactionFormState.description.trim(),
					type: transactionFormState.type,
					transaction_date: new Date(transactionFormState.transactionDate).toISOString(),
					account_id: transactionFormState.accountId,
					category_id: transactionFormState.categoryId,
					external_expense: false,
				}),
			});

			if (!response.ok) {
				const errorPayload = (await response.json().catch(() => null)) as
					| { error?: string; detail?: string }
					| null;
				const backendError = errorPayload?.error ?? errorPayload?.detail ?? 'Unable to create transaction.';
				throw new Error(backendError);
			}

			setSubmitSuccess('Transaction created successfully.');
			resetTransactionForm();
			closeTransactionModal();
			await loadTransactions(sessionState.token);
		} catch (error) {
			setSubmitError(error instanceof Error ? error.message : 'Unable to create transaction.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<section class="app-shell">
			{sessionState ? <AppHeader activeTab="home" onSignOut={handleSignOut} /> : null}

			<div class="app-content">
				{sessionState ? (
					<button type="button" class="primary-button" onClick={openTransactionModal}>
						New transaction
					</button>
				) : null}

				{submitSuccess ? (
					<p class="success-banner" role="status">
						{submitSuccess}
					</p>
				) : null}

				{sessionState ? (
					<>
						<section class="accounts-list-section">
							{transactions.length > 0 ? (
								<div class="transactions-stack">
									{transactions.map((transaction) => (
										(() => {
											const category = findCategory(transaction.category_id);
											const account = findAccount(transaction.account_id);
											const categoryName = category?.name ?? 'Unknown category';
											const accountName = account?.name ?? 'Unknown account';

											return (
												<div class="transaction-row" key={transaction.id}>
													<div class="account-leading">
														<div class="account-icon-wrap" aria-hidden="true">
															<span class="account-icon-fallback">
																{categoryName.slice(0, 1).toUpperCase()}
															</span>
														</div>

														<div class="account-copy">
															<h3>{categoryName}</h3>
															<p class="account-meta">
																{transaction.description} | {accountName}
															</p>
														</div>
													</div>

													<p class={`transaction-amount ${transaction.type ? 'is-income' : 'is-expense'}`}>
														{transaction.type ? '+' : '-'}${transaction.amount}
													</p>
												</div>
											);
										})()
									))}
								</div>
							) : (
								<div class="account-row-card">
									<p class="panel-copy">No transactions yet.</p>
								</div>
							)}
						</section>
					</>
				) : null}
			</div>

			{!sessionState || isLoadingOptions ? <LoadingOverlay label="Loading home" /> : null}

			{isTransactionModalOpen ? (
				<TransactionFormModal
					formState={transactionFormState}
					isSubmitting={isSubmitting}
					submitError={submitError}
					accounts={accounts}
					categories={availableCategories}
					onClose={closeTransactionModal}
					onSubmit={handleTransactionSubmit}
					onFieldChange={updateTransactionField}
				/>
			) : null}
		</section>
	);
}
