// Operating scope. Existing project and vault files remain separate from routing.
export const PILOT_STATE = Object.freeze({
  version: 'mac-pilot-20261119-v2',
  pausedRoutes: Object.freeze(['career']),
  excludedRoutes: Object.freeze(['knowledge']),
  deferredProjects: Object.freeze(['ovh']),
  deployment: 'mac'
});
