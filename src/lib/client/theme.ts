'use client';

import { createLocalStore } from './local-store';

export type Theme = 'light' | 'dark';
const KEY = 'baytak:theme';

export const themeStore = createLocalStore<Theme>(KEY, 'light');

export function setTheme(theme: Theme) {
  themeStore.set(theme);
  document.documentElement.setAttribute('data-theme', theme);
}

/** Runs before first paint so a visitor who chose dark never sees a light flash. */
export const themeInitScript = `try{var t=JSON.parse(localStorage.getItem('${KEY}'));if(t==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}`;
