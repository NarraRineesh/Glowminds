import z from "zod";
import { resumeDialogSchemas } from "./resume/schema";

export const dialogSchemaRegistries = [{ domain: "resume", schemas: resumeDialogSchemas }] as const;

export const dialogTypeSchema = z.discriminatedUnion("type", resumeDialogSchemas);

export type DialogSchema = z.infer<typeof dialogTypeSchema>;
export type DialogType = DialogSchema["type"];

export type DialogData<T extends DialogType> = Extract<DialogSchema, { type: T }>["data"];

type DialogPropsData<T extends DialogType> =
	DialogData<T> extends undefined ? Record<string, never> : { data: DialogData<T> };

export type DialogProps<T extends DialogType> = DialogPropsData<T>;
