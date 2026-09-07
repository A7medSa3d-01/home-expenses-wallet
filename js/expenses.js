/* expenses.js — the day drawer: list / add / edit / delete expenses */

const Expenses = (() => {
  let currentDateKey = null;
  let editingId = null;

  function els() {
    return {
      overlay: document.getElementById('drawerOverlay'),
      drawer: document.getElementById('expenseDrawer'),
      title: document.getElementById('drawerDate'),
      list: document.getElementById('drawerList'),
      total: document.getElementById('drawerTotal'),
      form: document.getElementById('expenseForm'),
      titleInput: document.getElementById('expenseTitle'),
      amountInput: document.getElementById('expenseAmount'),
      titleError: document.getElementById('titleError'),
      amountError: document.getElementById('amountError'),
      submitBtn: document.getElementById('submitExpenseBtn'),
      cancelEditBtn: document.getElementById('cancelEditBtn')
    };
  }

  function formatDateHeading(dateKey) {
    const [y, m, d] = dateKey.split('-').map(Number);
    return `${Utils.MONTH_NAMES[m - 1]} ${d}, ${y}`;
  }

  function render() {
    const { title, list, total } = els();
    title.textContent = formatDateHeading(currentDateKey);
    const items = Storage.getExpensesForDay(currentDateKey);

    if (items.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          ${Utils.emptyIcon()}
          <p>No expenses yet.</p>
          <p class="empty-state-sub">Add your first expense for this day.</p>
        </div>`;
    } else {
      list.innerHTML = items
        .map((item) => {
          const isLesson = item.source === 'lesson';
          return `
        <div class="expense-item" data-id="${item.id}">
          <div class="expense-item-info">
            <span class="expense-item-title">
              ${Utils.escapeHtml(item.title)}
              ${isLesson ? '<span class="lesson-tag">Lesson</span>' : ''}
            </span>
            <span class="expense-item-amount">${Utils.formatMoney(item.amount)}</span>
          </div>
          <div class="expense-item-actions">
            ${
              isLesson
                ? '<span class="expense-item-note">Managed from student page</span>'
                : `<button type="button" class="link-btn" data-action="edit">Edit</button>
                   <button type="button" class="link-btn link-btn-danger" data-action="delete">Delete</button>`
            }
          </div>
        </div>`;
        })
        .join('');
    }

    total.textContent = Utils.formatMoney(Storage.getDayTotal(currentDateKey));

    if (typeof window.onDrawerDataChanged === 'function') {
      window.onDrawerDataChanged();
    }
  }

  function resetForm() {
    const { form, titleInput, amountInput, titleError, amountError, submitBtn, cancelEditBtn } = els();
    editingId = null;
    form.reset();
    titleError.textContent = '';
    amountError.textContent = '';
    titleInput.classList.remove('input-error');
    amountInput.classList.remove('input-error');
    submitBtn.textContent = '+ Add Expense';
    cancelEditBtn.classList.add('hidden');
  }

  function startEdit(id) {
    const item = Storage.getExpensesForDay(currentDateKey).find((e) => e.id === id);
    if (!item) return;
    const { titleInput, amountInput, submitBtn, cancelEditBtn } = els();
    editingId = id;
    titleInput.value = item.title;
    amountInput.value = item.amount;
    submitBtn.textContent = 'Save Changes';
    cancelEditBtn.classList.remove('hidden');
    titleInput.focus();
  }

  function validate() {
    const { titleInput, amountInput, titleError, amountError } = els();
    let valid = true;
    titleError.textContent = '';
    amountError.textContent = '';
    titleInput.classList.remove('input-error');
    amountInput.classList.remove('input-error');

    const title = titleInput.value.trim();
    const amount = Number(amountInput.value);

    if (!title) {
      titleError.textContent = 'Title is required.';
      titleInput.classList.add('input-error');
      valid = false;
    }
    if (!amountInput.value || Number.isNaN(amount) || amount <= 0) {
      amountError.textContent = 'Enter a valid positive amount.';
      amountInput.classList.add('input-error');
      valid = false;
    }
    return { valid, title, amount };
  }

  function handleSubmit(e) {
    e.preventDefault();
    const { valid, title, amount } = validate();
    if (!valid) return;

    if (editingId) {
      Storage.updateExpense(currentDateKey, editingId, title, amount);
      Utils.toast('Expense updated.');
    } else {
      Storage.addExpense(currentDateKey, title, amount);
      Utils.toast('Expense added.');
    }
    resetForm();
    render();
  }

  function handleListClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const row = btn.closest('.expense-item');
    const id = row.dataset.id;
    if (btn.dataset.action === 'edit') {
      startEdit(id);
    } else if (btn.dataset.action === 'delete') {
      Utils.confirmAction('Are you sure you want to delete this expense?', () => {
        Storage.deleteExpense(currentDateKey, id);
        Utils.toast('Expense deleted.');
        resetForm();
        render();
      });
    }
  }

  function open(dateKey) {
    currentDateKey = dateKey;
    resetForm();
    render();
    const { overlay, drawer } = els();
    overlay.classList.add('is-open');
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  }

  function close() {
    const { overlay, drawer } = els();
    overlay.classList.remove('is-open');
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
  }

  function init() {
    const { overlay, form, list, cancelEditBtn } = els();
    document.getElementById('drawerClose').addEventListener('click', close);
    overlay.addEventListener('click', close);
    form.addEventListener('submit', handleSubmit);
    list.addEventListener('click', handleListClick);
    cancelEditBtn.addEventListener('click', resetForm);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawerIsOpen()) close();
    });
  }

  function drawerIsOpen() {
    return document.getElementById('expenseDrawer').classList.contains('is-open');
  }

  return { init, open, close };
})();
