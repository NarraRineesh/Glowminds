import type { Template } from "@/lib/schema/templates";
import type { DialogProps } from "@/dialogs/store";
import type { TemplateMetadata } from "./data";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { SlideshowIcon } from "@phosphor-icons/react";
import { Badge } from "@/lib/ui/components/badge";
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/lib/ui/components/dialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/lib/ui/components/hover-card";
import { ScrollArea } from "@/lib/ui/components/scroll-area";
import { cn } from "@/lib/utils/style";
import { CometCard } from "@/components/animation/comet-card";
import { useDialogStore } from "@/dialogs/store";
import { isEmbedded } from "@/embed/runtime";
import { useCurrentResume, useUpdateResumeData } from "@/features/resume/builder/draft";
import { templates } from "./data";

export function TemplateGalleryDialog(_: DialogProps<"resume.template.gallery">) {
	const closeDialog = useDialogStore((state) => state.closeDialog);
	const resume = useCurrentResume();
	const selectedTemplate = resume.data.metadata.template;
	const updateResumeData = useUpdateResumeData();

	function onSelectTemplate(template: Template) {
		updateResumeData((draft) => {
			draft.metadata.template = template;
		});

		closeDialog();
	}

	return (
		<DialogContent className="lg:max-w-5xl">
			<DialogHeader className="gap-2">
				<DialogTitle className="flex items-center gap-3 text-xl">
					<SlideshowIcon size={20} />
					<Trans>Template Gallery</Trans>
				</DialogTitle>
				<DialogDescription className="leading-relaxed">
					<Trans>
						Here's a range of resume templates for different professions and personalities. Whether you prefer modern or
						classic, bold or simple, there is a design to match you. Look through the options below and choose a
						template that fits your style.
					</Trans>
				</DialogDescription>
			</DialogHeader>

			<ScrollArea className="max-h-[min(80svh,calc(100dvh-12rem))] overflow-hidden pb-8">
				<div className="grid grid-cols-2 gap-4 p-4 md:grid-cols-3 lg:grid-cols-4">
					{Object.entries(templates).map(([template, metadata]) => (
						<TemplateCard
							key={template}
							metadata={metadata}
							id={template as Template}
							isActive={template === selectedTemplate}
							onSelect={onSelectTemplate}
						/>
					))}
				</div>
			</ScrollArea>
		</DialogContent>
	);
}

type TemplateCardProps = {
	id: Template;
	isActive?: boolean;
	metadata: TemplateMetadata;
	onSelect: (template: Template) => void;
};

function TemplateCard({ id, metadata, isActive, onSelect }: TemplateCardProps) {
	const { i18n } = useLingui();
	const embedded = isEmbedded();

	const previewButton = (
		<button
			type="button"
			tabIndex={-1}
			onClick={() => onSelect(id)}
			className={cn(
				"relative block aspect-page w-full cursor-pointer overflow-hidden rounded-md bg-popover outline-none",
				isActive && "ring-2 ring-ring ring-offset-2 ring-offset-background",
			)}
		>
			<img src={metadata.imageUrl} alt={metadata.name} className="size-full object-cover object-top" loading="lazy" />
		</button>
	);

	if (embedded) {
		return (
			<div className="flex min-w-0 flex-col gap-2 overflow-hidden">
				{previewButton}
				<span className="truncate text-center font-bold leading-tight tracking-tight">{metadata.name}</span>
			</div>
		);
	}

	return (
		<HoverCard>
			<div className="flex min-w-0 flex-col gap-2 overflow-hidden">
				<CometCard translateDepth={3} rotateDepth={6} glareOpacity={0} className="overflow-hidden">
					<HoverCardTrigger render={previewButton} nativeButton={false} />
				</CometCard>

				<span className="truncate text-center font-bold leading-tight tracking-tight">{metadata.name}</span>

				<HoverCardContent
					side="top"
					align="center"
					className="pointer-events-none flex w-72 flex-col justify-between gap-y-4 rounded-md bg-background/95 p-4"
				>
					<div className="space-y-1">
						<h3 className="font-semibold text-lg">{metadata.name}</h3>
						<p className="text-muted-foreground text-sm">{i18n.t(metadata.description)}</p>
					</div>

					{metadata.tags.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{metadata.tags
								.sort((a, b) => a.localeCompare(b))
								.map((tag) => (
									<Badge key={tag} variant="default">
										{tag}
									</Badge>
								))}
						</div>
					)}
				</HoverCardContent>
			</div>
		</HoverCard>
	);
}
