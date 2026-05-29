import { useLingui } from "@lingui/react";
import { SwapIcon } from "@phosphor-icons/react";
import { Badge } from "@/lib/ui/components/badge";
import { Button } from "@/lib/ui/components/button";
import { templates } from "@/dialogs/resume/template/data";
import { useDialogStore } from "@/dialogs/store";
import { useCurrentResume } from "@/features/resume/builder/draft";
import { SectionBase } from "../shared/section-base";

export function TemplateSectionBuilder() {
	return (
		<SectionBase type="template">
			<TemplateSectionForm />
		</SectionBase>
	);
}

function TemplateSectionForm() {
	const { i18n } = useLingui();
	const openDialog = useDialogStore((state) => state.openDialog);
	const resume = useCurrentResume();
	const template = resume.data.metadata.template;

	const metadata = templates[template];

	const onOpenTemplateGallery = () => {
		openDialog("resume.template.gallery", undefined);
	};

	return (
		<div className="flex @md:flex-row flex-col items-stretch gap-x-4 gap-y-2">
			<Button
				variant="ghost"
				onClick={onOpenTemplateGallery}
				className="group/preview relative aspect-page w-40 shrink-0 overflow-hidden p-0"
			>
				<div className="absolute inset-0 overflow-hidden rounded-md opacity-100 transition-opacity group-hover/preview:opacity-60">
					<img src={metadata.imageUrl} alt={metadata.name} className="size-full object-cover object-top" loading="lazy" />
				</div>

				<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<SwapIcon weight="thin" className="size-10 text-foreground/80 opacity-0 transition-opacity group-hover/preview:opacity-100" />
				</div>
			</Button>

			<div className="flex flex-1 flex-col gap-y-4 @md:pt-1 @md:pb-3">
				<div className="space-y-1">
					<h3 className="font-semibold text-2xl capitalize tracking-tight">{metadata.name}</h3>
					<p className="text-muted-foreground text-sm">{i18n.t(metadata.description)}</p>
				</div>

				<div className="flex flex-wrap gap-2.5">
					{metadata.tags.map((tag) => (
						<Badge key={tag} variant="secondary">
							{tag}
						</Badge>
					))}
				</div>
			</div>
		</div>
	);
}
