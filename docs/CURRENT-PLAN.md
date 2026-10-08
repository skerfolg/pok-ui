# 현재 작업

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
