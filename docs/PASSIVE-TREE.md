# PoB 패시브 트리 표시 — v0.1.1

트리 화면은 고정 PoB 소스의 `TreeData/<version>/tree.json`, `Classes/PassiveTree.lua`, `Classes/PassiveTreeView.lua`를 따른다. 지식 검색 MCP를 노드 수만큼 호출하지 않는다. 엔진 실행 여부와 관계없이 로컬 정적 리소스를 한 번 읽는다.

## 수정한 문제

- 이전 구현은 `search_kb` 후 각 노드에 `get_entry`를 요청했다. 현재는 한 번의 `loadPassiveTree(version)` IPC로 전체 데이터를 읽고 버전별 캐시를 재사용한다. 검색은 메모리에서 처리한다.
- PoB `connections`는 단방향 저장이다. 이전 `target > source` 조건은 역방향 중복이 없는 실제 연결까지 지웠다. 지금은 출발·도착 순서를 보존하면서 쌍의 키만 정규화한다.
- 그룹은 Lua에서 1-based, 궤도·궤도 슬롯은 0-based다. 그룹 인덱스, 불규칙 궤도 각도와 반지름을 원본대로 해석한다.
- 같은 궤도와 명시적 양/음수 `connection.orbit`의 연결은 PoB의 중심점과 작은 호를 사용한다. 특수 orbit sentinel과 반지름보다 긴 연결은 직선이다.
- ClassStart와 전직 간 연결은 PoB처럼 논리 그래프에는 남기고 화면에서는 숨긴다. OnlyImage·자기 연결·없는 대상은 그리지 않는다. 임의의 선을 추가해 떨어진 노드를 잇지 않는다.

사용자 빌드 검증: 할당 132개 모두 원본에 존재하며, 표시할 할당 간 연결 121개 중 이전에는 63개가 누락됐다. 새 화면은 121개 전부 그린다. 전체 0_5는 4,914노드, 5,187 논리 연결, 5,149 표시 연결이다. 실제 빌드·개인 경로는 테스트 fixture로 저장하지 않는다.

## 화면과 이미지

`PassiveTreeCanvas.tsx`는 Canvas에서 배경, 직선·곡선, 원본 아이콘과 프레임, 할당·검색 상태를 그린다. 휠 확대는 포인터 위치를 유지하며 드래그·키보드 이동, 선택·편집을 지원한다. 할당 위치 버튼은 전체 그래프를 유지한 채 카메라만 이동한다.

`prepare-tree-assets.py`는 PoB DDS/Zstandard 배열을 디코드하고 1-based 레이어를 WebP 아틀라스로 묶는다. 화면은 필요한 파일만 최대 4개씩 디코드하고 이미지 캐시를 유지한다. 작은 아이콘·프레임은 픽셀을 보존하며 큰 인물 배경은 1024px, 중앙 배경은 2048px로 변환한다. 표시 크기는 원본 메타데이터를 따른다. 버전별 매니페스트에 원본 커밋·파일 해시·아틀라스 좌표를 기록하고 PoB 라이선스와 GGG 이미지 출처를 함께 배포한다.

## 생성·배포

```sh
python -m pip install -r scripts/requirements-tree-assets.txt
python scripts/prepare-tree-assets.py --pob-root <PoB-source-root> --source-revision <full-PoB-commit-SHA> --versions all --output resources/passive-tree
```

출력은 `resources/passive-tree/0_1`~`0_5`이며 파생물이므로 Git에 넣지 않는다. 패키지는 이 폴더를 `extraResources`로 포함한다. `verify-tree-assets.mjs`가 번들 엔진의 PoB 커밋과 이미지 출처·필수 파일을 배포 전에 대조한다.

main의 `PassiveTreeStore`가 파일을 읽고 `pok-tree://assets/<version>/<file>`로 이미지를 제공한다. 파일은 매니페스트 허용 목록 안에서만 열며 경로 탈출, 심볼릭 링크, 임의 파일, 다른 호스트를 차단한다. 요청 버전이 없으면 명확히 실패하고 최신 버전으로 바꿔 표시하지 않는다.

## 코드 위치

| 역할 | 파일 |
|---|---|
| 원본 이미지 변환 | `scripts/prepare-tree-assets.py` |
| 대량 읽기·캐시·이미지 경로 제한 | `src/main/passive-tree.ts` |
| 원본 표시 계약 | `src/shared/passive-tree.ts` |
| 좌표·연결·곡선·카메라 | `src/renderer/features/passive-tree-geometry.ts` |
| Canvas 이미지와 입력 | `src/renderer/features/PassiveTreeCanvas.tsx` |
| 화면 상태·검색·빌드 편집 | `src/renderer/features/TreeView.tsx` |

게임 계산·노드 효과 판단은 기존 엔진에 남는다. 이 모듈은 표시와 수동 편집을 담당한다.

## v0.1.1 검증

- 앱 단위 검사 52개 통과. 좌표·곡선 11개, 파일 경로·버전·캐시 5개 회귀 포함.
- 실제 Electron 화면 테스트 8개 통과. 1920×1080 / 1024×768에서 지도와 능력치 26행 확인.
- 테스트 PC에서 최초 지도 기하 완성 128ms, 보이는 이미지 40개 완성 1.78초, 메뉴 재진입 132ms. 컴퓨터·저장장치 상태에 따라 달라진다.
- Windows 패키지 재검증도 8개 통과: 기하 139ms, 이미지 40개 완성 2.12초, 재진입 133ms. 패키지 내부 리소스로 확인한 수치다.
- 메뉴 왕복 이후 트리 IPC 1회, 개별 노드 MCP 조회 0회. 엔진 오프라인 상태에서 검증했다.
- 0_1~0_5 이미지·아틀라스 경계·참조·출처 해시 검사 통과. 이미지 로딩 오류 없음.
- 실제 XML의 모든 할당 ID와 표시 연결을 비교하고, 편집·되돌리기 후 원본·다른 섹션 보존을 확인했다.
