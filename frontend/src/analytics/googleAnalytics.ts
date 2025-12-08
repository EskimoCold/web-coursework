import ReactGA from 'react-ga4';

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
const isBrowser = typeof window !== 'undefined';
let initialized = false;

const canTrack = () => isBrowser && Boolean(measurementId);

export const initAnalytics = () => {
  if (initialized || !canTrack()) return;

  ReactGA.initialize([{ trackingId: measurementId }], {
    gaOptions: { send_page_view: false },
  });

  initialized = true;
  console.log("INIT ANALYTICS!!")
};

export const trackPageview = (path: string) => {
  if (!canTrack()) return;
  if (!initialized) initAnalytics();

  ReactGA.send({
    hitType: 'pageview',
    page: path,
    location: window.location.href,
    title: document.title,
  });
};

interface TrackEventOptions {
  action: string;
  category?: string;
  label?: string;
  value?: number;
}

export const trackEvent = ({ action, category, label, value }: TrackEventOptions) => {
  if (!canTrack() || !action) return;
  if (!initialized) initAnalytics();

  ReactGA.event(action, {
    event_category: category,
    event_label: label,
    value,
  });
};
