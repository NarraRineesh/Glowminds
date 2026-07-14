import { Trans } from "@lingui/react/macro";
import { t } from "@lingui/core/macro";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/lib/ui/components/button";
import { Textarea } from "@/lib/ui/components/textarea";
import { useCurrentResume, useUpdateResumeData } from "@/features/resume/builder/draft";
import { runResumeReview } from "@/services/resume-review";
import { SectionBase } from "../shared/section-base";

type AnalysisResult = {
	overallScore?: number;
	scorecard?: Array<{ dimension: string; score: number; rationale: string }>;
	suggestions?: Array<{
		title: string;
		impact: string;
		why: string;
		exampleRewrite?: string | null;
		copyPrompt?: string;
	}>;
	strengths?: string[];
	updatedAt?: string;
};

export function AnalysisSectionBuilder() {
	return (
		<SectionBase type="analysis">
			<AnalysisSectionForm />
		</SectionBase>
	);
}

function AnalysisSectionForm() {
	const resume = useCurrentResume();
	const updateResumeData = useUpdateResumeData();
	const stored = (resume.data.metadata as { analysis?: AnalysisResult }).analysis;
	const [jobDescription, setJobDescription] = useState("");
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<AnalysisResult | null>(stored || null);

	const onRun = async () => {
		setLoading(true);
		try {
			const analysis = (await runResumeReview({
				resume: resume.data,
				jobDescription,
			})) as AnalysisResult;
			setResult(analysis);
			updateResumeData((draft) => {
				(draft.metadata as { analysis?: AnalysisResult }).analysis = {
					overallScore: analysis.overallScore,
					scorecard: analysis.scorecard,
					suggestions: analysis.suggestions,
					strengths: analysis.strengths,
					updatedAt: analysis.updatedAt || new Date().toISOString(),
				};
			});
			toast.success(t`ATS review complete`);
		} catch (err) {
			const message = err instanceof Error ? err.message : t`ATS review failed`;
			toast.error(message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-4">
			<p className="text-sm text-muted-foreground">
				<Trans>
					Run an ATS-focused review of this resume (Pro · 5 AI credits). Optionally paste a job description for
					keyword targeting.
				</Trans>
			</p>

			<div className="space-y-2">
				<label className="text-xs font-medium text-muted-foreground">
					<Trans>Job description (optional)</Trans>
				</label>
				<Textarea
					value={jobDescription}
					onChange={(e) => setJobDescription(e.target.value)}
					placeholder={t`Paste a target job description…`}
					rows={4}
					disabled={loading}
				/>
			</div>

			<Button onClick={onRun} disabled={loading} className="w-full">
				{loading ? <Trans>Analyzing…</Trans> : <Trans>Run ATS review</Trans>}
			</Button>

			{result?.overallScore != null && (
				<div className="space-y-4 rounded-lg border border-border p-3">
					<div className="flex items-end justify-between gap-2">
						<div>
							<p className="text-xs uppercase tracking-wide text-muted-foreground">
								<Trans>Overall score</Trans>
							</p>
							<p className="text-3xl font-semibold tabular-nums">{result.overallScore}</p>
						</div>
						{result.updatedAt ? (
							<p className="text-xs text-muted-foreground">
								{new Date(result.updatedAt).toLocaleString()}
							</p>
						) : null}
					</div>

					{(result.strengths || []).length > 0 && (
						<div>
							<p className="mb-1 text-sm font-medium">
								<Trans>Strengths</Trans>
							</p>
							<ul className="list-disc space-y-1 ps-4 text-sm text-muted-foreground">
								{result.strengths!.map((s) => (
									<li key={s}>{s}</li>
								))}
							</ul>
						</div>
					)}

					{(result.scorecard || []).length > 0 && (
						<div className="space-y-2">
							<p className="text-sm font-medium">
								<Trans>Scorecard</Trans>
							</p>
							{result.scorecard!.map((d) => (
								<div key={d.dimension} className="rounded-md bg-muted/40 px-3 py-2">
									<div className="flex justify-between gap-2 text-sm font-medium">
										<span>{d.dimension}</span>
										<span className="tabular-nums">{d.score}</span>
									</div>
									<p className="mt-1 text-xs text-muted-foreground">{d.rationale}</p>
								</div>
							))}
						</div>
					)}

					{(result.suggestions || []).length > 0 && (
						<div className="space-y-2">
							<p className="text-sm font-medium">
								<Trans>Suggestions</Trans>
							</p>
							{result.suggestions!.map((s) => (
								<div key={s.title} className="rounded-md border border-border/60 px-3 py-2">
									<div className="flex items-center justify-between gap-2">
										<p className="text-sm font-medium">{s.title}</p>
										<span className="text-[0.65rem] uppercase text-muted-foreground">{s.impact}</span>
									</div>
									<p className="mt-1 text-xs text-muted-foreground">{s.why}</p>
									{s.exampleRewrite ? (
										<p className="mt-2 rounded bg-muted/50 p-2 text-xs">{s.exampleRewrite}</p>
									) : null}
								</div>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
