import type { JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';

interface SelectOption {
	id: string;
	name: string;
	icon?: {
		id: string;
		label: string;
		url: string;
	} | null;
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
	lastUsedTransactionDate: string | null;
	onClose: () => void;
	onSubmit: (event: JSX.TargetedEvent<HTMLFormElement, SubmitEvent>) => void | Promise<void>;
	onFieldChange: <K extends keyof TransactionFormState>(field: K, value: TransactionFormState[K]) => void;
}

interface InlineCalendarProps {
	selectedDate: string;
	onSelect: (dateValue: string) => void;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
];

function formatDateOnlyLocal(date: Date): string {
	const year = date.getFullYear();
	const month = `${date.getMonth() + 1}`.padStart(2, '0');
	const day = `${date.getDate()}`.padStart(2, '0');

	return `${year}-${month}-${day}`;
}

function parseLocalDate(dateValue: string): Date | null {
	const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateValue);

	if (!dateOnlyMatch) {
		return null;
	}

	return new Date(
		Number.parseInt(dateOnlyMatch[1], 10),
		Number.parseInt(dateOnlyMatch[2], 10) - 1,
		Number.parseInt(dateOnlyMatch[3], 10),
	);
}

function formatDayMonth(dateValue: string | null): string | null {
	if (!dateValue) {
		return null;
	}

	const date = parseLocalDate(dateValue) ?? new Date(dateValue);

	if (Number.isNaN(date.getTime())) {
		return null;
	}

	const day = `${date.getDate()}`.padStart(2, '0');
	const month = `${date.getMonth() + 1}`.padStart(2, '0');
	return `${day}/${month}`;
}

function InlineCalendar({ selectedDate, onSelect }: InlineCalendarProps) {
	const selectedDateObject = parseLocalDate(selectedDate) ?? new Date();
	const todayValue = formatDateOnlyLocal(new Date());
	const [visibleMonth, setVisibleMonth] = useState<number>(selectedDateObject.getMonth());
	const [visibleYear, setVisibleYear] = useState<number>(selectedDateObject.getFullYear());
	const yearOptions = useMemo(() => {
		const currentYear = new Date().getFullYear();
		return Array.from({ length: 15 }, (_, index) => currentYear - 7 + index);
	}, []);

	const calendarDays = useMemo(() => {
		const firstDayOfMonth = new Date(visibleYear, visibleMonth, 1);
		const firstWeekDay = firstDayOfMonth.getDay();
		const daysInMonth = new Date(visibleYear, visibleMonth + 1, 0).getDate();
		const daysInPreviousMonth = new Date(visibleYear, visibleMonth, 0).getDate();
		const cells: Array<{
			dateValue: string;
			dayLabel: number;
			isCurrentMonth: boolean;
		}> = [];

		for (let offset = firstWeekDay - 1; offset >= 0; offset -= 1) {
			const previousMonthDate = new Date(visibleYear, visibleMonth - 1, daysInPreviousMonth - offset);
			cells.push({
				dateValue: formatDateOnlyLocal(previousMonthDate),
				dayLabel: previousMonthDate.getDate(),
				isCurrentMonth: false,
			});
		}

		for (let day = 1; day <= daysInMonth; day += 1) {
			cells.push({
				dateValue: formatDateOnlyLocal(new Date(visibleYear, visibleMonth, day)),
				dayLabel: day,
				isCurrentMonth: true,
			});
		}

		const trailingCells = Math.ceil(cells.length / 7) * 7 - cells.length;

		for (let day = 1; day <= trailingCells; day += 1) {
			const nextMonthDate = new Date(visibleYear, visibleMonth + 1, day);
			cells.push({
				dateValue: formatDateOnlyLocal(nextMonthDate),
				dayLabel: day,
				isCurrentMonth: false,
			});
		}

		return cells;
	}, [visibleMonth, visibleYear]);

	return (
		<div class="inline-calendar" role="dialog" aria-label="Calendar">
			<div class="inline-calendar-header">
				<button
					type="button"
					class="inline-calendar-nav"
					aria-label="Previous month"
					onClick={() => {
						if (visibleMonth === 0) {
							setVisibleMonth(11);
							setVisibleYear((currentYear) => currentYear - 1);
							return;
						}

						setVisibleMonth((currentMonth) => currentMonth - 1);
					}}
				>
					<span aria-hidden="true">‹</span>
				</button>

				<div class="inline-calendar-title">
					<label class="visually-hidden" for="calendar-month-select">
						Select month
					</label>
					<select
						id="calendar-month-select"
						class="inline-calendar-select"
						value={String(visibleMonth)}
						onInput={(event) => setVisibleMonth(Number.parseInt(event.currentTarget.value, 10))}
					>
						{MONTH_LABELS.map((monthLabel, monthIndex) => (
							<option key={monthLabel} value={monthIndex}>
								{monthLabel}
							</option>
						))}
					</select>

					<label class="visually-hidden" for="calendar-year-select">
						Select year
					</label>
					<select
						id="calendar-year-select"
						class="inline-calendar-select inline-calendar-select-year"
						value={String(visibleYear)}
						onInput={(event) => setVisibleYear(Number.parseInt(event.currentTarget.value, 10))}
					>
						{yearOptions.map((yearOption) => (
							<option key={yearOption} value={yearOption}>
								{yearOption}
							</option>
						))}
					</select>
				</div>

				<button
					type="button"
					class="inline-calendar-nav"
					aria-label="Next month"
					onClick={() => {
						if (visibleMonth === 11) {
							setVisibleMonth(0);
							setVisibleYear((currentYear) => currentYear + 1);
							return;
						}

						setVisibleMonth((currentMonth) => currentMonth + 1);
					}}
				>
					<span aria-hidden="true">›</span>
				</button>
			</div>

			<div class="inline-calendar-weekdays" aria-hidden="true">
				{WEEKDAY_LABELS.map((weekday) => (
					<span class="inline-calendar-weekday" key={weekday}>
						{weekday}
					</span>
				))}
			</div>

			<div class="inline-calendar-grid">
				{calendarDays.map((calendarDay) => {
					const isSelected = calendarDay.dateValue === selectedDate;
					const isToday = calendarDay.dateValue === todayValue;

					return (
						<button
							type="button"
							key={calendarDay.dateValue}
							class={`inline-calendar-day ${calendarDay.isCurrentMonth ? '' : 'is-outside'} ${isSelected ? 'is-selected' : ''} ${isToday ? 'is-today' : ''}`}
							onClick={() => onSelect(calendarDay.dateValue)}
						>
							{calendarDay.dayLabel}
						</button>
					);
				})}
			</div>
		</div>
	);
}

export function TransactionFormModal({
	formState,
	isSubmitting,
	submitError,
	accounts,
	categories,
	lastUsedTransactionDate,
	onClose,
	onSubmit,
	onFieldChange,
}: TransactionFormModalProps) {
	const [isCategoryLibraryOpen, setIsCategoryLibraryOpen] = useState<boolean>(false);
	const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
	const selectedCategory = categories.find((category) => category.id === formState.categoryId) ?? null;
	const orderedCategories = selectedCategory
		? [selectedCategory, ...categories.filter((category) => category.id !== selectedCategory.id)]
		: categories;
	const visibleCategories = isCategoryLibraryOpen ? orderedCategories : orderedCategories.slice(0, 8);
	const todayDateValue = formatDateOnlyLocal(new Date());
	const todayDateLabel = formatDayMonth(todayDateValue);
	const yesterdayDate = new Date();
	yesterdayDate.setDate(yesterdayDate.getDate() - 1);
	const yesterdayDateValue = formatDateOnlyLocal(yesterdayDate);
	const yesterdayDateLabel = formatDayMonth(yesterdayDateValue);
	const lastUsedDateLabel = formatDayMonth(lastUsedTransactionDate);
	const selectedDateLabel = formatDayMonth(formState.transactionDate);
	const isTodaySelected = formState.transactionDate === todayDateValue;
	const isYesterdaySelected = formState.transactionDate === yesterdayDateValue;
	const isLastUsedSelected = Boolean(lastUsedTransactionDate) && formState.transactionDate === lastUsedTransactionDate;
	const isCustomDateSelected =
		Boolean(formState.transactionDate) &&
		!isTodaySelected &&
		!isYesterdaySelected &&
		!isLastUsedSelected;

	const applyDateShortcut = (shortcut: 'today' | 'yesterday' | 'last-used') => {
		if (shortcut === 'last-used') {
			if (!lastUsedTransactionDate) {
				return;
			}

			onFieldChange('transactionDate', lastUsedTransactionDate);
			setIsCalendarOpen(false);
			return;
		}

		const baseDate = new Date();

		if (shortcut === 'yesterday') {
			baseDate.setDate(baseDate.getDate() - 1);
		}

		onFieldChange('transactionDate', formatDateOnlyLocal(baseDate));
		setIsCalendarOpen(false);
	};

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

					<div class="field field-group">
						<div class="field-header-row">
							<span>Category</span>
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

						<div class="category-picker-grid" role="list" aria-label="Quick categories">
							{visibleCategories.map((category) => (
								<button
									key={category.id}
									type="button"
									class={`category-picker-button ${formState.categoryId === category.id ? 'is-active' : ''}`}
									onClick={() => {
										onFieldChange('categoryId', category.id);
										setIsCategoryLibraryOpen(false);
									}}
								>
									<span class="account-icon-wrap category-picker-icon" aria-hidden="true">
										{category.icon?.url ? (
											<img src={category.icon.url} alt="" class="account-icon" loading="lazy" />
										) : (
											<span class="account-icon-fallback">
												{category.name.slice(0, 1).toUpperCase()}
											</span>
										)}
									</span>
									<span class="category-picker-label">{category.name}</span>
								</button>
							))}
						</div>

						<div class="category-picker-footer">
							{categories.length > 8 ? (
								<button
									type="button"
									class="ghost-button category-picker-more"
									onClick={() => setIsCategoryLibraryOpen((currentState) => !currentState)}
								>
									{isCategoryLibraryOpen ? 'See less' : 'See all categories'}
								</button>
							) : null}
						</div>
					</div>

					<div class="field field-group">
						<div class="field-header-row">
							<span>Date</span>
							<button
								type="button"
								class={`calendar-trigger-button ${isCalendarOpen ? 'is-active' : ''}`}
								aria-label="Open calendar"
								onClick={() => setIsCalendarOpen((currentState) => !currentState)}
							>
								<svg viewBox="0 0 24 24" aria-hidden="true" class="calendar-trigger-icon">
									<path
										d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v11a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm13 8H4v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8ZM5 6a1 1 0 0 0-1 1v1h16V7a1 1 0 0 0-1-1H5Z"
										fill="currentColor"
									/>
								</svg>
							</button>
						</div>

						<div class="date-shortcuts" role="group" aria-label="Date shortcuts">
							<button
								type="button"
								class={`date-shortcut-button ${isTodaySelected ? 'is-active' : ''}`}
								onClick={() => applyDateShortcut('today')}
							>
								<span class="date-shortcut-label">Today</span>
								<span class="date-shortcut-value">{todayDateLabel}</span>
							</button>
							<button
								type="button"
								class={`date-shortcut-button ${(isYesterdaySelected || isCustomDateSelected) ? 'is-active' : ''}`}
								onClick={() => {
									if (isCustomDateSelected) {
										setIsCalendarOpen(true);
										return;
									}

									applyDateShortcut('yesterday');
								}}
							>
								<span class="date-shortcut-label">{isCustomDateSelected ? 'Selected' : 'Yesterday'}</span>
								<span class="date-shortcut-value">
									{isCustomDateSelected ? selectedDateLabel ?? '--/--' : yesterdayDateLabel}
								</span>
							</button>
							<button
								type="button"
								class={`date-shortcut-button ${isLastUsedSelected ? 'is-active' : ''}`}
								onClick={() => applyDateShortcut('last-used')}
								disabled={!lastUsedTransactionDate}
							>
								<span class="date-shortcut-label">Last used</span>
								<span class="date-shortcut-value">{lastUsedDateLabel ?? '--/--'}</span>
							</button>
						</div>

						{isCalendarOpen ? (
							<div class="calendar-panel">
								<InlineCalendar
									selectedDate={formState.transactionDate}
									onSelect={(dateValue) => {
										onFieldChange('transactionDate', dateValue);
										setIsCalendarOpen(false);
									}}
								/>
							</div>
						) : null}
					</div>

					<label class="field">
						<span>Description (optional)</span>
						<input
							type="text"
							name="description"
							value={formState.description}
							onInput={(event) => onFieldChange('description', event.currentTarget.value)}
							placeholder="Weekly groceries"
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
