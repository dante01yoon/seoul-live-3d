---
name: factory-fix
description: factory:fix 라벨이 붙은 이슈 하나를 실패하는 테스트 → 구현 → 리뷰 → 커밋 순서로 처리하고 PR 본문을 쓴다. scripts/factory가 이슈마다 작업대(worktree)를 만들어 그 안에서 실행한다. 사용법 /factory-fix <이슈 번호>
disable-model-invocation: true
---

# 이슈 수정: #$ARGUMENTS

지금 폴더가 이 이슈의 작업대다(`scripts/factory`가 `fix/issue-$ARGUMENTS` 브랜치로 만들었다). 이 폴더에서만 고친다. push와 PR은 하지 않는다 — 끝난 뒤 `scripts/factory`가 검사하고 한다.

1. **이슈 읽기**: `gh issue view $ARGUMENTS --comments`. 열린 PR이 있으면 리뷰 댓글도 읽는다: `gh pr view fix/issue-$ARGUMENTS --comments`(없으면 넘어간다).
2. **지식 확인**: 고칠 파일의 `.claude/rules/*.md`와 CLAUDE.md에서 관련 규칙을 찾는다. 이슈·리뷰에 나온 규칙이 지식에 없거나 지식과 다르면 `/knowledge-flag`로 신고한다. 지식 파일은 직접 고치지 않는다(훅이 막는다). 사람이 알려 준 규칙은 지금 작업에 그대로 따른다.
3. **실패하는 테스트 먼저**: `/tdd` 순서대로, 이슈를 확인하는 테스트를 `tests/`에 먼저 쓰고 `npm test`로 실패를 본다.
4. **구현**: 테스트가 통과할 만큼만 고친다. 편집할 때마다 검사 훅(`check.py`)이 문법·타입·테스트를 돌린다.
5. **리뷰**: `factory-reviewer` 서브에이전트에게 이슈 번호와 지금 폴더 경로를 넘긴다. `FAIL`이면 지적을 고치고 4단계부터 다시 한다.
6. **커밋**: `git add`로 바꾼 파일만 넣고 한국어 메시지로 커밋한다.
7. **PR 본문**: `.factory/pr.md`에 쓴다.

```markdown
Fixes #<번호>

## Why
<이슈에서 사람이 하려던 일>
## How
<바꾼 함수와 파일, 추가한 테스트>
## 확인
- npm test: <통과 수>
- 리뷰어: PASS
## 지식 신고
<연 knowledge:flag 이슈 번호, 없으면 없음>
```

8. 한 일을 한국어로 짧게 보고하고 끝낸다.
