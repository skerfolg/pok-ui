# 로컬 검증

## 원본 스킬 그룹 순서·삭제 — 2026-11-03 (25차)

- 최종 source `.local/skill-groups-native-1793660957383/result.json` 및 Windows packaged `.local/skill-groups-native-1793661015590/result.json` **각5개 그룹 통과**. pending/preview 취소·문서 격리, 원본 양방향 drag/중복 이름 source 선택·확인 삭제·두 selector, full numeric stats/unknown/비활성 XML·원문 보존, undo/redo/revision5 새 계산·저장/재시작·PoK 미연결을 확인했다. packaged는 실제 배포 exe와 그 resources에 포함된 runtime/editor를 사용했고 경로 junction도 확인했다. source/packaged의1920/1024 preview를 직접 시각 확인했다. 기존 `sets-config-desktop-smoke.cjs` source8(`.local/sets-config-native-1793660903295/result.json`)도 통과했다. 아래 진행 중을 이 최종 결과로 대체한다.
- 중간 source `.local/skill-groups-native-1793660720723`와 packaged `.local/skill-groups-native-1793660764737`는4개 그룹 후 restart 전체 객체 비교에서 -0→JSON 0 표현 차이로 실패했다. 이전 evidence 기대 실패와 구분한다. 제품 계산/저장을 바꾸지 않고 기대 객체만 실제 JSON 저장 형식으로 비교해 최종 재실행했다. 원본 GUI/OS clipboard/portable/모델·전체 조합/장기 ledger 완료를 주장하지 않는다.
- `npm run check` 186개·boundary/type 통과, build/pack:win 통과. `pob-skill-groups.test.ts` 3개: deep unknown/비활성 세트·형제 위치, 빈 세트/선택 fallback, 잘못된 요청/순서/선택/inspect 적용 거부. 첫 sandbox Node worker EPERM은 elevated 실행으로 통과했으며 제품 실패가 아니다.
- `tests/pob-skill-groups-smoke.cjs` 실제 native 4개 그룹 통과, `.local/standalone-pob/skill-groups-result.json`: 중복 이름 양방향 drag·두 selector/전체 numeric output 보존, 원본 확인 삭제·마지막/유일 그룹 삭제의 새 계산, invalid source/position/비활성 요청 거부 후 다음 계산 불변. unknown group/gem attrs·비활성 세트와 원문을 보존했다.
- 첫 source `.local/skill-groups-native-1793660531766/result.json`: 3개 그룹 뒤 redo receipt 기대에서 중단. pending/preview 취소·문서 전환, 두 크기 preview, 이동 source 선택 유지·양방향 이동·삭제/새 revision 계산까지는 통과했다. undo에서 다른 XML 계산 후 redo의 receipt 자동 복원은 기존 계약/구현에 없으며 장기 ledger 미완료를 드러냈다. 하네스의 잘못된 근거 계승 기대를 수정했으며 최종 source5/packaged5 재실행이 통과했다.
- packaged 하네스는 이번부터 exe와 함께 배포된 resources의 runtime/editor를 별도 합성 workspace에 junction으로 연결해 그 실제 payload를 사용한다. 두 크기 source preview를 직접 시각 확인했다. 원본 PoB GUI/OS clipboard/portable/선택 PoK/모델·모든 특수 그룹 조합은 미수행이다.


## 노트 색상 편집 — 2026-11-03 (24차)

- 최종 Windows packaged `.local/notes-native-1793659409290/result.json` **6개 그룹 통과**, source `.local/notes-native-1793659213134/result.json`도6개 그룹 통과. 긴 paint의 전체 높이·scroll 정합/코드·색상 edit/팔레트 접근성·원문/unknown·local/build undo·zoom·문서 격리/재시작·PoK 미연결을 확인했다. source/packaged 두 크기 직접 시각 확인, renderer pageerror 없음. 기존 sets-config 최종 source `.local/sets-config-native-1793659219771/result.json` **8개 그룹 통과**. 아래 진행 중은 parity2/unit7/check183/build/pack:win/source6/packaged6/기존8 통과로 대체한다. OS clipboard/IME·원본 GUI pixel/font parity·portable·실제 모델은 미수행이다.

- 최종 접근성 group/입력 라벨까지 반영한 source `.local/notes-native-1793659213134/result.json`6개 그룹 통과, check183/build/최종 pack:win 통과. 두 번째 sets-config `.local/sets-config-native-1793658905255/result.json`은 더 넓어진 팔레트 aria-label 때문에 느슨한 getByLabel('PoB 노트')가2개를 찾았다. 팔레트는 명시 group/고유 라벨로 분리하고 하네스는 exact input label을 쓰도록 고쳤다. 현재 기존 전체 회귀와 최종 packaged를 실행 중이다.

- 최종 source `.local/notes-native-1793658898504/result.json` **6개 그룹 통과**. 첫 source6 이후 실제 PNG 검토에서 global pre max-height가 paint 레이어를 중간에 자르고 내부 scrollbar를 만들던 UI 결함을 발견했다. notes-paint만 max-height/overflow를 분리하고 실제 client/scroll height 검사로 강화했다. 수정 후 source6/두 크기를 다시 실행·직접 시각 확인했다. 이전 `.local/notes-native-1793658479882`의 기능 통과를 긴 텍스트 표시 검증 완료로 확대하지 않는다.
- 기존 sets-config 첫 실행 `.local/sets-config-native-1793658606699/result.json`은 노트 이전에 오래된 tree delete 버튼 locator에서 중단했다. 최신 원본 popup의 preview/세트 적용과 inactive copy 명시 선택에 맞게 회귀 하네스를 고쳤고 재실행 중이다. 제품을 예전 동작으로 되돌리거나 실패를 통과로 집계하지 않았다.

- check **183 passed**, boundary/type 통과, build 통과. parser/offset/range/반복 문자/Unicode/CRLF/unknown literal unit7개 통과. `tests/pob-notes-parity-smoke.cjs`2개 그룹 통과(`.local/standalone-pob/notes-parity-result.json`): 수정하지 않은 pinned NotesTab.SetColor의 cursor/range·한글/emoji/CRLF·indexed/unknown 처리와 named presets12개 일치. headless 참고 테스트의 모든 write/settings/process 실행을 차단했다.
- source `.local/notes-native-1793658479882/result.json` **6개 그룹 통과**: indexed/hex render·HTML 비실행·view toggle/원문0, 원본 범위 색칠/로컬undo, 실제 caret의 반복 문자·한글/emoji·synthetic clipboard 이벤트, keyboard/wheel zoom·scroll/backdrop sync/1920/1024, Ctrl+Enter/XML unknown·build undo/redo, 초안 문서 격리·저장/재시작·PoK 미연결. 두 크기를 직접 시각 확인했다. renderer pageerror 없음. OS clipboard는 건드리지 않았고 실제 OS IME 입력은 미수행이다.
- 초기 notes fixture는 createBlankXml에 Notes section이 항상 있다고 잘못 가정해 launch 전 실패했다. section을 명시 생성해 보완했으며 검증 성공으로 집계하지 않는다. 최종 packaged/기존 sets-config 회귀는 진행 중이다. 원본 GUI와 DLL의 pixel/font parity는 [규약/출처 문서](POB-NOTES.md)의 범위를 따르며 완료로 주장하지 않는다.

## 지원 트리 공통 카탈로그·로드 전 검사 — 2026-11-03 (23차)

- 최종 Windows packaged `.local/catalog-versions-native-1793657050359/result.json` **5개 그룹 통과**, source5와 동일한 old/current catalogue→원본 수치/unknown·version 보존→undo/redo/재측정→unsupported active/inactive 차단→저장/재시작을 확인했다. 두 크기의 old catalogue/원본 모드 선택/그룹 적용·새 수치를 직접 시각 확인했다. renderer pageerror 없음. 아래 진행 중은 native6/source5/packaged5/check176/build/pack:win 통과로 대체한다. 원본 GUI/portable/실물·전수 조합/모델은 미수행/미완료다. 개인 XML·세션을 사용하지 않았다.

- 최종 source `.local/catalog-versions-native-1793656910921/result.json` **5개 그룹 통과**: old0_1/latest0_5의 원본 base/mod/gem catalogue 선택·장착/그룹 적용·full numeric stats 일치, old tree 원문/unknown/revision3→undo4/redo5·새 계산, 두 해상도, unsupported active/inactive의 진단·버튼 차단/원문0, 저장/재시작·PoK 미연결. renderer pageerror 없음. 두 크기의 과거 tree gem catalog와 적용 버튼/숫자를 직접 시각 확인했다. 첫 packaged `.local/catalog-versions-native-1793656848762/result.json`도 같은 이전 검색 하네스 오류였으며 수정본으로 최종 재실행 중이다.

- 첫 source `.local/catalog-versions-native-1793656666472/result.json`은 old0_1/current0_5의 장비·젬·native full stats와 old undo/redo·두 크기3개 그룹을 통과한 뒤, 미지원 inactive 문서에서 검색 결과를 찾지 못해 멈췄다. 문서별 검색 state가 초기화되는데 하네스가 새 검색을 하지 않은 오류여서 새 문서에서 Iron Ring을 다시 검색하도록 고쳤다. 제품의 미지원 진단이 표시됐고 원문은 유지됐다. 최종 source/packaged는 재검사 중이며 이 실패를 전체 완료로 집계하지 않는다.

- check **176 passed**, boundary/type 통과, build 통과. catalog gate는 같은 source/runtime ID/commit과 양쪽 지원 범위를 검사한다. 최신 기본 tree와 다르다는 이유로 차단하지 않는다. 미지원 비활성 선언도 실행 전에 확인하고 game targetVersion을 treeVersion으로 해석하지 않는 unit을 추가했다.
- native `tests/pob-catalog-versions-smoke.cjs` **6개 그룹 통과**, `.local/standalone-pob/catalog-versions-result.json`:0_1~0_5 각각 원본 version별 class control로 초기화·같은 item/mod/gem catalogue 적용·Strength7→15/Fireball4.4583333333333 실제 계산 성공. 미지원 active/inactive/item buildXml/party supportXml은 POB_TREE_VERSION, 다른 runtime ID도 거부한다. renderer에 item/gem/트리의 게임 판단 규칙을 넣지 않았다.
- 첫 실행은 지원5개를 통과했으나 unsupported Item API가 거부되지 않았다. `.local/standalone-pob/catalog-versions-before-guard.json`을 보존했고 이를 요청 문맥 복원 성공으로 취급하지 않는다. [로드 계약 재현/필요 계약](POB-LOAD-CONTRACT.md)에 관측과 코드 근거를 분리했다. 현재 declared canonical Spec version 검사는 host에서 실행 전에 수행하며 원본/공유 엔진은 수정하지 않았다. 다른 종류의 모든 원본 load 실패까지 해결했다는 뜻은 아니다.
- 실제 source/Windows packaged·old/current 카탈로그/아이템·젬/계산·두 크기·undo/restart와 미지원 진단은 실행 중이다. 전체 버전/직업/아이템/스킬 조합·실물 입력·원본 GUI/portable/모델은 미수행/미완료다.

## 원본 트리 코드 — 2026-11-03 (22차)

- 최종 Windows packaged `.local/tree-code-native-1793655107706/result.json` **7개 그룹 통과**. source7과 같은 code/partial/새 수치·원본 근거 분리/빈 문서·다중 문서/재시작·PoK 미연결을 확인했다. source/packaged 1920/1024의 미복원 ID/원문·버전·적용 버튼을 직접 시각 확인했다. renderer pageerror 없음. packaged도 clipboard=`ipc-only-rich-clipboard-preserved`: 실제 IPC 전달만 검증하고 OS clipboard 쓰기는 기존 rich 원본 보호를 위해 미수행이다. 아래 진행 중은 native8/빈 문서1/source7/packaged7/check173/build/pack:win 통과로 대체한다. 실제 서비스 링크/전체 code 조합·OS clipboard write·원본 PoB GUI·portable·실제 모델은 미수행/미완료다.

- 최종 source `.local/tree-code-native-1793654938646/result.json` **7개 그룹 통과**: readonly export/원본버전·copy IPC, 명시 version·입력 변경/취소/문서 격리, ordinary import의 원본 full stats/revision1, invalid input 보존·partial ID/입력/revision2·재시작 경고 유지, undo3/redo4의 새 수치와 source evidence revision2 분리, no-tree code import/새 계산, loader 누락/code 한계 구분·다중 문서·재시작·PoK 미연결. renderer pageerror 없음. 1920/1024 partial preview와 실제 미복원 ID/적용 버튼을 직접 시각 확인했다. clipboard는 `ipc-only-rich-clipboard-preserved`: 기존 rich clipboard를 건드리지 않고 실제 IPC가 검토한 code와 동일한 문자열을 write 호출로 넘기는 것만 확인했다. OS clipboard 쓰기는 미수행이다. packaged 최종 실행은 진행 중이다.

- 초기 source `.local/tree-code-native-1793654569941/result.json` 및 `.local/tree-code-native-1793654717410/result.json`은 clipboard 하네스의 구형 availableFormats 호출에서 중단했다. 설치된 Electron44 SDK는 read/readText/writeText의 Promise API다. 하네스를 현재 read/types로 고치고 제품 copyText도 writeText 완료를 await하도록 수정했다. 클립보드에 쓰기 전 중단된 실패 시도이며 성공에 포함하지 않는다. 최종 source에서 copy-complete 신호를 확인했고 이후 import/partial/restart 검증 중이다.

- check **173 passed**, boundary/type 통과, build 통과. 새 단위는 export readonly, partial 근거/source code·원본 XML 보존, 동일 XML 재측정의 source evidence 분리와 다른 입력/owner/runtime 시 비계승을 검사한다. 새 수치·provenance revision을 이전 결과로 덮어쓰지 않는다.
- native `.local/standalone-pob/tree-code-result.json` **8개 그룹 통과**: 원본 Copy callback·버전 없는 code/적용 거부, 일반 code 동일 full numeric stats/Life170·기존 Spec/비트리 XML 유지, 무기별 할당 미포함, 높은 전직의 원본 왕복 비호환/코드 보존, decoder 누락 ID 관측, 로더가 제외한 저장 ID와 코드 왕복 누락 구분, 실제 로드>255인 연결 fixture의 encoder 한계, invalid/버전 없음/빈 이름/네트워크 형식 거부 후 원본 계산 불변. 별도 `.local/standalone-pob/tree-code-empty-result.json` **1개 그룹 통과**, 트리 없는 문서의 native 기본 세트+code import·실제 계산 확인. 개인 데이터는 사용하지 않았다.
- 초기 임의 ID270/불연결 fixture는 원본 복원1이어서 encoder 한계를 검증하지 못했다. 실제 로드 수를 확인하고 원본 static graph로 연결된 합성 fixture를 만들었다. 원본 규칙·byte parser를 제품에 복제하지 않았다. 공간 확보는 manifest identity/절대 workspace 경로/known content/reparse 확인 후 20차의 비검증 중간 백업4개만 제거했고 검증된19/20/21차 및 사용자 데이터를 보존했다.
- 실제 source/packaged·복사·두 해상도와 부분 복원 재시작은 진행 중이다. clipboard에 rich format이 있으면 원본을 건드리지 않고 실제 IPC의 write 호출만 검증하고, plain/empty이면 실제 text write/read를 확인한 뒤 원래 상태를 복구한다. 결과의 clipboard 필드로 OS 쓰기 범위를 구분하며 원래 clipboard 내용을 로그/fixture에 저장하지 않는다.

## 구형 단일 Spec의 편집 형식 전환 — 2026-11-03 (21차)

- 최종 Windows packaged `.local/tree-adoption-native-1793652224912/result.json` **5개 그룹 통과**, source5와 동일한 전체 동선이다. 1920/1024 packaged의 원문/실제 복원 version 차이·저장 입력 diff·적용/취소 버튼을 직접 시각 확인했다. renderer pageerror 없음. 아래 진행 중은 source5/packaged5/native4/check169/build/pack:win 통과로 대체한다. 전체 버전/직업/전직/특수 노드·실물 사용자 빌드 전수와 실제 원본 GUI/portable/모델은 미수행/미완료다. 개인 데이터는 fixture/배포물에 포함하지 않았다.

- 최종 source `.local/tree-adoption-native-1793652063718/result.json` **5개 그룹 통과**: 원문 preview/대기 취소·문서 격리, 1920/1024 명시 검토→adopt/revision1/원본 전체 수치 일치, 원문/unknown/receipt·지도3149노드·26/26이미지, 저장/재시작 후 별도 Copy + Convert/revision2, undo3/4로 canonical/원문 정확 복귀·redo5/새 계산, 혼합 입력 거부·타 문서 원문·재시작·PoK 미연결. renderer pageerror 없음. 두 크기의 원본 복원 version 차이와 적용/취소 버튼을 직접 시각 확인했다. pack:win도 통과했으며 최종 Windows packaged 실행은 진행 중이다.

- `npm run check` **169 passed**, boundary/type 통과. build 통과. native `tests/pob-tree-adoption-smoke.cjs` **4개 그룹 통과**, `.local/standalone-pob/tree-adoption-result.json`. raw root Spec의 원본 계산과 canonical Tree/Spec의 전체 numeric stat을 비교했고 Life170 및 다른 수치가 일치했다. numeric signed zero만 JSON 표현에 맞춰 정규화하며 누락 키/오차를 허용하지 않는다. unknown Spec/루트·비트리 XML 보존, 원본 경로 편집/새 계산, 별도 업그레이드, 혼합/중복 거부/다음 계산 불변도 확인했다.
- 고정 원본은 legacy Spec의 명시 treeVersion=0_5를 그대로 active version으로 쓰지 않고 실제0_1로 복원했다. UI에서 이를 추정/강제하지 않고 원본이 저장한 version/class/할당을 검토·적용한다. source XML은 원문 그대로 유지되고 최신 버전 업그레이드는 별도 작업이다. 해당 단위13개 통과; 새 회귀의 선언 버전 fixture를 명시적으로0_5로 고쳐 원본 복원 버전과 구분했다.
- 실제 source/Windows packaged와 두 해상도·undo/redo·재시작은 진행 중이다. 여러 root Spec 또는 Tree와 혼합된 입력은 아직 자동 정규화하지 않는다. 원본 GUI/portable/실제 모델/전수 조합 성공을 주장하지 않는다. 개인 XML·세션은 사용하지 않았다.

## 초기 트리·원본 버전 변환 — 2026-11-03 (20차)

- 최종 Windows packaged `.local/tree-workspace-native-1793650959965/result.json` **7개 그룹 통과**. source7과 같은 전체 동선과 다중 문서 재시작·PoK 미연결을 확인했다. 1920/1024 packaged PNG도 직접 시각 확인했으며 원본 경고·저장 입력 차이·적용/취소/미리보기 버튼이 접근 가능하다. renderer pageerror 없음. 아래 진행 중은 최종 source7/packaged7/native6/legacy1/기존tree5/check167/build/pack:win 통과로 대체한다. 원본 PoB GUI·portable·실제 모델·모든 버전/직업/전직/특수 조합은 미수행/미완료다. 개인 XML·대화·세션을 사용하지 않았다.

- 최종 source `.local/tree-workspace-native-1793650856862/result.json` **7개 그룹 통과**. 명시 버전/직업·미적용 preview/입력 변경/대기 취소·문서 격리, source 유지 Copy + Convert/0_1 지도3149노드·26/26이미지, replace·1920/1024 검토, ConvertAll의 동일 최종 XML/수치와 undo/redo/revision6 계산, missing tree의0_1 Ranger/Life170·unknown/originalXml 보존, bare Warrior·기본 세트/새 계산·receipt, legacy 실제 IPC 거부/원본0, 다중 문서 저장/재시작과 계산6/초기화receipt 복원을 확인했다. renderer pageerror 없음. 두 크기의 source 변환 preview/원본 경고/저장 입력과 변환본 차이·적용 버튼을 직접 시각 확인했다. 최종 packaged는 진행 중이다.

- 최종 native `tests/pob-tree-workspace-smoke.cjs` **6개 그룹 통과**, `.local/standalone-pob/tree-workspace-result.json`: 초기0_1 Ranger/Life170, source 유지 Copy + Convert/활성 adjacent/Life170, replace/ConvertAll 동일 전체 수치, 모든 기본 섹션 없는 문서의 stock 초기 생성·실계산, 미복원 저장9999999 제외/다음 계산, invalid/blank/existing/no-op 거부 후 기준값 보존. 별도 legacy-only 실행 **1개 그룹 통과**, `.local/standalone-pob/tree-workspace-legacy-result.json`: 원본 Build.savers가 지원하는 root Spec을 빈 트리로 오인하지 않고 inspect/initialize를 `POB_TREE_LEGACY`로 거부한다. 이 구형 형식의 편집/정규화는 UI 미지원이며 엔진 결함으로 분류하지 않는다.
- 기존 native tree **5개 그룹 통과**, `.local/standalone-pob/tree-result.json`: 경로/종속 해제·무기/능력치 및 실제 Fireball4.4583333333333→6.01875 회귀. 공유 tree-state 추출 후에도 원본 연산 유지. 최신 check **167 passed**, boundary/type 통과, build/최종 pack:win 통과. 실제 source/Windows packaged 전체 동선은 진행 중이다.
- 첫 source `.local/tree-workspace-native-1793650078030/result.json`은 변환·undo/redo·새 계산3개 그룹 이후 초기 생성 버튼의 비활성으로 중단했다. 계산 가능한 트리가 필요하다는 gate를 초기 생성에도 쓴 UI 결함이었다. 검증된 runtime 준비 상태를 별도 초기 생성 prop으로 전달했고, 버전/직업 검사는 원본에서 계속 수행한다. 최종 source/packaged 재검사 중이며 실패 실행을 완료로 집계하지 않는다.
- 이후 source `.local/tree-workspace-native-1793650508177/result.json` / packaged `.local/tree-workspace-native-1793650663743/result.json`은 초기 생성·bare Warrior 계산까지 5개 그룹을 통과했으나 legacy 선택 직후 디스크가 이전 문서의 debounce 저장 상태여서 하네스 XML 비교가 실패했다. renderer의 legacy 진단과 실제 IPC 거부는 이미 확인했고 저장 완료 후 legacy revision0/XML 불변도 따로 확인했다. 선택한 문서 ID의 저장 완료를 polling하도록 고쳤으며 최종 재실행 중이다. 사용자 데이터 오염으로 분류하거나 실패 실행을 전체 통과로 집계하지 않는다.

- native 검사 작성/실행 중. 초기0_1 Ranger 생성, Copy + Convert의 원본 유지/변환본 활성화, replace와 ConvertAll의 동일 수치, Tree/Items/Skills/Config 없는 문서의 초기화·실제 계산을 중간 실행에서 확인했다. 미복원 저장 ID·거부 후 상태 보존을 포함한 최종 native 실행 및 source/packaged는 아직 진행 중이다. 전체 동선 완료로 집계하지 않는다.
- 발견/수정: 구 tree는 main:LoadTree 후 class dropdown을 조회해야 한다. Lua JSON 키 순서 비교는 내용 비교/검증된 요청 echo로 바꿨다. 빈 parent를 set으로 취급해 replaceChild가 실패하던 공통 삽입 경로를 수정했다. 버전 변환의 full Save 정합·unknown 소켓 metadata 보존과 새 parent 생성 unit을 추가했다. 최신 해당 XML 단위10개 통과; 전체166/check 재실행 중. build 통과, Vite 기존 loader/chunk 경고 남음.
- 하네스 오류: 없는 Notes를 serialize, PoB1 루트 태그, 주력 그룹0, 직업 없는 createBlankXml을 잘못된 노드 회귀에 사용한 것을 수정했다. 클래스 없는 Spec의 원본 거부를 엔진 결함으로 분류하지 않는다. ENOSPC로 runtime staging/check가 중단된 시도는 검증 성공이 아니며, 검증된18/19차 백업과 사용자 데이터는 보존한 채 15~17시 생성 백업12개/정확한 실패 staging만 경로·내용·reparse 확인 후 정리했다.

## TreeView 원본 관리 — 2026-11-03 (19차)

- 최종 source `.local/tree-management-native-1793647818011/result.json`도 **6개 그룹 통과**, Windows packaged와 같은 전체 동선을 확인했다. renderer pageerror/crash 없음. 아래 실행 중 기록은 최종 source6/packaged6/native 관리5/export2/기존 세트4/check162/build/pack:win 통과로 대체한다. 원본 PoB GUI·portable·실제 모델·전수 동등성은 미수행/미완료다.

- 최종 Windows packaged `.local/tree-management-native-1793647650631/result.json` **6개 그룹 통과**. 자동 preview/빈 입력·빠른 입력/Enter/취소/문서 격리, inactive unmatched rename/copy/stock New, 직접 drag·활성 삭제·계산, undo6/redo7/최종8 계산·receipt, old0_1 유지/최신 inactive New, 저장/재시작·타 문서 불변·PoK 미연결을 검사했다. 1920/1024 PNG에서 제거되는 구성·직업/노드 변화·적용/취소 버튼을 직접 시각 확인했다. `pack:win`의 runtime/catalog/5tree 실제 계산 검증·build·패키징 통과. old-only source `.local/tree-management-native-1793647510553/result.json`도 **2개 그룹 통과**, 3149노드·3143표시·26/26이미지·실패0·재시작을 확인했다. 최종 source 전체 및 기존 세트 회귀는 실행 중이다.
- 최종 source 기존 세트 회귀 `.local/tree-sets-native-1793647865565/result.json` **4개 그룹 통과**. 취소/문서 격리, cross-class 전환과 native 복사/명시 선택/삭제/undo, 비교의 원본 직업·측정 XML/hash·최종 적용/새 계산, 저장/재시작·PoK 미연결을 확인했다. 이전 native Loadout 관리6개 그룹 통과 기록도 유지한다. 이 대표 검사는 모든 공유/버전/특수 조합을 전수 검증한 것이 아니다.

- 원본 tree.lua export 회귀 `tests/pob-tree-source-smoke.cjs` **2개 그룹 통과**: 0_1~0_5 source/export 해시·프레임 자원과 모든 표시 좌표·연결 일치, missingArtwork0, 잘못된 버전 거부. `.local/standalone-pob/tree-source-result.json`. 원본 Lua 노드 수는 3149/3404/4118/4701/4912이며 과거 JSON 수치를 승계하지 않는다.
- 최초 source `.local/tree-management-native-1793645907030/result.json`은 관리4개 그룹 이후 구버전에서 renderer 오류로 중단했다. old-only `.local/tree-management-native-1793646445710/result.json`에 `Cannot read properties of undefined (reading 'Normal')` 재현. stock tree.lua의 overlay가 구 tree.json에 없어서 Lua export로 변환 원본을 수정했다. 이후 `.local/tree-management-native-1793647316208/result.json`은 정상 지도 표시 중 테스트가 부모 div의 빈 dataset을 읽어 timeout된 하네스 오류다. canvas를 직접 읽고 pageerror/crash·이미지/노드 준비를 검사하도록 고쳤으며 최종 실행 중이다. 실패 실행을 성공으로 집계하지 않는다.

- native `tests/pob-tree-management-smoke.cjs` **5개 그룹 통과**, `.local/standalone-pob/tree-management-result.json`. 요청한 inactive/orphan 객체의 원본 rename/copy·중복명 허용/지정 객체 삭제, stock New(자동 활성화 없음)/드래그, active delete의 이전 인접 spec 선택, old0_1 유지/stock latest inactive New 및 거부/다음 입력 불변을 검사했다. before Life170/Dex25, active delete 후 Life334/Dex47. 다른 세트 XML은 serialize 비교로 그대로이고 current actor 유지 동작의 모든 numeric stat을 deepEqual로 확인했다. 추천 개선 판정은 아니다.
- check **162 passed**, boundary/type 통과. 새로운 unit은 unknown sibling 위치, 미변경 섹션, legacy 비트리 구조와 missing weapon flag가 tree-only 편집으로 재생성되지 않음을 검사한다. build 통과. source/packaged·이전 세트 전환/비교·일반 관리 회귀는 진행 중이다.
- 이전 React set-copy는 새 tree를 활성화했지만 stock PassiveSpecListControl은 inactive로 추가한다. 기존 desktop 회귀에는 사용자가 새 항목을 명시 선택하는 단계를 추가했고 삭제 final button은 원본 preview 뒤 ‘세트 적용’으로 통일했다. 원본 동작을 임의로 바꾸어 과거 assertion을 맞추지 않았다.
- C: 여유40MB 때 generated backup11개(09/10시간대)만 절대 경로·workspace 접두어·known content·no reparse 확인 후 정리해 약3.5GB를 확보했다. 최신 검증/사용자 데이터/engine checkout은 변경하지 않았다. 개인 데이터는 fixture/배포물에 넣지 않았다. 원본 GUI/portable/실제 모델은 미수행이다.

## 원본 passive-spec 순서 이동 — 2026-11-03 (18차 진행)

- 최종 Windows packaged `.local/linked-reorder-native-1793643190539/result.json` **5개 그룹 통과**, source `.local/linked-reorder-native-1793642912224/result.json`도 동일5개 그룹 통과. 양방향/공유 이동의 원래 네 세트와 모든 수치 보존, 변경 없는 위치 차단·취소/문서 격리, undo/redo/revision4 재계산, 이동 범위/동반 별칭/활성 유지/receipt·restart를 확인했다. 1920/1024 PNG 직접 시각 확인. native5와 기존 named 관리 native6, check160/build/pack:win도 통과했다. 아래 진행 중은 이 최종 결과로 대체한다. GUI/portable/실제 모델 미수행.

- source `.local/linked-reorder-native-1793642912224/result.json` **5개 그룹 통과**, 취소/문서 격리·아래/위 이동·전 수치/원문/활성 객체 보존·undo/redo/revision4 재계산·shared aliases/movement receipt·재시작을 확인했다. 1920/1024 PNG 직접 시각 확인. Windows packaged 검사 진행 중이며 pack:win 통과.
- 최초 source `.local/linked-reorder-native-1793642654270`는 이동 실행 전 baseline의 VaalArcticArmourMitigation -0과 fixture JSON 0을 Object.is 기반 deepEqual이 구분해 중단했다. JSON roundtrip이 -0을 0으로 저장하는 표현 차이여서 desktop 비교 helper에서 signed zero만 정규화했다. 키를 지우거나 값 누락을 0으로 대체하지 않고 모든 비영 수치는 정확 비교한다. native 이동 전후 raw 결과의 deepEqual도 별도로 통과했다. 제품 출력/게임 규칙을 바꾸거나 수치 오차를 허용한 것이 아니다.

- native `tests/pob-linked-reorder-smoke.cjs` **5개 그룹 통과**: 비활성 연결 spec의 아래/위 이동 및 unmatched 보존, shared aliases 이동/구성 유지, duplicate title의 명시 활성 객체 유지와 원본 이름 해석 변화, 잘못된 위치/no-op/cancel 후 입력 불변. `.local/standalone-pob/linked-reorder-result.json`. 모든 유한 numeric stat을 이동 전후 deepEqual로 비교했고 활성 네 객체·주력 그룹·무기 state를 원본 응답에서도 검증했다. 활성 Life170/공유 Life334는 구성 보존 사례이며 추천 개선 판정이 아니다.
- original PassiveSpecListControl.OnOrderChange가 actual build.spec 객체를 따라 activeSpec을 재지정하고 secondary dropdown/Loadouts를 갱신함을 코드와 실제 OnKeyUp 재생으로 확인했다. UI 자체 title 선택/순서 게임 규칙을 구현하지 않았다. 첫 quick probe의 현재 네 세트 유지도 실제 응답으로 확인 후 activePreserved metadata를 추가했다.
- check160/build 통과. source/Windows packaged·두 해상도 검사 진행 중. 개인 입력은 사용하지 않았고 엔진/원본 PoB 소스는 수정하지 않았다. 중간 adapter a9d9bc72 backup만 workspace 내부 경로/내용/manifest/reparse 검증 후 정리했다. source code/사용자 데이터/검증된 이전 runtime은 삭제하지 않았다.

## 원본 이름 기반 연결 구성 관리 — 2026-11-03 (17차 진행)

- 최종 Windows packaged `.local/linked-management-native-1793640658461/result.json` **5개 그룹 통과**, source `.local/linked-management-native-1793640282299/result.json`도 동일5개 그룹 통과. native6/기존 일반 native6/check160/build/pack:win 통과. capability별 제어·한국어 복사·미지원 reorder 표시, 혼합 index/name 관리·생존 구성 명시 삭제·정확한 undo/redo/revision4 계산, 공유 alias collateral 변화/실제 저장 세트 보존, 입력 revision/hash/runtime·관계 receipt와 XML의 재시작을 검사했다. 1920/1024 PNG 직접 시각 확인했다. 아래 진행 중은 이 최종 결과로 대체한다. 원본 GUI·portable·실제 모델은 미수행이다.

- 최종 named native `.local/standalone-pob/linked-management-result.json` **6개 그룹 통과**, 기존 일반 관리 `.local/standalone-pob/loadout-management-result.json` **6개 그룹 재통과**. 관련 없는 첫/마지막 spec 사이에 있는 생존 brace 대상을 삭제 후 원본 재조회로 선택하고 실제 Life170/Dex25까지 확인했다. 원본 연결 비교는 숫자 spec ID가 아닌 객체 동일성으로 하므로 위치 이동을 거짓 구성 변경으로 표시하지 않는다.
- source `.local/linked-management-native-1793640282299/result.json` **5개 그룹 통과**. opaque 이름 기반 rename/copy와 미지원 reorder 상태, 한국어 복사/reference 수치, 원본 index/named 혼합 목록의 명시적 생존 구성 삭제, undo/redo와 revision4 계산, 공유 spec rename의 두 연결 제외/저장 세트 보존, workspace_operation 입력 근거/관계 변화의 재시작 보존을 검사했다. 두 해상도 PNG 직접 시각 확인. Windows packaged 검사는 진행 중이며 check160/build/pack:win 통과.

- native 최초5개 그룹 통과 (`.local/standalone-pob/linked-management-result.json`): 원본 raw-name rename·연결 목록 전후 변화, 한국어 복사·canonical lineage·실제 Life170/Dex25, 공유 spec 별칭 두 개의 목록 제외와 두 ItemSet 보존, 명시적 생존 구성/혼합 목록 삭제, missing/unknown/미지원 reorder 거부 후 다음 입력 불변. 최초 실행의 DTO 없는 attributes 접근은 raw XML marker 검증으로 고친 뒤 재실행했다. UI나 엔진 검사를 우회하지 않았다.
- 현재 중간에 있는 brace spec을 삭제 후 원본 재조회로 선택하는 추가 native 사례, 기존 일반 관리 회귀 및 source/Windows packaged 전체 동선은 실행 중이다. check160/build 통과. Vite native-config/chunk 경고는 기존과 같으며 원본 GUI/portable/실제 모델 완료로 처리하지 않는다. 개인 입력은 사용하지 않았다.
- native before/after 객체 관계에서 얻은 added/removed/changed와 입력 revision/hash/runtime을 계산 receipt에 자동 보관한다. 선택 이름은 opaque 값이며 renderer에서 brace 매칭/새 생존 구성 추정을 구현하지 않는다. 원본 ListControl이 없는 named reorder는 명시적으로 제공하지 않는다.

## 원본 Loadout 관리·XML lineage — 2026-11-03 (16차 진행)

- 최종 표시 전용 Windows packaged `.local/loadout-management-native-1793638401983/result.json` **2개 그룹 통과**: 비활성 rename의 네 세트 before/after, 삭제할 네 세트·마지막 행의 viewport bounds, 취소 후 원문/revision 불변. 1920/1024 PNG 직접 시각 확인했다. 전체 source/packaged5개 그룹 이후의 변경은 검토 표시이며 관리/적용 backend는 같다. native6/check160/build/최종 pack:win도 통과했다. 아래 표시 검사 진행 중은 이 결과로 대체한다. 합성 입력만 사용했으며 portable·원본 GUI·실제 모델은 미수행이다.

- 최종 native **6개 그룹 통과**, 필터된 관리 목록의 실제 list 이동/원본 OnOrderChange 콜백을 포함한다. source `.local/loadout-management-native-1793637587048/result.json` 및 Windows packaged `.local/loadout-management-native-1793637875490/result.json` **각5개 그룹 통과**: rename/copy·duplicate 오류 후 원본 유지, Custom/New, 삭제/정렬·undo/redo·revision8 재계산, 문서 격리와 PoK 없는 재시작. 1920/1024를 직접 시각 확인했다.
- 후속 변경은 관리 검토의 구체적인 이전/새 세트 이름·복사/생성/위치 표시다. 표시 전용 source `.local/loadout-management-native-1793638186615/result.json` **2개 그룹 통과**(네 종류 rename 이름과 삭제 목록, 두 크기, 취소 시 원문/revision 불변). 최종 package 표시 검사 진행 중. source 초기 1024 삭제 캡처에는 목록 일부가 아래였으므로 후속 검사는 전체 제거 block과 마지막 행의 viewport bounds를 확인한다. 최종 check160/build·pack:win 통과. 전체 관리 동선5와 후속 표시2의 검사 범위를 구분한다.
- 원본 brace 입력의 readLoadouts 응답은 choices `Tree {groupA}`, `Tree {groupB}`와 관리 entries0이었다. `.local/standalone-pob/loadout-linked-management-inventory.json`. 이 폼은 original ListControl 기반이므로 해당 source 관리가 아직 노출되지 않는다. raw-name Build 서비스 자체는 있으므로 엔진 결함/계약 부재를 단정하거나 이 제약으로 목표를 축소하지 않는다. 후속 API 연결 대상으로 남긴다.

- 최초 native `tests/pob-loadout-management-smoke.cjs` **5개 그룹 통과**. 이름/중복 입력 검사는 원본 Popup, CRUD/Custom/Reorder는 원본 서비스/리스트 콜백을 실행했다. canonical 원본의 Future 세트 속성·자식/공유 아이템과 root unknown을 유지하고, 복사 Life170/Dex25·Custom Life334/Dex47·삭제/정렬 후 재열기/실계산을 확인했다. 실패 입력이 다음 XML을 바꾸지 않았다. 결과 `.local/standalone-pob/loadout-management-result.json`.
- 관리 응답의 sourceId/copyFrom은 native 객체 참조에서 기록하며 새 세트만 stock Save 노드를 전송한다. unit은 깊은 unknown 복제/재정렬·공유 item 보존, 잘못된 출처/중복 유지·fresh 태그 교체 거부를 검사했다. check **160 passed**, boundary/type 통과, build 통과. 기존 native Loadout 선택4개 그룹도 새 raw XML 로드 경로로 재통과했다.
- 초기 Lua 다중 local 선언의 구문 오류는 loadfile 검사에서 수정한 뒤 runtime을 준비했다. 원본/공유 엔진 소스는 수정하지 않았다. filtered list drag 분기와 실제 source/packaged 관리·두 해상도 검사는 진행 중이다. 개인 입력은 사용하지 않았다. 전체 PoB GUI/portable/실제 모델 완료를 뜻하지 않는다.

## 원본 Loadout 선택·동시 전환 — 2026-11-03 (15차 진행)

- 최종 source `.local/loadouts-native-1793635727983/result.json` 및 Windows packaged `.local/loadouts-native-1793636011892/result.json` **각4개 그룹 통과**. 원본 이름/brace 연결, scoped 취소/문서 격리·원문/unknown 보존, 네 세트·직업·활성 무기 동시 적용/실계산, undo/PoK 없는 재시작과 두 해상도를 확인했다. PNG 직접 시각 확인. `pack:win` 통과(고정 원본 출처/실계산/build 포함). 아래 진행 중 표기는 이 결과로 대체한다. native4/check158도 통과. 전체 Loadout 관리/PoB GUI/portable/실제 모델 완료로 처리하지 않는다.

- 최종 native `tests/pob-loadouts-smoke.cjs` **4개 그룹 통과**, `.local/standalone-pob/loadouts-result.json`: 원본 이름 매칭에 의한 네 세트/직업/무기 전환·실계산(Life229/Dex37→Life170/Dex25), 왕복 XML 완전 복원 및 projected spec ID 역매핑, brace/색상 이름과 원본의 불완전 그룹 제외, 잘못된 이름/scoped 취소 후 독립성. 수치 변화는 전체 구성 차이이며 개선/성립/추천 판정이 아니다.
- 최초 source `.local/loadouts-native-1793635283531/result.json` **4개 그룹 통과**: 취소·동일 XML 문서 간 초안 격리, 네 세트 검토/1회 적용·실계산·unknown 원문·undo, brace 연결의 같은 reference 수치, PoK 없는 재시작. 1920/1024 PNG 직접 시각 확인. 후속으로 무기 I→II 변경 표시와 reserved 메뉴/색상 이름 구분을 보강했다. 최종 source/Windows packaged 검증 진행 중이다.
- check **158 passed**, boundary/type 통과. build 통과. 기존 Vite native-config 경고와 500kB chunk 경고 존재. portable·원본 GUI·실제 모델 미수행. 원본 Loadout 관리 CRUD/Custom/Reorder는 미구현이다.
- data prepare ENOSPC 실패를 성공으로 세지 않는다. workspace 내부·생성물 whitelist·reparse 없음 확인 후 이번 작업의 초기 runtime/editor backup12개만 정리해 약3.7GB 확보, 최신/사용자 workspace 보존. 0바이트 검사 파일을 재작성했고 src/runtime/tests에 의도치 않은 0바이트 파일 없음 확인. 전체 data prepare와 native를 재실행해 통과했다. 개인 입력은 사용하지 않았다.

## 활성 트리 직업 동기화·비교 근거 — 2026-11-03 (14차 진행)

- 최종 Windows packaged `.local/tree-sets-native-1793634280885/result.json` **4개 그룹 통과**, `pack:win` 통과(고정 원본 출처·실계산·build 포함). 서로 다른 직업 세트의 switch/copy/delete·취소/문서 전환·undo, 양쪽 원본 identity/정확한 hash·비교 변경 표시, 같은 XML 최종 적용/새 계산, PoK 없는 재시작을 확인했다. 1920/1024 결과 캡처와 1024 취소/loading 화면을 직접 시각 확인했다. 기존 management-compare source `.local/management-compare-native-1793634196014/result.json` **4개 그룹 통과**. loading 수정 포함 최종 check156 통과. 아래 초기 ‘진행 중’은 이 최종 결과로 대체한다. portable·원본 GUI·실제 모델 미수행.

- native `tests/pob-tree-sets-smoke.cjs` **3개 그룹 통과** (`.local/standalone-pob/tree-sets-result.json`). 기존 단순 세트 변경의 stale Build.className을 재현했고 원본 native 조회로 Ranger identity·실제 Str7(원안 Warrior85)을 확인했다. cross-class 복사/활성 삭제·새 세트, inactive/unknown 보존·원본 불변, 비교의 정확한 XML/hash를 검사했다. private info를 잘못 호출한 최초 검사 코드는 getInfo로 수정했다.
- check **156 passed**, boundary/type 통과. 초기 unit 보존 assertion은 트리 DTO의 active 플래그까지 불변으로 비교해 실패했으며, 실제 세트 전환에 맞게 기대값만 수정했다. build 통과. 런타임은 13차와 동일하며 엔진/원본 PoB를 수정하지 않았다.
- 최초 Electron `.local/tree-sets-native-1793633729656`는 startup runtime 확인 전 제어가 활성화된 문제로 중단, 원본/revision 불변. 준비 gate를 추가했다. 재실행의 1024 캡처에서 기존 트리 리소스 로딩이 실패로 보이는 문제를 발견해 loading과 missing/error를 구분했다. source/packaged 최종 동선 검증은 진행 중이다. 개인 입력은 사용하지 않았다.
- source `.local/tree-sets-native-1793633936310/result.json` **4개 그룹 통과**: 취소/문서 전환의 결과 격리, switch의 Ranger identity·실제 Str7, 복사/활성 삭제의 identity/undo, 비교의 Warrior/Ranger identity·정확한 XML/hash·직업 변경 표시·동일 XML 최종 적용/새 계산·재시작. 취소 및 1920/1024 PNG 직접 시각 확인. 1024 비교 캡처는 상단 선택 UI였으므로 후속 검사에서 변경 결과로 스크롤해 캡처하도록 보강했다. loading 수정 포함 check156 통과. Windows packaged 및 기존 management-compare 회귀 진행 중.

## 원본 직업·전직 전환 — 2026-11-03 (13차 진행)

- 최종: `pack:win` 통과. Windows packaged `.local/character-native-1793632964017/result.json` **4개 그룹 통과**, 원본과 동일한 reset/connect·계산·취소/문서 격리·undo·재시작 및 1920/1024를 확인했고 PNG를 직접 시각 확인했다. 기존 native tree 회귀 **5개 그룹 통과** (`.local/standalone-pob/tree-result.json`, 새 runtimeId 포함). 아래 초기 ‘진행 중’은 이 결과로 대체한다. portable·원본 PoB GUI·실제 모델은 이번에 미수행이다.

- native `tests/pob-character-smoke.cjs` **4개 그룹 통과**, `.local/standalone-pob/character-result.json`. 원본 확인창 선택 전 diff 없음, reset 일반4→0, connect 기존 가지를 유지한 일반27과 Titan·실계산, 전직 시작점 교체/잘못된 class 격리, inactive/unknown XML 보존과 재열기를 확인했다. Life65→229/Dex15→37/Str7→85는 합성 구성의 측정값이며 포인트 예산 충족/추천 성공이라는 의미가 아니다.
- 최초 테스트는 빈 Lua table이 JSON `[]`였는데 `{}`로 단정한 assertion에서 중단됐다. 빈 key 검사로 수정한 뒤 전 동선을 수행했다. 제품 오류나 우회로 처리하지 않는다.
- check **153 passed**, boundary/type 통과. build 통과. source/packaged Electron 검사는 진행 중이다. portable·원본 GUI·실제 모델은 미수행. 사용자 개인 데이터는 사용하지 않았다.
- 최초 Electron `.local/character-native-1793632431541`는 classId/ascendancyId/classChoice가 main IPC의 명시 DTO에서 빠져 확인 선택이 나오지 않는 실패였다. main 전달 경로를 수정하고 renderer도 결정 대기가 아닌 응답의 직업/전직이 요청과 다르면 거부하도록 보강했다. 이 실패 실행은 source 성공으로 세지 않는다.
- 수정 source `.local/character-native-1793632697896/result.json` **4개 그룹 통과**: 확인 선택/취소와 문서 전환의 늦은 초안 격리, 원본 reset 적용·계산·정확한 undo, 원본 connect·전직과 native reference 수치 일치, PoK 없는 재시작의 XML/직업/전직/계산 revision 복원. 1920/1024 PNG 직접 시각 확인. 최종 IPC/선택 검증 수정 후 check153도 재통과했다.

## 기존 아이템 접사·modifier 범위 — 2026-11-03 (12차 진행)

- native `tests/pob-item-affixes-smoke.cjs` 3개 그룹 통과: 일반 range0→1/legacy ModRange 동기화·Dex20→30·재열기, 제작 접사 Life90→205·원본 tier 설명, 잘못된 선택 후 격리. `.local/standalone-pob/item-affixes-result.json`. 기존 native item-controls도 6개 그룹 재통과했다.
- 최초 Electron `.local/item-affixes-native-1793631187736`는 일반 범위/undo 이후 접사 선택 실패. 원본 series 키 길이가 host 100자 제한을 넘었다. 전송 한도를 16KiB로 수정하고 원본 컨트롤 검사는 유지했다.
- 수정 source `.local/item-affixes-native-1793631432357/result.json` 4개 그룹 통과. 원본 불변·unknown 보존/undo, 접사·최소/최대 tier 적용과 실제 계산, 저장/PoK 없는 재시작, 1920/1024를 확인했다. PNG 직접 시각 확인. 작은 화면의 slider 위치도 보장하도록 후속 검사에 scroll/bounds assertion 추가.
- 최종 check **152 passed**, boundary/type 통과. `pack:win` 통과(독립 출처·계산·build 포함). 실제 Windows packaged `.local/item-affixes-native-1793631690562/result.json` **4개 그룹 통과**, slider 화면 내 위치 검사·1920/1024 PNG 직접 시각 확인까지 완료했다. 원본 popup source 회귀 `.local/item-popups-native-1793631485982/result.json`도 **5개 그룹 통과**해 성유/오염/고유 roll의 검토·적용·실계산·재시작을 확인했다. portable·원본 GUI·실제 모델 미수행. 개인 입력은 사용하지 않았다.

## 활성 무기 세트·장비 내부 주얼 — 2026-11-02 (11차)

- 필수 check **151 passed**, boundary/type 통과. build 통과. 활성 무기 flag/주력 group patch의 unknown 슬롯/비활성 세트 보존을 unit에서 검증했다.
- native `tests/pob-equipment-smoke.cjs` **4개 그룹 통과** (`.local/standalone-pob/equipment-result.json`): Rusted Cuirass의 원본 내부 주얼 목록/장착 Dex15→25, 링 거부·해제15, 무기 II와 원본 연동 스킬 group2의 실제 DPS3.92/I의4.4583333333333, inactive set 불변, 부모 제거 후 가용하지 않은 내부 slot의 거부. 모든 후보/표시/연산은 원본 control을 사용했다.
- source `.local/equipment-native-1793629247916/result.json` 및 최초 packaged `.local/equipment-native-1793629520480/result.json` 각 5개 그룹 통과. 기존 item-controls source `.local/item-controls-native-1793629243651/result.json` 6개 그룹도 통과했다. 슬롯 준비 완료까지 기다려 캡처하도록 보강한 source `.local/equipment-native-1793629639489/result.json`도 동일 5개 그룹 통과, 1920/1024의 활성 버튼/주얼 제어를 직접 시각 확인했다. 최종 Windows packaged `.local/equipment-native-1793629675602/result.json`도 동일 **5개 그룹 통과**했고 `pack:win` 통과. 준비된 내부 주얼 제어/무기 버튼과 연동 계산, 부모 제거, 원본/비활성 세트 보존, 재시작을 확인했다. portable·실제 모델·원본 PoB GUI는 이번에 미수행이다. source 복원 ID 불일치를 진단하고, 실제 상태 차이만 canonical DOM에 반영한다. 이 검사는 모든 특수 장비/주얼/부수 변경·원본 GUI 동등성을 증명하지 않는다. 개인 입력은 사용하지 않았다.

## 원본 성유·오염 팝업·요청 취소 — 2026-11-02 (10차)

- 필수 check **150 passed**, boundary/type 통과, build 통과. native `tests/pob-item-popups-smoke.cjs` **6개 그룹 통과** (`.local/standalone-pob/item-popups-result.json`). 실제 NotableDB 875개, 원본 recipe/검색/재료 제한, Lasting Incantations의 원본 비교·추가/제거로 Fireball4.4583333333333→5.35→기준값, 성유를 유지하는 원본 오염 save, 실제 Astramentis(Current variant)의 slider Dex96→113, queued/live 요청 취소와 이후 원본 독립성을 포함한다.
- popup 후보·필터·source/group 제외·roll 수식은 원본 callback으로 처리한다. 원본 비교는 현재 입력의 what-if이며 최종 적용 revision의 새 계산과 구분한다. popup save가 canonical 문서를 직접 바꾸지 않는다. source `.local/item-popups-native-1793627806158/result.json` 및 실제 Windows packaged `.local/item-popups-native-1793628014476/result.json`에서 **각 5개 그룹 통과**. 대기 팝업 취소/재조회, 원본 검색·선택·초안 save/명시 적용/새 계산, 성유 유지 오염, 실제 고유 slider와 native reference 수치 일치, 저장/재시작·1920/1024를 검증했다. 두 크기의 성유/roll UI를 직접 시각 확인했고 `pack:win`도 통과했다. portable·실제 모델·원본 PoB GUI는 이번에 미수행이다.
- 기존 native item-controls 6개 그룹(품질/룬·문자열 보존·legacy range·슬롯 거부)을 재실행해 통과했다. source recipe와 고유 데이터는 고정 PoB에서 얻었으며 개인 XML/대화를 사용하지 않았다.
- 원본 CorruptDisplayItem 자체의 PoE1 legacy/TODO 및 모든 현재 게임 결과의 적법성/획득 검증은 미해결이다. 모든 특수 유형/stacked anoint/stat 정렬 성능과 원본 GUI parity를 이 대표 검사로 증명하지 않는다. 현재 progress는 요청 단계/취소 상태이며 원본 정렬 비율의 이벤트 전달은 아직 없다.

## 원본 아이템 옵션·원문 보존 — 2026-11-02 (9차)

- 필수 check **150 passed**, boundary/type 통과. build 통과. native 아이템 컨트롤의 원본 filter/limit/선택지와 callback을 사용한다.
- `tests/pob-item-controls-smoke.cjs` **6개 그룹 통과** (`.local/standalone-pob/item-controls-result.json`): 품질 Armour45→54, Lesser Adept Rune Dex15→21, 한국어 미지원 줄과 XML 자식 보존, 실패 입력/숨겨진 컨트롤 거부 후 원본 상태, 원문 손실의 지속 차단, legacy ModRange range0/Dex20 유지, 원본 슬롯의 Body Armour→Helmet 거부. 그룹 수는 기능 전체 완료 수가 아니다.
- 발견/수정: Item 생성자의 sanitiseText가 합성 한국어 줄을 `?`로 바꿨다. 원본 함수를 이용한 문자열 대응으로 원문을 보존하고 미해석/정규화 진단을 보였다. 정확한 대응이 없으면 적용을 차단하고 canonical 원문을 보존한다. 연속 편집이 차단 사유를 지우지 못하도록 canonical source와 draft를 모두 참조한다. 초기 룬 테스트가 변신 조건부 Armour를 선택해 수치가 늘지 않았던 것은 올바른 원본 동작이었다. 무조건 효과를 가정하지 않고 조건 없는 실제 Dex 선택지로 검증했다. 원본 룬 이름을 다시 찾으며 프로세스 간 index에만 의존하지 않는다.
- 원본이 복원한 legacy ModRange/variant 상태에서 detached Item을 시작한다. 저장 목록 장착도 별도 원본 슬롯 검사를 거치므로 이 경로가 render-item의 검사를 우회하지 않는다. 원문 직접 편집 전체/전수 legality 검증을 완료했다는 뜻은 아니다.
- 최초 source `.local/item-controls-native-1793622820267/result.json` 4개 그룹 통과 이후 슬롯/legacy 회귀를 추가했다. 최종 source `.local/item-controls-native-1793624679489/result.json` 및 실제 Windows packaged `.local/item-controls-native-1793625077148/result.json`에서 **각 6개 그룹 통과**. 저장 목록의 부적합 슬롯 거부, 미적용 초안의 문서 격리, 품질/소켓/룬 1회 적용·새 계산·진단 receipt, legacy range와 실제 Dex 유지, undo/재시작, 손실 시 편집·적용 차단을 검증했다. `pack:win` 통과. 1920/1024 화면을 직접 시각 확인했다. portable·실제 모델·원본 PoB GUI는 미수행이다. synthetic mixed-language 입력이며 실제 개인 XML·실물 한국어 아이템 전체 변환은 미검증이다.

## 트리 능력치 재선택·주얼·무기 표시 — 2026-11-02 (8차)

- 필수 check **150 passed**, boundary/type 통과. build 통과. 새 AttributeOverride 필수 3필드, 주얼 장착/해제의 소켓 unknown 보존, XML 무기 목록 표시 회귀를 포함한다.
- native `tests/pob-tree-advanced-smoke.cjs` **4개 그룹 통과**, `.local/standalone-pob/tree-advanced-result.json`: 잘못된 override의 계산을 실패로 거부; 실제 Dex95→90/Int7→12; 원본 슬롯 목록의 Emerald 허용/Ring 거부; 주얼 장착 Dex105·해제95; 메타데이터 보존·실패 격리. fixture는 이 검사에서 생성한 합성 XML이며 `.local`에만 저장한다.
- 발견/수정: 기존 부분 패치가 새 AttributeOverride에 dexNodes만 만들면 원본 loader의 strNodes:gmatch가 실패했다. stock Save의 완전한 필드 그룹을 반환하고 새 부분 컨테이너를 거부하도록 수정했다. 이전 7차의 선택 검사는 patch만 확인했고 재열기까지 증명하지 못했음을 이번 실제 검사로 보완했다. 원본 로드 오류를 ShowErrMsg에서 받아 실패로 반환해 빈 기본 빌드 fallback을 성공으로 표시하지 않는다.
- 공통 loader 변경 후 native runtime(5그룹), inspection(4), calcs(7), party(6)를 실제로 재실행해 통과했다. 최종 source `.local/tree-advanced-native-1793620081993/result.json` 및 Windows packaged `.local/tree-advanced-native-1793620084995/result.json`에서 **각 5개 그룹 통과**: 실제 능력치 변경/계산, 원본 주얼 목록과 장착/계산, 해제/계산·undo, 재시작/두 크기, malformed XML의 원본/revision 보존과 로드 오류/성공 receipt 부재. undo 입력은 revision 4로 복원되며 이전 revision 3 계산은 현재 입력으로 표시되지 않는다. 기존 path source `.local/tree-operations-native-1793619791726/result.json` 5개 그룹도 통과. `pack:win` 통과, 1920/1024와 무기별 색상/주얼 화면을 직접 시각 확인했다. portable·실제 모델·원본 GUI는 미수행이다. 지원 0_1~0_5는 원본 inventory에서 각각 동일 버전으로 열렸으며 mastery 노드는 모두 0개였다 (`.local/standalone-pob/mastery-inventory.json`). 데이터 비해당과 UI 구현 완료를 구분하고 pin 변경 시 재감사한다. 원본 GUI parity·모든 특수 주얼/버전 조합을 이 검사로 증명하지 않는다.

## 원본 트리 경로 연산 — 2026-11-02 (7차)

- 필수 check **147 passed**, boundary/type 통과, build 통과. native 필드 패치가 unknown spec/URL/Override metadata, 소켓 및 비활성 트리를 보존하는 회귀를 포함한다. 중복 조회 병합의 자기 참조 Promise 타입 오류는 명시적 타입을 추가한 뒤 재검사해 해소했다.
- `tests/pob-tree-smoke.cjs`: 원본 경로 4313→6789→35234→56651의 4개 할당과 XML 재열기, 56651 해제 시 종속 4개 제거, 무기 세트 1/2 count 저장/복원, 원본 Attribute 선택과 dexNodes override, 오류 후 새 요청 격리 **5개 그룹 통과**. `.local/standalone-pob/tree-result.json`. Fireball TotalDPS는 같은 원본 입력에서 4.4583333333333→6.01875로 증가함을 실제 계산으로 확인했다. 최초 Electron `.local/tree-operations-native-1793618175289`는 경로/능력치 미리보기/종속 해제/undo 3개 그룹까지 통과 후 잘못된 테스트 라벨 `트리 세트`에서 timeout이 났다. 실제 이름 `패시브 세트`로 고쳐 재실행한 source `.local/tree-operations-native-1793618365332/result.json`는 **5개 그룹 통과**. 경로 4개 강조/1회 적용·능력치 선택 요구와 미적용 보존·종속 해제/undo·활성 spec 무기2 저장/계산·재시작·1920/1024를 검증했다. 두 크기 PNG를 직접 시각 확인했다. 실제 Windows packaged `.local/tree-operations-native-1793618465601/result.json`도 동일 **5개 그룹 통과**, `npm run pack:win` 통과. native runtime/카탈로그 무결성 및 실제 계산 gate를 포함한다. portable·실제 모델·원본 GUI는 이번에 미수행이다.
- native는 시작 노드·선택되지 않은 능력치·미연결 경로·아직 연결하지 않은 mastery 선택을 구조화 진단으로 반환한다. renderer는 그래프 탐색/게임 적법성 판정을 구현하지 않는다.
- 모든 트리 버전/특수 노드·주얼·할당 모드/원본 GUI 동등성을 이 대표 검사로 증명하지 않는다. 개인 XML은 사용하지 않는다.

## 원본 파티 편집·지원 가져오기 — 2026-11-02 (6차)

- `npm run check`: **146 passed**, boundary/type 통과. build 통과. ImportedBuffs 중복/unknown 자식·ExportedBuffs·미지원 이름 보존과 exportParty 설정 회귀를 추가했다. native가 node[1]을 텍스트로 읽을 수 있도록 빈 버퍼의 unknown 자식 앞에는 빈 줄을 보존한다.
- `node tests/pob-party-smoke.cjs`: 실제 고정 원본 런타임에서 지원 출력, canonical Aura의 실제 Life 170(기본 65), 실패한 형식 줄 보존/진단, 대상별 원본 가져오기, 비우기/실패 후 독립성을 확인했다. `.local/standalone-pob/party-result.json`. native 추가 모드를 포함해 최종 **6개 그룹 통과**. source `.local/party-native-1793616670538/result.json`의 **4개 그룹**도 통과했으나, 캡처에서 undo 이후 이전 revision의 완료 안내가 남는 문제를 발견해 안내를 revision에 귀속시켰다. 수정된 최종 source `.local/party-native-1793616956108/result.json` 및 Windows packaged `.local/party-native-1793617167259/result.json`에서 revision 안내 확인을 포함한 **각 4개 그룹 통과**. 미리보기/취소의 두 원본 불변→대상별 가져오기/새 계산→비우기로 Life 65→undo/실패 줄 진단→복구 후 Life 170 및 revision 5 재계산→저장/재시작을 검증했다. `npm run pack:win` 통과. 1920/1024 캡처를 직접 시각 확인했다. portable·실제 모델·원본 PoB GUI는 미수행이다.
- 실패 시도: 합성 오라에서 필수 GlobalEffect 분류 태그가 빠져 Life가 65였고, 태그를 원본 형식으로 고쳐 170을 확인했다. 지원 출력 ComposeXML에 루트 대신 리스트를 전달해 거부됐던 어댑터 오류도 원본 호출 계약으로 수정했다. 이를 엔진 결함이나 성공으로 축약하지 않는다.
- 모든 파티 유형·링크·전투 상호작용 전수 검증, 일시적 disable/rebuild 상태, URL 직접 가져오기와 원본 GUI parity는 아직 완료가 아니다. 사용자 개인 빌드·대화는 사용하지 않았다.

## 원본 계산 상세·분해 — 2026-11-02 (5차)

- 필수 `npm run check`: **145 passed**, boundary/type 통과. `npm run build` 통과. 원본 Calcs XML의 unknown/Section/중복 입력과 typed 값·reset 보존 회귀를 포함한다.
- `node tests/pob-calcs-smoke.cjs`: 실제 원본 runtime에서 **7개 그룹 통과**. 22분류·진단 0, Life Total 65와 원본 TEXT 분해, UNBUFFED XML 변경, invalid cell 실패 후 다음 XML 결과 동일, Ice Nova Calcs stat set 2/일반 stat set 1 분리, Total Increased의 원본 TABLE 선언 열/Quest 출처, 없는 미니언 진단, 오래된 대기 조회 거부. `.local/standalone-pob/calcs.json`, `calcs-result.json`. `tests/pob-calcs-parity.lua`는 테스트 전용으로 원본 첫 프레임을 직접 읽으며 Life 분해가 어댑터 결과와 정확히 일치한다. 원본의 반복 분해 행을 UI에서 임의로 합치지 않는다. 첫 임시 parity 시도의 Lua init 모듈 경로 누락은 정식 테스트에 전체 경로를 적용해 해소했다.
- 이 조회는 별도 CALCS actor/모드의 결과이며 사이드바 MAIN 계산 receipt나 XML PlayerStat를 새 결과로 대체하지 않는다. 원본이 반환한 분해를 그대로 표시한다. 테스트 초기 `Total Life` 검색 실패는 원본의 실제 분류/행 이름 `Life`/`Total`로 바로잡았다.
- 실제 source `.local/calcs-native-1793615422929/result.json` 및 Windows packaged `.local/calcs-native-1793615700907/result.json` **각 4개 그룹 통과**: 원본 Life 분해 조회/XML 불변, 버프 모드와 Calcs 스킬 모드의 분리, 그룹 선택·modifier 표, 조회 중 닫은 모달의 늦은 재등장 차단, 저장/재시작, 두 해상도. 원본 originalXml 불변과 사이드바 계산 receipt 미생성을 확인했다. `npm run pack:win` 통과. 1920/1024 화면과 모달 PNG를 직접 시각 확인했다. portable·실제 모델·원본 GUI는 이번에 미수행이다. 반경 시각화는 수치만 표시하고 미구현임을 UI에서 밝힌다. 미니언 종류/전용 스킬 편집·원본 GUI parity·모든 지원 빌드 전수 검증은 이번 smoke로 입증하지 않는다.

## 빌드 관리·redo·수동 비교 — 2026-11-02 (4차)

- 필수 `npm run check`: **144 passed**, boundary/type 통과. `npm run build` 통과. 최근 기록의 선택적 상태 타입 오류를 수정한 후 최종 실행했다. 기존 Vite native config loader 예고 경고는 남는다.
- 단위 검사는 redo/branch 편집과 오래된 XML/revision 거부, 복사 독립성, 보관함의 파일 저장/로드와 대화 재연결 보존, 중첩 폴더 정리, 부분 측정/0/미측정, 같은 XML 내 활성 조건 세트의 차이 설명을 포함한다.
- 실제 Electron `.local/management-compare-native-1793614227591/result.json`: 복사·폴더·삭제/복원, redo의 정확한 XML과 새 revision, 두 독립 원본 계산(Life 65/683), 장비 세트 적용 후 revision 4 재계산, 원본 originalXml 불변·오래된 비교 재적용 차단, 재시작 기록 복원·1920/1024 **4개 그룹 통과**. 합성 데이터만 사용했다. 초기 실패 `.local/management-compare-native-1793614044510`는 테스트 초기 활성 세트 기대값 오류로 구분한다.
- 최종 source `.local/management-compare-native-1793614452117/result.json`, 실제 Windows packaged `.local/management-compare-native-1793614603293/result.json`도 동일 **4개 그룹 통과**. 최근 비교 자동 선택·저장 XML/세트 유효성·늦은 결과 안내를 포함한다. `npm run pack:win`은 출처/파일/실제 계산 검증부터 패키징까지 통과했다. 패키지 resources는 app.asar/pob-runtime/pob-editor이며 PoK/KB/legacy bundle을 포함하지 않는다. 1920/1024 PNG를 직접 시각 확인했다. 이 검사는 전체 PoB 비교 기능·부분 선택 병합·모든 고급 연산 동등성을 증명하지 않는다. portable·실제 모델·원본 PoB GUI는 이번 검사에 포함하지 않는다.

## 세트·원본 조건/스킬 선택·노트 — 2026-11-02 (3차)

- `npm run check`: **139 passed**, 경계/타입 통과. build 통과. 세트 복사·삭제의 XML/unknown/inactive 보존, legacy wrapper 변환, 위치 기반 트리 선택 이동, 노트/모드/Calcs 필드 보존 회귀 추가.
- 실제 `inspectBuild`: 7분류/651 조건 정의를 원본 컨트롤에서 읽고 `IsShown`/Show-All·default·typed list·tooltip을 평가했다. explicit false를 누락시키지 않고 0과 미설정을 구분한다. Ice Nova의 `Ice Nova`/`Cold-Infused` 원본 목록과 mode 2가 XML child 변경 후 실제 선택됨을 확인. 합성 조회 진단 0. `.local/standalone-pob/inspection-result.json`.
- native `.local/sets-config-native-1793611403943/result.json`: 카탈로그 젬/원본 모드→조건 0/false/미설정→skill set copy/rename/delete→item/tree/config copy/delete→노트 한글/색상 코드/특수 문자·undo→저장·재시작→두 크기 및 노트 문서 전환 7개 그룹 통과. cfg 준비 완료된 1024 화면도 시각 확인.
- 최종 확대 native `.local/sets-config-native-1793612173827/result.json`: 위 동선 및 item/group/character/tree/note 임시 입력의 문서 격리를 포함한 **8개 그룹 통과**. 동일 XML 문서 두 개를 전환해도 미적용 값이 넘어가지 않음을 확인했다. 초기 직업 locator의 exact-label timeout은 명시적 접근성 이름을 추가한 뒤 재실행해 해소했다. 실패 기록은 `.local/sets-config-native-1793611813253`에 구분해 남겼다.
- 부분 조회·미지원 부여 효과는 진단으로 표시하고 완성 기능으로 취급하지 않는다. 단계형·미니언·Calcs 전용 UI 전체 동등성과 원본 GUI 왕복은 미검증이다.
- 최신 슬롯 문맥을 포함한 packaged 앱 기본 편집/계산/트리/재시작은 `.local/editor-native-1793607174373/result.json`에서 8개 그룹 통과했다. 3차 새 화면 전체를 그 이전 packaged 검사로 갈음하지 않는다.

이하 1차/10월 기록은 당시 범위의 증거이며 현재 전 기능 완료를 뜻하지 않는다. 전체 목표는 active다.

## 독립 PoB 계산 — 2026-11-02

기준 원본: PoB `5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`, manifest `0.23.1`. `pob:prepare`가 원본 release inventory와 HeadlessWrapper/LuaJIT/라이선스/어댑터 1,699파일을 복사·검증했다. runtimeId는 `pob-ed6e05555b1b7435d4a5ca409d9c115054adb1c52982425812935c7304cc8862`. 생성물은 Git 제외다. PoK 소스·Python·KB·MCP를 실행하지 않는다.

- `npm run check`: **131 passed**, 경계·타입 통과. `npm run build` 통과(기존 Vite 차기 config loader 경고 유지).
- 실제 LuaJIT/원본 HeadlessWrapper: 합성 Ranger Life **65→683**(레벨 1→50), Fireball `TotalDPS=4.4583333333333`. 저장 PlayerStat 없는 XML에서 신규 계산했다. 원본/revision/hash/runtime 귀속, 잘못된 요청 후 시험용 젬·조건의 비잔류, 대기 중 취소 결과 비게시 검사 통과. `.local/standalone-pob/runtime-result.json` (2026-11-02 07:17 UTC).
- 실제 Electron 44.5.1: 별도 리소스 폴더에 독립 PoB 런타임만 노출하고 **PoK·Python·KB·기존 catalog/tree bundle은 설치하지 않은 설정**으로 실행했다. 자동 PoK 연결 없음→레벨 편집→실제 계산 Life 683→저장→프로세스 재시작→동일 originalXml/revision/계산 복원 성공.
- 선택 PoK 연결은 해당 격리 환경에서 실패했으나 독립 계산 provenance/freshness가 유지됐다. 정상 PoK 연결/서로 다른 실제 PoB 버전의 통합 검증은 미수행이다.
- 1920×1080/1024×768의 장비·설정·pok 설정을 캡처하고 가로 문서 넘침 없음을 검사했다. 1024 설정 화면에서 독립 runtime 버전/연결 선택 표시를 직접 시각 확인했다. 최종 native 증거 `.local/standalone-native-1793603867310/result.json`과 6개 PNG.
- 준비 첫 시도에서 `src/Export/Bases/Rares.txt` 복사본의 Node read가 EBADF였다. 실행 파일을 고르는 기준을 원본 release manifest로 명확히 하고 개발용 export template을 제외했다. 포함 파일 해시는 생략하지 않았다. 제품에 DRM 우회·가짜 UTF-8 모듈·별도 게임 계산 규칙을 넣지 않았다.

**전체 목표 미완료:** 독립 catalog/tree/새 빌드/아이템 생성, 원본 모든 탭의 UI/연산 동등성, 원본 PoB GUI 재편집, full portable는 아직 구현·검증해야 한다. 위 합성 계산과 일부 native 동선으로 전체 빌드·플랫폼·PoB 기능 동등성을 주장하지 않는다. 다음 단계는 `POB-STANDALONE-PLAN.md`의 기능 대응표/결합 지점 목록을 따른다.

## pok-ui 정상화 — 2026-10-30

전체 정상화 **미완료**. 아래 결과는 이번 실행 결과이며 과거 검증을 최신 성공으로 승계하지 않는다. 엔진 요청과 계약 재현은 [NORMALIZATION-ENGINE-REQUESTS.md](NORMALIZATION-ENGINE-REQUESTS.md)에 분리했다.

| 검증 | 이번 결과 |
|---|---|
| 경계·TypeScript·단위 | `npm run check`: **128 passed**, 0 failed, 0 skipped |
| 프로덕션 코드 | `npm run build` 통과. 기존 Vite 차기 native config loader 경고는 남음 |
| 실제 최신 MCP | 고정 `e7bd429…`의 initialize·tools/list 성공, 50개 실제 schema 확보. 숫자를 계약으로 고정하지 않음 |
| server_info | `{}`를 실제 호출. 15초/독립 120초 timeout 관측. 실제 loaded/source 정보 반환 성공으로 기록하지 않음 |
| 원문 복원 | 합성 XML, `assume_first_stat_set:false`, 30초 timeout 관측. 미지원 빌드 전체의 판정으로 확대하지 않음 |
| 기존 API 합성 계산 | 같은 PoB pin을 격리 데이터 위치에 준비한 뒤 `compute_pob`의 Sorceress level 1/Life 요청도 30초 timeout. 제한 시간 내 성공 미확인이며 모든 계산 거부의 증명은 아님 |
| 추천 준비도 | 실제 `assemble_pob`, `purpose:'recommendation'`: `ok:false`, `optimization_readiness.status:'not_ready'`, `contract_missing`와 미해결 근거 반환. 산출물/완성 추천 성공 아님 |
| 최신 desktop exporter | 고정 엔진에서 `python -m pok.desktop identity`: `No module named pok.desktop` |
| Windows 패키지 준비 | `npm run dist:win` 실행, 첫 runtime 검증에서 `resources/pok-runtime/resources/runtime-manifest.json` 없음으로 중단. 최신 portable 생성·실행 미수행 |
| 실제 Electron | **44.5.1**, 격리된 합성 workspace. 자동 시작→실제 tools 조회→누락 도구의 `incompatible` 진단 확인 |
| 편집·보존·재시작 | 오프라인 레벨 편집→revision 1 저장→프로세스 재시작→동일 XML/originalXml/revision 복원→undo 원문 일치/revision 2. 알 수 없는 XML 보존, 새 계산값 없음 확인 |
| 화면 | 장비·스킬·설정·pok 설정을 **1920×1080 / 1024×768**에서 실행·캡처. 가로 문서 넘침 없음. 1920 장비/1024 설정 PNG 직접 시각 확인 |
| 실제 모델·대표 빌드 전체 동선 | **미수행/차단**. 최신 desktop identity·XML 계산·catalog/runtime 계약 부재 때문에 정상 연결→AI 수정→새 계산 성공을 확인할 수 없음 |
| 내보내기→실제 PoB GUI 편집 | **미수행** |
| 한국어 실물 입력 | **미수행**. 원문 보존과 한국어 문구의 계산 반영은 별개; UI 번역·게임 규칙을 추가하지 않음 |

합성 native 검사: `tests/normalization-desktop-smoke.cjs`, 최종 증거 `.local/normalization/desktop-1793345227152/result.json` 및 8개 PNG. 화면 표시에는 기존 개발 카탈로그 bundle `pokbundle-56f0f978ff358fa58a2d8465a44e42b3`를 사용했으며, 이를 최신 엔진 호환·새 계산·배포 검증으로 취급하지 않는다. 실제 엔진 연결은 처음 고정한 격리 clone만 사용했다.

API 감사: `tests/engine-contract-smoke.cjs`, `.local/normalization/contract.json`. 최초 합성 compute 입력의 `class`는 하네스 키 오류여서 `class_name`으로 정정했다. 이후 드러난 격리 PoB 데이터 미준비 오류도 엔진 결함으로 분류하지 않았다. 동일 pin의 로컬 Git 객체를 archive하여 격리 clone의 기존 `external/pob/<pin>` 위치에 준비했다. 별도 PoB 실행/계산 API를 UI에 만들지 않았다. 상세 후속 API 결과는 현재 작업 기록에 남긴다.

검증 중 하네스/환경 문제: sandbox가 테스트·esbuild spawn을 EPERM으로 차단해 허용된 실행에서 재검사했다. Electron package 경로 메타파일 읽기는 EBADF여서 기존 설치된 `electron/dist/electron.exe`를 명시했다. 보호 해제나 제품 integrity 우회는 하지 않았다. 설치된 Playwright의 async waitForFunction 관측 문제로 연결 시작 전 결과를 읽던 하네스는 Node 측 RPC polling으로 수정했다. 실패 시도도 `.local/normalization/desktop-*`에 남아 있으며 최종 통과 결과와 구분한다.

회귀 범위: live 목록 pagination/원자 교체/재연결 경합, 현재 server_info schema, 구조화된 오류 내용, 모드 가정 제거·복원 결정 차단, 모호한 활성 세트 거부, 실패/취소된 config·시험용 gem 제안의 원본 불변, 완료 전 적용 차단, 복합 구성 변경 검토, revision/hash/bundle 검사. PoB 내부 what-if 상태의 롤백은 엔진 측 검증이며 이 UI 단위 검사로 대신 주장하지 않는다.

공유 엔진은 읽기 전용으로 상태만 관측했다. 작업 중 다른 세션이 브랜치/파일을 변경한 상태를 확인했으나 갱신·리셋·수정하지 않았다. 고정 기준은 계속 `e7bd429…`이다. 사용자 개인 XML·대화·세션은 검사 입력/fixture/배포물에 넣지 않았다. #188 해결 또는 품질 개선 검증을 선언하지 않는다.

## 이전 검증 — 2026-10-08

## 자동 실행·연결 — 최소 검증

- 개발/배포 엔진 선택 회귀 2개 통과. 저장된 checkout 설정이 있어도 packaged 모드는 bundled로 고정하며 개발 모드는 설정을 보존한다.
- `npm run build`의 타입 검사와 빌드 통과. 전체 suite는 재실행하지 않았다.
- 실제 Electron에서 connect IPC/수동 버튼을 호출하지 않고 자동 연결을 확인했다. 연결 중 renderer를 재로드해도 동일 엔진 PID를 유지했다. 50개 도구 확인.
- 증거: `.local/auto-start-1791457633377/result.json`, 설정 화면 1920×1080/1024×768 PNG. 가로 넘침 없음.
- 실제 packaged 실행은 이 PC의 검증 범위에 포함하지 않는다.


## 연결·베이스 생성 수정 — 최소 회귀 검증

- UI: main-mcp의 연결 deadline/준비 상태/timeout 안내/요청 직렬화 4개 통과. POK: KB를 로드하지 않는 server_info, source/KB 캐시 무효화, 중첩 checkout 제외 3개 통과. 전체 테스트는 실행하지 않았다.
- 타입 검사와 코드 빌드 통과, 변경 Python 파일 Ruff 통과.
- 실제 MCP: `.local/connection-item-fixed.log` — 연결 18,642ms, Iron Ring 렌더 2,411ms.
- 실제 UI: 연결 20,562ms 후 베이스 생성 버튼으로 Iron Ring 생성·Ring 1 장착·revision 1 저장 확인. `.local/connection-ui-1791455895314/saved-equipment-result.json`. 테스트 하네스의 슬롯명 Ring1을 실제 PoB 이름 Ring 1로 정정하고, 저장 XML을 검증했다. 앱 검사를 불필요하게 재실행하지 않았다.
- 새 로컬 bundle: `pokbundle-24ccf3ba725a3071795a094b26116faf`. 카탈로그 13,945개/파일 590개. 기존 트리 자원은 SHA-256 확인 후 변환기의 원본 입력 검사를 거쳐 재사용했다.
- 최초 연결 시간은 이 PC 측정치이며, 더 느린 환경에서는 명시적인 timeout 오류를 표시한다. 전체 계산·실제 모델 추론·다른 PC 배포는 이번 좁은 검증 범위 밖이다.


## 거래 스킬 포함·로컬 테스트 실행파일 (후속 검증)

- UI `npm run check`: 89 passed. `npm run build`: 통과.
- POK 변경 관련 단위: 71 passed, 최신 Git 상태 공백 보존 회귀 1개 재확인. Ruff 및 변경 identity/MCP 파일 mypy 통과.
- 실제 Codex `skills/list`: staged `trade-search`가 해당 경로에서 발견되고 enabled=true.
- staged 스킬 실행기의 `prepare`: prepared 반환. 네트워크 검색·실제 매물·모델 추론 성공을 의미하지 않는다.
- 개발 bundle: `pokbundle-4f60c4b1ab8a34742eb78dec1cae3be7`, PoB pin 유지, 카탈로그 13,945개·직업 8개·파일 590개.
- `release/local-test/POK-Local-Test.exe --check` 통과. 해당 exe를 실제 실행해 앱 창과 ready checkout bundle을 확인했다. 증거: `.local/local-exe-smoke-result.json`, `.local/local-exe-smoke.png`.
- 런처는 이 체크아웃·설치된 Electron·설정한 POK/Python에 의존한다. 정식 portable 릴리즈가 아니다. 다른 PC에서 production bundle/lock과 패키지를 별도 검증한다.
- 일반 코드·JSON·Lua의 읽기 오류를 암호화로 확정하지 않는다. 문서형 파일 암호화는 사용자 설명대로 별도로 취급하며, DRM 해제 로직·검증 생략을 제품에 넣지 않았다.
- 커밋·스테이징·푸시 없음. 생성 실행파일·생성 C#의 개인 경로·로컬 테스트 데이터는 Git에서 제외된다.

## POK 고정 PoB 데이터·편집 통합

PoB 기준은 `5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`이다. upstream 최신 버전을 선택하지 않았고 KB를 재수집하지 않았다. POK source identity와 KB digest를 동일 묶음에 귀속했다.

| 대상 | 결과 |
|---|---|
| UI 경계/TypeScript/단위 | 87 passed; 경계 검사/TypeScript 통과 |
| POK 전체 단위 | 1,321 passed, 2 skipped |
| POK 새 XML/아이템 단위 | 최종 10 passed |
| 실제 PoB XML/아이템 통합 | 4 passed: 직접 XML parity, base 장착, unique 변형 장착, rare roll 효과 |
| POK 정적 검사 | Ruff, mypy 155 source files, import-linter 1 contract 통과 |
| 원본 export | base 1,768 / unique 435 / mod 9,340 / gem 966 / skill 1,436 = 13,945; 직업 8개 |
| 트리 파생물 | 0_1~0_5 생성, missingArtwork 0; 원본 tree hash와 변환 파일 hash 구분 |
| 개발 checkout bundle | 590개 파일 해시 검증; 소스 앱 opt-in 허용, production 거부 |
| 프로덕션 코드 빌드 | npm run build 통과 |
| 번들 실패 복구 | 최초 이동 실패·staging 누락·접근 거부·후속 설치 실패 시 원본 보존, 복구 실패 시 백업 보존·오류 보고 |
| Electron 44.5.1 오프라인 smoke | 실제 카탈로그·새 빌드·트리 이미지·두 해상도 화면 통과; 번들 590개 파일 및 디렉터리 내용 불변 |
| MCP identity 분리 진단 | 콜드 KB load 32.248초, 직접 server_info 9.159초, in-process MCP server_info 5.582초, 도구 50개; 모두 성공 |
| Electron→MCP 계산 smoke | 연결 단계 90초 제한 실패; 독립 stdio 요청도 120초 timeout 재현 |
| stdio 지연 위치 | faulthandler: server_info → _git_head → subprocess.run timeout 후 Windows communicate 출력 reader thread join에서 대기. 임시 stdin/콘솔 격리 진단은 45초 시점 같은 대기 stack 이후 정상 identity를 반환(exit 0); 안정적 해소·네이티브 적용은 미검증 |
| production bundle/lock 및 Windows 패키지 | 문서보호 파일 읽기 실패로 미완료 |
| 실제 AI 모델 추론 | 미실행; 제안 등록·stale 거부·일괄 적용은 단위/어댑터 검사 |

Portable runtime은 생성했으나 UI 준비 단계에서 Node가 12,015개 중 323개 파일을 읽지 못한다(EBADF; txt, zip, 일부 C 헤더 등). 사용자가 문서보호 적용을 확인했다. 제공된 drm-reader로 원본과 runtime 복사본의 공개 PoB help.txt를 `--export-plain` 처리했으나 `detected=Unknown`으로 거부됐다. 강제 옵션·해시 생략·보호 도구의 제품 포함은 하지 않았다. 따라서 개발 번들 성공을 소스 없는 배포 성공으로 취급하지 않는다.

네이티브 오프라인 결과는 `.local/catalog-qa-1791448070510/result.json`과 같은 폴더의 8개 화면 PNG에 기록했다. `$visual-verdict` 92/pass, 가로 넘침 없음. 엔진 검사를 생략한 실행이며 연결·계산 성공을 의미하지 않는다. 저장소의 Electron 실행 파일이 준비되지 않아 이미 설치된 동일 버전 44.5.1의 실행 파일 경로를 테스트 환경변수로 지정했다.

이번 테스트는 합성 XML과 별도 사용자 데이터 디렉터리만 사용한다. 실제 사용자 빌드·대화·세션을 fixture나 배포물에 넣지 않는다. 현재 연결 차단은 이 Windows stdio 실행 경로에서 재현한 상태다. KB 최초 로드 지연과 구분했고, 원인 미확정 상태에서 버전 검증 생략이나 타임아웃 확대를 제품에 적용하지 않았다. 단위·in-process MCP 성공을 네이티브 stdio 성공으로 대체하지 않는다.

계산은 PoB 모델의 결과이며 인게임 실현 가능성 검증과 미실행 진단을 유지한다.

이하 기록은 이전 릴리스 당시 결과이며 이번 변경의 패키지 검증을 대신하지 않는다.

## 이전 릴리스 검증 — 2026-10-05

## v0.1.1 패시브 트리

앱 검사 52개와 실제 Electron 화면 8개, Windows 패키지 화면 8개를 통과했다. 0_5의 4,914노드·5,149표시 연결, 사용자 빌드의 132할당 노드·121할당 연결과 모든 화면 이미지가 일치한다. 패키지에서 첫 지도 이미지 준비 2.12초, 재진입 133ms를 측정했다. MCP 노드 조회는 0회다.

원인, 소스 기준, 변환·배포 경로와 자세한 수치는 [패시브 트리 검증](PASSIVE-TREE.md)에 기록했다. 현재 변경은 화면·정적 데이터 로딩이며 게임 계산 엔진은 변경하지 않았다.

## v0.1.0

| 대상 | 결과 |
|---|---|
| 계층 의존 경계 | 통과 |
| TypeScript strict 검사 | 통과 |
| UI 문서·저장·MCP·에이전트 단위 | 36 통과 |
| 엔진 전체 단위 | 1,276 통과, 35 skip |
| 엔진 Ruff / mypy / import-linter / workflow guard | 통과 |
| Vite + main/preload production 빌드 | 통과 |
| Windows portable 포장 | POK-0.1.0-win-x64.exe 생성 성공, 475,123,529 bytes |
| 실제 XML 브라우저 UI 조작 | 가져오기, 아이템 생성/교체/편집/undo, 세트 전환, 대화 관리/메시지 편집, 재시작 저장 통과 |
| 1920×1080 / 1024×768 | 장비 2열과 능력치 5그룹 표시, 가로 넘침 없음 |
| Electron production 및 패키지 실행 | 네이티브 파일 대화상자→IPC→preload→UI, 편집/undo, 디스크 저장·프로세스 재시작 통과 |
| Electron 격리 | renderer의 require/process/Buffer 미노출, sandbox/contextIsolation 활성화 |
| 번들 MCP | 소스 밖에서 48개 도구·KB 검색·PoB 계산 통과 |
| UI 실제 계산 어댑터 | 빈 레벨 1 Sorceress 스탯 619개; 요청은 stats=["*"] |
| 실제 사용자 XML 계산 거부 | stage=compute, 복원 안내 7개와 엔진 진단 보존 |
| 원본 보호 | 사용자 XML SHA-256 전후 동일 |
| 엔진 리소스 불변 | 실행 전후 3,203 파일 SHA-256 변경/추가 없음 |
| 설치된 Codex 프로토콜 | initialize→initialized→model/list 성공; 실제 모델 추론은 요청하지 않음 |

실제 XML은 저장소에 넣지 않고 환경변수로 지정한다. 아래 smoke는 장착된 주 무기가 있는 외부 PoB XML을 읽기만 한다. 생성 데이터와 화면 캡처는 `.local/`에 남긴다.

```powershell
$env:POK_SMOKE_XML = '<검증할 XML 절대 경로>'
# 별도 터미널에서 npm run dev:web
node tests/renderer-smoke.cjs

npm run build
node tests/desktop-smoke.cjs

$env:POK_SMOKE_EXECUTABLE = '<release/win-unpacked/POK.exe 절대 경로>'
node tests/desktop-smoke.cjs
```

브라우저 smoke는 설치된 Microsoft Edge를 사용한다. desktop smoke는 별도 `.local/desktop-qa` 데이터 폴더를 사용하므로 일반 작업 공간을 덮어쓰지 않는다.

전체 엔진 통합 테스트와 PR은 아직 수행하지 않았다. Windows portable은 로컬 검토용이며 macOS 패키지·코드 서명·업데이트 배포는 검증 범위 밖이다. 검증용 사용자 XML의 새 DPS를 계산 완료로 취급하면 안 된다. 원본 XML 저장값 표시는 검증했지만 복원 과정의 교체 무기·단계형/부여 스킬 제한이 남아 있다.

## 채팅 제어·연결 표시 검증 — 2026-10-08

요청에 따라 전체 suite 대신 변경 영역만 검사했다.

- AgentManager 회귀 25개 통과: 실제 모델 목록 매핑, 이미지 입력, 질문 RPC/비동기 후속 턴, 취소/중지 실패 재시도, 도구 전달 및 상태 이벤트.
- 이미지 저장 검증 2개와 MCP 종료·시간 초과·연결 확인 병합 회귀 4개 통과.
- POK fast server_info 1개, KB Git stdio 회귀 2개 통과. 실제 cold search_kb는 53,218ms에 1개 결과로 완료했다. 첫 조회 준비 지연은 남는다.
- 설치된 실제 Codex로 model/list(4개 모델) 및 thread/start 성공. 실제 모델 추론 턴은 실행하지 않았다.
- 합성 app-server + 실제 Electron/POK 연결로 모델/추론 강도 전달, 합성 PNG 붙여넣기·표시·저장, blocking/async 질문 왕복, 중지 후 늦은 delta 무시, 완료 시각, 소유한 POK 프로세스 종료 시 즉시 연결 해제 표시를 확인했다. 실제 사용자 대화는 fixture로 사용하지 않았다.
- 1920×1080 및 1024×768 질문 카드 표시/전송 접근성·가로 넘침 없음, native overlay 및 기본 메뉴 숨김 확인.
- 경계 정적 검사·TypeScript 검사·프로덕션 빌드·양쪽 저장소 diff 공백 검사 통과. 별도 lint 명령은 없다. Vite의 차기 native config loader 관련 경고는 남지만 현재 빌드는 성공한다.
- 로컬 런처 --check 통과. 기존 release/local-test/POK-Local-Test.exe가 갱신된 dist를 읽는다. 정식 패키징 검증은 다른 PC에서 수행한다.

이번 변경의 로컬 진단은 .local 아래에 보관하며 Git에 포함하지 않는다. 이전 메시지는 완료 시각이 없어 과거 시간을 복원하지 않는다.

최종 재검증: 완료 IPC를 2초 지연시켜 질문 답변이 먼저 도착하는 상황에서도 후속 턴이 보존되는 실제 Electron 회귀 시나리오 통과. 같은 실행에서 이미지·blocking 질문·중지·실제 POK 연결 상태도 통과했다.
