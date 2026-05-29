import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/local")({
	component: () => <Outlet />,
});
