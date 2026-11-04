# PoB 실행 방식·반응 속도 비교 — 2026-11-03

현재 작업 트리의 소스 감사와 합성 입력 측정이다. 제품/공유 엔진/원본 PoB 소스는 수정하지 않았다. 기존 미커밋 작업과 UI 재설계 승인 대기를 유지한다.

## 현재 pok-ui

Electron renderer → IPC → `PobRuntime` → LuaJIT → 원본 `HeadlessWrapper.lua` → 얇은 Lua 어댑터. PoK/KB/AI 없이 원본 PoB로 계산한다.

`src/main/pob-runtime.ts`의 `request`는 단일 대기열을 사용하고 요청 전후 `manifest()`를 호출한다. 매번 전체 파일의 실제 SHA256을 확인하며 결과 캐시가 없다. `run`은 매 요청 프로세스를 생성하고 ready를 기다린 뒤 명령을 보낸다. 응답 후 stdin을 닫고 child를 종료한다. worker 자체는 여러 요청을 읽는 루프지만 host가 재사용하지 않는다.

`runtime/pob/editor.lua`는 XML을 원본 로더로 복원하고 unique DB 준비를 기다린다. 장착·무기 전환은 `EquipmentView.tsx`에서 원본 연산 후 별도 `computeBuild`를 호출한다. revision 변경은 `useEquipmentState`와 전역 `usePobInspection`의 조회도 유발한다. 각 hook의 debounce는 250ms다. 입력 귀속 검사는 있으나 cold 실행·대기열 비용을 없애지는 못한다.

## pob-ai 현재 소스

GitHub API로 확인한 main: **`c9d416d245e6c56489bbcb0cc62a35ee00adb2b1`**. 과거 로컬 리뷰 사본 대신 이 커밋의 아래 파일을 읽었다.

- [runtime.mjs](https://github.com/tjdcks12/pob-ai/blob/c9d416d245e6c56489bbcb0cc62a35ee00adb2b1/src/runtime.mjs): 연결된 PoB 창에 명령을 전달한다. headless 모드에서는 Engine을 한 번 시작해 재사용한다. 세션 파일은 최초 복원/변경 후 저장에 사용한다. 명령은 이쪽도 직렬화한다.
- [engine.mjs](https://github.com/tjdcks12/pob-ai/blob/c9d416d245e6c56489bbcb0cc62a35ee00adb2b1/src/engine/engine.mjs): child와 ready promise를 유지하고 요청 ID를 증가시키며 같은 프로세스에 명령을 보낸다.
- [bridge-server.mjs](https://github.com/tjdcks12/pob-ai/blob/c9d416d245e6c56489bbcb0cc62a35ee00adb2b1/src/live/bridge-server.mjs): socket 연결을 유지하며 실행 중인 PoB가 프레임 사이에 명령을 처리한다. 원래 PoB UI의 수동 작업 경로를 활용하는 구조다.
- [locate.mjs](https://github.com/tjdcks12/pob-ai/blob/c9d416d245e6c56489bbcb0cc62a35ee00adb2b1/src/pob/locate.mjs): 설정/설치 위치에서 PoB를 찾고 manifest의 version/branch를 읽는다. runtime의 `refreshInstall`은 설치 캐시와 엔진을 폐기해 다음 사용 시 다시 준비한다. 모든 과거·미래 버전의 내부 API 호환성을 보장하는 것은 아니다.

핵심 차이는 버전 문자열이나 직렬화 자체보다 프로세스·로드 상태 재사용이다. 참고 프로젝트 GUI/headless를 같은 조건에서 직접 실행한 속도 비교는 수행하지 않았다.

## 실제 측정

현재 미커밋 작업 트리, Windows, PoB **0.23.1 / `5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`**, runtime **`pob-af5e39950789293ad0ff4a902d527cdccb9e7383b413507920ea5346bab3bcac`**, manifest 1713파일. 개인 데이터 대신 기존 factory의 빈 Ranger/트리 0_5 XML, PoK/KB 비사용. OS 캐시/시스템 부하를 통제한 통계 시험은 아니다.

| 현재 앱 runtime 경로 | 전체 | 사전 검사 | worker 실행 | 사후 검사 |
|---|---:|---:|---:|---:|
| 최초 getInfo | 7154ms | 7154ms | — | — |
| compute 1 | 7076ms | 1448ms | 4217ms | 1391ms |
| compute 2 | 6164ms | 1433ms | 3447ms | 1274ms |
| compute 3 | 6489ms | 1330ms | 3839ms | 1313ms |
| inspect | 5535ms | 1320ms | 2941ms | 1266ms |

worker 실행에는 spawn/초기화/XML 복원/계산/통신이 모두 포함된다. 순수 계산 시간이 아니다. 기타 host 처리/반올림 때문에 단계 합과 전체에 작은 차이가 있다.

별도 진단에서 **같은 기존 worker**를 한 번 시작하고 같은 XML의 compute 세 번을 보냈다. ready **3467ms**, 이후 요청 **383 / 331 / 369ms**였다. 각 요청은 기존 `editor.load(xml)`을 그대로 실행했다. XML 전체 복원을 유지해도 프로세스 재사용이 유의미하다는 근거다. host 무결성 검사/대기열/Electron/UI 반영은 포함하지 않는다. 앱 개선 완료나 모든 빌드 0.3초 보장이 아니다. 진단 worker는 종료했다.

ignored 로컬 재현: `.local/performance-review/measure.cjs`, `result.json`, `warm-probe.cjs`, `warm-result.json`. 테스트에서 instance 메서드를 감싸 계측했으며 제품 계측 코드는 추가하지 않았다.

## 승인 후 구현 우선순위

1. 독립 PoB 프로세스를 세션 단위로 재사용한다. 우선 요청별 XML 복원은 유지하고 crash/timeout/cancel 시 폐기·재시작한다. request/build/revision/XML hash/runtime 귀속과 실패/what-if/취소 후 상태 오염 회귀를 검증한다.
2. 전체 무결성 검사를 시작/준비/버전 교체 시 수행하고 검증 결과 재사용·변경 감지·명시 재검증 정책을 정의한다. 검사를 무조건 제거하지 않는다.
3. 편집→계산→요약/진단 응답을 묶고 같은 revision의 중복 조회를 줄인다. 대기 중인 오래된 조회/계산을 최신 입력으로 대체한다. 느린 상세 조회가 최신 요약을 막지 않게 한다.
4. 정상 입력 자동 반영·재계산과 파일 저장을 분리한다. 입력 반응은 즉시 제공하고 계산 중/이전 revision/오류를 구분한다. 목업의 100ms 반응은 목표이며 실측 성과가 아니다.
5. 검증된 번들을 기본으로 두고 설치 PoB 연결은 version/branch/API 가용성/데이터 출처를 확인한다. 버전 전환 시 프로세스·카탈로그·조회 캐시를 폐기한다. 선택 PoK 연결 시 양쪽 PoB 출처 호환성을 별도 확인한다.

원본 XML/비활성 구성·unknown/undo 안전성을 유지한다. 제품 개선·실물 빌드·원본 GUI/배포 앱 체감 성능 검증은 아직 수행하지 않았다.
