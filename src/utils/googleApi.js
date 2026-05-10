// 구글 캘린더 API 통신을 담당하는 유틸리티 함수들입니다.

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

/**
 * 특정 기준 월을 중심으로 전/후 1달치(총 3개월)의 일정을 한 번에 가져옵니다.
 * 대형 달력에 모든 일정을 렌더링하기 위함입니다.
 * @param {string} token - 구글 OAuth 액세스 토큰
 * @param {Date} viewDate - 현재 달력에서 보고 있는 기준 월
 */
export async function fetchEvents(token, viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  // 현재 보고 있는 달을 기준으로 저번달 1일부터 다음달 말일까지 (총 3개월치) 여유있게 가져옵니다.
  const start = new Date(year, month - 1, 1, 0, 0, 0).toISOString();
  const end = new Date(year, month + 2, 0, 23, 59, 59).toISOString();

  const response = await fetch(`${CALENDAR_API_BASE}?timeMin=${start}&timeMax=${end}&singleEvents=true&orderBy=startTime&maxResults=500`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Google Calendar API가 활성화되지 않았습니다. 구글 클라우드 콘솔에서 API를 켜주세요.');
    }
    throw new Error('일정 가져오기 실패');
  }

  return response.json();
}

/**
 * 캘린더에 새로운 일정을 추가합니다.
 * @param {string} token - 구글 OAuth 액세스 토큰
 * @param {Date} targetDate - 추가할 날짜
 * @param {string} title - 일정 제목
 * @param {boolean} isNine - 아침 9시 고정 여부 (출근)
 * @param {number} alarmMinutes - 팝업 알람 시간 (분 단위, -1이면 알람 없음)
 */
export async function addEvent(token, targetDate, title, isNine, alarmMinutes = -1) {
  const now = new Date();
  
  // 두 자리 숫자로 패딩 (예: 5 -> '05')
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = `${targetDate.getFullYear()}-${pad(targetDate.getMonth() + 1)}-${pad(targetDate.getDate())}`;
  
  let sStr, eStr;
  
  // '출근'처럼 시간을 아침 9시로 고정할 때
  if (isNine) { 
    sStr = `${ymd}T09:00:00`; 
    eStr = `${ymd}T09:30:00`; 
  } else {
    // 그 외는 현재 시간 기준으로 등록 (선택된 날짜 + 현재 시간)
    sStr = `${ymd}T${pad(now.getHours())}:${pad(now.getMinutes())}:00`;
    
    // 종료 시간은 시작 시간으로부터 15분 뒤로 설정
    const endD = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), now.getHours(), now.getMinutes() + 15);
    eStr = `${endD.getFullYear()}-${pad(endD.getMonth()+1)}-${pad(endD.getDate())}T${pad(endD.getHours())}:${pad(endD.getMinutes())}:00`;
  }

  // API로 전송할 일정 데이터 객체
  const eventBody = { 
    summary: title, 
    start: { dateTime: sStr, timeZone: 'Asia/Seoul' }, 
    end: { dateTime: eStr, timeZone: 'Asia/Seoul' } 
  };

  // 사용자가 알람 시간을 선택했다면 (0: 정각, 5: 5분 전 등) 알람 설정 추가
  if (alarmMinutes >= 0) {
    eventBody.reminders = {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: alarmMinutes } // 팝업 형태의 알람을 minutes분 전에 띄움
      ]
    };
  }

  const response = await fetch(CALENDAR_API_BASE, {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${token}`, 
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify(eventBody)
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Google Calendar API가 활성화되지 않았습니다. 구글 콘솔을 확인해주세요.');
    }
    throw new Error('일정 추가 실패');
  }
}

/**
 * 캘린더에서 특정 일정을 삭제(완료 처리)합니다.
 * @param {string} token - 구글 OAuth 액세스 토큰
 * @param {string} eventId - 삭제할 일정 ID
 */
export async function deleteEvent(token, eventId) {
  const response = await fetch(`${CALENDAR_API_BASE}/${eventId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error('일정 삭제 실패');
  }
}
