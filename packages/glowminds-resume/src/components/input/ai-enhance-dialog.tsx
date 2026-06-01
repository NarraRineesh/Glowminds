import { t } from "@lingui/core/macro";
import { Trans } from "@lingui/react/macro";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/lib/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/lib/ui/components/dialog";
import { cn } from "@/lib/utils/style";
import { IMPROVE_TONES, improveResumeText } from "@/services/improve-text";

type Props = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	originalText: string;
	onAccept: (text: string) => void;
};

export function AiEnhanceDialog({ open, onOpenChange, originalText, onAccept }: Props) {
	const [tone, setTone] = useState("professional");
	const [variants, setVariants] = useState<string[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const fetchVariants = useCallback(
		async (nextTone = tone) => {
			const trimmed = originalText.trim();
			if (trimmed.length < 3) {
				setError(t`Add a few words before using AI enhance.`);
				return;
			}

			setLoading(true);
			setError("");
			setVariants([]);

			try {
				const out = await improveResumeText({ text: trimmed, tone: nextTone });
				if (!out.length) throw new Error(t`No suggestions returned. Try again.`);
				setVariants(out);
			} catch (err) {
				console.error("improveResumeText:", err);
				setError(err instanceof Error ? err.message : t`Could not enhance text. Try again.`);
			} finally {
				setLoading(false);
			}
		},
		[originalText, tone],
	);

	useEffect(() => {
		if (!open) return;
		setTone("professional");
		void fetchVariants("professional");
	}, [open, originalText, fetchVariants]);

	const onPickTone = (id: string) => {
		if (id === tone || loading) return;
		setTone(id);
		void fetchVariants(id);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[min(90svh,720px)] gap-0 overflow-hidden p-0 sm:max-w-[620px]">
				<DialogHeader className="border-b border-border px-6 py-4 text-left">
					<p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-primary">
						<Trans>AI · Enhance</Trans>
					</p>
					<DialogTitle className="text-lg">
						<Trans>Pick a rewrite</Trans>
					</DialogTitle>
					<DialogDescription>
						<Trans>Replaces the full description in this field.</Trans>
					</DialogDescription>
				</DialogHeader>

				<div className="max-h-[min(60svh,520px)] overflow-y-auto px-6 py-4">
					<div className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
						<Trans>Original</Trans>
					</div>
					<div className="mt-1 max-h-24 overflow-auto rounded-lg border border-border bg-muted/50 p-3 text-[0.82rem] leading-relaxed whitespace-pre-wrap">
						{originalText || <em className="text-muted-foreground">{t`Nothing to enhance.`}</em>}
					</div>

					<div className="mt-4 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
						<Trans>Tone</Trans>
					</div>
					<div className="mt-2 flex flex-wrap gap-2">
						{IMPROVE_TONES.map((item) => {
							const active = item.id === tone;
							return (
								<Button
									key={item.id}
									type="button"
									variant={active ? "default" : "outline"}
									size="sm"
									onClick={() => onPickTone(item.id)}
									disabled={loading}
									className={cn(
										"h-auto rounded-full px-3 py-1.5 text-xs font-semibold",
										!active && "bg-muted/50 text-muted-foreground",
									)}
								>
									{item.label}
								</Button>
							);
						})}
					</div>

					<div className="mt-4 flex items-center justify-between">
						<div className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-muted-foreground">
							<Trans>Suggestions</Trans>
						</div>
						<Button type="button" variant="outline" size="sm" onClick={() => fetchVariants(tone)} disabled={loading}>
							{loading ? t`Generating…` : t`Regenerate`}
						</Button>
					</div>

					<div className="mt-2 flex flex-col gap-2">
						{loading &&
							[0, 1, 2].map((i) => (
								<div key={i} className="h-16 animate-pulse rounded-lg border border-border bg-muted/50" />
							))}

						{!loading && error && (
							<div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
								{error}
							</div>
						)}

						{!loading &&
							!error &&
							variants.map((variant, i) => (
								<button
									key={i}
									type="button"
									onClick={() => {
										onAccept(variant);
										onOpenChange(false);
										toast.success(t`Description updated`);
									}}
									className="group flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 text-left transition-all hover:-translate-y-px hover:border-primary hover:bg-primary/10"
								>
									<span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
										{i + 1}
									</span>
									<span className="text-[0.86rem] leading-relaxed whitespace-pre-wrap">{variant}</span>
								</button>
							))}
					</div>
				</div>

				<DialogFooter className="border-t border-border px-6 py-3">
					<Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
						<Trans>Cancel</Trans>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
