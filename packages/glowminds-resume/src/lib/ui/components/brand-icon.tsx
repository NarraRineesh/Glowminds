import { publicAsset } from "@/libs/public-asset";
import { cn } from "@/lib/utils/style";

type Props = React.ComponentProps<"img"> & {
	variant?: "logo" | "icon";
};

const ASSETS = {
	logo: {
		light: "/logo-light.png",
		dark: "/logo-dark.png",
	},
	icon: {
		light: "/favicon/favicon-96x96.png",
		dark: "/favicon/favicon-96x96.png",
	},
} as const;

export function BrandIcon({ variant = "logo", className, ...props }: Props) {
	const assets = ASSETS[variant];

	return (
		<>
			<img
				src={publicAsset(assets.dark)}
				alt="Glowminds"
				className={cn("hidden object-contain dark:block", className)}
				{...props}
			/>
			<img
				src={publicAsset(assets.light)}
				alt="Glowminds"
				className={cn("block object-contain dark:hidden", className)}
				{...props}
			/>
		</>
	);
}
