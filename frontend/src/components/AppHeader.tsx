import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';

interface AppHeaderProps {
	activeTab: 'home' | 'accounts' | 'categories';
	onSignOut: () => void;
	children: ComponentChildren;
}

function HomeIcon() {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path
				d="M4.75 10.25 12 4.5l7.25 5.75v8a1 1 0 0 1-1 1h-4.5v-5h-3.5v5h-4.5a1 1 0 0 1-1-1z"
				fill="none"
				stroke="currentColor"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="1.8"
			/>
		</svg>
	);
}

function AccountsIcon() {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path
				d="M4.75 7.75a2 2 0 0 1 2-2h10.5a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H6.75a2 2 0 0 1-2-2z"
				fill="none"
				stroke="currentColor"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="1.8"
			/>
			<path
				d="M4.75 10h14.5M8 14.25h2.5"
				fill="none"
				stroke="currentColor"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="1.8"
			/>
		</svg>
	);
}

function CategoriesIcon() {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path
				d="M6 6h5.25v5.25H6zm6.75 0H18v5.25h-5.25zM6 12.75h5.25V18H6zm6.75 0H18V18h-5.25z"
				fill="none"
				stroke="currentColor"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="1.8"
			/>
		</svg>
	);
}

function SignOutIcon() {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path
				d="M10 6H6.75a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2H10M13 8.25 17.25 12 13 15.75M8.75 12h8.5"
				fill="none"
				stroke="currentColor"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="1.8"
			/>
		</svg>
	);
}

export function AppHeader({ activeTab, onSignOut, children }: AppHeaderProps) {
	const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

	return (
		<div class={`app-shell ${isCollapsed ? 'is-sidebar-collapsed' : ''}`}>
			<aside class={`app-sidebar ${isCollapsed ? 'is-collapsed' : ''}`} aria-label="Primary">
				<nav class="app-tabs" aria-label="Primary navigation">
					<button
						type="button"
						class={`sidebar-toggle-button ${isCollapsed ? 'is-collapsed' : ''}`}
						onClick={() => setIsCollapsed((currentValue) => !currentValue)}
						aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
						aria-pressed={isCollapsed}
					>
						<span class={`sidebar-toggle-bar ${isCollapsed ? 'is-collapsed' : ''}`} aria-hidden="true" />
					</button>
					<a
						href="/home"
						class={`app-tab ${activeTab === 'home' ? 'is-active' : ''}`}
						aria-current={activeTab === 'home' ? 'page' : undefined}
					>
						<span class="app-tab-icon">
							<HomeIcon />
						</span>
						<span class="app-tab-label">Home</span>
					</a>
					<a
						href="/accounts"
						class={`app-tab ${activeTab === 'accounts' ? 'is-active' : ''}`}
						aria-current={activeTab === 'accounts' ? 'page' : undefined}
					>
						<span class="app-tab-icon">
							<AccountsIcon />
						</span>
						<span class="app-tab-label">Accounts</span>
					</a>
					<a
						href="/categories"
						class={`app-tab ${activeTab === 'categories' ? 'is-active' : ''}`}
						aria-current={activeTab === 'categories' ? 'page' : undefined}
					>
						<span class="app-tab-icon">
							<CategoriesIcon />
						</span>
						<span class="app-tab-label">Categories</span>
					</a>
				</nav>

				<div class="app-sidebar-footer">
					<button type="button" class="ghost-button app-signout-button" onClick={onSignOut}>
						<span class="app-tab-icon">
							<SignOutIcon />
						</span>
						<span class="app-tab-label">Sign out</span>
					</button>
				</div>
			</aside>

			<div class="app-main">
				<div class="app-content">{children}</div>
			</div>
		</div>
	);
}
