import type { DialogSchema } from "./schemas";
import { resumeDialogRendererRegistry } from "./resume/registry";

const dialogRendererByType = new Map(
	resumeDialogRendererRegistry.renderers.map((renderer) => [renderer.type, renderer] as const),
);

export const renderDialog = (dialog: DialogSchema | null) => {
	if (!dialog) return null;

	const renderer = dialogRendererByType.get(dialog.type);
	if (renderer) return renderer.render(dialog as never);

	return null;
};
