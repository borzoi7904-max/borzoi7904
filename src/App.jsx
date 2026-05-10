import React, { useState, useEffect } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import Calendar from './components/Calendar';
import ScheduleList from './components/ScheduleList';
import { fetchEvents } from './utils/googleApi';
import { FcGoogle } from 'react-icons/fc';

function App() {
  const [token, setToken] = useState(null);
  
  // 현재 선택된 날짜 (우측 사이드바에서 상세 정보를 볼 기준 날짜)
  const [targetDate, setTargetDate] = useState(new Date());
  
  // 달력에서 보고 있는 연/월 (좌측 대형 달력 기준)
  const [currentViewDate, setCurrentViewDate] = useState(new Date());

  // 이번 달(및 전후 달)의 모든 일정을 담을 상태
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // 구글 로그인 함수
  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      setToken(codeResponse.access_token);
    },
    onError: (error) => console.log('Login Failed:', error),
    scope: 'https://www.googleapis.com/auth/calendar.events'
  });

  const logOut = () => {
    googleLogout();
    setToken(null);
    setEvents([]);
  };

  // 월이 바뀌거나 토큰이 발급되면 해당 기간의 전체 일정을 불러옵니다.
  const loadMonthEvents = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await fetchEvents(token, currentViewDate);
      const items = data.items || [];
      // 완료된 항목과 미완료 항목을 분리해서 정리 (달력에 예쁘게 그리기 위함)
      const formattedEvents = items.map(ev => {
        const title = ev.summary || '';
        const isDone = title.includes('완료') || title.includes('📝') || title.includes('기록');
        return { ...ev, isDone, title };
      });
      setEvents(formattedEvents);
    } catch (err) {
      console.error(err);
      alert(err.message); // 403 오류 시 API 활성화 안내 메시지가 뜹니다.
    } finally {
      setLoading(false);
    }
  };

  // 토큰이나 달력의 기준 월이 바뀔 때마다 다시 불러옴
  useEffect(() => {
    loadMonthEvents();
  }, [token, currentViewDate.getFullYear(), currentViewDate.getMonth()]);

  if (!token) {
    return (
      <div className="app-container login-container">
        <div>
          <h1 className="login-title">✨ My Pastel Calendar ✨</h1>
          <p style={{ color: 'var(--text-sub)' }}>나만의 일정을 상큼하고 크게 관리해보세요!</p>
        </div>
        <button className="btn pastel-card" onClick={() => login()} style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <FcGoogle size={28} /> 구글 계정으로 시작하기
        </button>
      </div>
    );
  }

  return (
    <div className="app-container expanded">
      <div className="header-bar">
        <h1 style={{ color: 'var(--primary-hover)', fontSize: '1.8rem' }}>✨ My Pastel Calendar</h1>
        <button className="logout-btn" onClick={logOut}>로그아웃</button>
      </div>
      
      {/* 7:3 레이아웃 (달력 7, 우측 리스트 3) */}
      <div className="main-layout large-view">
        {/* 달력 영역 */}
        <div className="calendar-section">
          <Calendar 
            targetDate={targetDate} 
            setTargetDate={setTargetDate}
            currentViewDate={currentViewDate}
            setCurrentViewDate={setCurrentViewDate}
            events={events}
            loading={loading}
          />
        </div>
        
        {/* 선택한 날짜의 세부 일정 리스트 (사이드바) */}
        <div className="sidebar-section">
          <ScheduleList 
            token={token} 
            targetDate={targetDate} 
            events={events}           /* 필요한 경우 필터링해서 쓰도록 넘김 */
            refreshEvents={loadMonthEvents} /* 새 일정 추가/삭제 시 달력 전체 새로고침용 */
          />
        </div>
      </div>
    </div>
  );
}

export default App;
