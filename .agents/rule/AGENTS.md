# Language Instruction
- You can think in English, but you MUST write your final response and explanations in Korean.
- 사고(Thinking) 과정은 영어로 진행하되, 최종 답변은 반드시 한국어로 작성하세요.

# Ecoding Rule
---
name: 한국어 파일 인코딩 규칙
description: 한국어 텍스트 포함 파일 수정 시 인코딩 파괴 방지 규칙
type: feedback
---

**절대 사용 금지 — PowerShell로 한국어 파일 일괄 치환**

PowerShell 5.1은 한국어 UTF-8 파일을 읽을 때 CP949(시스템 기본)로 읽고 다시 쓰면서 일부 한국어 문자를 `?`(0x3F)으로 대체한다. 이는 복구 불가능한 데이터 손실이다.

**Why:** 이 프로젝트에서 계획서 파일 11개(A~K)의 한국어 설명 + 코드 내 한국어 문자열이 모두 파괴되어 전부 다시 작성해야 했음.

**How to apply:** 파일 수정 시 항상 아래 규칙 적용.

---

## 규칙 1: 텍스트 치환은 반드시 Edit 툴 사용

```
# 절대 금지
powershell -Command "(Get-Content '$f') -replace 'X','Y' | Set-Content '$f'"

# 올바른 방법
Edit 툴로 직접 수정 (replace_all=true)
```

## 규칙 2: 부득이하게 쉘 스크립트 필요하면 Python 사용

```python
import pathlib

files = pathlib.Path("dir").glob("*.md")
for f in files:
    text = f.read_text(encoding="utf-8")
    text = text.replace("old", "new")
    f.write_text(text, encoding="utf-8")
```

## 규칙 3: 파일 여러 개 일괄 치환 전 반드시 1개 먼저 테스트

```
1. 파일 1개에만 먼저 적용
2. Read 툴로 한국어가 정상인지 확인
3. 정상이면 나머지 파일에 적용
```

## 규칙 4: Bash sed 도 금지 (Windows에서 인코딩 문제 동일)

```
# 금지
sed -i 's/old/new/g' file.md

# Edit 툴 사용
```

## 절대 원칙

**한국어가 포함된 파일은 Edit 툴 또는 Python(encoding="utf-8") 만 사용.**
PowerShell, sed, awk 사용 금지.