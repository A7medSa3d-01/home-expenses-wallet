# Home Expenses Wallet

A fully offline home-expenses & lessons tracker. Pure HTML5 / CSS3 / vanilla
JavaScript — no build step, no backend, no frameworks. All data lives in
your browser's LocalStorage.

## Running it

Just open `index.html` in any modern browser (double-click the file, or
drag it into a browser tab). Nothing to install, nothing to build.

## Pages

- `index.html` — Dashboard: calendar + monthly summary + day expense drawer
- `student1.html` / `student2.html` — per-student lesson payment tracking
- `lessons-settings.html` — rename students, add/edit/delete lessons

## Structure

```
home-expenses/
├── index.html
├── student1.html
├── student2.html
├── lessons-settings.html
├── css/
│   ├── style.css        design tokens + component styles
│   └── responsive.css   tablet/mobile adjustments
└── js/
    ├── storage.js        LocalStorage data layer (single source of truth)
    ├── utils.js          formatting, toasts, confirm dialog
    ├── expenses.js        day drawer: add/edit/delete daily expenses
    ├── calendar.js        month grid + navigation
    ├── dashboard.js       monthly summary panel
    ├── students.js        per-student lessons + payment toggling
    ├── lessons.js         Lessons Settings page logic
    └── app.js             theme toggle + active-nav highlighting
```

## Notes

- Currency is set once in `js/storage.js` (`const CURRENCY = 'EGP'`) —
  change that single line to switch currencies everywhere.
- Payment status is tracked per student **and** per month, so marking
  "Math" paid in September never affects October.
- Light/Dark mode is saved in LocalStorage and applies across all pages.
