// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Set the environment based on NODE_ENV
  environment: process.env.NODE_ENV,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Enable Session Replay in production
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,

  integrations: [
    Sentry.replayIntegration(),
    Sentry.browserTracingIntegration(),
  ],
});
