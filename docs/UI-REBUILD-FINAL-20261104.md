# UI 재구축 최종 기록 — 2026-11-04

대상은 `GOAL-UI-REBUILD-20261103.md`의 UI/실행 구조 재구축이다. 요구된 구현·보존·정리·실제 사용 동선·성능·패키지·최종 기록을 완료했다. 아래 미지원/미검증 범위를 전체 PoB 동등성이나 #188 해결로 해석하지 않는다.

## 구현과 보존

- 실제 검토 목업을 기준으로 전역 셸과 장비3분할, 무기I/II·주얼 탭, 스킬/트리/전투 조건/고밀도 계산/비교/파티/노트/설정을 연결했다. AI는 접힌 선택 영역이며 수동 작업은 PoK 없이 실행한다.
- 생성/기존 아이템 옵션은 각 옵션이 한 행을 차지하고 선택·슬라이더·수치/+−가 같은 열에 정렬된다. 원본 옵션/요구량/장착 비교·주얼 위치 미니맵과 원본 계산 근거를 사용한다. 정상 화면에서 원문/JSON 해석을 요구하지 않으며 고급 원문은 보존한다.
- 일반 유효 편집은 자동 반영·계산한다. 생성/검색/what-if/AI는 원본과 분리한다. 미완성 입력과 늦은 응답의 소유권을 확인하고 다른 build/revision/runtime에 적용하지 않는다.
- 지속 LuaJIT worker에서 요청마다 원본 XML을 복원한다. 최신 요청 병합, 시작/교체 전체 검증과 변경 감지·주기 검증, 실패/취소/재시작을 유지한다. 느린 상세 조회는 별도 지속 runtime에 둔다.
- XML 정본과 unknown/inactive 데이터, 원본 파일 보호, 명시 저장·외부 변경 충돌 감지, 재시작 복원·undo/redo·입력 리비전 계산 귀속을 보존했다.
- 별도 Add modifier 진입점은 원본 popup의 source/sort/modSelect/custom controls를 사용한다. Custom 입력은 선택 완료 전까지 로컬 초안이며 정상 카드에서 저장 marker를 숨기고 고급 원문에는 그대로 보존한다.
- 비슷한 아이템 검색은 원본 CompareBuySimilar의 실제 category/trade ID/필터/URL을 사용한다. 리그 이름은 직접 입력하고, 조건 갱신 뒤 명시 클릭해야 공식 거래소를 연다. 검색은 XML/계산값을 변경하지 않는다.

## 변경 경계와 출처

| 항목 | 기록 |
|---|---|
| 작업 브랜치 | skerfolg/coho |
| 시작 HEAD | 42ad5f0e894d3479f79a5688cc9068b4e621e87a |
| 기존27차 보존 | 4fbafcb: 실제 초기 HEAD+tracked.patch+untracked 백업으로 index/tree 일치 확인 후 분리 커밋 |
| UI/runtime 구현 | 8cd07b1 |
| 옵션당 한 행 정렬 | 3dc23fe |
| 원본 비슷한 아이템 검색·잔여 정리 | 588f9d1 |
| 원본 Add modifier·정상 카드 표시 | 7054680 |
| 팝업 키보드 포커스/Tab/Escape | b2ea1da |
| 원본 PoB | 0.23.1 / 5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6, 원본 checkout 변경 없음 |
| runtime | pob-0f7c495fb8df59bc8cca328325603e8aaa7841dc718ef3a1612718449dc62f92 /1715 파일 |
| editor | pob-editor-876b347b6a39c46a33e94c6032bb9943e3892f36cbe97f994d649710b3e4b5a8 /589 파일·13965 catalog 항목 |
| 최신 실행 파일 | `release/ui-rebuild-20261104-final/win-unpacked/POK.exe` |

기존 변경을 reset/stash하거나 원본 PoB/공유 PoK 소스를 수정하지 않았다. 개인 빌드·대화·프로필을 fixture/배포물에 넣지 않았다. 기존 실행 경로가 잠긴 EPERM은 기존 앱을 종료하지 않고 별도 패키지 경로로 해결했다.

## 검증

| 검증 | 결과/근거 |
|---|---|
| check / build / Windows package | check214, pack:win의 verify:pob→build→electron-builder 통과. `.local/ui-rebuild-review/keyboard-final-{check,pack}.log` |
| 정리 감사 | noUnusedLocals/noUnusedParameters 통과. 운영3진입점/101파일 미도달0,36 IPC와2 자산 scheme 연결,17 Lua/운영5 의존성의 사용 경로 확인. 새 dependency 없음 |
| 원본 검색 | native3/최종 packaged3. `.local/item-similar-1793763330952/result.json` 및1920/1024 실제 PNG 검토. 외부 브라우저 열기는 테스트에서 포착해 실제 원본 URL/명시 클릭/다른 host 거부를 확인 |
| 최종 작업 공간 | `.local/workspace-rebuild-1793763356044/result.json`9개. 자동 옵션/레벨/젬·불완전 입력·undo/redo·두 크기·저장/재시작 |
| 세트/조건 기능별 회귀(runtime89 단계) | `.local/sets-config-native-1793761944489/result.json`8개 |
| 스킬 초안 기능별 회귀(runtime89 단계) | `.local/skill-draft-1793762003697/result.json`7개 |
| 옵션 추가·키보드 | native4·기존 native popup6. 최종 packaged modifier3/popup6/dark modifier3. light `.local/item-modifier-1793764735205`, dark `.local/item-modifier-1793764805195`. 실제 stock suffix/Custom·17 Strength·unknown XML/text·정확한 undo·private 생성·Tab/Shift+Tab/Escape/focus 복원·두 크기 확인 |
| 생성/옵션 정렬의 단계별 회귀 | actual packaged editor9·생성접사3, 생성/기존 아이템의1920/1024 실제 행/열·잘림 검사. CURRENT-PLAN의 각 결과 디렉터리 참조 |
| 실제 원본 GUI 왕복 | 격리된 원본 GUI에서 item/gem/tree 편집·저장. 최종 package 재가져오기4(`.local/gui-roundtrip-import-1793763398803`)에서102 수치 일치·mismatch0·동일 byte 내보내기 |
| 지속 runtime | `.local/ui-rebuild-review/complete-persistent.log`7개: PID/수치 일치·snapshot 캐시 불변·최신 병합·build 전환·what-if 격리·실패 후 복구·취소 후 복구 |

앞선 hover/주얼·Calcs 근거/출처 이동·상세 격리·관리/비교·노트/파티·원본 입력 한도·선택 PoK source byte 검증의 기능별 근거는 완료 감사와 CURRENT-PLAN의 단계 기록을 보존한다. 마지막 변경의 범위와 필요한 실제 재검증을 구분했으며 테스트 수만으로 전체 동등성을 주장하지 않는다.

## 성능

최종 runtime0f7의 단독 legacy/current·QPC·queue·actual Paint·1024·주기 무결성 갱신이 통과했다. warm host 중앙값 simple320ms/대표580ms/heavy617ms, 대표 실제 UI1920은1.27~1.95초/1024는1.20~1.98초/주기 검증 시2.56초였다. 전체 input Paint 최대15.9ms. 동일 입력의 전체 numeric output도 일치했다. 초기 고정 기준(대표 host≤3003ms/대표 UI≤3000ms/입력 Paint≤100ms)을 바꾸지 않는다. 상세 방법·표본 한계는 `UI-REBUILD-PERFORMANCE-FINAL-20261104.md`를 따른다.

## 명시적인 한계

- 전체 원본 PoB control 동등성이나 #188/R7 완료를 선언하지 않는다.
- 설치 PoB 연결·버전/capability 전환은 설계를 완료했으며 실제 연결 UI는 후속이다. 기본은 검증된 독립 고정 번들이다.
- 선택 PoK는1537 source byte·버전/출처 대조를 검증했지만 실제 모델/서버 연결은 실행하지 않았다.
- 검색은 실시간 리그/시세/매물 조회가 아니다. 실제 거래소의 서버 응답/매물 성공과 브라우저의 외부 페이지 표시까지 검증했다고 주장하지 않는다.
- 공유 코드 직접 입력/서비스 URL 가져오기는 후속이다. 현재 XML/PoB/JSON 파일 가져오기·내보내기를 사용한다.
- invalid 초안의 보존은 세션 범위이며 앱 재시작 복원을 보장하지 않는다.
- 원본이 근거 위치 ID를 제공하지 않는 계산 행은 가짜 이동 링크를 만들지 않는다. 원본 계산이 지원하지 않는 입력은 경고/원문을 유지한다.
- Windows x64 actual package를 검증했다. macOS/기타 OS 배포·서명/설치기 검증은 미수행이다. 성능은 합성 입력의 관측이며 모든 빌드·PC/OS 부하의 시간 보장이 아니다.
