import { constants, openSync, closeSync, fstatSync, statSync, readFileSync, writeFileSync, fsyncSync, renameSync, unlinkSync } from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";

// Official Jev 1.13 price checked 2026-09-29: USD 0.042 / million input
// tokens; output free. Euro figures are planning estimates, not invoices.
export const PRICED_MODEL = "jev-1.13.0";
export const MAX_INPUT_TOKENS = 65_536;
export const APPROVED_MONTHLY_MICRO_EUR = 10_000_000;
export class BudgetError extends Error {
  constructor(code) { super(code); this.code = code; }
}

export function createJevBudget({ filename, monthlyMicroEuro = APPROVED_MONTHLY_MICRO_EUR, usdToEurMillis = 1000, now = () => new Date() } = {}) {
  if (typeof filename !== "string" || !path.isAbsolute(filename) || !Number.isSafeInteger(monthlyMicroEuro) || monthlyMicroEuro < 1 || monthlyMicroEuro > APPROVED_MONTHLY_MICRO_EUR ||
      !Number.isSafeInteger(usdToEurMillis) || usdToEurMillis < 1000 || usdToEurMillis > 2000) throw new BudgetError("BUDGET_NOT_CONFIGURED");
  const directory = path.dirname(filename);
  const charge = tokens => Math.ceil(tokens * 42 * usdToEurMillis / 1_000_000);
  const month = () => now().toISOString().slice(0, 7);
  function check(stat, isDirectory = false) {
    if (!(isDirectory ? stat.isDirectory() : stat.isFile()) || stat.uid !== process.getuid?.() || (stat.mode & 0o077) || (!isDirectory && stat.nlink !== 1)) throw new BudgetError("BUDGET_STORAGE_UNAVAILABLE");
  }
  function read() {
    let fd;
    try {
      fd = openSync(filename, constants.O_RDONLY | constants.O_NOFOLLOW);
      const stat = fstatSync(fd); check(stat);
      if (stat.size > 8192) throw new BudgetError("BUDGET_STORAGE_UNAVAILABLE");
      const state = JSON.parse(readFileSync(fd, "utf8"));
      if (state.version !== 1 || state.model !== PRICED_MODEL || state.usd_to_eur_millis !== usdToEurMillis || Object.keys(state).sort().join() !== "model,months,usd_to_eur_millis,version" ||
          !state.months || typeof state.months !== "object" || Array.isArray(state.months) || Object.keys(state.months).length > 2) throw new BudgetError("BUDGET_STORAGE_UNAVAILABLE");
      for (const [key, value] of Object.entries(state.months)) {
        if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(key) || !value || Object.keys(value).sort().join() !== "calls,charged_micro_eur,reported_input_tokens,usage_unknown_calls" ||
            Object.values(value).some(v => !Number.isSafeInteger(v) || v < 0) || value.usage_unknown_calls > value.calls) throw new BudgetError("BUDGET_STORAGE_UNAVAILABLE");
      }
      return state;
    } catch (error) {
      if (error.code === "ENOENT") return { version: 1, model: PRICED_MODEL, usd_to_eur_millis: usdToEurMillis, months: {} };
      throw error;
    } finally { if (fd !== undefined) closeSync(fd); }
  }
  function transaction(update) {
    let lock, temp;
    try {
      check(statSync(directory), true);
      try { lock = openSync(`${filename}.lock`, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600); }
      catch (error) { if (error.code === "EEXIST") throw new BudgetError("BUDGET_BUSY"); throw error; }
      const state = read();
      const result = update(state);
      temp = path.join(directory, `.jev-budget-${randomUUID()}.tmp`);
      const fd = openSync(temp, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
      try { writeFileSync(fd, JSON.stringify(state)); fsyncSync(fd); }
      finally { closeSync(fd); }
      renameSync(temp, filename); temp = null;
      const dir = openSync(directory, constants.O_RDONLY);
      try { fsyncSync(dir); } finally { closeSync(dir); }
      return result;
    } catch (error) {
      throw error instanceof BudgetError ? error : new BudgetError("BUDGET_STORAGE_UNAVAILABLE");
    } finally {
      if (temp) try { unlinkSync(temp); } catch {}
      if (lock !== undefined) { closeSync(lock); unlinkSync(`${filename}.lock`); }
    }
  }
  return {
    reserve() {
      const current = month(), reserved = charge(MAX_INPUT_TOKENS);
      transaction(state => {
        if (Object.keys(state.months).some(key => key > current)) throw new BudgetError("BUDGET_CLOCK_ROLLBACK");
        // Keep the active and previous accounting month; an in-flight request
        // settling across midnight retains the month in which it was reserved.
        const previous = new Date(`${current}-01T00:00:00Z`); previous.setUTCMonth(previous.getUTCMonth() - 1);
        for (const key of Object.keys(state.months)) if (![current, previous.toISOString().slice(0, 7)].includes(key)) delete state.months[key];
        const bucket = state.months[current] ??= { charged_micro_eur: 0, calls: 0, reported_input_tokens: 0, usage_unknown_calls: 0 };
        if (bucket.charged_micro_eur + reserved > monthlyMicroEuro) throw new BudgetError("JEV_BUDGET_EXHAUSTED");
        bucket.charged_micro_eur += reserved; bucket.calls++; bucket.usage_unknown_calls++;
      });
      let completed = false;
      return {
        complete(inputTokens) {
          if (completed) throw new BudgetError("BUDGET_RECEIPT_USED");
          completed = true;
          // Failed, interrupted or unmetered requests retain the full reserve,
          // including across process restarts; no assumed refund or retry.
          if (!Number.isSafeInteger(inputTokens) || inputTokens < 1 || inputTokens > MAX_INPUT_TOKENS) return;
          transaction(state => {
            const bucket = state.months[current];
            if (!bucket || bucket.usage_unknown_calls < 1 || bucket.charged_micro_eur < reserved) throw new BudgetError("BUDGET_STORAGE_UNAVAILABLE");
            bucket.charged_micro_eur -= reserved - charge(inputTokens);
            bucket.reported_input_tokens += inputTokens;
            bucket.usage_unknown_calls--;
          });
        }
      };
    },
    status() {
      try {
        check(statSync(directory), true);
        const current = month();
        const state = read();
        if (Object.keys(state.months).some(key => key > current)) throw new BudgetError("BUDGET_CLOCK_ROLLBACK");
        const bucket = state.months[current] ?? { charged_micro_eur: 0, calls: 0, reported_input_tokens: 0, usage_unknown_calls: 0 };
        return { month: current, currency: "EUR", estimate: true, model: PRICED_MODEL, monthly_budget_micro_eur: monthlyMicroEuro, usd_to_eur_millis: usdToEurMillis,
          monthly_budget_eur: monthlyMicroEuro / 1_000_000, charged_estimate_eur: bucket.charged_micro_eur / 1_000_000,
          remaining_estimate_eur: Math.max(0, monthlyMicroEuro - bucket.charged_micro_eur) / 1_000_000, ...bucket };
      } catch { throw new BudgetError("BUDGET_STORAGE_UNAVAILABLE"); }
    }
  };
}

let runtime, runtimeKey;
export function getRuntimeBudget() {
  const filename = process.env.IVAN_JEV_BUDGET_PATH;
  const conversion = Number(process.env.JEV_USD_TO_EUR_BUDGET_RATE || 1);
  if (!Number.isFinite(conversion) || conversion < 1 || conversion > 2) throw new BudgetError("BUDGET_NOT_CONFIGURED");
  const key = `${filename}\0${conversion}`;
  if (!runtime || runtimeKey !== key) {
    runtime = createJevBudget({ filename, usdToEurMillis: Math.round(conversion * 1000) });
    runtimeKey = key;
  }
  return runtime;
}
