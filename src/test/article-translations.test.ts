import { describe, expect, it } from 'vitest';
import { articleTranslationsForSave } from '../lib/article-translations';

const manual = { en: { title: 'Harvest', excerpt: 'Our olives', content: 'Full text' }, ar: { title: 'الحصاد', excerpt: 'زيتوننا' } };
const automatic = { en: { title: 'Automatic' }, ar: { title: 'تلقائي' } };

describe('article translations', () => {
  it('preserves manually edited English and Arabic when saving', () => {
    expect(articleTranslationsForSave(true, manual, automatic)).toEqual(manual);
  });
  it('uses automatic translations for articles not edited manually', () => {
    expect(articleTranslationsForSave(false, manual, automatic)).toEqual(automatic);
  });
  it('keeps saved translations when automatic translation fails', () => {
    expect(articleTranslationsForSave(false, manual, null)).toEqual(manual);
  });
});