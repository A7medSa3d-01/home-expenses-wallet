/* calendar.js — month calendar grid + navigation (Dashboard page) */

const Calendar = (() => {
  const today = new Date();
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth(); // 0-indexed

  function els() {
    return {
      grid: document.getElementById('calendarGrid'),
      label: document.getElementById('calendarMonthLabel'),
      prevBtn: document.getElementById('prevMonthBtn'),
      nextBtn: document.getElementById('nextMonthBtn'),
      todayBtn: document.getElementById('todayMonthBtn')
    };
  }

  // Monday-first day-of-week index for a JS Date (0 = Monday ... 6 = Sunday)
  function mondayIndex(jsDay) {
    return (jsDay + 6) % 7;
  }

  function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function render() {
    const { grid, label } = els();
    const monthKey = Utils.toMonthKey(viewYear, viewMonth);
    label.textContent = Utils.monthLabel(viewYear, viewMonth);

    const firstDay = new Date(viewYear, viewMonth, 1);
    const leadingBlanks = mondayIndex(firstDay.getDay());
    const totalDays = daysInMonth(viewYear, viewMonth);
    const todayKey = Utils.todayKey();

    let cells = '';
    for (let i = 0; i < leadingBlanks; i++) {
      cells += '<div class="cal-cell cal-cell-empty" aria-hidden="true"></div>';
    }

    for (let day = 1; day <= totalDays; day++) {
      const dateKey = Utils.toDateKey(viewYear, viewMonth, day);
      const total = Storage.getDayTotal(dateKey);
      const isToday = dateKey === todayKey;
      const jsDay = new Date(viewYear, viewMonth, day).getDay();
      const isWeekend = jsDay === 0 || jsDay === 6;
      const cellClasses = ['cal-cell'];
      if (isToday) cellClasses.push('cal-cell-today');
      else if (isWeekend) cellClasses.push('cal-cell-weekend');
      cells += `
        <button type="button" class="${cellClasses.join(' ')}" data-date="${dateKey}" aria-label="${Utils.monthLabel(viewYear, viewMonth)} ${day}, total ${Utils.formatMoney(total)}">
          <span class="cal-day-number">${day}${isToday ? '<span class="cal-today-tag">Today</span>' : ''}</span>
          <span class="cal-day-total${total === 0 ? ' cal-day-total-zero' : ''}">${Utils.formatMoney(total)}</span>
        </button>`;
    }

    grid.innerHTML = cells;

    if (typeof window.onCalendarMonthChanged === 'function') {
      window.onCalendarMonthChanged(monthKey);
    }
  }

  function goPrev() {
    viewMonth -= 1;
    if (viewMonth < 0) {
      viewMonth = 11;
      viewYear -= 1;
    }
    render();
  }

  function goNext() {
    viewMonth += 1;
    if (viewMonth > 11) {
      viewMonth = 0;
      viewYear += 1;
    }
    render();
  }

  function goToday() {
    viewYear = today.getFullYear();
    viewMonth = today.getMonth();
    render();
  }

  function getViewMonthKey() {
    return Utils.toMonthKey(viewYear, viewMonth);
  }

  function init() {
    const { grid, prevBtn, nextBtn, todayBtn } = els();
    prevBtn.addEventListener('click', goPrev);
    nextBtn.addEventListener('click', goNext);
    todayBtn.addEventListener('click', goToday);
    grid.addEventListener('click', (e) => {
      const cell = e.target.closest('.cal-cell[data-date]');
      if (cell) Expenses.open(cell.dataset.date);
    });

    // when the drawer adds/edits/deletes an expense, re-render this month's totals
    window.onDrawerDataChanged = render;

    render();
  }

  return { init, render, getViewMonthKey };
})();
