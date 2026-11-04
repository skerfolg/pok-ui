# 아이템 이미지와 장비 개요

2026-11-04 사용자 제공 poe.ninja 이미지의 구성을 장비 개요에 반영했다. 양쪽 무기·상단 투구·중앙 갑옷·측면 반지/목걸이·하단 장갑/허리띠/장화·플라스크/호신부 순서로 배치하고 바알 신체 부위와 현재 장착 주얼을 별도 썸네일 행으로 둔다. 장착·옵션 편집·자동 계산·원본 hover 비교·주얼 미니맵은 기존 원본 API를 유지한다.

## 이미지 준비

원본 PoB 번들은 아이템 일러스트를 포함하지 않는다. 별도 cosmetic resource로 준비하며 계산 카탈로그나 PoB 소스를 바꾸지 않는다.

```
.local/tree-tools/Scripts/python.exe scripts/prepare-item-art.py
```

먼저 `resources/pob-editor/catalog.json`이 준비되어 있어야 한다. Pillow가 있는 Python으로 실행한다. 준비 결과는 `resources/item-art/`이며 Git에는 생성물 대신 준비 스크립트와 출처 기록을 둔다. package에는 이 폴더를 포함한다. 실행 중 외부 API/이미지 CDN을 호출하지 않는다.

- 베이스 이름과 visual identity 경로: [RePoE PoE2 export](https://github.com/repoe-fork/poe2), 정확한 native base 이름으로 매칭. 실제 베이스 그림은 [PoE2DB CDN](https://cdn.poe2db.tw/)의 해당 Art 경로에서 받았다. 모호한 중복 이름은 임의로 고르지 않는다.
- 고유 그림: [poe.ninja 공개 economy API](https://poe.ninja/docs/api)의 name/base/icon만 사용했다. 사용자 build/profile API는 사용하지 않았고 시세·옵션 데이터를 계산에 넣지 않았다. 파일 출처는 GGG의 `web.poecdn.com`이다.
- 고유 name/base가 일치하는 아이콘을 우선한다. 이름만으로 유일한 그림은 해당 이름에 연결한다. 고유가 없으면 알려진 베이스 그림, 그림이 없으면 슬롯 아이콘과 이름을 제공한다. 임의의 다른 아이템 그림을 할당하지 않는다.
- artwork의 권리는 Grinding Gear Games 등 원 권리자에게 있다. 코드 라이선스로 이미지의 권리를 주장하지 않는다. 각 파일의 원본 URL/형식/크기/SHA-256은 index에 기록한다.

이번 준비 결과: 997개 이미지,1,740개 베이스 이름,1,124개 고유 lookup key. 동일 파일/다른 lookup key가 있으므로 고유 key 수는 고유 아이템 수가 아니다. 기준 데이터에는 없는 이름은 정상 fallback으로 남긴다.

## 로컬 제공과 경계

main의 `ItemArtStore`가 index에 등록된 SHA-256 파일만 `pok-item://artwork/<hash>`로 제공한다. 경로 탈출·임의 파일 URL을 허용하지 않고 파일의 실제 hash/MIME/최대 크기를 확인한다. renderer의 이미지 CSP에 이 로컬 scheme만 추가했다. 원격 이미지 host를 renderer 허용 목록에 추가하지 않았다.

베이스/고유의 그림 선택은 표시용 문자열 lookup이다. 슬롯 가능 여부·주얼/신체 부위·수치·요구량·계산은 원본 PoB에 위임한다. active tree/revision/runtime과 맞는 장착 주얼만 표시한다. XML에 있는 inactive 세트나 알 수 없는 슬롯은 지우지 않는다.
