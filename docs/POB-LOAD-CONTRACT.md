# 원본 headless 로드 계약의 미지원 트리 재현

기준 PoB **0.23.1 / `5d173cbf8c9cf394a975cbb813f19d0b6dc67ea6`**. 공유 엔진/원본 소스는 수정하지 않았다.

## 실제 관측과 코드 근거

23차 첫 `tests/pob-catalog-versions-smoke.cjs`에서 지원 트리 0_1~0_5의 item/gem/계산은 성공했다. 뒤이어 같은 XML의 명시 treeVersion을9_99로 바꾸어 `PobRuntime.renderItem({kind:'base',id:'Iron Ring',slot:'Ring 1',buildXml:xml}, runtimeId)`을 호출했을 때 예상한 거부가 없었다. 합성 실행 결과는 `.local/standalone-pob/catalog-versions-before-guard.json`에 보존했다. 이를 요청 XML의 성공한 복원으로 간주하지 않는다. 이 실행에서 미지원 XML의 계산 수치가 기본 빌드 수치로 바뀌는 것까지 측정한 것은 아니다.

원본 `TreeTab.Load`는 미지원 version에서 message popup 후 true를 반환한다. `Modules/Build`는 이 경우 CloseBuild로 LIST mode로 이동한다. `HeadlessWrapper.loadBuildFromXML`은 SetMode/OnFrame을 실행하지만 명시적인 load-success/실패 원인을 반환하지 않는다. 어댑터의 기존 build/spec/data 존재 검사만으로 요청 XML의 복원 완료를 증명할 수 없었고, item API는 결과를 반환했다.

## UI에서 해결한 경계

host가 실제 고정 runtime manifest의 supportedTreeVersions와 모든 canonical Tree/Spec의 **명시** version을 비교한다. 활성/비활성 모두 검사하며 compute·조회·아이템 buildXml·party supportXml에서도 미지원 입력을 실행 전에 `POB_TREE_VERSION`으로 거부한다. 원문/비활성 세트를 삭제하거나 최신 version으로 바꿔 계산하지 않는다. game의 Build.targetVersion을 treeVersion으로 대신 해석하지 않으며 root legacy Spec의 원본 복원 계약은 별도로 유지한다. renderer도 미지원 비활성 세트와 실제 이유를 표시하고 계산/카탈로그를 차단한다.

지원 버전의 item/gem data는 원본 Build.self.data=data를 공유한다. 따라서 defaultTreeVersion이 아닌 과거 tree라는 이유만으로 catalog를 차단하지 않는다. catalog/runtime의 source·runtime ID·commit 일치와 양쪽 지원 범위는 계속 검사한다. 직업/전직은 버전별 원본 control이 담당한다.

## 남는 원본/API 요청

원본/엔진 로드 API가 요청 XML hash와 함께 `loaded`, actual active tree/version·세트·주력/모드, 부분 복원/결정 필요/미지원·실패 원인을 명시적으로 반환하면 popup/남은 객체 상태로 성공을 추정하지 않아도 된다. 요청 ID에 귀속된 취소/진행·완료를 구분하고, 로드 실패 시 이후 item/compute가 실패한 입력을 성공 문맥으로 사용하지 않도록 해야 한다. 현재 UI guard는 관측한 미지원 선언 version을 막는 것이며 모든 종류의 원본 로드 실패를 증명/수정한 것은 아니다. 다른 입력 실패/게임 버전 변환/복잡한 미지원 모델의 추가 감사는 남는다.
