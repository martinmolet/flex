/* Flex Academy — landing page interactions */
(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ---------- Nav: scrolled state + mobile drawer ---------- */
  const nav = $('[data-nav]');
  const toggle = $('[data-nav-toggle]');
  const links = $('#nav-links');

  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    links.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  links.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 921px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------- Nav: highlight the section in view ---------- */
  const navLinks = $$('.nav__links > a');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('is-active', a.hash === `#${entry.target.id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach((a) => { const t = $(a.hash); if (t) spy.observe(t); });

  /* ---------- Sticky CTA: hidden while a conversion point is already on screen ---------- */
  const ctaBar = $('[data-cta-bar]');
  const callZones = new Set();
  const zoneObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? callZones.add(e.target) : callZones.delete(e.target)));
    const show = callZones.size === 0;
    ctaBar.classList.toggle('is-visible', show);
    ctaBar.inert = !show;
  });
  ['[data-paths]', '#checklist', '#join', '.footer'].forEach((s) => zoneObserver.observe($(s)));

  /* ---------- Scroll reveal ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  $$('.reveal').forEach((el, i) => {
    // stagger siblings that enter together
    el.style.transitionDelay = `${(i % 4) * 70}ms`;
    io.observe(el);
  });

  /* ---------- Curriculum accordion: one module open at a time ---------- */
  const modules = $$('[data-accordion] details');
  modules.forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) modules.forEach((o) => { if (o !== d) o.open = false; });
  }));

  /* ---------- Length-of-stay ladder ---------- */
  const ladder = $('.ladder');
  const bars = $$('.bar', ladder);
  const label = $('[data-ladder-label]');
  const value = $('[data-ladder-value]');

  bars.forEach((bar) => bar.style.setProperty('--v', bar.dataset.value));

  const select = (bar) => {
    bars.forEach((b) => b.classList.toggle('is-active', b === bar));
    bars.forEach((b) => b.setAttribute('aria-pressed', String(b === bar)));
    label.textContent = bar.dataset.label;
    value.textContent = bar.dataset.value;
  };
  bars.forEach((bar) => {
    bar.addEventListener('click', () => select(bar));
    bar.addEventListener('mouseenter', () => select(bar));
    bar.addEventListener('focus', () => select(bar));
  });
  select($('.bar.is-active', ladder));

  new IntersectionObserver(([entry], obs) => {
    if (entry.isIntersecting) { ladder.classList.add('is-in'); obs.disconnect(); }
  }, { threshold: 0.3 }).observe(ladder);

  /* ---------- Comparison tabs (mobile) ---------- */
  const table = $('[data-compare]');
  const tabs = $$('[data-compare-tabs] button');
  tabs.forEach((tab) => tab.addEventListener('click', () => {
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
    table.dataset.active = tab.dataset.col;
  }));

  /* ---------- Shared: dates, calendar links ---------- */
  const fmt = (d, o) => d.toLocaleString('en-GB', o);
  const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tzShort = (d) => (new Intl.DateTimeFormat('en-GB', { timeZoneName: 'short' })
    .formatToParts(d).find((p) => p.type === 'timeZoneName') || {}).value || '';
  const dayTime = (d) =>
    `${fmt(d, { weekday: 'short', day: 'numeric', month: 'short' })}, ${fmt(d, { hour: '2-digit', minute: '2-digit' })}`;
  const stamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const gcalUrl = (title, start, end, details) =>
    `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}` +
    `&dates=${stamp(start)}/${stamp(end)}&details=${encodeURIComponent(details)}`;

  // .ics download so the confirmed slot lands in Apple Calendar or Outlook
  const downloadIcs = (title, start, end, details, filename) => {
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Flex Academy//Prototype//EN',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@flex-academy.prototype`,
      `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
      `SUMMARY:${title}`, `DESCRIPTION:${details}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  // A wall-clock time in a given IANA zone, as a real Date
  const zoned = (y, m, d, h, min, tz) => {
    const guess = Date.UTC(y, m, d, h, min);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    }).formatToParts(new Date(guess));
    const get = (t) => Number(parts.find((p) => p.type === t).value);
    const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
    return new Date(guess - (asUtc - guess));
  };

  // A validation helper shared by the three forms
  const validate = (form, rules) => {
    const data = new FormData(form);
    let firstInvalid = null;
    Object.entries(rules).forEach(([name, rule]) => {
      const ok = rule(data.get(name) || '');
      $(`[data-error-for="${name}"]`, form).closest('.form__row').classList.toggle('has-error', !ok);
      if (!ok && !firstInvalid) firstInvalid = form.elements[name];
    });
    if (firstInvalid) (firstInvalid[0] || firstInvalid).focus();
    return firstInvalid ? null : data;
  };
  const clearOnInput = (form, rules) => ['input', 'change'].forEach((type) => form.addEventListener(type, (e) => {
    const rule = rules[e.target.name];
    const row = e.target.closest('.form__row');
    if (rule && row && rule(e.target.value)) row.classList.remove('has-error');
  }));

  /* ---------- Join: two paths, one section ---------- */
  const join = $('[data-join]');
  const joinTabs = $$('[role="tab"]', join);
  const openTab = (name) => {
    joinTabs.forEach((t) => {
      const on = t.dataset.tab === name;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    $$('[data-panel]', join).forEach((p) => { p.hidden = p.dataset.panel !== name; });
  };
  joinTabs.forEach((t, i) => {
    t.addEventListener('click', () => openTab(t.dataset.tab));
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = joinTabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + joinTabs.length) % joinTabs.length];
      openTab(next.dataset.tab);
      next.focus();
    });
  });
  // Every CTA on the page says which path it opens
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-open]');
    if (trigger) openTab(trigger.dataset.open);
  });
  if (location.hash === '#call' || location.hash === '#webinar') {
    openTab(location.hash.slice(1));
    join.scrollIntoView();
  }

  /* ---------- Webinar: sessions in three time zones ---------- */
  const SESSIONS = [
    { id: 'uk', region: 'UK & Europe', tz: 'Europe/London', weekday: 2, h: 19, m: 0 },
    { id: 'am', region: 'Americas', tz: 'America/New_York', weekday: 3, h: 20, m: 0 },
    { id: 'ap', region: 'Australia & NZ', tz: 'Australia/Sydney', weekday: 4, h: 19, m: 30 },
  ];
  const WEBINAR_MIN = 60;
  const now = new Date();
  SESSIONS.forEach((s) => {
    for (let i = 1; i <= 8; i++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
      if (d.getDay() !== s.weekday) continue;
      s.start = zoned(d.getFullYear(), d.getMonth(), d.getDate(), s.h, s.m, s.tz);
      break;
    }
  });
  const regionFor = (country) => ({ US: 'am', CA: 'am', AU: 'ap', NZ: 'ap' }[country] || 'uk');
  const detected = localTz.startsWith('America') ? 'am'
    : /^(Australia|Pacific\/Auckland)/.test(localTz) ? 'ap' : 'uk';

  const wForm = $('[data-webinar-form]');
  const sessionsEl = $('[data-sessions]', wForm);
  const wState = { session: SESSIONS.find((s) => s.id === detected), picked: false };

  const renderSessions = () => {
    sessionsEl.innerHTML = '';
    SESSIONS.forEach((s) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'session';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(s === wState.session));
      b.innerHTML = `<small>${s.region}</small><strong>${fmt(s.start, { weekday: 'short', day: 'numeric', month: 'short' })}</strong>` +
        `<span>${fmt(s.start, { hour: '2-digit', minute: '2-digit' })} ${tzShort(s.start)}</span>`;
      b.addEventListener('click', () => { wState.session = s; wState.picked = true; renderSessions(); });
      sessionsEl.append(b);
    });
  };
  const showNext = () => {
    const s = SESSIONS.find((x) => x.id === detected);
    $('[data-webinar-next]').textContent = `${dayTime(s.start)} ${tzShort(s.start)}`;
    $('[data-webinar-next-short]').textContent = fmt(s.start, { weekday: 'short', day: 'numeric', month: 'short' });
  };
  renderSessions();
  showNext();

  // Picking a country suggests the session in the right time zone, unless one was chosen by hand
  wForm.elements.country.addEventListener('change', (e) => {
    if (wState.picked || !e.target.value) return;
    wState.session = SESSIONS.find((s) => s.id === regionFor(e.target.value));
    renderSessions();
  });

  const wRules = {
    name: (v) => v.trim().length > 1,
    email: (v) => EMAIL.test(v.trim()),
    country: (v) => !!v,
  };
  clearOnInput(wForm, wRules);

  const webinarEvent = () => {
    const start = wState.session.start;
    return ['Flex Academy: The Launch Playbook, live', start, new Date(start.getTime() + WEBINAR_MIN * 60000),
      '60-minute live webinar with the Flex Academy team. Your joining link is in your confirmation email.'];
  };

  wForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = validate(wForm, wRules);
    if (!data) return;
    const done = $('[data-webinar-done]');
    $('[data-w-name]', done).textContent = data.get('name').trim().split(' ')[0];
    $('[data-w-when]', done).textContent =
      `${fmt(wState.session.start, { weekday: 'long', day: 'numeric', month: 'long' })}, ${fmt(wState.session.start, { hour: '2-digit', minute: '2-digit' })} ${tzShort(wState.session.start)} · 60 min`;
    $('[data-w-email]', done).textContent = data.get('email').trim();
    $('[data-w-gcal]', done).href = gcalUrl(...webinarEvent());
    wForm.hidden = true;
    done.hidden = false;
    $$('[data-wstep-dot]').forEach((dot) => {
      dot.classList.toggle('is-current', dot.dataset.wstepDot === '2');
      dot.classList.toggle('is-done', dot.dataset.wstepDot === '1');
    });
  });
  $('[data-w-ics]').addEventListener('click', () => downloadIcs(...webinarEvent(), 'flex-academy-webinar.ics'));

  /* ---------- Strategy call: qualify → pick a time → confirmed ---------- */
  const booking = $('[data-booking]');
  const form = $('[data-form]', booking);
  const daysEl = $('[data-days]', booking);
  const slotsEl = $('[data-slots]', booking);
  const confirmBtn = $('[data-confirm]', booking);
  const prevBtn = $('[data-days-prev]', booking);
  const nextBtn = $('[data-days-next]', booking);
  const TIMES = ['09:30', '10:00', '11:30', '14:00', '15:30', '17:00'];
  const PAGE = 5;
  const CALL_MIN = 30;

  $('[data-tz]', booking).textContent = localTz.replace(/_/g, ' ');

  // Next 10 weekdays from tomorrow, with mock availability (deterministic per date)
  const days = [];
  for (let d = new Date(); days.length < 10;) {
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const seed = d.getDate() * 7 + d.getMonth() * 3;
    const open = TIMES.filter((_, i) => (seed + i * 5) % 4 !== 0);
    days.push({ date: d, open: seed % 9 === 0 ? [] : open });
  }

  const state = { page: 0, day: null, time: null, data: null };

  const renderDays = () => {
    const view = days.slice(state.page * PAGE, state.page * PAGE + PAGE);
    const first = fmt(view[0].date, { month: 'long' });
    const last = fmt(view[view.length - 1].date, { month: 'long' });
    $('[data-month]', booking).textContent =
      `${first === last ? first : `${first} – ${last}`} ${view[view.length - 1].date.getFullYear()}`;
    daysEl.innerHTML = '';
    view.forEach((day) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'day';
      b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(day === state.day));
      b.disabled = !day.open.length;
      b.setAttribute('aria-label', `${fmt(day.date, { weekday: 'long', day: 'numeric', month: 'long' })}, ${day.open.length} slots`);
      b.innerHTML = `<small>${fmt(day.date, { weekday: 'short' })}</small><strong>${day.date.getDate()}</strong><em>${day.open.length ? day.open.length + ' slots' : 'Full'}</em>`;
      b.addEventListener('click', () => { state.day = day; state.time = null; renderDays(); renderSlots(); });
      daysEl.append(b);
    });
    prevBtn.disabled = state.page === 0;
    nextBtn.disabled = (state.page + 1) * PAGE >= days.length;
  };

  const renderSlots = () => {
    slotsEl.innerHTML = '';
    if (!state.day) {
      slotsEl.innerHTML = '<p class="slots__empty">Pick a day to see available times.</p>';
    } else {
      TIMES.forEach((t) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'slot';
        b.textContent = t;
        b.setAttribute('role', 'radio');
        b.setAttribute('aria-checked', String(t === state.time));
        b.disabled = !state.day.open.includes(t);
        b.addEventListener('click', () => { state.time = t; renderSlots(); });
        slotsEl.append(b);
      });
    }
    confirmBtn.disabled = !(state.day && state.time);
  };

  prevBtn.addEventListener('click', () => { state.page--; renderDays(); });
  nextBtn.addEventListener('click', () => { state.page++; renderDays(); });

  const callStart = () => {
    const [h, m] = state.time.split(':').map(Number);
    const start = new Date(state.day.date);
    start.setHours(h, m, 0, 0);
    return start;
  };
  const callEvent = () => {
    const start = callStart();
    return ['Flex Academy strategy call', start, new Date(start.getTime() + CALL_MIN * 60000),
      '30-minute strategy call with the Flex Academy team.'];
  };

  const goTo = (n) => {
    $$('[data-step]', booking).forEach((p) => { p.hidden = p.dataset.step !== String(n); });
    $$('[data-step-dot]', booking).forEach((dot) => {
      const i = Number(dot.dataset.stepDot);
      dot.classList.toggle('is-current', i === n);
      dot.classList.toggle('is-done', i < n);
    });
  };

  // The units answer routes people who belong on the other path
  const hint = $('[data-units-hint]', form);
  const hints = {
    0: 'Starting from zero? The free webinar is the better first step. <button type="button" class="link-btn" data-open="webinar">Switch to the webinar</button>',
    '1-2': 'Right between Launch and Scale. We’ll help you pick on the call.',
    '3-9': 'Right in the sweet spot for Scale.',
    '10+': 'You’ll get the most from modules 05 and 06 on team and automation.',
  };
  form.addEventListener('change', (e) => {
    if (e.target.name === 'units') hint.innerHTML = hints[e.target.value];
  });

  const picked = (name) => !!form.querySelector(`input[name="${name}"]:checked`);
  const rules = {
    units: () => picked('units'),
    target: () => picked('target'),
    city: (v) => v.trim().length > 1,
    budget: () => picked('budget'),
    name: (v) => v.trim().length > 1,
    email: (v) => EMAIL.test(v.trim()),
  };
  clearOnInput(form, rules);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = validate(form, rules);
    if (!data) return;
    state.data = data;
    const chip = (name) => form.querySelector(`input[name="${name}"]:checked + span`).textContent;
    const units = data.get('units') === '0' ? 'No units yet' : `${chip('units')} units`;
    $('[data-summary]', booking).textContent =
      `${units} → ${chip('target').replace(' units', '')} · ${data.get('city').trim()} · budget ${chip('budget')}`;
    goTo(2);
    $('.day[aria-checked="true"], .day:not(:disabled)', booking).focus();
  });
  $('[data-back]', booking).addEventListener('click', () => goTo(1));

  confirmBtn.addEventListener('click', () => {
    $('[data-success-name]', booking).textContent = state.data.get('name').trim().split(' ')[0];
    $('[data-done-when]', booking).textContent =
      `${fmt(state.day.date, { weekday: 'long', day: 'numeric', month: 'long' })} at ${state.time} · ${CALL_MIN} min`;
    $('[data-done-email]', booking).textContent = state.data.get('email').trim();
    $('[data-gcal]', booking).href = gcalUrl(...callEvent());
    goTo(3);
  });
  $('[data-ics]', booking).addEventListener('click', () => downloadIcs(...callEvent(), 'flex-academy-call.ics'));

  // Preselect the first available day so the calendar never looks empty
  state.day = days.find((d) => d.open.length);
  renderDays();
  renderSlots();

  /* ---------- Checklist / waitlist ---------- */
  const lead = $('[data-lead]');
  lead.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = lead.elements.email.value.trim();
    const ok = EMAIL.test(email);
    lead.classList.toggle('has-error', !ok);
    if (!ok) { lead.elements.email.focus(); return; }
    $('[data-lead-email]').textContent = email;
    lead.hidden = true;
    $('[data-lead-done]').hidden = false;
  });
  lead.elements.email.addEventListener('input', () => lead.classList.remove('has-error'));
})();
