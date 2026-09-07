/* dashboard.js — Monthly Summary panel on the Dashboard page */

const Dashboard = (() => {
  function renderSummary(monthKey) {
    const houseTotal = Storage.getMonthHouseTotal(monthKey);
    const lessonsTotal = Storage.getMonthLessonsExpense(monthKey);
    const total = houseTotal + lessonsTotal;

    document.getElementById('summaryMonthLabel').textContent = monthLabelFromKey(monthKey);
    document.getElementById('summaryHouse').textContent = Utils.formatMoney(houseTotal);
    document.getElementById('summaryLessons').textContent = Utils.formatMoney(lessonsTotal);
    document.getElementById('summaryTotal').textContent = Utils.formatMoney(total);
  }

  function monthLabelFromKey(monthKey) {
    const [y, m] = monthKey.split('-').map(Number);
    return Utils.monthLabel(y, m - 1);
  }

  function init() {
    // Calendar.init() calls render() right away, which invokes this handler
    // with the initially-visible month, so no extra render call is needed here.
    window.onCalendarMonthChanged = renderSummary;
  }

  return { init, renderSummary };
})();
