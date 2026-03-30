interface TotalBalanceCardProps {
	totalBalance: string;
	label?: string;
}

export function TotalBalanceCard({
	totalBalance,
	label = 'Total balance',
}: TotalBalanceCardProps) {
	return (
		<section class="summary-card home-total-card" aria-label={label}>
			<div>
				<p class="panel-label">{label}</p>
				<h1>{totalBalance}</h1>
			</div>
		</section>
	);
}
