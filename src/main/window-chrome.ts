import type { BrowserWindow, BrowserWindowConstructorOptions, TitleBarOverlayOptions } from 'electron';

const titlebarHeight = 34;

function chromeColors(dark: boolean): Required<Pick<TitleBarOverlayOptions, 'color' | 'symbolColor'>> {
  return dark
    ? { color: '#151516', symbolColor: '#e8e8e6' }
    : { color: '#f6f6f5', symbolColor: '#252525' };
}

function titleBarOverlay(dark: boolean): TitleBarOverlayOptions {
  return { ...chromeColors(dark), height: titlebarHeight };
}

export function windowChromeOptions(dark: boolean): BrowserWindowConstructorOptions {
  if (process.platform === 'darwin') {
    return {
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: { x: 12, y: 10 }
    };
  }

  return {
    titleBarStyle: 'hidden',
    titleBarOverlay: titleBarOverlay(dark),
    autoHideMenuBar: true
  };
}

export function applyWindowChrome(window: BrowserWindow, dark: boolean): void {
  if (process.platform === 'darwin') return;

  window.setTitleBarOverlay(titleBarOverlay(dark));
  window.setAutoHideMenuBar(true);
  window.setMenuBarVisibility(false);
  window.setMenu(null);
}
