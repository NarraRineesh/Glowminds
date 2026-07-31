import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { CircleNotchIcon, CloudArrowUpIcon, FileDocIcon, FileJsIcon, FilePdfIcon } from "@phosphor-icons/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { buildDocx } from "@/lib/docx";
import { Button } from "@/lib/ui/components/button";
import { downloadWithAnchor, generateFilename } from "@/lib/utils/file";
import { useResume } from "@/features/resume/builder/draft";
import { createResumePdfBlob } from "@/features/resume/export/pdf-document";
import { getEmbedConfig } from "@/embed/runtime";
import { SectionBase } from "../shared/section-base";

export function ExportSectionBuilder() {
	const resumeData = useResume();

	const [isPrinting, setIsPrinting] = useState(false);
	const [isStoring, setIsStoring] = useState(false);
	const resume = resumeData;
	const onStorePdf = getEmbedConfig()?.onStorePdf;

	const onSavePdfToAccount = useCallback(async () => {
		if (!resume || !onStorePdf) return;
		const filename = generateFilename(resume.name, "pdf");
		const toastId = toast.loading(t`Saving your PDF to your account...`);

		setIsStoring(true);
		try {
			const blob = await createResumePdfBlob(resume.data);
			await onStorePdf({ blob, name: filename, resumeId: resume.id });
			toast.success(t`Saved to your account. Find it in your Vault.`);
		} catch {
			toast.error(t`Could not save the PDF to your account, please try again.`);
		} finally {
			setIsStoring(false);
			toast.dismiss(toastId);
		}
	}, [resume, onStorePdf]);

	const onDownloadJSON = useCallback(() => {
		if (!resume) return;
		const filename = generateFilename(resume.name, "json");
		const jsonString = JSON.stringify(resume.data, null, 2);
		const blob = new Blob([jsonString], { type: "application/json" });

		downloadWithAnchor(blob, filename);
	}, [resume]);

	const onDownloadDOCX = useCallback(async () => {
		if (!resume) return;
		const filename = generateFilename(resume.name, "docx");

		try {
			const blob = await buildDocx(resume.data);
			downloadWithAnchor(blob, filename);
		} catch {
			toast.error(t`There was a problem while generating the DOCX, please try again.`);
		}
	}, [resume]);

	const onDownloadPDF = useCallback(async () => {
		if (!resume) return;
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

	if (!resume) return null;

	return (
		<SectionBase type="export" className="space-y-4">
			<Button
				variant="outline"
				onClick={onDownloadJSON}
				className="h-auto gap-x-4 whitespace-normal p-4! text-start font-normal active:scale-98"
			>
				<FileJsIcon className="size-6 shrink-0" />
				<div className="flex flex-1 flex-col gap-y-1">
					<h6 className="font-medium">JSON</h6>
					<p className="text-muted-foreground text-xs leading-normal">
						<Trans>
							Download a copy of your resume in JSON format. Use this file for backup or to import your resume into
							other applications, including AI assistants.
						</Trans>
					</p>
				</div>
			</Button>

			<Button
				variant="outline"
				onClick={onDownloadDOCX}
				className="h-auto gap-x-4 whitespace-normal p-4! text-start font-normal active:scale-98"
			>
				<FileDocIcon className="size-6 shrink-0" />
				<div className="flex flex-1 flex-col gap-y-1">
					<h6 className="font-medium">DOCX</h6>
					<p className="text-muted-foreground text-xs leading-normal">
						<Trans>
							Download a copy of your resume as a Word document. Use this file to further customize your resume in
							Microsoft Word or Google Docs.
						</Trans>
					</p>
				</div>
			</Button>

			<Button
				variant="outline"
				disabled={isPrinting}
				onClick={onDownloadPDF}
				className="h-auto gap-x-4 whitespace-normal p-4! text-start font-normal active:scale-98"
			>
				{isPrinting ? (
					<CircleNotchIcon className="size-6 shrink-0 animate-spin" />
				) : (
					<FilePdfIcon className="size-6 shrink-0" />
				)}

				<div className="flex flex-1 flex-col gap-y-1">
					<h6 className="font-medium">PDF</h6>
					<p className="text-muted-foreground text-xs leading-normal">
						<Trans>
							Download a copy of your resume in PDF format. Use this file for printing or to easily share your resume
							with recruiters.
						</Trans>
					</p>
				</div>
			</Button>

			{onStorePdf ? (
				<Button
					variant="outline"
					disabled={isStoring}
					onClick={onSavePdfToAccount}
					className="h-auto gap-x-4 whitespace-normal p-4! text-start font-normal active:scale-98"
				>
					{isStoring ? (
						<CircleNotchIcon className="size-6 shrink-0 animate-spin" />
					) : (
						<CloudArrowUpIcon className="size-6 shrink-0" />
					)}

					<div className="flex flex-1 flex-col gap-y-1">
						<h6 className="font-medium">
							<Trans>Save PDF to account</Trans>
						</h6>
						<p className="text-muted-foreground text-xs leading-normal">
							<Trans>
								Store a PDF copy securely in your account. It appears in your Vault so you can access it from any
								device.
							</Trans>
						</p>
					</div>
				</Button>
			) : null}
		</SectionBase>
	);
}
