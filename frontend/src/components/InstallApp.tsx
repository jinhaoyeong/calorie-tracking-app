import { ArrowSquareOut, CaretRight, DownloadSimple, Warning } from '@phosphor-icons/react';
import { useState, useSyncExternalStore } from 'react';
import { type BrowserInfo, canPromptInstall, chromeIntentUrl, detectBrowser, isStandalone, promptInstall, subscribeToInstall } from '../lib/install';
import { BottomSheet } from './BottomSheet';
import './InstallApp.css';

function useInstall() {
  const canPrompt = useSyncExternalStore(subscribeToInstall, canPromptInstall);
  const [browser] = useState(() => detectBrowser(navigator.userAgent));
  const [standalone] = useState(isStandalone);
  return { canPrompt, browser, standalone };
}

/** Built-in browsers in WhatsApp, Instagram and the like can't install apps or, often, use the camera. */
function InAppBrowserNotice({ browser }: { browser: BrowserInfo }) {
  if (!browser.inAppBrowser) return null;
  return (
    <div className="notice notice--warning install__notice" role="note">
      <Warning size={18} weight="fill" />
      <div>
        <p>
          You opened Pinggan inside <strong>{browser.inAppBrowser}</strong>, which can't install apps.{' '}
          {browser.platform === 'ios'
            ? 'Tap the ⋯ or compass button and choose Open in Safari.'
            : 'Open it in Chrome to install it and use the camera.'}
        </p>
        {browser.platform === 'android' && (
          <a className="btn btn--secondary install__open" href={chromeIntentUrl(window.location)}>
            <ArrowSquareOut size={18} weight="bold" /> Open in Chrome
          </a>
        )}
      </div>
    </div>
  );
}

function InstallSteps({ browser }: { browser: BrowserInfo }) {
  if (browser.platform === 'ios') {
    return (
      <ol className="install__steps">
        <li>Open this page in Safari.</li>
        <li>
          Tap <strong>Share</strong> (the square with an arrow).
        </li>
        <li>
          Tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>.
        </li>
      </ol>
    );
  }
  return (
    <>
      <p className="install__browser">Chrome</p>
      <ol className="install__steps">
        <li>
          Tap <strong>⋮</strong> at the top right.
        </li>
        <li>
          Tap <strong>Install app</strong> or <strong>Add to home screen</strong>.
        </li>
        <li>
          Tap <strong>Install</strong>.
        </li>
      </ol>
      <p className="install__browser">Samsung Internet</p>
      <ol className="install__steps">
        <li>
          Tap <strong>≡</strong> at the bottom right.
        </li>
        <li>
          Tap <strong>Add page to</strong>, then <strong>Home screen</strong>.
        </li>
      </ol>
    </>
  );
}

/** "Install app" row for the settings list. Hidden once the app runs from the home screen. */
export function InstallRow() {
  const { canPrompt, browser, standalone } = useInstall();
  const [helping, setHelping] = useState(false);
  if (standalone) return null;

  const install = () => {
    if (canPrompt) void promptInstall();
    else setHelping(true);
  };

  return (
    <li>
      <button type="button" className="list-row" onClick={install}>
        <span className="list-row__icon">
          <DownloadSimple size={20} weight="bold" />
        </span>
        <span className="list-row__text">
          <span className="list-row__title">Install app</span>
          <span className="list-row__sub">Add Pinggan to your home screen</span>
        </span>
        <CaretRight size={16} weight="bold" className="list-row__chevron" />
      </button>
      {helping && (
        <BottomSheet title="Install Pinggan" onClose={() => setHelping(false)}>
          <InAppBrowserNotice browser={browser} />
          <p className="install__lede">Pinggan installs from your browser, no app store needed. It then opens full screen from its own icon.</p>
          <InstallSteps browser={browser} />
        </BottomSheet>
      )}
    </li>
  );
}

/** Welcome-screen install shortcut, or a warning when the page is inside another app's browser. */
export function WelcomeInstall() {
  const { canPrompt, browser, standalone } = useInstall();
  if (standalone) return null;
  if (browser.inAppBrowser) return <InAppBrowserNotice browser={browser} />;
  if (!canPrompt) return null;
  return (
    <button type="button" className="btn btn--secondary btn--block install__welcome" onClick={() => void promptInstall()}>
      <DownloadSimple size={18} weight="bold" /> Install app
    </button>
  );
}
