/* storage.js
 * Single source of truth for all persisted data.
 * Everything lives in one LocalStorage key so reads/writes stay atomic.
 */

const Storage = (() => {
  const STORAGE_KEY = 'hew_data_v1';
  const CURRENCY = 'EGP'; // change this one constant to switch currency everywhere

  const defaultData = () => ({
    expenses: {
      // "2026-09-01": [ { id, title, amount } ]
    },
    students: {
      student1: { name: 'Student 1' },
      student2: { name: 'Student 2' }
    },
    lessons: {
      // studentId: [ { id, name, price } ]
      student1: [],
      student2: []
    },
    payments: {
      // studentId: { "2026-09": { lessonId: true/false } }
      student1: {},
      student2: {}
    },
    settings: {
      theme: 'light'
    }
  });

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultData();
      const parsed = JSON.parse(raw);
      // merge with defaults so new fields introduced later never break old data
      const base = defaultData();
      return {
        expenses: parsed.expenses || base.expenses,
        students: { ...base.students, ...(parsed.students || {}) },
        lessons: { ...base.lessons, ...(parsed.lessons || {}) },
        payments: { ...base.payments, ...(parsed.payments || {}) },
        settings: { ...base.settings, ...(parsed.settings || {}) }
      };
    } catch (e) {
      console.error('Failed to read data, resetting to defaults.', e);
      return defaultData();
    }
  }

  function save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save data.', e);
    }
  }

  function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  // ---------- Expenses ----------

  function getExpensesForDay(dateKey) {
    const data = load();
    return data.expenses[dateKey] || [];
  }

  function getAllExpenses() {
    return load().expenses;
  }

  function addExpense(dateKey, title, amount) {
    const data = load();
    if (!data.expenses[dateKey]) data.expenses[dateKey] = [];
    data.expenses[dateKey].push({ id: generateId('exp'), title, amount });
    save(data);
  }

  function updateExpense(dateKey, id, title, amount) {
    const data = load();
    const list = data.expenses[dateKey] || [];
    const item = list.find((e) => e.id === id);
    if (item) {
      item.title = title;
      item.amount = amount;
      save(data);
    }
  }

  function deleteExpense(dateKey, id) {
    const data = load();
    if (!data.expenses[dateKey]) return;
    data.expenses[dateKey] = data.expenses[dateKey].filter((e) => e.id !== id);
    if (data.expenses[dateKey].length === 0) delete data.expenses[dateKey];
    save(data);
  }

  function getDayTotal(dateKey) {
    const list = getExpensesForDay(dateKey);
    return list.reduce((sum, e) => sum + Number(e.amount), 0);
  }

  function getMonthHouseTotal(monthKey) {
    const data = load();
    let total = 0;
    Object.keys(data.expenses).forEach((dateKey) => {
      if (dateKey.startsWith(monthKey)) {
        data.expenses[dateKey].forEach((e) => {
          if (e.source !== 'lesson') total += Number(e.amount);
        });
      }
    });
    return total;
  }

  // ---------- Students ----------

  function getStudents() {
    return load().students;
  }

  function getStudentName(studentId) {
    const students = getStudents();
    return students[studentId] ? students[studentId].name : studentId;
  }

  function updateStudentName(studentId, name) {
    const data = load();
    if (!data.students[studentId]) data.students[studentId] = { name };
    else data.students[studentId].name = name;
    save(data);
  }

  // ---------- Lessons ----------

  function getLessons(studentId) {
    const data = load();
    return data.lessons[studentId] || [];
  }

  function addLesson(studentId, name, price) {
    const data = load();
    if (!data.lessons[studentId]) data.lessons[studentId] = [];
    data.lessons[studentId].push({ id: generateId('lesson'), name, price });
    save(data);
  }

  function updateLesson(studentId, lessonId, name, price) {
    const data = load();
    const list = data.lessons[studentId] || [];
    const item = list.find((l) => l.id === lessonId);
    if (item) {
      item.name = name;
      item.price = price;
      save(data);
    }
  }

  function deleteLesson(studentId, lessonId) {
    const data = load();
    if (!data.lessons[studentId]) return;
    data.lessons[studentId] = data.lessons[studentId].filter((l) => l.id !== lessonId);
    // clean up any payment records AND the real expense entries they created
    Object.keys(data.payments[studentId] || {}).forEach((monthKey) => {
      const record = data.payments[studentId][monthKey][lessonId];
      if (record && record.paid && record.dateKey && data.expenses[record.dateKey]) {
        data.expenses[record.dateKey] = data.expenses[record.dateKey].filter(
          (e) => e.id !== record.expenseId
        );
        if (data.expenses[record.dateKey].length === 0) delete data.expenses[record.dateKey];
      }
      delete data.payments[studentId][monthKey][lessonId];
    });
    save(data);
  }

  // ---------- Payments ----------
  // Marking a lesson "Paid" creates a REAL expense entry on the chosen day,
  // so it shows up in that day's calendar total and drawer — Lessons
  // Expenses is never a silent, separate calculation. Unmarking removes
  // that same entry again.

  function getPaymentRecord(studentId, monthKey, lessonId) {
    const data = load();
    const record = (data.payments[studentId] || {})[monthKey] || {};
    return record[lessonId] || null;
  }

  function getPaymentStatus(studentId, monthKey, lessonId) {
    const record = getPaymentRecord(studentId, monthKey, lessonId);
    return !!(record && record.paid);
  }

  function togglePayment(studentId, monthKey, lessonId, dateKey) {
    const data = load();
    if (!data.payments[studentId]) data.payments[studentId] = {};
    if (!data.payments[studentId][monthKey]) data.payments[studentId][monthKey] = {};
    const record = data.payments[studentId][monthKey][lessonId];
    const isPaid = !!(record && record.paid);

    if (isPaid) {
      // unmark: remove the expense entry this payment created
      if (record.dateKey && data.expenses[record.dateKey]) {
        data.expenses[record.dateKey] = data.expenses[record.dateKey].filter(
          (e) => e.id !== record.expenseId
        );
        if (data.expenses[record.dateKey].length === 0) delete data.expenses[record.dateKey];
      }
      data.payments[studentId][monthKey][lessonId] = { paid: false, dateKey: null, expenseId: null };
      save(data);
      return false;
    }

    // mark as paid: add a real expense entry to the chosen day
    const lesson = (data.lessons[studentId] || []).find((l) => l.id === lessonId);
    if (!lesson || !dateKey) {
      save(data);
      return false;
    }
    const studentName = data.students[studentId] ? data.students[studentId].name : studentId;
    const expenseId = generateId('lesson-exp');
    if (!data.expenses[dateKey]) data.expenses[dateKey] = [];
    data.expenses[dateKey].push({
      id: expenseId,
      title: `${lesson.name} — ${studentName} (Lesson)`,
      amount: Number(lesson.price),
      source: 'lesson',
      studentId,
      lessonId,
      monthKey
    });
    data.payments[studentId][monthKey][lessonId] = { paid: true, dateKey, expenseId };
    save(data);
    return true;
  }

  function getMonthLessonsExpense(monthKey) {
    const data = load();
    let total = 0;
    Object.keys(data.expenses).forEach((dateKey) => {
      if (dateKey.startsWith(monthKey)) {
        data.expenses[dateKey].forEach((e) => {
          if (e.source === 'lesson') total += Number(e.amount);
        });
      }
    });
    return total;
  }

  // ---------- Settings ----------

  function getTheme() {
    return load().settings.theme || 'light';
  }

  function setTheme(theme) {
    const data = load();
    data.settings.theme = theme;
    save(data);
  }

  function getCurrency() {
    return CURRENCY;
  }

  return {
    getExpensesForDay,
    getAllExpenses,
    addExpense,
    updateExpense,
    deleteExpense,
    getDayTotal,
    getMonthHouseTotal,
    getStudents,
    getStudentName,
    updateStudentName,
    getLessons,
    addLesson,
    updateLesson,
    deleteLesson,
    getPaymentStatus,
    getPaymentRecord,
    togglePayment,
    getMonthLessonsExpense,
    getTheme,
    setTheme,
    getCurrency
  };
})();
