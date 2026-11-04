## 사용자 디자인 피드백 반영 — 2026-11-04

이 절과 CURRENT-PLAN 최상단이 현행 상태다. 아래 구간은 단계별 이력이다. 현재 runtime059/editor290, 원본 PoB0.23.1/5d173cb를 유지한다. 검증용 폼처럼 보이던 화면을 배경/패널/선택 영역의 위계, 슬롯 선 아이콘, 아이템 정보 카드, 옵션/수치 입력 간격, 정상 옵션과 고급 원문 분리로 개선했다. 입력 XML과 원본 계산 규칙은 그대로 유지한다.

최신 check213/pack:win(build 포함) 통과. 실제 packaged editor7·생성접사3·생성초안5·hover5·workspace9·sets-config8·catalog-versions5·catalog4와 dark editor7 통과. light `.local/editor-native-1793752863945`, dark `.local/editor-native-1793753149612`의1920/1024 장비 화면을 직접 확인했다. 기능 통과는 사용자 디자인 승인이 아니다. 전체 성능 기준도 통과했고, polish 뒤1024 실제 입력 Paint1.3~12.0ms/현재 수치 Paint0.94~1.73초였다.

| 교체/정리 대상 | 현행 연결과 확인 |
|---|---|
| catalog/editor/item-controls의 즉시 장착/수동 Apply 기대 | 실제 원본 옵션 자동 반영, private 생성→Add→명시 장착, exact XML/전체 numeric reference/undo/restart 동선으로 이관 |
| renderer/sets-config의 구화면 selector | XML-only 브라우저 preview와 actual Electron 기능을 구분. 저장 수치/새 계산 구분·unknown/inactive·세트/조건/초안 소유권을 유지 |
| 중복/미사용 운영 코드 | 3 entry root에서99 파일 모두 도달. noUnused 정리9개, IPC35개 모두 preload/handler 연결. pok-image/pok-tree2개는 원본 자산 scheme으로 유지 |
| 배포 경로 | pack:win은 verify:pob→build→electron-builder 순서. dist와 package.json, 검증된 pob-runtime/pob-editor만 포함하며 .local/개인 fixture는 포함하지 않음. 실제 isPackaged와 native 자산/카탈로그 원본 불변 검증 통과 |
| 의존성/어댑터 | 새 package dependency 없음. 운영5개 의존성과16개 Lua 어댑터는 기존/새 사용자 기능에 연결되어 보존. 느린 상세 요청용 두 번째 지속 runtime은 요약 응답 보호에 필요 |

남은 범위/제약을 축소하거나 완료로 숨기지 않는다. 비슷한 아이템 검색 진입점(원본 CompareBuySimilar/trade 연결), 공유 코드 직접 입력/서비스 URL 가져오기는 현재 미구현이다. 설치 PoB 연결은 설계만 완료했고 실제 UI는 없다. 실제 PoK 서버/모델 연결과 Windows 외 패키지는 검증하지 않았다. invalid 입력 초안은 세션 범위 보존이다. 전체 원본 control 동등성 및 #188 완료는 선언하지 않는다. 시작 dirty27과 UI 변경은 별도 커밋 경계로 기록하며 원본 백업도 유지한다.

---

## 성능 분해·notes/affix 이관 — 2026-11-04, goal active

CURRENT-PLAN 최상단과 UI-REBUILD-PERFORMANCE-FINAL-20261104를 따른다. 단독 legacy/current/QPC/queue/actual Paint3profile·idle·1024 기준 통과. Notes의 빠른 navigation drop과 native range 재생성 focus loss를 실제 남은 smoke에서 찾아 수정했고 source6/4를 통과했다. 운영 graph98/noUnused9/35 IPC+2 scheme/16 Lua/5 deps 감사 결과를 기록했다. 최신 packaged notes6/affix4/workspace9·마지막 compact Paint(입력1.9~12.7ms/수치1.08~1.54초)도 통과했으며, 남은 legacy selector 이관과 최종 커밋/완료 감사는 아직 필요하다.

---

## 입력 범위·중복 생성 UI·PoK 원본 출처 — 2026-11-03, goal active

최신 기준은 CURRENT-PLAN 최상단(runtime059/editor290)이다. 생성 전 고정 quality와 전역 접사/roll UI·중복 상태/handler/CSS를 원본 private item 옵션으로 대체 검증 후 제거했다. 임의 gem100 ceiling도 제거하고 원본이 복원한 actual level/quality 차이를 XML 입력과 구분해 알린다. source/packaged 생성접사3/skill7과 현재GUI102 수치 일치, check213/build/pack 통과. Skill/Quality 보정은 원본이 수행하며 renderer에서 게임 clamp를 복제하지 않는다.

선택 PoK는 commit 외에 독립 release src1537 파일 byte 근거도 검증한다. 같은 commit 변조/누락/불명확한 root는 거부하고 source 변경은 선택 연결/제안을 폐기한다. helper4/bundle 통합1/native2 통과. 실제 모델/서버 연결 검증은 아니다. 남은 필수는 분리 성능 실측·잔여 경로 감사/정리·최종 커밋/완료 감사다.

---

## 상세 queue 분리·비교 라벨·출처 실제 이동 — 2026-11-03, goal active

CURRENT-PLAN 최상단이 최신이다. readCalcs/Breakdown도 background instance로 옮겼고, 실제 native 요청을 보류해도 foreground MAIN이 완료되는 source3을 통과했다. 비교는 공유 요약 표시명/단위와 명시 고급 전체 통계를 사용하며 source5 관리·비교 회귀가 통과했다. native Item/Tree source의 실제 클릭→슬롯/item/노드 선택과 XML/전체 수치 불변 source3, 기존 Calcs4 통과. source ID를 제공하지 않는 Skill/Config 행에는 가짜 위치 링크를 추가하지 않는다. 최신 packaged도 isolation3/관리·비교5/출처 이동3/Calcs4/GUI import4 모두 통과했다. packaged 비교 통계/Tree1024 화면도 직접 확인했다. 표시명 의미 감사/호환·성능·구경로 정리와 커밋은 남는다.

---

## 장비/생성/popup 초안 수명 — 2026-11-03, goal active

CURRENT-PLAN 최상단이 최신이다. item-draft5/popup6/기존 item-transition3/item-hover5 source 통과. 일반 미완성 item 필드와 생성 private XML/설정, 아직 완료하지 않은 stock popup 선택을 owner별 bounded session cache에 유지한다. view/build 전환 뒤 private pending 요청도 복원된 editor에 전파하며, 완료한 popup은 원래 snapshot에만 반영한다. Add는 미완성/처리 중/stale private draft에서 막는다. 캐시는 restart 후 invalid draft 복원이 아니며 canonical XML/복구 저장과 분리된다. 이전 절의 '미완성 item·생성·popup 전환' 미구현 표기는 이 구현/검증으로 대체한다. 최신 packaged item-draft5/popup6/skill-draft5/workspace9/jewel5도 통과했다. source 성유1920/오염1024 및 packaged 성유1024 화면을 직접 확인했다. 완료 여부와 필수 남은 항목은 UI-REBUILD-COMPLETION-AUDIT-20261103을 따른다.

실제 popup 검사에서 hover가 원본 편집 버튼을 가리는 결함을 발견해 클릭 선택 시 닫도록 수정했다. obsolete slot-row/수동 Apply smoke를 source 완료 흐름으로 교체했고 browser title 중복도 제거했다.

---

## 원본 hover 장착 비교 — 2026-11-03, goal active

현재 source/runtime/editor ID와 최신 실제 결과는 CURRENT-PLAN 최상단을 따른다. 새 ItemHover는 장착/보유/child socket/패시브 주얼의 원본 요구량과 장착·교체·해제 비교를 연결했다. 상세 조회는 별도 지속 runtime으로 보내 MAIN 큐를 막지 않으며 same-source 검증과 매 요청 복원을 그대로 적용한다. native5/source Electron5/actual packaged Electron5가 통과했고, source 두 크기와 packaged1920 화면을 직접 확인했다. 최신 packaged 전역9/jewel5 회귀도 통과했다. 단일 packaged UI 관측 품질1862ms/레벨1149ms/젬1690ms·두-frame24ms이며, 세부 단계별/세 입력 규모의 최종 실측은 남는다.

이전 절에서 'hover 실제 교체 비교'를 미구현으로 적은 항목은 위 구현으로 대체한다. item·생성 invalid draft 수명, popup commit 전환, 비교 라벨/관련 위치 이동 검증, capability/source 호환 범위 감사, 단계별 성능·구경로 정리·최종 UI 커밋은 남는다.

---

## 추가 초안/전환 검증 — 2026-11-03, goal active

CURRENT-PLAN 최상단이 최신 상태다. 스킬5/생성 초안5/일반 native 옵션 전환3/파티4의 source 실제 동선과 check205를 통과했다. 생성 초안은 private XML과 원본 옵션 metadata 전체를 유지하며 Add 한 번에 item subtree만 복사한다. 스킬 invalid draft는 owner별 세션 캐시에 유지하고 valid draft는 화면/build 전환 전에 flush한다. native 옵션은 제출한 owner/revision/runtime을 유지해 전환 뒤 완료하며 unrelated canonical 변경은 applyExpected로 거부한다. Party raw 편집은 명시 고급 도구로 이동했다. 최신 actual Windows package도 생성5/아이템 전환3/스킬 초안5/Party4가 통과했다. 생성·Party 두 크기를 직접 시각 확인했다. 실행 디렉터리/실패 이력은 CURRENT-PLAN 최상단을 따른다.

남은 draft 제약: skill 세션 캐시는 재시작 후 invalid draft 복원이 아니며, 일반 item invalid 숫자/생성·성유 draft의 view roundtrip 수명은 아직 보강 대상이다. 실제 item hover 교체/해제 계산 비교와 설치 PoB capability/PoK source 호환, 비교/관련 위치 이동·구경로 감사와 최종 커밋도 남는다.

---

## 최신 중간 검증 — 2026-11-03, 목표 미완료

현재 코드/출처와 진행 중 최종 패키지 검증은 CURRENT-PLAN 최상단을 따른다. runtime `pob-5c13412c2cb61568f091cb2319157e3118fa65fe75a0031929a972762c195976`, editor `pob-editor-895513e4f94098b267c1d87642d89f013c680377bb13b2aa1d134f2edf82054f`. 원본 PoB0.23.1/5d173cb 고정.

- native persistent 7, item-controls 7 통과. 숫자 DTO는 stock +/-와 같은 프로그램 설정 경로를 사용하고, 키보드 문자열 길이와 실제 수치 clamp를 구분한다. 문자 길이를 게임 최대값으로 간주하지 않는다.
- 한 XML 복원 요청 안에서 MAIN 계산/실제 대상/미해석 장착 줄/장비/캐릭터/조건·스킬 조회를 묶었다. 응답의 host 캐시는 입력 hash/revision/runtime 및 현재 manifest를 검사하고 clone해서 돌려준다. 수치를 계산 캐시로 대체하지 않는다.
- Windows의 디렉터리 metadata 알림은 재검증 신호로만 처리하고, 실제 파일/폴더 identity 변경은 worker와 캐시를 폐기한다. 캐시 hint가 반복돼도 30초 전체 바이트 검증이 미뤄지지 않게 별도 시각을 기록한다.
- 실제 upstream GUI에서 item/gem/tree 편집과 저장, 102개 수치 대조, 앱 재가져오기/같은 bytes 재내보내기 검증 완료. 개인 PoB 프로필 대신 `.local/pob-gui-roundtrip-*` 개발 모드 복사본을 사용했다. 원본 GUI 저장은 세트의 비ASCII 표시 등을 자체 정규화할 수 있으며 이것을 UI의 unknown 보존 검증으로 확대하지 않는다.
- source workflow9/equipment5/tree-advanced5/calcs4/jewel5/GUI-import4 통과. 구 테스트의 수동 Apply/Calculate 기대는 대체 동선에 맞게 갱신했다. hover Escape 후 같은 위치에 pointer가 남은 테스트와 접힌 details의 hidden role 탐색 오류를 수정해 실제 재진입/펼침으로 검증했다.
- 3개 합성 입력 warm host 관측: simple559~765ms, 대표575~863ms, 보유/그룹이 많은 입력832~1097ms. 해당 실행은 다른 GUI 검증과 부하가 겹쳤고, cold는6.4~9.2초였다. 원래 빈 빌드0.3초 결과나 이 관측을 전체 앱 보장으로 쓰지 않는다.
- 마지막 automatic group read 취소의 cold 재시작 회귀를 수정했다. 최신 코드의 최종 check/Windows packaged smoke·warm UI 재측정은 진행 중이며 이전 성공으로 대체하지 않는다.

남은 중요한 범위: 일반 편집 중 view/build 전환과 pending 입력 수명, 생성 초안의 모든 native 옵션 편집/hover 실제 교체 비교, 설치 PoB capability 및 선택 PoK source 대조, 비교/파티 정상 사용 화면과 전체 source 위치 이동, 잔여 old selector 이관/불필요 코드/최종 UI 커밋. goal은 active로 유지한다.

---

# UI 재구축 기능 연결표와 검증 상태

목표: `GOAL-UI-REBUILD-20261103.md` 전체. 상태 **active / 미완료**. 2026-11-03 사용자 실행 지시가 과거 승인 대기 문구보다 우선한다. 아래 목록은 화면 교체의 연결표이며 전체 PoB 세부 control 전수 동등성 목록은 아니다.

## 보존 기준

- 브랜치 `skerfolg/coho`. 시작 27차 dirty 변경은 `.local/ui-rebuild-start-20261103/tracked.patch`, `untracked/`에 별도로 보존했다. 시작 문서/목업/스킬 텍스트 작업을 폐기하거나 완료로 재분류하지 않는다.
- XML 정본/unknown/inactive, `build-history`의 revision/undo/redo, `applyExpectedEdit`, `StateStore`, 계산 출처 검사를 재사용한다. 원본 PoB/공유 PoK 소스·문서·ref는 수정하지 않는다.
- 개인 데이터는 사용하지 않는다. 브라우저 목업은 가상 시연으로만 확인했고 실제 데이터/좌표/수식으로 이식하지 않았다.

## 구화면 → 신화면

| 기능/기존 경로 | 새 경로 | 현재 검증과 남은 범위 |
|---|---|---|
| App 상단 가져오기/내보내기·계산 버튼 | 같은 줄의 빌드 선택/저장/다른 이름 저장/Import-Export/undo-redo | 실제 Electron 파일 저장·재시작과 전용 교환 화면 통과. 공유 코드 텍스트 직접 입력·서비스 URL은 후속 |
| App 최근 대화 중심 사이드바 | 장비/스킬/패시브/전투 조건/계산/비교/파티/노트 + 하단 설정 | 수동 메뉴 직접 접근, AI/최근 대화는 접힌 보조 영역에 보존 |
| EquipmentView 슬롯 목록+선택/카탈로그 열 | 슬롯 위치/보유 목록/생성·옵션의 3분할 | 실제 두 크기·원본 옵션 자동 반영·무기 세트 연동 확인. 추가 생성/주얼/삭제 동선 재검증 중 |
| 일반 옵션 detached preview+적용 | NativeItemEditor 자동 부분 패치+공통 계산 | canonical/XML 원문·inactive 보존·Quality 실제 Armour 변화 확인. 빠른 연타 큐와 팝업 완료 동선 추가 검증 중 |
| 카탈로그 즉시 생성·장착 | 독립 생성 초안→Add to build→명시 장착 | 유형/희귀도/이름/베이스·고유/원본 접사 선택. cancel/입력 signature/runtime/revision으로 늦은 초안 거부. 실제 생성 동선 검증 중 |
| 장비/패시브 주얼 분리 | 장착 영역의 장비/패시브 주얼 탭, 보유 목록 유지 | 원본 socket 목록/선택지/위치 미니맵/장착 연결. 최신 실제 UI 검증 전 |
| SkillsView 그룹 적용 | 젬/일반 필드 debounce 자동 반영, 숫자 직접 입력/+− | 실제 젬 레벨→새 revision 수치 통과. 고급 스킬/미니언/generated source는 기존 기능·제약 유지 |
| TreeView | 기존 원본 좌표 canvas/경로/종속/속성·주얼 연산 + 출처 node ID 이동 | native what-if 격리 확인. 직접 클릭 할당/선택 UX와 최신 두 크기/패키지 회귀 필요 |
| ConfigView | 전투 조건 메뉴, 원본 typed 조건, 고급 원문 접기 | 기존 native 계약 재사용. 헤더 직업/레벨 직접 입력과 원본 확인 결정 연결, 최신 전체 동선 회귀 필요 |
| CalcsView flat 패널+중복 rail | 원본 group/width의 고밀도 동시 패널, 상시 요약 통합 | 1024 직접 시각 확인·원본 hover/focus 조회 통과. 기여의 실제 ID로 아이템/트리 이동 연결, 실제 클릭 이동 전수 검증 필요 |
| StatsRail | 다른 작업에서 유지, 이전 revision 값과 갱신 상태 표시 | XML 저장 수치와 계산 출처 구분. 값→계산 진입. 요약 각 값의 정확한 cell 연결은 후속 |
| Builds/Loadouts/Compare/Party | 상단 빌드/보조 세트 관리와 새 셸 내 기존 사용자 기능 | 기능을 제거하지 않음. 합성 최신 source/packaged 회귀와 일부 원문 중심 흐름 개선 필요 |
| NotesView 명시 적용 | 색상/원문/텍스트 undo를 유지한 자동 반영 | 단위 기반 보존. 최신 notes source/packaged 동선 갱신 필요 |
| Settings/PoK | 하단 설정/선택 PoK 영역 | 독립 계산에 PoK 불필요. 설치 PoB capability·선택 연결 출처 호환/모델은 미검증 |

## 실행 수명

- `PobWorker`: PID 지속, 고유 요청 ID/ready 검증. 각 어댑터가 매번 원본 XML을 복원한다. native/protocol/start/exit/timeout/cancel을 구분하며 불확실한 worker를 폐기한다.
- `PobRuntime`: workspace 계산은 build 전환까지 최신 입력으로 대체한다. 비교/독립 snapshot 계산은 별도 owner를 유지한다. 요약→편집→트리→느린 상세 순서로 대기를 처리하고 동일 진행 중 계산은 병합한다. 낡은 장비/아이템 조회는 canonical mutation과 분리해 버린다.
- 파일 무결성: 최초 전체 바이트 검사, 매 요청 manifest bytes/실제 폴더 identity, recursive 변경 감지, 요청 전후 변경 세대. 감시 실패/미지원 시 metadata+SHA 검사. 30초마다 전체 바이트 재검증. 이벤트 중 실행 결과는 거부하고 프로세스를 폐기한다. 파일 변경을 무시하는 영구 성공 cache는 아니다.
- `BuildFileStore`: 명시 최초 저장/다른 이름 저장의 대상만 등록하며 원본 import 경로를 자동 덮어쓰지 않는다. 대상과 hash를 host registry에 보존하고 외부 변경을 거부한다. workspace에는 저장 hash만 기록한다.

## 지금까지 확인한 결과

- `npm run check`: boundary/type + **199 passed**, `.local/ui-rebuild-review/check.log`. 이후 최종 추가 변경은 재검사 대상이다.
- 실제 persistent native 5개 그룹: `.local/ui-rebuild-review/persistent-result.json`. 동일 입력/공유 PID, queued 최신 revision, 장비/아이템/Calcs/트리 what-if 이후 전체 numeric output 복원, 실패 후 새 PID·전체 output, active cancel/재시작 복원.
- 실제 Electron 최신 중간 8개 그룹: `.local/workspace-rebuild-1793696628158/result.json`. 자동 옵션/레벨/젬, 미완성 숫자, undo/redo, 두 크기/hover/고밀도 계산/교환/파일 저장 재시작. 후속 rapid 입력·생성/주얼/노트 변경은 이 결과 이후다.
- 동일 빈 Ranger warm host 308/331ms, 초기 info1281ms/cold compute3123ms. 앞선 측정의 warm6164/6489ms와 비교한다. 실제 UI 중간 결과는 옵션1322ms/레벨1151ms/젬1380ms, 후속 관측1665/1550/1531ms로 변동했다. 단일 표본을 모든 빌드 보장으로 쓰지 않는다.

## 제거와 보존

제거: 요청별 spawn/kill 구현, App의 사용되지 않는 수동 계산 handler, 일반 아이템의 중복 검토/적용 코드, 구 장비 3열용 `.equipment-layout`/`.equipment-columns`/`.slot-row` CSS와 slot 폭 token, 중복 원본 tree resource map, 일반 카탈로그의 JSON 요약 노출. 새 package dependency를 추가하지 않았다.

보존: XML/편집/저장 안전성·원본 어댑터·고급 입력과 로그·비활성 세트 관리·비교/파티/PoK 선택 연결·과거 기록. 구 smoke selector/수동 Apply 기대가 남아 있는 테스트는 교체 동선에 맞게 이관해야 하며 숨기려고 삭제하지 않는다. 현재 새 workflow 테스트가 대표 흐름을 검증하지만 모든 과거 feature smoke 성공을 대신하지 않는다.

## 미완료 완료 기준

- 최신 생성·주얼·bulk 삭제·노트/트리/조건/비교/파티/출처 실제 이동·빠른 문서 전환·실패 동선.
- 대표/무거운 합성 입력의 cold/warm·대기·복원/계산/UI 반영 분리 측정과 입력100ms 목표.
- 최신 check/build, Windows packaged 두 크기와 저장/재시작, 실제 원본 PoB GUI의 내보낸 XML 아이템/스킬/트리 편집 왕복.
- 설치 PoB 버전별 capability·프로세스/카탈로그/캐시 폐기 흐름, 선택 PoK 출처 호환/미연결·불일치.
- 원본 세부 기능 차이와 잔여 구코드/selector 이관, 최종 UI 커밋과 출처/실측/제약 기록. 장비 1단계 통과/테스트 수로 전체 동등성이나 #188 해결·재평가 준비를 선언하지 않는다.
