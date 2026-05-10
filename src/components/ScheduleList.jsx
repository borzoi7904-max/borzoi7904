import React, { useState } from 'react';
import { addEvent, deleteEvent } from '../utils/googleApi';
import { FiCheck, FiPlus, FiBriefcase, FiHome, FiHeart, FiFileText } from 'react-icons/fi';
import { parseISO, subDays, addDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

export default function ScheduleList({ token, targetDate, events, refreshEvents }) {
  const [memoInput, setMemoInput] = useState('');
  const [alarmMinutes, setAlarmMinutes] = useState(-1); // 알람 상태 추가 (기본값 -1: 알람 없음)

  // 1. 선택된 날짜 (targetDate) 기준으로 -3일, +7일의 범위 계산
  const rangeStart = startOfDay(subDays(targetDate, 3));
  const rangeEnd = endOfDay(addDays(targetDate, 7));

  // 2. 전체 이벤트 중 범위 내에 있고, 완료되지 않은(isDone === false) 이벤트만 필터링합니다.
  const filteredEvents = events.filter(ev => {
    const evDateStr = ev.start?.dateTime || ev.start?.date;
    if (!evDateStr) return false;
    
    const evDate = parseISO(evDateStr);
    const inRange = isWithinInterval(evDate, { start: rangeStart, end: rangeEnd });
    
    // 범위 내에 있으면서, 완료되지 않은 이벤트만 반환
    return inRange && !ev.isDone;
  });

  // 3. 날짜 오름차순으로 정렬
  filteredEvents.sort((a, b) => {
    const dateA = parseISO(a.start?.dateTime || a.start?.date);
    const dateB = parseISO(b.start?.dateTime || b.start?.date);
    return dateA - dateB;
  });

  // customAlarm 값이 전달되지 않으면 현재 선택된 alarmMinutes 사용
  const handleAdd = async (title, isNine = false, customAlarm = alarmMinutes) => {
    try {
      await addEvent(token, targetDate, title, isNine, customAlarm);
      setMemoInput(''); 
      refreshEvents(); // 추가 후 달력 전체 새로고침
    } catch (err) {
      console.error(err);
      alert('기록 중 에러가 발생했습니다.');
    }
  };

  const handleComplete = async (ev) => {
    if (window.confirm(`'${ev.title}' 일정을 완료 처리할까요?`)) {
      try {
        await deleteEvent(token, ev.id);
        await handleAdd(`${ev.title} (완료)`, false);
      } catch (e) {
        console.error(e);
        alert('완료 처리 중 에러가 발생했습니다.');
      }
    }
  };

  return (
    <div className="pastel-card sidebar-wrapper">
      <h3 className="schedule-list-header">
        📝 미완료 일정 (-3일 ~ +7일)
      </h3>

      <div className="sidebar-scroll-area">
        <ul className="schedule-list">
          {filteredEvents.length === 0 && <li style={{ color: 'var(--text-sub)' }}>등록된 미완료 일정이 없습니다.</li>}
          
          {filteredEvents.map((ev) => {
            const evDate = parseISO(ev.start?.dateTime || ev.start?.date);
            const timeStr = ev.start?.dateTime 
              ? evDate.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true }) 
              : '하루종일';
            
            // 날짜 표시 (예: 5/10)
            const dateStr = `${evDate.getMonth() + 1}/${evDate.getDate()}`;

            return (
              <li 
                key={ev.id} 
                className="schedule-item"
                onClick={() => handleComplete(ev)}
              >
                <div className="schedule-content">
                  <span className="schedule-title">
                    <span style={{ color: 'var(--primary)', marginRight: '6px', fontSize: '0.85rem' }}>{dateStr}</span>
                    {ev.title}
                  </span>
                  <span className="schedule-time">{timeStr}</span>
                </div>
                <button className="icon-btn" style={{ width: '32px', height: '32px' }} aria-label="완료">
                  <FiCheck />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="quick-add-container sidebar-add">
        <div style={{fontSize:'0.85rem', color:'var(--text-sub)', marginBottom:'-5px'}}>
          *추가되는 일정은 달력에서 <strong>선택된 날짜({targetDate.getMonth()+1}/{targetDate.getDate()})</strong> 기준입니다.
        </div>
        <div className="input-group">
          <input
            type="text"
            className="input-pastel"
            placeholder="일정/메모 입력"
            value={memoInput}
            onChange={(e) => setMemoInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && memoInput.trim() && handleAdd(`📌 ${memoInput.trim()}`)}
          />
          {/* 알람 시간 선택 드롭다운 (글꼴 및 스타일에 맞게 적용) */}
          <select 
            className="input-pastel" 
            style={{ width: 'auto', flex: 'none', padding: '0.5rem' }}
            value={alarmMinutes} 
            onChange={(e) => setAlarmMinutes(Number(e.target.value))}
          >
            <option value={-1}>알람 끔</option>
            <option value={0}>정각</option>
            <option value={5}>5분 전</option>
            <option value={10}>10분 전</option>
            <option value={30}>30분 전</option>
            <option value={60}>1시간 전</option>
          </select>
          <button className="btn btn-primary" onClick={() => memoInput.trim() && handleAdd(`📌 ${memoInput.trim()}`)}>
            <FiPlus /> 추가
          </button>
        </div>

        <div className="quick-buttons">
          <button className="btn btn-action" onClick={() => memoInput.trim() && handleAdd(`📝 메모: ${memoInput.trim()}`)}>
            <FiFileText /> 메모
          </button>
          <button className="btn btn-action" onClick={() => handleAdd('🏢 출근 완료', true)}>
            <FiBriefcase /> 출근
          </button>
          <button className="btn btn-action" onClick={() => handleAdd('🏃 퇴근 완료', false)}>
            <FiHome /> 퇴근
          </button>
          <button className="btn btn-action" onClick={() => handleAdd('💊 약 복용', false)}>
            <FiHeart /> 약 복용
          </button>
        </div>
      </div>
    </div>
  );
}
