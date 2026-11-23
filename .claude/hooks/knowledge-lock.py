#!/usr/bin/env python3
"""지식 잠금 훅(PreToolUse): 작업 에이전트가 지식 파일을 고치지 못하게 막는다.

지식 = CLAUDE.md(어느 폴더든), .claude/rules·skills·agents·hooks, .claude/settings.json, scripts/curator.
막으면 이유를 stderr에 쓰고 exit 2 — 클로드는 그 말을 받고 /knowledge-flag로 신고한다.
큐레이터(scripts/curator가 FACTORY_ROLE=curator로 실행)만 통과한다. 큐레이터가 무엇을 바꿨는지는
scripts/curator가 끝난 뒤 경로를 다시 검사한다.

python3 .claude/hooks/knowledge-lock.py --self-test 로 판정을 확인할 수 있다.
"""

import json
import os
import re
import sys
import time

KNOWLEDGE = re.compile(r"(^|/)(CLAUDE\.md|\.claude/(rules|skills|agents|hooks)/.+|\.claude/settings\.json|scripts/curator)$")
# shortcut: 셸 명령은 「지식 경로 + 쓰기 기호」가 함께 있을 때만 잡는다. 우회가 잦아지면 셸 쓰기를 허용 목록으로 바꾼다.
SHELL_WRITE = re.compile(r"(>|\btee\b|\bsed\s+-i|\bmv\b|\bcp\b|\brm\b|\bperl\s+-pi)")
SHELL_PATH = re.compile(r"(CLAUDE\.md|\.claude/(rules|skills|agents|hooks)/|\.claude/settings\.json|scripts/curator)")


def blocked(e):
    ti = e.get("tool_input") or {}
    if e.get("tool_name") == "Bash":
        cmd = ti.get("command", "")
        return cmd[:80] if SHELL_PATH.search(cmd) and SHELL_WRITE.search(cmd) else None
    path = ti.get("file_path") or ti.get("notebook_path") or ""
    root = os.path.realpath(e.get("cwd") or ".")
    full = os.path.realpath(path) if path else ""
    if not full.startswith(root + os.sep):
        return None  # 프로젝트 밖(~/.claude 등)은 이 훅이 다루지 않는다
    return os.path.relpath(full, root) if KNOWLEDGE.search(full) else None


def self_test():
    cwd = "/r"
    def case(tool, **ti):
        return blocked({"tool_name": tool, "cwd": cwd, "tool_input": ti})
    assert case("Edit", file_path="/r/CLAUDE.md") == "CLAUDE.md"
    assert case("Write", file_path="/r/.claude/rules/subway-page.md")
    assert case("Edit", file_path="/r/.claude/worktrees/issue-7/data/CLAUDE.md")
    assert case("Edit", file_path="/r/.claude/worktrees/issue-7/.claude/skills/tdd/SKILL.md")
    assert case("Edit", file_path="/r/subway.html") is None
    assert case("Edit", file_path="/r/.claude/worktrees/issue-7/station-compare.mjs") is None
    assert case("Write", file_path="/elsewhere/CLAUDE.md") is None
    assert case("Bash", command="echo x >> .claude/rules/bike.md")
    assert case("Bash", command="cat .claude/rules/bike.md") is None
    assert case("Bash", command="npm test > /tmp/out") is None
    print("self-test ok")


if __name__ == "__main__":
    if "--self-test" in sys.argv:
        self_test()
        sys.exit(0)
    e = json.load(sys.stdin)
    if os.environ.get("FACTORY_ROLE") == "curator":
        sys.exit(0)
    hit = blocked(e)
    if not hit:
        sys.exit(0)
    log = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "trace.log")
    with open(log, "a", encoding="utf-8") as f:
        f.write(f"{time.strftime('%H:%M:%S')}  지식 잠금    {e.get('tool_name', ''):<19} {hit}\n")
    print(f"지식 파일은 작업 에이전트가 고치지 않습니다: {hit}\n"
          "지식이 빠졌거나 틀렸다면 /knowledge-flag 로 신고하세요. 고치는 일은 큐레이터와 사람이 합니다.", file=sys.stderr)
    sys.exit(2)
