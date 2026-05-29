import type { ResumeData } from "@/lib/schema/resume/data";
import { resumeDataSchema } from "@/lib/schema/resume/data";
import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { FileArrowUpIcon, PlusIcon, TrashSimpleIcon } from "@phosphor-icons/react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { BrandIcon } from "@/lib/ui/components/brand-icon";
import { Button } from "@/lib/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/ui/components/card";
import {
	createLocalResume,
	deleteLocalResume,
	importLocalResume,
	listLocalResumes,
} from "@/features/resume/builder/local-storage";
import { isEmbedded } from "@/embed/runtime";
import { createNoindexFollowMeta } from "@/libs/seo";
import { cn } from "@/lib/utils/style";

export const Route = createFileRoute("/local/")({
	component: RouteComponent,
	head: () => ({
		meta: [{ title: "Local Resume Builder" }, createNoindexFollowMeta()],
	}),
});

function RouteComponent() {
	const embedded = isEmbedded();
	const navigate = useNavigate();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [resumes, setResumes] = useState(() => listLocalResumes());

	const refresh = () => setResumes(listLocalResumes());

	const handleCreate = () => {
		const resume = createLocalResume();
		void navigate({ to: "/builder/$resumeId", params: { resumeId: resume.id } });
	};

	const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			const parsed = JSON.parse(await file.text()) as unknown;
			const data = resumeDataSchema.parse(parsed) as ResumeData;
			const resume = importLocalResume(data);
			toast.success(t`Resume imported successfully.`);
			void navigate({ to: "/builder/$resumeId", params: { resumeId: resume.id } });
		} catch {
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

	return (
		<main
			className={cn(
				embedded ? "min-h-full px-4 py-4" : "container mx-auto max-w-5xl px-4 py-12",
			)}
		>
			<div className={cn(embedded && "mx-auto w-full max-w-4xl")}>
				<div className={cn("space-y-2", embedded ? "mb-5 text-left" : "mb-10 space-y-3 text-center")}>
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

				<div className={cn("mb-6 flex flex-wrap gap-2", embedded ? "justify-start" : "mb-8 justify-center")}>
					<Button type="button" onClick={handleCreate}>
						<PlusIcon className="me-2" />
						<Trans>New Resume</Trans>
					</Button>
					<Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
						<FileArrowUpIcon className="me-2" />
						<Trans>Import JSON</Trans>
					</Button>
					<input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImport} />
				</div>

				{resumes.length === 0 ? (
					<Card className="border-dashed">
						<CardHeader className="text-center">
							<CardTitle>
								<Trans>No resumes yet</Trans>
							</CardTitle>
							<CardDescription>
								<Trans>Create a new resume or import an existing JSON export to get started.</Trans>
							</CardDescription>
						</CardHeader>
					</Card>
				) : (
					<div className={cn("grid gap-4", embedded ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3")}>
						{resumes.map((resume) => (
							<Card key={resume.id} className="flex flex-col">
								<CardHeader className="pb-3">
									<CardTitle className="truncate text-base">{resume.name}</CardTitle>
									<CardDescription className={cn(embedded && "text-foreground/70")}>
										<Trans>Last updated {resume.updatedAt.toLocaleString()}</Trans>
									</CardDescription>
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
				)}
			</div>
		</main>
	);
}
