// 📏 날리지 팩토리 반영 전/후: 같은 부탁(2일차 이슈)을 지식 PR 머지 전 커밋 / 뒤 커밋에서 각각 ROUNDS번.
// 한 번에 하나씩 돈다(메모리). 채점은 bench/grade-month-total.mjs(규칙대로 한 달 합계를 줄여 썼나) + npm test.
// 사용: node bench/knowledge-ab.mjs <반영 전 커밋> <반영 후 커밋>  (결과는 bench/results/knowledge-ab.json)
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";

const [BEFORE, AFTER] = process.argv.slice(2);
if (!BEFORE || !AFTER) throw new Error("사용: node bench/knowledge-ab.mjs <반영 전 커밋> <반영 후 커밋>");
const PROMPT = process.env.AB_PROMPT ?? "두 역 비교 요약에 두 역의 9월 한 달 승하차 합계도 보여 줘. 질문하지 말고 진행하고, 끝나면 npm test로 확인해 줘.";
const ROUNDS = Number(process.env.AB_ROUNDS ?? 3);
const ROOT = process.cwd();
const CLEAN = process.env.AB_CLEAN === "1";  // 1이면 커밋 기록 없는 깨끗한 판
const OUT = CLEAN ? "knowledge-ab-clean" : "knowledge-ab";
const sh = (cmd, args, cwd) => spawnSync(cmd, args, { cwd, encoding: "utf8" });

function run(arm, commit, round) {
  const dir = `/tmp/${OUT}/${arm === "반영 전" ? "before" : "after"}-${round}`;
  rmSync(dir, { recursive: true, force: true });
  if (CLEAN) {
    // 깨끗한 판: 그 커밋의 파일만 꺼내 새 저장소에 커밋 하나(중립 메시지). 커밋 기록·다른 브랜치·원격이 조건을 새지 않게.
    mkdirSync(dir, { recursive: true });
    execFileSync("sh", ["-c", `git -C "${ROOT}" archive ${commit} | tar -x -C "${dir}"`]);
    for (const a of [["init", "-q"], ["add", "-A"], ["-c", "user.name=bench", "-c", "user.email=bench@example.invalid", "commit", "-qm", "작업 시작"]]) execFileSync("git", a, { cwd: dir });
  } else {
    execFileSync("git", ["clone", "-q", ROOT, dir]);
    execFileSync("git", ["checkout", "-q", commit], { cwd: dir });
  }
  const base = execFileSync("git", ["rev-parse", "HEAD"], { cwd: dir, encoding: "utf8" }).trim();
  const t0 = Date.now();
  const p = sh("claude", ["-p", PROMPT, "--output-format", "json", "--permission-mode", "acceptEdits",
    "--allowedTools", "Read", "Grep", "Glob", "Edit", "Write", "Bash(npm test:*)", "Bash(node:*)", "Bash(grep:*)", "Bash(sed -n:*)", "Bash(ls:*)", "Bash(cat:*)"], dir);
  const result = JSON.parse(p.stdout);
  const test = sh("npm", ["test"], dir).stdout;
  const n = (k) => Number(test.match(new RegExp(`ℹ ${k} (\\d+)`))?.[1] ?? NaN);
  const grade = sh("node", [`${ROOT}/bench/grade-month-total.mjs`, dir, base], ROOT);
  const row = { 조건: arm, 회: round, 초: +((Date.now() - t0) / 1000).toFixed(1), 턴: result.num_turns,
    입력토큰: (result.usage.input_tokens ?? 0) + (result.usage.cache_read_input_tokens ?? 0) + (result.usage.cache_creation_input_tokens ?? 0),
    출력토큰: result.usage.output_tokens, 테스트실패: n("fail"), 규칙대로: grade.status === 0, 채점: grade.stdout.trim().split("\n").pop() };
  console.log(JSON.stringify(row));
  return row;
}

const rows = [];
for (let r = 1; r <= ROUNDS; r++) for (const [arm, c] of [["반영 전", BEFORE], ["반영 후", AFTER]]) rows.push(run(arm, c, r));
console.table(rows);
const avg = ["반영 전", "반영 후"].map((arm) => {
  const rs = rows.filter((r) => r.조건 === arm), m = (k) => +(rs.reduce((s, r) => s + r[k], 0) / rs.length).toFixed(1);
  return { 조건: arm, 규칙대로: `${rs.filter((r) => r.규칙대로).length}/${rs.length}`, 평균초: m("초"), 평균입력토큰: Math.round(m("입력토큰")), 평균턴: m("턴") };
});
console.table(avg);
mkdirSync("bench/results", { recursive: true });
writeFileSync(`bench/results/${OUT}.json`, JSON.stringify({ clean: CLEAN, before: BEFORE, after: AFTER, prompt: PROMPT, rows, avg }, null, 2) + "\n");
