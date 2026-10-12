# 서울 라이브 3D

인프런 강의 「클로드 코드 실전」에서 클로드 코드로 함께 키워 가는 실습 앱입니다. 수업별 시작·정답 파일은 [claude-code-inflearn-practice](https://github.com/dante01yoon/claude-code-inflearn-practice)에 있습니다.

`.env.example`을 `.env`로 복사해 쓰세요(서울 열린데이터광장 공개 `sample` 키).

## 지금 단계 (섹션 1 Git 수업까지)

강의 내내 키워 갈 「서울 라이브 3D」의 첫 모습입니다. 섹션 1에서는 지하철 역 몇 곳의 시간대별 승하차 인원을 화면에 띄우면서 클로드 코드의 핵심 기능을 익힙니다.

## 데이터
- `data/subway-hourly-202607.json` — 서울 열린데이터광장 「서울시 지하철 호선별 역별 시간대별 승하차 인원 정보」(CardSubwayTime) 2026년 7월분.
  공개 `sample` 키로 받은 앞쪽 5행(1호선 서울역·시청·종각·종로3가·종로5가)을 그대로 저장했습니다.
  값은 한 달 동안의 합계입니다(예: `HR_8_GET_ON_NOPE` = 7월 한 달 동안 08시대에 그 역에서 탄 사람 수).
- 받은 주소: `http://openapi.seoul.go.kr:8088/sample/json/CardSubwayTime/1/5/202607/`
- 필드: `SBWY_ROUT_LN_NM`(호선), `STTN`(역), `HR_<시>_GET_ON_NOPE`(그 시간대 승차 인원), `HR_<시>_GET_OFF_NOPE`(하차 인원). 시간대는 04시부터 다음 날 03시까지.
- 출처: 서울특별시 (https://data.seoul.go.kr/dataList/OA-12252/S/1/datasetView.do), 공공누리 제1유형(출처 표시).

### 원본 CSV (`data/raw/`, 2026년 9월)
열린데이터광장에서 내려받은 CSV를 그대로 저장했습니다. 두 파일 모두 인코딩은 **CP949**이고, 내용은 고치지 않습니다(가공은 읽을 때 코드에서 합니다).

- `data/raw/서울시 지하철 호선별 역별 시간대별 승하차 인원 정보.csv` — 기준 달 2026년 9월(`사용월` 202609), 621행(머리글 제외).
  열 이름이 API와 다릅니다(`04시-05시 승차인원` ↔ `HR_4_GET_ON_NOPE`, 23시 열은 `23시-24시`).
  - 받은 주소: https://data.seoul.go.kr/dataList/OA-12252/S/1/datasetView.do
- `data/raw/서울시 역사마스터 정보.csv` — 기준 달 2026년 9월. 역 위치(`역사_ID`, `역사명`, `호선`, `위도`, `경도`), 784행(노선별 지점).
  - 받은 주소: https://data.seoul.go.kr/dataList/OA-21232/S/1/datasetView.do
- 출처: 서울특별시, 공공누리 제1유형(출처 표시).

### 따릉이 대여소 좌표 (`data/bike/`, 2026년 6월 기준)
- `data/bike/station-coords-202606.json` — 「공공자전거 대여소 정보(26.6월 기준).xlsx」에서 대여소 번호별 위도·경도만 뽑은 것. `{ "102": { "lat": 37.5556488, "lng": 126.91062927 }, … }` 모양, 2,789곳(엑셀의 모든 대여소, 빠지거나 겹친 번호 없음), 번호 순.
- 엑셀 원본은 저장소에 넣지 않았습니다. 값은 엑셀에 적힌 그대로입니다(WGS84).
- 출처: 서울특별시(서울 열린데이터광장 「서울시 공공자전거 대여소 정보」), 공공누리 제1유형(출처 표시).

### 따릉이 대여이력 (`data/bike/`, 2026년 6월 13일 토요일·6월 10일 수요일)
열린데이터광장의 「서울특별시 공공자전거 대여이력 정보」 2026년 6월분(`서울특별시 공공자전거 대여이력 정보_2606.csv`, 4,182,797행)에서 `대여일시`가 그날인 행만 골라 날짜마다 저장했습니다. 아래는 6월 13일 기준 설명이고, 6월 10일(평일 비교용)은 파일 이름의 날짜만 다릅니다(`bike-rentals-20260610.csv` 156,472행, `bike-trips-20260610.json` 155,526건, 약 3.3MB). 머리글과 각 행은 원본 바이트 그대로(인코딩 **CP949**, 따옴표 포함)이고 순서도 원본 순서입니다. 지도에서 하루 이동을 재생하는 데 씁니다.

- `data/bike/bike-rentals-20260613.csv` — 135,181행(머리글 제외). 열: `자전거번호`, `대여일시`, `대여 대여소번호`, `대여 대여소명`, `대여거치대`, `반납일시`, `반납대여소번호`, `반납대여소명`, `반납거치대`, `이용시간(분)`, `이용거리(M)`, `생년`, `성별`, `이용자종류`, `대여대여소ID`, `반납대여소ID`.
  - 대여 기준으로 골랐으므로 13일에 빌려 14일에 반납한 행은 들어 있고, 12일에 빌려 13일에 반납한 행은 없습니다.
  - 대여소 좌표는 이 파일에 없습니다(대여소 정보 파일이나 `bikeList` API의 `ST-` ID로 맞춰야 함).
  - 받은 주소: https://data.seoul.go.kr/dataList/OA-15182/F/1/datasetView.do
  - **저장소에는 넣지 않습니다**(`.gitignore`). `생년`·`성별`·`이용자종류` 같은 이용자 정보 열이 있기 때문입니다. `bike.html`은 이 파일 대신 아래 재생용 JSON을 읽고, `tests/bike-trips.test.mjs`의 원본 CSV 테스트는 파일이 없으면 건너뜁니다. 위 주소에서 6월분 CSV를 받아 같은 행을 골라 만듭니다.
    ```sh
    SRC="서울특별시 공공자전거 대여이력 정보_2606.csv"
    for D in 2026-06-13 2026-06-10; do
      { head -n 1 "$SRC"; LC_ALL=C grep -a "^\"[^\"]*\",\"$D " "$SRC"; } > "data/bike/bike-rentals-${D//-/}.csv"
    done
    ```
- `data/bike/bike-trips-20260613.json` — 위 CSV에서 재생에 필요한 값만 뽑은 것(`npm run build:bike`, `scripts/build-bike-trips.mjs`, 약 2.9MB). 저장소에 넣습니다. `npm run build:bike`는 CSV가 있는 날짜를 모두 만들고, `npm run build:bike -- 2026-06-10`처럼 날짜를 주면 그날만 만듭니다.
  - 모양: `{ day, source, total, skipped, from, to, start, end }`. `from`·`to`·`start`·`end`는 길이가 같은 배열이고 i번째 값끼리 이동 하나입니다. `from`·`to`는 대여·반납 대여소 번호(좌표 JSON 키, 0 채움 없는 숫자), `start`·`end`는 2026-06-13 00:00(KST) 기준 초(다음 날 반납은 86400 이상). 순서는 CSV 순서 그대로입니다.
  - 자전거번호·대여소명·거치대·이용시간·이용거리·생년·성별·이용자종류·대여소ID는 넣지 않습니다. 반납 대여소가 없거나 좌표가 없는 행은 빼고, 몇 행을 왜 뺐는지는 `total`·`skipped`에 남깁니다.
- 출처: 서울특별시, 공공누리 제1유형(출처 표시).

## 보기
이 폴더에서 `npm start`(Node 22 이상) 후 http://127.0.0.1:8000 을 엽니다. 데이터를 `fetch`로 읽고 ES 모듈을 쓰기 때문에 `index.html`을 파일로 바로 열면(`file://`) 동작하지 않습니다.

`server.mjs`는 저장소 파일을 내보내면서 `/api/trains`로 실시간 열차 위치를 대신 받아 줍니다. `.env`, `.git`처럼 점으로 시작하는 경로는 내보내지 않습니다. `python3 -m http.server`로 열어도 승하차 화면은 보이지만 실시간 열차는 나오지 않고, `.env`까지 그대로 내보내므로 쓰지 않는 편이 좋습니다.

### Vercel 배포
`vercel deploy`(미리보기)로 올립니다. 정적 파일은 그대로 내보내고 `/api/trains`는 `api/trains.js` 함수가 맡습니다(`server.mjs`와 같은 `realtime-trains.mjs`를 씀). 인증키는 Vercel 환경 변수 `SEOUL_REALTIME_KEY`에서 읽으며, 없으면 `sample` 키를 씁니다. 환경 변수를 바꾸면 다시 배포해야 반영됩니다. `.vercelignore`가 `.env`를 비롯한 점 파일, 문서, 테스트, `server.mjs`를 올리지 않습니다.

### 실시간 열차 위치 (`subway.html`)
- API: 서울 열린데이터광장 「서울시 지하철 실시간 열차 위치정보」(`realtimePosition`), `http://swopenapi.seoul.go.kr/api/subway/<인증키>/json/realtimePosition/0/<끝>/<노선명>`.
- 인증키는 일반 인증키와 따로 발급하는 **실시간 지하철 인증키**입니다. `.env`에 `SEOUL_REALTIME_KEY=발급받은키`로 넣으면 서버만 읽고 브라우저로 보내지 않습니다. 없으면 공개 `sample` 키를 써서 노선마다 열차 5대만 보입니다.
- 서버는 노선 19개(경전철·인천 1·2호선은 API가 위치를 주지 않음)를 20초에 한 번만 묻고, 화면은 보일 때만 30초마다 다시 받습니다.
- API는 "어느 역에 진입·도착·출발"만 줍니다. 지도 위치는 `subway-lines.mjs`의 역 순서와 역사마스터 좌표로 `train-positions.mjs`가 정합니다.
- 출처: 서울특별시 (https://data.seoul.go.kr/dataList/OA-12601/A/1/datasetView.do), 공공누리 제1유형(출처 표시).

### 실시간 도시데이터 (`subway.html`)
- API: 서울 열린데이터광장 「서울시 실시간 인구데이터」(`citydata_ppltn`), `http://openapi.seoul.go.kr:8088/<인증키>/json/citydata_ppltn/1/5/<장소코드>`. 장소마다 지금 혼잡도·추정 인구 범위와 12시간 예측을 줍니다.
- 인증키는 **일반 인증키**입니다(실시간 지하철 인증키와 다름). `.env`에 `SEOUL_OPENAPI_KEY=발급받은키`로 넣습니다. 없으면 `sample` 키를 쓰는데, sample 키는 어느 장소를 물어도 광화문·덕수궁 1곳만 돌려줍니다.
- 서버는 121곳을 5분에 한 번(동시 8개씩)만 묻습니다. 장소 영역은 `data/raw/citydata/서울시 주요 121장소 영역.zip`을 읽을 때 풀어서 씁니다(`citydata-areas.mjs`).
- API는 지금 값과 예측만 주고 지난 기록은 주지 않습니다. `npm run collect -- --watch`를 켜 두면 5분마다 121곳을 받아 Supabase `crowd_snapshots`에 쌓습니다(한 번만 받으려면 `npm run collect`, crontab 등에서 부를 때). 같은 장소·같은 시각(`PPLTN_TIME`)은 한 번만 들어갑니다.
  `.env`에 `SUPABASE_URL`(로컬은 `http://127.0.0.1:54421`)과 `SUPABASE_SERVICE_ROLE_KEY`(`npx supabase status`의 Secret 키)를 넣습니다. 이 키는 RLS를 우회하므로 브라우저 코드에 넣지 않습니다.
- 지도에서 장소 영역을 누르면 쌓인 기록 중 최근 24시간을 작은 그래프로 보여 줍니다(선 = 추정 인구 범위의 가운데, 회색 띠 = 범위, 아래 띠 = 혼잡도, 수집이 멈춘 구간은 끊김). 서버가 `/api/crowd-history?code=POI009`로 읽어 주며, `.env`(Vercel은 환경 변수)에 `SUPABASE_URL`과 `SUPABASE_PUBLISHABLE_KEY`(`npx supabase status`의 Publishable 키, 읽기 전용)가 필요합니다.
- 출처: 서울특별시 (https://data.seoul.go.kr/dataList/OA-21778/S/1/datasetView.do), 공공누리 제1유형(출처 표시).

### 두 역 비교 주소로 공유하기 (`subway.html`)
`subway.html?compare=강남,홍대입구`처럼 역 이름 두 개를 쉼표로 이어 주소에 붙이면, 열자마자 두 역이 골라지고 「두 역 비교」 그래프가 나옵니다(로컬은 http://127.0.0.1:8000/subway.html?compare=강남,홍대입구). 앞의 역이 「역 찾기」에서 고른 역, 뒤의 역이 비교할 역이 됩니다. 역 이름은 화면에 보이는 이름과 같아야 하고, 괄호 부역명은 빼도 됩니다(`잠실` → 잠실(송파구청)). 초성이나 이름 일부로는 찾지 않으며, 찾지 못한 역은 비교 패널에 알려 줍니다. 화면에서 두 역을 고르면 주소창도 같은 모양으로 바뀌므로, 주소를 그대로 복사하거나 비교 그래프 아래 「링크 복사」 버튼을 눌러 공유하면 됩니다.

### 시간 슬라이더 · 따릉이 · 어디로 무엇을 타고 갈까 (`subway.html`)
- 시간 슬라이더 하나(운행 하루 04:00–다음 날 03:59, 분 단위, 처음 값은 지금)로 지하철 기둥(9월 시간대 평균), 도시데이터 영역(그 시의 지금·12시간 예측, 그 밖은 회색), 따릉이 이동선(2026년 6월 13일 기록, `bike.html`과 같은 재생용 JSON)을 함께 움직입니다. 데이터마다 날짜가 다르고 시각만 맞춘 것입니다.
- 「어디로 무엇을 타고 갈까」는 그 시각 혼잡도가 낮은 장소 3곳과 갈 수단(걸어서·따릉이·지하철)을 `recommend.mjs`의 단순 규칙으로 고릅니다. 역을 고르면 그 역에서 출발하는 거리까지 봅니다. 실제 경로·소요 시간·남은 자전거 수는 보지 않습니다.

### 로그인 · 즐겨찾기 · 붐빔 알림 (`subway.html`)
- 이메일로 받은 6자리 코드로 로그인합니다(Supabase Auth). 로컬에서는 메일이 실제로 나가지 않고 Mailpit(http://127.0.0.1:54424)에 쌓입니다.
- 답 카드의 ☆ 내 역, 장소 기록 패널의 ☆ 즐겨찾기로 저장하고, 「내 즐겨찾기 · 붐빔 알림」 패널에서 기준을 고릅니다.
  - 장소: 실시간 혼잡도가 보통 / 약간 붐빔(기본) / 붐빔 이상이면.
  - 내 역: 지금 시간대 승하차(9월 통계)가 그 역 하루 피크의 40–90%(기본 60%) 이상이면. 역에는 실시간 인원 데이터가 없어 통계로 판단합니다.
- 알림은 **페이지가 열려 있는 동안**만 확인합니다. 지금 붐비는 곳은 패널에 늘 보이고, 새로 붐비게 된 곳은 브라우저 알림(「브라우저 알림 켜기」로 허용)을 띄웁니다.
- `.env`(Vercel은 환경 변수)에 `SUPABASE_URL`·`SUPABASE_PUBLISHABLE_KEY`가 필요합니다. 브라우저는 `/api/config`로 이 둘만 받습니다(publishable 키는 공개용이고 권한은 RLS가 막습니다).
- 장소 즐겨찾기는 DB의 `places`를 참조하므로 `npm run collect`를 한 번은 실행해 두어야 합니다. 마이그레이션은 `npx supabase migration up`으로 적용합니다.
- 배포한 Supabase 프로젝트에서는 Authentication → Email Templates의 Magic Link 템플릿에 `{{ .Token }}`(6자리 코드)을 넣어야 코드가 메일에 나옵니다. 로컬 기본 템플릿에는 이미 들어 있습니다.

### 관리자 화면 (`admin.html`)
- http://127.0.0.1:8000/admin.html. 수집 상태(정상·지연·멈춤), 최근 24시간 API 호출·실패, 시간대별 호출 그래프, 자주 난 오류, 최근 수집 실행 20번, 사용자 수(전체·7일 가입·7일 로그인·즐겨찾기·알림)를 1분마다 갱신해 보여 줍니다.
- 숫자는 DB 함수 `admin_dashboard()`가 돌려주고, 이 함수는 `admin_users`에 있는 사용자가 아니면 거절합니다. 그래서 페이지는 누구나 열 수 있어도 관리자가 아니면 숫자를 받지 못합니다. 이 화면에서는 새 계정을 만들지 않습니다.
- 관리자 지정은 Supabase SQL 편집기에서: `insert into public.admin_users (user_id) select id from auth.users where email = '메일';` (지우면 바로 권한이 없어집니다). 로컬 seed에는 `admin@example.com`이 관리자로 들어 있습니다.
- 호출 수·실패는 `npm run collect`가 실행마다 `collect_runs`에 남긴 기록입니다. 이 기능 전부터 켜 둔 `--watch` 수집기는 다시 시작해야 기록이 쌓입니다. 지도 화면이 쓰는 `/api/trains`·`/api/citydata` 프록시 호출은 세지 않습니다.

### 아침 서울 데이터 리포트 (`reports/`)
- `npm run report`: 실시간 도시데이터 121곳과 따릉이 대여소 현황을 받아 숫자를 정리하고, `claude -p`(도구 없이, `--json-schema`)로 한국어 요약을 JSON으로 받아 `reports/YYYY-MM-DD.json`(KST 날짜, 같은 날 다시 돌리면 덮어씀)과 목록 `reports/index.json`에 저장합니다. 그 날짜 전의 가장 최근 리포트와 비교해 혼잡도 단계별 장소 수, 더 붐비게 된/한가해진 장소, 따릉이 합계가 얼마나 바뀌었는지도 함께 저장하고 보여 줍니다(이 기능 전에 만든 리포트와는 단계별 수만 비교). 요약 없이 숫자만 저장하려면 `npm run report -- --no-claude`.
- 보기: `npm start` 후 http://127.0.0.1:8000/reports/ (날짜를 고르면 `?day=`로 바뀝니다).
- 키는 `.env`의 `SEOUL_OPENAPI_KEY`(없으면 sample 키: 도시데이터 1곳, 따릉이 5곳). `claude`에는 `.env` 값을 넘기지 않습니다. `REPORT_MODEL`로 모델을, `CLAUDE_BIN`으로 `claude` 경로를 바꿀 수 있습니다.
- 매일 아침 돌리기(예: 7시, `crontab -e`). cron은 PATH가 짧으므로 `node`·`claude`를 절대 경로로 적습니다(`which node`, `which claude`). Mac이 잠들어 있으면 그 시각은 건너뜁니다.
  ```
  0 7 * * * cd /경로/seoul-live-3d && CLAUDE_BIN=/절대경로/claude /절대경로/node scripts/daily-report.mjs >> reports/cron.log 2>&1
  ```
- 만든 리포트(`reports/*.json`)는 git에 넣지 않습니다.

맨 위 3D 장면은 역마다 승차·하차 기둥을 세우고, 시간 슬라이더로 시간대를 바꾸면 높이가 바뀝니다. 역 좌표는 데이터에 없어 `index.html`에 근사값으로 넣었습니다. 3D 렌더링에는 [Three.js](https://threejs.org/)(MIT, CDN 로드)를 씁니다.

## 권한 설정
`.claude/settings.json`에 테스트·데이터 검사 허용 규칙이 있습니다.
