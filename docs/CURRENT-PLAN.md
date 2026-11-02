# 현재 작업

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
