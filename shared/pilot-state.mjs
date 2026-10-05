// Operator decisions, 2026-10-05. Deferred projects do not disable existing
// memory tools. A paused role stays defined and keeps its files for later use.
export const PILOT_STATE = Object.freeze({
  version: 'mac-pilot-20261005-v1',
  pausedRoutes: Object.freeze(['career']),
  deferredProjects: Object.freeze(['knowledge', 'ovh']),
  deployment: 'mac'
});
