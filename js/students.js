/* students.js — Student page: month selector + lessons paid/unpaid table */

const StudentPage = (() => {
  let studentId = null;
  const today = new Date();
  let viewYear = today.getFullYear();
  let viewMonth = today.getMonth();

  function els() {
    return {
      heading: document.getElementById('studentHeading'),
      monthLabel: document.getElementById('studentMonthLabel'),
      prevBtn: document.getElementById('studentPrevMonthBtn'),
      nextBtn: document.getElementById('studentNextMonthBtn'),
      list: document.getElementById('lessonsList'),
      monthTotal: document.getElementById('studentMonthTotal')
    };
  }

  function monthKey() {
    return Utils.toMonthKey(viewYear, viewMonth);
  }

  function render() {
    const { heading, monthLabel, list, monthTotal } = els();
    heading.textContent = Storage.getStudentName(studentId);
    monthLabel.textContent = Utils.monthLabel(viewYear, viewMonth);

    const lessons = Storage.getLessons(studentId);
    const mKey = monthKey();

    if (lessons.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          ${Utils.emptyIcon()}
          <p>No lessons added yet.</p>
          <p class="empty-state-sub">Add a lesson from Lessons Settings.</p>
        </div>`;
      monthTotal.textContent = Utils.formatMoney(0);
      return;
    }

    let paidTotal = 0;
    list.innerHTML = `
      <div class="lessons-table">
        <div class="lessons-table-head">
          <span>Subject</span>
          <span>Amount</span>
          <span>Status</span>
          <span></span>
        </div>
        ${lessons
          .map((lesson) => {
            const paid = Storage.getPaymentStatus(studentId, mKey, lesson.id);
            const record = Storage.getPaymentRecord(studentId, mKey, lesson.id);
            if (paid) paidTotal += Number(lesson.price);
            return `
            <div class="lessons-table-row" data-id="${lesson.id}">
              <span class="lesson-name">${Utils.escapeHtml(lesson.name)}</span>
              <span class="lesson-amount">${Utils.formatMoney(lesson.price)}</span>
              <span class="lesson-status-wrap">
                <span class="lesson-status ${paid ? 'status-paid' : 'status-unpaid'}">
                  ${paid ? '✓ Paid' : '✕ Not Paid'}
                </span>
                ${paid && record && record.dateKey ? `<span class="lesson-paid-date">Added on ${Utils.formatShortDate(record.dateKey)}</span>` : ''}
              </span>
              <button type="button" class="btn btn-small ${paid ? 'btn-ghost' : 'btn-primary'}" data-action="toggle">
                ${paid ? 'Mark as Unpaid' : 'Mark as Paid'}
              </button>
            </div>`;
          })
          .join('')}
      </div>`;

    monthTotal.textContent = Utils.formatMoney(paidTotal);
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

  function handleListClick(e) {
    const btn = e.target.closest('[data-action="toggle"]');
    if (!btn) return;
    const row = btn.closest('.lessons-table-row');
    const lessonId = row.dataset.id;
    const mKey = monthKey();
    const isPaid = Storage.getPaymentStatus(studentId, mKey, lessonId);

    if (isPaid) {
      Storage.togglePayment(studentId, mKey, lessonId);
      Utils.toast('Marked as unpaid.');
      render();
      return;
    }

    // marking as paid: ask which calendar day this payment should be added to
    const todayKey = Utils.todayKey();
    const defaultDateKey = todayKey.startsWith(mKey) ? todayKey : `${mKey}-01`;
    Utils.promptDate(
      "Add this lesson's payment to which day on the calendar?",
      defaultDateKey,
      mKey,
      (dateKey) => {
        Storage.togglePayment(studentId, mKey, lessonId, dateKey);
        Utils.toast('Marked as paid — added to the calendar.');
        render();
      }
    );
  }

  function init(id) {
    studentId = id;
    const { prevBtn, nextBtn, list } = els();
    prevBtn.addEventListener('click', goPrev);
    nextBtn.addEventListener('click', goNext);
    list.addEventListener('click', handleListClick);
    render();
  }

  return { init };
})();
