import type { ResumeData } from "@/lib/schema/resume/data";
import { resumeDataSchema } from "@/lib/schema/resume/data";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import {
	FileArrowUpIcon,
	FileTextIcon,
	PlusIcon,
	SparkleIcon,
	TrashSimpleIcon,
} from "@phosphor-icons/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { defaultResumeData } from "@/lib/schema/resume/default";
import { glowmindsSampleResumeData } from "@/lib/schema/resume/glowminds-sample";
import { BrandIcon } from "@/lib/ui/components/brand-icon";
import { Button } from "@/lib/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui/components/card";
import {
	createLocalResume,
	createLocalResumeFromSample,
	deleteLocalResume,
	importLocalResume,
	listLocalResumes,
	ResumeLimitError,
} from "@/features/resume/builder/local-storage";
import { EMBED_RESUMES_READY_EVENT, listDashboardResumes } from "@/features/resume/builder/copilot-storage";
import { isEmbedded } from "@/embed/runtime";
import { FREE_LIMITS, getEmbedIsPro } from "@/lib/plans";
import { ResumePreview } from "@/features/resume/preview/preview";
import { createNoindexFollowMeta } from "@/libs/seo";
import { cn } from "@/lib/utils/style";

export const Route = createFileRoute("/local/")({
	component: RouteComponent,
	head: () => ({
		meta: [{ title: "Glowminds Resume Builder" }, createNoindexFollowMeta()],
	}),
});

type MiniResumePreviewProps = {
	className?: string;
	data: ResumeData;
};

function MiniResumePreview({ className, data }: MiniResumePreviewProps) {
	return (
		<div
			className={cn(
				"relative overflow-hidden rounded-xl border border-border/70 bg-muted/40",
				"before:pointer-events-none before:absolute before:inset-0 before:z-10 before:bg-gradient-to-b before:from-transparent before:to-background/75",
				className,
			)}
		>
			<div className="pointer-events-none flex h-full justify-center overflow-hidden pt-3">
				<ResumePreview
					data={data}
					pageGap={0}
					pageLayout="vertical"
					pageScale={0.2}
					pageClassName="shadow-sm ring-1 ring-border/60"
					showPageNumbers={false}
				/>
			</div>
		</div>
	);
}

function ActionRow({
	icon: Icon,
	title,
	description,
	onClick,
	disabled,
	accent,
}: {
	icon: typeof PlusIcon;
	title: ReactNode;
	description: ReactNode;
	onClick: () => void;
	disabled?: boolean;
	accent?: boolean;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={cn(
				"flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
				"active:scale-[0.99] sm:min-h-16",
				accent
					? "border-primary/30 bg-primary/5 hover:border-primary/50 hover:bg-primary/10"
					: "border-border bg-card hover:border-primary/40 hover:bg-primary/5",
				disabled && "cursor-not-allowed opacity-60 hover:border-border hover:bg-card",
			)}
		>
			<span
				className={cn(
					"flex size-11 shrink-0 items-center justify-center rounded-xl",
					accent ? "bg-primary/15 text-primary" : "bg-muted text-foreground",
				)}
			>
				<Icon className="size-5" weight={accent ? "fill" : "regular"} />
			</span>
			<span className="min-w-0 flex-1">
				<span className="block font-semibold text-foreground">{title}</span>
				<span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
			</span>
		</button>
	);
}

function RouteComponent() {
	const embedded = isEmbedded();
	const navigate = useNavigate();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [resumes, setResumes] = useState(() => (embedded ? listDashboardResumes() : listLocalResumes()));

	const refresh = () => setResumes(embedded ? listDashboardResumes() : listLocalResumes());

	useEffect(() => {
		if (!embedded) return undefined;
		const onReady = () => refresh();
		window.addEventListener(EMBED_RESUMES_READY_EVENT, onReady);
		return () => window.removeEventListener(EMBED_RESUMES_READY_EVENT, onReady);
	}, [embedded]);
	const isPro = getEmbedIsPro();
	const atResumeLimit = embedded && !isPro && resumes.length >= FREE_LIMITS.resumes;

	const handleResumeLimit = (err: unknown) => {
		if (err instanceof ResumeLimitError) {
			toast.error(t`Free plan allows up to ${FREE_LIMITS.resumes} resume. Upgrade to Pro for unlimited resumes.`);
			return true;
		}
		return false;
	};

	const handleCreate = () => {
		void (async () => {
			try {
				const resume = await createLocalResume();
				void navigate({ to: "/builder/$resumeId", params: { resumeId: resume.id } });
			} catch (err) {
				if (!handleResumeLimit(err)) throw err;
			}
		})();
	};

	const handleCreateSample = () => {
		void (async () => {
			try {
				const resume = await createLocalResumeFromSample();
				void navigate({ to: "/builder/$resumeId", params: { resumeId: resume.id } });
			} catch (err) {
				if (!handleResumeLimit(err)) throw err;
			}
		})();
	};

	const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			const parsed = JSON.parse(await file.text()) as unknown;
			const data = resumeDataSchema.parse(parsed) as ResumeData;
			const resume = await importLocalResume(data);
			toast.success(t`Resume imported successfully.`);
			void navigate({ to: "/builder/$resumeId", params: { resumeId: resume.id } });
		} catch (err) {
			if (handleResumeLimit(err)) return;
			toast.error(t`Could not import resume. Please upload a valid Reactive Resume JSON file.`);
		} finally {
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	const handleDelete = (id: string) => {
		deleteLocalResume(id);
		refresh();
		toast.success(t`Resume deleted.`);
	};

	const handleOpen = (resumeId: string) => {
		void navigate({ to: "/builder/$resumeId", params: { resumeId } });
	};

	const quickActions = (
		<>
			{/* Mobile: compact list rows (no tall preview cards) */}
			<div className="grid gap-2 md:hidden">
				<ActionRow
					icon={SparkleIcon}
					accent
					title={<Trans>Start from sample</Trans>}
					description={<Trans>Indian software engineer profile with projects & skills</Trans>}
					onClick={handleCreateSample}
					disabled={atResumeLimit}
				/>
				<ActionRow
					icon={PlusIcon}
					title={<Trans>Blank resume</Trans>}
					description={<Trans>Start from an empty template</Trans>}
					onClick={handleCreate}
					disabled={atResumeLimit}
				/>
				<ActionRow
					icon={FileArrowUpIcon}
					title={<Trans>Import JSON</Trans>}
					description={<Trans>Upload a Reactive Resume export</Trans>}
					onClick={() => fileInputRef.current?.click()}
				/>
			</div>

			{/* Desktop: preview tiles */}
			<div className="hidden gap-3 md:grid md:grid-cols-3">
				<button
					type="button"
					onClick={handleCreate}
					disabled={atResumeLimit}
					className={cn(
						"group flex aspect-square flex-col items-start justify-between gap-2.5 rounded-xl border border-border bg-card p-2.5 text-left transition-colors",
						"hover:border-primary/40 hover:bg-primary/5",
						atResumeLimit && "cursor-not-allowed opacity-60 hover:border-border hover:bg-card",
					)}
				>
					<MiniResumePreview data={defaultResumeData} className="h-20 w-full" />
					<span className="flex items-start gap-2.5">
						<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-primary/10">
							<PlusIcon className="size-4 text-foreground" />
						</span>
						<span className="min-w-0">
							<span className="block font-semibold text-foreground">
								<Trans>Blank resume</Trans>
							</span>
							<span className="mt-0.5 block text-xs text-muted-foreground">
								<Trans>Start from an empty template</Trans>
							</span>
						</span>
					</span>
				</button>
				<button
					type="button"
					onClick={handleCreateSample}
					disabled={atResumeLimit}
					className={cn(
						"group flex aspect-square flex-col items-start justify-between gap-2.5 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-2.5 text-left transition-colors",
						"hover:border-primary/50 hover:from-primary/15",
						atResumeLimit && "cursor-not-allowed opacity-60",
					)}
				>
					<MiniResumePreview data={glowmindsSampleResumeData} className="h-20 w-full border-primary/25 bg-primary/5" />
					<span className="flex items-start gap-2.5">
						<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 transition-colors group-hover:bg-primary/20">
							<SparkleIcon className="size-4 text-primary" weight="fill" />
						</span>
						<span className="min-w-0">
							<span className="block font-semibold text-foreground">
								<Trans>Start from sample</Trans>
							</span>
							<span className="mt-0.5 block text-xs text-muted-foreground">
								<Trans>Indian software engineer profile with projects & skills</Trans>
							</span>
						</span>
					</span>
				</button>
				<button
					type="button"
					onClick={() => fileInputRef.current?.click()}
					className={cn(
						"group flex aspect-square flex-col items-start justify-between gap-2.5 rounded-xl border border-border bg-card p-2.5 text-left transition-colors",
						"hover:border-primary/40 hover:bg-primary/5",
					)}
				>
					<div className="flex h-20 w-full items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/40">
						<FileArrowUpIcon className="size-8 text-muted-foreground/70 transition-colors group-hover:text-primary" />
					</div>
					<span className="flex items-start gap-2.5">
						<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-primary/10">
							<FileArrowUpIcon className="size-4 text-foreground" />
						</span>
						<span className="min-w-0">
							<span className="block font-semibold text-foreground">
								<Trans>Import JSON</Trans>
							</span>
							<span className="mt-0.5 block text-xs text-muted-foreground">
								<Trans>Upload a Reactive Resume export</Trans>
							</span>
						</span>
					</span>
				</button>
			</div>
		</>
	);

	return (
		<main
			className={cn(
				embedded ? "min-h-full px-3 py-3 sm:px-4 sm:py-4" : "container mx-auto max-w-5xl px-4 py-12",
			)}
		>
			<div className={cn(embedded && "mx-auto w-full max-w-4xl")}>
				{!embedded && (
					<div className="mb-8 space-y-3 text-center">
						<BrandIcon variant="logo" className="mx-auto size-14 rounded-2xl" />
						<h1 className="text-3xl font-semibold tracking-tight">
							<Trans>Resume Builder</Trans>
						</h1>
						<p className="mx-auto max-w-2xl text-muted-foreground">
							<Trans>Create and edit resumes in your browser. Everything is saved to localStorage on this device.</Trans>
						</p>
					</div>
				)}

				{resumes.length === 0 ? (
					<Card className="border-dashed">
						<CardHeader className="text-center">
							<FileTextIcon className="mx-auto mb-2 size-10 text-muted-foreground/60" />
							<CardTitle>
								<Trans>No resumes yet</Trans>
							</CardTitle>
							<CardDescription className="mx-auto max-w-md">
								<Trans>
									Create a blank resume, start from our sample profile, or import an existing JSON export.
								</Trans>
							</CardDescription>
						</CardHeader>
						<CardContent className="pt-0">{quickActions}</CardContent>
					</Card>
				) : (
					<>
						<section
							className={cn(
								"mb-6 rounded-2xl border border-border/80 bg-gradient-to-b from-muted/40 to-card p-3 shadow-sm sm:mb-8 sm:p-4",
							)}
						>
							<div className="mb-3 sm:mb-4">
								<h2 className="text-base font-semibold text-foreground">
									<Trans>Quick start</Trans>
								</h2>
								<p className="text-sm text-muted-foreground">
									<Trans>Choose how you want to begin your resume</Trans>
									{embedded && !isPro && (
										<span className="mt-1 block text-xs font-medium text-muted-foreground">
											<Trans>
												{resumes.length} of {FREE_LIMITS.resumes} free resumes used
											</Trans>
										</span>
									)}
								</p>
							</div>
							{quickActions}
						</section>

						<h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
							<Trans>Your resumes</Trans>
						</h2>
						{/* Mobile: compact list */}
						<div className="grid gap-2 md:hidden">
							{resumes.map((resume) => (
								<div
									key={resume.id}
									className="flex min-h-14 items-center gap-2 rounded-xl border border-border bg-card p-2"
								>
									<button
										type="button"
										className="flex min-w-0 flex-1 items-center gap-3 px-1 py-1 text-left"
										onClick={() => handleOpen(resume.id)}
										aria-label={t`Open ${resume.name}`}
									>
										<span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
											<FileTextIcon className="size-5 text-primary" />
										</span>
										<span className="min-w-0">
											<span className="block truncate font-semibold text-foreground">{resume.name}</span>
											<span className="block truncate text-xs text-muted-foreground">
												<Trans>Last updated {resume.updatedAt.toLocaleString()}</Trans>
											</span>
										</span>
									</button>
									<Button
										type="button"
										variant="outline"
										size="icon"
										className="size-11 shrink-0 text-muted-foreground hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
										onClick={() => handleDelete(resume.id)}
										aria-label={t`Delete ${resume.name}`}
										title={t`Delete ${resume.name}`}
									>
										<TrashSimpleIcon className="size-4" />
									</Button>
								</div>
							))}
						</div>
						{/* Desktop: preview grid */}
						<div className={cn("hidden gap-3 md:grid", embedded ? "md:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3")}>
							{resumes.map((resume) => (
								<Card
									key={resume.id}
									className="group flex aspect-square flex-col overflow-hidden transition-shadow hover:border-primary/30 hover:shadow-md"
								>
									<button
										type="button"
										className="block p-3 pb-0 text-left"
										onClick={() => handleOpen(resume.id)}
										aria-label={t`Open ${resume.name}`}
									>
										<MiniResumePreview data={resume.data} className="h-28 w-full transition-colors group-hover:border-primary/30" />
									</button>
									<CardHeader className="pb-2 pt-2.5">
										<div className="flex items-center gap-2.5">
											<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
												<FileTextIcon className="size-3.5 text-primary" />
											</span>
											<div className="min-w-0 flex-1">
												<CardTitle className="truncate text-sm">{resume.name}</CardTitle>
												<CardDescription className={cn("truncate text-xs", embedded && "text-foreground/70")}>
													<Trans>Last updated {resume.updatedAt.toLocaleString()}</Trans>
												</CardDescription>
											</div>
										</div>
									</CardHeader>
									<CardContent className="mt-auto flex items-center gap-2 pt-0">
										<Button type="button" className="flex-1" onClick={() => handleOpen(resume.id)}>
											<Trans>Open</Trans>
										</Button>
										<Button
											type="button"
											variant="outline"
											size="icon"
											className="shrink-0 text-muted-foreground hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
											onClick={() => handleDelete(resume.id)}
											aria-label={t`Delete ${resume.name}`}
											title={t`Delete ${resume.name}`}
										>
											<TrashSimpleIcon className="size-4" />
										</Button>
									</CardContent>
								</Card>
							))}
						</div>
					</>
				)}

				<input
					ref={fileInputRef}
					type="file"
					accept="application/json,.json"
					className="hidden"
					onChange={handleImport}
				/>
			</div>
		</main>
	);
}
