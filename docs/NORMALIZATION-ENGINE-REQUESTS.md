# UI 정상화: 엔진 측 요청 — 2026-10-30

이 문서는 UI 저장소의 재현·요청서다. 엔진 소스·문서·브랜치를 수정하지 않았다. PoB 실행·Lua 어댑터·headless 계산·내부 편집 연산은 엔진 책임이며 UI에 대체 구현하지 않는다.

## 고정 기준과 재현

엔진 기준은 작업 시작 시 원격 main `e7bd42993a4b51e7a1dcaeacc579573f6eeef846`. KB patch `0.5.4b`, data commit `ae31c8567b4dedb658228648071069021ebf0e8a`, PoB pin `5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`. 실행 코드는 UI의 gitignored 격리 clone에 고정하고, 설치된 Python의 의존성을 사용한다. 공유 엔진 checkout을 실행·갱신하지 않는다.

```powershell
$env:POK_SMOKE_ENGINE_ROOT = '<기준 커밋으로 고정한 격리 clone>'
$env:POK_SMOKE_PYTHON = '<의존성이 설치된 Python>'
node tests/engine-contract-smoke.cjs
```

스크립트는 MCP API만 사용하며 합성 XML/스펙만 전달한다. tools/list 스키마와 각 API 결과를 `.local/normalization/contract.json`에 기록한다. server_info의 source_root는 저장하지 않는다. 상세 원본 응답은 gitignored 증거이고 제품 fixture/배포 입력이 아니다. 격리 clone 내부의 엔진 캐시·telemetry 생성은 엔진의 기존 동작이다.

## 1. 최신 main에 desktop 기능이 없음 — 최우선 계약 요청

실제 stdio tools/list는 50개였으며 `compute_pob_xml`, `render_pob_item`는 없다. 소스에도 `pok.desktop`, UI catalog exporter, runtime identity 및 portable runtime 생성 경로가 없다. 현재 UI가 사용하는 별도 개발 bundle은 과거 desktop 작업 소스의 dirty identity이므로 이를 최신 main인 것처럼 표시할 수 없다.

현재 API로 불가능한 이유:

- `compute_pob`는 `build_spec`을 받는다. 원본 XML의 알 수 없는 필드·비활성 세트를 그대로 계산하는 API가 아니다.
- `restore_pob_spec`는 손실/결정 필요를 반환하는 복원 API다. XML 직접 계산이나 원문 생성·카탈로그 provenance를 대체하지 않는다.
- `assemble_pob`는 엔진 build_spec의 조립·검증·산출물 기록이다. 임의 XML의 손실 없는 편집·계산 API가 아니다.
- 기존 `GameDataStore`는 카탈로그·KB·PoB·실행 identity를 함께 검사한다. UI에서 임의 identity 생성, 과거 bundle 재사용, 검사 생략으로 연결하지 않는다.

필요한 계약(새 도구명을 UI에서 강제하기보다 기존 desktop 작업의 통합/동등 API를 엔진에서 결정):

| 영역 | 입력 | 출력·보장 | 취소·진행 |
|---|---|---|---|
| runtime/카탈로그 | 고정 source commit, KB manifest/content, PoB pin, 출력 staging | portable manifest, 파일 해시, source identity, capability, 같은 원본에서 추출한 catalog/tree metadata | 준비 단계별 진행, 실패 시 기존 입력 보존, 임시 생성물만 정리 |
| XML 계산 | 원본 XML, 명시한 활성 구성·주력/모드/단계, 요청 stats, 요청 식별자 | 실제 계산 stats + 원본/계산 입력 hash + 엔진 identity; 부분/미지원/선택 필요·적법성·능력치·획득·소켓·config 유지비·준비도 근거. 저장 PlayerStat와 구분 | MCP cancellation/progress 지원 범위 명시; 취소 후 최종 결과·후속 변경 처리, 프로세스 종료 필요 여부 명시 |
| 아이템 원문 | 같은 catalog ID, variant/roll 등 현재 엔진이 검증하는 입력 | 계산 가능한 PoB 원문 + 적법성/미지원 진단, 소켓·획득 근거 | 요청 식별/진행, 취소/오류 시 사용자 빌드 불변 |

UI 영향: 최신 기준의 verified 연결·원문 생성·계산·AI 적용 후 재계산·portable 완료 조건이 막혀 있다. UI는 부족한 도구 이름을 호환성 오류로 표시하고 기존 XML 열기·보존 편집·내보내기를 유지한다. 엔진이 위 계약을 제공하면 UI의 기존 연결·bundle 준비 경로에서 다시 검증해야 한다.

## 2. server_info / 복원 응답 지연 — 실행 환경 재현

실제 MCP initialize와 tools/list는 성공했다. `server_info {}`는 UI 제한 15초 및 독립 MCP 제한 120초에서 timeout이었다. 따라서 loaded/source commit, stale 여부, server_info 반환의 실제 내용은 이번 실행에서 확인하지 못했다. 소스 계약은 `server_info()`(입력 properties 없음)이며 UI의 과거 `include_kb_diagnostics:false`는 최신 API에 적합하지 않았다. UI는 현재 schema가 지원할 때만 이 옵션을 보낸다.

합성 XML의 `restore_pob_spec {build_code, assume_first_stat_set:false}`도 30초 제한에서 timeout이었다. 이 관측만으로 모든 지원 빌드가 복원 불가하거나 엔진 알고리즘이 틀렸다고 판단하지 않는다. server_info는 KB를 로드하고 Windows Git capture 경로도 사용한다. 어느 단계의 지연인지는 이번에 확정하지 않았다. timeout 증가·Git/KB 검사 우회를 제품 해결책으로 넣지 않았다.

요청: KB 로드와 분리된 bounded identity/health 응답, cold 준비 단계의 progress, timeout·cancel의 작업 종료 여부. 필요한 경우 engine-side stack/단계별 시간 측정으로 원인을 나눈다. 현재 UI는 timeout을 연결 오류로 보존하며 계산 성공으로 바꾸지 않는다.

후속: 기존 로컬 PoB cache의 HEAD가 정확히 pin과 같음을 확인하고 Git archive를 격리 clone의 기존 `external/pob/5d173cb` 위치에 풀었다(공유 cache는 읽기만 함). 기존 MCP `compute_pob`에 `{build_spec:{class_name:'Sorceress',level:1},stats:['Life']}`를 보낸 최종 감사도 30초 timeout이었다. 이 한도는 감사의 제한 시간이며 UI의 장기 계산 한도와 다르다. `assemble_pob`의 추천 게이트는 실제로 `not_ready`, `contract_missing`, `optimization_contract` 경로와 qualification을 반환했다. 이 성공은 게이트 응답 성공이며 계산 성공이 아니다. 원인은 stack으로 확정하지 않았다.

## 3. 현재 build API와 큰 응답

- tools/list 실제 입력: `restore_pob_spec(build_code, assume_first_stat_set=true)`, `compute_pob(build_spec, stats?)`, `assemble_pob(build_spec, slug, stats?, purpose='exploration')`.
- `build_spec`은 임의 키를 허용하는 JSON schema이고 실제 키는 엔진에서 검증한다. `class_name`이 현재 키다. 감사 하네스 최초 입력의 `class` 오류는 하네스 오류이며 엔진 결함으로 분류하지 않았다.
- 소스 확인: 복원은 `build_spec`, `notes`, `needs_decision`, `faithful`, `dropped_item_granted`, `damage_comparable` 반환. UI는 이를 보존하고 첫 모드 강제 가정을 제거했다. `needs_decision`이 있으면 자동 계산하지 않는다. UI에서 누락 단계/모드를 생성하지 않는다.
- 최신 MCP는 큰 결과를 `stored_tool_result`와 `get_tool_result` 참조로 넘긴다. 일반 bridge는 참조 envelope를 그대로 전달한다. 도구 스키마는 동적으로 읽으며 결과를 완성 추천으로 바꾸지 않는다. 실제 큰 비교 결과를 UI 전체 동선에서 재구성하는 검증은 남았다.
- `assemble_pob purpose='recommendation'`의 미준비 거부는 계산 실패·완성 추천과 구분해야 한다. UI는 엔진 반환 원문과 구조를 보존한다. recommendation gate를 우회하거나 exploration을 완성 추천으로 바꾸지 않는다.

## 4. 한국어 실물 입력 — 미지원 경계

엔진의 한/영 KB 검색은 한국어 복사 아이템의 PoB 원문 변환 계약과 다르다. 기준 엔진 도구 목록에는 게임 복사 아이템을 번역·정규화하고 미변환 줄을 반환하는 전용 API가 없다. UI의 원문 편집은 한국어 텍스트도 그대로 보존하지만 계산 반영을 보증하지 않는다. 실제 사용자의 실물 복사 입력 검증은 미수행이다.

요청: raw clipboard text + locale 입력, 엔진의 지원 여부/변환된 원문/줄별 변환·미지원·계산 반영 상태를 반환하는 계약. 원문을 보존하고 미지원 줄은 조용히 버리지 않아야 한다. 번역 데이터·게임 규칙·PoB 아이템 파싱을 UI로 옮기지 않는다.

## 참고 프로젝트 적용 범위

로컬 pob-ai의 `src/runtime.mjs`(요청 직렬화)와 `adapter/ops/calc.lua`(what-if config/gem 복원 경로)를 직접 읽었다. 그 실행·Lua 구현은 UI로 복사하지 않았다. UI에서는 실패/취소된 제안 원본 불변, 미설정 config와 시험용 gem의 비적용, 복합 변경 검토를 회귀 대상으로 삼는다. 실제 PoB 내부 상태의 what-if 롤백 검증은 엔진 측 작업이다.

## 완료 판단

현재 최신 기준의 대표 빌드 계산→실제 AI 수정→적용→새 계산은 성공하지 않았다. 오류 표시·단위 검사 성공을 전체 정상화 완료로 바꾸지 않는다. 실제 모델/portable/PoB GUI 검증도 대신 주장하지 않는다. #188은 해결 선언하지 않으며, 최신 verified workspace가 연결된 뒤 최종 구성·미해결 근거·실물 피드백을 동일 revision에서 다시 측정해야 재평가할 수 있다.
