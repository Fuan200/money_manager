import type { JSX } from 'preact';

export interface AccountFormState {
	name: string;
	balance: string;
	balanceInclude: boolean;
	saving: boolean;
	isDebit: boolean;
	iconId: string;
}

interface AccountFormModalProps {
	mode: 'create' | 'edit';
	formState: AccountFormState;
	isSubmitting: boolean;
	submitError: string;
	onClose: () => void;
	onSubmit: (event: JSX.TargetedEvent<HTMLFormElement, SubmitEvent>) => void | Promise<void>;
	onDelete?: () => void | Promise<void>;
	onFieldChange: <K extends keyof AccountFormState>(field: K, value: AccountFormState[K]) => void;
}

export function AccountFormModal({
	mode,
	formState,
	isSubmitting,
	submitError,
	onClose,
	onSubmit,
	onDelete,
	onFieldChange,
}: AccountFormModalProps) {
	const isEditMode = mode === 'edit';

	return (
		<div class="modal-backdrop" onClick={onClose}>
			<section
				class="modal-card account-form-card"
				role="dialog"
				aria-modal="true"
				aria-labelledby="account-form-title"
				onClick={(event) => event.stopPropagation()}
			>
				<div class="modal-header">
					<div class="form-card-header">
						<p class="panel-label">{isEditMode ? 'Edit account' : 'Create account'}</p>
						<h2 id="account-form-title">
							{isEditMode ? 'Review and update this account' : 'Enter the backend account fields'}
						</h2>
					</div>

					<button type="button" class="modal-close-button" onClick={onClose} aria-label="Close modal">
						X
					</button>
				</div>

				<form class="account-form" onSubmit={onSubmit}>
					<label class="field">
						<span>Name</span>
						<input
							type="text"
							name="name"
							value={formState.name}
							onInput={(event) => onFieldChange('name', event.currentTarget.value)}
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
							onInput={(event) => onFieldChange('balance', event.currentTarget.value)}
							placeholder="0.00"
							step="0.01"
							required
						/>
					</label>

					<div class="field">
						<span>Account type</span>
						<div class="option-toggle" role="tablist" aria-label="Account type">
							<button
								type="button"
								role="tab"
								aria-selected={formState.isDebit}
								class={`option-toggle-button ${formState.isDebit ? 'is-active' : ''}`}
								onClick={() => onFieldChange('isDebit', true)}
							>
								Debit
							</button>
							<button
								type="button"
								role="tab"
								aria-selected={!formState.isDebit}
								class={`option-toggle-button ${!formState.isDebit ? 'is-active' : ''}`}
								onClick={() => onFieldChange('isDebit', false)}
							>
								Credit
							</button>
						</div>
						<p class="field-help">
							Debit accounts add to your available money. Credit accounts track money you owe.
						</p>
					</div>

					{/* <label class="field">
						<span>Icon ID</span>
						<input
							type="text"
							name="iconId"
							value={formState.iconId}
							onInput={(event) => onFieldChange('iconId', event.currentTarget.value)}
							placeholder="Optional UUID"
						/>
					</label> */}

					<label class="checkbox-field">
						<input
							type="checkbox"
							name="balanceInclude"
							checked={formState.balanceInclude}
							onInput={(event) => onFieldChange('balanceInclude', event.currentTarget.checked)}
						/>
						<div>
							<span>Include balance in totals</span>
						</div>
					</label>

					{/* <label class="checkbox-field">
						<input
							type="checkbox"
							name="saving"
							checked={formState.saving}
							onInput={(event) => onFieldChange('saving', event.currentTarget.checked)}
						/>
						<div>
							<span>Savings account</span>
						</div>
					</label> */}

					{submitError ? (
						<p class="error-banner" role="alert">
							{submitError}
						</p>
					) : null}

					<div class="form-actions">
						{isEditMode && onDelete ? (
							<button type="button" class="danger-button" disabled={isSubmitting} onClick={() => void onDelete()}>
								{isSubmitting ? 'Deleting...' : 'Delete account'}
							</button>
						) : null}

						<button type="submit" class="primary-button" disabled={isSubmitting}>
							{isSubmitting
								? isEditMode
									? 'Saving...'
									: 'Creating...'
								: isEditMode
									? 'Save changes'
									: 'Create account'}
						</button>
					</div>
				</form>
			</section>
		</div>
	);
}
