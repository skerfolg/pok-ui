# POK 고정 데이터 묶음

POK가 선택한 PoB 커밋을 기준으로 UI 편집 데이터, KB, 계산 런타임을 빌드 전에 묶는다.
앱 실행 중에는 PoB/POK를 다운로드하거나 카탈로그를 재생성하지 않는다.

## 데이터 경계

- 원본 PoB는 `resources/pok-runtime/external/pob/<short-sha>`에 한 벌 포함한다.
- 아이템·접사·젬·스킬·직업·어센던시 카탈로그는 해당 원본을 POK의 `pok.pob.ui_export`로 추출한다.
- `resources/passive-tree`의 JSON·WebP는 같은 원본에서 생성한 표시용 파생물이다.
- AI 지식 조회는 POK KB를 사용한다. KB 값으로 원본 카탈로그의 ID나 수치를 덮어쓰지 않는다.
- 계산과 아이템 원문 생성은 고정 PoB를 사용하는 POK의 `compute_pob_xml`, `render_pob_item`에 맡긴다.
- Lua 함수는 JSON에 실행 코드로 옮기지 않는다. 지정된 `AffixData.*.apply`와 스킬 `preDamageFunc`는 위임 진단과 함께 표시 데이터에서 식별하고, 실제 실행은 번들 PoB가 담당한다. 처리되지 않은 손실/순환/비유한 수치 진단은 배포를 차단한다.

```text
resources/
  pok-runtime/             # portable Python + POK + KB + 원본 PoB + LuaJIT
  pob-catalog/catalog.json # 원본 기반 편집 데이터
  passive-tree/<version>/  # 화면용 트리와 이미지
  bundle-manifest.json     # 전체 파일·출처·계약의 연결
pok-runtime.lock.json      # 선택한 배포 입력 잠금; Git 관리
```

## 준비와 갱신

먼저 POK 저장소에서 검증한 소스로 standalone runtime을 만든다. 새 PoB 커밋 선택이나 KB 재수집은 POK의 별도 검증 절차를 따른다.

```powershell
# POK 저장소
.venv/Scripts/python.exe scripts/build_runtime.py --output var/desktop-bundle
```

기존 marked runtime을 다시 생성할 때만 `--force`를 사용한다. 빌더는 source root/ancestor와 일반 폴더 덮어쓰기를 거부하고 임시 staging을 검증한 뒤 교체한다.
portable runtime에는 Python과 LuaJIT이 포함되므로 사용자의 외부 Python/LuaJIT 설치를 요구하지 않는다.

UI 저장소에서 기존 이미지 변환 의존성을 준비한다.

```powershell
python -m venv .local/tree-tools
.local/tree-tools/Scripts/python.exe -m pip install -r scripts/requirements-tree-assets.txt
```

검토한 POK 배포 입력을 최초 고정하거나 명시적으로 변경할 때:

```powershell
npm run bundle:prepare -- --runtime "<POK runtime 폴더>" --tree-python ".local/tree-tools/Scripts/python.exe" --write-lock
```

동일 잠금 입력으로 재생성할 때는 `--write-lock`을 생략한다. 잠금과 다른 runtime은 실패한다.
명령은 임시 폴더에 runtime 복사 → 같은 원본의 카탈로그 추출 → 트리 이미지 변환 → 통합 검증을 수행한 후 `resources`와 lock을 바꾼다.
실패하면 기존 묶음을 보존하고, 성공 시 이전 묶음은 `.local/bundle-backups`에 남긴다.

이미 staging된 자료의 진단용 명령:

```powershell
npm run verify:data-bundle
npm run check
npm run build
npm run dist:win
```

`prepare:data-bundle`은 준비된 resources의 manifest를 검증·확정하는 하위 명령이다.
일반적인 갱신에는 전체 staging을 담당하는 `bundle:prepare`를 사용한다.

## 개발 checkout 검증

POK 소스를 함께 수정하는 동안에는 실행 파일을 복제하지 않는 개발 전용 묶음을 만들 수 있다.

```powershell
npm run bundle:prepare-checkout -- --pok-root "<POK 저장소>" --python "<POK .venv Python>" --tree-python ".local/tree-tools/Scripts/python.exe"
```

이 명령도 원본 PoB pin, POK/KB identity, 카탈로그 출처와 모든 표시 자원 해시를 검증한다. 생성 전후 POK identity가 다르면 실패한다. 로컬 절대 경로는 manifest에 저장하지 않는다.
앱 설정에서 개발 checkout과 해당 Python/LuaJIT을 지정해 연결한다. 소스 앱과 Vite만 이 묶음을 허용하며, 배포 앱과 `dist:win`/배포 검증은 거부한다.
이 경로는 배포 artifact나 `pok-runtime.lock.json`을 대체하지 않는다. 배포할 때는 위의 `bundle:prepare`로 실행 가능한 runtime과 잠금을 확정해야 한다.

문서보호 때문에 파일 읽기 또는 복사가 실패하면 해시 검증을 생략하지 않는다. 해당 환경에서 정상적으로 읽고 배포할 수 있는 공개 runtime 자원을 준비한 뒤 다시 실행한다. 문서보호 해제 도구는 제품에 포함하지 않는다.

## 실행 시 검증

`GameDataStore`는 bundle 파일 목록, 실제 SHA-256, runtime manifest, 실행 파일과 모든 runtime 파일, 카탈로그 출처를 확인한다.
실행 직전 다시 검증한 launch descriptor로만 번들 프로세스를 시작한다.
엔진의 POK source digest, PoB commit/source digest, KB manifest/content digest, API/capability가 UI 묶음과 일치해야 도구를 사용한다.

트리/이미지 캐시는 bundleId와 트리 버전으로 분리한다. 개발 미리보기도 같은 검증 로더를 사용한다.
엔진 오프라인에서도 검증된 카탈로그/트리는 볼 수 있다. 계산과 PoB 아이템 원문 생성에는 엔진 연결이 필요하다.
묶음이 없거나 다르면 새 카탈로그 적용/계산을 제한하지만, 기존 XML 열기와 원문 보존·내보내기는 유지한다.

## 문서·계산·AI 일관성

새 빌드는 원본 `GameVersions.lua`의 지원 트리와 클래스 메타데이터로 생성한다.
`Build targetVersion="0_1"`은 XML 문서 형식이며 게임 패치 번호가 아니다. 실제 트리는 `Spec treeVersion`에 기록한다.
직업 내부/legacy ID와 어센던시 ID를 구분하고 새 빌드는 미전직 상태로 시작한다.
아이템 생성+장착, 복합 편집은 revision과 undo를 한 번만 갱신한다.

계산은 선택 세트를 반영한 XML을 그대로 PoB에 전달한다. 복원 스펙은 검사/진단 용도이며 계산 입력을 다시 만들지 않는다.
결과는 buildId, revision, 원본 XML SHA-256, bundleId, POK/PoB/KB 출처에 귀속한다. 예전 결과와 XML 저장값을 새 계산으로 표시하지 않는다.

AI 제안은 기준 revision/XML hash/bundle을 포함한다. main이 실제 변경 범주를 계산하고 사용자 적용 직전에 다시 검증한다.
이전 대화도 일반 도구 호출 경로로 현재 UI 카탈로그 도구를 찾을 수 있다.
연결이 바뀌면 진행 중 AI 대화와 대기 제안을 무효화한다.

## 검증

합성 빌드만 사용하는 native smoke:

```powershell
npm run build
node tests/catalog-desktop-smoke.cjs
# 패키지의 소스 밖 실행 검증:
$env:POK_SMOKE_EXECUTABLE = "<win-unpacked/POK.exe 절대 경로>"
node tests/catalog-desktop-smoke.cjs
```

개발 Electron 경로를 명시할 때는 `POK_SMOKE_ELECTRON_EXECUTABLE`을 사용한다. `POK_SMOKE_SKIP_ENGINE=1`은 오프라인 화면·리소스 검증만 수행하며 결과의 `skipped`에 엔진 검사를 기록한다. 배포 완료 검증에서는 이 옵션을 쓰지 않는다.

검증 결과와 화면 캡처는 `.local/catalog-qa-<timestamp>`에 기록한다.
macOS는 native runtime과 실제 macOS 호스트에서 별도 검증하기 전 배포 완료로 간주하지 않는다.
