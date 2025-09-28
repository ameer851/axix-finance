// Minimal shared math helpers for investment calculations
export function dailyAmount(principal, dailyProfitPct) {
  const p = Number(principal || 0);
  const r = Number(dailyProfitPct || 0) / 100;
  return p * r;
}
export function expectedTotalActive(daysElapsed, principal, dailyProfitPct) {
  return Number(daysElapsed || 0) * dailyAmount(principal, dailyProfitPct);
}
export function expectedTotalCompleted(duration, principal, dailyProfitPct) {
  return Number(duration || 0) * dailyAmount(principal, dailyProfitPct);
}
