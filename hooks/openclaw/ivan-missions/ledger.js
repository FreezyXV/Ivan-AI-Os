import { randomUUID } from 'node:crypto';
const UUID = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const MANAGERS = ['business','career','engineering','finance','knowledge','system'];
const childId = key => typeof key === 'string' && UUID.test(key.split(':').at(-1)) ? key.split(':').at(-1) : null;
function value(result) {
  if (result?.details && typeof result.details === 'object') return result.details;
  for (const c of result?.content ?? []) if (typeof c.text === 'string') { try { return JSON.parse(c.text); } catch {} }
  return result && typeof result === 'object' ? result : {};
}
export function createMissionLedger({ initial = [], persist = () => {}, now = Date.now, capacity = 200 } = {}) {
  const rows = structuredClone(initial);
  const match = (row, run) => typeof run === 'string' && [row.root_run, row.manager_run, row.manager_child].some(id => id && run.includes(id));
  function save() { persist(rows); }
  function after(event, ctx) {
    const run = ctx?.runId ?? event?.runId;
    if (!run || event?.error || ctx?.toolName !== event?.toolName) return;
    const result = value(event.result), stamp = now();
    if (event.toolName === 'ivan_route' && ctx.agentId === 'main') {
      if (!UUID.test(run) || result.status !== 'ROUTED' || !MANAGERS.includes(result.manager) || !['jev','table','mock'].includes(result.provider) || rows.some(r => r.root_run === run)) return;
      if (rows.length >= capacity) {
        const old = rows.findIndex(r => r.delivered || r.failure);
        if (old < 0) return;
        rows.splice(old,1);
      }
      rows.push({ id: randomUUID(), root_run: run, manager: result.manager, provider: result.provider, created_at: stamp, updated_at: stamp });save();return;
    }
    const candidates = rows.filter(r => !r.delivered && match(r,run));
    if (candidates.length !== 1) return;
    const row = candidates[0];
    if (event.toolName === 'sessions_spawn' && result.status === 'accepted' && result.context === 'isolated' && UUID.test(result.runId)) {
      if (ctx.agentId === 'main' && run === row.root_run && event.params?.agentId === 'ivan-'+row.manager && !row.manager_run) {
        row.manager_run = result.runId;row.manager_child = childId(result.childSessionKey);
      } else if (ctx.agentId === 'ivan-'+row.manager && run === row.manager_run && !row.worker_run) {
        row.worker_run = result.runId;
      } else return;
    } else if (event.toolName === 'message' && ctx.agentId === 'main' && row.manager_run && run !== row.root_run && event.params?.action === 'send' && !['target','to','chatId','channel','accountId','threadId'].some(k=>event.params[k]!==undefined)) {
      if (result.status === 'delivery_queued' || result.delivered === false) row.delivery_queued = true;
      else if (result.ok === true && (result.receipt || result.messageId)) {row.delivered = true;row.delivery_queued = false;row.delivered_at = stamp;}
      else return;
    } else return;
    row.updated_at=stamp;save();
  }
  function ended(event) {
    if (!UUID.test(event?.runId??'')) return;
    const row=rows.find(r=>r.manager_run===event.runId||r.worker_run===event.runId);if(!row)return;
    const role=row.manager_run===event.runId?'manager':'worker';
    if (event.outcome === 'ok') row[role+'_returned']=true;
    else if (['error','timeout','killed'].includes(event.outcome)) row.failure=role+'_'+event.outcome;
    else return;
    row.updated_at=now();save();
  }
  function status() {
    return rows.slice(-10).reverse().map(r=>({id:r.id,manager:r.manager,provider:r.provider,
      status:r.delivered?'delivered':r.failure?'failed':r.delivery_queued?'delivery_queued':r.manager_returned?'manager_returned':r.worker_returned?'worker_returned':r.worker_run?'worker_running':r.manager_run?'manager_running':'routed',
      manager_returned:Boolean(r.manager_returned),worker_returned:Boolean(r.worker_returned),
      elapsed_ms:(r.delivered_at??now())-r.created_at,overdue:!r.delivered&&!r.failure&&now()-r.created_at>300000,
      created_at:r.created_at,updated_at:r.updated_at}));
  }
  return {after,ended,status};
}
