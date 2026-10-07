# 로컬 검증 — 2026-10-05

## v0.1.1 패시브 트리

앱 검사 52개와 실제 Electron 화면 8개, Windows 패키지 화면 8개를 통과했다. 0_5의 4,914노드·5,149표시 연결, 사용자 빌드의 132할당 노드·121할당 연결과 모든 화면 이미지가 일치한다. 패키지에서 첫 지도 이미지 준비 2.12초, 재진입 133ms를 측정했다. MCP 노드 조회는 0회다.

원인, 소스 기준, 변환·배포 경로와 자세한 수치는 [패시브 트리 검증](PASSIVE-TREE.md)에 기록했다. 현재 변경은 화면·정적 데이터 로딩이며 게임 계산 엔진은 변경하지 않았다.

## v0.1.0

| 대상 | 결과 |
|---|---|
| 계층 의존 경계 | 통과 |
| TypeScript strict 검사 | 통과 |
| UI 문서·저장·MCP·에이전트 단위 | 36 통과 |
| 엔진 전체 단위 | 1,276 통과, 35 skip |
| 엔진 Ruff / mypy / import-linter / workflow guard | 통과 |
| Vite + main/preload production 빌드 | 통과 |
| Windows portable 포장 | POK-0.1.0-win-x64.exe 생성 성공, 475,123,529 bytes |
| 실제 XML 브라우저 UI 조작 | 가져오기, 아이템 생성/교체/편집/undo, 세트 전환, 대화 관리/메시지 편집, 재시작 저장 통과 |
| 1920×1080 / 1024×768 | 장비 2열과 능력치 5그룹 표시, 가로 넘침 없음 |
| Electron production 및 패키지 실행 | 네이티브 파일 대화상자→IPC→preload→UI, 편집/undo, 디스크 저장·프로세스 재시작 통과 |
| Electron 격리 | renderer의 require/process/Buffer 미노출, sandbox/contextIsolation 활성화 |
| 번들 MCP | 소스 밖에서 48개 도구·KB 검색·PoB 계산 통과 |
| UI 실제 계산 어댑터 | 빈 레벨 1 Sorceress 스탯 619개; 요청은 stats=["*"] |
| 실제 사용자 XML 계산 거부 | stage=compute, 복원 안내 7개와 엔진 진단 보존 |
| 원본 보호 | 사용자 XML SHA-256 전후 동일 |
| 엔진 리소스 불변 | 실행 전후 3,203 파일 SHA-256 변경/추가 없음 |
| 설치된 Codex 프로토콜 | initialize→initialized→model/list 성공; 실제 모델 추론은 요청하지 않음 |

실제 XML은 저장소에 넣지 않고 환경변수로 지정한다. 아래 smoke는 장착된 주 무기가 있는 외부 PoB XML을 읽기만 한다. 생성 데이터와 화면 캡처는 `.local/`에 남긴다.

```powershell
$env:POK_SMOKE_XML = '<검증할 XML 절대 경로>'
# 별도 터미널에서 npm run dev:web
node tests/renderer-smoke.cjs

npm run build
node tests/desktop-smoke.cjs

$env:POK_SMOKE_EXECUTABLE = '<release/win-unpacked/POK.exe 절대 경로>'
node tests/desktop-smoke.cjs
```

브라우저 smoke는 설치된 Microsoft Edge를 사용한다. desktop smoke는 별도 `.local/desktop-qa` 데이터 폴더를 사용하므로 일반 작업 공간을 덮어쓰지 않는다.

전체 엔진 통합 테스트와 PR은 아직 수행하지 않았다. Windows portable은 로컬 검토용이며 macOS 패키지·코드 서명·업데이트 배포는 검증 범위 밖이다. 검증용 사용자 XML의 새 DPS를 계산 완료로 취급하면 안 된다. 원본 XML 저장값 표시는 검증했지만 복원 과정의 교체 무기·단계형/부여 스킬 제한이 남아 있다.
