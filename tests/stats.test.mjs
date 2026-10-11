import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { HOURS, busiestHours, quietestHours, usageMonth } from "../stats.mjs";

const rows = JSON.parse(readFileSync("data/subway-hourly-202607.json", "utf8")).CardSubwayTime.row;
const seoul = rows.find((r) => r.STTN === "서울역");

// 테스트용 행: 모든 시간대를 0으로 두고 일부만 채운다.
const fakeRow = (totals) => {
  const row = {};
  for (const h of HOURS) {
    row[`HR_${h}_GET_ON_NOPE`] = totals[h] ?? 0;
    row[`HR_${h}_GET_OFF_NOPE`] = 0;
  }
  return row;
};

test("가장 한가한 때는 운행하지 않는 02·03시를 빼고 고른다", () => {
  for (const row of rows) assert.ok(!quietestHours(row).some((h) => h === 2 || h === 3), row.STTN);
  assert.deepEqual(quietestHours(seoul), [1]);
});

test("가장 한가한 때가 동률이면 모두 돌려준다", () => {
  assert.deepEqual(quietestHours(fakeRow({ 4: 5, 10: 9, 1: 5 })), [4, 1]);
});

test("서울역은 18시 승차, 08시 하차가 가장 많다", () => {
  assert.deepEqual(busiestHours(seoul, "ON"), [18]);
  assert.deepEqual(busiestHours(seoul, "OFF"), [8]);
});

test("데이터 기준 달은 USE_MM에서 읽고 그 달의 일수를 센다", () => {
  assert.deepEqual(usageMonth(seoul), { year: 2026, month: 7, days: 31, label: "2026년 7월" });
  assert.equal(usageMonth({ USE_MM: "202606" }).days, 30);
  assert.equal(usageMonth({ USE_MM: "202402" }).days, 29);
  assert.equal(usageMonth({ USE_MM: 202602 }).label, "2026년 2월");
});

test("데이터 기준 달 형식이 맞지 않으면 null이다", () => {
  for (const USE_MM of [undefined, null, "", "2026-07", "202613", "202600", "2026070"]) {
    assert.equal(usageMonth({ USE_MM }), null, String(USE_MM));
  }
});
