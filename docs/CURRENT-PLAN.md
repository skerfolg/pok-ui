# 현재 작업

## 인계 및 최종 추가 요구 — 2026-10-30

사용자 자리 비움 요청으로 **추가 구현은 중단**하고 이번 결과·요구를 문서화해 `origin/skerfolg/coho`로 인계한다. 상세 재개 절차: [HANDOFF-20261030.md](HANDOFF-20261030.md).

- 확정 요구: **PoK와 pok-ui는 각각 독립 동작한다.** pok-ui의 PoB 수동 편집·계산·저장/복원에 PoK 설치·접속·KB·AI를 필수로 두지 않는 것이 목표다. PoK/AI 생성·조작 연동은 그 이후다.
- 연동 시 양쪽이 실제 사용하는 PoB 버전/commit·출처의 일치/호환성을 확인한다. 미연결과 불일치를 구분하고 결과의 기준 버전을 보존한다. 자동 갱신·검사 우회로 해결하지 않는다.
- **이번에 독립 실행을 구현한 것은 아니다.** 현행 코드/카탈로그/런타임 결합은 남아 있다. 독립 PoB 백엔드의 소유·배포·API 구조는 미결정이며, 다음 세션은 PoB 기능 대응표와 결합 지점 감사/설계부터 시작한다. 현재 `compute_pob_xml` 등의 결합을 최종 제품 구조로 고정하지 않는다.
- 기존 결과 보존 커밋: `87480b5` (`fix: harden engine contracts and revision-safe build proposals`). 최종 인계 문서는 이 커밋 다음의 문서 커밋에 포함한다. 다른 PC에서는 브랜치 tip을 받는다.

## 우선순위 변경 — PoB 편집 작업 완결성이 먼저 (2026-10-30, 사용자 지시)

제품의 선행 목표는 **AI 없이 사용자가 PoB에서 하던 전체 빌드 작업을 pok-ui에서 수행하는 것**이다. PoK/에이전트의 빌드 생성·자동 조작·추천은 그 이후다. 아래 정상화 감사와 안전성 수정은 보존하지만 실제 AI 요청 성공을 편집기 완성의 선행 조건으로 두지 않는다. 현재 UI는 PoB 전체 기능을 제공하는 상태가 아니다.

- 완료 기준을 메뉴 개수나 XML 보존 여부가 아니라 원본 PoB의 사용자 작업별 수행·저장·재열기·계산 일치로 잡는다. 기준 PoB 버전을 명시하고 기능별 구현/부분 구현/미구현/미검증을 나눈다.
- 장비·스킬·패시브·전투 조건·계산 상세·가져오기/내보내기·빌드 관리·노트 등 원본 기능 목록과 UI 대응표를 먼저 만든다. 이 목록은 조사 시작 범주이며 전체 기능 조사 완료를 뜻하지 않는다.
- 현재 확인된 대표 격차: 전투 조건은 기존 input/임의 key 편집 중심이며 PoB의 조건별 선택 UI 전체가 아니다. 젬 이름/레벨/퀄리티/그룹 편집은 있으나 모든 모드·단계·선택지를 사용자가 조작할 수 있는지 미검증이다. 계산 상세는 스탯·진단 표시 중심으로 원본 계산 탭 동등성을 검증하지 않았다.
- 첫 검증 동선은 사용자 수동 작업이다: 빌드 열기→장비/스킬/트리/조건 조작→계산 확인→저장/재시작→PoB에서 다시 열어 편집. AI 없이 성립해야 한다.
- PoB 실행·로딩·Lua·headless 계산·내부 편집 연산의 책임 경계는 유지한다. **AI 연결을 뒤로 미루는 것과 PoB 실행/계산 백엔드가 불필요한 것은 다르다.** UI에서 게임 규칙이나 별도 PoB 실행 경로를 구현하지 않는다. 필요한 원본 기능 API는 엔진 요청으로 분리한다.
- 참고 pob-ai는 로컬 README에서 기존 PoB 창 옆 패널과 PoB 연동을 설명한다. 실제 PoB 창을 사용하는 제품이 원본 기능을 이용하는 것과 자체 UI로 모든 기능을 재구현하는 것은 구분한다. 전체 기능 동등성이나 상대 프로젝트의 의도는 아직 확정하지 않는다.
- 이 방향 반영은 작업 우선순위의 변경이다. 실행 백엔드 교체·원본 PoB 임베딩·저장소/모듈 경계 변경은 결정하거나 구현하지 않았다.

## pok-ui 정상화 — 2026-10-30 (진행 중, 완료 선언 아님)

- UI 작업 브랜치 `skerfolg/coho`, 시작 HEAD `6d595254d175c3a00e8da149b7b6b4704f6343e3`. 시작 시 tracked 변경 없음. 아래 결과는 인계 시 `87480b5`로 커밋했다.
- 작업 시작 시 `git ls-remote origin refs/heads/main`으로 고정한 엔진 기준: `e7bd42993a4b51e7a1dcaeacc579573f6eeef846`. 이후 원격을 자동 추종하지 않는다.
- 공유 엔진 체크아웃은 `codex/generation-controlled-eval`, HEAD `06f4fd2343e0cfb110d09d2e74bd666458c0d556`, 추적 브랜치보다 1커밋 뒤, untracked `.local/` 존재. 공유 checkout의 소스·문서·Git ref를 수정하지 않았다. UI `.local/normalization/engine`에 별도 clone 후 기준 커밋을 detached checkout했다.
- 기준 KB: patch `0.5.4b`, data repo commit `ae31c8567b4dedb658228648071069021ebf0e8a`, manifest SHA-256 `4e4336c35baa64247f63edc708288da2671adba439c37423ad3bc82586135a60`.
- 기준 PoB pin: `5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`. PoB를 갱신하거나 별도 계산 경로를 만들지 않는다.
- **최신 main에는 desktop runtime manifest / identity / `pok.desktop` exporter / `compute_pob_xml` / `render_pob_item`가 없다.** UI에 남아 있는 개발 bundle `pokbundle-56f0f978ff358fa58a2d8465a44e42b3`는 과거 dirty source `4da18c1…` 기준이며 최신 호환·배포 근거로 쓰지 않는다. 최신 기준 runtime manifest는 미생성이다.

초기 감사 분류:

1. 현재 단위 실행으로 확인: XML/비활성 세트/알 수 없는 필드 보존, 편집·undo, revision/hash/bundle 검사, 제안 검토·적용의 host 검증, 취소/질문/승인 어댑터, 저장의 원자성. 기존 기능을 새로 중복 구현하지 않았다.
2. 최신 계약 불일치: parameterless `server_info`에 번들 전용 인자를 보내던 경로, desktop identity와 도구·exporter 부재. 실제 tools/list는 50개였으나 숫자는 고정 계약으로 사용하지 않는다.
3. 기존 문서상 구현·최신 전체 동선 미검증: 실제 모델→현재 빌드 읽기→도구→제안→적용→재계산, restart/resume, 최신 runtime portable, 실제 PoB GUI 편집.
4. 엔진 제약/요청: desktop 계약 누락, Windows stdio server_info 시간 초과, 복원의 무기·부여 스킬·모드/단계 손실. 상세 재현과 필요한 계약은 `NORMALIZATION-ENGINE-REQUESTS.md`에 분리한다.
5. 범위 밖: 엔진/PoB/Lua 실행·편집 연산 구현, 저장소 통합, 다중 공급자·테마·자동 업데이트·macOS 출시, #188 해결 선언.

- [x] 동적 도구 조회 모든 페이지를 원자적으로 교체, 재연결 경합 거부, 새 턴/재개에서 live 목록 갱신. 새 thread에는 고정된 개별 POK 스키마 대신 현재 목록+일반 호출 bridge를 제공한다.
- [x] server_info 선택 인자를 현재 schema에 있을 때만 전달. desktop 계약 누락은 identity/도구명을 포함해 진단하며 버전 검사를 유지한다.
- [x] 첫 stat set 강제 가정 제거, 복원 선택 필요 시 자동 계산 차단, 활성 세트 모호 시 계산 projection 거부. 원문 열기·보존 편집은 가능하다.
- [x] 구조화된 도구 오류·부분 복원 세부 정보를 보존. 도구 승인 대기 중 취소된 턴은 뒤늦게 실행하지 않는다.
- [x] 취소·실패한 턴의 제안 host 폐기, 정상 완료 전 적용 차단. config 미설정/시험용 gem 제안은 원본을 바꾸지 않는 회귀 추가. 검토 목록에 슬롯·스킬 그룹·패시브 ID·조건의 실제 변경 표시.
- [x] 최종 `npm run check`: **128 passed**, 경계·타입 통과 (2026-10-30). 최초 sandbox EPERM은 제품 실패와 분리하고 허용된 실행에서 재검사했다. 재연결 후 늦은 도구 응답을 새 app-server로 보내지 않는 회귀 포함.
- [x] `npm run build` 통과. 실제 Electron 44.5.1에서 최신 도구 누락 진단, 오프라인 편집·저장·재시작·undo와 1920/1024 네 화면 검증 통과. `.local/normalization/desktop-1793345227152/result.json`.
- [x] 엔진 요청서에 입력·출력·취소·진행 계약, 현재 API로 불가능한 이유, 최소 재현과 UI 영향 분리. 실제 추천 준비도 `not_ready`/`contract_missing` 반환 확인.
- [x] `npm run dist:win` 실행: runtime manifest 부재로 사전 검증 중단. 최신 runtime/패키지 성공으로 간주하지 않는다.
- [ ] 대표 지원 빌드의 실제 AI 수정·새 계산, 최신 portable, 실제 PoB GUI. 위 desktop 계약이 준비되기 전 성공으로 간주할 수 없다.
- [ ] 도구 진단에서 요소로 직접 이동·강조, 실제 원안/최종안 측정 비교의 UI 전체 검증, 한국어 실물 변환 API 연동. 이번에는 상세 변경 위치 이름/ID 표시까지만 보강했다.

검증 범위/실패 시도/기존 bundle 사용 제한은 `VALIDATION.md`에 기록했다. 작업 중 공유 엔진이 다른 세션에서 `codex/pok-redesign-blueprint`와 여러 변경 파일이 있는 상태로 바뀐 것을 읽기 전용 관측했다. 그 변경을 수정·정리하거나 이번 기준에 섞지 않았다. UI 결과는 `87480b5`로 보존하며, 당시 감사의 엔진 기준·KB·PoB pin은 유지한다. 현재 공유 엔진의 변경을 검사한 결과로 대체하지 않는다.

최종 API 감사(`.local/normalization/contract.json`, 2026-10-30 07:28 UTC): 동일 pin을 격리 `external/pob/5d173cb`에 준비한 뒤 기존 MCP `compute_pob({build_spec:{class_name:'Sorceress',level:1},stats:['Life']})`도 30초 timeout. server_info/restore 각각 30초 timeout, assemble 추천 게이트의 구조화된 not_ready 반환 확인. 이 제한 시간의 실패를 모든 지원 빌드의 계산 거부/게임 규칙 결함으로 판정하지 않는다. 대표 지원 빌드 성공은 아직 없다.

#188 재평가: 아직 시작 가능한 검증 완료 상태가 아니다. 정상화 작업은 실패와 revision 근거를 보존하는 환경을 보강하며, 생성 품질/최종 구성 재측정의 개선을 입증하지 않는다.

## 앱 시작 시 POK 자동 실행·연결 (2026-10-08)

- [x] main이 앱 시작 단계에서 POK를 한 번 실행하고 연결; renderer는 상태 조회·이벤트 구독만 수행
- [x] 개발은 저장된 엔진 설정 유지, 배포는 저장된 checkout 경로와 관계없이 검증된 bundled runtime 선택
- [x] 배포 화면의 개발 경로 설정을 숨기고, 개발 버튼은 재연결/실패 시 다시 연결 용도로 정리
- [x] 연결 중 화면 재로드 이후에도 동일 엔진 PID 유지; 종료 중에는 검증 후 새 프로세스를 시작하지 않음
- [x] 선택 규칙 회귀 2개, 타입 검사·빌드, 실제 자동 시작/재로드 검사 1회 통과 (50개 도구); 1920/1024 설정 화면 넘침 없음

변경: `src/main/index.ts` 시작 흐름, `src/main/pok.ts` 엔진 선택 규칙, shared/preload 상태 IPC, renderer 연결 표시·설정 화면. 기존 `POK-Local-Test.exe`로 재시작하면 적용된다. 정식 packaged 실행 검증은 다른 PC에서 진행한다.


## POK 연결·베이스 생성 대기 수정 (2026-10-08)

- [x] 연결 확인의 KB 전체 로드를 선택 사항으로 분리; UI 연결 확인에서는 생략 사실을 명시하고 identity 검증 유지
- [x] identity의 반복 Git digest 계산을 범위가 정해진 내용 해시·변경 감지 캐시로 단순화; 과거 checkout 복사본까지 훑던 rglob 패턴을 glob으로 제한
- [x] 연결 확인 15초/아이템 생성 45초의 RPC 제한과 재연결 오류 안내; 연결 완료 전 생성 요청을 UI와 main에서 차단
- [x] 생성 중 연결·빌드·슬롯 변경 시 늦게 도착한 결과 적용 취소
- [x] 관련 UI 회귀 4개 + POK 회귀 3개만 실행, 타입 검사·빌드 통과; 전체 suite 미실행(사용자 요청)
- [x] 실제 MCP 연결 18.6초, base 렌더 2.4초. 실제 앱 연결 약 20.6초 후 Iron Ring을 Ring 1에 장착하고 revision 1 저장 확인
- [x] 검증된 기존 트리 변환 캐시를 재사용해 local bundle 출처 갱신; 원본 해시 검사 유지

변경 파일: `src/main/pok.ts`, `src/main/index.ts`, `src/renderer/App.tsx`, `src/renderer/features/EquipmentView.tsx`, POK `src/pok/mcp/server.py`, `src/pok/pob/runtime_identity.py`. 런처가 읽는 `dist`를 재빌드했으므로 기존 로컬 exe로 실행한다. 사용자 작업 데이터는 변경하지 않았다.


## POK 고정 PoB 기반 데이터·편집 통합 (2026-10-08)

상태: S1~S7 및 거래 검색 스킬 배포 포함 구현 완료. 이 PC에서는 코드·테스트·로컬 실행용 런처를 검증하고, 정식 배포와 소스 없는 패키지 검증은 다른 PC에서 수행한다(사용자 지시). PoB 핀 변경·KB 재수집 없음.

- [x] S0: 원격 최신 기준 확인, 작업 브랜치와 기준 회귀 검사 확보
- [x] S1~S3: POK 원본 exporter, runtime identity/portable 빌더, UI bundle/lock/출처·해시 검증 구현
- [x] 실제 고정 PoB에서 카탈로그 13,945개·직업 8개와 트리 0_1~0_5 생성
- [x] S4~S5: 직업·전직/아이템·접사·변형/젬 선택, 원본 XML 보존, 생성·장착 일괄 편집과 undo
- [x] S6: 직접 XML 계산 및 원본 PoB parity, 입력 revision/hash/bundle 귀속, 검사 미실행 진단 보존
- [x] S7: AI 카탈로그 조회, main의 제안 등록·기준 검증·적용, 연결 변경 시 오래된 제안 무효화
- [x] 개발 checkout 묶음 생성과 배포 경로의 checkout 거부 검증
- [x] S8 일부: Electron 44.5.1 실제 데이터·화면 1920×1080/1024×768 및 리소스 불변 검증
- [x] S8 일부: 실제 Electron→MCP 연결·base 아이템 생성·장착 저장 확인
- [ ] S8 잔여: 전체 계산·AI 제안의 배포 환경 통합 검증
- [ ] S8: production bundle/lock 생성, 소스 없는 Windows 패키지 실행과 리소스 불변 검증
- [ ] 실제 모델 추론을 포함한 AI 제안 end-to-end 검증

현재 확인: UI 검사 89개, POK 전체 단위 1,321개 통과·2개 skip, 새 XML/아이템 실제 PoB 통합 4개 통과. 최종 추가 변경의 검사 결과는 [검증 기록](VALIDATION.md)에 기록한다.

현재 실행 환경: 생성 runtime 12,015개 중 323개에서 Node 읽기 오류(EBADF)를 관측했지만, 이를 문서 암호화로 확정하지 않는다. 사용자는 보안 프로그램이 .doc 같은 문서 유형을 암호화한다고 설명했다. 코드/JSON/Lua는 일반 소스로 처리하고 별도 DRM 처리·해시 우회를 추가하지 않는다. 정식 배포는 다른 PC로 이관하며, 이 PC에서는 체크아웃을 여는 `release/local-test/POK-Local-Test.exe`를 제공한다.

- [x] POK의 기존 trade-search 진입점·정본 절차·실행기를 runtime에 포함하고 source digest에 귀속
- [x] 챗봇 프로세스에 Python·사용자 데이터·캐시 경로 전달; 기본 승인 정책 유지
- [x] 실제 Codex의 staged skill 발견·활성화 및 networkless prepare 실행 확인
- [x] Windows 로컬 테스트 런처 생성 및 --check 통과
- [x] 갱신된 개발 bundle 설치 후 테스트 런처의 실제 창 실행 확인 (13,945 항목·직업 8개 ready)

이번 변경은 스킬 검색 로직을 복제하지 않는다. 생성 실행파일·개인 경로·진단 파일은 Git 제외하며, 커밋·푸시는 하지 않는다.

```mermaid
flowchart LR
  A[POK 원본·identity·XML 계산]:::done --> B[UI 카탈로그·편집·AI 기준 검증]:::done
  B --> C[개발 checkout 화면·리소스 검증]:::done
  C --> D[로컬 테스트 실행파일]:::done
  D --> E[다른 PC에서 정식 패키지 검증]:::pending
  classDef done fill:#243d31,stroke:#65967d,color:#fff
  classDef active fill:#4b4025,stroke:#bca46c,color:#fff
  classDef blocked fill:#512c2c,stroke:#c47c7c,color:#fff
  classDef pending fill:#272c34,stroke:#687383,color:#fff
```

## GitHub 저장소 연결 (2026-10-07)

- [x] `https://github.com/skerfolg/pok-ui.git`를 origin으로 연결하고 기존 main의 MIT 라이선스 이력 보존
- [x] 공개 대상 점검: 개인 XML·대화·세션·실행 파일·생성 리소스 제외, 문서의 개인 빌드명 일반화
- [x] 앱 검사 52개와 프로덕션 빌드 통과
- [x] `codex/desktop-v1` 브랜치 푸시 및 main 대상 [PR #1](https://github.com/skerfolg/pok-ui/pull/1) 생성

```mermaid
flowchart LR
  A[원격 이력 보존]:::done --> B[게시 대상 검토]:::done --> C[검사 및 빌드]:::done --> D[브랜치 푸시 및 PR]:::done
  classDef done fill:#243d31,stroke:#65967d,color:#fff
  classDef active fill:#4b4025,stroke:#bca46c,color:#fff
```

## v0.1.1 패시브 트리 수정

- [x] PoB 소스 기준 좌표·직선·곡선과 63개 누락 연결 복원
- [x] 노드별 MCP 요청 제거, 정적 일괄 로드·버전 캐시
- [x] 원본 DDS/Zstandard 이미지 변환·아틀라스 및 0_1~0_5 배포 리소스
- [x] 실제 Electron 검색·확대·이동·편집·undo·캐시 성능 및 1920/1024 검증
- [x] Windows v0.1.1 포장 및 패키지 재검증

```mermaid
flowchart LR
  P[PoB 소스 대조]:::done --> G[4914 노드 · 5149 연결]:::done --> I[원본 지도 이미지]:::done --> T[실제 UI 검증]:::done --> R[Windows 패키지]:::done
  classDef done fill:#243d31,stroke:#65967d,color:#fff
  classDef active fill:#4b4025,stroke:#bca46c,color:#fff
```

세부 원인과 검증 수치는 [패시브 트리 기록](PASSIVE-TREE.md)에 남긴다.

완료: 앱 검사 52개, 소스 Electron UI 8개, 패키징된 Electron UI 8개 통과. `release/0.1.1/POK-0.1.1-win-x64.exe` 생성. 이 PC에서 패키지의 첫 지도 표시는 약 2.12초, 메뉴 재진입은 약 0.13초였다.

## POK Desktop v0.1.0

- [x] 1차 디자인 기준 확정 및 별도 UI 저장소 경계 정의
- [x] 디자인 토큰/배치/표현과 상태/문서/네이티브 어댑터 분리
- [x] 6개 메뉴, 편집 가능한 대화 목록, XML 가져오기/편집/저장
- [x] MCP 엔진 연결, 리비전 기반 계산, Codex app-server 어댑터
- [x] 엔진 frozen Windows 런타임 생성 및 소스 밖 실행 검증
- [x] XML 보존·저장·에이전트 테스트 및 화면 반응형 검증
- [x] Windows portable 패키지 생성과 패키징된 앱 최종 실행 검증

```mermaid
flowchart LR
  A[1차 디자인 확정]:::done --> B[계층 분리]:::done --> C[화면·편집 구현]:::done
  C --> D[실제 XML·저장·엔진 검증]:::done --> E[Windows 배포 검증]:::done
  E --> F[후속: Claude·POK 스킬 배포 검증·macOS]
  classDef done fill:#243d31,stroke:#65967d,color:#fff
  classDef active fill:#4b4025,stroke:#bca46c,color:#fff
```

코드 서명, 공개 게시, 자동 업데이트와 전체 PoB 기능 동등성은 이 초안의 완료 조건이 아니다. 엔진 변경은 별도 `codex/pok-desktop-runtime` 브랜치에 있고 기존 엔진 main은 수정하지 않는다.

최종 결과: 앱 검사 36개 통과, 엔진 단위 1,276개 통과, 1920/1024 레이아웃과 패키지의 저장·재시작 검증 통과. `release/POK-0.1.0-win-x64.exe` 생성. 상세 범위와 계산 제한은 [검증 기록](VALIDATION.md)에 남긴다.

## 채팅 제어·POK 연결 표시 보완 (2026-10-08)

- [x] 네이티브 창 버튼을 유지하는 테마 제목 표시줄, 기본 Electron 메뉴 제거
- [x] 실제 Codex 모델 목록·추론 강도, 이미지 선택/붙여넣기/드롭, 응답 중지
- [x] blocking 질문과 비동기 질문의 선택지·직접 답변 및 후속 턴 연결
- [x] 새 응답의 완료 시각·소요 시간·첫 토큰 시각 저장, 조회 진행 표시
- [x] main의 실제 MCP 종료·시간 초과를 설정/사이드바에 즉시 반영; 실행 중 server_info 중복 요청 병합
- [x] 연결 확인의 중복 Git 호출 제거; POK KB의 Windows Git pipe 대기 문제를 파일 stdout으로 수정
- [x] 합성 대화 기반 Electron 검증, 실제 설치 Codex 모델 조회/스레드 시작, 1920×1080·1024×768 화면 확인

핵심 변경: main의 agent/pok/chat-images/window-chrome, shared/preload 계약, App/ChatView/질문 카드/시간 표시. 연결된 POK는 main의 관리 브리지를 사용하고 별도 pok MCP 설정은 비활성화한다. 이는 이중 연결 예방이며 과거 오류 원인이 이중 연결이었다고 단정하지 않는다. POK 변경은 server.py와 kb/store.py에 있다. 새 의존성은 없다.

남은 제한: 이 PC의 실제 첫 KB 조회는 53.2초였다. 모델 추론 속도는 별도이며 실제 유료 추론 턴은 이번 검증에 포함하지 않았다. 기존 대화에는 완료 시각이 없으므로 새 응답부터 적용한다. 정식 패키징은 다른 PC에서 진행한다.

## 다른 PC 인계 — 2026-10-08

- 사용자 요청으로 이 작업을 커밋·푸시한다. UI 브랜치: skerfolg/coho. 대응 POK 브랜치: codex/pok-ui-bundle, 커밋 a05e540b681c7f18595ad0b5c6c3bf2c151dba5f.
- 두 저장소를 함께 갱신해야 한다. PoB는 5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6에 고정되어 있다. 최신 PoB를 별도로 받지 않는다.
- 각 저장소에서 git fetch origin 후 해당 작업 브랜치를 checkout한다. UI에서는 npm ci를 실행하고 POK 개발 환경 및 고정 PoB checkout을 준비한다.
- 생성 데이터·runtime·dist·실행파일·사용자 대화는 Git에 넣지 않았다. 커밋 이후 source identity가 바뀌므로 집 PC에서 docs/DATA-BUNDLE.md에 따라 checkout 묶음 또는 production runtime과 묶음을 다시 생성한다. 기존 묶음의 출처 검증을 우회하지 않는다.
- 개발 실행: bundle:prepare-checkout → npm run build → npm start. 정식 배포: POK scripts/build_runtime.py → UI bundle:prepare --write-lock → 검증 → dist:win. 각 명령의 경로 인자는 집 PC 환경에 맞춘다.
- 남은 확인: 실제 모델 추론/질문 왕복, 첫 KB 조회 성능, 소스 없는 Windows 배포 실행. 이 PC에서는 변경 영역 회귀·빌드·실제 Electron 합성 채팅/엔진 흐름까지 확인했다.
