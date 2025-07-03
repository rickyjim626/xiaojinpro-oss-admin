import { useMemo } from 'react';
import zhTranslations from '@/locales/zh.json';

type TranslationKeys = typeof zhTranslations;

function get(obj: any, path: string): string {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return path; // Return the key if translation not found
    }
  }
  
  return typeof current === 'string' ? current : path;
}

export function useTranslation() {
  const t = useMemo(() => {
    return (key: string) => get(zhTranslations, key);
  }, []);

  return { t };
}