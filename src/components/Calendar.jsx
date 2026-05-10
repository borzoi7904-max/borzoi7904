import React from 'react';
import { isSameDay, parseISO } from 'date-fns';

export default function Calendar({ 
  targetDate, setTargetDate, 
  currentViewDate, setCurrentViewDate, 
  events, loading 
}) {
  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();
  
  const firstDay = new Date(year, month, 1).getDay(); 
  const lastDate = new Date(year, month + 1, 0).getDate(); 
  const realToday = new Date(); 

  // 월 이동 함수들
  const goToPrevMonth = () => setCurrentViewDate(new Date(year, month - 1, 1));
  const goToThisMonth = () => setCurrentViewDate(new Date(realToday.getFullYear(), realToday.getMonth(), 1));
  const goToNextMonth = () => setCurrentViewDate(new Date(year, month + 1, 1));

  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: lastDate }, (_, i) => i + 1);

  // 특정 날짜에 해당하는 일정들을 필터링하는 함수
  const getEventsForDay = (day) => {
    const currentCellDate = new Date(year, month, day);
    return events.filter(ev => {
      // dateTime이 있으면 그것을, 없으면 종일 일정(date)을 사용
      const evDateStr = ev.start?.dateTime || ev.start?.date;
      if (!evDateStr) return false;
      const evDate = parseISO(evDateStr);
      return isSameDay(evDate, currentCellDate);
    });
  };

  return (
    <div className="pastel-card calendar-wrapper large">
      <div className="calendar-header-large">
        <div className="month-navigation">
          <button onClick={goToPrevMonth} className="btn nav-btn">⬅️ 저번 달</button>
          <button onClick={goToThisMonth} className="btn nav-btn">이번 달</button>
          <button onClick={goToNextMonth} className="btn nav-btn">다음 달 ➡️</button>
        </div>
        <h2 className="calendar-title">
          {year}년 {month + 1}월
          {loading && <span className="loading-spinner">⏳</span>}
        </h2>
      </div>

      <div className="calendar-grid-large">
        {['일', '월', '화', '수', '목', '금', '토'].map(day => (
          <div key={day} className="calendar-day-header">{day}</div>
        ))}

        {emptyDays.map(empty => (
          <div key={`empty-${empty}`} className="calendar-day-cell empty"></div>
        ))}

        {days.map(d => {
          const isToday = year === realToday.getFullYear() && month === realToday.getMonth() && d === realToday.getDate();
          const isSelected = year === targetDate.getFullYear() && month === targetDate.getMonth() && d === targetDate.getDate();
          
          // 이 칸에 들어갈 일정들
          const dayEvents = getEventsForDay(d);

          return (
            <div
              key={d}
              className={`calendar-day-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={() => setTargetDate(new Date(year, month, d))}
            >
              <div className="day-number">{d}</div>
              
              <div className="event-chips">
                {dayEvents.map(ev => (
                  <div key={ev.id} className={`event-chip ${ev.isDone ? 'done' : ''}`} title={ev.title}>
                    {ev.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
