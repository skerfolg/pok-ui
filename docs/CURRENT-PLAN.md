# 아이템 옵션 한 행 정렬 — 2026-11-04

사용자가 생성/옵션의 세부 능력치가 정렬되지 않았으며 옵션당 한 행을 차지해야 한다고 지적했다. NativeItemEditor의 독립2열 field-grid를 옵션별 행으로 교체했다. 원본 field ID로 식별되는 접두/접미 선택과 대응 AffixRange를 같은 행에 묶어 이름/선택/슬라이더/직접 수치·+/− 열을 맞춘다. 퀄리티/소켓/촉매/변형 등 단일 옵션도 한 행씩 표시한다. 생성 초안과 기존 아이템은 같은 컴포넌트를 사용한다. 원본 metadata/입력·자동 반영·revision 경로는 바꾸지 않는다.

검증: check213과 최신 pack:win(build 포함), 실제 packaged editor9/생성접사3 동선 통과. editor 검사는1920/1024에서 실제 행 경계, 컨트롤 잘림, 같은 행의 선택/수치 정렬, 빈/선택된 접사 상자의 공통 열을 측정한다. `.local/editor-native-1793754791004`의 생성1920/장비1024를 직접 확인했다. 작은 생성 캡처는 스크롤 위치 때문에 옵션이 충분히 보이지 않아 옵션 목록을 화면 안에 놓도록 보강한 뒤 editor9를 다시 통과했고, `.local/editor-native-1793754918934/생성-옵션-1024.png`에서 접두/접미 전체 행과 수치 입력까지 직접 확인했다. 실제 생성·장착·새 수치·undo/restart도 유지된다.

기본 release 경로의 Electron 추출 rename이 EPERM으로 실패했다. 기존 실행 앱을 종료하거나 경로를 지우지 않고 `.local/option-rows-release/win-unpacked/POK.exe`로 별도 패키징해 검증했다. 이전 기본 release 실행 파일을 이번 행 정렬의 최신 결과로 간주하지 않는다. runtime059/editor290 및 원본 PoB는 변경하지 않았다.

---

# UI goal 재개·사용자 디자인 피드백 — 2026-11-04

사용자가 R7/#188 지시를 코어 세션에 전달하려다 이곳에 잘못 말했다고 정정하고 원래 UI goal 재개를 지시했다. 이 세션은 GOAL-UI-REBUILD-20261103을 다시 따른다. R7 코어 개선을 여기서 수행하지 않으며 잘못 만든 local scope 메모는 철회 이력으로 표시했다. 도구의 goal status는 paused 캐시가 남아 있으나 사용자 재개 지시로 UI 작업 권한은 복원됐다.

- 남은 item-controls6/editor7/sets-config8/catalog-versions5 source 검사를 실제 auto/draft 흐름으로 이관했다. 옛 slot-row/수동 Apply/즉시 장착 기대는 새 Native UI에 맞췄고 기존 exact XML/unknown/inactive/revision·전체 numeric reference/지원 tree/지원 불가 입력 거부·restart 검증은 유지했다.
- Renderer preview는 실제 계산·장착이 불가함을 검증하고, 실제 장착은 Electron 검사에 둔다. 브라우저 XML/원본 저장 수치 구분·고급 XML 편집·대화 rename/pin/send-error/edit/delete-undo/restart와1920/1024 검사가 통과했다. 초기 restart 실패는 접힌 선택 AI 영역을 사용자 동선으로 펼치도록 이관했다. Vite는 독립 PoB의 검증된 static catalog/tree를 읽되 계산 API를 renderer에 넣지 않는다.
- 브라우저 파일 선택 실패를 조사해 custom titlebar가 없는 경우에도34px 행에 app-shell이 들어가 header/footer가 본문을 가리는 실제 레이아웃 결함을 수정했다. hidden file input은 선택 중 DOM에 붙이고 선택/취소 때 제거한다. XML-only preview import 범위도 명시한다. 데스크톱 file dialog는 그대로다.
- 사용자가 실제 시험 화면의 디자인이 투박하다고 지적했다. 기능 통과와 시각 완성도를 구분한다. 캔버스/패널/내비게이션 hierarchy·초록 강조·카드·수치 컨트롤을 정리하고 슬롯 형태 표시, 희귀도/입력 속성 chips/옵션 중심 item summary, 고급 원문·출처를 도입했다. XML/계산/undo 로직은 보존한다. 저장 문법은 정상 카드에서 정리하되 원문은 고급에 남고 unknown line은 정상 옵션에도 유지한다.
- 시각 source editor7 `.local/editor-native-1793751989457` 통과 후1920/1024를 직접 확인했다. compact 메뉴 줄바꿈/작은 슬롯 label clipping을 추가 수정했고 원본 컨트롤 로드 완료 상태에서 캡처하도록 보강했다. 새 item summary가 원문을 고급으로 옮겨 raw 보존 검사는 textContent로 읽고 실제 옵션 표시도 별도로 확인한다.
- 최신 check213과 pack:win(build 포함) 통과. polish를 포함한 actual packaged editor7/생성접사3/생성초안5/hover5/workspace9/sets-config8/catalog-versions5 및 dark editor7도 통과했다. 두 테마의1920/1024 장비 화면을 직접 확인했다. light 캡처 `.local/editor-native-1793752863945`, dark `.local/editor-native-1793753149612`. 기능 통과를 사용자 시각 승인으로 간주하지 않는다.
- 생성 Add 버튼과 private native preview 사이 한 프레임의 busy 전달 지연을 발견해 layout 단계에서 동기화했다. actual item raw/보이는 옵션/장착 뒤 원본 수치를 함께 재검증했다. 브라우저 preview 회귀도 새 polish에서 통과했다.
- polish 후 packaged catalog4와 원본 자산/카탈로그 불변 검증 통과(`.local/catalog-qa-1793753217207`). 단독1024 Paint 재측정은 입력1.3~12.0ms, 입력→현재 수치0.94~1.73초이며 전체 성능 기준도 통과했다.
- 시작 dirty27 스냅샷은 실제 초기 HEAD+tracked.patch+untracked 백업에서 별도 index로 복원하고 tree 일치를 확인해 `4fbafcb39d14210356a8ef5aecf05d0dc9b45b5b`로 보존했다. 작업 트리를 reset/stash하지 않았다. 이후 UI/runtime 변경을 별도 구현 체크포인트로 기록한다.

다음: UI-REBUILD-PROGRESS 최상단의 미구현/미검증 차이를 기준으로 남은 범위를 진행한다. 비슷한 아이템 검색 진입점 등 명시 요구가 남아 있으므로 goal 전체 완료는 아직 선언하지 않는다. #188 해결 판정은 이 UI goal의 결과가 아니다.

---

# 단독 성능 계측·잔여 검사 이관 — 2026-11-04 (goal active)

이 절이 최신 상태다. runtime059/editor290·원본 PoB0.23.1/5d173cb 유지. 원본 PoB/공유 PoK는 수정하지 않았다. 상세 표/방법/기준/한계는 `UI-REBUILD-PERFORMANCE-FINAL-20261104.md`를 따른다.

- 단순/대표/heavy의 같은 XML·진단 Lua에 고정 pre-rebuild host와 현재 host를 넣어 비교했다. original PoB source는 그대로이고 private worker에만 QPC 시계를 추가했다. 모든 numeric output 동일. warm host 중앙값5977/6006/6560ms→477/553/636ms, 앞/뒤 manifest 합14~21ms, 대표 XML 복원395ms·BuildOutput54ms·snapshot70ms. process-cold 요청3.8~5.2초·앱 cold7.1~10.3초이며 OS cache/일반 부하는 통제하지 않았다. 첫 계측 준비의 CRLF 치환 실패는 진단 사본만 정규화해 해결했다.
- 실제 active 뒤 최신 revision 두 개를 제출해 중간 대기 요청을 대체했다. 대표 최신 queue649ms+active657ms, 중간 대체0.21ms. UI는 actual exe/CDP input mark와 해당 input/수치 영역 Paint를 계측했다. 입력1.4~13.4ms, 대표 수치Paint1.21~1.73초;1024는입력1.5~14.6ms·수치1.04~1.42초. idle35초 뒤 source 재검증도 입력20ms·수치2.62초. 단순/대표/heavy의 각3표본이며 모든 고부하 빌드 보장이 아니다.
- 기준은 초기 legacy 대표 warm 중앙값6006ms에서 host50% 단축(3003ms 이하), 최종 UI3초 이하·input Paint100ms로 정해 통과했다. `.local/ui-rebuild-review/performance-assessment.json` passed true. 마지막 notes/range 수정 후 최종 packaged compact도 단독 재측정해 기준을 통과했다.
- 잔여 notes smoke 이관 중500ms debounce 전에 view/build를 바꾸면 valid note가 사라질 수 있는 경로를 찾아 수정했다. owner별 세션 초안/base를 보존하고 blur/unmount도 해당 build의 최신 XML note를 확인한 expected edit으로 반영한다. 외부 note 충돌은 초안을 유지/오류 표시하고 명시 XML 복원을 제공한다. source notes6 (`.local/notes-native-1793717260310`) 통과: 색상/CRLF/unknown codes·HTML 비실행·caret/clipboard·zoom/scroll·global undo/redo·빠른 build 전환·restart.
- 기존 item-affix smoke의 수동 Apply 기대를 auto revision으로 이관했다. Home→End 단계에서 range input을 value key로 재생성해 focus가 사라지는 실제 결함을 찾아 동일 node의 controlled value로 수정했다. source4 (`.local/item-affixes-native-1793717508268`) 통과: future ModRange child/attrs·exact undo·native 최소/최대 tier와 Life·두 크기·restart.
- 정적 운영 graph98개는3진입점에서 모두 도달했다. TypeScript noUnusedLocals의9개 미사용 선언/import/중복 transport 참조를 제거했다. game-data의 unused manifest 값은 제거하되 await 검증은 유지했다. 35 preload invoke는 모두35 IPC handler에 대응하고, 별도 pok-image/pok-tree scheme은 필요해 유지한다. 16 own Lua adapter와5개 runtime dependency는 실제 실행/선택 기능에 필요하다. 빠른 portable current-host perf smoke는 저비용 안정성 확인용으로 이유를 명시해 보존한다. 산출물은 source-reachability.json/registration-audit.json/unused-locals.log.
- 최신 check213/build/pack:win 통과. actual packaged notes6 (`.local/notes-native-1793718330372`), item-affixes4 (`.local/item-affixes-native-1793718356425`), workspace9 (`.local/workspace-rebuild-1793718386395`) 통과. 수정 후 단독 compact Paint도 입력1.9~12.7ms·수치1.08~1.54초로 통과했고 performance-assessment.json passed true를 재확인했다. `.local/ui-rebuild-review/check.log`, `pack.log`, `packaged-<scenario>.log`, `performance-ui-compact.log`와 status0을 따른다.

다음 필수: 위 최종 검증 완료, catalog/editor/item-controls/renderer/sets-config의 남은 old selector·수동 Apply 기대 이관/대체 범위 확인, 잔여 IPC/등록/배포 경로 감사 정리 기록, 시작 dirty27 경계를 보존한 최종 UI 커밋과 완료 감사. 성능 단계 통과나 도달성 검사만으로 전체 완료/PoB 동등성을 선언하지 않는다.

---

# 원본 입력 범위·생성 정리·PoK 출처 검사 — 2026-11-03 (goal active)

이 절이 최신 상태다. PoB0.23.1/`5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6` 유지. runtime `pob-05950380acd790eecc7b6a3ea0abb130e7b5b0542a92a0d4d4600833de2b5316`, editor `pob-editor-29030bf84f2d020a6ee3557ef4c0f10a16264b5f01a06b58e6141ab753a99d8d`. 원본 PoB/공유 PoK 소스는 수정하지 않았다.

- Speed 표시명을 공격/시전 속도, FireMaximumHitTaken을 화염 최대 피격으로 바로잡아 요약/비교에 공유한다. 다른 원소의 최대 피격이라고 일반화하지 않는다.
- 생성 전의 고정0..100 quality 입력/상태/생성 API 필드를 제거했다. 품질은 생성된 private item의 원본 옵션으로 조절한다. 옛 생성 quality 인자를 보내면 명시 오류로 안내하며 조용히 무시하지 않는다. 실제 Native 접사/범위 양끝·Add·장착·undo의 source3 검증 후 전역 접사 카탈로그/roll 입력·중복 선택 상태/handler/useMemo와 selected-mod CSS도 제거했다. 접사 선택·제외·범위·게임 효과는 원본 ItemsTab에서 제공한다. 원본 catalog/export API와 선택 PoK 기능은 보존한다.
- 젬 level/quality의 임의100 상한을 제거하고 정수·정확한 JS 표현 가능 범위·기본 입력 형식만 검증한다. 실제 적용/level 보정은 원본 validateGemLevel/ProcessSocketGroup에 맡긴다. inspect/Calcs는 원본이 복원한 실제 level/quality를 내보내며, host/화면은 XML 요청과 다르면 차이를 명시하고 원문은 유지한다. source skill7 (`.local/skill-draft-1793714276419`)에서 quality101 새 계산과 level200→원본 보정 안내·원본 XML/undo 수명까지 통과했다.
- 선택 PoK 연결 전에 독립 runtime의 검증된1537개 release src 파일을 기준으로 byte hash를 대조한다. bundled는 전체 byte 검증된 engine bundle inventory, checkout은 명시 선택된 engine root의 원본 파일을 실제 읽어 확인한다. 같은 commit이어도 누락/변조/불명확한 위치는 거부한다. engine의 identity/KB/capability 비교는 그대로 유지하며 서로 다른 sourceDigest 알고리즘을 같다고 가정하지 않는다. 확인 중 runtime ID/준비 상태/출처 세대가 바뀌면 ready를 내지 않는다. 독립 source invalidation은 detail worker/제안/agent 문맥 및 선택 연결도 폐기한다.
- 원본 engine checkout의1537 src byte 일치/다른 commit 거부 native2 (`.local/ui-rebuild-review/source-compat-native-result.json`) 통과. helper4 + 실제 prepared bundle 검증/캐시 후 파일 변경 통합1 단위 검사를 추가했다. 실제 PoK 모델/서버 연결은 미수행이며 이 검사로 대체하지 않는다. source scope는 독립 번들에 포함된 원본 release src이고 adapter/VM binary 동일성을 주장하지 않는다.
- source 생성 접사3 (`.local/creation-affix-1793714310259`), 생성 품질/소켓/룬5 (`.local/creation-draft-1793714340736`), 초안5 (`.local/item-draft-1793714374790`) 통과. 초기 초안 discard 검사 한 번은 React effect 반영 전 즉시값을 읽어 실패했고, 실제 반영 값까지 poll하도록 수정해 재통과했다. 원본 옵션1024 화면을 직접 확인했다.
- 최신 check213/build/pack:win 통과. actual packaged 생성접사3 (`.local/creation-affix-1793714598672`), skill7 (`.local/skill-draft-1793714618099`), workspace9 (`.local/workspace-rebuild-1793714639836`), Calcs4 (`.local/calcs-native-1793714688224`), GUI import4 (`.local/gui-roundtrip-import-1793714722868`) 통과. 현재 runtime059의102 GUI numeric output도 일치하고 byte 동일 export 유지. `.local/ui-rebuild-review/packaged-<scenario>.log`와 status0을 따른다.

다음 필수: 단독 실행의 simple/대표/heavy cold/warm·queue/복원/계산/UI 단계별 성능 및 초기 기준 비교, 잔여 구코드/selector/IPC/등록/배포 경로 감사·정리, 시작 dirty27 경계를 보존한 최종 UI 커밋과 완료 감사. 설치 연결 UI·실제 모델 검증·전수 PoB control 동등성은 미구현/미검증 범위로 명시한다. goal은 미완료다.

---

# Calcs 상세 lane·비교·실제 출처 이동 — 2026-11-03 (goal active)

이 절이 최신 상태다. runtime/editor 출처는 아래 hover 절의44caa982/0e219721과 동일하며 원본 PoB/공유 PoK 소스는 수정하지 않았다.

- readCalcs/Breakdown을 item tooltip과 같은 별도 지속 PobRuntime으로 옮겼다. foreground compute/inspection/equipment/mutation은 기존 인스턴스에 남는다. 두 runtime 모두 매 요청 XML 복원과 manifest 검증을 유지하고 종료 시 함께 닫는다. API/worker protocol/계산 규칙을 복제하거나 바꾸지 않았다.
- 실제 Electron에서 Calcs Lua 프로토콜 전송을 시험 안에서 보류했다. 그 요청을 풀기 전에 레벨 편집의 새 MAIN 결과가 완료됐고(1179ms 단일 관측), 이전 상세 응답을 풀어도 새 revision을 덮지 않았다. source3 `.local/details-isolation-1793712251366/result.json`. 첫 fault-injection 시도는 Electron main evaluate의 require 부재로 중단돼 process.getBuiltinModule로 시험만 수정했다.
- 비교 일반 표는 요약과 공유하는 표시명/단위만 먼저 보이고, label/key 검색과 '고급 · 전체 원본 통계'로 나머지 전체 수치를 유지한다. score/게임 해석은 추가하지 않았다. shared stat-labels로 중복 표시 정의를 제거했다. 기존 관리·비교 smoke의 접힌 보조 메뉴와 수동 노트 Apply selector를 새 흐름으로 이관했다. source5 `.local/management-compare-native-1793712011969/result.json`에서 폴더/복사/삭제복원·redo·한글 Life 라벨/값/고급·세트 비교 적용/재계산·stale차단·재시작·두 크기를 확인했다. 기존 Speed/FireMaximumHitTaken 같은 표시명의 의미 정확성은 최종 표시명 감사 대상이다.
- 실제 native modifier source가 제공한 Item:101/Ring1 링크를 눌러 해당 item preview/보유 선택/장착 슬롯 border로 이동하고, Tree:14267 링크를 눌러 실제 노드 선택 UI로 이동했다. equipped source item을 선택해도 일치하는 슬롯 border가 보이도록 보완했다. source3 `.local/source-navigation-1793712141790/result.json`, 현재 XML/revision/전체 numeric output 불변. source ID가 없는 항목의 skill/config 링크를 만들어내지 않으며 해당 가용성은 명시한다. 실제 Tree1024·비교1024 PNG 직접 확인; 최종 비교 통계 영역 캡처와 native node 조회 완료 대기를 추가해 packaged에서 재확인한다.
- 기존 Calcs source4 `.local/calcs-native-1793712047671/result.json` 통과. 최신 check207/build/pack:win 및 actual packaged details-isolation3 (`.local/details-isolation-1793712488292`, held 상태의 MAIN1073ms), management-compare5 (`.local/management-compare-native-1793712511267`), source-navigation3 (`.local/source-navigation-1793712539724`), calcs4 (`.local/calcs-native-1793712560860`), gui-roundtrip4 (`.local/gui-roundtrip-import-1793712597068`) 모두 통과했다. `.local/ui-rebuild-review/pack.log`, `packaged-<scenario>.log`와 각 status0을 확인했다. 실제 GUI saved artifact의102 수치가 현재 runtime44caa982와 일치하고 byte 동일 재내보내기도 유지했다. packaged 비교 통계1024와 원본 node 조회 완료 후Tree1024 PNG를 직접 확인했다.

다음: 생성 quality/젬 등의 static 한도와 기존 표시명 근거 감사, PoK 독립 source 호환, 단독 실행의 단계별 성능 실측, 잔여 구경로 감사와 최종 UI 커밋. 완료 판정은 UI-REBUILD-COMPLETION-AUDIT-20261103을 따른다. 전체 목표는 미완료다.

---

# 장비·생성·팝업 초안 수명 — 2026-11-03 (goal active)

이 절이 최신 상태다. runtime/editor 출처는 바로 아래 hover 절의44caa982/0e219721과 동일하다. 원본 PoB/공유 PoK는 수정하지 않았다.

- 일반 item 숫자/문자 입력, 생성 설정·완성된 private item XML, raw 편집 선택은 빌드/아이템/슬롯/runtime 또는 생성 버전 소유자로 나눈 세션 캐시에 둔다. 캐시는64 owner로 제한하고 canonical XML/복구 저장 데이터에는 섞지 않는다. 미완성 숫자는 view/build 왕복 후 필드 오류와 함께 복원한다. 명시 '입력 초안 지우기'는 XML을 바꾸지 않는다. 재시작 후 invalid/session draft 복원은 제공하지 않는다.
- 생성 초안의 기존 NativeItemEditor 요청은 view를 즉시 왕복해도 같은 private document에 완료한다. useSyncExternalStore 구독으로 새 editor도 늦게 완료된 private revision을 받는다. '보유 아이템 보기'와 '생성 초안 취소'를 구분했다. Create Item은 기존 초안으로 돌아가며, Add 후 초안 표시를 비우고 canonical inventory에 한 번만 복사한다. 원래 기준이 달라진 초안은 유지하되 Add를 막는다. 미완성 숫자가 있는 private draft도 Add가 잠긴다.
- 성유/오염의 아직 완료하지 않은 원본 선택은 owner별 source item text와 함께 보존하고 새 native 조회로 복원한다. 완료 요청은 화면/build 전환 뒤에도 원래 snapshot에 적용하며 runtime/revision 확인을 통과해야 한다. 취소는 요청과 초안을 버린다. 아이템 원문이 바뀐 popup draft는 자동 복원을 중단하고 이유/버리기를 표시한다. popup의 '선택 완료' 후 별도 일반 Apply는 필요 없다. 원본 normalized slider에 직접 % 입력/+−도 제공한다.
- 실제 source item-draft5 (`.local/item-draft-1793710901396`), item-popups6 (`.local/item-popups-native-1793711090955`), item-transition3 (`.local/item-transition-1793711129912`), item-hover5 (`.local/item-hover-1793711153081`) 통과. 성유1920/오염1024 PNG 직접 확인했다. item-draft는 incomplete 값·명시 discard·타 빌드 격리·pending private request·inventory 왕복·Add/기준 변경·취소를 포함한다. popup은 pending cancel/선택 복원·완료 자동 계산·native DPS/Dex·완료 직후 타 빌드 전환·unknown XML·재시작을 포함한다.
- 초기 popup 회귀에서 슬롯 클릭 후 남은 hover가 성유 편집 버튼을 가렸다. force click으로 우회하지 않고 선택 click 시 HoverCard를 닫도록 수정했다. 커스텀 카드와 중복되는 browser title도 장비/목록/주얼에서 제거했다. 기존 popup smoke의 slot-row/수동 Apply selector를 새 완료 흐름으로 이관했다.
- 최신 check207/build/pack:win 통과. actual packaged item-draft5 (`.local/item-draft-1793711370615`), item-popups6 (`.local/item-popups-native-1793711399363`), skill-draft5 (`.local/skill-draft-1793711434232`), workspace-rebuild9 (`.local/workspace-rebuild-1793711454772`), jewel-workspace5 (`.local/jewel-workspace-1793711615613`) 모두 통과했다. `.local/ui-rebuild-review/check.log`, `pack.log`, `packaged-<scenario>.log`와 status0을 확인했다. packaged 성유1024 PNG도 직접 확인했다. 마지막 jewel smoke 첫 시도는 클릭 후 닫힌 card에 포인터를 실제 재진입하지 않아 timeout됐다. hover 전에 밖으로 이동하도록 사용자 동선을 갱신해 재통과했으며 초기 실패를 성공으로 집계하지 않는다. 단일 packaged UI 관측은 품질1368ms/레벨1068ms/젬1586ms·입력 두-frame28ms다.

완료 여부는 `UI-REBUILD-COMPLETION-AUDIT-20261103.md`의 요구별 표를 따른다. 다음: Calcs/Breakdown의 foreground queue 분리, 비교 일반 라벨과 실제 source 이동 검증, 생성 quality 등 static 한도의 원본 근거 감사, 설치/capability·PoK source 호환 범위 감사, 단계별 성능 실측·잔여 구경로 정리·최종 UI 커밋. 전체 목표는 미완료다.

---

# 원본 아이템 hover 비교 — 2026-11-03 (goal active)

이 절이 최신 상태다. 원본 PoB0.23.1/`5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`는 그대로이며, runtime `pob-44caa9826780d4de3e7e781787418249e2b2d96aac29a2d77e2bad2df244e8b0`, editor `pob-editor-0e219721a81ca23a6a96c0f7a8bea822e20213fed027200b82cac2ab2b33e445`로 얇은 tooltip 어댑터를 추가했다. runtime1714 files/editor589 files·13965 entries·trees0_1~0_5. 원본/공유 PoK 소스는 수정하지 않았다.

- 장착/보유 아이템, 장비 내부 소켓, 패시브 주얼 hover/focus에서 stock ItemsTab:AddItemTooltip의 장착/교체/해제 비교를 읽는다. stock AddStatComparesToTooltip 출력과 AddRequirementsToTooltip 요구량을 전달하며 renderer에서 수치 차이/게임 규칙/비교 우선순위를 만들지 않는다. 실제 stored Item 객체를 사용해 XML variant/range metadata와 '이미 장착된 항목' identity를 보존한다.
- 별도 지속 PobRuntime 인스턴스에서 느린 tooltip 조회를 직렬 실행한다. foreground MAIN 계산 큐를 점유하지 않는다. 같은 manifest 검증·변경 감지·실패 폐기·매 요청 XML 복원을 사용하고, 최신 tooltip 입력으로 대기 요청을 대체한다. renderer는 owner/revision/runtime/위치/hash와 현재 렌더 소유자를 검사한다. 앱 종료 때 두 worker를 닫는다.
- HoverCard ResizeObserver로 비동기 내용 확장 뒤에도 화면 경계를 유지한다. 이미 Escape한 동일 trigger는 실제 다른 필드로 focus를 옮긴 뒤 재진입해 검사한다. 첫 source 검사는 focus가 그대로인 채 재focus할 것이라는 잘못된 가정으로 두 번째 크기에서 timeout됐고, 재진입 동선을 수정했다. 초기 prepare는 새 module copy 등록 누락을 검증기가 거부했으며 등록 후 새 번들을 준비했다.
- native5 (`.local/ui-rebuild-review/tooltip-native-result.json`) 통과: 실제 갑옷 제거·교체/원본 요구량, child socket 제거, tree socket 장착, 모든 numeric output/원문 불변과 오류 후 복원. source Electron5 (`.local/item-hover-1793709889859/result.json`) 통과: 두 크기 focus/경계·보유 비교·child socket·자동 편집/undo·다른 build의 실제 주얼 미니맵+원본 해제 비교. 1024 장비/주얼 PNG 직접 확인했다.
- 최신 check205/build 성공. 새로운 actual Windows package도 통과했다: item-hover5 (`.local/item-hover-1793710187435`), workspace-rebuild9 (`.local/workspace-rebuild-1793710218183`), jewel-workspace5 (`.local/jewel-workspace-1793710259434`). `.local/ui-rebuild-review/pack.log` 및 `packaged-<scenario>.log`/각 status0을 확인했다. packaged1920 hover PNG도 직접 확인했다. 이번 packaged warm UI 관측은 품질1862ms/레벨1149ms/젬1690ms, 입력 두-frame24ms이며 단일 합성 빌드 결과다.

다음: 남은 미완성 item·생성 draft 수명과 popup commit 전환, 비교 라벨/실제 source 이동 검증, 설치 PoB 설계의 capability/source 호환 구현 범위 감사, 성능 단계별 실측·잔여 구경로 정리·최종 UI 커밋. goal은 미완료다.

---

# UI 재구축 추가 체크포인트 — 2026-11-03 (goal active)

목표는 **미완료**이며 아래 과거 체크포인트보다 이 절을 우선한다. 원본 PoB/공유 PoK 소스는 수정하지 않았다. runtime/editor ID는 바로 아래 5c13412c/895513e4와 같다.

- 스킬 초안은 build/set/group/runtime 소유자로 분리했다. 유효한 입력은 화면·빌드 전환 전에 반영하고, 빈 이름/미완성 숫자는 canonical XML을 바꾸지 않고 세션 초안으로 유지한다. 정규화된 committed group을 다음 기준으로 사용한다. source 실제 동선5 (`.local/skill-draft-1793707785715/result.json`)와 순수 모델4 검사 통과.
- 생성 초안에 기존 원본 옵션 편집기를 연결했다. 품질·socket/rune·원본 metadata를 private XML에서 편집하고 Add 한 번에 전체 item subtree를 새 ID로 복사한다. canonical slot/unknown/inactive 원문을 재작성하지 않는다. 처리 중 Add는 잠기고, 입력/runtime이 달라지면 초안은 남기되 추가를 차단한다. source5 (`.local/creation-draft-1793708393042/result.json`) 통과. 초기 검사는 Rune: None도 완료로 간주해 처리 중 추가 결함을 발견했으며, 실제 선택 룬 텍스트/장착 수치/undo까지 기다리도록 보강했다.
- 일반 native 옵션은 이미 제출한 요청과 후속 값 큐가 화면 전환 뒤에도 snapshot 소유자로 완료된다. build 전환 시 최신 runtime 확인 + applyExpected를 거치며 새 빌드에는 적용하지 않는다. 숫자의 valid 미blur 값도 editor unmount 때 flush한다. source3 (`.local/item-transition-1793708731519/result.json`) 통과. 초기 버전은 programmatic build select 때 blur가 발생하지 않아 두 번째 값이 누락됐고 unmount flush로 수정했다. 미완성 아이템 숫자/성유 팝업 초안의 전환 후 보존은 별도 남은 범위다.
- 파티 일반 화면은 지원 빌드/대상/추가 모드와 원본 효과 요약·진단을 표시한다. raw buffer 편집은 명시 고급 details로 옮겼다. source4 (`.local/party-native-1793708627066/result.json`) 통과. 첫 source 시도의 즉시 Calcs heading 검사는 비동기 상세 갱신 대기 누락으로 실패했고 해당 revision 표시까지 대기하도록 수정했다. 현재 두 크기 screenshot은 실제 Party 화면에서 찍도록 보강해 packaged에서 재확인한다.
- 최신 `npm run check`: boundary/type/205 tests 모두 통과. build 성공. `npm run pack:win` 성공 후 actual `release/win-unpacked/POK.exe`의 creation-draft5 (`.local/creation-draft-1793708982262`), item-transition3 (`.local/item-transition-1793709009584`), skill-draft5 (`.local/skill-draft-1793709030034`), party4 (`.local/party-native-1793709050878`)가 모두 통과했다. `.local/ui-rebuild-review/pack.log`, `packaged-<scenario>.log`와 status0을 확인했다. 생성·Party 1920/1024 PNG도 직접 확인했다. 아래 이전 패키지 workflow9/jewel5/GUI4는 성공했으나 새 코드의 전수 결과로 대체하지 않는다.

설치 연결 설계는 `POB-INSTALL-COMPATIBILITY.md`에 후보 staging/기능 profile/교체·rollback/PoK 공통 source digest와 미구현 범위를 기록했다. 현재 독립 runtime↔PoK 비교는 commit만 대조하는 제한이 남는다.

다음: 일반 장비의 미완성 draft/생성 draft 수명·실제 hover 교체 비교, 비교 일반 수치 라벨·source 이동, 설치 PoB capability/선택 PoK source 호환과 잔여 구경로 감사, 성능 단계별 실측과 최종 UI 커밋. 전체 PoB 동등성/#188 완료를 선언하지 않는다.

---

# UI 재구축 중간 체크포인트 — 2026-11-03 (goal active)

이 목표는 **미완료**다. 아래 이전 체크포인트의 runtime ID/검사 결과보다 이 절과 `UI-REBUILD-PROGRESS-20261103.md` 최신 항목을 우선한다.

- 현재 런타임 `pob-5c13412c2cb61568f091cb2319157e3118fa65fe75a0031929a972762c195976`, editor `pob-editor-895513e4f94098b267c1d87642d89f013c680377bb13b2aa1d134f2edf82054f`, PoB0.23.1/`5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`. 원본/공유 PoK 소스는 그대로다.
- compute는 한 번 복원한 XML에서 계산·장비·캐릭터·조건/스킬 조회를 묶어 반환한다. host가 수치와 조회 DTO를 분리하며 같은 입력의 대기 중 조회는 이 스냅샷을 사용한다. 다른 XML 요청은 여전히 전체 원본 복원한다. native 지속/오염/병합/foreground 전환/조회 캐시 불변성/실패/취소 7개 그룹 통과 (`.local/ui-rebuild-review/persistent-result.json`).
- 원본 GUI를 고정 번들의 원본 실행 파일/소스 복사본으로 격리 실행했다. 실제 앱 내보내기 XML을 열어 품질23→24·Fireball5→6·일반 패시브5점(저장 ID6개, 시작점 포함)을 편집/저장했다. 저장된 102개 수치와 새 native 계산이 일치하고, 실제 Electron 재가져오기/편집 컨트롤/두 크기/바이트 동일 재내보내기까지 통과했다. 원래 UI 내보내기 파일 hash는 바뀌지 않았다. `.local/ui-rebuild-review/gui-stage.json`, `gui-result.json`, `gui-roundtrip.log` 및 아래 참조 결과를 따른다.
- 실제 source Electron: 장비5 (`.local/equipment-native-1793706460636`), 고급 트리5 (`.local/tree-advanced-native-1793706243966`), 계산4 (`.local/calcs-native-1793706299057`), 주얼/생성/삭제/노트5 (`.local/jewel-workspace-1793706359624`), GUI XML 재가져오기4 (`.local/gui-roundtrip-import-1793706494374`), 전역 작업9 (`.local/workspace-rebuild-1793706527011`) 통과. 각 result.json과 PNG를 보존했다. 전역 입력→두 번째 frame 기회16.2ms, 품질1859ms/레벨1085ms/젬5727ms: 마지막 지연은 자동 스킬 그룹 조회 취소가 main worker를 종료하는 경로를 추가로 발견해 수정했으며 재측정 대상이다.
- 마지막 추가 수정: 읽기 전용 스킬 그룹 조회를 버릴 때 공유 worker를 kill하지 않음. 명시 수정 후 계산은 workspace scope로 통일. 설정의 중복 정보 조회 제거·선택 PoK/AI 접기, 수치의 정수 검증/예외 필드 표시/blur 후 중복 debounce 방지, 네이티브 자동 레벨 표시/수동 전환 전용 XML 패치, 원본 비교 결과 runtime/입력 재검사, stale runtime 응답의 최신 상태 덮어쓰기 차단.
- source 검사200개 통과 및 build 성공 뒤 위 마지막 readonly/scope 변경을 포함해 check/pack을 재실행 중이다. `.local/ui-rebuild-review/*-status.json`은 timestamp와 해당 log 끝을 함께 확인한다(실행 중에는 이전 상태 파일이 남는다). 패키지 최종 명령은 pack 성공 후 실제 `release/win-unpacked/POK.exe`로 workflow/jewel/GUI 왕복 smoke를 실행한다. 현재 구동 중 세션의 로그: `pack.log`, `packaged-workspace.log`, `packaged-jewel.log`, `packaged-gui.log`.

다음 goal 턴은 새 코드를 더 추가하기 전에 마지막 check·packaged smoke의 완료/실패 결과를 확인하고 실패를 해결한다. 이어 빠른 일반 편집의 view/build 전환 시 미반영 입력 보존/완료, 생성 초안의 전체 원본 옵션 편집과 실제 hover 장착/해제 비교, 비교/파티의 일반 화면 정리·나머지 source 이동·설치 PoB capability/선택 PoK source 호환, 구 selector/미사용 상태 감사와 최종 커밋을 진행한다. 단계 검증을 전체 PoB 동등성이나 목표 완료로 선언하지 않는다.

---

# 목업 기반 UI 재구축 — 2026-11-03 실행 중

사용자가 `GOAL-UI-REBUILD-20261103.md` 전체 범위의 새 goal 실행을 지시했다. goal은 **active**이며, 아래 재설계 승인 대기/기존 목표 일시 정지는 과거 기록이다. 전체 PoB 동등성이나 최종 목표 완료를 선언하지 않는다.

- 작업 브랜치 `skerfolg/coho`. 시작 dirty 27차 작업을 `.local/ui-rebuild-start-20261103/tracked.patch`와 `untracked/`로 별도 보존했다. 공유 PoK/원본 PoB 소스는 수정하지 않는다.
- 검토 HTML을 실제 브라우저에서 장비로 전환하고 1920/1024 화면을 직접 확인했다. 실제 제품 데이터에 목업 수치/좌표를 넣지 않았다.
- 지속 worker·요청별 원본 XML 복원·요청 ID·실패/취소/timeout 분리, 최신 계산 병합/대체와 요약 우선 큐를 구현했다. 시작 전체 해시 검사, 변경 감시/실패 시 메타데이터 검사 fallback, 30초 정기 전체 바이트 검증을 사용한다. 요청 전후 manifest/폴더 identity·변경 세대를 확인한다.
- 전역 셸·파일 저장/다른 이름 저장/전용 Import/Export·인접 undo/redo·헤더 원본 패시브 현황/레벨/직업·좌측 수동 작업과 선택 AI 보조 영역을 연결했다. 명시 파일 저장은 복구 저장과 구분하며, 저장 대상은 재시작 후 유지하고 외부 변경을 검사한다.
- 장비 3분할·무기 I/II·보유 목록·독립 생성 초안·원본 옵션 자동 반영·키보드/hover 옵션을 연결했다. 젬 직접 입력/+−·일반 수정과 노트도 자동 반영한다. 계산은 원본 그룹/폭의 동시 패널로 표시하고 hover/focus 근거와 아이템/트리 ID 이동을 연결한다. 주얼 원본 소켓/미니맵/장착 연결은 추가 검증 중이다.
- 실제 Electron 동선 최종 중간 결과 `.local/workspace-rebuild-1793695925012/result.json`: 8개 그룹 통과. 옵션/레벨/젬 자동 계산, 미완성 값, undo/redo, 두 해상도, 원본 근거 focus, 교환 화면, 파일 저장/재시작. 직접 PNG 확인 후 좁은 피해 표를 원본 그룹 폭으로 수정했다. 마지막 주얼/노트/범위 컨트롤 변경은 이 중간 결과 이후이며 재검증 대상이다.
- 동일 빈 합성 Ranger host warm 계산 308/331ms (이전 약6164/6489ms), 최초 info1281ms/첫 계산3123ms. Electron 옵션1322ms/레벨1151ms/젬1380ms. 단일 관측이며 대표/무거운 입력/입력 paint100ms 목표와 최종 패키지 성능은 별도 검증한다.
- 현재 runtime `pob-68ce5a9fe64c31b399eb4f03aabc85e7efa4c63e6f0188b6edf217c6dd583a4a`, editor `pob-editor-42f836b679b4be46ab42c13ec45e7e8adfa9b93ecf3c21fbe73df88e3b131f66`, 원본 PoB0.23.1 / `5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`. 출처 검사를 유지해 새 어댑터 묶음과 카탈로그를 재준비했다.

다음: 최신 전체 check/build, 지속 runtime의 실제 오염/취소/실패 회귀, 최신 source/Windows packaged 두 크기, 장비 생성/주얼/삭제·노트/트리/비교/파티/출처 이동, 불필요 경로 정리, 설치 PoB capability/선택 PoK 호환과 원본 GUI XML 왕복. 세부 기능 연결표와 남은 항목은 `UI-REBUILD-PROGRESS-20261103.md`를 따른다. 장비 1단계 검증으로 전체 완료를 선언하지 않는다.

---

# 현재 작업

새 세션 목표·실행 지시안: [목업 기반 UI 재구축](GOAL-UI-REBUILD-20261103.md). 기존 목업/후속 요구를 화면 기준으로 명시하고 지속 PoB runtime·자동 반영/계산·검증된 기반 보존·교체 후 구코드 정리·전체 완료 기준을 통합했다. 지금은 목표 문서화만 수행하며 기존 paused goal/27차 구현을 자동 재개하지 않는다.

2026-11-03 PoB 지연 감사: [실행 방식·성능 비교](POB-RUNTIME-PERFORMANCE-20261103.md). 요청마다 cold worker 생성/종료와 전후 전체 무결성 검사를 확인했다. 합성 빈 빌드의 현재 compute 6.16~7.08초, 동일 worker 재사용 진단은 ready 3.47초 후 compute 0.33~0.38초였다. 후자는 앱 전체/실물 빌드 성능 개선 결과가 아니다. pob-ai 현재 c9d416d의 live bridge·지속 headless 엔진과 비교했다. 제품/엔진 변경 없이 감사·로컬 계측만 수행했고 재설계 승인 대기를 유지한다.

## 사용자 E2E 피드백에 따른 재설계 — 2026-11-03, 승인 대기

기능 구현 목표는 사용자가 일시 정지했다. 원문/JSON 노출, 저장·적용 버튼 의존, 우측 계산 자동 갱신 부족, 계산 대기와 메뉴 접근성 문제가 실제 사용을 방해한다는 피드백을 받았다. 기존 27차 미커밋 구현은 보존하고 자동 기능 추가·검증을 중단한다. 중단 전 실행한 source smoke는 브라우저/창 종료로 실패했으며 전체 통과로 간주하지 않는다.

사용자가 좌측 작업 목록을 선택했고, 빌드 선택·저장·다른 이름으로 저장·Import/Export Build를 원본 PoB처럼 상단 같은 줄에 두도록 지시했다. 이 배치는 확정사항으로 목업/설계에 반영한다. 파일 저장과 작업 복구 자동 보존은 구분한다. 되돌리기/다시 실행은 Import/Export Build 바로 옆, 설정은 좌측 사이드바로 이동한다. 상단 우측에는 패시브 현황과 편집 가능한 레벨/직업을 배치한다.

사용자 PoB 이미지 추가 지시: 무기 세트별 노드 현황을 표시하고, 장비 작업 영역을 좌측 장착 슬롯/좌측 하단 보유 목록/우측 생성·옵션의3분할로 구성한다. 목록 조작, Create Item 고유/희귀 분기, 옵션 도구, 모든 장착/목록 아이템의 호버 정보를 목업에 반영한다.

추가 지시: 장착 영역의 맵핑/보스 구분과 선택 위치 문구를 제거한다. 무기 I/II 전환만 노출하고, 장비/패시브 주얼 탭으로 보유 목록과 공존시킨다. 주얼 호버에는 소켓의 트리 위치 미니맵과 아이템 옵션을 함께 표시한다.

수치 컨트롤은 PoB식 값 입력칸 +/− 버튼으로 통일하고 퀄리티·S/J 소켓·옵션·젬/캐릭터 레벨에서 직접 입력도 유지한다.

계산 화면은 PoB식 고밀도 패널로 동시에 출력하고 모든 결과값 hover/focus에서 기여값·배율·조건·출처를 표로 보여준다. 수치 검색·패널 접기·출처 위치 이동을 연결하며 목업 근거는 가상 예시로 구분한다.

현재 작업은 메뉴/편집/계산 UX 재설계와 확인용 목업이다. [재설계 검토안](UI-REDESIGN-20261103.md), `artifacts/ui-redesign/pok-workspace-review.html`을 사용자에게 제시하고 승인받는다. 제품 코드는 승인 전에 변경하지 않는다. 목업 수치/응답 시간은 가상 시연이며 실제 엔진 성능 개선 결과가 아니다.


## 원본 스킬 텍스트 교환·입력 원문 기록 — 2026-11-03 (27차 진행)

현재 JSX/form 호출 경로를 AST와 코드로 감사했다. form 안의 portal 편집기는 수정된 NativeSkillGroups이며 다른 portal 폼은 현재 상위 편집 form 밖이다. 다른 모달의 GUI 전수를 새로 검증했다는 뜻은 아니다. 원본 CopySocketGroup/PasteSocketGroup 텍스트 가져오기·내보내기, 새 입력 기록 UI를 연결 중이다.

native는 줄별로 입력 XML을 새로 로드해 원본 parser를 관측하고, 전체 파싱 결과와 이름/개수 일치를 확인한 뒤 새 Skill/미니언 목록 추가와 시험 계산·요구량/RefreshStatList 경고를 반환한다. renderer에 게임 문법/번역을 복제하지 않는다. 미해석/미지원/원본 오류·metadata/blank를 구분하고 원문·native 저장 필드·정규화된 라벨을 보여준다. 부분 적용은 명시 확인을 요구하고, 전부 미지원 입력은 원문/진단만 기록할 수 있다. inputEvidence는 XML/계산과 별도로 source build/revision/hash/runtime·raw/줄 진단/시험 수치를 저장하며 재계산·undo와 JSON 복사/가져오기에도 남는다. 전체 revision ledger 구현은 아니다.

실제 native5·입력 기록 unit5·check193/build 중간 통과, 최종 strict 응답 검증/현재 UI build 및 실제 source/packaged·두 크기·OS clipboard 동선은 아직 진행 중이다. 초기 native 검사는 한국어 label을 보존할 것이라는 가정과 새 젬 추가 후 모든 수치가 그대로일 것이라는 가정으로 실패했다. 실제 Common.sanitiseText가 비ASCII를 변환하며, 새 레벨5 Fireball은 주력 유지에도 ReqInt14→28을 만들었다. UI 우회 번역 없이 부분 복원/원문 보존과 실제 시험→최종 XML 계산의 전체 수치 대조로 수정해 native5를 통과했다. 초기 단위 테스트의 optional 타입 오류도 수정했다. 실패를 실제 source/GUI 성공으로 계산하지 않는다.

고정 PoB0.23.1/`5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`, KB/PoK 비사용. runtime `pob-af5e39950789293ad0ff4a902d527cdccb9e7383b413507920ea5346bab3bcac` / manifest SHA256 `c78104cc3ba3bd9ae1b90226366e64692840a6c46bc690d46f3cb47381929314`; editor `pob-editor-3b90ce810a11a65e550c3908b187671d25d878a91e292fd96ed70d4e5a83b2c6` / SHA256 `ea41e8e488b890e912b5b33c63f33d6f3d4267680029504cf8757f7f8697495a`. 공유 엔진·원본 소스/문서/ref 수정 없음. 한국어 아이템 지원 검사를 수행한 것은 아니며 이번 관측은 스킬 텍스트의 Unicode 정규화다. 전체 PoB 목표는 active다.


## 전체 XML 스킬 그룹 복제·세트 간 이동 — 2026-11-03 (26차)

UI 구현 **`200e309bb8eae979230d1ba8a8fa0b26d26c9c21`**, 브랜치 `skerfolg/coho`. 다른 PC는 이후 문서까지 포함한 `origin/skerfolg/coho` tip을 받는다. 다음은 다른 portal 편집 폼의 submit 전파 감사, 원본 그룹 텍스트 가져오기/내보내기·클립보드 계약, generated-group lineage와 원본 control/옵션/남은 전체 수동 기능이다. 전체 목표 active.

최종 source `.local/skill-transfer-native-1793663206062/result.json` / Windows packaged `.local/skill-transfer-native-1793663669798/result.json` **각5개 그룹 통과**. native5/unit5/check188/build/pack:win 및 기존 그룹 source5(`.local/skill-groups-native-1793663479356/result.json`) 통과. 생략 속성 입력의 미리보기 XML/revision0 불변·대상 변경/취소/문서 격리, 전체 XML 복제·확인 이동·source/target 근거, undo/redo·명시 대상 활성/revision7의 원래 actor full numeric output·저장/재시작·PoK 미연결을 확인했다. 최종 source/packaged의1920/1024 PNG를 직접 시각 확인했다. packaged는 실제 exe에 포함된 runtime/editor payload를 사용한다.

같은/비활성 대상 세트 끝에 원본 LoadSkill로 observed XML을 복원하고, 이동은 원본 삭제 컨트롤로 source를 제거한다. host는 요청·lineage·append 위치·active 순서·두 selector를 검증해 canonical DOM 전체를 복제한다. source unknown/비활성 XML·원문을 보존하며 renderer에 게임 규칙/텍스트 parser를 복제하지 않는다. UI는 대상 ID/이름/그룹 수·비활성 대상 미측정, 검토/취소/적용/새 계산과 transfer receipt를 제공한다. [계약과 범위](POB-SKILL-GROUPS.md)를 따른다.

UI 결함 최소 재현 `.local/skill-transfer-native-1793663024140`: includeInFullDPS 생략 XML에서 모달 preview submit이 바깥 SkillsView form까지 전파돼 미적용 revision0→1을 만들었다. stopPropagation으로 수정하고 위 생략 속성 fixture 전체 동선으로 검증했다. 초기 명시 속성 source5/packaged5(`1793662434163`/`1793662696123`)는 이 회귀를 잡지 못했으며 최신 결과로 쓰지 않는다.

환경 실패 이력: 최초 pack:win/source transfer `1793661818229`/기존 그룹 `1793661872762`는 ENOSPC로 중단됐다. source revision3 계산 저장 대기·PNG/result0바이트를 성공으로 집계하지 않는다. 꽉 찬 디스크에서 테스트 수정 시 신규 CJS 파일 하나가0바이트가 되어 원문을 복구하고 다른 src/tests/runtime 파일에0바이트가 없음을 확인했다. 이후 source `1793662137379`는 screenshot90초 timeout(원인 미확정)으로 중단됐다. 최종은 공간 확보·복구/수정 후 새 합성 프로필로 전부 재실행했다.

PoB **0.23.1 / `5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`**, KB/PoK 비사용. runtime `pob-0b53f1ea06c9c93d59cb2a964c2aded41fbbb714756f42d53acba7d684613eea` / manifest SHA256 `772d1b751c7c102f6a5c912ffd37d60943b5018d53284566700155f5e6739a4e`; editor `pob-editor-411c6eb7ad7207cfb47f313c1d40873db0e606b251175471980d7292a7ac32cb` / SHA256 `b3b1fa576c7a77208167b8857b1e4db0eed54a35921fd96c3d55614995a14315`. 원본 PoB/공유 엔진 소스·문서/ref 수정 없음. 경로/manifest/known content/reparse 검사 후 중간3b8a 및 오래된 재생성 가능 b68aec/83c3b의 runtime/editor 캐시6개만 정리했다. 최신 검증24/25차 백업·사용자 workspace를 보존했다.

남은 범위: 원본 텍스트 붙여넣기/내보내기·OS clipboard, source 비활성 직접 관리·전체 삭제/drag UI·generated-group lineage, 미니언/부여 효과·전수 조합·원본 control/옵션/네트워크 기능, 전체 revision ledger, 원본 PoB GUI 왕복/portable·선택 PoK/모델 검증. 새 엔진 결함을 확인한 것은 아니며 UI submit 결함을 해결했다. 전체 PoB 동등성 및 #188 해결/재평가 준비 완료를 선언하지 않는다.

## 원본 스킬 그룹 순서·삭제 — 2026-11-03 (25차)

UI 구현 **`061319d42bcc242a5365dd7c3204d04cfaf117e9`**, 브랜치 `skerfolg/coho`. 다른 PC는 이후 인계 문서까지 포함한 `origin/skerfolg/coho` tip을 받는다. 다음은 원본 그룹 복사/붙여넣기·세트 간 이동 계약과 generated-group lineage 조사, 원본 control/옵션/명령 전수 대응표 및 남은 전체 수동 기능이다. 전체 목표 active.

기존 readLoadouts에 원본 SkillListControl의 순서/삭제 계약과 검토·적용·새 계산 UI를 연결했다. LoadSkill 객체 lineage로 중복 이름을 구분하며 deep canonical XML·비활성 세트·주력/Calcs 선택을 보존한다. 원본 source 그룹 삭제 제한과 복원 중 생성/교체된 그룹의 lineage 불충분은 명시 진단한다. [계약과 남은 범위](POB-SKILL-GROUPS.md)를 따른다. 그룹 복사/붙여넣기/세트 간 이동·장기 revision ledger 및 전체 원본 기능은 남으며 전체 목표 active다.

최종 source `.local/skill-groups-native-1793660957383/result.json` / Windows packaged `.local/skill-groups-native-1793661015590/result.json` **각5개 그룹 통과**. native4/unit3/check186/build/pack:win 및 기존 sets-config source8(`.local/sets-config-native-1793660903295/result.json`) 통과. pending/preview 취소·문서 전환, 중복 이름 양방향 이동·source 선택 유지, 원본 확인 삭제·주력/Calcs selector·unknown/비활성 XML·전체 수치 보존, undo/redo/revision5 새 계산·저장/재시작·PoK 미연결을 확인했다. 두 크기 source/packaged preview를 직접 시각 확인했다. packaged 실행은 실제 exe와 포함된 runtime/editor payload를 사용했다. 아래 진행 중/하네스 실패는 이 최종 결과로 대체한다.

중간 실패: 첫 source는3개 그룹 후 redo receipt를 잘못 기대해 중단됐다. 다른 XML의 계산을 거친 뒤 근거를 되살리는 장기 ledger는 아직 없다. 다음 source/packaged는4개 그룹 후 restart 비교에서 -0/JSON 0 표현 차이로 중단됐다. 하네스 기대만 보정해 위 최종 source5/packaged5로 재실행했고 제품 계산/저장은 바꾸지 않았다. 초기 실패를 전체 통과로 집계하지 않는다. 원본 GUI 왕복/portable·OS clipboard·선택 PoK/모델·전체 조합은 미수행/미완료다. 이번은 독립 수동 편집 보완이며 #188 해결/재평가 준비 완료를 선언하지 않는다.

PoB 0.23.1 / `5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`, KB/PoK 비사용. runtime `pob-93debe057e4392651d0e374a93b9dfd5435e8159526060727541dc430d5cd904` / manifest SHA256 `e98bf09f7c0ef356d10bb6d90615be017769569f43858717c77964a114383f72`; editor `pob-editor-d8dc6fecbc8c8ddc6b8dbdf05275af58a5791af172f0b4b5610719e2b27afdd2` / SHA256 `8171aa2abeb80825c5aca250e279a352fb0f67cce8a2ef532af7ca7ab1a687da`. 원본/공유 엔진 소스·문서/ref 수정 없음. 공간 확보는 절대 workspace 경로·manifest identity·단일 known content·reparse 검사 후 비검증 intermediate bef56/94a667의 runtime/editor 백업4개만 제거했다. 검증 checkpoint/사용자 workspace는 보존했다.


## 노트 색상 편집·코드 보기·범위/초안 동작 — 2026-11-03 (24차)

UI 구현 **`219b76b386dcad58a0e0cbebc3e05ee9c9105e71`**, 브랜치 `skerfolg/coho`. 다른 PC는 이후 인계 문서까지 포함한 `origin/skerfolg/coho` tip을 받는다. 다음은 원본 세부 control/옵션/남은 전체 수동 기능과 입력 실패·장기 근거 감사다. 전체 목표 active.

최종 source `.local/notes-native-1793659213134/result.json` / Windows packaged `.local/notes-native-1793659409290/result.json` **각6개 그룹 통과**. 원본 NotesTab parity2/unit7/check183/build/pack:win 및 기존 sets-config source8(`.local/sets-config-native-1793659219771/result.json`) 통과. 전체 높이/스크롤·색상/코드보기·원본 범위 색칠·actual caret/로컬 undo·zoom·clipboard synthetic 이벤트·한글/emoji/CRLF·원문/unknown·build undo/redo·초안 문서 격리/재시작을 확인했다. 두 크기의 source/packaged 전체 높이 paint를 직접 시각 확인했다. 아래 진행 중과 이전 clipped PNG/하네스 실패를 이 최종 결과로 대체한다.

PoB **0.23.1 / `5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`**, KB/PoK 비사용. 이번 UI-only 변경은 기존 runtime `pob-c3830dc62a9a39bc4040d36bb0ce4448bf5378c4bc5c5849b33a2f7a9906d74e` / manifest SHA256 `3ec5a25f4040e3af75e32df6ae225f5be92e95568cab35304ed02a753d0d6cd7`, editor `pob-editor-d5ab4c116002fb1972629c9803e305127415c3826f6be2903c7a2ee78a33acbe` / SHA256 `f90c7de4c5c0ed873f44da523120a85cef6f35ceaa8f62f16bd2653f230cd885`를 그대로 검증/사용했다. 추가 graphics 규약 source는 POB-NOTES의 별도 commit이며 배포 DLL의 정확한 source commit/원본 GUI pixel parity를 확인한 것은 아니다. 원본/공유 엔진 소스·문서/ref 수정 없음.

남은 범위: 실제 OS IME/clipboard·원본 GUI font/render parity, 원본 control/옵션/명령 전수 대응표·고급 스킬/미니언/아이템/트리·계산/파티/네트워크/단축키, 혼합 입력·다른 load 실패·장기 revision 근거, 원본 GUI 왕복/portable·선택 PoK/모델 검증. 합성 notes/UI 검증을 전체 빌드·언어·원본 기능 동등성/게임 성립으로 확대하지 않는다. #188 해결/재평가 준비 완료를 선언하지 않는다. 전체 목표 active.

원문과 표시 문자열의 offset mapping/색상 span·투명 textarea를 분리해 코드가 숨겨진 상태에서도 직접 편집한다. indexed/hex 색상·named preset, raw toggle, 원본 SetColor 범위 동작, beforeinput caret/반복 문자·한글/emoji·CRLF, local undo/redo, zoom/scroll, copy/cut/paste 이벤트의 원문 코드 보존을 연결했다. view/zoom은 build revision을 만들지 않으며 적용/기존 XML patch만 저장한다. unknown notes metadata/원문/undo는 유지한다. [원본 규약/차이/출처](POB-NOTES.md)를 따른다.

check183/build 통과, 원본 NotesTab Lua parity2·표시/편집 unit7 통과. 실제 source `.local/notes-native-1793658479882/result.json`6개 그룹 통과, 두 크기의 색상/코드편집·원문 보존·줌/undo·저장/재시작 확인. 초기 fixture는 Notes tag 없는 createBlankXml을 가정하지 않아 앱 시작 전에 실패했고 section을 명시 생성하도록 보완했다. packaged/기존 세트·조건 회귀는 진행 중이다. 실제 OS IME/clipboard/원본 PoB GUI pixel/font parity와 전체 PoB 기능 완료는 주장하지 않는다. 원본/공유 엔진 소스는 수정하지 않았다.

## 과거 지원 트리의 공통 카탈로그 — 2026-11-03 (23차)

UI 구현 **`4ebeaa0ab4ab62c662dc287d505a761228bd0e04`**, 브랜치 `skerfolg/coho`. 다른 PC는 이후 인계 문서까지 포함한 `origin/skerfolg/coho` tip을 받는다.22차의 과거 tree catalog gate 감사는 이번에 완료했고, 전체 원본 control/남은 수동 기능·다른 load 실패 감사는 계속한다. 전체 목표 active.

최종 source `.local/catalog-versions-native-1793656910921/result.json` / Windows packaged `.local/catalog-versions-native-1793657050359/result.json` **각5개 그룹 통과**. native6/check176/build/pack:win 통과. old0_1/latest0_5 원본 item/mod/gem 선택→적용→full numeric stats 일치, tree version/unknown/originalXml 보존, old undo4/redo5·새 계산, unsupported active/inactive 진단·카탈로그/계산 차단/원문0, 저장/재시작·PoK 미연결을 확인했다. source/packaged 두 크기의 과거 tree catalog/선택·적용 버튼과 수치를 직접 시각 확인했다. 아래 진행 중/하네스 실패는 이 최종 결과로 대체한다.

PoB **0.23.1 / `5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`**, KB/PoK 비사용. 이번은 UI/host 변경이며22차 runtime `pob-c3830dc62a9a39bc4040d36bb0ce4448bf5378c4bc5c5849b33a2f7a9906d74e` / manifest SHA256 `3ec5a25f4040e3af75e32df6ae225f5be92e95568cab35304ed02a753d0d6cd7`, editor `pob-editor-d5ab4c116002fb1972629c9803e305127415c3826f6be2903c7a2ee78a33acbe` / SHA256 `f90c7de4c5c0ed873f44da523120a85cef6f35ceaa8f62f16bd2653f230cd885`를 그대로 검증/사용했다. 원본/공유 엔진 소스·문서/ref 변경 없음. [로드 계약 최소 재현/필요 계약](POB-LOAD-CONTRACT.md)을 별도로 남겼다.

남은 범위: 원본 control/옵션/명령 전수 대응표, 고급 아이템·스킬/미니언·특수 트리·계산/파티/노트/네트워크/단축키, 혼합 구형 입력 선택과 다른 종류의 load 실패 감사, 전체 revision 장기 근거, 원본 GUI 왕복/portable·선택 PoK/AI 검증. legacy AI 제안 경로의 version 조건은 이번 수동 catalog gate 변경과 별도로 남는다. 모든 직업·아이템·젬·조건 조합 및 #188 해결/재평가 준비 완료를 선언하지 않는다. 전체 목표 active.

원본 Build의 self.data=data는 tree와 독립적인 공통 item/gem/skill 데이터다. UI가 defaultTreeVersion과 일치할 때만 catalog를 허용하던 조건을 출처 일치/runtime ID/commit·양쪽 supportedTreeVersions 확인으로 바꿨다. 직업/전직은 기존 버전별 native control을 유지하며 최신 catalog class ID를 과거 tree에 매핑하지 않는다. 원문 편집·초기 생성과 catalog 준비/지원 오류도 구분한다.

첫 native 실행은0_1~0_5 모두 원본 rare Strength7→15/Fireball4.4583333333333 계산을 통과했으나, unsupported9_99의 Item API는 원본 headless의 XML load 종료 후에도 거부되지 않고 결과를 반환했다. 요청한 문맥의 복원 성공으로 간주할 수 없으며 기본 빌드 계산 수치로 바뀌었는지까지 측정하지 않았다. 이를 성공으로 기록하지 않고 `.local/standalone-pob/catalog-versions-before-guard.json`에 보존했다. host는 모든 canonical Spec의 명시 treeVersion을 XML/item context/support XML에서 검사해 미지원 active/inactive를 실행 전에 POB_TREE_VERSION으로 거부한다. build.targetVersion을 treeVersion으로 추정하지 않고 root legacy Spec의 실제 복원 계약도 유지한다. 원본/공유 엔진 소스는 수정하지 않았다. 전체 check/실제 source/packaged 검증은 진행 중이다.

## 원본 트리 코드 가져오기·내보내기 — 2026-11-03 (22차)

UI 구현 **`ade5cdaa4dedfa9a065bc71421b5d5214e3b7ae5`**, 브랜치 `skerfolg/coho`. 다른 PC는 이후 인계 문서까지 포함한 `origin/skerfolg/coho` tip을 받는다. 다음 재개는 과거 tree의 catalog gate 근거 감사와 원본 세부 control/남은 수동 기능을 따른다. 트리 code를 서비스 URL/전체 빌드 export로 취급하지 않는다. 전체 목표는 active다.

최종 source `.local/tree-code-native-1793654938646/result.json` / Windows packaged `.local/tree-code-native-1793655107706/result.json` **각7개 그룹 통과**. native8/빈 문서1/check173/build/pack:win 통과. readonly export·버전/copy IPC, 명시 version·입력 변경/취소/문서 격리, 원본 full stats/revision1, invalid/partial 원문·미복원 ID/revision2와 재시작, undo3/redo4의 새 수치와 source evidence revision2, no-tree import/계산, 원본 loader/code 누락 구분·다중 문서 복원을 확인했다. 두 크기 source/packaged preview 직접 시각 확인. 두 실행의 clipboard는 `ipc-only-rich-clipboard-preserved`이며 기존 rich clipboard를 보존해 OS write는 미수행이다. 아래 진행 중/초기 실패는 이 최종 결과로 대체한다.

PoB **0.23.1 / `5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`**, KB/PoK 비사용. runtime `pob-c3830dc62a9a39bc4040d36bb0ce4448bf5378c4bc5c5849b33a2f7a9906d74e`, manifest SHA256 `3ec5a25f4040e3af75e32df6ae225f5be92e95568cab35304ed02a753d0d6cd7`; editor `pob-editor-d5ab4c116002fb1972629c9803e305127415c3826f6be2903c7a2ee78a33acbe`, manifest SHA256 `f90c7de4c5c0ed873f44da523120a85cef6f35ceaa8f62f16bd2653f230cd885`. 원본/공유 엔진 소스·문서/ref 수정 없음. [원본 제한과 요청할 계약](POB-CODE-LIMITATIONS.md)에 최소 재현·UI 영향을 분리했다. UI에 decoder/번역/게임 규칙을 복제하거나 전체 복원으로 포장하지 않았다.

다음은 같은 PoB pin에서 과거 tree 버전의 catalog gate가 실제 원본 기능을 불필요하게 막는지 감사, 원본 control/옵션/명령 전수 대응표, 고급 아이템/스킬/미니언/트리·계산/파티/노트/네트워크/단축키, 혼합 구형 입력 선택, 전체 revision 장기 근거 이력, 원본 GUI 왕복/portable·선택 PoK/AI 검증이다. 모든 code/직업/버전/특수 조합과 원본 서비스 URL은 미완료다. #188 해결/재평가 준비 완료를 선언하지 않는다. 전체 목표 active.

원본 OpenExportPopup의 Copy 결과는 현재 pin에서 URL이 아닌 버전 없는 GGG 코드다(GameVersions의 url 없음). UI도 코드로 표시하고 버전을 별도로 전달/선택한다. 원본 Import popup의 이름/입력을 검증한 뒤 명시 버전의 원본 PassiveSpec.DecodeURL을 호출해 새 트리를 추가하며, 과거 popup의 latest 자동 가정을 사용하지 않는다. code에 없는 주얼/능력치 선택/무기별 할당·전직 및 인코더 한계는 원본 왕복으로 진단한다. 원본 AllocateDecodedNodes의 실패 lookup만 관측해 미복원 ID를 반환하며 렌더러에 byte decoder/게임 규칙을 넣지 않았다. 저장 XML→원본 복원과 원본 복원→코드 왕복의 누락을 별도로 표시한다. 내보내기/미리보기는 readonly이며 검토 적용만 새 revision 계산과 receipt를 만든다.

native8 및 빈 문서1 검사 통과, check173/build 통과. 현재 XML/hash/runtime이 같을 때 재계산은 새 수치/리비전만 쓰면서 이전 편집 근거를 별도 source evidence로 보존한다(입력/소유/엔진이 다르면 계승 안 함). GUI/패키지·두 크기·복사·부분 복원/재시작은 진행 중이다. 처음 270개 임의 ID는 원본이 1개만 복원해 인코더 한계 fixture로 부적합했으며, 원본 그래프의 연결된 입력과 실제 로드 수를 검증하도록 고쳤다. 원본이 지원하지 않는 단축 URL/PoEPlanner의 네트워크/버전 계약은 계속 미지원이며 원문은 보존한다. 모든 원본 기능 완료를 선언하지 않는다.

## 구형 단일 Spec의 편집 형식 전환 — 2026-11-03 (21차)

UI 구현 **`616e4546e0e07f7894573edec499c467ec0bb731`**, 브랜치 `skerfolg/coho`. 다른 PC는 이후 인계 문서까지 포함한 `origin/skerfolg/coho` tip을 받는다.20차의 단일 root Spec 미지원은 이번 명시 전환으로 보완했다. 다음은 원본 트리 URL/세부 control 대응표와 남은 전체 수동 기능이며, 전체 목표는 active다.

최종 source `.local/tree-adoption-native-1793652063718/result.json` / Windows packaged `.local/tree-adoption-native-1793652224912/result.json` **각5개 그룹 통과**. native4/check169/build/pack:win 및 source/packaged 두 해상도 직접 시각 확인 통과. 원문 preview/대기 취소·문서 격리, 원본 전체 수치와 동일한 adoption/revision1, unknown/원문/receipt 재시작, 별도 원본 Copy + Convert/revision2, undo3/4 원문 복귀·redo5 새 계산, 혼합 입력 거부/타 문서 보존/재시작·PoK 미연결을 검증했다. 아래 진행 중 기록은 이 최종 결과로 대체한다.

PoB **0.23.1 / `5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`**, KB/PoK 비사용. runtime `pob-66822b826219a0f943515ba0b1146cd43912720cf23f0dbbf9b2facf12ee4620`, manifest SHA256 `0296ce574c57c47a4a6cd5f0ba5bff4798a65011ab9f3ea37f8bfdf6d6aa4e08`; editor `pob-editor-f1b8538a45faf3fc8fb6ba72a5f1ed480d4d79fae9d55bf71fc161a2be56c100`, manifest SHA256 `d99bb53d35a19481bfcb162cd6cd97f4d11ab96fe7f2564ae356a6cc9da9d055`. 원본/공유 엔진 소스·문서/ref 수정 없음. 새 엔진 결함을 확인하지 않았으며 Tree 혼합/다중 root Spec은 명시 선택 계약이 없는 UI 미지원으로 보존/진단한다.

다음은 트리 URL·원본 control/옵션/명령 전수 대응표, 고급 아이템/스킬/미니언/특수 트리·계산/파티/노트/네트워크/단축키, 혼합 구형 입력 선택, 원본 PoB GUI 왕복·portable·선택 PoK 호환/AI 검증이다. #188의 최종 조합·실물 피드백·에이전트 재설계 검증을 수행하지 않았으므로 해결/재평가 준비 완료를 선언하지 않는다. 전체 목표 active.

기존 root Spec 보호를 유지하면서 명시 `adopt`를 추가했다. 원본 PoB는 원문 그대로 로드하며 실제 복원 version/class/할당을 Save로 조회한다. host는 단일 root Spec/Tree 부재를 검증하고 원래 위치에서 정확한 Spec을 Tree로 감싼 뒤 native 최종 known state를 적용한다. unknown Spec 자식/속성·루트 형제·비트리 XML을 유지하고 source 원문/undo를 보존한다. 초기 생성·버전 업그레이드와 분리하며, 원문 버전과 실제 복원 버전의 차이 및 저장 ID/소켓 변화를 검토한다. 여러 root Spec 또는 Tree 혼합은 원문을 보존하며 거부한다.

native `tests/pob-tree-adoption-smoke.cjs` **4개 그룹 통과**, `.local/standalone-pob/tree-adoption-result.json`: 원본/옮긴 전체 numeric stat 일치(Life170), native 경로 편집/새 계산, 별도 Copy + Convert, 혼합/중복/잘못된 초기화 거부 후 원본 계산 불변. canonical 이동과 정규화 unit은 해당 파일13개 통과. 전체 check169/build 및 source/Windows packaged 동선은 진행 중이다. 전체 원본 기능·전수 버전/주얼/노드 조합·GUI 왕복/portable/PoK·모델 완료를 선언하지 않는다.

## 초기 트리·원본 버전 변환 — 2026-11-03 (20차)

UI 구현 **`dc36350249ebb356050be81dc17c71b2a19baa9f`**, 브랜치 `skerfolg/coho`. 다른 PC에서는 이 구현 이후의 인계 문서까지 포함한 `origin/skerfolg/coho` tip을 받는다. 다음은 구형 root Spec 정규화/직접 편집, 원본 tree URL·control/옵션/명령의 세부 대응표와 남은 고급 기능을 계속 구현한다. 아래19차의 ‘초기 생성·버전 변환이 다음’은 이번에 보완했으며 전체 목표는 유지한다.

최종 source `.local/tree-workspace-native-1793650856862/result.json` / Windows packaged `.local/tree-workspace-native-1793650959965/result.json` **각7개 그룹 통과**. native 작업6·legacy guard1·기존 native tree5·check167/build/pack:win 통과. 명시 초기 버전/직업, 복사/교체/전체 변환, 미적용/입력 변경/대기 취소·문서 격리, unknown/originalXml, undo/redo/revision6 새 계산, bare Warrior 초기화, legacy 실제 IPC 거부/원문0, 다중 문서/계산/receipt 재시작을 확인했다. 두 해상도의 source/packaged 검토 화면 직접 시각 확인. 아래 실행 중/중간 실패는 이 최종 결과로 대체한다.

PoB **0.23.1 / `5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`**, KB/PoK 비사용. runtime `pob-ac7d54149c8c54f756b1379a4ec977d59aff2675602a04061c0ae784b55d32a9`(1711파일), manifest SHA256 `748777f51573dcfbdf6c6c0f582b5565db54108ffedaa0de8c03c7a86f1e28b1`; editor `pob-editor-c6079d8bbc361f6d21d70ed45674936abb01deed9561acd1970bcd17d1b7bce5`, manifest SHA256 `b79eeaeda31bfb397a0bd04993eb38850c97d9a8ec9223407a456f7e1f28e24e`. 원본/공유 엔진 소스·문서/ref 변경 없음.

남은 범위: root의 단일 Spec 직접 편집/정규화, 트리 URL 동선·전수 버전/직업/전직/특수 주얼, 원본 control/옵션/명령 전수 대응표, 고급 아이템·스킬/미니언·계산/파티/노트·네트워크/옵션/단축키, 실제 PoB GUI 왕복·portable·선택 PoK/AI 결합/호환 검증. 이번 새 엔진 결함은 확인하지 않았으며 root Spec은 엔진이 읽을 수 있으나 UI canonical 편집 형식이 아직 대응하지 않는 제약이다. 지원 수동 작업은 가능하지만 #188의 최종 조합·실물 피드백·에이전트 재설계 검증을 하지 않았으므로 해결/재평가 준비 완료를 선언하지 않는다. 전체 목표 active.

원본 버전 dropdown의 Convert/Copy + Convert popup 및 ConvertAll, 초기화된 원본 spec의 직업/전직·이름 컨트롤을 기존 readLoadouts 경로에 연결했다. 트리가 없는 XML에서는 버전/직업을 명시 선택하며, 조회 결과는 적용할 수 없다. 변환 spec은 기존 canonical XML의 source/copy lineage와 native Save의 알려진 최종 필드를 반영해 unknown 필드를 보존한다. 새 UI는 요청·revision/XML/hash/runtime 확인과 명시 미리보기·적용/새 계산·자동 receipt를 사용한다. 전체 기능 목표는 유지한다.

추가 보완: native JSON의 객체 키 순서와 요청 내용을 구분해 비교하고 UI에는 검증된 원래 요청 순서로 돌려준다. 섹션이 전혀 없는 문서에서 새 parent를 자기 자식처럼 replace하던 canonical sets 삽입을 수정했다. 버전 변환에는 원본 최종 Save의 알려진 전체 상태를 반영해 로드 시 정규화된 노드/소켓이 다시 잔류하지 않게 하며, 원래 XML의 unknown 자식/속성은 보존한다. UI는 엔진 복원 후의 연산 변화와 저장 입력→변환본의 실제 노드/소켓 차이를 함께 표시한다. 초기화/복사/교체/전체 변환/빈 문서의 실제 계산은 중간 native 실행에서 통과했으며 최종 미복원 ID/거부 검사·GUI는 실행 중이다. 하네스의 없는 Notes 처리, PoB2 루트·주력 그룹 기본값, 유효 직업 없는 별도 fixture 오류는 제품/엔진 결함으로 집계하지 않는다.

첫 native inventory에서 미로드 과거 tree에 UpdateClassDropdowns를 호출해 nil 오류가 났다. 원본 main:LoadTree의 lazy loading 계약을 호출하도록 보완했다. 이후 런타임 staging/check가 C: ENOSPC로 중단됐다. workspace 절대 경로·내용 whitelist·reparse 검사 후 15~17시 생성 runtime/editor 백업12개와 정확한 실패 staging1개만 정리해 약4.2GB를 확보했다. 18/19차 검증 백업·사용자 작업 공간·엔진 소스는 보존했다. 검사 재실행 중이며 아직 native/GUI/패키지 성공을 선언하지 않는다.

## TreeView 원본 관리·미변경 XML 섹션 보존 — 2026-11-03 (19차)

UI 구현 **`e21b30be39266f1845064d4fa6a1968354e97d2a`**, 브랜치 `skerfolg/coho`. 다른 PC에서는 이 구현 이후의 문서까지 포함한 `origin/skerfolg/coho` tip을 받는다. 다음은 트리 없는 문서의 원본 초기화/생성 및 버전 선택·변환 API 조사/연결, 원본 control/명령 전수 목록의 세분화, 고급 장비·스킬/미니언·특수 트리·옵션/네트워크/단축키/노트·GUI 왕복·portable·선택 PoK/AI 잔여 결합이다. 전체 목표는 active다.

최종 source `.local/tree-management-native-1793647818011/result.json` / Windows packaged `.local/tree-management-native-1793647650631/result.json` **각6개 그룹 통과**. native 관리5·원본 tree export2·기존 세트 source4·check162/build/pack:win 통과. 구버전 지도는 3149노드·26/26이미지·실패0이고 혼합 버전 생성/재시작까지 확인했다. 1920/1024 packaged 검토 화면 직접 시각 확인. 아래 ‘실행 중’은 이 최종 결과로 대체한다. portable·원본 PoB GUI·실제 모델·전체 원본 기능 동등성은 미완료다.

PoB **0.23.1 / `5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`**, KB 비사용. runtime manifest SHA256 `eba6f022acb5fe78293725d6c87e0229dce4cf6fac356501f9f72a136d43e7ee`, editor manifest SHA256 `f1134055dfd9beae62afd9d8a8ac1df642c066e16d1f97febe6cc71e78868e47`. 공유 엔진/원본 PoB 소스·문서/ref는 수정하지 않았다. #188 해결·재평가 준비 완료를 선언하지 않는다.

추가 발견/수정: 첫 source 관리 검사는 4개 그룹을 통과한 뒤 0_1 문서 전환에서 renderer의 `nodeOverlay.Normal` 접근 오류로 중단했다. stock PassiveTree는 tree.lua를 읽지만 기존 변환기는 구버전 overlay가 없는 tree.json을 읽었다. 원본 Lua 테이블의 build-time export로 전환하고 source Lua/export/converter/output 해시를 구분했다. 5개 버전의 원본 프레임·좌표·연결 대조 native 2개 그룹은 통과했고 missingArtwork 모두0이다. 최초 추가 GUI 검사는 정상 지도가 표시됐으나 테스트가 canvas 대신 부모 div dataset을 읽어 timeout됐고, 조회 대상을 수정했다. 최종 GUI/packaged 검증은 진행 중이며 이 실패를 완료로 계산하지 않는다.

최종 준비 runtime `pob-aee96eb6663e90e18bd370821d77608b1e0d8ef7724f3362b1925703f8e71fc4`, editor `pob-editor-1fc67f395e8f0fdf80fadbb9e0b2376c7dad538dc4dc53c59fda33c0f6f62ceb`. PoB pin/version은 동일하다. 아래 bef56/d290는 중간 준비값이다.

기존 트리 세트 메뉴를 NativeTreeSets로 교체해 원본 PassiveSpecListControl의 New/Copy/Rename/Delete/드래그를 사용한다. modal에서 비활성/통합 구성 밖 spec도 직접 선택하고, 입력 후 원본 preview를 자동 조회해 검토 후 적용/새 계산한다. preview는 요청 signature·generation·id/revision/XML/runtime에 귀속하며 입력 변경/취소/문서 전환은 이전 결과를 폐기한다. 원본대로 추가/복사는 현재 활성 트리를 유지하며, 활성 삭제의 후속 선택은 원본 컨트롤이 결정한다. old input에서 New가 최신 treeVersion을 쓰는 것도 원본 API에 위임한다.

native `tests/pob-tree-management-smoke.cjs` **5개 그룹 통과**: inactive unmatched rename/copy와 deep unknown·현재 actor/전체 수치·비트리 섹션 보존, 중복 title의 요청 객체 삭제, inactive New/직접 reorder, active delete의 원본 인접 spec 선택과 실제 Life334/Dex47, 구버전0_1 유지/최신 inactive 생성·last/invalid/blank 거부 후 격리. check **162 passed**, build 통과. source/packaged 및 기존 회귀는 실행 중이다.

공통 native-sets 패치는 미변경 kind를 legacy 상태 그대로 유지하고 변경된 known set 슬롯만 교체한다. unknown 형제 위치/공유 item library/누락 weapon flag/다른 섹션을 불필요하게 재구성하지 않는 unit을 추가했다. tree-only는 native가 유지한 다른 세트의 active 선택/weapon flag를 새로 명시하지 않는다. UI에 게임 계산 규칙을 추가하지 않았다.

runtime `pob-bef56d3afe9cd3e81bf6d59be4dbc723babf29eae5812f4baa968b6802370bc8`, editor `pob-editor-d290368f6092a6bb991157543dd344b38506641e309e6768204eb6116a3af5ef`, PoB/KB 비사용 유지. C:40MB 상황에서 이번 작업의 오래된 2026-11-02T09/10 runtime/editor backup11개만 경로/내용 whitelist/reparse 확인 후 정리해 약3.5GB 확보했다. 최신 검증 backup·사용자 workspace·엔진 소스는 보존했다. 전체 목표 active, 원본 GUI/portable/모델 및 전수 동등성은 미완료다.

## 최신 체크포인트 — 2026-11-03, 18차

UI 구현 **`0ed5f6edf48d7d8c0a7d21b32fc371310f78cf36`**, 브랜치 `skerfolg/coho`. 원본 PassiveSpecListControl 드래그로 연결/공유 구성도 순서를 이동하며 실제 활성 네 객체·주력/무기·계산값을 보존한다. native5/source5/Windows packaged5/기존 named native6/check160/build/pack:win 및 두 크기 확인 통과. 아래 17차의 named reorder 미노출은 이번 tree scope 계약으로 보완했다. legacy loadout scope는 유지했다.

PoB **0.23.1 / `5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`**, KB 비사용. runtime `pob-5ec8df28dba66882da39f0c6b704f243ee3b1d177808888958f3bc17374db671` / manifest SHA256 `ba8131e1f1f3d207708668dbdd6ec78e3a157198e40078b5e19e3320f0a0dac1`; editor `pob-editor-9dbdc28948d5c3d2bd8e210bd28b1ba713971e1f1b1fee9b850116e6e84c8dda` / manifest SHA256 `a7145d697ad5fd1c7beb30ca3b4a593ba7971157686690504b882a77990142ca`. 원본/공유 엔진 소스·문서/ref 변경 없음.

다음은 구성에 속하지 않는 spec을 포함한 TreeView 원본 관리 API 연결, 모든 버전/이름 모호성·특수 공유 조합, 전체 원본 control 및 고급 장비/스킬·미니언/특수 트리·네트워크/옵션/단축키/노트 동등성, 실제 PoB GUI 왕복·portable·선택 PoK/AI 잔여 결합이다. 전체 목표는 active다. signed zero 표현 차이는 검사에서만 처리했으며 게임 계산을 수정하지 않았다. #188 해결·재평가 준비 완료를 선언하지 않는다.

## 원본 트리 드래그를 통한 연결 구성 순서 — 2026-11-03 (18차 진행)

최종: native5/source `.local/linked-reorder-native-1793642912224/result.json` 및 Windows packaged `.local/linked-reorder-native-1793643190539/result.json` **각5개 그룹 통과**. 기존 named 관리 native6도 재통과했다. 양방향 이동·공유 별칭·중복 title의 실제 활성 객체/전체 수치 보존, 취소·문서 격리, 정확한 undo/redo·revision4 계산과 이동 근거의 재시작을 확인했다. 1920/1024 PNG 직접 시각 확인. check160/build/pack:win 통과. 아래 진행 중 표기는 이 결과로 대체한다.

manifest SHA256: runtime `ba8131e1f1f3d207708668dbdd6ec78e3a157198e40078b5e19e3320f0a0dac1`, editor `a7145d697ad5fd1c7beb30ca3b4a593ba7971157686690504b882a77990142ca`. PoB/KB 비사용 유지, 원본·공유 엔진 소스/문서/ref 수정 없음. 원본 GUI/portable/실제 모델·전수 기능 동등성 및 #188은 이번 결과로 완료 처리하지 않는다.

source `.local/linked-reorder-native-1793642912224/result.json` **5개 그룹 통과**: pending 취소/preview 문서 격리/no-op 방지, inactive spec 아래/위 이동과 모든 수치 보존, 정확한 undo/redo·revision4 재계산, shared aliases의 동시 이동/활성 유지와 movement receipt, PoK 없는 재시작. 1920/1024 PNG 직접 확인. 최초 source `.local/linked-reorder-native-1793642654270`는 이동 전 baseline 비교에서 JSON fixture의 0과 IPC의 -0 차이로 중단됐다. signed zero만 비교 시 0으로 정규화했으며 키·비영 수치는 그대로 엄격 대조한다. 제품 계산은 수정하지 않았다. Windows packaged 검사는 진행 중이고 check160/build/pack:win 통과.

원본 PassiveSpecListControl/ListControl.OnKeyUp 드래그를 재생해 이름 기반 구성의 순서를 이동한다. 기존 BuildSetList 목록에 없는 brace 항목도 지원하며, 일반 항목 역시 UI에서는 명시적 tree scope로 같은 원본 트리 관리 컨트롤을 사용한다. 원본이 위치·클래스/포인트 설명·함께 이동하는 별칭을 제공한다. renderer는 brace 문법이나 활성 트리의 이름 매칭을 하지 않는다. 이동 후 원본 네 세트 객체/주력 그룹/무기 상태가 그대로인지 검증하고, canonical lineage 패치와 movement receipt를 기록한다. legacy loadout index scope API는 유지했다.

native `tests/pob-linked-reorder-smoke.cjs` **5개 그룹 통과** (`.local/standalone-pob/linked-reorder-result.json`): 비활성 linked spec을 unmatched spec 너머 아래/위로 이동, 공유 spec 별칭 동시 이동, 중복 title에서도 명시 활성 spec 객체 유지/원본 이름 해석 변경 알림, no-op/잘못된 위치/scoped 취소와 다음 입력 격리. 이동 전후 모든 유한 numeric stat을 정확히 비교해 같음을 확인했다(예: 활성 Life170, 공유 입력 Life334). 숫자 spec 위치 이동을 관계 소멸/활성 구성 전환으로 오표시하지 않는다.

check160/build 통과. source/Windows packaged 동선 및 두 해상도 확인은 실행 중이다. runtime `pob-5ec8df28dba66882da39f0c6b704f243ee3b1d177808888958f3bc17374db671`, editor `pob-editor-9dbdc28948d5c3d2bd8e210bd28b1ba713971e1f1b1fee9b850116e6e84c8dda`, PoB/KB 비사용 유지. 중간 metadata variant a9d9bc72 백업만 경로·내용·reparse·manifest ID 확인 후 제거해 공간을 확보했으며 검증된 이전 버전/사용자 workspace는 보존했다. 엔진/원본 소스 수정 없음. 전체 목표는 active이며 GUI/portable/실제 모델과 전수 동등성은 미완료다.

## 최신 체크포인트 — 2026-11-03, 17차

UI 구현 **`633214593764f0cfece5aaf29472f8bdd102ea9e`**, 브랜치 `skerfolg/coho`. 원본 이름으로 연결 구성을 관리하고 생존 구성 선택/관계 변화/입력 근거를 보존한다. named native6/일반 native6/source5/Windows packaged5/check160/build/pack:win 통과, 1920/1024 직접 확인. 아래 16차의 미노출 raw-name 관리는 이번 단계에서 rename/copy/delete까지 연결했다.

PoB **0.23.1 / `5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`**, 독립 편집 KB 비사용. runtime `pob-41528f5ed360ff1e0ca5e39a4a47cae12e63053a7f4a8f6fa29eac8ac01611fe` / manifest SHA256 `cacd0ee25e46f9dde35484263f94a0e757847572845e7d957a3340998bba6584`; editor `pob-editor-f4e803b67e03d8b2fab251f28e2452b383615bf3506ff3de0f23d96d4ad3cd0a` / manifest SHA256 `ad1b8694208541a1fa5b44d3a53f977ce7c9c62f4a922cc913db3aef1a1cb05e`. 공유 엔진/원본 소스·문서/ref는 수정하지 않았다.

다음은 이름 기반 구성 reorder에 사용할 원본 트리 관리 API 조사/연결, 모호한 이름·모든 공유/버전 조합, 전체 원본 control 및 고급 장비/스킬·미니언/특수 트리·네트워크/옵션/단축키/노트 동등성, PoB GUI 왕복·portable·선택 PoK/AI 잔여 결합이다. 전체 목표는 active다. 이번 결과를 원본 GUI/모델/portable 또는 #188 해결·재평가 준비 완료로 확대하지 않는다.

## 연결 구성의 이름 기반 관리·관계 변화 기록 — 2026-11-03 (17차 진행)

최종: named native6/기존 일반 native6, source `.local/linked-management-native-1793640282299/result.json` 및 Windows packaged `.local/linked-management-native-1793640658461/result.json` **각5개 그룹 통과**. 한국어 복사·혼합 관리 주소·명시적 생존 구성 삭제·undo/redo/revision4 재계산, 공유 spec의 두 연결 제외/실제 세트 보존, 입력 근거와 관계 변화의 재시작 보존을 확인했다. 두 크기 PNG를 직접 시각 확인했다. check160/build/pack:win 통과. 아래 실행 중 표기는 이 결과로 대체한다.

manifest SHA256: runtime `cacd0ee25e46f9dde35484263f94a0e757847572845e7d957a3340998bba6584`, editor `ad1b8694208541a1fa5b44d3a53f977ce7c9c62f4a922cc913db3aef1a1cb05e`. 원본/엔진 소스·문서/ref 변경 없음. named reorder·모호한 이름/버전/특수 공유 조합과 전체 원본 기능은 여전히 미완료이며 #188 해결이나 원본 GUI/portable/모델 검증으로 확대 해석하지 않는다.

검증 갱신: 최종 named native **6개 그룹 통과**, 기존 일반 관리 native **6개 그룹 재통과**. source `.local/linked-management-native-1793640282299/result.json` **5개 그룹 통과**: capability/미지원 reorder·preview 문서 격리, 한국어 raw-name 복사·혼합 index 미리보기, 생존 구성 명시 삭제/undo/redo·재계산, 공유 alias 두 연결 제외/저장 세트 보존·receipt, 재시작. 두 해상도 직접 시각 확인. Windows packaged 동선 실행 중이며 check160/build·pack:win 통과.

원본 목록에는 있으나 ListControl에 없던 brace 구성을 원본 GetLoadoutByName/이름 기반 Popup·서비스로 rename/copy/delete한다. native가 동작별 capability와 opaque 이름/선택 가능한 생존 구성을 제공하며 renderer는 brace 문법을 파싱하지 않는다. 목록 기반 관리와 이름 기반 관리를 함께 지원하고, 마지막 일반 관리 행도 다른 연결 구성이 있으면 이름 기반 삭제를 사용할 수 있다. 이름 기반 삭제는 생존 구성을 명시적으로 요청받고 원본 Delete→Sync→GetLoadoutByName/SetActiveLoadout으로 새 위치를 조회한 뒤 같은 실제 객체가 선택됐는지 검사한다.

원본 연산 전/후 연결 구성과 실제 세트 객체를 비교해 추가/제외/연결 변경을 표시한다. 공유 spec의 한 별칭 이름 변경이 다른 별칭까지 목록에서 없애는 것도 보이며, 실제 세트 제거와 구분한다. 적용 후 계산 receipt의 workspace_operation에 입력 revision/XML hash·검토 runtime·원본 선택/관리 요청·관계 변화를 자동 저장한다. 미리보기/실패/취소는 canonical XML을 바꾸지 않는다.

초기 native5개 그룹 통과: linked raw rename, 한국어 이름 복사와 Life170/Dex25, 공유 spec rename의 두 연결 제외/저장 세트 보존, 명시적 생존 구성·혼합 목록 삭제, 잘못된 입력·미지원 이름 기반 reorder 후 격리. 중간 위치의 생존 spec이 이동하는 추가 사례를 포함한 native6와 실제 Electron/패키지 검사는 진행 중이다. 최초 native 검사의 ItemSet DTO에 없는 attributes 접근을 원문 marker 확인으로 수정했다(제품 데이터 손실이 아니었음). check160/build 통과. 원본 GUI·portable·실제 모델은 이번에 미수행이며 전체 목표는 active다.

runtime `pob-41528f5ed360ff1e0ca5e39a4a47cae12e63053a7f4a8f6fa29eac8ac01611fe`, editor `pob-editor-f4e803b67e03d8b2fab251f28e2452b383615bf3506ff3de0f23d96d4ad3cd0a`, PoB pin/KB 비사용 유지. 디스크 공간 확보는 검증에 사용하지 않은 중간 adapter runtime1a38c606 백업 1개만 workspace 내부 경로/manifest ID/내용/reparse 확인 후 정리했다. 검증된 이전 runtime/사용자 workspace는 보존했고 엔진 저장소는 수정하지 않았다.

## 최신 체크포인트 — 2026-11-03, 16차

UI 구현 커밋 **`a08ff0a01ca4617b88063e809034bd3eee2170c6`**, 브랜치 `skerfolg/coho`. 원본 Loadout 관리와 XML 출처 보존을 추가했다. native6/source 관리5/Windows packaged 관리5, 후속 표시 source2/packaged2, check160/build/pack:win 통과. 실제 결과/범위와 최초 검사 수정은 아래 16차 및 VALIDATION을 따른다. 과거 체크포인트의 ‘관리 미구현’은 당시 상태다.

PoB **0.23.1 / `5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`**, 독립 편집에는 KB 비사용. runtime `pob-ac2d6492742dcd1ddeb2e3916815e6543abdadb9ddfb62fac8ee93868c8cf2ed` / manifest SHA256 `373a4eb54fad31e8957fe0828f7407b9e43fd40a3857c82bbc814cc3669194c1`; editor `pob-editor-c9729151adbd0dd1d4ba773b7de5398039a92b71e22f564730e71a7ddad0acee` / manifest SHA256 `4a799e18d12fc2849aebd9c3a8017729ee9ffc1d8289780ec0e2e585bf450ff2`. 원본/공유 엔진 checkout은 수정하지 않았다.

다음은 brace 연결 항목의 raw-name 관리 API 연결과 전체 원본 control/고급 장비·미니언·특수 트리/버전·네트워크 가져오기/옵션·단축키·노트 동등성, 실제 PoB GUI 왕복/portable, 선택 PoK/AI 잔여 결합이다. brace 사례는 선택2/관리목록0을 확인했지만 Build API 부재나 엔진 결함으로 단정하지 않는다. 전체 목표는 active이고 #188 해결/재평가 준비 완료를 선언하지 않는다. 실제 모델/원본 GUI/portable는 이번에 미수행이다.

## 원본 Loadout 관리·XML 출처 보존 — 2026-11-03 (16차 진행)

최종: 관리 전체 source/Windows packaged 각5개 그룹과 native6개 그룹 통과. 최종 표시 전용 Windows packaged `.local/loadout-management-native-1793638401983/result.json`도 **2개 그룹 통과**, 원본 유지·실제 이름 변경·제거 네 세트의 1920/1024 viewport를 확인하고 PNG를 직접 시각 확인했다. 전체 동선 검증 후의 변경은 표시부와 캡처 범위이며 backend/적용 동작은 동일하다. check160/build/최종 pack:win 통과. 아래 진행 중 기록은 이 결과로 대체한다. source 전체 `.local/loadout-management-native-1793637587048`, packaged 전체 `.local/loadout-management-native-1793637875490`, source 표시 `.local/loadout-management-native-1793638186615`가 각 결과 경로다.

최종 manifest SHA256: runtime `373a4eb54fad31e8957fe0828f7407b9e43fd40a3857c82bbc814cc3669194c1`, editor `4a799e18d12fc2849aebd9c3a8017729ee9ffc1d8289780ec0e2e585bf450ff2`. PoB pin/KB 비사용은 유지했고 공유 엔진·원본 PoB 소스는 수정하지 않았다. portable·원본 GUI·실제 모델은 이번에 미수행이며 #188 해결/재평가 준비 완료를 선언하지 않는다.

검증 갱신: 최종 native **6개 그룹 통과**. source `.local/loadout-management-native-1793637587048/result.json` 및 Windows packaged `.local/loadout-management-native-1793637875490/result.json`에서 **각5개 그룹 통과**: 관리 preview/cancel·문서 격리, rename/copy·중복 이름 오류, Custom/New·실계산, 삭제 확인/정렬·undo/redo·새 revision 계산, PoK 없는 재시작. 두 크기 직접 시각 확인. 이후 검토 표시만 개선해 실제 이전/새 이름·복사·순서를 보여 주었고 source 표시 전용 `.local/loadout-management-native-1793638186615/result.json` **2개 그룹 통과**. 최종 packaged 표시 검사는 진행 중이다. 최종 check160/build 통과, pack:win의 원본/실계산 gate·패키징 통과.

범위 주의: brace 연결 fixture는 기존 원본 선택 choices2개지만 `management.entries=[]`였다 (`.local/standalone-pob/loadout-linked-management-inventory.json`). 현재 관리 폼은 원본 ListControl 목록을 사용하므로 이 항목의 rename/copy/delete/reorder는 노출하지 않는다. 이를 PoK 계산 결함이나 Build API 부재로 단정하지 않는다. 원본 raw-name 서비스 호출은 존재하므로 후속에서 그 API를 통한 관리 계약을 조사/연결할 수 있으며, UI의 자체 이름 매칭으로 우회하지 않는다. 전체 원본 기능·모든 버전/공유 조합의 동등성은 미완료다.

원본 BuildSetListControl의 이름 입력/중복 검사/삭제 확인과 BuildSetService의 New/Copy/Custom/Rename/Delete/Reorder를 replay하는 어댑터·관리 폼을 연결했다. native에서 기존 객체 ID와 복사 출처를 기록하고 새 세트만 원본 Save 노드로 전달한다. host는 기존/복사 세트를 canonical DOM에서 clone해 unknown 속성·자식/비활성 세트·공유 아이템을 보존하며, 전체 원본 export로 덮어쓰지 않는다. 제거 목록/변경을 검토한 뒤 한 revision으로 적용·새 계산하고 undo/redo한다. 출처 누락·중복 유지·잘못된 fresh 태그는 거부한다.

관리 순서는 실제 canonical spec 순서가 필요하므로 Loadout 요청은 활성 세트 명확성 검사를 유지하면서 raw XML을 원본에 로드한다. stock loader가 activeSpec을 복원하며 기존 Loadout native4개 그룹을 재실행해 통과했다. renderer에 이름 매칭/게임 규칙을 옮기지 않았다.

native 최초 관리 **5개 그룹 통과** (`.local/standalone-pob/loadout-management-result.json`): 원본 이름 변경·복사(실제 Life170/Dex25), Custom 혼합(Life334/Dex47)·New 기본값, 삭제/정렬 후 동일 계산, 중복 이름/잘못된 항목 후 격리 및 Future XML 보존. 원본 필터 목록의 drag semantics를 추가한 최종 native6/source/packaged 검사는 진행 중이다. check **160 passed**, build 통과. 두 크기 실제 GUI 확인은 검사 후 기록한다. 원본 GUI/portable/실제 모델 및 전 기능 동등성은 미완료다.

runtime `pob-ac2d6492742dcd1ddeb2e3916815e6543abdadb9ddfb62fac8ee93868c8cf2ed`, editor `pob-editor-c9729151adbd0dd1d4ba773b7de5398039a92b71e22f564730e71a7ddad0acee`, PoB `5d173cb`/0.23.1 유지. 공유 엔진 변경 없음. 변경은 체크포인트 이후 작업이며 전체 목표는 active다.

## 재개 체크포인트 — 2026-11-03

- UI 구현 커밋: **`80226a47daa2d461eee575755360a62ccee64572`**, 작업 브랜치 `skerfolg/coho`. 1~15차의 검증한 누적 독립 작업 공간을 보존했다. 아래 단계별 ‘미커밋’은 당시 진행 기록이며 현재 상태는 이 체크포인트를 따른다. 전체 목표는 active다.
- 원본 PoB: **0.23.1 / `5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`**. 독립 작업에는 PoK/KB를 사용하지 않는다. 선택 PoK 감사의 과거 기준은 `e7bd429…`/KB0.5.4b였으며, 이번 독립 편집기 검증을 최신 PoK·모델 연결 성공으로 바꾸어 기록하지 않는다. 공유 엔진 소스/문서/ref는 수정하지 않았다.
- runtime ID `pob-9c0f11f7af084703005a13e0d3071a2000e393fd00597d051e72286b29df3722`, manifest SHA256 `448259527ccd24c11a8b2107cb34ead5f1c95e9d1ee032d0df2dbdcf5682a74a`. editor ID `pob-editor-47d2a3c7d94c3960a9e318fdf2b56d221ec9fe0acbe63e9dca7c81eb25aacaa8`, manifest SHA256 `2b2703dfb356c3c1ae1a62769275b2f9b4c4b5ce268ce3b4212c311fa878792a`. 생성물은 Git 제외이며 다른 PC에서는 독립 계획의 준비 절차로 재생성한다.
- 최종 check158/build/pack:win 통과. Loadout native4/source4/Windows packaged4개 그룹과 1920/1024 확인. 이전 각 기능의 실제 검증과 실패 시도는 아래 및 VALIDATION에 기록했다. 개인 데이터는 fixture/배포물/Git에 넣지 않았다.
- 다음 큰 격차: 원본 Loadout 관리 New/Copy/Custom/Rename/Delete/Reorder와 unknown XML lineage, 전체 원본 control/옵션 목록 완성, 고급 장비/미니언·부여 스킬/특수 트리·버전/네트워크 가져오기/옵션·단축키/노트 표현, 실제 PoB GUI 내보내기 왕복, portable 최종 배포, 선택 PoK/AI 잔여 결합 정리. 이 목록은 전체 기능 범위를 줄이는 완료 기준이 아니다. **#188 재평가를 시작할 수 있는 검증 완료 상태나 해결 상태로 선언하지 않는다.**

## 원본 Loadout 동시 전환 — 2026-11-03 (15차 진행)

최종: native4개 그룹, 최종 source `.local/loadouts-native-1793635727983/result.json` 및 Windows packaged `.local/loadouts-native-1793636011892/result.json` **각4개 그룹 통과**. 최종 무기 I→II 변경 표시·취소/문서 격리·네 세트 적용/새 계산·brace 연결·undo·재시작을 확인했고 두 해상도를 직접 시각 확인했다. check158/build/`pack:win` 통과. 아래 재검증 중 표기는 이 결과로 대체한다. 누적 구현을 작업 브랜치 체크포인트로 보존한다. 전체 기능 목표는 미완료다.

원본 Build.SyncLoadouts/GetLoadoutByName/SetActiveLoadout을 호출하는 `loadouts.lua`와 ‘통합 구성’ 화면을 추가했다. 이름/brace 식별자 매칭과 네 세트 연결은 원본이 결정한다. main은 transient 활성 spec 재배치 번호를 canonical XML 위치로 되돌리고, UI는 revision/XML hash/runtime/요청한 이름·선택 ID를 검증해 검토→원자 적용→새 계산한다. 직업·활성 무기·주력 그룹도 원본 상태를 전달하며 unknown/비활성 XML을 유지한다. scoped 요청 취소·문서 전환은 적용을 남기지 않는다. 원본 Loadout 생성/복사/이름/삭제/Custom/Reorder 관리는 아직 미구현이며 이번 선택 기능과 구분한다.

native `.local/standalone-pob/loadouts-result.json` **4개 그룹 통과**: 네 세트·직업·무기 전환과 Life229/Dex37→Life170/Dex25, 왕복 시 정확한 XML 복원·spec 위치 역매핑, brace 연결/불완전 그룹 제외/색상 이름 보존, 오류와 scoped 취소 후 격리. 최초 source `.local/loadouts-native-1793635283531/result.json` **4개 그룹 통과**, 두 크기 직접 시각 확인. 화면 검토에서 활성 무기 I→II 표시를 추가했고, 최종 색상 이름 처리까지 포함한 source/packaged를 재검증 중이다. check **158 passed**, build 통과(기존 Vite native-config 및 500kB chunk 경고는 남는다).

작업 중 C: ENOSPC로 data prepare가 중단되고 새 검사 파일이 0바이트가 됐다. 원본 사용자 데이터가 없는 것으로 확인한 이번 작업의 2026-11-02T07/08 생성 runtime/editor backup 12개만, workspace 내부 절대 경로·내용 whitelist·reparse 없음 확인 후 정리해 약3.7GB 확보했다. 최신 백업/실제 workspace는 보존했다. 검사 파일을 다시 작성하고 src/runtime/tests의 의도치 않은 0바이트 없음·prepare 재실행 성공을 확인했다. 개인 빌드·대화는 삭제하거나 fixture에 넣지 않았다.

최종 runtime `pob-9c0f11f7af084703005a13e0d3071a2000e393fd00597d051e72286b29df3722`, editor `pob-editor-47d2a3c7d94c3960a9e318fdf2b56d221ec9fe0acbe63e9dca7c81eb25aacaa8`, 원본 PoB `5d173cb`/0.23.1 유지. 전체 PoB 동등성 목표는 active이며 portable/원본 GUI/실제 모델 검증은 이번에 미수행이다.

## 활성 트리 직업 동기화·비교 근거 — 2026-11-03 (14차 진행)

최종: `check` **156 passed**, build/`pack:win` 통과. Windows packaged `.local/tree-sets-native-1793634280885/result.json` **4개 그룹 통과**했고 1920/1024 비교 변경 결과·1024 취소 제어와 loading 상태를 직접 시각 확인했다. 기존 management-compare source `.local/management-compare-native-1793634196014/result.json`도 **4개 그룹 통과**했다. 아래 중간 ‘진행 중’ 기록은 이 결과로 대체한다. 전체 PoB 동등성·원본 GUI 왕복·portable는 미완료다. 다음 원본 동선 격차에는 Build의 통합 Loadout(장비/스킬/트리/조건 동시 선택·관리)이 있으며, 현재의 개별 세트/수동 비교 구현과 구분한다.

화면은 inspection으로 직업명을 보정했지만, 단순 active-set 편집은 저장 Build.className/ascendClassName을 이전 직업으로 남겼다. 직업이 다른 트리 사이에서 재현한 뒤 세트 전환/생성/복사/삭제의 prospective XML을 기존 원본 tree API로 읽고, 원본 Save의 직업 정보와 세트 변경을 한 revision에 적용하도록 연결했다. 조회 실패·다른 revision/XML/runtime·원본 추가 변경 요구는 적용을 막는다. 문서 전환/명시 취소는 늦은 응답을 버린다(프로세스 강제 종료라는 뜻은 아니다). unknown/비활성 XML과 원본은 유지한다.

비교도 양쪽 선택 구성의 원본 직업 정보를 자동 기록한다. 작은 treeIdentity만 추가 저장해 정확한 측정 XML을 재구성하고 계산 hash/화면 변경 비교/최종 적용에 동일하게 쓴다. 적용 직전 native 재조회가 측정 XML과 다르면 재비교를 요구한다. 예전 기록은 읽을 수 있지만 원본 직업 정보가 다른 기록은 재측정해야 적용할 수 있다.

native `tests/pob-tree-sets-smoke.cjs` **3개 그룹 통과** (`.local/standalone-pob/tree-sets-result.json`): stale Warrior→원본 Ranger 정보와 실제 Str85→7, cross-class 복사/활성 삭제/새 세트, 양쪽 비교 XML/hash 일치·원본 불변. 최초 검사에서 private info 대신 getInfo 호출을 쓰도록 검사 코드를 수정했다. 필수 check는 새 3개 회귀를 포함해 **156 passed**(초기 보존 assertion이 active 표시 변화까지 불변으로 요구한 것을 수정). build 통과.

최초 Electron `.local/tree-sets-native-1793633729656`는 런타임 확인 전 선택 가능한 제어에서 중단됐다. 트리 세트 제어를 runtime 준비 후 활성화하도록 수정했고 재검사 중이다. 캡처에서 리소스 조회 중을 실패로 보이던 기존 트리 상태도 loading/missing/error로 분리했다. 원본 런타임/PoB pin은 13차와 같고 공유 엔진 수정 없음. 전체 PoB 기능 목표 미완료, 변경 미커밋.

source `.local/tree-sets-native-1793633936310/result.json` **4개 그룹 통과**: 취소/문서 전환의 지연 결과 격리, 실제 세트 전환·계산, 복사/활성 삭제·정확한 undo, 원본 직업 정보와 정확한 비교 XML/hash·최종 적용/새 계산·PoK 없는 재시작. 1920/1024 비교와 취소 제어를 직접 시각 확인했다. 초기 source 캡처는 좁은 화면의 구성 선택 부분이었으므로 후속 packaged 검사에는 직업 변경 결과로 스크롤하는 캡처를 추가했다. 리소스 loading 수정 후 최종 check156도 통과했다. packaged/기존 management-compare 회귀는 진행 중이며 portable·원본 GUI·실제 모델은 이번에 미수행이다.

## 원본 직업·전직 전환 — 2026-11-03 (13차 진행)

최종: Windows packaged `.local/character-native-1793632964017/result.json`도 **4개 그룹 통과**했다. 두 해상도 PNG 직접 시각 확인 및 `pack:win` 통과. 공통 어댑터 변경 후 기존 native tree 회귀 **5개 그룹 통과** (`.local/standalone-pob/tree-result.json`). 아래의 package/회귀 진행 중 표기는 이 최종 결과로 대체한다. 다음에는 활성 spec 전환 시 캐릭터 표시 동기화와 원본 loadout·트리 버전/특수 편집 등의 남은 기능을 이어서 감사한다. 전체 기능 목표는 미완료다.

기존 캐릭터 폼의 ‘할당 노드 보존한 채 정보만 변경’을 원본 Build의 classDrop/ascendDrop 콜백으로 교체했다. 원본이 요구하는 reset/connect 확인 선택을 미리보기로 전달하고 추가·제거 노드/할당 수를 검토한 뒤 적용·새 계산한다. 선택과 실패는 격리된 요청에 머무르며 build/spec 직업 정보만 원본 Save 값으로 함께 패치한다. 비활성 트리·unknown metadata·레벨은 유지하고 id/revision/XML/runtime을 검증한다. 렌더러에는 경로/재설정/전직 규칙을 만들지 않았다.

native `tests/pob-character-smoke.cjs` **4개 그룹 통과** (`.local/standalone-pob/character-result.json`): Ranger 일반4개에서 Warrior reset0개, 원본 Connect Path는 기존 가지를 보존한 일반27개·Titan 선택으로 재열기/실계산, 전직 시작점 전환, 잘못된 직업 후 격리. 합성 원안 Life65/Dex15/Str7→연결 후 Life229/Dex37/Str85. 이는 원본 편집 동작 재현이며 포인트 예산/최적 조합/게임 적법성 완료 판정이 아니다. 최초 검사는 비변경 Lua 빈 테이블의 JSON `[]`를 `{}`와 비교한 assertion 오류였고, key 개수 비교로 고친 뒤 4개 그룹을 통과했다.

필수 check **153 passed**, build 통과. 최초 Electron은 새 선택 필드의 IPC DTO 누락으로 실패했고 전달 경로/응답 선택 검증을 수정했다. 최종 source `.local/character-native-1793632697896/result.json` **4개 그룹 통과**: 취소/문서 전환의 초안 격리, reset 적용/계산/undo, connect 적용/실계산, PoK 없는 저장/재시작. 1920/1024를 직접 시각 확인했다. Windows package·기존 native tree 회귀는 진행 중이다. 원본 PoB pin `5d173cb`/0.23.1 유지; runtime `pob-938319eee70efafa5e9118a594fbac17826739a1aab99511b44d7c0b663f3cae`, editor `pob-editor-dc0bec8e3373cc404ee5ecb507dc7d175d1a57131ef26f6eac6fe0f503345036`. 트리 없는 문서 생성/버전 변환·모든 전직/특수 주얼/단축키·원본 GUI 왕복은 남는다. 전체 목표 active, 변경 미커밋.

## 접사·범위 편집 — 2026-11-03 (12차 진행)

원본 ItemsTab의 제작 접사·tier/roll 및 일반 modifier range 콜백을 연결했다. 일반 아이템을 제작 아이템으로 강제 변환하지 않고 원본이 제공하는 컨트롤만 표시한다. 원본 Save에서 variant/ModRange를 받아 본문과 함께 최소 패치하며 unknown range metadata/자식은 보존한다. 제거될 range에 unknown 정보가 있으면 원문을 유지하고 적용을 차단한다.

native 합성 검사 3개 그룹 통과: legacy range Dex20→30·재열기, 제작 Life90→205·tier 설명, 오류 후 입력 격리 (`.local/standalone-pob/item-affixes-result.json`). 기존 native item-controls 6개 그룹도 재통과했다. source `.local/item-affixes-native-1793631432357/result.json` 4개 그룹 통과: 미적용 원본 불변, 범위/unknown 보존·undo, 제작 접사 최소/최대 적용·새 계산, PoK 없는 재시작. 1920/1024 시각 확인, 작은 화면은 스크롤이 필요하다.

최초 Electron 실패는 tier ID 목록으로 된 원본 선택 키가 IPC 100자 제한을 넘은 것이었다. 전송 한도를 16KiB로 수정했고 원본의 선택/입력 검사는 유지했다. 최종 check **152 passed**, `pack:win` 통과(원본 검증·build 포함). 실제 Windows packaged `.local/item-affixes-native-1793631690562/result.json`도 **4개 그룹 통과**했고 slider 화면 내 위치 검사와 두 크기 시각 확인을 완료했다. 공통 저장 방식 변경의 기존 popup source 회귀 `.local/item-popups-native-1793631485982/result.json`도 **5개 그룹 통과**했다. portable·원본 GUI·실제 모델은 미수행이다.

12차 source pair: runtime `pob-bf2745bde355cce94539f5c64053e30d85a8afe15b6c6943c74fe181d172899d`, editor `pob-editor-4a8cba0da7f250045e9ca830525410f139a9323d64707e85f950cdaf92a10c7d`. 원본 PoB `5d173cb`/0.23.1 유지. 모든 특수 제작/옵션·원본 GUI 동등성은 미완료이고 전체 목표는 active다. 변경은 미커밋이다.

## 독립 PoB 런타임 및 전체 편집기 구현 재개 — 2026-11-02

11차 진행: 원본 ItemsTab의 무기 I/II 버튼과 장착 ReceiveDrag/선택 콜백을 노출했다. 원본 orderedSlots/Populate의 장비 내부 주얼 슬롯·허용 목록·visible 상태를 사용하고, 전/후 active set 슬롯·무기 flag·연동 mainSocketGroup 차이를 XML 부분 패치로 적용한다. 비활성 세트와 unknown 슬롯 metadata를 유지하며, XML 저장 ID와 원본 복원 ID가 다르면 진단한다. renderer는 부모 소켓 수/보조 장비/주력 스킬 선택 규칙을 계산하지 않는다.

필수 check **151 passed**, build 통과. 실제 native `.local/standalone-pob/equipment-result.json` **4개 그룹 통과**: 내부 주얼 Dex15→25/해제15, 링 거부와 실패 격리, 원본 무기 II 전환 main group1→2·DPS4.4583333333333→3.92 및 I 복원, 비활성 세트 보존, 부모 제거 시 숨겨진 내부 슬롯 거부. 전환 수치를 개선으로 판정하지 않고 선택 상태의 정확성을 검증했다. source `.local/equipment-native-1793629247916/result.json` 및 최초 packaged `.local/equipment-native-1793629520480/result.json` 각 5개 그룹, 기존 item-controls source `.local/item-controls-native-1793629243651/result.json` 6개 그룹이 통과했다. 캡처를 native 슬롯 준비 완료까지 기다리도록 보강한 최종 source `.local/equipment-native-1793629639489/result.json`도 5개 그룹 통과했고 두 크기의 실제 제어를 직접 시각 확인했다. 최종 Windows packaged `.local/equipment-native-1793629675602/result.json`도 **5개 그룹 통과**했다. `npm run pack:win` 통과. 최종 source/packaged에서 제어 준비 완료·내부 주얼/무기 전환/계산·부모 제거·재시작을 검증했다. portable·실제 모델·원본 PoB GUI는 이번에 미수행이다.

11차 source pair: runtime `pob-d0585840d304cb2eff8db30e476b91f14fb88e1c5b500e49a55418e7d9c9e0dc`, editor `pob-editor-95bb5d66baac599a75f269b17f3516f02e4bb12caf8ef31040b694eb769c13b6`. 모든 특수 장비 주얼/보조 장비 조합·카탈로그 생성/원문 직접 편집의 관련 부수 변경 전수 검증, affix/범위·스킬 고급·원본 GUI 등은 계속 남는다. 목표는 active다.

10차 진행: 원본 AnointDisplayItem/CorruptDisplayItem의 팝업 생성·컨트롤·Save callback을 노출했다. 성유의 NotableDB 검색/정렬/재료 필터/recipe/비교, 오염의 source/그룹별 선택과 고유 roll slider를 원본으로 재생한다. popup save는 detached item 초안만 바꾸며 canonical XML 적용/새 계산은 별도 검토 단계다. 재료·후보·오염 범위 수식은 renderer로 옮기지 않았다.

요청별 ID 취소를 추가해 대기 요청을 건너뛰고 해당 실행 child만 종료한다. 팝업/문서를 닫은 뒤 늦은 응답은 세대/입력 검사로 버린다. 실제 native `tests/pob-item-popups-smoke.cjs` **6개 그룹 통과**: 성유 Fireball4.4583333333333→5.35/제거 후 원복, 원본 검색/재료 filter, 기존 성유를 유지한 오염 flag, Astramentis 원본 slider Dex96→113, queued/live 취소·오류 후 독립성. `.local/standalone-pob/item-popups-result.json`. 기존 item-controls native 6개 그룹도 재통과했다. 필수 check **150 passed**, build 통과. source `.local/item-popups-native-1793627806158/result.json`에서 팝업 취소/재조회→원본 검색·선택→초안 save→명시 적용/새 계산→성유 유지 오염→고유 slider→재시작·두 크기 **5개 그룹 통과**. 실제 Windows packaged `.local/item-popups-native-1793628014476/result.json`도 동일 **5개 그룹 통과**했다. `npm run pack:win` 통과. 1920/1024 성유/오염 roll 화면을 직접 시각 확인했다. portable·실제 모델·원본 PoB GUI는 이번에 미수행이다.

10차 source pair: runtime `pob-77fffb314c3813a0a99f183bd522245669bfe36f789cdb3ca498cf792fb24661`, editor `pob-editor-c3dc72386aee5b99a791188847dcf8c4e517a0289f927e0329627d566257b53b`. 원본 corruption 코드에는 PoE1 legacy/TODO가 남아 있으므로 원본 기능의 연결과 현재 게임에서 모든 결과/획득이 적법하다는 판단을 구분한다. 모든 특수 오염/성유 조합, stat 정렬 성능/비율 progress, affix/범위 전체와 장비 내부 주얼/활성 무기 세트 등은 후속 범위다. 실제 원본 GUI/portable/모델 검증 없이 전체 목표 완료를 선언하지 않는다.

9차 진행: 원본 ItemsTab의 단순 컨트롤을 조회/실행하는 `item-controls.lua`와 옵션 패널을 연결했다. 퀄리티·augment/jewel 소켓 수·원본 룬/소울코어 선택·variant/추가 variant·catalyst/quality·cluster skill은 원본의 표시/가용성/선택지/콜백을 사용한다. 검증된 대표 동선은 Rusted Cuirass의 품질·소켓·룬이며 나머지 연결 컨트롤의 전수 검증 완료를 뜻하지 않는다. 여러 변경은 detached draft에서 검토한 뒤 한 revision에 적용·새 계산한다. 변경 중 문서/슬롯/revision/runtime이 바뀌면 적용을 거부한다.

원본 sanitiseText가 한국어 줄을 물음표로 바꾸는 것을 실제 응답으로 확인했다. 원본 함수가 만든 대응 문자열을 이용해 원래 줄을 보존하고 미지원/정규화 진단을 표시한다. 대응을 확정하지 못하면 적용을 차단하며, 연속 편집에서도 canonical XML의 원문 기준을 유지한다. 번역·게임 규칙·한국어 아이템 전체 해석을 UI에 추가한 것은 아니다. 실제 개인/게임 복사 입력은 이번에 사용하지 않았고 합성 혼합 입력을 검증했다.

legacy ModRange/variant XML은 원본이 복원한 Item.BuildRaw에서 초안을 시작해 유지한다. 저장 아이템 목록 장착도 원본 IsItemValidForSlot을 거치도록 바꿨고, 옵션 변경 후의 아이템 역시 목표 슬롯 검사를 받는다. 일반 계산의 늦은 응답이 더 최신 문서/결과를 덮어쓰지 않도록 현재 id/revision/XML을 확인한다. 아이템 미해석 진단은 계산 receipt에 editor_diagnostics로 저장하며 부분 계산을 완료 추천으로 표시하지 않는다.

필수 check **150 passed**, build 통과. native `tests/pob-item-controls-smoke.cjs` **6개 그룹 통과**: Armour45→54, rune Dex15→21, 한국어 미지원 줄/unknown XML 보존, 잘못된 입력 격리, 복원 불가 원문/연속 편집 손실 차단, legacy range0/Dex20 보존, Body Armour→Helmet 거부. `.local/standalone-pob/item-controls-result.json`. 최초 source 4개 그룹 이후 슬롯/legacy 회귀를 추가한 최종 source `.local/item-controls-native-1793624679489/result.json` 및 Windows packaged `.local/item-controls-native-1793625077148/result.json`에서 **각 6개 그룹 통과**. 잘못된 장착의 원본 불변, 동일 XML 문서 간 초안 격리, 3개 옵션의 1회 적용/계산·미해석 진단 receipt, legacy range 보존, undo/재시작, 손실 차단과 두 해상도를 검증했다. `npm run pack:win` 통과. 1920/1024 PNG를 직접 시각 확인했다. portable·실제 모델·원본 PoB GUI는 이번에 미수행이다.

9차 source pair: runtime `pob-c46aace6ab2147d9fcc3521855d426b63320eb95358b83d21800204e631f4a5b`, editor `pob-editor-87f59840dc25b77e162a6e308e0cd288ca90e562356dde0370143a1e49fbf014`. 오염/성유 팝업·affix 전체/범위·장비 내부 주얼 슬롯·모든 특수 제작/고유와 관련 부수 변경은 여전히 남는다. 원문 직접 편집은 별도 고급 동선이며 전체 장착/복원 검사를 완료한 경로로 선언하지 않는다. 원본/공유 엔진 소스 변경은 없다. 목표는 active다.

8차 진행: 할당된 능력치 재선택·주얼 장착/해제를 원본 SwitchAttributeNode/ItemSlotControl.SetSelItemId에 연결했다. 원본 슬롯의 허용 아이템 목록을 사용하며 renderer에 장착 규칙을 복제하지 않는다. node 이름/효과는 현재 원본 조회로 표시하고, XML WeaponSet 목록을 읽어 지도에서 무기1/2를 구분한다. 소켓 patch는 itemId만 바꾸고 unknown metadata를 보존한다.

중요 수정: 새 AttributeOverride에 변경된 dexNodes만 만들면 원본 loader가 필수 strNodes/intNodes 누락으로 실패하는 것을 재열기에서 발견했다. native Save의 전체 세 필드를 전달하도록 고쳤고, 새 컨테이너의 부분 스키마는 거부한다. 7차 능력치 검증은 patch 값까지였다는 한계가 있었으며 이번에는 XML 재열기와 실제 Dex/Int 변화로 확장했다. 원본 ShowErrMsg를 로드 단계에서 수집해, 실패 후 빈 기본 상태를 새 계산 성공으로 게시하지 않도록 했다. 원본/엔진 소스 수정이나 오류 우회는 없다.

필수 check **150 passed**, build 통과. native advanced **4개 그룹 통과**: malformed override 계산 거부, 능력치 재선택 Dex95→90/Int7→12, 주얼 장착 Dex95→105·해제95 복원, 원본 링 거부·unknown 소켓 보존·실패 격리. `.local/standalone-pob/tree-advanced-result.json`. 공통 로더 변경으로 기존 runtime(5)/inspection(4)/calcs(7)/party(6) 실제 smoke도 재실행해 모두 통과했다. source advanced `.local/tree-advanced-native-1793619786304/result.json` 4개 그룹과 기존 path source `.local/tree-operations-native-1793619791726/result.json` 5개 그룹도 통과했다. 실패 XML의 UI 원본 보존 검사를 추가한 최종 source `.local/tree-advanced-native-1793620081993/result.json` 및 Windows packaged `.local/tree-advanced-native-1793620084995/result.json`도 **각 5개 그룹 통과**했다. `npm run pack:win` 통과, 두 해상도와 무기별 색상/주얼 화면을 직접 시각 확인했다. undo 뒤 이전 계산이 새 입력의 결과로 표시되지 않으며 잘못된 XML에는 성공 receipt가 생성되지 않는다. portable·실제 모델·원본 PoB GUI는 이번에 미수행이다. 지원 트리 0_1~0_5를 원본 목록으로 조사해 mastery 타입 노드가 모두 0개임을 확인했다 (`.local/standalone-pob/mastery-inventory.json`). 현재 pin의 실데이터 비해당으로 기록하며, mastery UI 연결 완료로 처리하지 않는다. pin 변경 시 다시 감사한다.

8차 source pair: runtime `pob-6b42a8e8b53daa8c36e0cdfb8fffe79a970dab2a5b8716a768dd26948c295339`, editor `pob-editor-52bfec937d4426c130bac918c915deec0de86851723766255d0df57efa3fbabf`. 특수 주얼/동적 추가 그래프·전직/클래스 연결·모든 단축키·원본 GUI 왕복과 나머지 표의 기능은 남는다. 전체 목표는 계속 active다.

7차 진행: 트리의 일반 클릭 할당/해제를 원본 `PassiveSpec:GetEffectiveAllocationPath`/`AllocNode`/`DeallocNode`로 전환했다. 선택 시 원본의 변경 미리보기를 읽고 경로/종속 노드를 강조하며, 적용 시 id/revision/XML hash/runtime이 일치하는 문서에만 native 필드 패치를 반영한다. 무기 세트 1/2와 명시적 능력치 선택·override 저장도 원본에 위임한다. 패치는 실제 바뀐 속성/WeaponSet/AttributeOverride/URL만 적용해 비활성 spec·소켓·unknown을 보존한다. 직접 ID 편집은 고급 XML 편집으로 남는다.

필수 `npm run check` **147 passed**, build 통과. 최초 native에서 4개 노드 전체 경로 할당→재열기→시작 쪽 노드 해제 시 4개 종속 제거, 무기 세트 1/2 저장 후 같은 count 복원, 명시적 능력치 선택과 dex override, 실패 후 다음 입력 독립성 **5개 그룹 통과**. 동일 원본 입력의 Fireball TotalDPS가 4.4583333333333→6.01875로 반영됨을 확인했다. source `.local/tree-operations-native-1793618365332/result.json`에서 경로/능력치 미리보기·종속 해제/undo·활성 spec의 무기2 할당·계산·저장/재시작·1920/1024 **5개 그룹 통과**. 최초 검사 라벨 오류는 아래 VALIDATION에 구분했고 실제 Windows packaged `.local/tree-operations-native-1793618465601/result.json`도 동일 **5개 그룹 통과**했다. `npm run pack:win` 통과. 두 크기 화면을 직접 시각 확인했으며 portable·실제 모델·원본 PoB GUI는 이번에 미수행이다. `.local/standalone-pob/tree-result.json`.

7차 source pair: runtime `pob-20997b2cc4c6f297b70f8f01892dcefdebea06258b9d6c34b81ced70281368c7`, editor `pob-editor-6dbe10aa75fa26207ef590d35b436960c97a6549076f95ba6af5306f864de855`. mastery/특수 노드 선택·주얼 편집·할당된 능력치 재선택·모든 단축키와 무기별 색상/전체 원본 동등성은 아직 남는다. mastery는 선택 UI가 없으면 명시적으로 차단한다. 공유 엔진·원본 PoB 소스 변경은 없다. 목표는 계속 active다.

6차 진행: 원본 `PartyTab`의 7종 ImportedBuffs 편집, native 요약/미해석·Unknown 진단, 지원 빌드 출력 생성/대상별 가져오기/추가/비우기 미리보기, revision 확인 후 적용·새 계산을 연결했다. `runtime/pob/party.lua`는 원본 ParseBuffs/Save/exportBuffs/Import·Clear 버튼을 호출하며 renderer에 오라·저주 병합 규칙을 복제하지 않는다. XML 편집은 Party의 지정 버퍼·Import.exportParty만 바꾸고 unknown/ExportedBuffs/비활성 자료를 보존한다. 지원 출력도 현재 원본 계산에서 생성해 명시적으로 XML에 기록할 수 있다.

필수 unit **146 passed**, build 통과. 실제 native `.local/standalone-pob/party-result.json`에서 Life 65→170, 미해석 줄 보존·진단, 지원 출력 생성과 대상별 가져오기, 비우기/실패 후 요청 독립성 추가 모드를 포함한 6개 그룹 통과했고 source `.local/party-native-1793616670538/result.json`와 최초 packaged `.local/party-native-1793616841603/result.json`에서 각 4개 그룹 통과했다. 화면 검토에서 undo 뒤 이전 revision의 완료 안내가 남는 문제를 찾아 안내도 revision에 귀속시켰고, 최종 source `.local/party-native-1793616956108/result.json`에서 revision 안내 확인을 포함한 동일 4개 그룹이 통과했고, 최종 Windows packaged `.local/party-native-1793617167259/result.json`도 동일 4개 그룹 통과했다. `npm run pack:win`의 원본 출처/실제 계산 gate와 패키징이 통과했고, 최신 source/packaged의 1920/1024 화면을 직접 시각 확인했다. portable 압축·실제 모델·원본 PoB GUI는 이번에 미수행이다. 초기 합성 오라의 GlobalEffect 태그 누락과 ComposeXML 루트 인자 오류는 원본 코드 계약으로 수정했다. 데이터가 조용히 사라지지 않도록 원본 Unknown 분류도 진단한다.

6차 source pair: runtime `pob-b68aec0be3a8c20ad70a2792954a3931f9039171ac2351cd5ab95262eadb4db7`, editor `pob-editor-d227fc6c647be9b53cdd5884e995cc524ff69c137ede0d26bbd15d80eb3e5922`. pin 변경·공유 엔진 수정은 없다. 일시적 효과 비활성화/재구성, URL 직접 가져오기, 링크 등 모든 지원 조합·원본 GUI 동등성은 남으며 UI에 미지원 범위를 명시했다. 일반 비교/AI 변경 설명의 파티 버퍼별 상세 차이, 지원 가져오기 출처의 영속 receipt와 exportParty 끄기 UI도 후속으로 남는다. 전체 목표는 계속 active다.

5차 진행: 원본 `CalcsTab`/`CalcSections`/`CalcBreakdownControl`을 읽는 `calcs.lua`와 `PobRuntime.calcs`/`readCalcs` IPC, 계산 상세 화면을 추가했다. 원본 CheckFlag/formatCalcStr와 분해 제어가 만든 표시값·TEXT/TABLE/반경 수치·modifier 출처를 투영한다. renderer에 계산식·modifier 집계 규칙을 복제하지 않는다. 계산 그룹/버프 모드/플레이어·미니언, 계산 탭 전용 효과/스킬 모드/부분·단계·지뢰는 XML의 별도 Calcs 입력·Calcs 젬 필드로 편집한다. 일반 스킬 모드와 서로 덮어쓰지 않는다.

실제 런타임 `.local/standalone-pob/calcs-result.json`에서 22개 분류/진단 0, Life 65와 원본 분해, 버프 모드 변경, 잘못된 셀 조회 후 입력 격리, Ice Nova의 Calcs 모드 2/일반 모드 1, native modifier 표, 없는 미니언 대상의 명시적 진단, 오래된 대기 조회 거부 등 **7개 그룹 통과**. 어댑터를 거치지 않은 원본 HeadlessWrapper 첫 프레임과 Life 분해도 일치했다. 원본 분해의 반복 행도 그대로 보존한다. 조회는 입력 revision/XML hash/runtime과 셀에 귀속하며 중복 요청을 병합한다. 단위 **145 passed**, build 통과. 실제 source `.local/calcs-native-1793615422929/result.json`와 Windows packaged `.local/calcs-native-1793615700907/result.json`에서 상세/분해·Calcs 설정 분리·그룹·modifier 표·늦은 모달 거부·저장/재시작·1920/1024 **각 4개 그룹 통과**. 두 크기 화면과 분해 모달을 직접 시각 확인했다. `npm run pack:win`도 출처/실제 계산 gate부터 통과했다. portable 압축과 원본 GUI는 이번에 수행하지 않았다.

5차 source pair: runtime `pob-e9c9681da9ec31ab5256abff71b6308cc1640b34e8d8ab878616cbd0b78a20b1`, editor `pob-editor-7f1d4dc341ae9b1a722058c8e54c69f462880d93dd83ae81a2a80e08efc3ade3`. 원본 PoB pin은 유지했다. 반경 지도 시각화·분해 출처에서 관련 요소로 이동·미니언 종류/전용 스킬 선택·모든 원본 계산 컨트롤의 전수 검증은 남는다. 전체 목표는 active다.

4차 진행: 빌드 관리(검색·복사·이름/폴더·삭제 보관함/복원/명시적 영구 제거), redo, 일반 수동 비교 화면을 앱에 연결했다. 폴더는 작업 공간 분류이며 원본 파일을 이동하지 않는다. 삭제 시 대화는 보존하고 연결만 해제하며, 복원 시 다른 빌드로 재연결한 대화를 빼앗지 않는다. 복사본은 현재 XML에서 독립 revision 0으로 시작한다.

비교는 두 빌드 또는 같은 빌드의 장비/스킬/트리/조건 세트를 원본 PoB로 각각 새 계산한다. 당시 XML·revision·runtime/PoB 출처·진단과 숫자를 보존하고 활성 구성 차이를 설명한다. 부분 수치와 미측정/0을 구분하며, 성공한 측정의 XML hash·revision·현재 runtime을 확인한 뒤 해당 문서의 선택 구성만 적용하고 최종 revision을 재계산한다. 문서가 그 사이 바뀌면 최신 계산에 붙이지 않는다. 비교 snapshot에는 편집 이력 전체를 중복 저장하지 않는다.

4차 최초 native 통과: `.local/management-compare-native-1793614227591/result.json`, 복사/폴더/보관함/복원→redo→Life 65/683 비교→장비 세트 적용 revision 4 재계산→오래된 비교 재적용 차단→저장/재시작 및 1920/1024. 초기 실패는 테스트 준비 시 세트 추가가 새 세트를 활성화하는 동작과 기대값 불일치였고, 원안을 명시적으로 선택한 합성 입력으로 수정했다. 최신 필수 check **144 passed**, build 통과. 최근 비교 자동 선택/저장 XML 검증/늦은 결과 문구를 보강한 최종 source `.local/management-compare-native-1793614452117/result.json` 및 실제 Windows packaged `.local/management-compare-native-1793614603293/result.json`도 동일 4개 그룹 통과했다. `npm run pack:win` 통과, 패키지 리소스는 app.asar/pob-runtime/pob-editor만 포함한다. 두 크기 캡처를 직접 시각 확인했다. portable 최종 압축은 이번에 재시도하지 않았다. 계산 상세·파티·고급 편집·네트워크·원본 GUI 왕복 등 전체 목표는 여전히 미완료다.

3차 진행: 장비/스킬/트리/조건 세트의 생성·복사·이름 변경·삭제 UI, 노트 편집·색상 코드 삽입·undo를 구현했다. model 회귀는 unknown/inactive/legacy XML과 트리 삭제 후 활성 번호를 검증한다. 원본 조건 컨트롤 7분류/651정의와 활성 스킬의 효과·모드/부분/단계·지뢰 선택을 `inspectBuild`로 읽어 UI에 연결했다. 원본 가용성/default/list/tooltip을 사용하며 renderer에서 게임 판정을 만들지 않는다. 현재 젬 외부 부여·미니언·Calcs 세부 편집과 전체 원본 탭은 계속 미완료다.

최종 unit **139 passed**, build 통과. 원본 API에서 explicit false·0·미설정과 Ice Nova 모드 2 반영 확인 (`.local/standalone-pob/inspection-result.json`). 최종 native `.local/sets-config-native-1793612173827/result.json`에서 카탈로그 젬·모드·조건·4종 세트 복사/삭제·노트 적용/undo·재시작·1920/1024와 문서 간 초안 격리 8개 그룹 통과. 동일 XML 문서 전환에서도 미적용 item/group/character/tree/note 값이 다음 문서에 섞이지 않음을 확인했다. 직업 선택 검사의 초기 라벨 식별 timeout은 명시적 접근성 이름을 추가한 뒤 해소했다.

현재 3차 source pair: runtime `pob-29cdfc9668ff5639ab8cfcd10cf9b1e316b2582943ebba19ae3a172e63109c4b`, editor `pob-editor-c70ba14e78caf1510855930f634bc12ac0355a4ea0199acb17739d459c2a4d64`. 이전 단락의 source pair는 당시 검증 기록이다. packaged 최신 슬롯 문맥 native 검증도 `.local/editor-native-1793607174373/result.json`에서 통과했다. 3차 화면 전체의 packaged 검증·portable는 아직 완료가 아니다.

2차 진행: `PobEditorData`/원본 metadata·Item/Craft 어댑터와 `pob:prepare-data`를 구현했다. PoK/KB 없는 native 격리 리소스에서 **새 빌드→Iron Ring 생성·장착→Strength1 roll 1 레어 제작·장착→새 계산→원본 트리 이미지→저장·재시작**을 검증했다. 실제 Str 15/Life 82, 레어 원문 `+8 to Strength`. 단위 **133 passed**, build 통과. native 증거 `.local/editor-native-1793605449660/result.json` 및 두 크기 8개 PNG. 전체 기능 목표는 미완료.

2차 당시 runtimeId: `pob-cce8726f6c59bae17a9b2d21e6effeacdb24353bf111969578c43db171a65a75`, editor `pob-editor-26d7f7197a52f9a421184e08012d0b09a857b9b138e20e047d7741ec54c27aeb` (현재 3차 pair는 위 단락). 원본에서 직접 base 1,755 / unique 443 / mod 9,365 / gem 966 / skill 1,436, 총 13,965 항목을 추출했고 0_1~0_5 트리 589파일을 묶었다. raw 함수/연결 객체는 PoB 위임 표식으로 표시하며 renderer에서 실행하지 않는다. XML·슬롯 문맥은 원본 장착 검사에 전달하고 Ring→Helmet 거부를 실제 API smoke에서 확인했다.

배포 필수 PoK bundle gate/리소스를 독립 PoB gate/리소스로 전환했다. 직전 source pair `pob-da2cd7…`/`pob-editor-4a8f64…`로 실제 packaged `win-unpacked` 앱의 새 빌드·제작/장착·계산·트리·두 화면·재시작 8개 검사 통과 (`.local/editor-native-1793605914824/result.json`). portable 압축은 `LICENSE.electron.txt` 접근 거부로 실패했으며 라이선스 제거/우회는 하지 않는다. 최신 슬롯 문맥 추가 이후 source/packaged 앱 재검증과 portable 완료는 남아 있다. 선택 PoK/AI 일부 context는 아직 이전 bundle 계약을 사용한다.

사용자 요청으로 전체 PoB 기능과 현재 수준을 재대조했다. 최신 큰 기능군 표는 `POB-STANDALONE-PLAN.md`에 반영했으며, 세부 control/옵션 전수 목록이 미완성이므로 기능 총수/완료율을 임의 산출하지 않는다. 당시에는 Notes/Party, 세트 CRUD, 원본 조건·스킬 모드 UI, 계산 상세/일반 비교, 계정 가져오기·빌드 관리가 주요 미완료 범위였다. 이후 3·4차 진척과 남은 범위는 위 단락과 최신 대응표를 따른다.

목표 active: PoK 연결 없이 원본 PoB의 모든 사용자 기능을 수행하고 이후 선택 연결을 지원한다. 인계 이후 첫 재개 작업이며 과거 정지는 사용자 재개로 해제됐다. 작업 트리는 `4b86309`에서 clean인 것을 확인했다. 설계/기능 대응표: [POB-STANDALONE-PLAN.md](POB-STANDALONE-PLAN.md).

- [x] 원본 HeadlessWrapper XML 로드/계산 진입점과 원본 탭 목록 조사, PoK 없는 별도 PoB 런타임 경계 설계.
- [x] 원본 PoB 계산 어댑터·프로세스/출처 검증 및 실제 독립 계산 재현. 소스/바이너리/라이선스 포함 1,699파일을 검증한 PoK 없는 runtime 생성. Ranger Life 65→683(레벨 1→50), Fireball 실제 DPS 4.4583333333333. 실패/시험용 젬이 다음 요청에 남지 않음 확인.
- [x] main/preload/renderer 수동 계산 경로를 독립 runtime으로 전환. default/미설정 PoK 자동 연결 제거, 설정에서 명시적 opt-in. 독립 결과는 KB/PoK digest 없이 원본 commit/runtimeId/revision/XML hash에 귀속.
- [x] 실제 Electron: PoK·Python·KB·기존 표시 bundle 미설치 환경에서 수동 편집·계산·저장/재시작 성공. 선택 PoK 연결 실패 후 독립 결과 유지. 1920/1024 세 화면 QA. 최종 증거 `.local/standalone-native-1793603867310/result.json`.
- [x] standalone 자원/catalog/tree와 main/preload/renderer의 수동 작업 경로 분리. 카탈로그 검색·직업·트리·아이템 생성은 독립 출처를 검증하며 PoK 연결 여부로 잠그지 않는다. 원본 제작·variant·roll은 PoB Item/Craft로 처리한다.
- [ ] 기능 대응표의 모든 원본 사용자 작업 구현·비교·배포 검증. 전체 목표 미완료.

1차 검사 기록은 131 passed와 runtime/native smoke였다. 현재 최종 검사는 위 3차 139 passed를 기준으로 한다. `tests/pob-runtime-smoke.cjs`/`tests/standalone-desktop-smoke.cjs`는 생성 runtime이 있을 때만 실제 원본을 검사한다. 이전 10월 자동 연결 smoke는 explicit opt-in을 지정한다. 배포 gate는 독립 PoB로 전환했으나 portable 압축은 환경의 파일 접근 거부로 미완료다. 전체 기능 목표는 active이며 완료 처리하지 않는다. 변경은 아직 미커밋이다. 다음 큰 작업은 트리의 mastery·특수 노드·주얼·할당된 능력치 재선택/무기별 표시와 단축키, 계산 상세의 남은 반경/미니언/위치 이동·파티 일시 상태와 고급 장비/스킬, 계정 가져오기/옵션, 원본 GUI 왕복 및 선택 PoK context 정리다. 일반 비교의 부분 변경 병합·원본 동등성도 남는다.

## 인계 및 최종 추가 요구 — 2026-10-30

사용자 자리 비움 요청으로 **추가 구현은 중단**하고 이번 결과·요구를 문서화해 `origin/skerfolg/coho`로 인계한다. 상세 재개 절차: [HANDOFF-20261030.md](HANDOFF-20261030.md).

- 확정 요구: **PoK와 pok-ui는 각각 독립 동작한다.** pok-ui의 PoB 수동 편집·계산·저장/복원에 PoK 설치·접속·KB·AI를 필수로 두지 않는 것이 목표다. PoK/AI 생성·조작 연동은 그 이후다.
- 연동 시 양쪽이 실제 사용하는 PoB 버전/commit·출처의 일치/호환성을 확인한다. 미연결과 불일치를 구분하고 결과의 기준 버전을 보존한다. 자동 갱신·검사 우회로 해결하지 않는다.
- **이번에 독립 실행을 구현한 것은 아니다.** 현행 코드/카탈로그/런타임 결합은 남아 있다. 독립 PoB 백엔드의 소유·배포·API 구조는 미결정이며, 다음 세션은 PoB 기능 대응표와 결합 지점 감사/설계부터 시작한다. 현재 `compute_pob_xml` 등의 결합을 최종 제품 구조로 고정하지 않는다.
- 기존 결과 보존 커밋: `87480b5` (`fix: harden engine contracts and revision-safe build proposals`). 최종 인계 문서는 이 커밋 다음의 문서 커밋에 포함한다. 다른 PC에서는 브랜치 tip을 받는다.

## 우선순위 변경 — PoB 편집 작업 완결성이 먼저 (2026-10-30, 사용자 지시)

제품의 선행 목표는 **AI 없이 사용자가 PoB에서 하던 전체 빌드 작업을 pok-ui에서 수행하는 것**이다. PoK/에이전트의 빌드 생성·자동 조작·추천은 그 이후다. 아래 정상화 감사와 안전성 수정은 보존하지만 실제 AI 요청 성공을 편집기 완성의 선행 조건으로 두지 않는다. 현재 UI는 PoB 전체 기능을 제공하는 상태가 아니다.

- 완료 기준을 메뉴 개수나 XML 보존 여부가 아니라 원본 PoB의 사용자 작업별 수행·저장·재열기·계산 일치로 잡는다. 기준 PoB 버전을 명시하고 기능별 구현/부분 구현/미구현/미검증을 나눈다.
- 장비·스킬·패시브·전투 조건·계산 상세·가져오기/내보내기·빌드 관리·노트 등 원본 기능 목록과 UI 대응표를 먼저 만든다. 이 목록은 조사 시작 범주이며 전체 기능 조사 완료를 뜻하지 않는다.
- 현재 확인된 대표 격차: 전투 조건은 기존 input/임의 key 편집 중심이며 PoB의 조건별 선택 UI 전체가 아니다. 젬 이름/레벨/퀄리티/그룹 편집은 있으나 모든 모드·단계·선택지를 사용자가 조작할 수 있는지 미검증이다. 계산 상세는 스탯·진단 표시 중심으로 원본 계산 탭 동등성을 검증하지 않았다.
- 첫 검증 동선은 사용자 수동 작업이다: 빌드 열기→장비/스킬/트리/조건 조작→계산 확인→저장/재시작→PoB에서 다시 열어 편집. AI 없이 성립해야 한다.
- PoB 실행·로딩·Lua·headless 계산·내부 편집 연산의 책임 경계는 유지한다. **AI 연결을 뒤로 미루는 것과 PoB 실행/계산 백엔드가 불필요한 것은 다르다.** UI에서 게임 규칙이나 별도 PoB 실행 경로를 구현하지 않는다. 필요한 원본 기능 API는 엔진 요청으로 분리한다.
- 참고 pob-ai는 로컬 README에서 기존 PoB 창 옆 패널과 PoB 연동을 설명한다. 실제 PoB 창을 사용하는 제품이 원본 기능을 이용하는 것과 자체 UI로 모든 기능을 재구현하는 것은 구분한다. 전체 기능 동등성이나 상대 프로젝트의 의도는 아직 확정하지 않는다.
- 이 방향 반영은 작업 우선순위의 변경이다. 실행 백엔드 교체·원본 PoB 임베딩·저장소/모듈 경계 변경은 결정하거나 구현하지 않았다.

## pok-ui 정상화 — 2026-10-30 (진행 중, 완료 선언 아님)

- UI 작업 브랜치 `skerfolg/coho`, 시작 HEAD `6d595254d175c3a00e8da149b7b6b4704f6343e3`. 시작 시 tracked 변경 없음. 아래 결과는 인계 시 `87480b5`로 커밋했다.
- 작업 시작 시 `git ls-remote origin refs/heads/main`으로 고정한 엔진 기준: `e7bd42993a4b51e7a1dcaeacc579573f6eeef846`. 이후 원격을 자동 추종하지 않는다.
- 공유 엔진 체크아웃은 `codex/generation-controlled-eval`, HEAD `06f4fd2343e0cfb110d09d2e74bd666458c0d556`, 추적 브랜치보다 1커밋 뒤, untracked `.local/` 존재. 공유 checkout의 소스·문서·Git ref를 수정하지 않았다. UI `.local/normalization/engine`에 별도 clone 후 기준 커밋을 detached checkout했다.
- 기준 KB: patch `0.5.4b`, data repo commit `ae31c8567b4dedb658228648071069021ebf0e8a`, manifest SHA-256 `4e4336c35baa64247f63edc708288da2671adba439c37423ad3bc82586135a60`.
- 기준 PoB pin: `5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`. PoB를 갱신하거나 별도 계산 경로를 만들지 않는다.
- **최신 main에는 desktop runtime manifest / identity / `pok.desktop` exporter / `compute_pob_xml` / `render_pob_item`가 없다.** UI에 남아 있는 개발 bundle `pokbundle-56f0f978ff358fa58a2d8465a44e42b3`는 과거 dirty source `4da18c1…` 기준이며 최신 호환·배포 근거로 쓰지 않는다. 최신 기준 runtime manifest는 미생성이다.

초기 감사 분류:

1. 현재 단위 실행으로 확인: XML/비활성 세트/알 수 없는 필드 보존, 편집·undo, revision/hash/bundle 검사, 제안 검토·적용의 host 검증, 취소/질문/승인 어댑터, 저장의 원자성. 기존 기능을 새로 중복 구현하지 않았다.
2. 최신 계약 불일치: parameterless `server_info`에 번들 전용 인자를 보내던 경로, desktop identity와 도구·exporter 부재. 실제 tools/list는 50개였으나 숫자는 고정 계약으로 사용하지 않는다.
3. 기존 문서상 구현·최신 전체 동선 미검증: 실제 모델→현재 빌드 읽기→도구→제안→적용→재계산, restart/resume, 최신 runtime portable, 실제 PoB GUI 편집.
4. 엔진 제약/요청: desktop 계약 누락, Windows stdio server_info 시간 초과, 복원의 무기·부여 스킬·모드/단계 손실. 상세 재현과 필요한 계약은 `NORMALIZATION-ENGINE-REQUESTS.md`에 분리한다.
5. 범위 밖: 엔진/PoB/Lua 실행·편집 연산 구현, 저장소 통합, 다중 공급자·테마·자동 업데이트·macOS 출시, #188 해결 선언.

- [x] 동적 도구 조회 모든 페이지를 원자적으로 교체, 재연결 경합 거부, 새 턴/재개에서 live 목록 갱신. 새 thread에는 고정된 개별 POK 스키마 대신 현재 목록+일반 호출 bridge를 제공한다.
- [x] server_info 선택 인자를 현재 schema에 있을 때만 전달. desktop 계약 누락은 identity/도구명을 포함해 진단하며 버전 검사를 유지한다.
- [x] 첫 stat set 강제 가정 제거, 복원 선택 필요 시 자동 계산 차단, 활성 세트 모호 시 계산 projection 거부. 원문 열기·보존 편집은 가능하다.
- [x] 구조화된 도구 오류·부분 복원 세부 정보를 보존. 도구 승인 대기 중 취소된 턴은 뒤늦게 실행하지 않는다.
- [x] 취소·실패한 턴의 제안 host 폐기, 정상 완료 전 적용 차단. config 미설정/시험용 gem 제안은 원본을 바꾸지 않는 회귀 추가. 검토 목록에 슬롯·스킬 그룹·패시브 ID·조건의 실제 변경 표시.
- [x] 최종 `npm run check`: **128 passed**, 경계·타입 통과 (2026-10-30). 최초 sandbox EPERM은 제품 실패와 분리하고 허용된 실행에서 재검사했다. 재연결 후 늦은 도구 응답을 새 app-server로 보내지 않는 회귀 포함.
- [x] `npm run build` 통과. 실제 Electron 44.5.1에서 최신 도구 누락 진단, 오프라인 편집·저장·재시작·undo와 1920/1024 네 화면 검증 통과. `.local/normalization/desktop-1793345227152/result.json`.
- [x] 엔진 요청서에 입력·출력·취소·진행 계약, 현재 API로 불가능한 이유, 최소 재현과 UI 영향 분리. 실제 추천 준비도 `not_ready`/`contract_missing` 반환 확인.
- [x] `npm run dist:win` 실행: runtime manifest 부재로 사전 검증 중단. 최신 runtime/패키지 성공으로 간주하지 않는다.
- [ ] 대표 지원 빌드의 실제 AI 수정·새 계산, 최신 portable, 실제 PoB GUI. 위 desktop 계약이 준비되기 전 성공으로 간주할 수 없다.
- [ ] 도구 진단에서 요소로 직접 이동·강조, 실제 원안/최종안 측정 비교의 UI 전체 검증, 한국어 실물 변환 API 연동. 이번에는 상세 변경 위치 이름/ID 표시까지만 보강했다.

검증 범위/실패 시도/기존 bundle 사용 제한은 `VALIDATION.md`에 기록했다. 작업 중 공유 엔진이 다른 세션에서 `codex/pok-redesign-blueprint`와 여러 변경 파일이 있는 상태로 바뀐 것을 읽기 전용 관측했다. 그 변경을 수정·정리하거나 이번 기준에 섞지 않았다. UI 결과는 `87480b5`로 보존하며, 당시 감사의 엔진 기준·KB·PoB pin은 유지한다. 현재 공유 엔진의 변경을 검사한 결과로 대체하지 않는다.

최종 API 감사(`.local/normalization/contract.json`, 2026-10-30 07:28 UTC): 동일 pin을 격리 `external/pob/5d173cb`에 준비한 뒤 기존 MCP `compute_pob({build_spec:{class_name:'Sorceress',level:1},stats:['Life']})`도 30초 timeout. server_info/restore 각각 30초 timeout, assemble 추천 게이트의 구조화된 not_ready 반환 확인. 이 제한 시간의 실패를 모든 지원 빌드의 계산 거부/게임 규칙 결함으로 판정하지 않는다. 대표 지원 빌드 성공은 아직 없다.

#188 재평가: 아직 시작 가능한 검증 완료 상태가 아니다. 정상화 작업은 실패와 revision 근거를 보존하는 환경을 보강하며, 생성 품질/최종 구성 재측정의 개선을 입증하지 않는다.

## 앱 시작 시 POK 자동 실행·연결 (2026-10-08)

- [x] main이 앱 시작 단계에서 POK를 한 번 실행하고 연결; renderer는 상태 조회·이벤트 구독만 수행
- [x] 개발은 저장된 엔진 설정 유지, 배포는 저장된 checkout 경로와 관계없이 검증된 bundled runtime 선택
- [x] 배포 화면의 개발 경로 설정을 숨기고, 개발 버튼은 재연결/실패 시 다시 연결 용도로 정리
- [x] 연결 중 화면 재로드 이후에도 동일 엔진 PID 유지; 종료 중에는 검증 후 새 프로세스를 시작하지 않음
- [x] 선택 규칙 회귀 2개, 타입 검사·빌드, 실제 자동 시작/재로드 검사 1회 통과 (50개 도구); 1920/1024 설정 화면 넘침 없음

변경: `src/main/index.ts` 시작 흐름, `src/main/pok.ts` 엔진 선택 규칙, shared/preload 상태 IPC, renderer 연결 표시·설정 화면. 기존 `POK-Local-Test.exe`로 재시작하면 적용된다. 정식 packaged 실행 검증은 다른 PC에서 진행한다.


## POK 연결·베이스 생성 대기 수정 (2026-10-08)

- [x] 연결 확인의 KB 전체 로드를 선택 사항으로 분리; UI 연결 확인에서는 생략 사실을 명시하고 identity 검증 유지
- [x] identity의 반복 Git digest 계산을 범위가 정해진 내용 해시·변경 감지 캐시로 단순화; 과거 checkout 복사본까지 훑던 rglob 패턴을 glob으로 제한
- [x] 연결 확인 15초/아이템 생성 45초의 RPC 제한과 재연결 오류 안내; 연결 완료 전 생성 요청을 UI와 main에서 차단
- [x] 생성 중 연결·빌드·슬롯 변경 시 늦게 도착한 결과 적용 취소
- [x] 관련 UI 회귀 4개 + POK 회귀 3개만 실행, 타입 검사·빌드 통과; 전체 suite 미실행(사용자 요청)
- [x] 실제 MCP 연결 18.6초, base 렌더 2.4초. 실제 앱 연결 약 20.6초 후 Iron Ring을 Ring 1에 장착하고 revision 1 저장 확인
- [x] 검증된 기존 트리 변환 캐시를 재사용해 local bundle 출처 갱신; 원본 해시 검사 유지

변경 파일: `src/main/pok.ts`, `src/main/index.ts`, `src/renderer/App.tsx`, `src/renderer/features/EquipmentView.tsx`, POK `src/pok/mcp/server.py`, `src/pok/pob/runtime_identity.py`. 런처가 읽는 `dist`를 재빌드했으므로 기존 로컬 exe로 실행한다. 사용자 작업 데이터는 변경하지 않았다.


## POK 고정 PoB 기반 데이터·편집 통합 (2026-10-08)

상태: S1~S7 및 거래 검색 스킬 배포 포함 구현 완료. 이 PC에서는 코드·테스트·로컬 실행용 런처를 검증하고, 정식 배포와 소스 없는 패키지 검증은 다른 PC에서 수행한다(사용자 지시). PoB 핀 변경·KB 재수집 없음.

- [x] S0: 원격 최신 기준 확인, 작업 브랜치와 기준 회귀 검사 확보
- [x] S1~S3: POK 원본 exporter, runtime identity/portable 빌더, UI bundle/lock/출처·해시 검증 구현
- [x] 실제 고정 PoB에서 카탈로그 13,945개·직업 8개와 트리 0_1~0_5 생성
- [x] S4~S5: 직업·전직/아이템·접사·변형/젬 선택, 원본 XML 보존, 생성·장착 일괄 편집과 undo
- [x] S6: 직접 XML 계산 및 원본 PoB parity, 입력 revision/hash/bundle 귀속, 검사 미실행 진단 보존
- [x] S7: AI 카탈로그 조회, main의 제안 등록·기준 검증·적용, 연결 변경 시 오래된 제안 무효화
- [x] 개발 checkout 묶음 생성과 배포 경로의 checkout 거부 검증
- [x] S8 일부: Electron 44.5.1 실제 데이터·화면 1920×1080/1024×768 및 리소스 불변 검증
- [x] S8 일부: 실제 Electron→MCP 연결·base 아이템 생성·장착 저장 확인
- [ ] S8 잔여: 전체 계산·AI 제안의 배포 환경 통합 검증
- [ ] S8: production bundle/lock 생성, 소스 없는 Windows 패키지 실행과 리소스 불변 검증
- [ ] 실제 모델 추론을 포함한 AI 제안 end-to-end 검증

현재 확인: UI 검사 89개, POK 전체 단위 1,321개 통과·2개 skip, 새 XML/아이템 실제 PoB 통합 4개 통과. 최종 추가 변경의 검사 결과는 [검증 기록](VALIDATION.md)에 기록한다.

현재 실행 환경: 생성 runtime 12,015개 중 323개에서 Node 읽기 오류(EBADF)를 관측했지만, 이를 문서 암호화로 확정하지 않는다. 사용자는 보안 프로그램이 .doc 같은 문서 유형을 암호화한다고 설명했다. 코드/JSON/Lua는 일반 소스로 처리하고 별도 DRM 처리·해시 우회를 추가하지 않는다. 정식 배포는 다른 PC로 이관하며, 이 PC에서는 체크아웃을 여는 `release/local-test/POK-Local-Test.exe`를 제공한다.

- [x] POK의 기존 trade-search 진입점·정본 절차·실행기를 runtime에 포함하고 source digest에 귀속
- [x] 챗봇 프로세스에 Python·사용자 데이터·캐시 경로 전달; 기본 승인 정책 유지
- [x] 실제 Codex의 staged skill 발견·활성화 및 networkless prepare 실행 확인
- [x] Windows 로컬 테스트 런처 생성 및 --check 통과
- [x] 갱신된 개발 bundle 설치 후 테스트 런처의 실제 창 실행 확인 (13,945 항목·직업 8개 ready)

이번 변경은 스킬 검색 로직을 복제하지 않는다. 생성 실행파일·개인 경로·진단 파일은 Git 제외하며, 커밋·푸시는 하지 않는다.

```mermaid
flowchart LR
  A[POK 원본·identity·XML 계산]:::done --> B[UI 카탈로그·편집·AI 기준 검증]:::done
  B --> C[개발 checkout 화면·리소스 검증]:::done
  C --> D[로컬 테스트 실행파일]:::done
  D --> E[다른 PC에서 정식 패키지 검증]:::pending
  classDef done fill:#243d31,stroke:#65967d,color:#fff
  classDef active fill:#4b4025,stroke:#bca46c,color:#fff
  classDef blocked fill:#512c2c,stroke:#c47c7c,color:#fff
  classDef pending fill:#272c34,stroke:#687383,color:#fff
```

## GitHub 저장소 연결 (2026-10-07)

- [x] `https://github.com/skerfolg/pok-ui.git`를 origin으로 연결하고 기존 main의 MIT 라이선스 이력 보존
- [x] 공개 대상 점검: 개인 XML·대화·세션·실행 파일·생성 리소스 제외, 문서의 개인 빌드명 일반화
- [x] 앱 검사 52개와 프로덕션 빌드 통과
- [x] `codex/desktop-v1` 브랜치 푸시 및 main 대상 [PR #1](https://github.com/skerfolg/pok-ui/pull/1) 생성

```mermaid
flowchart LR
  A[원격 이력 보존]:::done --> B[게시 대상 검토]:::done --> C[검사 및 빌드]:::done --> D[브랜치 푸시 및 PR]:::done
  classDef done fill:#243d31,stroke:#65967d,color:#fff
  classDef active fill:#4b4025,stroke:#bca46c,color:#fff
```

## v0.1.1 패시브 트리 수정

- [x] PoB 소스 기준 좌표·직선·곡선과 63개 누락 연결 복원
- [x] 노드별 MCP 요청 제거, 정적 일괄 로드·버전 캐시
- [x] 원본 DDS/Zstandard 이미지 변환·아틀라스 및 0_1~0_5 배포 리소스
- [x] 실제 Electron 검색·확대·이동·편집·undo·캐시 성능 및 1920/1024 검증
- [x] Windows v0.1.1 포장 및 패키지 재검증

```mermaid
flowchart LR
  P[PoB 소스 대조]:::done --> G[4914 노드 · 5149 연결]:::done --> I[원본 지도 이미지]:::done --> T[실제 UI 검증]:::done --> R[Windows 패키지]:::done
  classDef done fill:#243d31,stroke:#65967d,color:#fff
  classDef active fill:#4b4025,stroke:#bca46c,color:#fff
```

세부 원인과 검증 수치는 [패시브 트리 기록](PASSIVE-TREE.md)에 남긴다.

완료: 앱 검사 52개, 소스 Electron UI 8개, 패키징된 Electron UI 8개 통과. `release/0.1.1/POK-0.1.1-win-x64.exe` 생성. 이 PC에서 패키지의 첫 지도 표시는 약 2.12초, 메뉴 재진입은 약 0.13초였다.

## POK Desktop v0.1.0

- [x] 1차 디자인 기준 확정 및 별도 UI 저장소 경계 정의
- [x] 디자인 토큰/배치/표현과 상태/문서/네이티브 어댑터 분리
- [x] 6개 메뉴, 편집 가능한 대화 목록, XML 가져오기/편집/저장
- [x] MCP 엔진 연결, 리비전 기반 계산, Codex app-server 어댑터
- [x] 엔진 frozen Windows 런타임 생성 및 소스 밖 실행 검증
- [x] XML 보존·저장·에이전트 테스트 및 화면 반응형 검증
- [x] Windows portable 패키지 생성과 패키징된 앱 최종 실행 검증

```mermaid
flowchart LR
  A[1차 디자인 확정]:::done --> B[계층 분리]:::done --> C[화면·편집 구현]:::done
  C --> D[실제 XML·저장·엔진 검증]:::done --> E[Windows 배포 검증]:::done
  E --> F[후속: Claude·POK 스킬 배포 검증·macOS]
  classDef done fill:#243d31,stroke:#65967d,color:#fff
  classDef active fill:#4b4025,stroke:#bca46c,color:#fff
```

코드 서명, 공개 게시, 자동 업데이트와 전체 PoB 기능 동등성은 이 초안의 완료 조건이 아니다. 엔진 변경은 별도 `codex/pok-desktop-runtime` 브랜치에 있고 기존 엔진 main은 수정하지 않는다.

최종 결과: 앱 검사 36개 통과, 엔진 단위 1,276개 통과, 1920/1024 레이아웃과 패키지의 저장·재시작 검증 통과. `release/POK-0.1.0-win-x64.exe` 생성. 상세 범위와 계산 제한은 [검증 기록](VALIDATION.md)에 남긴다.

## 채팅 제어·POK 연결 표시 보완 (2026-10-08)

- [x] 네이티브 창 버튼을 유지하는 테마 제목 표시줄, 기본 Electron 메뉴 제거
- [x] 실제 Codex 모델 목록·추론 강도, 이미지 선택/붙여넣기/드롭, 응답 중지
- [x] blocking 질문과 비동기 질문의 선택지·직접 답변 및 후속 턴 연결
- [x] 새 응답의 완료 시각·소요 시간·첫 토큰 시각 저장, 조회 진행 표시
- [x] main의 실제 MCP 종료·시간 초과를 설정/사이드바에 즉시 반영; 실행 중 server_info 중복 요청 병합
- [x] 연결 확인의 중복 Git 호출 제거; POK KB의 Windows Git pipe 대기 문제를 파일 stdout으로 수정
- [x] 합성 대화 기반 Electron 검증, 실제 설치 Codex 모델 조회/스레드 시작, 1920×1080·1024×768 화면 확인

핵심 변경: main의 agent/pok/chat-images/window-chrome, shared/preload 계약, App/ChatView/질문 카드/시간 표시. 연결된 POK는 main의 관리 브리지를 사용하고 별도 pok MCP 설정은 비활성화한다. 이는 이중 연결 예방이며 과거 오류 원인이 이중 연결이었다고 단정하지 않는다. POK 변경은 server.py와 kb/store.py에 있다. 새 의존성은 없다.

남은 제한: 이 PC의 실제 첫 KB 조회는 53.2초였다. 모델 추론 속도는 별도이며 실제 유료 추론 턴은 이번 검증에 포함하지 않았다. 기존 대화에는 완료 시각이 없으므로 새 응답부터 적용한다. 정식 패키징은 다른 PC에서 진행한다.

## 다른 PC 인계 — 2026-10-08

- 사용자 요청으로 이 작업을 커밋·푸시한다. UI 브랜치: skerfolg/coho. 대응 POK 브랜치: codex/pok-ui-bundle, 커밋 a05e540b681c7f18595ad0b5c6c3bf2c151dba5f.
- 두 저장소를 함께 갱신해야 한다. PoB는 5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6에 고정되어 있다. 최신 PoB를 별도로 받지 않는다.
- 각 저장소에서 git fetch origin 후 해당 작업 브랜치를 checkout한다. UI에서는 npm ci를 실행하고 POK 개발 환경 및 고정 PoB checkout을 준비한다.
- 생성 데이터·runtime·dist·실행파일·사용자 대화는 Git에 넣지 않았다. 커밋 이후 source identity가 바뀌므로 집 PC에서 docs/DATA-BUNDLE.md에 따라 checkout 묶음 또는 production runtime과 묶음을 다시 생성한다. 기존 묶음의 출처 검증을 우회하지 않는다.
- 개발 실행: bundle:prepare-checkout → npm run build → npm start. 정식 배포: POK scripts/build_runtime.py → UI bundle:prepare --write-lock → 검증 → dist:win. 각 명령의 경로 인자는 집 PC 환경에 맞춘다.
- 남은 확인: 실제 모델 추론/질문 왕복, 첫 KB 조회 성능, 소스 없는 Windows 배포 실행. 이 PC에서는 변경 영역 회귀·빌드·실제 Electron 합성 채팅/엔진 흐름까지 확인했다.
