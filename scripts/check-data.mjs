// 데이터 파일 점검: 역마다 데이터 기준 달(USE_MM)이 올바른지, 0~23시 승차·하차 값이 모두 있는지, 음수가 없는지 확인한다.
import { readFileSync } from "node:fs";
import { usageMonth } from "../stats.mjs";

const file = process.argv[2] ?? "data/subway-hourly-202607.json";
const rows = JSON.parse(readFileSync(file, "utf8")).CardSubwayTime.row;
let problems = 0;
for (const row of rows) {
  if (!usageMonth(row)) {
    console.log(`${row.STTN} USE_MM: ${row.USE_MM}`);
    problems++;
  }
  for (let h = 0; h < 24; h++) {
    for (const kind of ["ON", "OFF"]) {
      const v = row[`HR_${h}_GET_${kind}_NOPE`];
      if (typeof v !== "number" || v < 0) {
        console.log(`${row.STTN} ${h}시 ${kind}: ${v}`);
        problems++;
      }
    }
  }
}
console.log(`역 ${rows.length}곳, 문제 ${problems}건`);
process.exit(problems ? 1 : 0);
