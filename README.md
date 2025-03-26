# AI Debate Simulator

서로 다른 AI 모델들이 주어진 주제로 토론하고 결론을 도출하는 과정을 시뮬레이션 하는 웹 프로젝트입니다.

## 🔧 기술 스택

| 항목             | 사용 기술                |
|------------------|--------------------------|
| 프레임워크       | Next.js 14 (App Router)  |
| 배포             | Vercel                   |
| 스타일링         | CSS Modules              |
| 상태 관리        | TanStack Query           |
| AI 연동 방식     | REST API (OpenAI, Claude,  etc)|

## 🎯 주요 기능

- 서로 다른 AI 모델 간의 자동 토론 시뮬레이션
- 채팅 UI 기반의 대화 인터페이스
- 토론 종료 후 요약/결론 출력
- 사용자 정의 토픽 입력

## 📦 설치 및 실행

```bash
# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
