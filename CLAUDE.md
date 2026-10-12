# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요
「서울 라이브 3D」 강의 실습 프로젝트(섹션 1). 서울 지하철 역별·시간대별 승하차 인원을 2D 차트·표와 Three.js 3D 기둥으로 보여 준다. 빌드 도구와 npm 의존성은 없다. 문서·주석·커밋 메시지는 한국어로 쓴다.

## 명령
- 테스트 전체: `npm test` (`node --test`, `tests/*.test.mjs`)
- 테스트 하나: `node --test --test-name-pattern="서울역" tests/data.test.mjs`
- 데이터 점검: `npm run check` (기본은 9월 승하차 CSV. 다른 파일은 `node scripts/check-data.mjs <경로>`, `.csv`·`.json`을 확장자로 구분)
- 실행: `npm start`(`server.mjs`) 후 http://127.0.0.1:8000 — `fetch`와 ES 모듈을 쓰므로 `file://`로 열면 동작하지 않는다. `python3 -m http.server`는 `.env`까지 내보내고 실시간 열차(`/api/trains`)가 없으므로 쓰지 않는다.

## 구조
- `index.html` 한 파일에 HTML·CSS·JS가 모두 있다. Three.js 0.160.0은 importmap으로 jsDelivr CDN에서 불러온다(OrbitControls, CSS2DRenderer 포함).
  - 흐름: `fetchCsv(SUBWAY_CSV)` → `toSubwayRows`(9월 CSV를 API 행 모양으로) → 모든 역·시간대의 최댓값으로 공통 눈금 `yMax`(`niceMax`) 계산 → 역마다 SVG 차트(`drawChart`)와 합계 표 행 추가 → `init3d(rows, yMax)`로 3D 장면 생성.
  - 2D 차트와 3D 기둥 높이는 같은 `yMax` 눈금을 공유한다(`MAX_HEIGHT` 칸 = `yMax`). 시간 슬라이더는 `setHour`로 기둥 높이를 바꾼다.
  - 역 좌표는 데이터에 없어서 `STATION_COORDS`에 WGS84 근사값을 직접 넣었다. 역을 추가하면 여기도 함께 추가해야 한다. 장면 1칸 = 100m(`UNIT_M`).
- `stats.mjs`: `HOURS`, 필드 접근(`count`, `total`), 역 카드의 최다·가장 한가한 시간대 계산. `index.html`과 `tests/stats.test.mjs`가 함께 import한다. 데이터 필드에 접근할 때는 키 문자열을 직접 만들지 말고 `count`를 쓴다.
- `subway-lines.mjs`: 노선(운행 계통)별 역 순서(`SUBWAY_LINES`). 역은 역사마스터의 `"역사_ID 역사명"`으로 적고, 순서는 직접 적었다(역사_ID 순서와 다르다). 고치면 `tests/subway-lines.test.mjs`의 거리·꺾임 검사를 통과해야 한다.
- `realtime-trains.mjs`: 실시간 열차 위치 API 호출·20초 캐시·키 가리기(`createTrainsSource`). `server.mjs`와 `api/trains.js`(Vercel 함수, 키는 Vercel 환경 변수 `SEOUL_REALTIME_KEY`)가 함께 쓴다. Vercel 설정은 `vercel.json`(빌드 없음)과 `.vercelignore`(점 파일 제외).
- `server.mjs`: 의존성 없는 Node 서버. 정적 파일(점으로 시작하는 경로는 404)과 `/api/trains`(실시간 열차 위치 프록시, 20초 캐시). 실시간 지하철 인증키는 `.env`의 `SEOUL_REALTIME_KEY`로 서버만 읽는다. 키를 브라우저 코드·응답·오류 문구에 넣지 않는다. 없으면 `sample` 키(노선마다 5대).
- `citydata-areas.mjs`: 서울시 주요 121장소 영역 zip(shapefile)을 읽을 때 풀어서 `{ code, category, name, polygons }`로 바꾼다(zip·.shp·.dbf 파서, 의존성 없음, `DecompressionStream` 사용). 브라우저와 Node가 함께 쓴다.
- `realtime-citydata.mjs`: 실시간 도시데이터(`citydata_ppltn`, 인구·혼잡도·12시간 예측) 121곳 호출·5분 캐시·키 가리기(`createCitydataSource`). 장소 코드는 영역 zip에서 읽는다. 키는 일반 인증키 `SEOUL_OPENAPI_KEY`(`.env`/Vercel 환경 변수). `sample` 키는 어느 장소를 물어도 광화문·덕수궁만 주므로 1곳만 묻는다. `server.mjs`와 `api/citydata.js`가 함께 쓰고, Vercel은 `vercel.json`의 `includeFiles`로 zip을 함수에 올린다.
- `citydata-store.mjs` + `scripts/collect-citydata.mjs`(`npm run collect`, `-- --watch`면 5분마다): 도시데이터를 Supabase `crowd_snapshots`에 쌓아 시계열을 만든다(API에는 지난 기록이 없다). 시작할 때 영역 zip으로 `places`를 맞추고, PostgREST에 fetch로 upsert한다(`(place_code, observed_at)` 중복은 무시, `observed_at`은 `PPLTN_TIME`을 KST로). 테이블 check에 걸릴 행은 미리 뺀다. 키는 `.env`의 `SUPABASE_URL`·`SUPABASE_SERVICE_ROLE_KEY`(RLS 우회, 서버 전용).
- 기록 읽기: `createCrowdHistory`(`citydata-store.mjs`, 최근 24시간·1분 캐시, 장소 코드 `POI\d{3}`만) → `/api/crowd-history?code=`(`server.mjs`, `api/crowd-history.js`). 키는 읽기 전용 `SUPABASE_PUBLISHABLE_KEY`. `subway.html`에서 영역을 누르면(`selectPlace`) `#history-panel`에 SVG 그래프를 칸의 실제 폭으로 그린다(`renderHistory`, 12분 넘게 빈 곳은 선을 끊음). 그 아래 지금 연령대 비율 막대(`renderAges`)는 실시간 도시데이터의 `ages`(`toCitydata`가 `PPLTN_RATE_0`…`70`을 8칸으로)로 그리고, 받지 못한 장소면 숨긴다.
- `db-status.mjs`: DB(Supabase)가 꺼졌거나 닿지 않는 경우 판별(`isDbUnavailable`: PostgREST `PGRST00x`·5xx, fetch 실패)과 안내 문구(`DB_DOWN_MESSAGE`, `dbErrorText`). 붐빔 기록 읽기는 이때 `DbUnavailableError`를 던지고 `/api/crowd-history`는 503 `{ error, retry: true }`로 답한다(로그는 스택 없이 한 줄). 화면의 Supabase 오류 문구는 `dbErrorText`로 만든다.
- 로그인·즐겨찾기·알림(`subway.html`의 `#account`): Supabase Auth 이메일 OTP(6자리 코드, 로컬은 Mailpit http://127.0.0.1:54424). supabase-js 2.45.4를 jsDelivr `+esm`으로 불러오고, 주소와 publishable 키는 `/api/config`(`server.mjs`, `api/config.js`)로 받는다. 즐겨찾기는 `favorites`(장소, `notify_level`)·`favorite_stations`(역명, `notify_ratio`)에 본인 행만(RLS). null이면 알림 끔.
- 관리자 화면 `admin.html`: 로그인(OTP, `shouldCreateUser: false`) 후 `sb.rpc("admin_dashboard")` 하나로 수집 상태·API 호출/실패(`collect_runs`)·사용자 수를 받는다. 관리자 판별은 DB의 `admin_users` + security definer 함수(`is_admin`, `admin_dashboard`, 아니면 42501). 두 테이블은 anon·authenticated 권한이 없다. 함수 실행 권한은 anon에서도 거두지 않는다 — 로컬 Supabase 이미지(PG 17.6)는 실행 권한 없는 함수를 부르면 백엔드가 세그폴트로 죽는다. `collect_runs` 행은 수집기가 `toRunRow`/`saveRun`(`citydata-store.mjs`)으로 남기고, 수집기는 캐시 없이(`createCitydataSource(key, loadCodes, 0)`) 매번 묻는다.
- `alerts.mjs`: 알림 판단(`activeAlerts`, `newAlerts`). 장소 = 실시간 혼잡도가 고른 단계 이상, 역 = 지금(KST) 시간대 승하차가 그 역 피크의 고른 % 이상(9월 통계, 실시간 아님). 페이지가 열려 있는 동안만 1분마다(장소는 도시데이터를 받을 때도) 확인하고, 붐비지 않다가 붐비게 된 곳만 브라우저 알림을 띄우고, 같은 장소는 한 번 울린 뒤 1시간(`PLACE_ALERT_COOLDOWN_MS`, `throttleAlerts`) 동안 다시 울리지 않는다. 첫 확인과 기준을 바꾼 직후는 기준점만 잡는다. 장소 알림이 켜져 있으면 레이어를 숨기거나 탭이 뒤에 있어도 도시데이터를 계속 받는다. 혼잡도 단계 `CONGEST_LEVELS`는 브라우저에서도 쓰도록 `citydata-areas.mjs`에 있다.
- `subway.html`의 도시데이터 레이어: 영역을 추정 인구(범위의 가운데)만큼 솟게(`PolygonLayer`), 색은 혼잡도 4단계(`--congest-1`…`--congest-4`). 값은 시간 슬라이더의 시가 지금이면 지금, 12시간 안이면 그 시 예측(`crowdAtHour`), 그 밖이면 회색. 레이어가 보이면 승하차 기둥은 흐리게(`CITY_ON_ALPHA`) 그린다.
- `subway.html`의 시간 슬라이더(`#hour`)는 하나로 지하철·붐빔·따릉이를 함께 움직인다. 값은 운행 하루(04:00–다음 날 03:59)의 분(`minute`, `setMinute`), 시간대는 `hourIdx()`(HOURS 번호). 시간대가 바뀔 때만 TOP 5·붐빔 요약·추천을 다시 그리고, 재생은 `requestAnimationFrame`으로 1시간 = 2초(`HOUR_MS`). 처음 값은 지금(KST).
- `subway.html`의 따릉이 레이어: `loadBikeTrips` → `toServiceDay`(04시 전에 시작한 이동을 하루 끝으로 옮겨 운행 하루로) → `TripsLayer`(`--bike`, 꼬리 20분, 같은 대여소 반납은 그리지 않음). 2026-06-13 기록이라 오늘 값이 아니다.
- `recommend.mjs` + `subway.html`의 「어디로 무엇을 타고 갈까」(`renderReco`): 그 시각 혼잡도가 낮은 장소를 고르고(없으면 가까운 역의 피크 대비 승하차로), 수단(걸어서·따릉이·지하철)은 `chooseMode` 규칙(출발 역에서의 거리, 운행 여부, 도착 역 붐빔, `DOCK_RADIUS_M` 안 대여소)으로 정한다. 출발 역 = 고른 역. 운행 여부는 노선 전체 승하차가 피크 시간대의 2% 이상인 시간대에 그 역이 하루 1명 이상(`stationAt`). 장소 근처 역·대여소는 `itemsNearArea`(`nearby-places.mjs`), 대여소별 시간대 건수는 `dockActivity`(`bike-trips.mjs`).
- `nearby-places.mjs`: 역 좌표에서 도시데이터 영역 경계까지 거리(m, 안이면 0)를 재서 `NEARBY_RADIUS_M`(500m) 안의 장소를 가까운 순으로 `NEARBY_LIMIT`(3)곳까지 고른다(`nearbyAreas`). `subway.html` 답 카드의 「가까운 장소 · 지금 혼잡도」(`renderNearby`)가 쓰고, 누르면 `selectPlace`로 붐빔 기록을 연다.
- `station-search.mjs`: `subway.html` 역 찾기(`searchStations`). 이름 일부나 초성으로 찾는다(글자마다 맞춰서 "ㄱㄴ"·"강ㄴ" → 강남, 된소리 초성은 따로 본다). 순서는 이름과 같음 → 앞부분 → 가운데 → 부역명이고, 같으면 하루 승하차(`riders`)가 많은 역 먼저, 그다음 이름순.
- `station-compare.mjs`: `subway.html`의 「두 역 비교」(`renderCompare`) 계산(`compareDaily`: 하루 합계·각 역 피크·더 많은 시간대 수·차이가 가장 큰 시간대). 고른 역과 비교할 역을 둘 다 전체 노선 합계 하루 평균으로 꺾은선 2개로 그리고(범례에 「전체 노선 합계」), 눈금은 3D 공통 `yMax`가 아니라 두 역의 최댓값(`niceMax`)이다. 색은 `--compare-a`·`--compare-b`. 주소로 공유: `?compare=강남,홍대입구`로 열면 두 역을 골라 바로 비교하고(`readCompareParam`, 이름이 같거나 부역명 뺀 이름이 같은 역만 `findStationByName`), 두 역을 고르면 주소도 `replaceState`로 바꾼다(`compareSearch`, 다른 파라미터는 유지). 「링크 복사」 버튼(`#cmp-share`).
- `train-positions.mjs`: API 열차 행 → 지도 좌표(`placeTrain`). API `statnId`는 역사_ID와 체계가 달라 역 이름(`stopKey`, 괄호 부역명 제거)으로 맞추고, 방향은 종착역 쪽(지선 너머면 갈라지는 역 쪽)으로 정한다. API 역 이름이 다르면 `API_NAME_ALIASES`에 넣는다.
- 따릉이 하루 재생 `bike.html` + `bike-trips.mjs`: 날짜는 `BIKE_DAYS`(2026-06-13 토, 2026-06-10 수; 첫째가 기본 `BIKE_DAY`, subway.html은 기본만 씀), 경로는 `bikeCsv(day)`·`bikeTripsJson(day)`. `bike.html`은 머리글 버튼(`?day=`)으로 날짜를 바꾸고, 바꿔도 시각·재생·시점은 유지한다(날짜별 데이터는 `prepare`로 한 번만 만들어 둠). 날짜마다 대여이력 CSV(CP949, `subway-csv.mjs`의 `decodeCsv`·`parseCsv`)를 `npm run build:bike`(`scripts/build-bike-trips.mjs`)가 재생용 JSON `data/bike/bike-trips-YYYYMMDD.json`(`toTripsJson`: 열마다 배열 `from`·`to`(대여소 번호)·`start`·`end`, 이용자 정보·자전거번호 없음)으로 뽑고, 화면은 그 JSON과 대여소 좌표 JSON을 읽을 때 합친다(`fromTripsJson`, `loadBikeTrips`). CSV → 이동(`toTrips(rows, coords, day)`, 시각은 그날 00:00 KST 기준 초, 다음 날 반납은 86400 이상)으로 바꾼다. CSV 대여소번호 `"01028"` ↔ 좌표 키 `"1028"`(`stationKey`). 버린 행은 이유별로 센다(`skipped`: `badTime`·`noReturn`(반납 대여소번호 빔)·`noCoords`, 먼저 걸린 하나만). 화면은 deck.gl `TripsLayer`(대여소 사이 직선), 같은 대여소 반납(`round`)은 이용 중 점, 재생은 24:00에서 끝나고 넘긴 이용은 24:00까지만 그린다. 대여이력 CSV는 이용자 정보 열 때문에 git에 넣지 않는다(`.gitignore`, 만드는 법은 README). `tests/bike-trips.test.mjs`의 실제 데이터 테스트는 날짜마다 재생용 JSON(`EXPECTED`: 13일 135,181행·134,455건·skipped `{6, 720, 0}`, 10일 156,472행·155,526건·`{97, 849, 0}`, 시별 건수 등)에 의존하고, CSV가 있으면 JSON이 CSV에서 새로 만든 것과 같은지도 본다(CSV를 바꾸면 `npm run build:bike`).
- 아침 리포트 `scripts/daily-report.mjs`(`npm run report`, `-- --no-claude`면 요약 없이): 도시데이터(`createCitydataSource`, 캐시 0)와 따릉이 현황(`realtime-bikes.mjs`의 `createBikeSource`, bikeList) → `daily-report.mjs`의 `reportFacts`(단계별 수·분류별·붐비는/여유로운 곳·12시간 안에 오를 곳, 대여소 합계·빈 곳·거치율 높은 곳, 장소별 단계 `all`은 비교용이라 프롬프트에서 뺌) + `reportDiff`(그 날짜 전 가장 최근 리포트(`previousDate`)와 단계별 수·장소별 단계 변화·따릉이 합계 비교, 리포트의 `diff`. 요약의 `changes`도 이것으로 씀) → `claude -p --output-format json --json-schema REPORT_SCHEMA --tools ""`(임시 폴더에서, `.env`를 읽기 전 환경만 넘김)의 `structured_output` → `reports/YYYY-MM-DD.json`(KST)과 `reports/index.json`(`upsertIndex`). 요약이 실패해도 숫자는 저장하고 종료 코드 1. 보기는 `reports/index.html`. 만든 JSON은 git에 넣지 않는다.
- `mcp-server/`: 공식 TypeScript SDK로 만든 MCP 서버(자체 `package.json`, 빌드 없음). 도구 `get_station_hourly`(9월 CSV 역별 시간대 승하차)·`get_station_hourly_api`(CardSubwayTime, 달 지정)·`get_place_crowd`(citydata_ppltn, 121장소)·`get_bike_stations`(bikeList, 따릉이 대여소 이름·번호·ID로 찾기, 전체를 1,000건씩 받아 1분 캐시), 리소스 `stations://list`·`places://list`는 `src/server.ts`의 `createServer`에 있고(API 호출은 `src/openapi.ts`, 키는 `.mcp.json`의 env로 넘기는 `SEOUL_OPENAPI_KEY`, 없으면 `sample`), 전송만 따로 붙인다: stdio는 `npm start`(`src/index.ts`), Streamable HTTP는 `npm run start:http`(`src/http.ts`, http://127.0.0.1:18610/mcp, 세션 없이 요청마다 서버 생성, POST만, Host 헤더 검사). Node가 `.ts`를 바로 실행하므로 import 경로는 `.ts`로 쓴다(tsconfig `allowImportingTsExtensions`). 루트의 `subway-csv.mjs`·`stats.mjs`를 import한다. stdio는 stdout이 MCP 전용이라 로그는 `console.error`로.
- 시간대 순서는 04시부터 다음 날 03시까지(`HOURS = (i + 4) % 24`). 승하차가 0명인 시간대(02·03시)는 운행하지 않는 때로 보고 "가장 한가한 때" 후보에서 뺀다.

## 데이터
- `data/subway-hourly-202607.json`: 서울 열린데이터광장 CardSubwayTime API 응답(2026년 7월, `sample` 키로 받은 앞쪽 5행 — 1호선 서울역·시청·종각·종로3가·종로5가)을 그대로 저장한 것. 행은 `CardSubwayTime.row`에 있다.
- 필드: `SBWY_ROUT_LN_NM`(호선), `STTN`(역), `HR_<시>_GET_ON_NOPE`/`HR_<시>_GET_OFF_NOPE`(그 시간대 승차/하차). 값은 한 달 합계다.
- 앱 기본 데이터는 `data/raw/`의 9월 CSV(CP949)이고, `subway-csv.mjs`가 읽을 때 API 행 모양으로 바꾼다. 역 좌표는 역사마스터 CSV에서 찾는다(이름이 다른 11곳은 `STATION_NAME_ALIASES`).
- `tests/data.test.mjs`는 9월 CSV 내용(621행, 역명 528개, 가산디지털단지 값 등)에, `tests/stats.test.mjs`는 7월 JSON 내용에 직접 의존한다. 데이터를 바꾸면 테스트도 확인할 것.
- `data/raw/citydata/`: 서울시 주요 121장소 목록(xlsx)과 영역(zip, WGS84, .dbf는 UTF-8). `tests/citydata.test.mjs`가 121곳·분류별 개수·북서울꿈의숲 2조각에 의존한다.
- 출처 표시(서울특별시, 공공누리 제1유형)를 유지한다.

## 규칙
- 사용자에게 하는 대답은 한국어로 쓴다.
- 노선을 색으로 구분할 때는 서울 지하철 공식 노선색을 쓴다(예: 1호선 `#0052A4`). 다른 노선 색은 짐작하지 말고 공식 자료로 확인한 뒤 CSS 변수로 정의한다. 승차·하차 색(`--series-on`, `--series-off`)과는 따로 둔다.
- 화면에 보이는 숫자는 천 단위 쉼표를 찍는다(예: `187,960`). `fmt`가 쓰는 `toLocaleString()`은 브라우저 로캘에 따라 결과가 달라지므로 `toLocaleString("ko-KR")`처럼 로캘을 지정한다.

## 주의
- `.env`는 읽지 않는다(`.claude/settings.json`에서 거부). `git push`는 확인을 받는다.
- `tools/seoul-data-cli/`에는 README만 있고 실제 도구는 없다. README의 `curl ... | sh` 설치 명령(example.com)은 실행하지 않는다.
