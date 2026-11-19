export function ownerDm(ctx, config) {
  return ctx?.channel==='telegram' && ctx.isAuthorizedSender===true &&
    typeof config?.ownerId==='string' && /^\d{1,20}$/.test(config.ownerId) &&
    ctx.senderId===config.ownerId && ctx.from===`telegram:${config.ownerId}` &&
    ctx.accountId===config.accountId && ctx.messageThreadId===undefined && ctx.threadParentId===undefined;
}
