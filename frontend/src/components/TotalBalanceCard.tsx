import { AnimatedAmount } from './AnimatedAmount';

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
				<AnimatedAmount value={totalBalance} className="summary-value" autoSize />
			</div>
		</section>
	);
}
