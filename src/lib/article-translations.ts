export type ArticleTranslations = { en: Record<string, string>; ar: Record<string, string> };

export function readArticleTranslations(value: unknown): ArticleTranslations {
  const source = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const read = (language: string) => {
    const fields = source[language];
    return fields && typeof fields === 'object'
      ? Object.fromEntries(Object.entries(fields).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))
      : {};
  };
  return { en: read('en'), ar: read('ar') };
}

export function articleTranslationsForSave(manual: boolean, current: unknown, automatic: ArticleTranslations | null): ArticleTranslations {
  return !manual && automatic ? automatic : readArticleTranslations(current);
}