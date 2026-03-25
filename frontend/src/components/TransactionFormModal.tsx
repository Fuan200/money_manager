import type { JSX } from 'preact';

interface SelectOption {
	id: string;
	name: string;
}

export interface TransactionFormState {
	amount: string;
	description: string;
	type: boolean;
	transactionDate: string;
	accountId: string;
	categoryId: string;
}

interface TransactionFormModalProps {
	formState: TransactionFormState;
	isSubmitting: boolean;
	submitError: string;
	accounts: SelectOption[];
	categories: SelectOption[];
	onClose: () => void;
	onSubmit: (event: JSX.TargetedEvent<HTMLFormElement, SubmitEvent>) => void | Promise<void>;
	onFieldChange: <K extends keyof TransactionFormState>(field: K, value: TransactionFormState[K]) => void;
}

export function TransactionFormModal({
	formState,
	isSubmitting,
	submitError,
	accounts,
	categories,
	onClose,
	onSubmit,
	onFieldChange,
}: TransactionFormModalProps) {
	return (
		<div class="modal-backdrop" onClick={onClose}>
			<section
				class="modal-card account-form-card"
				role="dialog"
				aria-modal="true"
				aria-labelledby="transaction-form-title"
				onClick={(event) => event.stopPropagation()}
			>
				<div class="modal-header">
					<div class="form-card-header">
						<p class="panel-label">New transaction</p>
						<h2 id="transaction-form-title">Create a new movement</h2>
					</div>

					<button type="button" class="modal-close-button" onClick={onClose} aria-label="Close modal">
						X
					</button>
				</div>

				<form class="account-form" onSubmit={onSubmit}>
					<div class="field">
						<span>Type</span>
						<div class="option-toggle" role="radiogroup" aria-label="Transaction type">
							<button
								type="button"
								class={`option-toggle-button ${!formState.type ? 'is-active' : ''}`}
								aria-pressed={!formState.type}
								onClick={() => onFieldChange('type', false)}
							>
								Expense
							</button>
							<button
								type="button"
								class={`option-toggle-button ${formState.type ? 'is-active' : ''}`}
								aria-pressed={formState.type}
								onClick={() => onFieldChange('type', true)}
							>
								Income
							</button>
						</div>
					</div>

					<label class="field">
						<span>Amount</span>
						<input
							type="number"
							name="amount"
							value={formState.amount}
							onInput={(event) => onFieldChange('amount', event.currentTarget.value)}
							placeholder="0.00"
							step="0.01"
							required
						/>
					</label>

					<label class="field">
						<span>Description</span>
						<input
							type="text"
							name="description"
							value={formState.description}
							onInput={(event) => onFieldChange('description', event.currentTarget.value)}
							placeholder="Weekly groceries"
							required
						/>
					</label>

					<label class="field">
						<span>Account</span>
						<select
							name="accountId"
							value={formState.accountId}
							onInput={(event) => onFieldChange('accountId', event.currentTarget.value)}
							required
						>
							<option value="">Select an account</option>
							{accounts.map((account) => (
								<option key={account.id} value={account.id}>
									{account.name}
								</option>
							))}
						</select>
					</label>

					<label class="field">
						<span>Category</span>
						<select
							name="categoryId"
							value={formState.categoryId}
							onInput={(event) => onFieldChange('categoryId', event.currentTarget.value)}
							required
						>
							<option value="">Select a category</option>
							{categories.map((category) => (
								<option key={category.id} value={category.id}>
									{category.name}
								</option>
							))}
						</select>
					</label>

					<label class="field">
						<span>Date</span>
						<input
							type="datetime-local"
							name="transactionDate"
							value={formState.transactionDate}
							onInput={(event) => onFieldChange('transactionDate', event.currentTarget.value)}
							required
						/>
					</label>

					{submitError ? (
						<p class="error-banner" role="alert">
							{submitError}
						</p>
					) : null}

					<div class="form-actions">
						<button type="submit" class="primary-button" disabled={isSubmitting}>
							{isSubmitting ? 'Creating...' : 'Create transaction'}
						</button>
					</div>
				</form>
			</section>
		</div>
	);
}
