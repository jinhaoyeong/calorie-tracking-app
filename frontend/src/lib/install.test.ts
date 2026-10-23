import { describe, expect, it } from 'vitest';
import { chromeIntentUrl, detectBrowser } from './install';

const UA = {
  chromeAndroid: 'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36',
  samsung:
    'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36',
  instagramAndroid:
    'Mozilla/5.0 (Linux; Android 14; SM-A546E Build/UP1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0.0.0 Mobile Safari/537.36 Instagram 350.0.0.0.0 Android',
  facebookAndroid:
    'Mozilla/5.0 (Linux; Android 13; Redmi Note 12 Build/TKQ1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0.0.0 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/480.0.0.0;]',
  webViewAndroid:
    'Mozilla/5.0 (Linux; Android 13; Redmi Note 12 Build/TKQ1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0.0.0 Mobile Safari/537.36',
  safariIos: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  instagramIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.0.0 (iPhone15,2; iOS 18_0)',
  desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
};

describe('install support', () => {
  it('lets normal browsers install', () => {
    expect(detectBrowser(UA.chromeAndroid)).toEqual({ platform: 'android', inAppBrowser: null });
    expect(detectBrowser(UA.samsung)).toEqual({ platform: 'android', inAppBrowser: null });
    expect(detectBrowser(UA.safariIos)).toEqual({ platform: 'ios', inAppBrowser: null });
    expect(detectBrowser(UA.desktop)).toEqual({ platform: 'other', inAppBrowser: null });
  });

  it('recognises browsers built into other apps', () => {
    expect(detectBrowser(UA.instagramAndroid).inAppBrowser).toBe('Instagram');
    expect(detectBrowser(UA.facebookAndroid).inAppBrowser).toBe('Facebook');
    expect(detectBrowser(UA.instagramIos)).toEqual({ platform: 'ios', inAppBrowser: 'Instagram' });
    expect(detectBrowser(UA.webViewAndroid).inAppBrowser).toBe('another app');
  });

  it('builds an Android link that reopens the page in Chrome', () => {
    const url = chromeIntentUrl({
      host: 'pinggan.vercel.app',
      pathname: '/welcome',
      search: '?from=ig',
      href: 'https://pinggan.vercel.app/welcome?from=ig',
    });
    expect(url).toBe(
      'intent://pinggan.vercel.app/welcome?from=ig#Intent;scheme=https;package=com.android.chrome;' +
        'S.browser_fallback_url=https%3A%2F%2Fpinggan.vercel.app%2Fwelcome%3Ffrom%3Dig;end',
    );
  });
});
