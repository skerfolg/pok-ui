# 로컬 검증 — 2026-10-08

## 자동 실행·연결 — 최소 검증

- 개발/배포 엔진 선택 회귀 2개 통과. 저장된 checkout 설정이 있어도 packaged 모드는 bundled로 고정하며 개발 모드는 설정을 보존한다.
- `npm run build`의 타입 검사와 빌드 통과. 전체 suite는 재실행하지 않았다.
- 실제 Electron에서 connect IPC/수동 버튼을 호출하지 않고 자동 연결을 확인했다. 연결 중 renderer를 재로드해도 동일 엔진 PID를 유지했다. 50개 도구 확인.
- 증거: `.local/auto-start-1791457633377/result.json`, 설정 화면 1920×1080/1024×768 PNG. 가로 넘침 없음.
- 실제 packaged 실행은 이 PC의 검증 범위에 포함하지 않는다.


## 연결·베이스 생성 수정 — 최소 회귀 검증

- UI: main-mcp의 연결 deadline/준비 상태/timeout 안내/요청 직렬화 4개 통과. POK: KB를 로드하지 않는 server_info, source/KB 캐시 무효화, 중첩 checkout 제외 3개 통과. 전체 테스트는 실행하지 않았다.
- 타입 검사와 코드 빌드 통과, 변경 Python 파일 Ruff 통과.
- 실제 MCP: `.local/connection-item-fixed.log` — 연결 18,642ms, Iron Ring 렌더 2,411ms.
- 실제 UI: 연결 20,562ms 후 베이스 생성 버튼으로 Iron Ring 생성·Ring 1 장착·revision 1 저장 확인. `.local/connection-ui-1791455895314/saved-equipment-result.json`. 테스트 하네스의 슬롯명 Ring1을 실제 PoB 이름 Ring 1로 정정하고, 저장 XML을 검증했다. 앱 검사를 불필요하게 재실행하지 않았다.
- 새 로컬 bundle: `pokbundle-24ccf3ba725a3071795a094b26116faf`. 카탈로그 13,945개/파일 590개. 기존 트리 자원은 SHA-256 확인 후 변환기의 원본 입력 검사를 거쳐 재사용했다.
- 최초 연결 시간은 이 PC 측정치이며, 더 느린 환경에서는 명시적인 timeout 오류를 표시한다. 전체 계산·실제 모델 추론·다른 PC 배포는 이번 좁은 검증 범위 밖이다.


## 거래 스킬 포함·로컬 테스트 실행파일 (후속 검증)

- UI `npm run check`: 89 passed. `npm run build`: 통과.
- POK 변경 관련 단위: 71 passed, 최신 Git 상태 공백 보존 회귀 1개 재확인. Ruff 및 변경 identity/MCP 파일 mypy 통과.
- 실제 Codex `skills/list`: staged `trade-search`가 해당 경로에서 발견되고 enabled=true.
- staged 스킬 실행기의 `prepare`: prepared 반환. 네트워크 검색·실제 매물·모델 추론 성공을 의미하지 않는다.
- 개발 bundle: `pokbundle-4f60c4b1ab8a34742eb78dec1cae3be7`, PoB pin 유지, 카탈로그 13,945개·직업 8개·파일 590개.
- `release/local-test/POK-Local-Test.exe --check` 통과. 해당 exe를 실제 실행해 앱 창과 ready checkout bundle을 확인했다. 증거: `.local/local-exe-smoke-result.json`, `.local/local-exe-smoke.png`.
- 런처는 이 체크아웃·설치된 Electron·설정한 POK/Python에 의존한다. 정식 portable 릴리즈가 아니다. 다른 PC에서 production bundle/lock과 패키지를 별도 검증한다.
- 일반 코드·JSON·Lua의 읽기 오류를 암호화로 확정하지 않는다. 문서형 파일 암호화는 사용자 설명대로 별도로 취급하며, DRM 해제 로직·검증 생략을 제품에 넣지 않았다.
- 커밋·스테이징·푸시 없음. 생성 실행파일·생성 C#의 개인 경로·로컬 테스트 데이터는 Git에서 제외된다.

## POK 고정 PoB 데이터·편집 통합

PoB 기준은 `5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`이다. upstream 최신 버전을 선택하지 않았고 KB를 재수집하지 않았다. POK source identity와 KB digest를 동일 묶음에 귀속했다.

| 대상 | 결과 |
|---|---|
| UI 경계/TypeScript/단위 | 87 passed; 경계 검사/TypeScript 통과 |
| POK 전체 단위 | 1,321 passed, 2 skipped |
| POK 새 XML/아이템 단위 | 최종 10 passed |
| 실제 PoB XML/아이템 통합 | 4 passed: 직접 XML parity, base 장착, unique 변형 장착, rare roll 효과 |
| POK 정적 검사 | Ruff, mypy 155 source files, import-linter 1 contract 통과 |
| 원본 export | base 1,768 / unique 435 / mod 9,340 / gem 966 / skill 1,436 = 13,945; 직업 8개 |
| 트리 파생물 | 0_1~0_5 생성, missingArtwork 0; 원본 tree hash와 변환 파일 hash 구분 |
| 개발 checkout bundle | 590개 파일 해시 검증; 소스 앱 opt-in 허용, production 거부 |
| 프로덕션 코드 빌드 | npm run build 통과 |
| 번들 실패 복구 | 최초 이동 실패·staging 누락·접근 거부·후속 설치 실패 시 원본 보존, 복구 실패 시 백업 보존·오류 보고 |
| Electron 44.5.1 오프라인 smoke | 실제 카탈로그·새 빌드·트리 이미지·두 해상도 화면 통과; 번들 590개 파일 및 디렉터리 내용 불변 |
| MCP identity 분리 진단 | 콜드 KB load 32.248초, 직접 server_info 9.159초, in-process MCP server_info 5.582초, 도구 50개; 모두 성공 |
| Electron→MCP 계산 smoke | 연결 단계 90초 제한 실패; 독립 stdio 요청도 120초 timeout 재현 |
| stdio 지연 위치 | faulthandler: server_info → _git_head → subprocess.run timeout 후 Windows communicate 출력 reader thread join에서 대기. 임시 stdin/콘솔 격리 진단은 45초 시점 같은 대기 stack 이후 정상 identity를 반환(exit 0); 안정적 해소·네이티브 적용은 미검증 |
| production bundle/lock 및 Windows 패키지 | 문서보호 파일 읽기 실패로 미완료 |
| 실제 AI 모델 추론 | 미실행; 제안 등록·stale 거부·일괄 적용은 단위/어댑터 검사 |

Portable runtime은 생성했으나 UI 준비 단계에서 Node가 12,015개 중 323개 파일을 읽지 못한다(EBADF; txt, zip, 일부 C 헤더 등). 사용자가 문서보호 적용을 확인했다. 제공된 drm-reader로 원본과 runtime 복사본의 공개 PoB help.txt를 `--export-plain` 처리했으나 `detected=Unknown`으로 거부됐다. 강제 옵션·해시 생략·보호 도구의 제품 포함은 하지 않았다. 따라서 개발 번들 성공을 소스 없는 배포 성공으로 취급하지 않는다.

네이티브 오프라인 결과는 `.local/catalog-qa-1791448070510/result.json`과 같은 폴더의 8개 화면 PNG에 기록했다. `$visual-verdict` 92/pass, 가로 넘침 없음. 엔진 검사를 생략한 실행이며 연결·계산 성공을 의미하지 않는다. 저장소의 Electron 실행 파일이 준비되지 않아 이미 설치된 동일 버전 44.5.1의 실행 파일 경로를 테스트 환경변수로 지정했다.

이번 테스트는 합성 XML과 별도 사용자 데이터 디렉터리만 사용한다. 실제 사용자 빌드·대화·세션을 fixture나 배포물에 넣지 않는다. 현재 연결 차단은 이 Windows stdio 실행 경로에서 재현한 상태다. KB 최초 로드 지연과 구분했고, 원인 미확정 상태에서 버전 검증 생략이나 타임아웃 확대를 제품에 적용하지 않았다. 단위·in-process MCP 성공을 네이티브 stdio 성공으로 대체하지 않는다.

계산은 PoB 모델의 결과이며 인게임 실현 가능성 검증과 미실행 진단을 유지한다.

이하 기록은 이전 릴리스 당시 결과이며 이번 변경의 패키지 검증을 대신하지 않는다.

## 이전 릴리스 검증 — 2026-10-05

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

## 채팅 제어·연결 표시 검증 — 2026-10-08

요청에 따라 전체 suite 대신 변경 영역만 검사했다.

- AgentManager 회귀 25개 통과: 실제 모델 목록 매핑, 이미지 입력, 질문 RPC/비동기 후속 턴, 취소/중지 실패 재시도, 도구 전달 및 상태 이벤트.
- 이미지 저장 검증 2개와 MCP 종료·시간 초과·연결 확인 병합 회귀 4개 통과.
- POK fast server_info 1개, KB Git stdio 회귀 2개 통과. 실제 cold search_kb는 53,218ms에 1개 결과로 완료했다. 첫 조회 준비 지연은 남는다.
- 설치된 실제 Codex로 model/list(4개 모델) 및 thread/start 성공. 실제 모델 추론 턴은 실행하지 않았다.
- 합성 app-server + 실제 Electron/POK 연결로 모델/추론 강도 전달, 합성 PNG 붙여넣기·표시·저장, blocking/async 질문 왕복, 중지 후 늦은 delta 무시, 완료 시각, 소유한 POK 프로세스 종료 시 즉시 연결 해제 표시를 확인했다. 실제 사용자 대화는 fixture로 사용하지 않았다.
- 1920×1080 및 1024×768 질문 카드 표시/전송 접근성·가로 넘침 없음, native overlay 및 기본 메뉴 숨김 확인.
- 경계 정적 검사·TypeScript 검사·프로덕션 빌드·양쪽 저장소 diff 공백 검사 통과. 별도 lint 명령은 없다. Vite의 차기 native config loader 관련 경고는 남지만 현재 빌드는 성공한다.
- 로컬 런처 --check 통과. 기존 release/local-test/POK-Local-Test.exe가 갱신된 dist를 읽는다. 정식 패키징 검증은 다른 PC에서 수행한다.

이번 변경의 로컬 진단은 .local 아래에 보관하며 Git에 포함하지 않는다. 이전 메시지는 완료 시각이 없어 과거 시간을 복원하지 않는다.

최종 재검증: 완료 IPC를 2초 지연시켜 질문 답변이 먼저 도착하는 상황에서도 후속 턴이 보존되는 실제 Electron 회귀 시나리오 통과. 같은 실행에서 이미지·blocking 질문·중지·실제 POK 연결 상태도 통과했다.
