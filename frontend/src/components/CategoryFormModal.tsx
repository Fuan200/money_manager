import type { JSX } from 'preact';

export interface CategoryFormState {
	name: string;
	type: boolean;
	iconId: string;
}

interface CategoryFormModalProps {
	mode: 'create' | 'edit';
	formState: CategoryFormState;
	isSubmitting: boolean;
	submitError: string;
	onClose: () => void;
	onSubmit: (event: JSX.TargetedEvent<HTMLFormElement, SubmitEvent>) => void | Promise<void>;
	onDelete?: () => void | Promise<void>;
	onFieldChange: <K extends keyof CategoryFormState>(field: K, value: CategoryFormState[K]) => void;
}

export function CategoryFormModal({
	mode,
	formState,
	isSubmitting,
	submitError,
	onClose,
	onSubmit,
	onDelete,
	onFieldChange,
}: CategoryFormModalProps) {
	const isEditMode = mode === 'edit';

	return (
		<div class="modal-backdrop" onClick={onClose}>
			<section
				class="modal-card entity-form-card"
				role="dialog"
				aria-modal="true"
				aria-labelledby="category-form-title"
				onClick={(event) => event.stopPropagation()}
			>
				<div class="modal-header">
					<div class="form-card-header">
						<p class="panel-label">{isEditMode ? 'Edit category' : 'Create category'}</p>
						<h2 id="category-form-title">
							{isEditMode ? 'Review and update this category' : 'Enter the category fields'}
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
							placeholder="Groceries"
							required
						/>
					</label>

					<div class="field">
						<span>Category type</span>
						<div class="option-toggle" role="radiogroup" aria-label="Category type">
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

					{submitError ? (
						<p class="error-banner" role="alert">
							{submitError}
						</p>
					) : null}

					<div class="form-actions">
						{isEditMode && onDelete ? (
							<button type="button" class="danger-button" disabled={isSubmitting} onClick={() => void onDelete()}>
								{isSubmitting ? 'Deleting...' : 'Delete category'}
							</button>
						) : null}

						<button type="submit" class="primary-button" disabled={isSubmitting}>
							{isSubmitting
								? isEditMode
									? 'Saving...'
									: 'Creating...'
								: isEditMode
									? 'Save changes'
									: 'Create category'}
						</button>
					</div>
				</form>
			</section>
		</div>
	);
}
