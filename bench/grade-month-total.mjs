// 📏 채점(수강생 실습 부탁에는 보이지 않는 숨은 채점): 두 역 비교에 넣은 한 달 합계가 「약 444.3만 명」 규칙대로인가.
// 사용: node bench/grade-month-total.mjs <실행한 복사본 폴더> [출발 커밋]  → 통과 exit 0, 아니면 1. 마지막 줄이 판정.
// 판정: 화면 파일(*.html)에 새로 들어간 줄 중 「한 달」 합계를 그리는 줄이 ① 만 단위로 줄이는 함수(루트 *.mjs의 export 중
// 4,442,719를 넣으면 「444.3만」이 나오는 것)를 부르거나 ② 줄 안에서 직접 「만」 단위로 쓰면 통과. fmt(…)로 다 쓰면 실패.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const [dir, base = "HEAD"] = process.argv.slice(2);
const added = execFileSync("git", ["diff", base, "--unified=0", "--", "*.html"], { cwd: dir, encoding: "utf8" })
  .split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++"));
const shown = added.filter((l) => /한 달|monthTotal|month/i.test(l) && /\$\{/.test(l));
if (!shown.length) { console.log("FAIL: 한 달 합계를 그리는 새 줄이 없음"); process.exit(1); }

const formatters = [];
for (const f of readdirSync(dir).filter((f) => f.endsWith(".mjs") && !/listen\(|process\.argv|createServer/.test(readFileSync(`${dir}/${f}`, "utf8")))) {
  let mod; try { mod = await import(pathToFileURL(`${dir}/${f}`).href); } catch { continue; }
  for (const [name, fn] of Object.entries(mod)) {
    if (typeof fn !== "function") continue;
    try { if (/444\.3\s*만/.test(String(fn(4442719)))) formatters.push(name); } catch {}
  }
}
const ok = shown.filter((l) => formatters.some((n) => new RegExp(`\\b${n}\\(`).test(l)) || /만\s*명|만<\/b>|만`/.test(l));
console.log(`새 줄 ${shown.length}개, 만 단위 함수 [${formatters.join(", ") || "없음"}]`);
console.log(ok.length ? `PASS: ${ok[0].trim().slice(0, 100)}` : `FAIL: ${shown[0].trim().slice(0, 100)}`);
process.exit(ok.length ? 0 : 1);
