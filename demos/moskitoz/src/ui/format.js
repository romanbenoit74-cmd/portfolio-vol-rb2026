// UI number formats (pure, tested): French thousands with narrow no-break spaces, run time as mm:ss.d.
export const fmtInt = (n) => { const v = Math.max(0, Math.round(n)); return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
export const fmtTime = (t) => {
  const d = Math.max(0, Math.round(t * 10)), m = Math.floor(d / 600), s = (d - m * 600) / 10; // tenths first: 59.96 s -> 01:00.0, never 00:60.0
  return String(m).padStart(2, '0') + ':' + s.toFixed(1).padStart(4, '0');
};
