interface AppHeaderProps {
	activeTab: 'home' | 'accounts' | 'categories';
	onSignOut: () => void;
}

export function AppHeader({ activeTab, onSignOut }: AppHeaderProps) {
	return (
		<header class="app-header">
			<div class="app-brand">
			</div>

			<nav class="app-tabs" aria-label="Primary">
				<a
					href="/home"
					class={`app-tab ${activeTab === 'home' ? 'is-active' : ''}`}
					aria-current={activeTab === 'home' ? 'page' : undefined}
				>
					Home
				</a>
				<a
					href="/accounts"
					class={`app-tab ${activeTab === 'accounts' ? 'is-active' : ''}`}
					aria-current={activeTab === 'accounts' ? 'page' : undefined}
				>
					Accounts
				</a>
				<a
					href="/categories"
					class={`app-tab ${activeTab === 'categories' ? 'is-active' : ''}`}
					aria-current={activeTab === 'categories' ? 'page' : undefined}
				>
					Categories
				</a>
			</nav>

			<button type="button" class="ghost-button" onClick={onSignOut}>
				Sign out
			</button>
		</header>
	);
}
