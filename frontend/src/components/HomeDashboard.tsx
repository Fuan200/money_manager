import { useEffect, useState } from 'preact/hooks';
import { clearAuthSession, readAuthSession } from '../lib/auth';

interface SessionState {
	email: string;
}

export function HomeDashboard() {
	const [sessionState, setSessionState] = useState<SessionState | null>(null);

	useEffect(() => {
		const session = readAuthSession();
		if (!session) {
			window.location.replace('/');
			return;
		}

		setSessionState({ email: session.email });
	}, []);

	const handleSignOut = () => {
		clearAuthSession();
		window.location.replace('/');
	};

	if (!sessionState) {
		return (
			<section class="home-shell">
				<div class="summary-card">
					<p class="panel-label">Loading session</p>
					<h1>Preparing your workspace...</h1>
				</div>
			</section>
		);
	}

	return (
		<section class="home-shell">
			<header class="summary-card">
				<div>
					<p class="panel-label">Signed in</p>
					<h1>Welcome, {sessionState.email}</h1>
					<p class="panel-copy">
						Your account is ready. This simple home view is the first screen after a successful
						login and gives you a clean starting point for the rest of the app.
					</p>
				</div>
				<button type="button" class="ghost-button" onClick={handleSignOut}>
					Sign out
				</button>
			</header>

			<div class="panel-grid">
				<article class="info-card">
					<p class="panel-label">Accounts</p>
					<h2>Keep balances visible</h2>
					<p class="panel-copy">
						Use this area to show current account totals and the latest movement for each account.
					</p>
				</article>

				<article class="info-card">
					<p class="panel-label">Budgets</p>
					<h2>Monitor category limits</h2>
					<p class="panel-copy">
						Add monthly budget progress here so the user sees risk areas immediately after login.
					</p>
				</article>

				<article class="info-card">
					<p class="panel-label">Activity</p>
					<h2>Review recent transactions</h2>
					<p class="panel-copy">
						A recent activity feed fits naturally in this section once transaction endpoints are wired.
					</p>
				</article>
			</div>
		</section>
	);
}
