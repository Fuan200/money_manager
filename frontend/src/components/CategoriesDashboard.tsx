import type { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { apiBaseUrl, clearAuthSession, readAuthSession } from '../lib/auth';
import { AppHeader } from './AppHeader';
import { CategoryFormModal, type CategoryFormState } from './CategoryFormModal';
import { LoadingOverlay } from './LoadingOverlay';

interface SessionState {
	email: string;
	token: string;
}

interface CategoryApiResponse {
	success: true;
	data: {
		id: string;
		name: string;
		type: boolean;
		icon: {
			id: string;
			label: string;
			url: string;
		} | null;
	};
}

interface UserCategory {
	id: string;
	name: string;
	type: boolean;
	icon: {
		id: string;
		label: string;
		url: string;
	} | null;
}

interface CategoriesListResponse {
	success: true;
	data: UserCategory[];
}

export function CategoriesDashboard() {
	const [sessionState, setSessionState] = useState<SessionState | null>(null);
	const [hasCheckedSession, setHasCheckedSession] = useState<boolean>(false);
	const [categories, setCategories] = useState<UserCategory[]>([]);
	const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(true);
	const [categoriesError, setCategoriesError] = useState<string>('');
	const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
	const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
	const [submitError, setSubmitError] = useState<string>('');
	const [submitSuccess, setSubmitSuccess] = useState<string>('');
	const [formState, setFormState] = useState<CategoryFormState>({
		name: '',
		type: false,
		iconId: '',
	});
	const expenseCategories = categories.filter((category) => !category.type);
	const incomeCategories = categories.filter((category) => category.type);

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

		void loadCategories(sessionState.token);
	}, [sessionState]);

	const handleSignOut = () => {
		clearAuthSession();
		window.location.replace('/');
	};

	const updateField = <K extends keyof CategoryFormState>(
		field: K,
		value: CategoryFormState[K],
	) => {
		setFormState((currentState) => ({
			...currentState,
			[field]: value,
		}));
	};

	const resetForm = () => {
		setFormState({
			name: '',
			type: false,
			iconId: '',
		});
	};

	const closeModal = () => {
		setModalMode(null);
		setSelectedCategoryId(null);
		setSubmitError('');
	};

	const openCreateModal = () => {
		resetForm();
		setSelectedCategoryId(null);
		setSubmitError('');
		setSubmitSuccess('');
		setModalMode('create');
	};

	const openEditModal = (category: UserCategory) => {
		setFormState({
			name: category.name,
			type: category.type,
			iconId: category.icon?.id ?? '',
		});
		setSelectedCategoryId(category.id);
		setSubmitError('');
		setSubmitSuccess('');
		setModalMode('edit');
	};

	const loadCategories = async (token: string) => {
		setIsLoadingCategories(true);
		setCategoriesError('');

		try {
			const response = await fetch(`${apiBaseUrl}/categories/get-all-categories-by-user`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				const errorPayload = (await response.json().catch(() => null)) as
					| { error?: string; detail?: string }
					| null;
				const backendError = errorPayload?.error ?? errorPayload?.detail ?? 'Unable to load categories.';
				throw new Error(backendError);
			}

			const payload = (await response.json()) as CategoriesListResponse;
			setCategories(payload.data);
		} catch (error) {
			setCategoriesError(error instanceof Error ? error.message : 'Unable to load categories.');
		} finally {
			setIsLoadingCategories(false);
		}
	};

	const handleCategorySubmit = async (
		event: JSX.TargetedEvent<HTMLFormElement, SubmitEvent>,
	) => {
		event.preventDefault();

		if (!sessionState) {
			return;
		}

		setSubmitError('');
		setSubmitSuccess('');

		if (!formState.name.trim()) {
			setSubmitError('Category name is required.');
			return;
		}

		setIsSubmitting(true);

		try {
			const isEditMode = modalMode === 'edit' && selectedCategoryId;
			const response = await fetch(
				isEditMode
					? `${apiBaseUrl}/categories/update-category/${selectedCategoryId}`
					: `${apiBaseUrl}/categories/create-category`,
				{
					method: isEditMode ? 'PATCH' : 'POST',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${sessionState.token}`,
					},
					body: JSON.stringify({
						name: formState.name.trim(),
						type: formState.type,
						icon_id: formState.iconId.trim() || null,
					}),
				},
			);

			if (!response.ok) {
				const errorPayload = (await response.json().catch(() => null)) as
					| { error?: string; detail?: string }
					| null;
				const backendError = errorPayload?.error ?? errorPayload?.detail ?? 'Unable to save category.';
				throw new Error(backendError);
			}

			const payload = (await response.json()) as CategoryApiResponse;
			setSubmitSuccess(
				modalMode === 'edit'
					? `Category "${payload.data.name}" updated successfully.`
					: `Category "${payload.data.name}" created successfully.`,
			);
			resetForm();
			closeModal();
			await loadCategories(sessionState.token);
		} catch (error) {
			setSubmitError(
				error instanceof Error
					? error.message
					: modalMode === 'edit'
						? 'Unable to update category.'
						: 'Unable to create category.',
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleCategoryDelete = async () => {
		if (!sessionState || !selectedCategoryId) {
			return;
		}

		const selectedCategory = categories.find((category) => category.id === selectedCategoryId);
		const categoryName = selectedCategory?.name ?? 'this category';
		const shouldDelete = window.confirm(`Delete "${categoryName}"? This action cannot be undone.`);

		if (!shouldDelete) {
			return;
		}

		setIsSubmitting(true);
		setSubmitError('');
		setSubmitSuccess('');

		try {
			const response = await fetch(`${apiBaseUrl}/categories/delete-category/${selectedCategoryId}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${sessionState.token}`,
				},
			});

			if (!response.ok) {
				const errorPayload = (await response.json().catch(() => null)) as
					| { error?: string; detail?: string }
					| null;
				const backendError = errorPayload?.error ?? errorPayload?.detail ?? 'Unable to delete category.';
				throw new Error(backendError);
			}

			const payload = (await response.json()) as CategoryApiResponse;
			setSubmitSuccess(`Category "${payload.data.name}" deleted successfully.`);
			closeModal();
			await loadCategories(sessionState.token);
		} catch (error) {
			setSubmitError(error instanceof Error ? error.message : 'Unable to delete category.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<section class="app-shell">
			{sessionState ? <AppHeader activeTab="categories" onSignOut={handleSignOut} /> : null}

			<div class="app-content">
				{sessionState ? (
					<button type="button" class="primary-button" onClick={openCreateModal}>
						New category
					</button>
				) : null}

				{submitSuccess ? (
					<p class="success-banner" role="status">
						{submitSuccess}
					</p>
				) : null}

				<section class="accounts-list-section">
					{categoriesError ? (
						<p class="error-banner" role="alert">
							{categoriesError}
						</p>
					) : null}

					{sessionState && !isLoadingCategories && !categoriesError && categories.length === 0 ? (
						<div class="accounts-stack">
							<div class="account-row-card">
								<p class="panel-copy">No categories found for this user yet.</p>
							</div>
						</div>
					) : null}

					{sessionState && !isLoadingCategories && categories.length > 0 ? (
						<div class="category-sections">
							<section class="category-section">
								<div class="section-heading">
									<div>
										<p class="panel-label">Expenses</p>
									</div>
								</div>

								<div class="accounts-stack">
									{expenseCategories.length > 0 ? (
										expenseCategories.map((category) => (
											<button
												type="button"
												class="account-row-card"
												key={category.id}
												onClick={() => openEditModal(category)}
											>
												<div class="account-leading">
													<div class="account-icon-wrap" aria-hidden="true">
														{category.icon?.url ? (
															<img
																src={category.icon.url}
																alt=""
																class="account-icon"
																loading="lazy"
															/>
														) : (
															<span class="account-icon-fallback">
																{category.name.slice(0, 1).toUpperCase()}
															</span>
														)}
													</div>

													<div class="account-copy">
														<h3>{category.name}</h3>
													</div>
												</div>
											</button>
										))
									) : (
										<div class="account-row-card">
											<p class="panel-copy">No expense categories yet.</p>
										</div>
									)}
								</div>
							</section>

							<section class="category-section">
								<div class="section-heading">
									<div>
										<p class="panel-label">Incomes</p>
									</div>
								</div>

								<div class="accounts-stack">
									{incomeCategories.length > 0 ? (
										incomeCategories.map((category) => (
											<button
												type="button"
												class="account-row-card"
												key={category.id}
												onClick={() => openEditModal(category)}
											>
												<div class="account-leading">
													<div class="account-icon-wrap" aria-hidden="true">
														{category.icon?.url ? (
															<img
																src={category.icon.url}
																alt=""
																class="account-icon"
																loading="lazy"
															/>
														) : (
															<span class="account-icon-fallback">
																{category.name.slice(0, 1).toUpperCase()}
															</span>
														)}
													</div>

													<div class="account-copy">
														<h3>{category.name}</h3>
													</div>
												</div>
											</button>
										))
									) : (
										<div class="account-row-card">
											<p class="panel-copy">No income categories yet.</p>
										</div>
									)}
								</div>
							</section>
						</div>
					) : null}
				</section>
			</div>

			{!hasCheckedSession || !sessionState || isLoadingCategories ? <LoadingOverlay label="Loading categories" /> : null}

			{modalMode ? (
				<CategoryFormModal
					mode={modalMode}
					formState={formState}
					isSubmitting={isSubmitting}
					submitError={submitError}
					onClose={closeModal}
					onSubmit={handleCategorySubmit}
					onDelete={modalMode === 'edit' ? handleCategoryDelete : undefined}
					onFieldChange={updateField}
				/>
			) : null}
		</section>
	);
}
