import { createApp } from '../server/dist/app.js';

let appInstance = null;

function getApp() {
  if (!appInstance) {
    appInstance = createApp();
  }
  return appInstance;
}

/**
 * Vercel Serverless Function entrypoint for PromptWise Express API.
 * Maps all /api/* requests to the Express application instance.
 */
export default function handler(req, res) {
  const app = getApp();

  // When Vercel rewrites routes, x-matched-path captures the original client request path
  const queryIndex = (req.url || '').indexOf('?');
  const queryString = queryIndex !== -1 ? req.url.slice(queryIndex) : '';

  let pathname = req.headers['x-matched-path'] || (req.url ? req.url.split('?')[0] : '/api');
  if (!pathname.startsWith('/api')) {
    pathname = `/api${pathname.startsWith('/') ? '' : '/'}${pathname}`;
  }
  req.url = pathname + queryString;

  return app(req, res);
}
