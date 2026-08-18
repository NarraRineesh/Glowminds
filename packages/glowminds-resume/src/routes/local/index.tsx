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
import { useRef, useState } from "react";
import { toast } from "sonner";
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
import { isEmbedded } from "@/embed/runtime";
import { FREE_LIMITS, getEmbedIsPro } from "@/lib/plans";
import { createNoindexFollowMeta } from "@/libs/seo";
import { cn } from "@/lib/utils/style";

export const Route = createFileRoute("/local/")({
	component: RouteComponent,
	head: () => ({
		meta: [{ title: "Glowminds Resume Builder" }, createNoindexFollowMeta()],
	}),
});

function RouteComponent() {
	const embedded = isEmbedded();
	const navigate = useNavigate();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [resumes, setResumes] = useState(() => listLocalResumes());

	const refresh = () => setResumes(listLocalResumes());
	const isPro = getEmbedIsPro();
	const atResumeLimit = embedded && !isPro && resumes.length >= FREE_LIMITS.resumes;

	const handleResumeLimit = (err: unknown) => {
		if (err instanceof ResumeLimitError) {
			toast.error(t`Free plan allows up to 3 resumes. Upgrade to Pro for unlimited resumes.`);
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
		<div className="grid gap-3 sm:grid-cols-3">
			<button
				type="button"
				onClick={handleCreate}
				disabled={atResumeLimit}
				className={cn(
					"group flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-colors",
					"hover:border-primary/40 hover:bg-primary/5",
					atResumeLimit && "cursor-not-allowed opacity-60 hover:border-border hover:bg-card",
				)}
			>
				<span className="flex size-10 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-primary/10">
					<PlusIcon className="size-5 text-foreground" />
				</span>
				<span className="font-semibold text-foreground">
					<Trans>Blank resume</Trans>
				</span>
				<span className="text-sm text-muted-foreground">
					<Trans>Start from an empty template</Trans>
				</span>
			</button>
			<button
				type="button"
				onClick={handleCreateSample}
				disabled={atResumeLimit}
				className={cn(
					"group flex flex-col items-start gap-2 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-4 text-left transition-colors",
					"hover:border-primary/50 hover:from-primary/15",
					atResumeLimit && "cursor-not-allowed opacity-60",
				)}
			>
				<span className="flex size-10 items-center justify-center rounded-lg bg-primary/15 transition-colors group-hover:bg-primary/20">
					<SparkleIcon className="size-5 text-primary" weight="fill" />
				</span>
				<span className="font-semibold text-foreground">
					<Trans>Start from sample</Trans>
				</span>
				<span className="text-sm text-muted-foreground">
					<Trans>Indian software engineer profile with projects & skills</Trans>
				</span>
			</button>
			<button
				type="button"
				onClick={() => fileInputRef.current?.click()}
				className={cn(
					"group flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 text-left transition-colors",
					"hover:border-primary/40 hover:bg-primary/5",
				)}
			>
				<span className="flex size-10 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-primary/10">
					<FileArrowUpIcon className="size-5 text-foreground" />
				</span>
				<span className="font-semibold text-foreground">
					<Trans>Import JSON</Trans>
				</span>
				<span className="text-sm text-muted-foreground">
					<Trans>Upload a Reactive Resume export</Trans>
				</span>
			</button>
		</div>
	);

	return (
		<main
			className={cn(
				embedded ? "min-h-full px-4 py-4" : "container mx-auto max-w-5xl px-4 py-12",
			)}
		>
			<div className={cn(embedded && "mx-auto w-full max-w-4xl")}>
				<div className={cn("space-y-2", embedded ? "mb-5 text-left" : "mb-8 space-y-3 text-center")}>
					{!embedded && (
						<BrandIcon variant="logo" className="mx-auto size-14 rounded-2xl" />
					)}
					<h1 className={cn("font-semibold tracking-tight", embedded ? "text-lg" : "text-3xl")}>
						<Trans>Resume Builder</Trans>
					</h1>
					<p
						className={cn(
							embedded ? "text-sm text-muted-foreground" : "mx-auto max-w-2xl text-muted-foreground",
						)}
					>
						<Trans>Create and edit resumes in your browser. Everything is saved to localStorage on this device.</Trans>
					</p>
				</div>

				<section
					className={cn(
						"mb-8 rounded-2xl border border-border/80 bg-gradient-to-b from-muted/40 to-card p-5 shadow-sm",
						embedded && "mb-6",
					)}
				>
					<div className="mb-4 flex flex-wrap items-center justify-between gap-3">
						<div>
							<h2 className="text-base font-semibold text-foreground">
								<Trans>Quick start</Trans>
							</h2>
							<p className="text-sm text-muted-foreground">
								<Trans>Choose how you want to begin your resume</Trans>
								{embedded && !isPro && (
									<span className="mt-1 block text-xs font-medium text-muted-foreground">
										<Trans>{resumes.length} of {FREE_LIMITS.resumes} free resumes used</Trans>
									</span>
								)}
							</p>
						</div>
						<Button type="button" className="shrink-0" onClick={handleCreateSample}>
							<SparkleIcon className="me-2" weight="fill" />
							<Trans>Start from Sample</Trans>
						</Button>
					</div>
					{quickActions}
					<input
						ref={fileInputRef}
						type="file"
						accept="application/json,.json"
						className="hidden"
						onChange={handleImport}
					/>
				</section>

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
						<h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
							<Trans>Your resumes</Trans>
						</h2>
						<div className={cn("grid gap-4", embedded ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3")}>
							{resumes.map((resume) => (
								<Card
									key={resume.id}
									className="group flex flex-col transition-shadow hover:border-primary/30 hover:shadow-md"
								>
									<CardHeader className="pb-3">
										<div className="flex items-start gap-3">
											<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted transition-colors group-hover:bg-primary/10">
												<FileTextIcon className="size-4 text-muted-foreground group-hover:text-primary" />
											</span>
											<div className="min-w-0 flex-1">
												<CardTitle className="truncate text-base">{resume.name}</CardTitle>
												<CardDescription className={cn(embedded && "text-foreground/70")}>
													<Trans>Last updated {resume.updatedAt.toLocaleString()}</Trans>
												</CardDescription>
											</div>
										</div>
									</CardHeader>
									<CardContent className="mt-auto flex gap-2 pt-0">
										<Button type="button" className="flex-1" onClick={() => handleOpen(resume.id)}>
											<Trans>Open</Trans>
										</Button>
										<Button
											type="button"
											variant="destructive"
											className="shrink-0"
											onClick={() => handleDelete(resume.id)}
										>
											<TrashSimpleIcon className="me-1.5" />
											<Trans>Delete</Trans>
										</Button>
									</CardContent>
								</Card>
							))}
						</div>
					</>
				)}
			</div>
		</main>
	);
}
