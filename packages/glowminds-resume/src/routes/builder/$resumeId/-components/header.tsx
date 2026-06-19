import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import {
	CaretDownIcon,
	CopySimpleIcon,
	HouseSimpleIcon,
	LockSimpleIcon,
	LockSimpleOpenIcon,
	PencilSimpleLineIcon,
	SidebarSimpleIcon,
	SparkleIcon,
	TrashSimpleIcon,
} from "@phosphor-icons/react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/lib/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/lib/ui/components/dropdown-menu";
import { useCurrentResume, usePatchResume, useResumeStore } from "@/features/resume/builder/draft";
import {
	applyGlowmindsSampleToResume,
	deleteLocalResume,
	duplicateLocalResume,
	notifyResumeLimit,
	ResumeLimitError,
	setLocalResumeLocked,
	updateLocalResumeMetadata,
} from "@/features/resume/builder/local-storage";
import { useConfirm } from "@/hooks/use-confirm";
import { useBuilderSidebar } from "../-store/sidebar";

export function BuilderHeader() {
	const resume = useCurrentResume();
	const name = resume.name;
	const isLocked = resume.isLocked;
	const toggleSidebar = useBuilderSidebar((state) => state.toggleSidebar);

	return (
		<div className="absolute inset-x-0 top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b bg-popover px-1.5">
			<Button size="icon" variant="ghost" onClick={() => toggleSidebar("left")}>
				<SidebarSimpleIcon />
				<span className="sr-only">
					<Trans comment="Screen-reader label for opening or closing the left sidebar in resume builder">
						Toggle left sidebar
					</Trans>
				</span>
			</Button>

			<div className="flex items-center gap-x-1">
				<Button
					size="icon"
					variant="ghost"
					aria-label={t({
						comment: "Accessible label for button navigating from builder to resumes dashboard",
						message: "Go to resumes dashboard",
					})}
					nativeButton={false}
					render={
						<Link to="/local">
							<HouseSimpleIcon />
						</Link>
					}
				/>
				<span className="me-2.5 text-muted-foreground">/</span>
				<h2 className="flex-1 truncate font-medium">{name}</h2>
				{isLocked && <LockSimpleIcon className="ms-2 text-muted-foreground" />}
				<BuilderHeaderDropdown />
			</div>

			<Button size="icon" variant="ghost" onClick={() => toggleSidebar("right")}>
				<SidebarSimpleIcon className="-scale-x-100" />
				<span className="sr-only">
					<Trans comment="Screen-reader label for opening or closing the right sidebar in resume builder">
						Toggle right sidebar
					</Trans>
				</span>
			</Button>
		</div>
	);
}

function BuilderHeaderDropdown() {
	const confirm = useConfirm();
	const navigate = useNavigate();

	const resume = useCurrentResume();
	const patchResume = usePatchResume();
	const replaceResumeDraft = useResumeStore((state) => state.replaceResumeDraft);
	const id = resume.id;
	const name = resume.name;
	const isLocked = resume.isLocked;

	const handleUpdate = () => {
		const nextName = window.prompt(t`Resume name`, name);
		if (!nextName?.trim()) return;

		try {
			const updated = updateLocalResumeMetadata(id, { name: nextName.trim() });
			patchResume((draft) => {
				draft.name = updated.name;
				draft.slug = updated.slug;
			});
			toast.success(t`Resume updated successfully.`);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : t`Failed to update resume.`);
		}
	};

	const handleLoadSample = async () => {
		const confirmation = await confirm(t`Load sample data into this resume?`, {
			description: t`This replaces all sections with the Glowminds sample profile. You can undo only if you have not saved other changes.`,
		});

		if (!confirmation) return;

		try {
			const updated = applyGlowmindsSampleToResume(id);
			replaceResumeDraft(updated);
			toast.success(t`Sample data loaded successfully.`);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : t`Failed to load sample data.`);
		}
	};

	const handleDuplicate = () => {
		void (async () => {
			try {
				const duplicate = await duplicateLocalResume(id);
				toast.success(t`Resume duplicated successfully.`);
				void navigate({ to: "/builder/$resumeId", params: { resumeId: duplicate.id } });
			} catch (error) {
				if (error instanceof ResumeLimitError) {
					toast.error(error.message);
					notifyResumeLimit();
					return;
				}
				toast.error(error instanceof Error ? error.message : t`Failed to duplicate resume.`);
			}
		})();
	};

	const handleToggleLock = async () => {
		if (!isLocked) {
			const confirmation = await confirm(t`Are you sure you want to lock this resume?`, {
				description: t`When locked, the resume cannot be updated or deleted.`,
			});

			if (!confirmation) return;
		}

		try {
			const updated = setLocalResumeLocked(id, !isLocked);
			patchResume((draft) => {
				draft.isLocked = updated.isLocked;
			});
		} catch (error) {
			toast.error(error instanceof Error ? error.message : t`Failed to update lock state.`);
		}
	};

	const handleDelete = async () => {
		const confirmation = await confirm(t`Are you sure you want to delete this resume?`, {
			description: t`This action cannot be undone.`,
		});

		if (!confirmation) return;

		deleteLocalResume(id);
		toast.success(t`Your resume has been deleted successfully.`);
		void navigate({ to: "/local", replace: true });
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button size="icon" variant="ghost">
						<CaretDownIcon />
					</Button>
				}
			/>

			<DropdownMenuContent>
				<DropdownMenuItem disabled={isLocked} onClick={handleUpdate}>
					<PencilSimpleLineIcon className="me-2" />
					<Trans>Update</Trans>
				</DropdownMenuItem>

				<DropdownMenuItem onClick={handleDuplicate}>
					<CopySimpleIcon className="me-2" />
					<Trans>Duplicate</Trans>
				</DropdownMenuItem>

				<DropdownMenuItem disabled={isLocked} onClick={handleLoadSample}>
					<SparkleIcon className="me-2" />
					<Trans>Load sample data</Trans>
				</DropdownMenuItem>

				<DropdownMenuItem onClick={handleToggleLock}>
					{isLocked ? <LockSimpleOpenIcon className="me-2" /> : <LockSimpleIcon className="me-2" />}
					{isLocked ? <Trans>Unlock</Trans> : <Trans>Lock</Trans>}
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				<DropdownMenuItem variant="destructive" disabled={isLocked} onClick={handleDelete}>
					<TrashSimpleIcon className="me-2" />
					<Trans>Delete</Trans>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
