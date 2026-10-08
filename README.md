# POK Desktop

PoE2 빌드와 대화를 관리하는 Electron + React + TypeScript 앱. 지식·계산 엔진인 `poe2-ai-wiki`와 **별도 저장소**다. 2026-10-05 확정한 1차 디자인을 코드로 구현한다.

소스 저장소: [skerfolg/pok-ui](https://github.com/skerfolg/pok-ui). UI 소스는 [MIT License](LICENSE)를 따른다. PoB·게임 이미지와 의존성에는 각 원본 라이선스가 적용된다.

## 실행

Node.js 22.12+ 또는 24 LTS가 필요하다.

```sh
npm ci
npm run dev
```

앱 시작 시 main 프로세스가 POK를 자동으로 실행하고 연결한다. 개발에서는 `pok 설정`에 저장한 체크아웃/Python 또는 번들 설정을 사용한다. 배포 앱은 저장된 개발 경로를 사용하지 않고 검증된 번들 POK로 연결한다. 수동 버튼은 재연결용이며, 화면 새로고침으로 엔진을 다시 실행하지 않는다.

```sh
npm run check
npm run build
npm start
```

브라우저만으로 디자인을 수정할 때는 `npm run dev:web`를 쓴다. 이 모드의 저장소는 브라우저 localStorage이며 네이티브 에이전트·계산 기능은 데스크톱에서만 동작한다.

## 디자인 수정 위치

| 변경 | 위치 |
|---|---|
| 색상, 폰트, 간격, 패널 폭 | `src/renderer/design/tokens.css` |
| 화면 배치, 반응형, 스크롤 영역 | `src/renderer/design/layout.css` |
| 버튼, 목록, 장비, 대화 등 표현 | `src/renderer/design/components.css` |
| 개별 화면의 표시 구성 | `src/renderer/features/` |
| 데이터 저장·편집 흐름 | `src/renderer/state/`, `src/shared/` |
| 로컬 엔진·에이전트·파일 접근 | `src/main/` |

자세한 경계는 [구조](docs/ARCHITECTURE.md), 화면 기준은 [1차 디자인](docs/DESIGN.md)을 참고한다. `npm run check:boundaries`가 렌더러의 Node/Electron/엔진 직접 접근과 역방향 의존을 검사한다.

검증 항목과 외부 XML을 사용한 화면 테스트 방법은 [검증 기록](docs/VALIDATION.md)에 있다.

## 현재 구현

- 채팅·장비·스킬·패시브트리·설정·pok 설정의 6개 메뉴.
- 대화 이름 변경, 고정, 삭제/복원, 사용자 메시지 편집. 메시지를 편집하면 이후 응답을 제거하고 새 에이전트 맥락으로 이어간다.
- XML/PoB 공유 코드/POK JSON 가져오기와 내보내기. 원본 파일은 읽기만 한다.
- 장비 세트/장착/아이템 원문, 스킬 세트/젬/주 스킬, 트리 할당 ID, 조건 세트 편집과 되돌리기.
- XML에 저장된 과거 능력치와 현재 리비전의 새 PoB 계산을 구분한다.
- POK 고정 버전의 아이템·접사·젬·직업·어센던시 카탈로그를 사용하고, 같은 PoB의 트리·아이콘·배경을 로컬에서 일괄 로드한다. 트리는 엔진 연결 없이 표시되며 버전별로 캐시한다. [패시브 트리 구현](docs/PASSIVE-TREE.md)
- Codex app-server 스트리밍, 모델·추론 강도 선택, 이미지 첨부/붙여넣기/드롭, 응답 중지, 질문 선택지·직접 답변.
- 도구 요청·승인, 지식 검색, 빌드 수정 제안 검토/적용. 새 응답은 완료 시각과 소요 시간을 표시한다.
- 사용자 데이터 폴더에 버전이 있는 JSON을 원자적으로 저장하고 백업한다. 개인 빌드·대화·로그인은 앱 배포물에 포함하지 않는다.

현재 Claude 연결, PoB 전체 기능과의 동등성, macOS 배포 검증은 후속 작업이다. Codex는 별도로 설치하고 로그인한 CLI가 필요하다. 이번 검증에서는 실제 모델 추론을 요청하지 않았다. 트리 편집은 계산 결과만으로 게임 내 적법성을 보장하지 않으며 엔진 진단도 함께 확인한다.

거래소 검색은 POK의 `trade-search` 스킬에 구현되어 있고, `.agents/skills/trade-search/SKILL.md` 등 에이전트 진입점에도 이미 등록되어 있다. pok-ui의 대화는 연결된 POK 루트를 작업 디렉터리로 사용한다. 따라서 별도 거래 검색 기능을 만드는 것이 아니라 기존 스킬 호출 흐름을 재사용한다. 무인증 검색을 먼저 사용하고, 인증이 필요한 경우 실행 환경의 `POESESSID`를 받는 계약을 따른다. 별도 로그인·세션 보관 UI는 필수 조건이 아니다. portable runtime 빌더는 거래 검색 스킬의 진입점·절차·실행기를 함께 복사하고 출처 해시에 포함한다. 에이전트에는 실행 Python과 사용자 데이터·캐시 경로를 전달한다. 거래 검색 로직을 복제하거나 별도 인증 UI를 추가하지 않는다. 정식 배포 환경의 실제 챗봇 검색은 다른 PC에서 추가 검증한다.

이전 복원 스펙 계산 경로의 제한은 [검증 기록](docs/VALIDATION.md)에 남겨 두었다. 현재 묶음은 원본 XML을 직접 계산하며, 검사되지 않은 부분과 PoB 모델링 진단을 함께 제공한다. 검증 범위는 합성 빌드이며 실제 사용자 빌드의 전체 동등성을 주장하지 않는다.

## 이 PC에서 로컬 테스트

정식 배포는 다른 PC에서 수행한다. 이 PC에서는 개발용 데이터 묶음과 소스 빌드를 확인하고, 체크아웃을 여는 Windows 테스트 런처를 만든다.

```powershell
npm run bundle:prepare-checkout -- --pok-root "<POK 저장소>" --python "<POK Python>" --tree-python ".local/tree-tools/Scripts/python.exe"
npm run build:local-exe -- --pok-root "<POK 저장소>" --python "<POK Python>" --luajit "<LuaJIT 실행 파일>"
```

생성 파일은 `release/local-test/POK-Local-Test.exe`다. 현재 체크아웃과 `node_modules/electron/dist/electron.exe`가 있어야 실행된다. 독립 배포용 실행파일이 아니며, 테스트 데이터는 `.local/local-test-user-data`에 분리한다. 기존 테스트 프로필은 덮어쓰지 않는다. 빌더는 Windows에 설치된 .NET Framework C# 컴파일러를 사용하며 새 패키지를 설치하지 않는다.

## Windows 배포

[고정 데이터 묶음 준비·갱신 절차](docs/DATA-BUNDLE.md)를 따른다. 검증한 POK runtime 한 벌에서 편집용 원본 카탈로그와 트리 이미지를 생성하고 `pok-runtime.lock.json`에 입력을 고정한다. 실행 중 자동 갱신은 하지 않는다.

```powershell
npm run bundle:prepare -- --runtime "<POK runtime 폴더>" --tree-python ".local/tree-tools/Scripts/python.exe" --write-lock
npm run check
npm run dist:win
```

생성된 리소스·실행 파일·사용자 작업 공간은 Git에 넣지 않는다. 앱은 리소스를 읽기 전용으로 사용하고 사용자 데이터 폴더에 저장한다. macOS 패키지는 별도 native 검증이 필요하다.

엔진은 main 프로세스에서 MCP stdio로 실행한다. `POK_DATA_HOME`과 `POK_CACHE_HOME`은 사용자 데이터 아래로 지정하며 배포 리소스는 읽기 전용으로 취급한다. 엔진 업데이트와 UI 업데이트는 각 저장소에서 관리한다.
