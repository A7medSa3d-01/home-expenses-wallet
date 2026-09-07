/* utils.js — shared helpers used across pages */

const Utils = (() => {
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function toDateKey(year, month, day) {
    // month is 0-indexed here
    return `${year}-${pad(month + 1)}-${pad(day)}`;
  }

  function toMonthKey(year, month) {
    return `${year}-${pad(month + 1)}`;
  }

  function monthLabel(year, month) {
    return `${MONTH_NAMES[month]} ${year}`;
  }

  function todayKey() {
    const d = new Date();
    return toDateKey(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function currentMonthKey() {
    const d = new Date();
    return toMonthKey(d.getFullYear(), d.getMonth());
  }

  function formatMoney(amount) {
    const n = Number(amount) || 0;
    return `${n.toLocaleString('en-US')} ${Storage.getCurrency()}`;
  }

  function formatMoneyShort(amount) {
    const n = Number(amount) || 0;
    return `${n.toLocaleString('en-US')}`;
  }

  function daysInMonthKey(monthKey) {
    const [y, m] = monthKey.split('-').map(Number);
    return new Date(y, m, 0).getDate();
  }

  function formatShortDate(dateKey) {
    const [, m, d] = dateKey.split('-').map(Number);
    return `${MONTH_NAMES[m - 1].slice(0, 3)} ${d}`;
  }

  // A single restrained line-icon (open tray) used across every empty state
  // so "nothing here yet" always looks the same, intentional way.
  function emptyIcon() {
    return `
      <span class="empty-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12l2.2-7.2A2 2 0 0 1 7.1 3.4h9.8a2 2 0 0 1 1.9 1.4L21 12" />
          <path d="M3 12v6a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6" />
          <path d="M3 12h5.2a1 1 0 0 1 .9.6l.8 1.8a1 1 0 0 0 .9.6h2.4a1 1 0 0 0 .9-.6l.8-1.8a1 1 0 0 1 .9-.6H21" />
        </svg>
      </span>`;
  }

  // ---------- Toast ----------

  function toast(message) {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('toast-show'));
    setTimeout(() => {
      el.classList.remove('toast-show');
      setTimeout(() => el.remove(), 200);
    }, 2200);
  }

  // ---------- Confirm dialog ----------

  function confirmAction(message, onConfirm) {
    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-box" role="alertdialog" aria-modal="true" aria-label="Confirm action">
        <p class="confirm-message">${message}</p>
        <div class="confirm-actions">
          <button type="button" class="btn btn-ghost" data-action="cancel">Cancel</button>
          <button type="button" class="btn btn-danger" data-action="delete">Delete</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const remove = () => overlay.remove();
    overlay.querySelector('[data-action="cancel"]').addEventListener('click', remove);
    overlay.querySelector('[data-action="delete"]').addEventListener('click', () => {
      remove();
      onConfirm();
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) remove();
    });
    // focus Cancel by default so an accidental Enter press never deletes
    overlay.querySelector('[data-action="cancel"]').focus();
  }

  // ---------- Date prompt (used when marking a lesson as paid) ----------

  function promptDate(message, defaultDateKey, monthKey, onConfirm) {
    const lastDay = daysInMonthKey(monthKey);
    const minDate = `${monthKey}-01`;
    const maxDate = `${monthKey}-${pad(lastDay)}`;

    const overlay = document.createElement('div');
    overlay.className = 'confirm-overlay';
    overlay.innerHTML = `
      <div class="confirm-box" role="dialog" aria-modal="true" aria-label="Choose a day">
        <p class="confirm-message">${message}</p>
        <div class="form-row">
          <label for="promptDateInput">Day</label>
          <input id="promptDateInput" type="date" value="${defaultDateKey}" min="${minDate}" max="${maxDate}" />
          <span class="field-error" id="promptDateError"></span>
        </div>
        <div class="confirm-actions">
          <button type="button" class="btn btn-ghost" data-action="cancel">Cancel</button>
          <button type="button" class="btn btn-primary" data-action="confirm">Confirm</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const remove = () => overlay.remove();
    const input = overlay.querySelector('#promptDateInput');
    const errorEl = overlay.querySelector('#promptDateError');

    overlay.querySelector('[data-action="cancel"]').addEventListener('click', remove);
    overlay.querySelector('[data-action="confirm"]').addEventListener('click', () => {
      const value = input.value;
      if (!value || !value.startsWith(monthKey)) {
        errorEl.textContent = `Pick a day within ${monthKey}.`;
        return;
      }
      remove();
      onConfirm(value);
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) remove();
    });
    input.focus();
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return {
    MONTH_NAMES,
    DAY_NAMES,
    pad,
    toDateKey,
    toMonthKey,
    monthLabel,
    todayKey,
    currentMonthKey,
    daysInMonthKey,
    formatShortDate,
    emptyIcon,
    formatMoney,
    formatMoneyShort,
    toast,
    confirmAction,
    promptDate,
    escapeHtml
  };
})();
