import { useEffect, useRef, useState } from 'preact/hooks';
import { currencyFormatter, parseCurrencyValue } from '../lib/currency';

interface AnimatedAmountProps {
	value: string;
	className?: string;
	autoSize?: boolean;
}

const ANIMATION_DURATION_MS = 220;

function formatAnimatedCurrency(value: number, template: string): string {
	const formattedValue = currencyFormatter.format(value);

	if (template.trim().startsWith('+') && value > 0) {
		return `+${formattedValue}`;
	}

	return formattedValue;
}

export function AnimatedAmount({
	value,
	className,
	autoSize,
}: AnimatedAmountProps) {
	const targetValue = parseCurrencyValue(value);
	const animationFrameRef = useRef<number | null>(null);
	const previousValueRef = useRef<number>(targetValue);
	const hasMountedRef = useRef<boolean>(false);
	const [displayValue, setDisplayValue] = useState<string>(value);
	const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

	useEffect(() => {
		if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
			return;
		}

		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
		const updatePreference = () => {
			setPrefersReducedMotion(mediaQuery.matches);
		};

		updatePreference();
		mediaQuery.addEventListener('change', updatePreference);

		return () => {
			mediaQuery.removeEventListener('change', updatePreference);
		};
	}, []);

	useEffect(() => {
		const startingValue = previousValueRef.current;

		if (!hasMountedRef.current) {
			hasMountedRef.current = true;
			previousValueRef.current = targetValue;
			setDisplayValue(value);
			return;
		}

		if (prefersReducedMotion || Math.abs(targetValue - startingValue) < 0.005) {
			previousValueRef.current = targetValue;
			setDisplayValue(value);
			return;
		}

		const startTime = performance.now();

		if (animationFrameRef.current !== null) {
			cancelAnimationFrame(animationFrameRef.current);
		}

		const tick = (now: number) => {
			const progress = Math.min((now - startTime) / ANIMATION_DURATION_MS, 1);
			const easedProgress = 1 - Math.pow(1 - progress, 3);
			const currentValue = startingValue + (targetValue - startingValue) * easedProgress;

			setDisplayValue(formatAnimatedCurrency(currentValue, value));

			if (progress < 1) {
				animationFrameRef.current = requestAnimationFrame(tick);
				return;
			}

			previousValueRef.current = targetValue;
			setDisplayValue(value);
			animationFrameRef.current = null;
		};

		animationFrameRef.current = requestAnimationFrame(tick);

		return () => {
			if (animationFrameRef.current !== null) {
				cancelAnimationFrame(animationFrameRef.current);
				animationFrameRef.current = null;
			}
		};
	}, [prefersReducedMotion, targetValue, value]);

	return (
		<span
			className={className ? `animated-amount ${className}` : 'animated-amount'}
			style={autoSize ? { display: 'inline-flex', width: 'fit-content' } : undefined}
			aria-label={value}
		>
			{displayValue}
		</span>
	);
}
