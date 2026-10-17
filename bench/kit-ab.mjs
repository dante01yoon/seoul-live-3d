// 📏 같은 부탁을 하네스 키트 없이 / 있게 한 번씩 실행해 숫자로 비교한다.
// 사용: node bench/kit-ab.mjs  (저장소 루트에서. 결과는 bench/results/*.json)
import { execFileSync, spawn } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";

const PROMPT = "SPEC.md 2단계를 구현해 줘. 질문하지 말고 스펙대로 진행하고, 끝나면 npm test로 확인해 줘";
const ARMS = {
  "키트 없음": { dir: "/tmp/kit-ab/nokit", settings: { enabledPlugins: { "superpowers@claude-plugins-official": false } } },
  "키트 있음": { dir: "/tmp/kit-ab/kit", settings: {} },
};

// 1) 지금 커밋을 깨끗한 복사본 두 개로 (두 쪽 출발점이 똑같다)
for (const { dir } of Object.values(ARMS)) {
  rmSync(dir, { recursive: true, force: true });
  execFileSync("git", ["clone", "-q", ".", dir]);
}

// 2) 같은 부탁을 동시에 실행. 다른 건 플러그인 설정 한 가지뿐
const run = (name, { dir, settings }) => new Promise((resolve) => {
  const t0 = Date.now();
  console.log(`${name}: 시작`);
  const p = spawn("claude", ["-p", PROMPT, "--output-format", "json", "--permission-mode", "auto", "--settings", JSON.stringify(settings)], { cwd: dir });
  let out = "";
  p.stdout.on("data", (b) => (out += b));
  p.on("close", () => {
    const r = JSON.parse(out);
    const test = (() => { try { return execFileSync("npm", ["test"], { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); } catch (e) { return e.stdout; } })();
    const n = (k) => Number(test.match(new RegExp(`ℹ ${k} (\\d+)`))?.[1] ?? NaN);
    const diff = execFileSync("git", ["diff", "--shortstat", "HEAD"], { cwd: dir, encoding: "utf8" }).trim();
    console.log(`${name}: 끝 (${((Date.now() - t0) / 60000).toFixed(1)}분)`);
    resolve({ name, 분: +((Date.now() - t0) / 60000).toFixed(1), 비용달러: +r.total_cost_usd.toFixed(2), 턴: r.num_turns,
      출력토큰: r.usage.output_tokens, 테스트: `${n("pass")}/${n("tests")} 통과 · 실패 ${n("fail")}`, 바뀐줄: diff || "없음" });
  });
});
const rows = await Promise.all(Object.entries(ARMS).map(([name, arm]) => run(name, arm)));

// 3) 표로 보고 파일로 남긴다
mkdirSync("bench/results", { recursive: true });
writeFileSync("bench/results/kit-ab.json", JSON.stringify(rows, null, 2));
console.table(rows);
