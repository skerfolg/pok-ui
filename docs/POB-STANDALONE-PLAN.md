# 독립 PoB 작업 공간 — 설계 및 기능 대응표

2026-11-02 재개. 전체 목표는 PoK 미설치·미연결에서 원본 PoB의 모든 사용자 작업을 수행하고, 이후 선택 PoK 연결 시 양쪽 PoB 출처를 확인하는 것이다. 이 표는 완료 범위를 축소하지 않는다.

## 실행 경계

원본 PoB의 MIT 코드/데이터를 별도 PoB 런타임으로 공급한다. `runtime/pob`는 원본 HeadlessWrapper와 편집 API에 요청을 전달하는 어댑터 계층이며 게임 계산 규칙을 구현하지 않는다. main은 프로세스·파일·요청 수명·입력 revision·출처 검증을 담당한다. renderer에는 계산기/Lua/Node를 넣지 않는다. PoK 서버·Python·KB·로그인은 기본 편집기의 의존성이 아니다. 이 설계로 기존 PoK 전용 실행 경로를 점진적으로 대체한다. 형제 엔진 저장소는 수정하지 않는다.

현재 고정 원본 `5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`(manifest 0.23.1)을 첫 재현 기준으로 사용한다. 최신판을 자동 추종하지 않는다. PoB 코드·데이터·LuaJIT·어댑터의 출처/해시는 PoK identity와 별도로 검증한다. 선택 PoK 연결의 호환성은 그 이후에 별도 상태로 표시한다.

XML은 편집 정본이다. 계산은 제출 시점 XML을 격리된 원본 PoB에 로드한다. what-if/실패/취소가 사용자 원본이나 다른 계산의 상태를 바꾸지 않도록 요청 단위 로드와 직렬화·종료를 보장한다. 원본 저장 PlayerStat를 결과로 사용하지 않는다. 원본 PoB의 저장 동작은 어댑터에서 차단하고 host의 명시적 내보내기만 파일을 쓴다.

## 기능 대응표 (원본 Classes/*Tab.lua 기준, 조사/구현 지속)

15차(2026-11-03): 원본 Loadout 목록/이름·brace 연결/네 세트 동시 선택을 native 어댑터로 연결했다. ‘통합 구성’에서 변경 검토→원자 적용→새 계산, scoped 취소/문서 격리/undo/재시작을 검사했다. native4/최종 source4/Windows packaged4개 그룹 및 check158/build/pack:win 통과. 생성/복사/Custom/이름/삭제/순서 변경 관리 기능은 아직 남는다. 원본 매칭 규칙을 UI에 복제하지 않았다.

14차(2026-11-03): 활성 tree 세트 전환·생성/복사/삭제는 기존 native tree API로 직업 정보를 확인해 canonical Build 정보와 함께 적용한다. 비교도 원본이 확인한 treeIdentity와 정확한 XML/hash를 자동 기록하고 최종 적용 전 재확인한다. native3/source4/Windows packaged4개 그룹, 기존 management-compare4개 그룹과 check156/build/pack:win 통과. 아래의 활성 spec 동기화 감사 범위 중 대표 cross-class 전환은 이 검사로 보완했으며 모든 버전/조합 전수 완료는 아니다. 원본 Build의 통합 Loadout 동시 선택/관리도 개별 세트 UI와 별도로 남는다.

13차(2026-11-03): 직업/전직 폼을 원본 classDrop/ascendDrop로 전환하고 reset/connect 선택·변경 노드 검토·revision 적용/새 계산을 연결했다. native 4개 그룹, source/Windows packaged 각4개 그룹, 기존 native tree5개 그룹과 check153/build/pack:win 통과. 전체 전직·트리 없는 문서 생성·버전 변환·특수 주얼·원본 GUI 동등성은 여전히 남는다.

12차(2026-11-03) 추가: 기존 아이템의 원본 일반 modifier range 및 제작 affix/tier/roll을 연결했다. 원본 Save의 variant/ModRange를 XML과 동기화하며 unknown metadata를 보존한다. native 3개 그룹·source/Windows packaged 각 4개 그룹 통과, check152/build/pack:win 통과. 자세한 증거와 최초 IPC 길이 제한 실패는 CURRENT-PLAN/VALIDATION의 12차 기록을 따른다. 아래 ItemsTab의 ‘affix/일반 범위 전체’는 이 대표 구현 이후에도 남은 특수 유형·전수 검증을 뜻한다.

| 원본 영역 | 현재 React 작업 공간 | 남은 전체 동등성 범위 |
|---|---|---|
| ImportTab / 빌드 관리 | 독립 새 빌드·직업 metadata, XML/공유코드/JSON 가져오기·내보내기, revision/undo/redo·저장/재시작, 검색·복사·이름/가상 폴더·삭제 보관함/복원 | 계정/캐릭터 가져오기, 원본 파일 기반 빌드 관리와 GUI 형식 왕복 검증 |
| ItemsTab | 독립 base/unique/mod 카탈로그; 슬롯·원문·생성/장착/해제; rare affix/roll·quality·unique variant UI/원본 API; 세트 CRUD; 원본 단순 옵션 metadata/콜백·품질/소켓/룬 검토→적용→계산; 성유/원본 오염 팝업·고유 roll; 저장 목록 원본 장착 콜백; 동적 장비 내부 주얼·활성 무기/연동 스킬 전환 | 특수 오염/성유/장비 주얼 조합·카탈로그/원문 관련 부수 변경·affix/일반 범위/특수 제작 전체, 원본 필터·후보 비교/요구량 표시. variant/catalyst/cluster 연결 컨트롤과 모든 고유의 실제 동선 전수 검증 |
| SkillsTab | 독립 gem/skill 카탈로그; 그룹/젬/레벨/퀄리티·활성·주력/Full DPS; 세트 CRUD; 원본 활성 효과/모드/부분/단계·지뢰 컨트롤 연결. Ice Nova 모드 변경 native 검증 | 미니언·아이템 부여 효과/모드, 단계형·지뢰 실제 빌드 UI 검증, 보조·소켓·요구량·호환성 전체. 현재 젬 외부 부여 효과는 미지원 진단 표시 |
| TreeTab / PassiveSpec | 0_1~0_5 좌표·이미지, 확대/이동/검색·상세·ID 편집, 세트 CRUD UI; 위치 기반 활성 번호 보존; 원본 경로 할당/종속 제거와 지도 강조, 무기 세트 1/2 색상·능력치 선택/재선택·일반 주얼 장착/해제의 native 패치; 원본 직업 reset/connect·전직 변경 미리보기/적용·새 계산 | 단축키·모든 직업/전직 조합과 활성 spec 전환의 표시 동기화 감사·특수 주얼/동적 그래프·특수 노드, 과거 버전별 동등성, 기존 트리 없는 문서의 직업/버전 선택 생성 |
| ConfigTab | 원본 7분류·651 정의의 표시/가용성·기본값·선택지·tooltip을 실제 XML로 평가하는 UI; 0/false/미설정; 세트 CRUD; 원문 고급 편집·placeholder 보존 | 모든 실제 빌드/부모 의존 조합·적/보스/상태 상호작용 전수 검증, 특수 툴팁·연관 위치 이동과 전체 UI 동등성 확인. 정의 개수는 기능 완료 수가 아님 |
| CalcsTab | 독립 실제 계산; 원본 분류/표/포맷과 TEXT/TABLE 분해·modifier 출처; 그룹/버프 모드/플레이어·미니언 선택; Calcs 전용 효과/모드/부분/단계·지뢰; revision/XML hash/runtime 귀속·과거 저장값 분리 | 반경 지도 시각화·분해 출처 위치 이동, 미니언 종류/전용 스킬 컨트롤, 원본 GUI 및 모든 지원 빌드·컨트롤 동등성 검증 |
| CompareTab | AI 제안 검토/적용/undo; 일반 두 빌드/세트 조합의 원본 계산·활성 구성/수치 차이; XML/revision/runtime 기록; 해당 문서의 선택 세트 적용·최종 재계산 | 원본 비교 탭의 모든 표시/검색/연산, 다른 문서로 구성 복사·개별 변경 병합, 고급 구성 전체 검증 |
| PartyTab | 7종 버퍼 편집/unknown 보존; native 지원 출력 생성·대상별 Import/Append/Clear 미리보기·revision 적용/계산; 미해석/Unknown 진단 | 일시적 disable/rebuild 상태, URL 직접 가져오기, 모든 지원/링크/전투 조합과 원본 GUI 동등성 |
| NotesTab | 원문 편집·색상 코드 삽입·크기 조절·적용/undo·저장/재시작; 한글/특수 문자·unknown metadata 보존 | 색상 렌더링/코드 표시 모드, 원본 단축키·범위 색상 편집의 전체 동등성 |
| 원본 Main/Options | UI 테마·밀도·최근 대화·저장 | 원본 옵션/작업 관리/네트워크 기능별 대체·호환 범위 조사 |
| Build Loadouts | 원본 목록/이름·brace 식별자 연결, 네 세트·직업·무기/주력 그룹 동시 전환의 검토/적용·새 계산, 요청별 취소·원본/unknown 보존 | 원본 New/Copy/Custom/Rename/Delete/Reorder 서비스와 XML lineage 보존 패치, 모든 특수 연결/버전 조합 및 원본 GUI 동등성 |

세부 control/function 목록과 실제 사용자 작업 검증을 계속 확장한다. 탭 단위 표만으로 전 기능 조사를 완료했다고 간주하지 않는다. headless가 지원하지 않는 원본 GUI·네트워크 기능은 빠뜨리지 않고 별도 연산/host 계약과 화면으로 구현한다. 별도 PoB 창을 여는 것만으로 자체 편집기 동등성을 완료 처리하지 않는다.

기준 PoB 0.23.1의 지원 트리 0_1~0_5를 원본 runtime으로 조사한 결과 mastery 타입 노드는 모두 0개였다 (`.local/standalone-pob/mastery-inventory.json`). legacy mastery 선택 코드가 남아 있는 것과 실제 사용 가능한 데이터는 구분한다. mastery UI 구현 완료라는 뜻은 아니며 pin 갱신 시 재감사한다.

## 구현 순서와 증거

1. 독립 원본 런타임과 요청 수명/출처를 만들고 합성 XML의 실제 Life/스킬 계산, 변경 후 재계산, 오류 후 상태 불변을 재현한다.
2. standalone 자원·catalog/tree 공급 및 새 빌드/생성/편집/계산 gate에서 PoK 의존을 제거한다. 버전 검증 자체는 제거하지 않는다.
3. 위 표의 모든 수동 편집·조회·관리·비교 UI를 원본 동작과 대조해 구현하고, 최소 지원 범위만으로 목표 완료를 선언하지 않는다.
4. PoK 미설치·미연결 상태의 native/portable 전체 동선과 1920/1024를 검증한다. 선택 연결/미연결/버전 불일치/PoK 종료가 독립 작업에 미치는 영향도 검증한다.

상태: 독립 계산·자원·catalog/tree·새 빌드·아이템 생성 기본 경로와 최신 XML/슬롯 검사를 source/packaged 앱에서 검증했다 (`.local/editor-native-1793607174373/result.json`). 3차로 세트·원본 조건/모드·노트 UI를 구현했고 `.local/sets-config-native-1793611403943/result.json`에서 조건/모드/세트/노트/재시작/두 크기를 검증했다. 4차로 빌드 관리·redo·수동 비교/선택 세트 적용/최종 재계산을 추가했고 최종 source `.local/management-compare-native-1793614452117/result.json` 및 packaged `.local/management-compare-native-1793614603293/result.json`에서 동일 4개 그룹 통과했다. 5차 원본 계산 상세/분해·Calcs 전용 선택을 추가했고 source `.local/calcs-native-1793615422929/result.json` 및 packaged `.local/calcs-native-1793615700907/result.json`에서 각 4개 그룹 통과했다. 6차 파티 native 버퍼/지원 출력/가져오기/계산을 추가했고 최종 source `.local/party-native-1793616956108/result.json`와 packaged `.local/party-native-1793617167259/result.json`에서 각 4개 그룹 통과했다. 7차 원본 트리 경로/종속 연산을 추가했고 native에서 Fireball 4.4583333333333→6.01875, source `.local/tree-operations-native-1793618365332/result.json`와 packaged `.local/tree-operations-native-1793618465601/result.json`에서 각 5개 그룹 통과했다. 8차 능력치 재선택/일반 주얼/무기 표시·로드 오류 보존을 추가했고 source `.local/tree-advanced-native-1793620081993/result.json`와 packaged `.local/tree-advanced-native-1793620084995/result.json`에서 각 5개 그룹 통과했다. 새 override의 스키마 누락을 재열기/실계산 회귀로 수정했다. 9차 원본 단순 아이템 옵션/검토·계산과 원문 손실/잘못된 장착 차단을 추가했고 native 6개 그룹, source `.local/item-controls-native-1793624679489/result.json`와 packaged `.local/item-controls-native-1793625077148/result.json` 각 6개 그룹이 통과했다. 대표 검증은 품질 Armour45→54/룬 Dex15→21이며 모든 연결 옵션의 전수 검증은 아니다. 10차 원본 성유/오염 팝업·고유 slider와 요청별 취소를 추가했고 native 6개 그룹 및 source `.local/item-popups-native-1793627806158/result.json`/packaged `.local/item-popups-native-1793628014476/result.json` 각 5개 그룹 통과했다. 11차 동적 장비 주얼/활성 무기·연동 스킬 콜백을 추가했고 native 4개 그룹, 최종 source `.local/equipment-native-1793629639489/result.json`와 packaged `.local/equipment-native-1793629675602/result.json` 각 5개 그룹 통과했다. 원본 모든 탭/고급 연산/GUI 왕복은 미완료다. portable 최종 압축은 `LICENSE.electron.txt` 접근 거부로 중단했고 라이선스를 제외/우회하지 않았다.

**조사 범위 주의:** 이 표는 큰 기능군 대응표이며 원본 모든 control·옵션·명령을 세부 항목으로 전수 분해한 완료 목록은 아니다. 총 세부 기능 수·완료율은 아직 산출하지 않는다. 데이터 개수·API/테스트 개수로 기능 완성도를 판정하지 않는다.

## 독립 런타임 준비 (현재 Windows 개발 경로)

```powershell
npm run pob:prepare -- --pob-root "<clean pinned upstream PoB Git checkout>" --luajit "<LuaJIT executable>" --lua-license "<LuaJIT COPYRIGHT>"
npm run pob:prepare-data -- --tree-python "<Pillow/zstandard Python>"
npm run check
npm run build
node tests/pob-runtime-smoke.cjs
node tests/standalone-desktop-smoke.cjs
node tests/pob-editor-smoke.cjs
node tests/editor-desktop-smoke.cjs
node tests/pob-inspection-smoke.cjs
node tests/sets-config-desktop-smoke.cjs
node tests/management-compare-desktop-smoke.cjs
node tests/pob-calcs-smoke.cjs
node tests/calcs-desktop-smoke.cjs
node tests/pob-party-smoke.cjs
node tests/party-desktop-smoke.cjs
node tests/pob-tree-smoke.cjs
node tests/native-tree-desktop-smoke.cjs
node tests/pob-tree-advanced-smoke.cjs
node tests/tree-advanced-desktop-smoke.cjs
node tests/pob-item-controls-smoke.cjs
node tests/item-controls-desktop-smoke.cjs
node tests/pob-item-popups-smoke.cjs
node tests/item-popups-desktop-smoke.cjs
node tests/pob-equipment-smoke.cjs
node tests/equipment-desktop-smoke.cjs
node tests/pob-item-affixes-smoke.cjs
node tests/item-affixes-desktop-smoke.cjs
node tests/pob-character-smoke.cjs
node tests/character-desktop-smoke.cjs
node tests/pob-tree-sets-smoke.cjs
node tests/tree-sets-desktop-smoke.cjs
node tests/pob-loadouts-smoke.cjs
node tests/loadouts-desktop-smoke.cjs
npm run verify:pob
```

PoB source는 수정되지 않은 고정 Git checkout이어야 한다. 원본 release manifest의 program/tree/runtime 파일 목록과 HeadlessWrapper를 준비하며, 개발용 `src/Export` 템플릿·개인 빌드는 복사하지 않는다. 원본/런타임 라이선스를 포함하고 모든 포함 파일을 해시 검증한다. 검증 실패 시 기존 runtime을 유지하고 staging을 진단용으로 남긴다. 성공 시 이전 runtime은 `.local/bundle-backups`에 보존한다.

생성 위치는 gitignored `resources/pob-runtime`과 `resources/pob-editor`다. PoK Python/KB/MCP를 호출하지 않는다. 이미지 변환 Python은 build 도구이며 앱 실행 의존성이 아니다. `verify:pob`는 파일 출처·전체 트리·실제 계산을 검사하고 `pack:win`은 unpacked, `dist:win`은 portable을 생성한다. macOS/Linux native binary 준비·원본 사용자 네트워크/GUI 기능은 아직 검증하지 않았다. 개발 검사에서만 `POK_UI_RESOURCE_DIR`로 격리 리소스 폴더를 선택할 수 있고 packaged 앱은 이를 무시한다.
