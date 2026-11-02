# 고정 원본 PoB의 트리 코드 계약과 남은 연결

기준: PoB 0.23.1 / `5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`. 이 기록은 PoK 엔진 결함 선언이 아니며 원본/공유 엔진을 수정하지 않았다. 재현은 합성 XML의 `tests/pob-tree-code-smoke.cjs`를 사용한다.

## 현재 가능한 경로

`TreeTab.OpenExportPopup`의 Copy callback이 생성한 문자열을 그대로 반환한다. 현재 GameVersions의 각 `treeVersions[version].url`은 없으므로 결과는 URL이 아닌 versionless GGG code다. 가져오기는 원본 Import popup의 입력 검증과 원본 `PassiveSpec.DecodeURL`을 사용하되, UI에서 지원 버전을 명시 선택한다. 기존 popup의 versionless 입력에 대한 latest 자동 가정을 재사용하지 않는다. 원문/원래 트리는 보존하고 검토한 새 트리만 추가한다.

원본 `AllocateDecodedNodes`의 실제 missing lookup을 관측해 미복원 ID를 반환한다. renderer는 binary decoder나 게임 규칙을 구현하지 않는다. export는 원본 디코더로 같은 버전의 roundtrip을 확인하며, 저장 XML에서 이미 복원되지 않은 ID와 code 왕복에서 잃은 ID를 분리한다. 원본의 code는 장비·스킬·조건·주얼·능력치 선택·무기별 할당 전체를 보존하는 빌드 형식이 아니다. 전체 보존에는 기존 XML/PoB 파일 경로를 사용한다.

## 원본에서 확인한 제한

- `EncodeURL`의 일반 노드 카운트 한계가 있다. 연결된 합성 입력을 원본에 실제>255개 로드한 후 export→DecodeURL에서 빠지는 ID를 관측한다. 이 합성 입력은 인코더 제한 재현이며 실제 게임에서 성립하는 빌드/추천의 증거가 아니다.
- 전직 ID가 높은 원본 class/ascendancy는 code의 roundtrip이 현재 actor와 다르거나 실패할 수 있다. 원본 class control로 Witch의 ID>3 전직을 선택한 후 export해 재현한다. 생성된 code는 제공하지만 경고를 유지하며 완전한 왕복으로 표시하지 않는다. UI에서 bit/전직 mapping을 고치지 않는다.
- 미연결 XML ID270개를 임의로 고른 첫 fixture는 원본이 class start1개만 복원했다. 이를 encoder 누락으로 오판하지 않고 `inputMissingNodes`와 code roundtrip의 `missingNodes`를 분리했다.

## 아직 제공하지 않는 서비스 계약

원본 TreeTab의 Manage popup에서 Import Tree/Export Tree 버튼은 disabled다. 내부 코드 메서드의 수동 경로만 별도로 검증했으며 웹 공유 서비스가 된다고 주장하지 않는다.

1. **웹 URL·단축 URL:** 현재 export는 prefix 없는 code이고 stock Shrink callback은 이를 PoEURL endpoint에 넘긴다. 지원되는 PoE2 URL prefix/format·redirect 허용 범위·오류 계약이 확인되지 않았다. UI에서 임의의 PoE1/PoE2 URL을 만들거나 개인 트리를 서비스에 전송하지 않는다. 필요한 계약은 XML/revision/runtime 입력에 대해 명시 format/version/URL·미포함 정보·실패 사유를 반환하고 요청 ID별 취소/완료를 구분하는 것이다. 현재는 code+버전만 복사하며 단축 링크 입력을 설명과 함께 거부한다.
2. **PoEPlanner:** `PassiveSpec.DecodePoePlannerURL`의 내부 version translation은 과거 major/minor 형태이고 현재 지원 treeVersionList(0_1~0_5)와의 PoE2 호환 계약이 확인되지 않았다. 필요한 입력은 source URL/format·기준 pin이며, 출력은 원본이 판독한 version·지원 여부·복원/누락 ID·오류/취소다. 현재 GGG decoder로 대신 해석하거나 UI에 translation 표를 복제하지 않고 별도 형식으로 거부한다. 실제 서비스 입력/네트워크 왕복은 미검증이다.

두 항목은 후속 원본/엔진 API 검토 대상으로 남는다. 일반 code의 성공을 이 서비스 전체의 지원으로 확대하지 않는다. 같은 XML/hash/runtime의 재측정에는 편집 근거만 source revision과 함께 남기고 수치는 새 계산을 사용한다. 전체 revision의 장기 작업 이력은 이 최신 계산의 근거 보존과 별도 범위다.
