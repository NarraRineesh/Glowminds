import { lingui, linguiTransformerBabelPreset } from "@lingui/vite-plugin";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	base: process.env.VITE_BASE_PATH ?? "/",

	resolve: {
		tsconfigPaths: true,
	},

	define: {
		__APP_VERSION__: JSON.stringify("1.0.0"),
	},

	build: {
		chunkSizeWarningLimit: 10 * 1024,
	},

	server: {
		host: true,
		strictPort: true,
		port: Number.parseInt(process.env.PORT ?? "3000", 10),
	},

	plugins: [
		tailwindcss(),
		tanstackRouter({
			target: "react",
			semicolons: true,
			quoteStyle: "double",
			autoCodeSplitting: true,
		}),
		viteReact(),
		lingui(),
		babel({ presets: [reactCompilerPreset(), linguiTransformerBabelPreset()] }),
	],
});
