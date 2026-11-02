# 원본 스킬 그룹 순서·삭제

기준: PoB 0.23.1 / `5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`. 원본 `Classes/SkillListControl.lua`의 ListControl drag/OnOrderChange와 OnSelDelete를 호출한다. 게임 규칙·선택 보정을 renderer에 구현하지 않는다. 공유 PoK 저장소와 원본 PoB 소스는 수정하지 않는다.

## 계약과 XML 보존

기존 `readLoadouts`의 선택적 `skillGroups` 요청으로 `inspect`, `reorder`, `delete`를 전달한다. 입력은 buildId/revision/XML/runtimeId/requestId, 활성 setId, 원본 groupId와 이동 position이다. 통합 구성·트리 연산과 혼합 요청은 거부한다. 기존 scoped 취소 경로를 사용한다.

`runtime/pob/skill-groups.lua`는 원본 SkillsTab.LoadSkill 호출 직후 삽입된 객체를 관측해 canonical Skill 순서와 연결한다. hook은 성공·실패 모두 복구한다. 이름이 같은 그룹을 이름/첫 일치로 연결하지 않는다. 원본 SkillListControl의 실제 drag와 확인 callback을 호출하고 원본 BuildOutput/CalcSetup으로 마지막 그룹 삭제 후 선택값도 정상화한다. 결과는 원래 그룹 목록/정확한 source 순서, 삭제 가능 여부, 원본 확인 문구, 주력 및 Calcs 그룹 번호다.

host는 요청 echo/그룹 inventory/정확한 요청 결과 순서를 검사한다. canonical patch는 기존 Skill DOM 전체를 깊게 복제해 해당 Skill 슬롯에만 배치한다. 알 수 없는 속성/자식, 비활성 세트, 알 수 없는 형제 위치와 비스킬 섹션을 재생성하지 않는다. 원본이 돌려준 두 선택값을 함께 적용한다. 빈 세트도 원본 선택 fallback 1을 표현할 수 있다. 원본 XML은 originalXml/undo로 보존한다.

UI는 위로/아래로/삭제→검토→적용·새 계산을 제공한다. 순서 변경 후 편집 선택도 이동한 source 그룹을 따라간다. 입력 revision/XML hash/runtime과 요청에 귀속한 preview만 적용하며 취소·문서 전환·늦은 응답은 적용하지 않는다. 초안이 변경 중이면 관리 연산을 비활성화한다. 적용 후 새 계산에는 입력 revision/hash/runtime/PoB commit·연산/순서/두 선택값을 자동 기록한다. 계산 실패를 XML 적용 실패로 혼동하지 않으며 다른 revision의 늦은 계산을 최신으로 붙이지 않는다.

## 남은 범위

- 원본 item-generated 그룹은 `.source`가 있으면 삭제 불가다. 복원 중 새로 생성되거나 교체되어 canonical LoadSkill 객체와 대응하지 않는 그룹은 현재 명시 진단/관리 거부한다. 자동 생성 그룹의 원본 Item/Skill lineage와 저장 형태를 노출하는 후속 계약이 필요하며, UI에서 이름/위치를 추정해 덮어쓰지 않는다. 이 제한을 원본 PoB 기능 부재로 분류하지 않는다.
- 비활성 세트는 먼저 기존 세트 선택으로 활성화한 후 관리한다. 단일 요청의 비활성 편집·그룹 drag UI·전체 삭제·그룹 복사/붙여넣기·세트 간 이동은 아직 남는다.
- 원본 CopySocketGroup/PasteSocketGroup은 이름/레벨/품질/활성/개수/일부 corruption 등을 텍스트로 옮기며 그룹 상태·효과 선택·StatSet·미지 XML 전체를 보존하는 복제 계약이 아니다. 따라서 이를 무손실 복사로 연결하지 않았다. 실제 클립보드 동등성과 무손실 복사/이동을 구분해 후속 구현한다.
- 기존 raw `skill-remove` edit 형식은 호환 경로로 남는다. 이번 화면의 삭제는 원본 관리 경로를 사용한다. 모든 외부/AI edit를 원본 검토 경로로 통일한 것은 아니다.
- 같은 XML 재측정의 편집 근거 계승과 전체 revision별 장기 이력은 다르다. undo로 다른 XML을 계산한 뒤 redo한 결과에 이전 편집 receipt를 자동 복원하는 ledger는 아직 없다. 과거 측정/다른 입력의 근거를 현재 결과에 붙이지 않는다.
- 실제 원본 PoB GUI·미니언/부여 효과·전수 그룹 조합 동등성, OS 클립보드/단축키, portable 및 선택 PoK/AI는 이번 기능 검사 범위가 아니다.

검사 실행과 최종 결과/런타임 manifest는 CURRENT-PLAN 및 VALIDATION의 25차 기록을 따른다. 합성 XML만 사용하며 개인 빌드·대화·세션은 fixture/배포물에 포함하지 않는다. 전체 PoB 기능 또는 #188 완료를 선언하지 않는다.

독립 계획의 runtime/data 준비 후 검사는 `npm run check`, `npm run build`, `node tests/pob-skill-groups-smoke.cjs`, `node tests/skill-groups-desktop-smoke.cjs` 순서다. native smoke가 desktop smoke의 합성 fixture를 생성한다. `npm run pack:win` 후 `POK_SMOKE_EXECUTABLE`을 실제 unpacked exe로 지정하면 같은 desktop 검사가 배포된 runtime/editor payload를 사용한다. 생성 fixture/자원/프로필은 Git에 넣지 않는다.
