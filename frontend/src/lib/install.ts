/** Installing the web app on the home screen: the browser's install prompt and the cases where it can't appear. */

export type Platform = 'android' | 'ios' | 'other';

export interface BrowserInfo {
  platform: Platform;
  /** The app whose built-in browser is showing the page (these can't install web apps), or null. */
  inAppBrowser: string | null;
}

const IN_APP_BROWSERS: Array<[RegExp, string]> = [
  [/WhatsApp/i, 'WhatsApp'],
  [/Instagram/i, 'Instagram'],
  [/FBAN|FBAV|FB_IAB|FBIOS/i, 'Facebook'],
  [/musical_ly|TikTok|BytedanceWebview/i, 'TikTok'],
  [/Telegram/i, 'Telegram'],
  [/\bLine\//i, 'LINE'],
  [/MicroMessenger/i, 'WeChat'],
  [/Snapchat/i, 'Snapchat'],
];

export function detectBrowser(userAgent: string): BrowserInfo {
  const platform: Platform = /Android/i.test(userAgent) ? 'android' : /iPhone|iPad|iPod/i.test(userAgent) ? 'ios' : 'other';
  const known = IN_APP_BROWSERS.find(([pattern]) => pattern.test(userAgent));
  // Android marks every embedded WebView with "; wv)" in its user agent.
  const webView = platform === 'android' && /; wv\)/.test(userAgent);
  return { platform, inAppBrowser: known ? known[1] : webView ? 'another app' : null };
}

/** An Android link that reopens the page in Chrome, where it can be installed. */
export function chromeIntentUrl(location: Pick<Location, 'host' | 'pathname' | 'search' | 'href'>): string {
  const fallback = encodeURIComponent(location.href);
  return `intent://${location.host}${location.pathname}${location.search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${fallback};end`;
}

export function isStandalone(): boolean {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia('(display-mode: standalone)').matches;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const subscribers = new Set<() => void>();
const notify = () => subscribers.forEach((subscriber) => subscriber());

/** Keep the browser's install prompt for the Install button. Call before the app renders: it can fire early. */
export function listenForInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

export function canPromptInstall(): boolean {
  return deferredPrompt !== null;
}

export function subscribeToInstall(subscriber: () => void): () => void {
  subscribers.add(subscriber);
  return () => subscribers.delete(subscriber);
}

/** Shows the browser's install dialog. Resolves true if the user installed the app. */
export async function promptInstall(): Promise<boolean> {
  const prompt = deferredPrompt;
  if (!prompt) return false;
  deferredPrompt = null;
  notify();
  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  return outcome === 'accepted';
}

export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
}
