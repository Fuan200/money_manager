import { useEffect, useState } from 'preact/hooks';
import { apiBaseUrl, clearAuthSession, readAuthSession } from '../lib/auth';
import { currencyFormatter, formatCurrencyValue } from '../lib/currency';
import { AnimatedAmount } from './AnimatedAmount';
import { AppHeader } from './AppHeader';
import { CategoryExpenseChart, type CategoryExpenseShare } from './CategoryExpenseChart';
import { LoadingOverlay } from './LoadingOverlay';
import { TransactionFormModal, type TransactionFormState } from './TransactionFormModal';
import { TotalBalanceCard } from './TotalBalanceCard';
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
	updated_at: string;
	amount: string;
	description: string;
	type: boolean;
	external_expense: boolean;
	transaction_date: string;
	account_id: string;
	category_id: string;
}

interface AccountsTotalResponse {
	success: true;
	data: {
		total_accounts: string;
	};
}

type TransactionTab = 'expenses' | 'incomes';

function formatDateOnlyLocal(date: Date): string {
	const year = date.getFullYear();
	const month = `${date.getMonth() + 1}`.padStart(2, '0');
	const day = `${date.getDate()}`.padStart(2, '0');

	return `${year}-${month}-${day}`;
}

function toTransactionIso(dateValue: string): string {
	return new Date(`${dateValue}T12:00:00`).toISOString();
}

export function HomeDashboard() {
	const [sessionState, setSessionState] = useState<SessionState | null>(null);
	const [hasCheckedSession, setHasCheckedSession] = useState<boolean>(false);
	const [accounts, setAccounts] = useState<SelectItem[]>([]);
	const [categories, setCategories] = useState<SelectItem[]>([]);
	const [transactions, setTransactions] = useState<UserTransaction[]>([]);
	const [totalBalance, setTotalBalance] = useState<string>(currencyFormatter.format(0));
	const [activeTransactionTab, setActiveTransactionTab] = useState<TransactionTab>('expenses');
	const [isLoadingOptions, setIsLoadingOptions] = useState<boolean>(true);
	const [isTransactionModalOpen, setIsTransactionModalOpen] = useState<boolean>(false);
	const [transactionModalMode, setTransactionModalMode] = useState<'create' | 'edit'>('create');
	const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
	const [submitError, setSubmitError] = useState<string>('');
	const [submitSuccess, setSubmitSuccess] = useState<string>('');
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [transactionFormState, setTransactionFormState] = useState<TransactionFormState>({
		amount: '',
		description: '',
		type: false,
		transactionDate: formatDateOnlyLocal(new Date()),
		accountId: '',
		categoryId: '',
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

		void loadTransactionOptions(sessionState.token);
	}, [sessionState]);

	const handleSignOut = () => {
		clearAuthSession();
		window.location.replace('/');
	};

	const expenseCategories = categories.filter((category) => !category.type);
	const incomeCategories = categories.filter((category) => category.type);
	const availableCategories = transactionFormState.type ? incomeCategories : expenseCategories;
	const filteredTransactions = transactions.filter((transaction) =>
		activeTransactionTab === 'incomes' ? transaction.type : !transaction.type,
	);
	const chartTransactions = filteredTransactions;
	const findAccount = (accountId: string) => accounts.find((account) => account.id === accountId);
	const findCategory = (categoryId: string) => categories.find((category) => category.id === categoryId);
	const categoryShares = chartTransactions.reduce<Map<string, CategoryExpenseShare>>((sharesMap, transaction) => {

		const amount = Number.parseFloat(transaction.amount ?? '0');
		const category = findCategory(transaction.category_id);
		const existingShare = sharesMap.get(transaction.category_id);

		if (existingShare) {
			existingShare.amount += amount;
			return sharesMap;
		}

		sharesMap.set(transaction.category_id, {
			id: transaction.category_id,
			name: category?.name ?? 'Unknown category',
			amount,
			percentage: 0,
		});

		return sharesMap;
	}, new Map<string, CategoryExpenseShare>());
	const chartItems = (() => {
		const sortedShares = Array.from(categoryShares.values()).sort((left, right) => right.amount - left.amount);

		if (sortedShares.length <= 5) {
			return sortedShares;
		}

		const visibleShares = sortedShares.slice(0, 4);
		const remainingAmount = sortedShares.slice(4).reduce((sum, item) => sum + item.amount, 0);

		return [
			...visibleShares,
			{
				id: `other-${activeTransactionTab}-categories`,
				name: 'Other categories',
				amount: remainingAmount,
				percentage: 0,
			},
		];
	})();
	const totalChartAmount = chartItems.reduce((sum, item) => sum + item.amount, 0);
	const categoryBreakdown = chartItems.map((item) => ({
		...item,
		percentage: totalChartAmount > 0 ? Number(((item.amount / totalChartAmount) * 100).toFixed(1)) : 0,
	}));
	const chartTitle = activeTransactionTab === 'expenses' ? 'Expense categories' : 'Income categories';
	const chartTotalLabel = activeTransactionTab === 'expenses' ? 'Total expenses' : 'Total incomes';
	const chartEmptyMessage =
		activeTransactionTab === 'expenses'
			? 'Add expense transactions to see your category distribution.'
			: 'Add income transactions to see your category distribution.';
	const latestUpdatedTransaction = transactions.reduce<UserTransaction | null>((latestTransaction, transaction) => {
		if (!latestTransaction) {
			return transaction;
		}

		return new Date(transaction.updated_at).getTime() > new Date(latestTransaction.updated_at).getTime()
			? transaction
			: latestTransaction;
	}, null);
	const lastUsedTransactionDate = latestUpdatedTransaction
		? formatDateOnlyLocal(new Date(latestUpdatedTransaction.transaction_date))
		: null;

	const loadTransactionOptions = async (token: string) => {
		setIsLoadingOptions(true);

		try {
			const [accountsResponse, categoriesResponse, totalsResponse] = await Promise.all([
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
				fetch(`${apiBaseUrl}/accounts/get-accounts-total`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}),
			]);

			if (!accountsResponse.ok || !categoriesResponse.ok || !totalsResponse.ok) {
				throw new Error('Unable to load transaction options.');
			}

			const accountsPayload = (await accountsResponse.json()) as { data: SelectItem[] };
			const categoriesPayload = (await categoriesResponse.json()) as { data: SelectItem[] };
			const totalsPayload = (await totalsResponse.json()) as AccountsTotalResponse;
			const totalAccounts = Number.parseFloat(totalsPayload.data.total_accounts ?? '0');

			setAccounts(accountsPayload.data);
			setCategories(categoriesPayload.data);
			setTotalBalance(currencyFormatter.format(totalAccounts));
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
			transactionDate: formatDateOnlyLocal(new Date()),
			accountId: accounts[0]?.id ?? '',
			categoryId: '',
		});
	};

	const openTransactionModal = () => {
		setTransactionModalMode('create');
		setSelectedTransactionId(null);
		setTransactionFormState((currentState) => ({
			...currentState,
			accountId: currentState.accountId || accounts[0]?.id || '',
			transactionDate: currentState.transactionDate || formatDateOnlyLocal(new Date()),
		}));
		setSubmitError('');
		setIsTransactionModalOpen(true);
	};

	const openEditTransactionModal = (transaction: UserTransaction) => {
		setTransactionModalMode('edit');
		setSelectedTransactionId(transaction.id);
		setTransactionFormState({
			amount: transaction.amount,
			description: transaction.description,
			type: transaction.type,
			transactionDate: formatDateOnlyLocal(new Date(transaction.transaction_date)),
			accountId: transaction.account_id,
			categoryId: transaction.category_id,
		});
		setSubmitError('');
		setSubmitSuccess('');
		setIsTransactionModalOpen(true);
	};

	const closeTransactionModal = () => {
		setIsTransactionModalOpen(false);
		setSelectedTransactionId(null);
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
			const isEditMode = transactionModalMode === 'edit' && selectedTransactionId;
			const response = await fetch(
				isEditMode
					? `${apiBaseUrl}/transactions/update-transactions/${selectedTransactionId}`
					: `${apiBaseUrl}/transactions/create-transaction`,
				{
				method: isEditMode ? 'PATCH' : 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${sessionState.token}`,
				},
				body: JSON.stringify({
					amount: transactionFormState.amount.trim(),
					description: transactionFormState.description.trim(),
					type: transactionFormState.type,
					transaction_date: toTransactionIso(transactionFormState.transactionDate),
					account_id: transactionFormState.accountId,
					category_id: transactionFormState.categoryId,
					external_expense: false,
				}),
			},
			);

			if (!response.ok) {
				const errorPayload = (await response.json().catch(() => null)) as
					| { error?: string; detail?: string }
					| null;
				const backendError = errorPayload?.error ?? errorPayload?.detail ?? 'Unable to create transaction.';
				throw new Error(backendError);
			}

			setSubmitSuccess(
				transactionModalMode === 'edit'
					? 'Transaction updated successfully.'
					: 'Transaction created successfully.',
			);
			resetTransactionForm();
			closeTransactionModal();
			await loadTransactionOptions(sessionState.token);
		} catch (error) {
			setSubmitError(
				error instanceof Error
					? error.message
					: transactionModalMode === 'edit'
						? 'Unable to update transaction.'
						: 'Unable to create transaction.',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleTransactionDelete = async () => {
		if (!sessionState || !selectedTransactionId) {
			return;
		}

		const selectedTransaction = transactions.find((transaction) => transaction.id === selectedTransactionId);
		const transactionLabel = selectedTransaction?.description?.trim() || 'this transaction';
		const shouldDelete = window.confirm(`Delete "${transactionLabel}"? This action cannot be undone.`);

		if (!shouldDelete) {
			return;
		}

		setIsSubmitting(true);
		setSubmitError('');
		setSubmitSuccess('');

		try {
			const response = await fetch(`${apiBaseUrl}/transactions/delete-transactions/${selectedTransactionId}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${sessionState.token}`,
				},
			});

			if (!response.ok) {
				const errorPayload = (await response.json().catch(() => null)) as
					| { error?: string; detail?: string }
					| null;
				const backendError = errorPayload?.error ?? errorPayload?.detail ?? 'Unable to delete transaction.';
				throw new Error(backendError);
			}

			setSubmitSuccess('Transaction deleted successfully.');
			closeTransactionModal();
			await loadTransactionOptions(sessionState.token);
		} catch (error) {
			setSubmitError(error instanceof Error ? error.message : 'Unable to delete transaction.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<section>
			{sessionState ? (
				<AppHeader
					activeTab="home"
					onSignOut={handleSignOut}
				>
					<TotalBalanceCard totalBalance={totalBalance} />

					<CategoryExpenseChart
						items={categoryBreakdown}
						title={chartTitle}
						totalLabel={chartTotalLabel}
						emptyMessage={chartEmptyMessage}
						controls={
							<>
								<button type="button" class="primary-button expense-breakdown-action" onClick={openTransactionModal}>
									New transaction
								</button>

								<div class="transaction-tabs" role="tablist" aria-label="Transaction type filters">
									<button
										type="button"
										role="tab"
										class={`transaction-tab ${activeTransactionTab === 'expenses' ? 'is-active' : ''}`}
										aria-selected={activeTransactionTab === 'expenses'}
										onClick={() => setActiveTransactionTab('expenses')}
									>
										Expenses
									</button>
									<button
										type="button"
										role="tab"
										class={`transaction-tab ${activeTransactionTab === 'incomes' ? 'is-active' : ''}`}
										aria-selected={activeTransactionTab === 'incomes'}
										onClick={() => setActiveTransactionTab('incomes')}
									>
										Incomes
									</button>
								</div>
							</>
						}
					/>

					{submitSuccess ? (
						<p class="success-banner" role="status">
							{submitSuccess}
						</p>
					) : null}

					<section class="accounts-list-section">
						{filteredTransactions.length > 0 ? (
							<div class="transactions-stack">
								{filteredTransactions.map((transaction) => (
									(() => {
										const category = findCategory(transaction.category_id);
										const account = findAccount(transaction.account_id);
										const categoryName = category?.name ?? 'Unknown category';
										const accountName = account?.name ?? 'Unknown account';

										return (
											<button
												type="button"
												class="transaction-row"
												key={transaction.id}
												onClick={() => openEditTransactionModal(transaction)}
											>
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

												<AnimatedAmount
													value={formatCurrencyValue(transaction.amount, {
														multiplier: transaction.type ? 1 : -1,
														positivePrefix: transaction.type ? '+' : undefined,
													})}
													className={`transaction-amount ${transaction.type ? 'is-income' : 'is-expense'}`}
												/>
											</button>
										);
									})()
								))}
							</div>
						) : (
							<div class="account-row-card">
								<p class="panel-copy">
									No {activeTransactionTab === 'expenses' ? 'expenses' : 'incomes'} yet.
								</p>
							</div>
						)}
					</section>
				</AppHeader>
			) : null}

			{!hasCheckedSession || !sessionState || isLoadingOptions ? <LoadingOverlay label="Loading home" /> : null}

			{isTransactionModalOpen ? (
				<TransactionFormModal
					mode={transactionModalMode}
					formState={transactionFormState}
					isSubmitting={isSubmitting}
					submitError={submitError}
					accounts={accounts}
					categories={availableCategories}
					lastUsedTransactionDate={lastUsedTransactionDate}
					onClose={closeTransactionModal}
					onSubmit={handleTransactionSubmit}
					onDelete={transactionModalMode === 'edit' ? handleTransactionDelete : undefined}
					onFieldChange={updateTransactionField}
				/>
			) : null}
		</section>
	);
}
