# UI 재구축 성능 최종 계측 — 2026-11-03/04

Windows x64, PoB0.23.1/5d173cb, production runtime05950380. 다른 smoke/check를 동시에 실행하지 않았다. OS cache와 일반 OS 부하는 통제하지 않았으며 각 warm 표본은3개다. heavy는 보유 목록/스킬 그룹 직렬화 부하이지 모든 고부하 게임 빌드의 대리표본은 아니다.

## 입력과 host 전략 비교

같은 XML·같은 진단용 Lua 번들에서 재구축 전 host 커밋 `42ad5f0e894d3479f79a5688cc9068b4e621e87a`와 현재 host를 비교했다. 옛 앱 전체를 복원한 결과가 아니라 프로세스/검증 전략을 분리한 비교다. QPC 시계는 별도 `.local/performance-probe-*` adapter에만 추가했고 원본 PoB와 제품 resource는 수정하지 않았다. 양쪽 host의 각 profile/반복 전체 numeric output은 동일했다.

| 입력 | 보유/그룹/노드 | 옛 host warm 중앙값 | 현재 warm 중앙값 | 감소 | 최초 검증 | 현재 process-cold 요청 |
|---|---|---:|---:|---:|---:|---:|
| simple | 0/0/0 | 5977ms | 477ms | 92.0% | 1409ms | 4442ms |
| representative | 11/5/25 | 6006ms | 553ms | 90.8% | 1200ms | 5155ms |
| heavy | 91/32/25 | 6560ms | 636ms | 90.3% | 1025ms | 3783ms |

대표 입력은 level90, 실제 원본에서 슬롯 적합성을 확인한9개 장비, 주얼,25개 저장 node ID,5개 스킬 그룹이다. heavy는 여기에80개 보유 아이템·32개 그룹·8개 비활성 장비 세트를 둔다. 단순 입력은 빈 Ranger다. XML은 개인 데이터 없이 생성하고 SHA를 결과에 기록했다.

## 현재 warm 요청의 분해

QPC wall time이며 복원은 원본 XML load/unique DB 대기, 계산은 BuildOutput, snapshot은 진단·장비·캐릭터·스킬/조건 응답 조립을 포함한다. 합계 외 잔여는 프로세스/전송/직렬화/host 처리이며 독립적인 CPU 시간으로 해석하지 않는다.

| 입력 | 앞/뒤 manifest 합 중앙값 | XML 복원 | BuildOutput | snapshot/진단 조립 |
|---|---:|---:|---:|---:|
| simple | 20.7ms | 358.0ms | 33.5ms | 51.1ms |
| representative | 14.2ms | 394.8ms | 54.0ms | 69.7ms |
| heavy | 14.0ms | 440.8ms | 67.4ms | 71.8ms |

옛 host는 warm 호출에도 매번 약2.3~2.7초의 Lua worker 초기화와 앞/뒤 전체 file hash를 반복했다. 현재 warm은 worker 초기화0ms이며 XML 복원은 계속 수행한다. 검증을 생략한 영구 cache가 아니라 시작/변경/주기 검증 정책을 유지한다.

## 대기열

첫 요청을 실제 native run에 보낸 뒤 revision11/12를 연속 제출했다. 중간 요청은 실행 전 대체되고 최신12만 결과로 반영됐다. 동일 XML로 계산량을 고정했으며 서로 다른 XML의 오염 회귀는 기존 persistent native 검사를 함께 따른다.

| 입력 | 최신 요청 queue | 최신 active | 중간 대체 처리 |
|---|---:|---:|---:|
| simple | 386.2ms | 410.1ms | 0.31ms |
| representative | 649.1ms | 657.0ms | 0.21ms |
| heavy | 610.2ms | 671.1ms | 0.15ms |

## 실제 Windows package UI Paint

현재 production bundle을 실제 exe로 실행했다. CDP trace의 input mark 이후 해당 input 영역을 포함하는 Paint와 변경된 Life 값 영역의 Paint를 기록했다. DOM 조회/두 rAF만으로 Paint라고 주장하지 않는다. trace에서 Paint 순서도 확인했다. 앱 cold는 launch→첫 current 계산이며 time-to-interactive나 OS cold boot를 뜻하지 않는다.

| 조건/입력 | cold app | input Paint 범위 | input→수치 Paint 범위 | 수치 DOM 변경→Paint |
|---|---:|---:|---:|---:|
| 1920x1080 / simple | 7126ms | 1.4~5.8ms | 874~981ms | 1.6~2.2ms |
| 1920x1080 / representative | 10311ms | 2.7~4.9ms | 1205~1731ms | 2.1~3.6ms |
| 1920x1080 / heavy | 8969ms | 10.7~13.4ms | 1399~2196ms | 2.0~3.0ms |
| idle validation refresh / representative | 9744ms | 20.1~20.1ms | 2617~2617ms | 3.9~3.9ms |
| 1024x768 / representative | 8568ms | 1.9~12.7ms | 1083~1536ms | 3.1~4.5ms |

기준은 새 대표 fixture의 옛 host 초기 warm 중앙값6006ms에서 host50% 이상 단축(3003ms 이하), 최종 UI warm3초 이하, 입력 Paint100ms 이내로 정했다. UI 기준은 최종 앱 계측 전에 기록했다. 실제 대표 host553ms, UI1.21~1.73초·수정 후1024에서1.08~1.54초, idle35초 뒤 무결성 재검증을 포함해2.62초로 통과했다. cold app7.1~10.3초는 여전히 개선 여지가 있으며 즉시 준비를 보장하지 않는다.

## 재현과 원시 근거

- `node tests/pob-performance-phases.cjs`: synthetic profile 생성, 고정 legacy host/현재 host, 진단 source hash 검증과 QPC 분해. 임시 legacy TS는 작업 파일을 덮지 않는 wx 생성 후 제거한다.
- `node tests/pob-performance-queue.cjs`: 위 진단 bundle의 실제 active/queued 최신 요청 계측.
- `node tests/performance-ui-desktop-smoke.cjs`: 실제 packaged exe,3profile×3actions/1920. `POK_PERF_PROFILE=representative`, `POK_PERF_WIDTH=1024`로 compact를 선택한다. `POK_PERF_IDLE_REFRESH=1`은35초 idle 후 주기 검증 조건이다.
- `node tests/pob-performance-assessment.cjs`: 기준/현재 bundle identity/모든 결과와 actual Paint 근거를 판정한다.
- `.local/ui-rebuild-review/performance-{inputs,phases,queue,criteria,ui,ui-refresh,ui-compact,assessment}.json`, 각 UI directory의 trace/PNG. 이전 단순 `performance-result.json`은 이력이며 현재 기준으로 쓰지 않는다.

실제 사용자 빌드·모델·원격 서버·모든 엔드게임 조합 성능을 측정한 결과가 아니다. 마지막 notes/slider focus 수정 후 packaged notes6/affix4/workspace9와 최종 compact Paint(입력1.9~12.7ms/수치1.08~1.54초)를 추가 통과했다.
# 사용자 디자인 피드백 반영 뒤 재검증

2026-11-04 최신 polish Windows package에서도 같은 합성3profile·1024×768·각3조작을 단독 계측했다. 실제 input Paint1.283~12.017ms, 입력→현재 Life Paint943.882~1731.091ms이며 대표 입력1227.885/1618.467/1230.146ms다. input100ms/대표3초 기준과 전체 performance assessment가 통과했다. 아래 최초 최종 계측 이력과 구분한다. runtime059와 계산 결과 출처는 동일하다.

