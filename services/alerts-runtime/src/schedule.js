const formatter=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',weekday:'short',hourCycle:'h23'});
export function parisDay(value){
  const p=Object.fromEntries(formatter.formatToParts(new Date(value)).map(v=>[v.type,v.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
export function digestWindow(now=new Date(),options={}){
  const scheduled=scheduleSlots(now,options).digest;
  if(scheduled)return {key:scheduled};
  // One catch-up batch after waking, using yesterday's stable keys. New briefs
  // from this morning still wait for tonight; missed days are never replayed.
  const today=parisDay(now),previous=new Date(`${today}T00:00:00Z`);
  previous.setUTCDate(previous.getUTCDate()-1);
  return {key:`digest:${previous.toISOString().slice(0,10)}`,readyBeforeDay:today};
}
export function digestEligible(row,{readyBeforeDay}={}){
  return !readyBeforeDay||parisDay(row.updated)<readyBeforeDay;
}
export function scheduleSlots(now=new Date(),{digestNow=false}={}){
  const p=Object.fromEntries(formatter.formatToParts(now).map(v=>[v.type,v.value]));
  const day=`${p.year}-${p.month}-${p.day}`,minutes=Number(p.hour)*60+Number(p.minute);
  const slot={feeds:`feeds:${day}:${Math.floor(Number(p.hour)/6)}`};
  if(minutes>=450)slot.finance=`finance:${day}`;
  // One ISO-week slot survives a missed Monday. Only the current week is due;
  // the ledger retains the lease and bounded retry, never past-week replay.
  if(p.weekday!=='Mon'||minutes>=540){
   const date=new Date(`${day}T00:00:00Z`),weekday=date.getUTCDay()||7;
   date.setUTCDate(date.getUTCDate()+4-weekday);
   const year=date.getUTCFullYear(),first=new Date(Date.UTC(year,0,1));
   const week=Math.ceil(((date-first)/86400000+1)/7);
   slot.business=`business:${year}-W${String(week).padStart(2,'0')}`;
  }
  if(minutes>=1170||digestNow)slot.digest=`digest:${day}`;
  return slot;
}
