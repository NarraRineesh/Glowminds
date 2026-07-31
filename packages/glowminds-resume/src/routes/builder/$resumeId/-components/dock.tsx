import type { Icon } from "@phosphor-icons/react";
import type { BuilderPreviewPageLayout } from "./page-layout";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import {
	AlignCenterHorizontalIcon,
	AlignTopIcon,
	ArrowsClockwiseIcon,
	CircleNotchIcon,
	CubeFocusIcon,
	ExportIcon,
	FileDocIcon,
	FileJsIcon,
	FilePdfIcon,
	MagnifyingGlassMinusIcon,
	MagnifyingGlassPlusIcon,
} from "@phosphor-icons/react";
import { m } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { useControls } from "react-zoom-pan-pinch";
import { toast } from "sonner";
import { buildDocx } from "@/lib/docx";
import { Button } from "@/lib/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/lib/ui/components/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/lib/ui/components/tooltip";
import { downloadWithAnchor, generateFilename } from "@/lib/utils/file";
import { cn } from "@/lib/utils/style";
import { resumeDataSchema } from "@/lib/schema/resume/data";
import { useCurrentResume, useResumeStore } from "@/features/resume/builder/draft";
import { applyProfileDataToResume } from "@/features/resume/builder/local-storage";
import { createResumePdfBlob } from "@/features/resume/export/pdf-document";
import { getEmbedConfig } from "@/embed/runtime";
import { useConfirm } from "@/hooks/use-confirm";
import { useIsMobile } from "@/hooks/use-mobile";
import { fitPreviewToScreen } from "./fit-to-screen";

type BuilderDockProps = {
	pageLayout: BuilderPreviewPageLayout;
	onTogglePageLayout: () => void;
};

export function BuilderDock({ pageLayout, onTogglePageLayout }: BuilderDockProps) {
	const resume = useCurrentResume();
	const replaceResumeDraft = useResumeStore((state) => state.replaceResumeDraft);
	const isMobile = useIsMobile();
	const confirm = useConfirm();
	const controls = useControls();
	const { zoomIn, zoomOut, centerView } = controls;
	const controlsRef = useRef(controls);
	controlsRef.current = controls;
	const [isPrinting, setIsPrinting] = useState(false);
	const [isSyncing, setIsSyncing] = useState(false);
	const fitToScreen = useCallback(() => {
		fitPreviewToScreen(controlsRef.current, isMobile ? 0.94 : 0.9, 200);
	}, [isMobile]);

	const onDownloadJSON = useCallback(async () => {
		const filename = generateFilename(resume.name, "json");
		const jsonString = JSON.stringify(resume.data, null, 2);
		const blob = new Blob([jsonString], { type: "application/json" });
		downloadWithAnchor(blob, filename);
	}, [resume]);

	const onDownloadDOCX = useCallback(async () => {
		const filename = generateFilename(resume.name, "docx");

		try {
			const blob = await buildDocx(resume.data);
			downloadWithAnchor(blob, filename);
		} catch {
			toast.error(t`There was a problem while generating the DOCX, please try again.`);
		}
	}, [resume]);

	const onDownloadPDF = useCallback(async () => {
		const filename = generateFilename(resume.name, "pdf");
		const toastId = toast.loading(t`Please wait while your PDF is being generated...`);

		setIsPrinting(true);

		try {
			const blob = await createResumePdfBlob(resume.data);
			downloadWithAnchor(blob, filename);
		} catch {
			toast.error(t`There was a problem while generating the PDF, please try again.`);
		} finally {
			setIsPrinting(false);
			toast.dismiss(toastId);
		}
	}, [resume]);

	const onSyncProfile = useCallback(async () => {
		const hook = getEmbedConfig()?.onSyncFromProfile;
		if (!hook) {
			toast.info(t`Profile sync is available when editing from Glowminds.`);
			return;
		}

		if (resume.isLocked) {
			toast.error(t`Unlock the resume before syncing profile data.`);
			return;
		}

		const confirmation = await confirm(t`Sync this resume from your Glowminds profile?`, {
			description: t`Basics, summary, experience, education, projects, skills, and related sections will be updated. Template and design stay the same.`,
		});
		if (!confirmation) return;

		setIsSyncing(true);
		try {
			const result = await hook();
			if (!result?.data) {
				toast.info(t`Add details in Profile first — then sync here.`);
				return;
			}

			const parsed = resumeDataSchema.parse(result.data);
			const updated = applyProfileDataToResume(resume.id, parsed);
			replaceResumeDraft(updated);
			toast.success(t`Resume filled from your profile.`);
		} catch (error) {
			console.error("Profile sync failed", error);
			toast.error(error instanceof Error ? error.message : t`Failed to sync profile.`);
		} finally {
			setIsSyncing(false);
		}
	}, [confirm, replaceResumeDraft, resume.id, resume.isLocked]);

	if (isMobile) {
		return (
			<div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
				<div className="pointer-events-auto flex w-full max-w-md items-center justify-center gap-0.5 rounded-2xl border border-border/80 bg-popover/95 px-1.5 py-1.5 shadow-xl backdrop-blur-md">
					<DockIcon large icon={MagnifyingGlassPlusIcon} title={t`Zoom in`} onClick={() => zoomIn(0.15)} />
					<DockIcon large icon={MagnifyingGlassMinusIcon} title={t`Zoom out`} onClick={() => zoomOut(0.15)} />
					<DockIcon large icon={CubeFocusIcon} title={t`Fit to screen`} onClick={fitToScreen} />
					<div className="mx-0.5 h-8 w-px shrink-0 bg-border" />
					<DockIcon
						large
						icon={isSyncing ? CircleNotchIcon : ArrowsClockwiseIcon}
						title={t`Sync profile`}
						disabled={isSyncing}
						iconClassName={cn(isSyncing && "animate-spin")}
						onClick={() => void onSyncProfile()}
					/>
					<ExportDockMenu large disabled={isPrinting} onPdf={onDownloadPDF} onDocx={onDownloadDOCX} onJson={onDownloadJSON} />
				</div>
			</div>
		);
	}

	return (
		<div className="absolute inset-x-0 bottom-4 flex items-center justify-center">
			<m.div
				initial={{ opacity: 0, y: -18 }}
				animate={{ opacity: 0.6, y: 0 }}
				whileHover={{ opacity: 1, y: -2, scale: 1.01 }}
				transition={{ duration: 0.2, ease: "easeOut" }}
				className="flex items-center rounded-r-full rounded-l-full bg-popover px-2 shadow-xl will-change-[transform,opacity]"
			>
				<DockIcon icon={MagnifyingGlassPlusIcon} title={t`Zoom in`} onClick={() => zoomIn(0.1)} />
				<DockIcon icon={MagnifyingGlassMinusIcon} title={t`Zoom out`} onClick={() => zoomOut(0.1)} />
				<DockIcon icon={CubeFocusIcon} title={t`Center view`} onClick={() => centerView()} />
				<DockIcon
					icon={pageLayout === "horizontal" ? AlignTopIcon : AlignCenterHorizontalIcon}
					title={t`Toggle page stacking`}
					onClick={onTogglePageLayout}
				/>
				<div className="mx-1 h-8 w-px bg-border" />
				<DockIcon
					icon={isSyncing ? CircleNotchIcon : ArrowsClockwiseIcon}
					title={t`Sync profile`}
					disabled={isSyncing}
					iconClassName={cn(isSyncing && "animate-spin")}
					onClick={() => void onSyncProfile()}
				/>
				<div className="mx-1 h-8 w-px bg-border" />
				<DockIcon icon={FileJsIcon} title={t`Download JSON`} onClick={() => onDownloadJSON()} />
				<DockIcon icon={FileDocIcon} title={t`Download DOCX`} onClick={() => onDownloadDOCX()} />
				<DockIcon
					title={t`Download PDF`}
					disabled={isPrinting}
					onClick={() => onDownloadPDF()}
					icon={isPrinting ? CircleNotchIcon : FilePdfIcon}
					iconClassName={cn(isPrinting && "animate-spin")}
				/>
			</m.div>
		</div>
	);
}

type ExportDockMenuProps = {
	large?: boolean;
	disabled?: boolean;
	onPdf: () => void;
	onDocx: () => void;
	onJson: () => void;
};

function ExportDockMenu({ large, disabled, onPdf, onDocx, onJson }: ExportDockMenuProps) {
	const title = t`Export`;

	return (
		<DropdownMenu>
			<Tooltip>
				<TooltipTrigger
					render={
						<DropdownMenuTrigger
							disabled={disabled}
							render={
								<Button
									size="icon"
									variant="ghost"
									disabled={disabled}
									aria-label={title}
									className={cn(large && "size-11")}
								>
									{disabled ? (
										<CircleNotchIcon className={cn(large ? "size-5" : "size-4", "animate-spin")} />
									) : (
										<ExportIcon className={large ? "size-5" : "size-4"} />
									)}
								</Button>
							}
						/>
					}
				/>
				<TooltipContent side="top" align="center" className="font-medium">
					{title}
				</TooltipContent>
			</Tooltip>
			<DropdownMenuContent side="top" align="end" className="min-w-44">
				<DropdownMenuItem disabled={disabled} onClick={onPdf}>
					<FilePdfIcon className="me-2 size-4" />
					<Trans>Download PDF</Trans>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={onDocx}>
					<FileDocIcon className="me-2 size-4" />
					<Trans>Download DOCX</Trans>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={onJson}>
					<FileJsIcon className="me-2 size-4" />
					<Trans>Download JSON</Trans>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

type DockIconProps = {
	title: string;
	icon: Icon;
	disabled?: boolean;
	onClick: () => void;
	iconClassName?: string;
	large?: boolean;
};

function DockIcon({ icon: Icon, title, disabled, onClick, iconClassName, large }: DockIconProps) {
	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<m.div
						className="will-change-transform"
						whileHover={disabled ? undefined : { y: -1, scale: 1.04 }}
						whileTap={disabled ? undefined : { scale: 0.97 }}
						transition={{ duration: 0.15, ease: "easeOut" }}
					>
						<Button
							size="icon"
							variant="ghost"
							disabled={disabled}
							onClick={onClick}
							aria-label={title}
							className={cn(large && "size-11")}
						>
							<Icon className={cn(large ? "size-5" : "size-4", iconClassName)} />
						</Button>
					</m.div>
				}
			/>

			<TooltipContent side="top" align="center" className="font-medium">
				{title}
			</TooltipContent>
		</Tooltip>
	);
}
