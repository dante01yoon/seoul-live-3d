// 역 요약 카드에 쓰는 계산. 브라우저(index.html)와 테스트가 함께 쓴다.

// 운행 하루는 04시에 시작해서 다음 날 03시에 끝난다.
export const HOURS = [...Array(24)].map((_, i) => (i + 4) % 24);

// kind는 "ON"(승차) 또는 "OFF"(하차)
export const count = (row, h, kind) => row[`HR_${h}_GET_${kind}_NOPE`];
export const total = (row, h) => count(row, h, "ON") + count(row, h, "OFF");

// value가 가장 앞서는(better) 시간대를 모두 HOURS 순서로 돌려준다. 동률이면 여러 개다.
function bestHours(hours, value, better) {
  let best = [];
  for (const h of hours) {
    if (!best.length || better(value(h), value(best[0]))) best = [h];
    else if (value(h) === value(best[0])) best.push(h);
  }
  return best;
}

export const busiestHours = (row, kind) => bestHours(HOURS, (h) => count(row, h, kind), (a, b) => a > b);

// 승하차가 0명인 시간대는 운행하지 않는 때라서 후보에서 뺀다.
export const quietestHours = (row) =>
  bestHours(HOURS.filter((h) => total(row, h) > 0), (h) => total(row, h), (a, b) => a < b);

// 데이터 기준 달. USE_MM("202607")을 읽어 연·월·그 달의 일수와 표시 문구를 돌려준다.
// 형식이 맞지 않으면 null이다.
export function usageMonth(row) {
  const m = /^(\d{4})(\d{2})$/.exec(String(row.USE_MM ?? ""));
  if (!m) return null;
  const year = Number(m[1]), month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { year, month, days: new Date(year, month, 0).getDate(), label: `${year}년 ${month}월` };
}
