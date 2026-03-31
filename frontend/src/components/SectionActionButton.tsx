import type { JSX } from 'preact';

interface SectionActionButtonProps {
	label: string;
	onClick: (event: JSX.TargetedMouseEvent<HTMLButtonElement>) => void;
}

export function SectionActionButton({ label, onClick }: SectionActionButtonProps) {
	return (
		<button type="button" class="primary-button section-action-button" onClick={onClick}>
			{label}
		</button>
	);
}
