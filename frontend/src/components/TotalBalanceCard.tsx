import { AnimatedAmount } from './AnimatedAmount';

interface TotalBalanceCardProps {
	totalBalance: string;
	label?: string;
}

export function 
TotalBalanceCard({
	totalBalance,
	label = 'Total balance',
}: TotalBalanceCardProps) {
	return (
		<section class="summary-card home-total-card" aria-label={label}>
			<div class="total-balance-card-content">
				<h2>{label}</h2>
				<AnimatedAmount value={totalBalance} className="summary-value" autoSize />
			</div>
		</section>
	);
}
