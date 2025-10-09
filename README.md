## 📜 프로젝트 개발 계획서 (v3.4.0)
1. 프로젝트 명세서 (The 'Why' & 'Big What')

1.1. 프로젝트 개요
"나만의 CBT 웹 앱"은 사용자가 직접 문제와 개념(키워드, 태그)을 구조화하여 학습할 수 있는 개인 맞춤형 CBT(Computer-Based Testing) 웹 애플리케이션입니다.

1.2. 비전 및 목표

비전: 지식의 계층 구조와 관계망을 활용하여, 학습자가 자신의 앎을 스스로 점검하고 완성해나가는 메타인지 기반 학습 플랫폼 구축.

1.3. 기술 스택

Frontend: HTML, CSS, JavaScript (Vanilla JS)

Backend & Database: Google Firebase (Firestore, Authentication)

1.4. 데이터 구조 (Firestore)

subjects (컬렉션)

name: 과목명

discipline: 학문 (예: 응급구조사, 자격증)

semester: 학기 (선택 사항, 예: 1-2)

questionCount: 문제 수

questions (서브컬렉션)

text, answer, explanation

part, chapter, section: 목차 정보

examYear, examRound, examNumber: 기출 정보

options, keywords, tags, metatags

users (컬렉션)

settings: 사용자 설정 객체

subjectTreeState: 개별 노드 펼침/접힘 상태

subjectTreeDefaultState: 트리 기본 보기 상태

1.5. 핵심 수정 내역 (Key Changes History)

v3.4.0: 목차 구조 10단계 확장

페이징 기능 구현: 문제 관리 '전체 목록' 화면에 페이지당 20개씩 문제를 나눠 보여주는 페이징 UI 및 로직 추가.

문제 데이터의 목차 정보 필드를 part, chapter, section에서 level1 ~ level10으로 확장.

문제 추가/수정 화면의 UI를 10단계 입력 필드로 변경.

'목차별 보기'의 트리 구조가 최대 10단계를 지원하도록 로직 수정.

v3.3.0: Git 기반 버전 관리 시스템 도입

Git과 GitHub를 도입하여 프로젝트의 모든 코드 변경 이력을 체계적으로 관리 시작.

주요 개발 완료 시점마다 Tag를 사용하여 버전 번호를 부여하는 시스템 구축.

v3.2.2: 버그 수정 및 안정화

과목 트리 기본 상태 설정 기능 오류 해결 및 초기화 로직 안정화.

v3.2: 과목 트리 제어 및 검색 기능

과목 그룹화: '학문 → (학기) → 과목'의 계층형 트리 구조 도입.

v3.1: '투트랙' 학습 모드 도입

문제 관리 화면에 '목차별', '회차별', '키워드별' 학습 모드 선택 기능 추가.

v3.0 이전:

Firebase 기반 CRUD 및 인증 기능 구현.

1.6. 향후 개발 로드맵 (To-Do & Future)

1순위: UI/UX 고도화

[신규 기획] 문제 관리 화면에 무한 스크롤 기능 도입 (페이징과 선택적 적용 고려).

[진행 예정] 반응형 디자인 (모바일 최적화).

2순위: 메타인지 및 학습 기능 강화

[신규 기획] 점진적 학습 기능: 오늘의 목표 설정 및 달성률 표시.

[신규 기획] 학습 습관화 기능: 학습 달력(잔디), 스트릭 카운터.

[신규 기획] 학습 데이터 분석: 과목/파트별 정답률 대시보드.

3순위: 기타 기능

[고려 사항] 문제에 이미지 첨부 기능.

2. 현재 SOW (Scope of Work): 문제 관리 화면 UI 개선

목표: 웹 앱의 모든 화면을 다양한 화면 크기(특히 모바일 기기)에서도 불편함 없이 사용할 수 있도록 반응형 디자인을 적용한다.

주요 결과물:

화면 너비에 따라 레이아웃이 유연하게 변경되도록 CSS 수정.

모바일 환경에 적합한 폰트 크기 및 버튼 크기 적용.

3. 개발 워크플로우 및 버전 관리 (Development Workflow & Versioning)

3.1. 개발 흐름 (Development Flow)

계획 (Plan): README.md의 'SOW'와 '개발 로드맵'을 수정하여 다음 버전에 구현할 기능을 명확히 정의한다.

계획 공유 (Commit & Push Plan): 확정된 계획서를 docs: Plan for vX.X.X와 같은 커밋 메시지와 함께 GitHub에 푸시하여 계획을 공식화한다.

개발 (Code & Commit): 기능 개발을 진행하며, 의미 있는 단위로 작업을 나누어 feat:, fix: 등의 메시지와 함께 수시로 커밋하고 푸시한다.

완료 및 태그 (Tag & Release): 기능 구현이 완료되고 안정화되면, git tag vX.X.X 명령어로 버전을 확정하고 태그를 푸시한다. 이것으로 한 사이클이 종료된다.

3.2. 버전 관리 (Versioning)

Major.Minor.Patch 형식의 시맨틱 버저닝을 따른다.

모든 공식 버전은 Git 태그를 통해 관리하며 GitHub Tags 페이지에서 이력을 확인할 수 있다.

커밋 메시지는 타입: 제목 형식을 따른다. (e.g., feat:, fix:, docs:)

4. 개발 일지 (Development Log)

v3.4.0: 페이징 기능 및 목차 구조 확장

2025-10-09:

문제 관리 '전체 목록' 화면에 페이지당 20개씩 문제를 나눠 보여주는 페이징 기능 구현 완료.

목차 구조를 3단계에서 10단계로 확장하는 기능 구현 완료.

두 기능의 완성을 v3.4.0으로 확정하고 README.md 갱신.

개발 워크플로우 구체화.

v3.3.0: 버전 관리 시스템 도입

2025-10-08: Git/GitHub 버전 관리 시스템 도입 결정 및 구축 완료.

로컬 컴퓨터에 Git 설치 및 사용자 정보 설정 (git config).

index.html 파일 위치 문제 해결 및 my-cbt-app 프로젝트 폴더 생성.

README.md 파일에 v3.3.0 프로젝트 계획서 추가 및 GitHub 업로드.

git commit 실패 후 사용자 정보 설정 문제 해결 및 첫 커밋/푸시 성공.

v3.3.0 태그 생성 및 GitHub 업로드 완료.

