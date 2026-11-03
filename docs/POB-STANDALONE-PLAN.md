# 독립 PoB 작업 공간 — 설계 및 기능 대응표

26차(2026-11-03): 원본 LoadSkill 기반 전체 XML 복제·세트 간 이동을 검토/적용/새 계산으로 연결했다. source/target lineage와 주력/Calcs actor를 유지하며 비활성 대상의 수치를 측정한 것으로 표시하지 않는다. 생략 속성 XML의 modal submit 전파 결함을 실제 재현/수정했고 native5/unit5/source5/Windows packaged5/기존 그룹 source5/check188/build/pack:win·두 크기 직접 확인 통과. 원본 텍스트 붙여넣기/클립보드 교환·generated-group lineage·전체 삭제/drag UI·장기 ledger 및 나머지 전체 기능은 계속 남는다.


25차(2026-11-03): 원본 SkillListControl의 위/아래 이동·확인 삭제를 검토/적용/새 계산으로 연결했다. LoadSkill object lineage로 중복 label/unknown/비활성 XML과 main/Calcs actor를 보존한다. native4/unit3/source5/Windows packaged5/기존 sets-config source8/check186/build/pack:win·두 크기 직접 확인 통과. generated-group lineage·복사/붙여넣기/세트 간 이동·전체 삭제/drag UI·장기 ledger와 나머지 전체 기능은 남는다. [계약/범위](POB-SKILL-GROUPS.md).


2026-11-02 재개. 전체 목표는 PoK 미설치·미연결에서 원본 PoB의 모든 사용자 작업을 수행하고, 이후 선택 PoK 연결 시 양쪽 PoB 출처를 확인하는 것이다. 이 표는 완료 범위를 축소하지 않는다.

## 실행 경계

원본 PoB의 MIT 코드/데이터를 별도 PoB 런타임으로 공급한다. `runtime/pob`는 원본 HeadlessWrapper와 편집 API에 요청을 전달하는 어댑터 계층이며 게임 계산 규칙을 구현하지 않는다. main은 프로세스·파일·요청 수명·입력 revision·출처 검증을 담당한다. renderer에는 계산기/Lua/Node를 넣지 않는다. PoK 서버·Python·KB·로그인은 기본 편집기의 의존성이 아니다. 이 설계로 기존 PoK 전용 실행 경로를 점진적으로 대체한다. 형제 엔진 저장소는 수정하지 않는다.

현재 고정 원본 `5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`(manifest 0.23.1)을 첫 재현 기준으로 사용한다. 최신판을 자동 추종하지 않는다. PoB 코드·데이터·LuaJIT·어댑터의 출처/해시는 PoK identity와 별도로 검증한다. 선택 PoK 연결의 호환성은 그 이후에 별도 상태로 표시한다.

XML은 편집 정본이다. 계산은 제출 시점 XML을 격리된 원본 PoB에 로드한다. what-if/실패/취소가 사용자 원본이나 다른 계산의 상태를 바꾸지 않도록 요청 단위 로드와 직렬화·종료를 보장한다. 원본 저장 PlayerStat를 결과로 사용하지 않는다. 원본 PoB의 저장 동작은 어댑터에서 차단하고 host의 명시적 내보내기만 파일을 쓴다.

## 기능 대응표 (원본 Classes/*Tab.lua 기준, 조사/구현 지속)

24차(2026-11-03): Notes의 색상 편집/raw view/원본 범위 color callback 규약·named preset·local undo/redo·zoom/scroll·문서 격리/원문 보존을 연결했다. Lua NotesTab parity2/unit7/source6/Windows packaged6/기존 sets-config8/check183/build/pack:win·두 크기 확인 통과. 이전 Notes의 색상 렌더링/범위 편집 미구현은 이 대표 구현으로 보완했다. 실제 OS IME/clipboard·원본 GUI font/pixel parity 및 모든 입력/단축키 조합은 아직 미검증이다. [규약](POB-NOTES.md)을 따른다.

23차(2026-11-03): 지원되는 과거 tree에서도 같은 original item/gem/skill data를 쓰므로 default tree 일치 gate를 source/runtime ID/commit·지원 범위 확인으로 바꿨다. 버전별 class/ascendancy는 기존 native control을 유지한다. 미지원 tree popup 이후에도 item 생성이 반환된 원본 load 문제를 발견해 모든 canonical Spec의 명시 version을 host에서 실행 전에 검증한다. native6(0_1~0_5·거부)/source5/Windows packaged5/check176/build/pack:win·두 크기 확인 통과. 과거 tree 카탈로그가 제한된다는 이전 gate 설명은 이번에 보완했다. [로드 계약](POB-LOAD-CONTRACT.md)의 다른 실패/전수 조합과 남은 전체 원본 기능은 계속 감사한다.

22차(2026-11-03): 원본 export Copy/명시 version DecodeURL의 tree code 가져오기·내보내기·copy IPC를 연결했다. 현재 pin은 URL prefix/버전이 없는 code를 내므로 웹 공유 링크로 표시하지 않는다. loader 누락·code 왕복 누락/미포함 필드·고급 전직 한계와 부분 복원을 구분하고 source/revision/known-state를 보존한다. 같은 입력 재측정에는 과거 edit 근거만 별도 source revision으로 보존하고 숫자는 새 계산을 쓴다. native8/빈 문서1/source7/Windows packaged7/check173/build/pack:win·두 크기 확인 통과. 실제 OS clipboard는 rich 원본 보호 때문에 미수행이며 copy IPC만 확인했다. [원본 제한/남은 서비스 계약](POB-CODE-LIMITATIONS.md)을 따른다. 네트워크 단축 링크/PoEPlanner 및 모든 code 조합 완료가 아니다.

21차(2026-11-03): 단일 root Spec을 원본 PoB의 실제 복원 결과로 검토한 뒤 현재 Tree/Spec 편집 형식으로 옮긴다. 원문 선언 버전과 실제 복원 버전이 다르면 드러내며 버전 업그레이드는 별도 선택이다. 동일 DOM/source lineage·native known-state 적용으로 unknown/루트 형제·비트리 XML과 원문/undo를 보존한다. native4/source5/Windows packaged5/check169/build/pack:win·두 크기 직접 시각 확인 통과. 구형 단일 Spec 자체를 편집할 수 없다는20차 제약은 이 명시 전환으로 보완했으며, Tree 혼합/여러 root Spec의 자동 해석과 전수 조합은 남는다.

20차(2026-11-03): 초기 트리의 원본 버전/직업/전직/이름 선택과 원본 Copy + Convert/replace/ConvertAll을 연결했다. 변환은 canonical lineage에 stock 최종 Save의 알려진 필드를 반영하며 저장 입력/복원 후 노드 변화·소켓 변경을 검토하고 새 revision으로 계산한다. 기본 섹션이 모두 없는 문서도 native 기본 세트를 생성한다. root의 구형 단일 Spec은 빈 문서와 구분하고 초기화를 거부하며 원문을 보존한다. native6/구형 guard1/기존 tree5/source7/Windows packaged7/check167/build/pack:win·두 크기 확인 통과. 최종 전체 동선은 CURRENT-PLAN/VALIDATION을 따른다. 해당 구형 형식의 직접 편집/정규화·전체 버전/직업·전직/특수 주얼 조합은 아직 남는다.

19차(2026-11-03): 기존 TreeView 메뉴에 원본 PassiveSpecListControl의 New/Copy/Rename/Delete/drag를 연결해 통합 구성 밖 비활성 spec도 관리한다. 신규/복사의 활성 유지, unknown 형제/미변경 섹션/legacy flag 보존을 보완했다. 구버전 트리 변환은 stock과 동일한 tree.lua 테이블 export로 바꿨으며 원본/export/변환기 해시와 5개 버전의 프레임·좌표·연결을 검사한다. native 관리5/export2/source6/Windows packaged6/기존 세트source4/check162/build/pack:win 및 두 해상도 확인 통과. 트리 없는 문서 생성·버전 변환 및 모든 특수 조합은 여전히 남는다. 아래 18차의 구성 밖 spec 관리 미구현은 이번에 보완했으며 나머지 전체 기능은 유지한다.

18차(2026-11-03): 원본 PassiveSpecListControl 드래그로 brace/일반 구성의 명시적 tree scope 순서 변경을 연결했다. 원본 위치/공유 별칭 metadata·객체 기반 활성 유지·canonical lineage·movement receipt를 사용한다. native5/source5/Windows packaged5/기존 named native6/check160/build/pack:win·두 크기 확인 통과. duplicate title에서 원본 이름 해석이 바뀌는 것은 알리되 명시 활성 actor를 첫 title로 다시 선택하지 않는다. 관리 구성에 속하지 않는 spec을 소스로 선택하는 별도 TreeView 관리와 전체 버전/특수 조합/GUI 동등성은 여전히 남는다.

17차(2026-11-03): 원본이 제공하는 opaque 이름으로 brace 구성의 rename/copy/delete를 연결했다. 생존 구성은 명시적으로 선택하며 삭제 후 원본을 재조회하고 객체 동일성을 확인한다. 연결 구성 추가/제외/변경을 native에서 구해 검토하고 입력 revision/hash/runtime과 함께 계산 receipt에 저장한다. named native6/기존 native6/source5/Windows packaged5/check160/build/pack:win 및 두 해상도 확인 통과. 이름 기반 reorder는 원본 ListControl index 계약으로 제공되지 않아 여전히 남는다(다른 원본 트리 관리 API는 후속 조사 대상이며 엔진 전체 API 부재를 단정하지 않는다).

16차(2026-11-03): 원본 관리 Popup/BuildSetService를 통한 New/Copy/Custom/Rename/Delete/Reorder와 canonical XML lineage 패치를 연결했다. native6/source5/Windows packaged5개 그룹 및 check160/build/pack:win 통과. 후속 검토 표시 개선은 source/Windows packaged 각2개 그룹과 두 해상도 확인을 완료했다. 원본 ListControl 목록이 빈 brace 연결 항목은 선택만 가능하고 관리 폼 대상에 없다. raw-name Build API를 통한 후속 연결과 모든 버전/특수 공유 조합은 남는다.

15차(2026-11-03): 원본 Loadout 목록/이름·brace 연결/네 세트 동시 선택을 native 어댑터로 연결했다. ‘통합 구성’에서 변경 검토→원자 적용→새 계산, scoped 취소/문서 격리/undo/재시작을 검사했다. native4/최종 source4/Windows packaged4개 그룹 및 check158/build/pack:win 통과. 생성/복사/Custom/이름/삭제/순서 변경 관리 기능은 아직 남는다. 원본 매칭 규칙을 UI에 복제하지 않았다.

14차(2026-11-03): 활성 tree 세트 전환·생성/복사/삭제는 기존 native tree API로 직업 정보를 확인해 canonical Build 정보와 함께 적용한다. 비교도 원본이 확인한 treeIdentity와 정확한 XML/hash를 자동 기록하고 최종 적용 전 재확인한다. native3/source4/Windows packaged4개 그룹, 기존 management-compare4개 그룹과 check156/build/pack:win 통과. 아래의 활성 spec 동기화 감사 범위 중 대표 cross-class 전환은 이 검사로 보완했으며 모든 버전/조합 전수 완료는 아니다. 원본 Build의 통합 Loadout 동시 선택/관리도 개별 세트 UI와 별도로 남는다.

13차(2026-11-03): 직업/전직 폼을 원본 classDrop/ascendDrop로 전환하고 reset/connect 선택·변경 노드 검토·revision 적용/새 계산을 연결했다. native 4개 그룹, source/Windows packaged 각4개 그룹, 기존 native tree5개 그룹과 check153/build/pack:win 통과. 전체 전직·트리 없는 문서 생성·버전 변환·특수 주얼·원본 GUI 동등성은 여전히 남는다.

12차(2026-11-03) 추가: 기존 아이템의 원본 일반 modifier range 및 제작 affix/tier/roll을 연결했다. 원본 Save의 variant/ModRange를 XML과 동기화하며 unknown metadata를 보존한다. native 3개 그룹·source/Windows packaged 각 4개 그룹 통과, check152/build/pack:win 통과. 자세한 증거와 최초 IPC 길이 제한 실패는 CURRENT-PLAN/VALIDATION의 12차 기록을 따른다. 아래 ItemsTab의 ‘affix/일반 범위 전체’는 이 대표 구현 이후에도 남은 특수 유형·전수 검증을 뜻한다.

| 원본 영역 | 현재 React 작업 공간 | 남은 전체 동등성 범위 |
|---|---|---|
| ImportTab / 빌드 관리 | 독립 새 빌드·직업 metadata, XML/공유코드/JSON 가져오기·내보내기, revision/undo/redo·저장/재시작, 검색·복사·이름/가상 폴더·삭제 보관함/복원 | 계정/캐릭터 가져오기, 원본 파일 기반 빌드 관리와 GUI 형식 왕복 검증 |
| ItemsTab | 독립 base/unique/mod 카탈로그; 슬롯·원문·생성/장착/해제; rare affix/roll·quality·unique variant UI/원본 API; 세트 CRUD; 원본 단순 옵션 metadata/콜백·품질/소켓/룬 검토→적용→계산; 성유/원본 오염 팝업·고유 roll; 저장 목록 원본 장착 콜백; 동적 장비 내부 주얼·활성 무기/연동 스킬 전환 | 특수 오염/성유/장비 주얼 조합·카탈로그/원문 관련 부수 변경·affix/일반 범위/특수 제작 전체, 원본 필터·후보 비교/요구량 표시. variant/catalyst/cluster 연결 컨트롤과 모든 고유의 실제 동선 전수 검증 |
| SkillsTab | 독립 gem/skill 카탈로그; 원본 그룹 위/아래 이동·확인 삭제·전체 XML 복제/세트 간 이동/두 selector 보존·검토/새 계산; 그룹/젬/레벨/퀄리티·활성·주력/Full DPS; 세트 CRUD; 원본 활성 효과/모드/부분/단계·지뢰 컨트롤 연결. Ice Nova 모드 변경 native 검증 | 원본 그룹 텍스트 붙여넣기/클립보드 교환·전체 삭제/drag UI·generated-group lineage, 미니언·아이템 부여 효과/모드, 단계형·지뢰 실제 빌드 UI 검증, 보조·소켓·요구량·호환성 전체. 현재 젬 외부 부여 효과는 미지원 진단 표시 |
| TreeTab / PassiveSpec | 0_1~0_5 좌표·이미지, 확대/이동/검색·상세·ID 편집, 세트 CRUD UI; 위치 기반 활성 번호 보존; 원본 경로 할당/종속 제거와 지도 강조, 무기 세트 1/2 색상·능력치 선택/재선택·일반 주얼 장착/해제의 native 패치; 원본 직업 reset/connect·전직 변경 미리보기/적용·새 계산; 초기 버전/직업 선택·복사/교체/전체 버전 변환 검토·새 계산 | 단축키·모든 직업/전직 조합과 활성 spec 전환의 표시 동기화 감사·특수 주얼/동적 그래프·특수 노드, 과거 버전별 동등성, 구형 혼합/다중 Spec 정규화·네트워크 tree URL/PoEPlanner·code 전체 조합 |
| ConfigTab | 원본 7분류·651 정의의 표시/가용성·기본값·선택지·tooltip을 실제 XML로 평가하는 UI; 0/false/미설정; 세트 CRUD; 원문 고급 편집·placeholder 보존 | 모든 실제 빌드/부모 의존 조합·적/보스/상태 상호작용 전수 검증, 특수 툴팁·연관 위치 이동과 전체 UI 동등성 확인. 정의 개수는 기능 완료 수가 아님 |
| CalcsTab | 독립 실제 계산; 원본 분류/표/포맷과 TEXT/TABLE 분해·modifier 출처; 그룹/버프 모드/플레이어·미니언 선택; Calcs 전용 효과/모드/부분/단계·지뢰; revision/XML hash/runtime 귀속·과거 저장값 분리 | 반경 지도 시각화·분해 출처 위치 이동, 미니언 종류/전용 스킬 컨트롤, 원본 GUI 및 모든 지원 빌드·컨트롤 동등성 검증 |
| CompareTab | AI 제안 검토/적용/undo; 일반 두 빌드/세트 조합의 원본 계산·활성 구성/수치 차이; XML/revision/runtime 기록; 해당 문서의 선택 세트 적용·최종 재계산 | 원본 비교 탭의 모든 표시/검색/연산, 다른 문서로 구성 복사·개별 변경 병합, 고급 구성 전체 검증 |
| PartyTab | 7종 버퍼 편집/unknown 보존; native 지원 출력 생성·대상별 Import/Append/Clear 미리보기·revision 적용/계산; 미해석/Unknown 진단 | 일시적 disable/rebuild 상태, URL 직접 가져오기, 모든 지원/링크/전투 조합과 원본 GUI 동등성 |
| NotesTab | 원문 편집·색상 코드 삽입·크기 조절·적용/undo·저장/재시작; 한글/특수 문자·unknown metadata 보존 | OS IME/clipboard·원본 GUI의 font/pixel·전체 단축키/입력 조합 검증 |
| 원본 Main/Options | UI 테마·밀도·최근 대화·저장 | 원본 옵션/작업 관리/네트워크 기능별 대체·호환 범위 조사 |
| Build Loadouts | 원본 목록/이름·brace 연결과 네 세트 동시 전환; 원본 관리 Popup/서비스의 New/Copy/Custom/Rename/Delete/Reorder·canonical lineage; brace raw-name 관리·생존 구성 선택·관계 변화, 원본 PassiveSpecList 드래그의 tree scope 이동/활성 보존·검토/자동 기록·계산·undo/redo | 모든 특수 공유/버전·이름 모호성 조합, 원본 GUI 동등성 |

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
node tests/pob-loadout-management-smoke.cjs
node tests/loadout-management-desktop-smoke.cjs
node tests/pob-linked-management-smoke.cjs
node tests/linked-management-desktop-smoke.cjs
node tests/pob-linked-reorder-smoke.cjs
node tests/linked-reorder-desktop-smoke.cjs
node tests/pob-tree-management-smoke.cjs
node tests/pob-tree-source-smoke.cjs
node tests/tree-management-desktop-smoke.cjs
node tests/pob-tree-workspace-smoke.cjs
node tests/tree-workspace-desktop-smoke.cjs
node tests/pob-tree-adoption-smoke.cjs
node tests/tree-adoption-desktop-smoke.cjs
node tests/pob-tree-code-smoke.cjs
node tests/tree-code-desktop-smoke.cjs
node tests/pob-catalog-versions-smoke.cjs
node tests/catalog-versions-desktop-smoke.cjs
node tests/pob-notes-parity-smoke.cjs
node tests/notes-desktop-smoke.cjs
npm run verify:pob
```

PoB source는 수정되지 않은 고정 Git checkout이어야 한다. 원본 release manifest의 program/tree/runtime 파일 목록과 HeadlessWrapper를 준비하며, 개발용 `src/Export` 템플릿·개인 빌드는 복사하지 않는다. 원본/런타임 라이선스를 포함하고 모든 포함 파일을 해시 검증한다. 검증 실패 시 기존 runtime을 유지하고 staging을 진단용으로 남긴다. 성공 시 이전 runtime은 `.local/bundle-backups`에 보존한다.

생성 위치는 gitignored `resources/pob-runtime`과 `resources/pob-editor`다. PoK Python/KB/MCP를 호출하지 않는다. 이미지 변환 Python은 build 도구이며 앱 실행 의존성이 아니다. `verify:pob`는 파일 출처·전체 트리·실제 계산을 검사하고 `pack:win`은 unpacked, `dist:win`은 portable을 생성한다. macOS/Linux native binary 준비·원본 사용자 네트워크/GUI 기능은 아직 검증하지 않았다. 개발 검사에서만 `POK_UI_RESOURCE_DIR`로 격리 리소스 폴더를 선택할 수 있고 packaged 앱은 이를 무시한다.
