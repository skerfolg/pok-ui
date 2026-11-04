# 설치 PoB 연결과 capability 설계

2026-11-03 UI 재구축 설계. 현재 제품 기본 경로는 검증된 고정 PoB0.23.1/5d173cb 번들이다. 아래 설치 연결 UI/준비 트랜잭션은 아직 구현하지 않았다. 기존 source manifest 검증을 설치 경로의 버전 문자열 검사로 대체하지 않는다.

## 설치 선택과 준비

설정에서 고정 번들/별도 설치 사본을 선택한다. 설치를 고른 시점에는 현재 runtime을 바꾸지 않는다. main이 설치 manifest, Sources/Data/TreeData, runtime executable, 실제 경로와 파일 목록을 읽어 후보 정보를 만든다. GUI 설정·사용자 Builds·계정·업데이트 설정은 복사하거나 변경하지 않는다. upstream 설치를 실행 중인 작업 runtime으로 직접 사용하지 않고, 필요한 원본 파일의 검증된 사본을 앱 전용 staging으로 만든다.

후보는 version/branch만으로 지원 판정하지 않는다. adapter profile은 전체 source commit과 파일 집합 digest, worker protocol, 필수 module/API 및 카탈로그 schema를 함께 고정한다. 임의 설치의 commit 근거가 없거나 알려진 profile의 file digest와 다르면 지원되지 않는 후보로 남기며 기본 번들 작업을 유지한다. 내장 profile이 없는 새 버전은 source/API 조사와 합성 회귀 후 profile을 추가한다.

staging에서 전체 byte hash, 실행 파일/플랫폼·전문 모듈, HeadlessWrapper 초기화와 ready/protocol을 확인한다. 합성 문서로 compute, equipment/item-controls, skills/config, tree/calcs/party와 source metadata를 확인한다. 각 기능은 `supported`, `unavailable` 및 이유를 가진다. `supported`는 대응하는 profile/검사 계약을 만족한 경우에만 노출한다. catalog/tree bundle은 같은 source/runtime identity로 새로 준비하며 다른 버전의 데이터를 재사용하지 않는다.

## 교체와 되돌리기

검증 완료 후보를 활성화할 때 host가 요청 접수를 잠시 닫고 실행 중/대기 중 요청을 버전 변경으로 종결한다. 기존 worker를 종료하고 runtime·catalog·tree·inspection·상세 조회 캐시를 폐기한다. 새 bundle identity를 한 번에 저장한 뒤 renderer에 invalidation을 보낸다. renderer의 이전 결과/초안은 원래 source를 표시하며 새 입력으로 재확인하기 전에는 적용하지 않는다. canonical/original XML과 undo 이력은 runtime 교체로 수정하지 않는다.

새 worker 시작 실패 시 이전 검증 번들로 복귀하고 실패 원인을 표시한다. 부분 catalog 교체와 이전 worker 재사용을 허용하지 않는다. 앱 재시작은 활성 bundle identity와 검증 registry를 다시 읽고 byte 검증을 거친다. 현재 지속 worker/manifest invalidation 기초를 재사용하되 후보 staging/활성 registry/rollback은 별도 구현 대상이다.

## 선택 PoK 연결

선택 PoK의 engine identity 자체는 현재도 준비된 engine bundle의 commit/sourceDigest/KB identity와 대조한다. 독립 runtime과 engine 사이는 현재 commit과 실제 release src 파일 byte hash를 추가 대조한다. 독립 manifest를 검증해 얻은 전체 src inventory가 engine의 검증된 bundle inventory 또는 선택 checkout의 실제 파일과 모두 같아야 한다. 위치가 없거나 여러 개이거나 파일이 누락/변조되면 거부한다. sourceProof(runtimeId/commit/files)는 main 내부 계약이며 renderer가 임의 파일 근거를 제출하지 않는다. 네이티브 원본 checkout1537 파일과 거부 경로·bundle 통합 검사는 CURRENT-PLAN을 따른다. 실제 모델/서버 연결 검사는 미수행이다.

설치 연결을 추가할 때 두 실행 경로가 사용하는 **원본 PoB 파일 집합과 동일한 digest 알고리즘**을 정의해야 한다. runtime adapter 파일/worker binary digest와 upstream source digest는 분리한다. 서로 다른 sourceDigest 문자열을 직접 같다고 가정하지 않는다. 현재 구현은 독립 release src의 전체 실제 파일 hash 대조를 별도 근거로 사용하고, engine 자체의 sourceDigest/KB identity 검증도 유지한다. adapter와 VM 바이너리까지 동일하다는 판정은 아니며 설치 profile에서 별도 capability 근거가 필요하다. 버전/commit/sourceDigest/profile이 일치한 경우에만 AI 제안 연결을 허용하며, 불일치·근거 부족은 선택 연결의 명시 상태로 남긴다. 독립 수동 작업은 계속 고정 번들로 수행한다.

## 구현·검증이 남은 항목

설치 선택 dialog와 후보 표시, staging/registry/rollback, capability DTO와 기능 gating, 새 설치 profile의 upstream inventory/adapter/VM 계약, 정상/불일치/중간 파일 변경/교체 실패/이전 응답 회귀, packaged 설치 사본 준비 검사. 이 설계 문서를 설치 연결 기능 완료나 전체 PoB 동등성 근거로 사용하지 않는다.
