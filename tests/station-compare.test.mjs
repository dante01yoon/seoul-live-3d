import assert from "node:assert/strict";
import { test } from "node:test";
import { compareDaily, compareMonthLine, compareSearch, findStationByName, readCompareParam, riderRanks } from "../station-compare.mjs";

test("두 역 비교의 한 달 합계 줄은 만 명 단위(manPeople)로 쓴다", () => {
  assert.equal(
    compareMonthLine("2026년 9월", [{ name: "강남", monthTotal: 4443210 }, { name: "작은역", monthTotal: 9876 }]),
    "2026년 9월 한 달 합계 강남 <b>약 444.3만 명</b> · 작은역 <b>9,876명</b>",
  );
});

test("한 달 합계 줄은 역 이름과 달 문구를 이스케이프한다", () => {
  const s = compareMonthLine("9월&", [{ name: "<i>", monthTotal: 1 }, { name: "a", monthTotal: 2 }]);
  assert.ok(!s.includes("<i>") && s.includes("&#60;i&#62;") && s.startsWith("9월&#38;"));
});

test("합계·피크·더 많은 칸 수·차이가 가장 큰 칸", () => {
  const r = compareDaily([10, 50, 30, 0], [20, 10, 30, 0]);
  assert.deepEqual(r, { totalA: 90, totalB: 60, peakA: 1, peakB: 2, moreA: 1, moreB: 1, widest: 1 });
});

test("피크가 동률이면 앞 칸", () => {
  assert.equal(compareDaily([5, 9, 9], [1, 1, 1]).peakA, 1);
});

test("전부 0이면 피크 -1, 같은 값이면 widest -1", () => {
  const r = compareDaily([0, 0], [0, 0]);
  assert.equal(r.peakA, -1);
  assert.equal(r.widest, -1);
  assert.equal(r.moreA + r.moreB, 0);
});

test("시간대 수가 다르면 오류", () => {
  assert.throws(() => compareDaily([1, 2], [1]));
});

test("주소의 compare 파라미터 읽기", () => {
  assert.deepEqual(readCompareParam("?compare=강남,홍대입구"), ["강남", "홍대입구"]);
  assert.deepEqual(readCompareParam("?compare=%EA%B0%95%EB%82%A8%2C%ED%99%8D%EB%8C%80%EC%9E%85%EA%B5%AC"), ["강남", "홍대입구"]);
  assert.deepEqual(readCompareParam("?compare= 강남 ,,"), ["강남"]);
  assert.deepEqual(readCompareParam("?x=1"), []);
});

test("compare만 바꾸고 다른 파라미터는 남긴다", () => {
  assert.equal(compareSearch("", ["강남", "홍대입구"]), `?compare=${encodeURIComponent("강남")},${encodeURIComponent("홍대입구")}`);
  assert.equal(compareSearch("?x=1&compare=a,b", ["c"]), "?x=1&compare=c");
  assert.equal(compareSearch("?compare=a,b", []), "");
  assert.deepEqual(readCompareParam(compareSearch("?x=1", ["잠실(송파구청)", "서울역"])), ["잠실(송파구청)", "서울역"]);
});

test("주소의 역 이름 찾기: 같은 이름, 부역명 뺀 이름만", () => {
  const entries = [{ name: "강남" }, { name: "강남구청" }, { name: "잠실(송파구청)" }];
  assert.equal(findStationByName(entries, "강남"), entries[0]);
  assert.equal(findStationByName(entries, "잠실"), entries[2]);
  assert.equal(findStationByName(entries, "잠실(송파구청)"), entries[2]);
  assert.equal(findStationByName(entries, "ㄱㄴ"), null);
  assert.equal(findStationByName(entries, "강"), null);
});

test("하루 평균 승하차 순위: 많은 역이 1위, 동률은 같은 순위, entries 순서대로", () => {
  const entries = [{ riders: 50 }, { riders: 300 }, { riders: 120 }, { riders: 120 }, { riders: 0 }];
  assert.deepEqual(riderRanks(entries), [4, 1, 2, 2, 5]);
  assert.deepEqual(riderRanks([]), []);
});

test("순위는 화면에 보이는 반올림 값으로 매긴다", () => {
  // 둘 다 "1,234명"으로 보이므로 같은 순위, 1,235명(1234.5)은 그보다 위
  assert.deepEqual(riderRanks([{ riders: 1234.2 }, { riders: 1234.4 }, { riders: 1234.5 }]), [2, 2, 1]);
});
