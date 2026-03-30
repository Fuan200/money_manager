export const currencyFormatter = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

export function parseCurrencyValue(value: string | number): number {
	if (typeof value === 'number') {
		return Number.isFinite(value) ? value : 0;
	}

	const normalizedValue = value.trim().replace(/[^0-9+-.]/g, '');
	const parsedValue = Number.parseFloat(normalizedValue);
	return Number.isFinite(parsedValue) ? parsedValue : 0;
}

interface FormatCurrencyOptions {
	multiplier?: 1 | -1;
	positivePrefix?: string;
}

export function formatCurrencyValue(
	value: string | number,
	options?: FormatCurrencyOptions,
): string {
	const multiplier = options?.multiplier ?? 1;
	const amount = parseCurrencyValue(value) * multiplier;
	const formattedValue = currencyFormatter.format(amount);

	if (amount > 0 && options?.positivePrefix) {
		return `${options.positivePrefix}${formattedValue}`;
	}

	return formattedValue;
}
