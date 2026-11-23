---
name: knowledge-flag
description: 작업 중 CLAUDE.md·.claude/rules·스킬에 필요한 지식이 없거나 틀렸을 때, 직접 고치지 않고 knowledge:flag 이슈로 신고한다. 표시 규칙·용어·데이터 위치가 지식에 없을 때, 사람이 리뷰나 댓글로 지식에 없는 규칙을 알려 줬을 때 사용한다.
---

# 지식 신고

작업하는 에이전트는 지식(CLAUDE.md, `.claude/rules/`, `.claude/skills/`, `.claude/agents/`)을 고치지 않는다. 고치려 하면 지식 잠금 훅이 막는다. 빠졌거나 틀린 지식은 신고만 하고, 고치는 일은 밤에 도는 큐레이터(`scripts/curator`)와 그 PR을 머지하는 사람이 한다.

## 언제 신고하나

- 작업에 필요한 규칙을 지식에서 찾지 못했다.
- 지식에 적힌 내용이 코드·이슈·사람의 말과 다르다.
- 사람이 PR 리뷰나 이슈 댓글로 지식에 없는 규칙을 알려 줬다.

추측으로 규칙을 정해 넣지 않는다. 지금 작업은 사람이 알려 준 대로 진행하고, 지식에 없다는 사실을 신고한다.

## 신고하기

1. 같은 신고가 있는지 본다: `gh issue list --label knowledge:flag --state open --json number,title`
   - 있으면 그 이슈에 새 근거만 댓글로 더한다.
2. 없으면 연다(라벨이 없으면 `gh label create knowledge:flag --color FBCA04`). 본문은 파일로 써서 넘긴다.

```bash
gh issue create --label knowledge:flag --title "지식 신고: <빠진 지식 한 줄>" --body-file <본문 파일>
```

본문 형식:

```markdown
## 무엇이 빠졌나 / 틀렸나
## 어디서 필요했나
이슈·PR 번호, 파일
## 근거
사람의 말 원문, 코드 줄, 이슈 본문
## 제안 (선택)
어느 지식 파일에 무엇을 적으면 좋을지
```

3. 마지막 보고에 신고 이슈 번호를 적는다.
