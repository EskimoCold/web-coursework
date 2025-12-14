import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-ga4', () => {
  const initialize = vi.fn();
  const send = vi.fn();
  const event = vi.fn();
  return { default: { initialize, send, event } };
});

type ReactGAMock = {
  initialize: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
  event: ReturnType<typeof vi.fn>;
};

const loadModule = async () => {
  const analytics = await import('./googleAnalytics');
  const ReactGA = (await import('react-ga4')).default as ReactGAMock;
  return { analytics, ReactGA };
};

describe('googleAnalytics', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('initializes once and sends page views', async () => {
    const {
      analytics: { initAnalytics, trackPageview },
      ReactGA,
    } = await loadModule();

    initAnalytics();
    expect(ReactGA.initialize).toHaveBeenCalledTimes(1);

    trackPageview('/home');
    expect(ReactGA.initialize).toHaveBeenCalledTimes(1);
    expect(ReactGA.send).toHaveBeenCalledWith(
      expect.objectContaining({
        hitType: 'pageview',
        page: '/home',
      }),
    );

    trackPageview('/settings?tab=profile');
    expect(ReactGA.initialize).toHaveBeenCalledTimes(1);
    expect(ReactGA.send).toHaveBeenCalledTimes(2);
  });

  it('sends custom events', async () => {
    const {
      analytics: { trackEvent },
      ReactGA,
    } = await loadModule();

    trackEvent({
      action: 'sidebar_click',
      category: 'navigation',
      label: 'Главная',
      value: 1,
    });

    expect(ReactGA.initialize).toHaveBeenCalledTimes(1);
    expect(ReactGA.event).toHaveBeenCalledWith(
      'sidebar_click',
      expect.objectContaining({
        event_category: 'navigation',
        event_label: 'Главная',
        value: 1,
      }),
    );
  });
});
