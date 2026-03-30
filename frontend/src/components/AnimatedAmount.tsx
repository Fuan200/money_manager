interface AnimatedAmountProps {
	value: string;
	className?: string;
	autoSize?: boolean;
}

export function AnimatedAmount({
	value,
	className,
	autoSize,
}: AnimatedAmountProps) {
	return (
		<span
			className={className ? `animated-amount ${className}` : 'animated-amount'}
			style={autoSize ? { display: 'inline-flex', width: 'fit-content' } : undefined}
			aria-label={value}
		>
			{value}
		</span>
	);
}
