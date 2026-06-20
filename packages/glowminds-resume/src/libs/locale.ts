import type { MessageDescriptor, Messages } from "@lingui/core";
import type { Locale } from "@/lib/utils/locale";
import { i18n } from "@lingui/core";
import { msg } from "@lingui/core/macro";
import Cookies from "js-cookie";
import { isRTL, localeSchema } from "@/lib/utils/locale";
import enUSCatalog from "../../locales/en-US.js";

export const getLocaleOptions = () => {
	return Object.entries(localeMap).map(([value, label]) => ({
		value: value as Locale,
		label: i18n.t(label),
		keywords: [i18n.t(label)],
	}));
};

export { isRTL };

const storageKey = "locale";
const defaultLocale: Locale = "en-US";

const catalogs: Partial<Record<Locale, Messages>> = {
	"en-US": enUSCatalog.messages,
};

export const localeMap: Partial<Record<Locale, MessageDescriptor>> = {
	"en-US": msg`English`,
};

export function isLocale(locale: string): locale is Locale {
	return localeSchema.safeParse(locale).success;
}

export const resolveLocale = (locale: string): Locale => {
	return isLocale(locale) ? locale : defaultLocale;
};

export const getLocale = () => {
	const locale = Cookies.get(storageKey);
	if (!locale || !isLocale(locale)) return defaultLocale;
	return locale;
};

export const getLocaleMessages = async (locale: string) => {
	const resolvedLocale = resolveLocale(locale);
	const messages = catalogs[resolvedLocale] ?? catalogs[defaultLocale]!;
	return { locale: resolvedLocale, messages };
};

export const loadLocale = async (locale: string) => {
	const { locale: resolvedLocale, messages } = await getLocaleMessages(locale);
	i18n.loadAndActivate({ locale: resolvedLocale, messages });
};
