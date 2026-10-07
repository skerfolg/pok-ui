# POK Desktop

PoE2 빌드와 대화를 관리하는 Electron + React + TypeScript 앱. 지식·계산 엔진인 `poe2-ai-wiki`와 **별도 저장소**다. 2026-10-05 확정한 1차 디자인을 코드로 구현한다.

소스 저장소: [skerfolg/pok-ui](https://github.com/skerfolg/pok-ui). UI 소스는 [MIT License](LICENSE)를 따른다. PoB·게임 이미지와 의존성에는 각 원본 라이선스가 적용된다.

## 실행

Node.js 22.12+ 또는 24 LTS가 필요하다.

```sh
npm ci
npm run dev
```

개발에서는 `pok 설정`에서 형제 `poe2-ai-wiki` 체크아웃과 Python 실행 파일을 지정할 수 있다. 배포 런타임이 준비되어 있으면 번들 연결이 기본이다. 실행 시 저장된 설정으로 연결을 시도한다.

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
- 고정된 PoB의 트리·아이콘·배경을 로컬에서 일괄 로드한다. 트리는 엔진 연결 없이 표시되며 버전별로 캐시한다. [패시브 트리 구현](docs/PASSIVE-TREE.md)
- Codex app-server 스트리밍, 취소, 도구 요청·승인, 지식 검색, 빌드 수정 제안 검토/적용.
- 사용자 데이터 폴더에 버전이 있는 JSON을 원자적으로 저장하고 백업한다. 개인 빌드·대화·로그인은 앱 배포물에 포함하지 않는다.

현재 Claude 연결, 거래소 인증 세션 관리, PoB 전체 기능과의 동등성, macOS 배포 검증은 후속 작업이다. Codex는 별도로 설치하고 로그인한 CLI가 필요하다. 이번 검증에서는 실제 모델 추론을 요청하지 않았다. 트리 편집은 계산 결과만으로 게임 내 적법성을 보장하지 않으며 엔진 진단도 함께 확인한다.

실제 검증용 사용자 XML의 불러오기·편집·저장은 검증했다. 이 빌드의 **새 계산은 현재 엔진에서 거부된다**. 교체 무기 복원 미지원과 일부 단계형/아이템 부여 스킬의 정보 누락이 있어, 앱은 원본 저장 수치를 보존하고 복원·계산 진단을 표시한다. 해당 제한을 해결하기 전에는 이 빌드의 새 DPS가 검증됐다고 간주하지 않는다.

## Windows 배포

엔진 저장소의 `scripts/build_runtime.py --freeze`로 만든 폴더를 준비한다. 폴더에는 실행 파일, Python 의존성, KB, 스킬, 고정 PoB, LuaJIT과 라이선스가 들어 있다. 빌더가 런타임 manifest에 원본 커밋과 SHA-256을 기록한다.

```sh
npm run runtime:stage -- "../poe2-ai-wiki/var/runtime-win-x64/frozen/pok"
# 먼저 docs/PASSIVE-TREE.md 절차로 resources/passive-tree를 생성한다.
npm run dist:win
```

`release/POK-0.1.1-win-x64.exe`가 생성된다. 런타임·트리 리소스 없이 포장하는 것은 사전 검사에서 실패한다. 로컬 초안은 코드 서명·자동 업데이트·공개 게시를 하지 않는다. macOS 명령은 준비되어 있으나 해당 플랫폼에서 생성한 런타임과 별도의 검증이 필요하다.

이번 검증본은 이전 실행 파일을 보존하도록 `release/0.1.1/POK-0.1.1-win-x64.exe`에 만들었다. 이전 앱을 종료하고 새 파일을 실행하면 기존 작업 공간을 그대로 불러온다.

`resources/pok-runtime/`, `resources/passive-tree/`, `node_modules/`, `dist/`, `release/`, `.local/`은 파생 파일이라 Git에 넣지 않는다. 앱은 실행 경로에 데이터를 쓰지 않는다. `pok 설정 → 사용자 데이터 폴더 열기`에서 실제 저장 위치를 확인할 수 있다. 필요하면 실행 전 `POK_UI_DATA_DIR`를 절대 경로로 지정해 별도 작업 공간을 사용한다.

엔진은 main 프로세스에서 MCP stdio로 실행한다. `POK_DATA_HOME`과 `POK_CACHE_HOME`은 사용자 데이터 아래로 지정하며 배포 리소스는 읽기 전용으로 취급한다. 엔진 업데이트와 UI 업데이트는 각 저장소에서 관리한다.
