import type { JSX } from 'preact';

export interface AccountFormState {
	name: string;
	balance: string;
	isDebit: boolean;
	balanceInclude: boolean;
	saving: boolean;
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
				class="modal-card entity-form-card"
				role="dialog"
				aria-modal="true"
				aria-labelledby="account-form-title"
				onClick={(event) => event.stopPropagation()}
			>
				<div class="modal-header">
					<div class="form-card-header">
						<p class="panel-label">{isEditMode ? 'Edit account' : 'Create account'}</p>
						<h2 id="account-form-title">
							{isEditMode ? 'Review and update this account' : 'Enter the account fields'}
						</h2>
					</div>

					<button type="button" class="modal-close-button" onClick={onClose} aria-label="Close modal">
						X
					</button>
				</div>

				<form class="entity-form" onSubmit={onSubmit}>
					<label class="field">
						<span>Name</span>
						<input
							type="text"
							name="name"
							value={formState.name}
							onInput={(event) => onFieldChange('name', event.currentTarget.value)}
							placeholder="Cash wallet"
							required
						/>
					</label>

					<label class="field">
						<span>Current balance</span>
						<input
							type="number"
							name="balance"
							value={formState.balance}
							onInput={(event) => onFieldChange('balance', event.currentTarget.value)}
							placeholder="0.00"
							inputMode="decimal"
							step="0.01"
							required
						/>
					</label>

					<div class="field">
						<span>Account type</span>
						<div class="option-toggle" role="radiogroup" aria-label="Account type">
							<button
								type="button"
								class={`option-toggle-button ${formState.isDebit ? 'is-active' : ''}`}
								aria-pressed={formState.isDebit}
								onClick={() => onFieldChange('isDebit', true)}
							>
								Debit
							</button>
							<button
								type="button"
								class={`option-toggle-button ${!formState.isDebit ? 'is-active' : ''}`}
								aria-pressed={!formState.isDebit}
								onClick={() => onFieldChange('isDebit', false)}
							>
								Credit
							</button>
						</div>
					</div>

					<label class="checkbox-field">
						<input
							type="checkbox"
							name="balanceInclude"
							checked={formState.balanceInclude}
							onInput={(event) => onFieldChange('balanceInclude', event.currentTarget.checked)}
						/>
						<span>Include this account in the total balance.</span>
					</label>

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
