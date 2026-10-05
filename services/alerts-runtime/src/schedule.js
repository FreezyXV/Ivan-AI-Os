const formatter=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',weekday:'short',hourCycle:'h23'});
export function scheduleSlots(now=new Date(),{digestNow=false}={}){
  const p=Object.fromEntries(formatter.formatToParts(now).map(v=>[v.type,v.value]));
  const day=`${p.year}-${p.month}-${p.day}`,minutes=Number(p.hour)*60+Number(p.minute);
  const slot={feeds:`feeds:${day}:${Math.floor(Number(p.hour)/6)}`};
  if(minutes>=450)slot.finance=`finance:${day}`;
  // A wake-up catches up today's slot once, never all missed past slots.
  if(p.weekday==='Mon'&&minutes>=540)slot.business=`business:${day}`;
  if(minutes>=1170||digestNow)slot.digest=`digest:${day}`;
  return slot;
}
