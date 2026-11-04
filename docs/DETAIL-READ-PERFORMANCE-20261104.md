# 상세 조회 지연 개선 — 2026-11-04

사용자 제보: 계산 근거나 아이템 hover에서 `원본 비교 확인 중…` 등의 표시 후 실제 내용이 늦게 나타났다.

## 원인과 변경

- ItemHover/옵션/Calcs 진입에250ms 지연이 있었고, tooltip/Calcs는 같은 XML도 매번 복원하고 BuildOutput을 다시 호출했다. 완료 결과는 재사용하지 않았으며 hover 닫기 때 renderer의 결과도 사라졌다.
- 원본 계산은 그대로 두고, 상세 worker에서 같은 XML의 Calcs/tooltip 읽기 전용 컨텍스트만 재사용한다. 편집/다른 작업·다른 XML·실패 시 컨텍스트를 무효화한다. 주 계산은 계속 요청마다 원본 XML을 복원하며 상세 worker와 분리한다.
- main의 완료 조회 캐시는 payload/실제 runtime identity에 결합한다. 반환은 clone이고64개로 제한하며 매 조회 시 기존 source 검증 정책을 유지한다. source 변경/프로토콜 오류/종료 시 폐기한다. mutation/popup/유사 검색을 결과 캐시로 처리하지 않는다.
- renderer는 검증한 item/slot/socket/cell·build/revision/XML/runtime별 응답을 읽기 전용으로 보관한다. 중복 요청을 병합하며12MB/256개로 제한한다. source 무효화 시 결과/진행 중 응답을 폐기한다. 다른 입력의 값을 새 결과로 재표시하지 않는다.
- 주 계산의 같은 snapshot에서 원본 formatter/요구량으로 아이템 표시 정보도 수집한다(최대128개). 옵션 본문은 hover마다 비교 계산이 끝나기를 기다리지 않는다.
- 완료된 현재 주 계산 뒤 상세 table/장착 대상과 자주 쓰는 근거를 한 요청씩 낮은 우선순위로 미리 읽는다. 새 입력/build owner 변경 시 추가 prefetch를 중단한다. 이미 준비된 UI는250ms 대기나 불필요한 loading 상태를 만들지 않는다.

## 실측

Windows x64 / 원본 PoB0.23.1, commit5d173cb 고정. 동일 합성 equipment XML로 before/after를 기록했다. source runtime은 before b426, after3ed다. 원본 PoB 소스나 게임 규칙을 변경하지 않았다.

| 네이티브 호출 | 이전 | 개선 후 |
|---|---:|---:|
| 같은 아이템 재조회(3회) |517~592ms|15~17ms|
| 다른 아이템(같은 XML) |577ms|48ms|
| Calcs table(같은 XML) |629ms|35ms|
| 첫 breakdown 셀 |1034ms|30ms|
| 같은 셀 재조회(3회) |485~554ms|11~16ms|
| 다른 셀(같은 XML) |490ms|29ms|

첫 worker 시작은 before3.64초/after4.24초로 이 측정에서 개선되지 않았다. 첫 실행/새 입력의 첫 컨텍스트 준비 비용은 남는다. 미리 읽기와 동일 입력 재사용으로 이를 매 hover마다 지불하지 않게 했다. OS cache/일반 부하는 통제하지 않았으며 소수 관측을 모든 PC/빌드의 보장으로 해석하지 않는다.

실제 packaged renderer에서 검증된 갑옷 tooltip 재진입3회는32/35/36ms였고 임시 비교 문구가 노출되지 않았다. Calcs 근거 재열기는115ms로 관측했다. 상세 native 요청을 의도적으로 막아 둬도 주 입력 변경은1.48초에 현재 숫자에 도달했으며 늦은 상세 응답이 새 revision을 덮지 않았다.

## 정확성 근거

- `pob-detail-reuse-smoke`: XML을 매번 복원하는 별도 private reference adapter와 Calcs/Breakdown·두 아이템 비교를 번갈아 대조해 동일함을 확인했다. 편집 what-if/다른 XML 뒤에도 원래 모든 numeric output이 일치했다.
- 반환 clone 변경이 캐시를 오염시키지 않으며 캐시가 있어도 실제 runtime byte 변경을 거부했다. reference는 `.local` 복사본에만 진단 한 줄을 넣었고 upstream 파일은 바꾸지 않았다.
- renderer 캐시 unit은 동일 요청 병합, XML/revision/runtime 분리, immutable 결과, source 무효화 후 늦은 응답 폐기를 검증한다.
- 로그/원시 결과: `.local/ui-rebuild-review/detail-performance-{before,after}.json`, `detail-reuse.json`, `detail-*.log`. 실제 UI 결과 디렉터리는 CURRENT-PLAN 최신 절에 기록한다.
