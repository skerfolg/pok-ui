# UI 재구축 완료 감사 — 2026-11-03

상태: **미완료**. GOAL-UI-REBUILD-20261103의 실제 요구를 기준으로 한다. 전체 PoB control 동등성이나 #188 완료는 이 목표의 단계 결과로 선언하지 않는다. 아래 통과 기록은 CURRENT-PLAN의 해당 source/bundle identity와 결과 파일을 함께 확인해야 한다.

2026-11-04 시각 피드백 반영: 최신 light/dark1920/1024 actual packaged 화면을 직접 검토하고 editor/생성/hover/workspace/세트/카탈로그와 성능을 재검증했다. 잔여 구 selector 이관은 완료했다. 시작 dirty27은 별도 검증된 snapshot commit4fbafcb로 보존했다. 명시된 비슷한 아이템 검색 진입점은 아직 미구현이며 이 차이를 전체 완료로 숨기지 않는다.

| 명시 요구 | 현재 근거 | 판정/다음 필요한 증거 |
|---|---|---|
| 새 goal·원문 범위 유지, 목업 직접 조작 | active goal, 기존 mock 1920/1024 캡처와 CURRENT-PLAN 시작 기록 | 실행 완료. mock 가상 수치/좌표를 게임 데이터로 이식하지 않음 |
| branch/dirty27 식별·보존 | skerfolg/coho, `.local/ui-rebuild-start-20261103/tracked.patch`, untracked 백업 | 보존 완료. 최종 커밋에서는 시작27차와 UI 변경의 경계를 기록해야 함 |
| 상단 같은 줄의 파일 작업·undo/redo·레벨/직업/포인트, 좌측 수동 메뉴·하단 설정·선택 AI | App/WorkspaceCharacter, 실제 workflow 두 크기·저장/재시작 | 구현/대표 검증 완료 |
| 장비3분할·무기I/II·inactive 보존·주얼 탭 공존·목록 조작 | EquipmentView, equipment/jewel/workflow native/source/packaged | 구현/대표 검증 완료 |
| 희귀/고유 생성과 원본 동적 옵션·직접 수치/+− | editor.item·NativeItemEditor·CreationDraftEditor·NativeItemPopup, 생성5/popup6 동선 | 중복 생성 quality/전역 mod/roll UI 제거 후 source/packaged 생성접사3 통과. gem 임의100 ceiling 제거, quality101와 원본 level200 보정 안내를 source/packaged skill7에서 확인. min/max/유효성은 원본 옵션 metadata와 입력 형식 검증을 구분 |
| 옵션/요구량/장착·해제 비교와 주얼 실제 미니맵, hover/focus/경계 | ItemHover/stock tooltip adapter, native5/source5/packaged5 | 대표 실제 검증 완료. 클릭 뒤 카드가 편집을 가리는 결함도 수정/재검증 |
| 일반 변경 자동 반영·입력 보존·필드 오류·편집 단위 undo, 생성/what-if/AI 분리 | build-history/expected revision, item/skill draft 모델, source 생성·전환·popup 동선 | 대표 완료. invalid 초안 보존은 세션 범위이며 restart 복원을 주장하지 않음 |
| 다른 작업의 상시 요약·실제 대상/revision·갱신/실패와 이전값 구분 | StatsRail/compute target/input diagnostics, workflow | 대표 완료 |
| 고밀도 Calcs·중복 요약 통합·원본 hover/focus 근거·관련 슬롯/그룹/node/조건 이동 | CalcsView/NativeBreakdown/WorkspaceLocation, calcs4 source 검사 | Item/Tree의 실제 source 링크 click→정확한 item/슬롯/node 선택과 불변성 source3/packaged3 추가 통과. native가 ID를 제공하지 않는 행은 위치 미제공을 표시하며 skill/config 위치를 추정하지 않음 |
| 정상 흐름에서 XML/JSON/DTO 해석 불필요, 고급 원문·진단 보존 | raw/manifest/party JSON은 details, item unparsed diagnostics | 비교 일반 표는 공유 요약 표시명/단위로 교체하고 고급 전체 통계를 보존. source/packaged 관리·비교5 통과. Speed=공격/시전 속도, Fire 최대 피격=화염으로 수정하여 generic 원소 수치로 오인하지 않게 함 |
| 지속 worker·매 요청 XML 복원·입력 우선/병합·조회 snapshot | PobWorker/PobRuntime, persistent7·실패/취소/오염/manifest 회귀 | 대표 검증 완료 |
| 느린 상세 조회가 최신 요약을 막지 않음 | item tooltip과 Calcs/Breakdown 모두 별도 지속 runtime | 실제 Calcs 프로토콜을 보류해도 MAIN이 먼저 완료되고 늦은 상세 응답이 최신 입력을 덮지 않는 source3/packaged3 통과 |
| 최초/교체 검증·검증 재사용·변경 감지·failure/crash/timeout/cancel·late owner | integrity watcher/full periodic hash, protocol tests/native persistent | 대표 검증 완료. runtime 변경 이벤트와 관련 캐시 폐기는 유지 |
| 고정 번들 기본, 설치 PoB 연결·버전 capability **설계** | POB-INSTALL-COMPATIBILITY.md: staging/profile/교체/rollback/API/검사 | 설계 산출물 완료. 실제 설치 연결 UI는 미구현으로 남기며 완료 기능으로 표시하지 않음 |
| 선택 PoK의 양쪽 version·source 호환 | prepared engine identity/KB/capability + 독립 release src의 실제1537 파일 byte 근거 대조 | 같은 commit의 변조/누락/중복 origin 거부 helper4/bundle 통합1 + 실제 checkout1537 파일 일치/다른 commit 거부 native2 통과. 실제 모델/서버 연결은 미수행으로 명시 |
| XML canonical·unknown/inactive·원본파일 보호·복구/저장/undo/revision | 기존 unit/regression+FileStore·expected revision·source/packaged 저장재시작 | 대표 검증 완료. 개인 데이터를 fixture/배포물에 사용하지 않음 |
| 내보내기→실제 원본 GUI item/gem/tree 편집·저장·재가져오기 | 격리 original GUI 복사본, 102 수치와 실제 GUI XML import/export4 | 실제 왕복 완료. 현재 runtime44caa982의 packaged 재가져오기4 추가 통과:102 수치 일치·직접 편집 컨트롤·byte 동일 export |
| simple/대표/heavy의 cold/warm/queue/restore/compute/UI 분리·수치 기준·입력100ms | 기존 host3profile와 packaged UI 관측·두-frame<100ms | 단독3profile·고정 legacy host/current 동일 numeric output·QPC 복원/계산/snapshot·queue·actual packaged Paint·idle 재검증·1024 계측 통과. 대표 host553ms≤3003ms, UI1.21~1.73초/idle2.62초≤3초, input Paint≤20.2ms. 근거/표본 한계는 UI-REBUILD-PERFORMANCE-FINAL-20261104. notes/range 수정 후 최종 packaged compact도 입력1.9~12.7ms/수치1.08~1.54초로 추가 통과 |
| npm check/build, 필요한 actual Electron/Windows package·두 크기 | 현재 check213/build/pack:win, latest packaged 생성접사3/skill7/workspace9/Calcs4/GUI import4 통과 | CURRENT-PLAN 최상단에 현재 bundle/각 결과 디렉터리·실패 이력 기록 |
| 구→신 기능표·구코드/동적import/IPC/dep/배포경로 감사·불필요 경로 정리 | UI-REBUILD-PROGRESS의 연결표·제거/보존 기록 | polish 후 도달성99/미도달0, noUnused9 정리/35 IPC+2 scheme/16 Lua/5 deps 감사. catalog/editor/item-controls/renderer/sets-config도 실제 auto/private draft 동선으로 이관했다. source 및 최신 packaged 검증은 CURRENT-PLAN 참조. 최종 커밋 경계와 배포 경로 기록은 남음 |
| 최종 UI 커밋·출처·실측·제약 기록 | checkpoint 문서, 원본dirty 백업 | **미완료**. 위 필수 미완료를 해소한 뒤 작업 브랜치에 커밋 |

테스트 개수는 기능 동선/사용성/전체 성능의 대체 근거가 아니다. 설치 연결의 실제 구현이나 모든 원본 control 동등성처럼 문서에서 명시적으로 미지원인 후속 범위를 완료했다고 해석하지 않는다. 반대로 이 표의 필수 미완료 항목은 후속 범위로 밀어 목표를 축소하지 않는다.
