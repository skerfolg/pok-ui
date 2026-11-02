# 노트 편집·표시 계약

원문은 canonical XML의 Notes direct text다. 색상/코드 보기·줌·스크롤은 원문을 다시 만들지 않으며 명시 적용만 build revision을 만든다. unknown Notes 속성/자식과 원본 파일은 기존 XML patch/undo 경로로 보존한다.

## 확인한 원본

- PoB 0.23.1 / `5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`: `Classes/NotesTab.lua`의 SetColor, EditControl의 GetSelText/Insert/ReplaceSel/ZoomText와 `Data/Global.lua`의 named colorCodes.
- 추가 조회한 [SimpleGraphic common.cpp](https://github.com/PathOfBuildingCommunity/PathOfBuilding-SimpleGraphic/blob/8694a07b7eed57a0224e113da8cea0f522fee6b9/engine/common/common.cpp) / [common.h](https://github.com/PathOfBuildingCommunity/PathOfBuilding-SimpleGraphic/blob/8694a07b7eed57a0224e113da8cea0f522fee6b9/engine/common.h), 고정 source commit `8694a07b7eed57a0224e113da8cea0f522fee6b9`: ^0~^9 palette, ^x/^X +6hex 판독.3=blue,4=yellow,5=purple,6=aqua,8=0.7gray,9=0.4gray다. Quake/ANSI 색상표를 대신 가정하지 않았다. 이 source commit을 PoB bundle DLL의 정확한 빌드 commit으로 확인한 것은 아니다. 원본 PoB GUI의 pixel/font parity는 미검증이다.

## 구현 범위

renderer는 표시용 color-code tokenizer와 source/visible UTF16 offset mapping만 담당한다. 유효하지 않은 code·literal HTML·한글/emoji/탭·CRLF를 원문에 보존한다. CSS color span과 투명 textarea를 겹쳐 code를 숨긴 상태에서도 편집하며, 동일 font/폭/padding/scroll을 동기화한다. 코드 보기는 같은 원문의 다른 표시다. React text node를 사용하고 노트 HTML을 실행하지 않는다.

범위 색칠은 원본 SetColor처럼 선택 중 lowercase hex code를 제거하고 마지막 선택 hex 또는 ^7을 뒤에 복원한다. indexed/unknown/uppercase code는 원본 Lua 동작처럼 남는다. 위치를 browser selection/beforeinput으로 잡아 반복 문자와 Unicode 입력이 다른 위치의 서식을 바꾸지 않게 한다. Ctrl+A/copy/cut/paste는 원문 색상 코드를 유지한다. 로컬 undo/redo는 build undo와 분리하며 이전 draft100개/약2MiB 한도(최소1개)를 유지한다. Ctrl +/-/0, Ctrl+wheel은 원본의 default16·10~100 범위를 사용한다.

원본 ShowColorCodes의 ^_x 임시 치환을 canonical text에 적용하지 않는다. 원래 literal ^_x/^_숫자 입력은 표시 전환만으로 변하지 않는다. 기존 CRLF도 view projection에서만 정규화하며 실제 편집 범위 밖은 보존한다. 색칠 삽입 범위의 CR 제거는 원본 ReplaceSel과 일치한다.

`tests/pob-notes-parity-smoke.cjs`는 write/settings/process 차단을 적용한 동일 고정 원본 headless NotesTab을 직접 호출해 selection/caret·Unicode/CRLF 및 named preset을 비교한다. 이것은 presentation 참고 테스트이며 제품에 새 PoB 계산 경로를 추가하지 않는다. 실제 OS IME·clipboard·원본 GUI의 font/render parity는 별도 검증 항목이다.
