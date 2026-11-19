import {validateRoutingMetadata} from '../../../services/jev-gateway/src/routing-metadata.js';
import {PILOT_STATE} from '../../../shared/pilot-state.mjs';

const managerForTask = Object.freeze({
  unit_test:'engineering', bug_fix:'engineering', code_review:'engineering', build_feature:'engineering', software_design:'engineering',
  job_search:'career', cv_draft:'career', career_positioning:'career',
  market_research:'business', business_validation:'business',
  portfolio_review:'finance', financial_research:'finance',
  topic_research:'knowledge', learning_material:'knowledge',
  organize_notes:'system', configure_agent:'system', configure_skill:'system', maintain_infrastructure:'system'
});

export function routePilotTask(params) {
  const {requested_tasks,urgency,details_available} = validateRoutingMetadata(params);
  const managers = requested_tasks.map(task => managerForTask[task]).filter(Boolean);
  const active = managers.find(manager => !PILOT_STATE.excludedRoutes.includes(manager) && !PILOT_STATE.pausedRoutes.includes(manager));
  const base={provider:'deterministic-kernel',urgency:{none:0,soon:1,immediate:2}[urgency],
    needs_details_probability:details_available?0:1};
  if (requested_tasks.includes('portfolio_review'))
    return {...base,status:'REVIEW',manager:null,manager_confidence:null,reason_code:'PILOT_PRIVATE_FINANCE'};
  if (active) return {...base,status:'ROUTED',manager:active,manager_confidence:1};
  const reason = managers.some(manager => PILOT_STATE.excludedRoutes.includes(manager)) ? 'PILOT_ROUTE_EXCLUDED' :
    managers.some(manager => PILOT_STATE.pausedRoutes.includes(manager)) ? 'PILOT_ROUTE_PAUSED' : 'ROUTING_DETAILS_REQUIRED';
  return {...base,status:'REVIEW',manager:null,manager_confidence:null,reason_code:reason};
}
