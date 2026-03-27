interface LoadingOverlayProps {
	label?: string;
}

export function LoadingOverlay({ label = 'Loading' }: LoadingOverlayProps) {
	return (
		<div class="loading-overlay" role="status" aria-live="polite" aria-label={label}>
			<div class="loading-spinner" aria-hidden="true" />
		</div>
	);
}
