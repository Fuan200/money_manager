import type { ComponentChildren } from 'preact';
import { currencyFormatter } from '../lib/currency';

export interface CategoryExpenseShare {
	id: string;
	name: string;
	amount: number;
	percentage: number;
}

interface CategoryExpenseChartProps {
	items: CategoryExpenseShare[];
	title: string;
	totalLabel: string;
	emptyMessage: string;
	controls?: ComponentChildren;
}

const segmentToneClasses = [
	'expense-breakdown-tone-1',
	'expense-breakdown-tone-2',
	'expense-breakdown-tone-3',
	'expense-breakdown-tone-4',
	'expense-breakdown-tone-5',
	'expense-breakdown-tone-6',
];

export function CategoryExpenseChart({
	items,
	title,
	totalLabel,
	emptyMessage,
	controls,
}: CategoryExpenseChartProps) {
	const totalExpense = items.reduce((sum, item) => sum + item.amount, 0);
	const radius = 42;
	const circumference = 2 * Math.PI * radius;
	let currentOffset = 0;

	return (
		<section class="summary-card expense-breakdown-card" aria-label="Expense breakdown by category">
			{controls ? <div class="expense-breakdown-controls">{controls}</div> : null}

			{items.length > 0 ? (
				<div class="expense-breakdown-content">
					<div class="expense-breakdown-visual">
						<h2>{title}</h2>
						<div class="expense-breakdown-chart-shell">
							<svg class="expense-breakdown-donut" viewBox="0 0 120 120" aria-hidden="true">
								<circle class="expense-breakdown-ring-shadow" cx="60" cy="60" r={radius} />
								<circle class="expense-breakdown-ring-track" cx="60" cy="60" r={radius} />

								{items.map((item, index) => {
									const segmentLength = (item.percentage / 100) * circumference;
									const dashArray = `${segmentLength} ${circumference - segmentLength}`;
									const dashOffset = -currentOffset;
									currentOffset += segmentLength;

									return (
										<circle
											key={item.id}
											class={`expense-breakdown-segment ${segmentToneClasses[index % segmentToneClasses.length]}`}
											cx="60"
											cy="60"
											r={radius}
											stroke-dasharray={dashArray}
											stroke-dashoffset={dashOffset}
										/>
									);
								})}

								<circle class="expense-breakdown-ring-core" cx="60" cy="60" r="29" />
								<circle class="expense-breakdown-ring-inner" cx="60" cy="60" r="33" />
							</svg>

							<div class="expense-breakdown-total">
								<p>{totalLabel}</p>
								<strong>{currencyFormatter.format(totalExpense)}</strong>
							</div>
						</div>
					</div>

					<div class="expense-breakdown-list">
						{items.map((item, index) => (
							<div class="expense-breakdown-row" key={item.id}>
								<div class="expense-breakdown-copy">
									<div class="expense-breakdown-title">
										<span
											class={`expense-breakdown-marker ${segmentToneClasses[index % segmentToneClasses.length]}`}
											aria-hidden="true"
										/>
										<h3>{item.name}</h3>
									</div>
								</div>
								<div class="expense-breakdown-metrics">
									<p>{item.percentage.toFixed(1)}%</p>
									<strong>{currencyFormatter.format(item.amount)}</strong>
								</div>
							</div>
						))}
					</div>
				</div>
			) : (
				<div class="item-row-card expense-breakdown-empty">
					<p class="panel-copy">{emptyMessage}</p>
				</div>
			)}
		</section>
	);
}
