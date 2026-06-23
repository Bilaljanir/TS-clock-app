import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import "../styles.css";

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	const linkClass = "text-gray-600 hover:text-gray-900";
	const activeProps = { className: "font-semibold text-gray-900" };

	return (
		<>
			<header className="border-b border-gray-200 bg-white">
				<nav className="mx-auto flex max-w-5xl items-center gap-6 px-8 py-4">
					<span className="font-bold">Clock App</span>
					<Link
						to="/"
						className={linkClass}
						activeOptions={{ exact: true }}
						activeProps={activeProps}
					>
						Accueil
					</Link>
					<Link
						to="/entries"
						search={{ page: 1, pageSize: 20 }}
						className={linkClass}
						activeProps={activeProps}
					>
						Entrées
					</Link>
					<Link to="/projects" className={linkClass} activeProps={activeProps}>
						Projets
					</Link>
					<Link to="/labels" className={linkClass} activeProps={activeProps}>
						Labels
					</Link>
				</nav>
			</header>

			<main className="mx-auto max-w-5xl">
				<Outlet />
			</main>

			<TanStackDevtools
				config={{ position: "bottom-right" }}
				plugins={[
					{
						name: "TanStack Router",
						render: <TanStackRouterDevtoolsPanel />,
					},
				]}
			/>
		</>
	);
}
