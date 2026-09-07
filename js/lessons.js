/* lessons.js — Lessons Settings page: student names + per-student lesson CRUD */

const LessonsSettings = (() => {
  let editingLessonId = null;

  function els() {
    return {
      studentsPanel: document.getElementById('studentsPanel'),
      lessonsPanel: document.getElementById('lessonsPanel')
    };
  }

  // ---------- Student names ----------

  function renderStudents() {
    const students = Storage.getStudents();
    const { studentsPanel } = els();
    studentsPanel.innerHTML = Object.keys(students)
      .map(
        (id) => `
      <div class="student-name-row">
        <label for="name-${id}">${id === 'student1' ? 'Student 1' : id === 'student2' ? 'Student 2' : id}</label>
        <input id="name-${id}" type="text" value="${Utils.escapeHtml(students[id].name)}" data-student="${id}" />
      </div>`
      )
      .join('');
  }

  function handleStudentsBlur(e) {
    const input = e.target.closest('input[data-student]');
    if (!input) return;
    const name = input.value.trim();
    if (!name) {
      Utils.toast('Student name is required.');
      input.value = Storage.getStudentName(input.dataset.student);
      return;
    }
    Storage.updateStudentName(input.dataset.student, name);
    Utils.toast('Student name updated.');
    renderLessons(); // headings inside lessons panel reference the name
    syncNav(input.dataset.student, name);
  }

  function syncNav(studentId, name) {
    const label = document.getElementById(`nav${capitalize(studentId)}Label`);
    const avatar = document.getElementById(`nav${capitalize(studentId)}Avatar`);
    if (label) label.textContent = name;
    if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
  }

  function capitalize(studentId) {
    // 'student1' -> 'Student1'
    return studentId.charAt(0).toUpperCase() + studentId.slice(1);
  }

  // ---------- Lessons per student ----------

  function lessonRowHtml(studentId, lesson) {
    if (editingLessonId === lesson.id) {
      return `
        <div class="lesson-row lesson-row-editing" data-id="${lesson.id}" data-student="${studentId}">
          <input type="text" class="edit-name" value="${Utils.escapeHtml(lesson.name)}" placeholder="Subject" />
          <input type="number" class="edit-price" min="0" step="0.01" value="${lesson.price}" placeholder="Price" />
          <div class="lesson-row-actions">
            <button type="button" class="btn btn-small btn-primary" data-action="save-edit">Save</button>
            <button type="button" class="btn btn-small btn-ghost" data-action="cancel-edit">Cancel</button>
          </div>
        </div>`;
    }
    return `
      <div class="lesson-row" data-id="${lesson.id}" data-student="${studentId}">
        <span class="lesson-row-name">${Utils.escapeHtml(lesson.name)}</span>
        <span class="lesson-row-price">${Utils.formatMoney(lesson.price)}</span>
        <div class="lesson-row-actions">
          <button type="button" class="link-btn" data-action="edit">Edit</button>
          <button type="button" class="link-btn link-btn-danger" data-action="delete">Delete</button>
        </div>
      </div>`;
  }

  function renderLessons() {
    const students = Storage.getStudents();
    const { lessonsPanel } = els();

    lessonsPanel.innerHTML = Object.keys(students)
      .map((studentId) => {
        const lessons = Storage.getLessons(studentId);
        const rows = lessons.length
          ? lessons.map((l) => lessonRowHtml(studentId, l)).join('')
          : `<div class="empty-state empty-state-compact">${Utils.emptyIcon()}<p>No lessons added yet.</p></div>`;

        return `
        <div class="lesson-card" data-student="${studentId}">
          <h3 class="lesson-card-title">${Utils.escapeHtml(students[studentId].name)}</h3>
          <div class="lesson-rows">${rows}</div>
          <form class="add-lesson-form" data-student="${studentId}">
            <input type="text" class="new-lesson-name" placeholder="Subject name (e.g. Math)" />
            <input type="number" class="new-lesson-price" min="0" step="0.01" placeholder="Monthly price" />
            <button type="submit" class="btn btn-primary btn-small">+ Add Lesson</button>
          </form>
          <p class="field-error add-lesson-error" data-student="${studentId}"></p>
        </div>`;
      })
      .join('');
  }

  function handleAddLesson(e) {
    const form = e.target.closest('.add-lesson-form');
    if (!form) return;
    e.preventDefault();
    const studentId = form.dataset.student;
    const nameInput = form.querySelector('.new-lesson-name');
    const priceInput = form.querySelector('.new-lesson-price');
    const errorEl = els().lessonsPanel.querySelector(`.add-lesson-error[data-student="${studentId}"]`);

    const name = nameInput.value.trim();
    const price = Number(priceInput.value);

    if (!name || !priceInput.value || Number.isNaN(price) || price <= 0) {
      errorEl.textContent = 'Enter a lesson name and a valid positive price.';
      return;
    }
    errorEl.textContent = '';
    Storage.addLesson(studentId, name, price);
    Utils.toast('Lesson added.');
    renderLessons();
  }

  function handleLessonsClick(e) {
    const row = e.target.closest('.lesson-row');
    if (!row) return;
    const { id, student } = row.dataset;
    const action = e.target.dataset.action;

    if (action === 'edit') {
      editingLessonId = id;
      renderLessons();
    } else if (action === 'cancel-edit') {
      editingLessonId = null;
      renderLessons();
    } else if (action === 'save-edit') {
      const name = row.querySelector('.edit-name').value.trim();
      const price = Number(row.querySelector('.edit-price').value);
      if (!name || Number.isNaN(price) || price <= 0) {
        Utils.toast('Enter a valid name and positive price.');
        return;
      }
      Storage.updateLesson(student, id, name, price);
      editingLessonId = null;
      Utils.toast('Lesson updated.');
      renderLessons();
    } else if (action === 'delete') {
      Utils.confirmAction('Are you sure you want to delete this lesson?', () => {
        Storage.deleteLesson(student, id);
        Utils.toast('Lesson deleted.');
        renderLessons();
      });
    }
  }

  function init() {
    const { studentsPanel, lessonsPanel } = els();
    renderStudents();
    renderLessons();
    studentsPanel.addEventListener('blur', handleStudentsBlur, true);
    studentsPanel.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') e.target.blur();
    });
    lessonsPanel.addEventListener('submit', handleAddLesson);
    lessonsPanel.addEventListener('click', handleLessonsClick);
  }

  return { init };
})();
