# 현재 작업

## GitHub 저장소 연결 (2026-10-07)

- [x] `https://github.com/skerfolg/pok-ui.git`를 origin으로 연결하고 기존 main의 MIT 라이선스 이력 보존
- [x] 공개 대상 점검: 개인 XML·대화·세션·실행 파일·생성 리소스 제외, 문서의 개인 빌드명 일반화
- [x] 앱 검사 52개와 프로덕션 빌드 통과
- [ ] `codex/desktop-v1` 브랜치 푸시 및 main 대상 PR 생성

```mermaid
flowchart LR
  A[원격 이력 보존]:::done --> B[게시 대상 검토]:::done --> C[검사 및 빌드]:::done --> D[브랜치 푸시 및 PR]:::active
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
