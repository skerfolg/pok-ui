# 현재 작업

## PoK 큰 결과 참조 호환 — U0 (2026-10-31)

브랜치: `codex/pok-result-transport`, 기준 main `d3817f6`.
PoK R0~R7 재설계의 현행 소비 계약 정상화 작업이다. 새 설계 기록 계약이나
전체 R6 앱/모델/번들 통합을 완료했다는 뜻은 아니다.

- [x] 기존 자동 계산이 `stored_tool_result`를 실제 복원 결과로 읽지 못하는 회귀 재현(신규3실패)
- [x] 자동 연결/계산 경로만 JSON 페이지 회수·원문 SHA256·연결 세대 검증
- [x] Python Unicode 오프셋·부동소수점 표기의 실제 PoK 합성 fixture 검증
- [x] 변조/무진행 페이지·재연결·구형 엔진·크기 한도·정규화 원문 참조 회귀
- [x] `npm run check`: 경계·타입·64개 테스트 통과
- [x] 최종 프로덕션 빌드 통과
- [ ] 변경 리뷰/PR 준비
- [ ] 최신 실제 PoK/모델/번들로 앱 통합 검증(재설계 R6에서 수행)

일반 에이전트 도구 응답은 작은 참조를 유지한다. 자동 회수는 64 MiB/25,000페이지
상한을 초과하면 명시적으로 실패하며 요약을 계산 결과로 사용하지 않는다.
한 결과의 최초 호출과 모든 페이지 회수는 단조 시계 기준30분 예산을 공유한다.
원본 XML·화면 배치·게임 규칙은 변경하지 않는다.

```mermaid
flowchart LR
  T[참조 소비 실패 재현]:::done --> C[자동 회수와 무결성]:::done --> V[64검사]:::done --> P[빌드 완료 · PR 준비]:::active
  P --> I[R6 실제 통합 검증]
  classDef done fill:#243d31,stroke:#65967d,color:#fff
  classDef active fill:#4b4025,stroke:#bca46c,color:#fff
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
  E --> F[후속: Claude·거래 세션·macOS]
  classDef done fill:#243d31,stroke:#65967d,color:#fff
  classDef active fill:#4b4025,stroke:#bca46c,color:#fff
```

코드 서명, 공개 게시, 자동 업데이트와 전체 PoB 기능 동등성은 이 초안의 완료 조건이 아니다. 엔진 변경은 별도 `codex/pok-desktop-runtime` 브랜치에 있고 기존 엔진 main은 수정하지 않는다.

최종 결과: 앱 검사 36개 통과, 엔진 단위 1,276개 통과, 1920/1024 레이아웃과 패키지의 저장·재시작 검증 통과. `release/POK-0.1.0-win-x64.exe` 생성. 상세 범위와 계산 제한은 [검증 기록](VALIDATION.md)에 남긴다.
