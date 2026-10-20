/**
 * FocusFlow - Personal Productivity Dashboard
 * Vanilla JavaScript (No frameworks)
 * Folder Rule: Only 1 JavaScript file inside js/
 */

(function () {
  'use strict';

  // --- STORAGE KEYS ---
  const STORAGE_KEYS = {
    THEME: 'focusflow_theme',
    USER_NAME: 'focusflow_username',
    TASKS: 'focusflow_tasks',
    QUICK_LINKS: 'focusflow_links',
    TIMER_DURATION: 'focusflow_timer_duration',
    COMPLETED_SESSIONS: 'focusflow_completed_sessions'
  };

  // --- DEFAULT DATA ---
  const DEFAULT_LINKS = [
    { id: '1', title: 'Google', url: 'https://www.google.com' },
    { id: '2', title: 'GitHub', url: 'https://github.com' },
    { id: '3', title: 'YouTube', url: 'https://www.youtube.com' },
    { id: '4', title: 'Wikipedia', url: 'https://www.wikipedia.org' },
    { id: '5', title: 'Reddit', url: 'https://www.reddit.com' },
    { id: '6', title: 'Notion', url: 'https://www.notion.so' }
  ];

  const DEFAULT_TASKS = [
    { id: 't1', text: 'Welcome to Focus Mode! Click task to mark complete', completed: true, createdAt: Date.now() - 3600000 },
    { id: 't2', text: 'Customize your Pomodoro focus duration', completed: false, createdAt: Date.now() - 1800000 },
    { id: 't3', text: 'Add your favorite quick bookmarks below', completed: false, createdAt: Date.now() }
  ];

  // --- STATE ---
  let state = {
    theme: 'dark', // Dark mode by default
    userName: localStorage.getItem(STORAGE_KEYS.USER_NAME) || 'Friend',
    tasks: loadTasks(),
    quickLinks: loadQuickLinks(),
    filter: 'all', // 'all', 'active', 'completed'
    sort: 'created-desc', // 'created-desc', 'created-asc', 'alpha-asc', 'alpha-desc', 'status'
    newestTaskId: null,
    timer: {
      totalSeconds: parseInt(localStorage.getItem(STORAGE_KEYS.TIMER_DURATION), 10) || 25 * 60,
      remainingSeconds: parseInt(localStorage.getItem(STORAGE_KEYS.TIMER_DURATION), 10) || 25 * 60,
      isRunning: false,
      intervalId: null,
      mode: 'focus', // 'focus' or 'break'
      completedSessions: parseInt(localStorage.getItem(STORAGE_KEYS.COMPLETED_SESSIONS), 10) || 0
    },
    editingLinkId: null,
    editingTaskId: null
  };

  // --- DOM ELEMENTS ---
  const dom = {
    // Theme
    themeToggle: document.getElementById('theme-toggle'),
    themeIcon: document.getElementById('theme-icon'),
    
    // Greeting & Time
    greetingText: document.getElementById('greeting-text'),
    userNameSpan: document.getElementById('user-name'),
    currentDate: document.getElementById('current-date'),
    currentTime: document.getElementById('current-time'),
    timeSeconds: document.getElementById('time-seconds'),
    nameModal: document.getElementById('name-modal'),
    nameInput: document.getElementById('name-input'),
    nameForm: document.getElementById('name-form'),
    closeNameModal: document.getElementById('close-name-modal'),
    cancelNameModal: document.getElementById('cancel-name-modal'),

    // Timer
    timerDigits: document.getElementById('timer-digits'),
    timerCircle: document.getElementById('timer-progress-ring'),
    timerModePill: document.getElementById('timer-mode-pill'),
    timerStatusHint: document.getElementById('timer-status-hint'),
    btnTimerStart: document.getElementById('btn-timer-start'),
    btnTimerPause: document.getElementById('btn-timer-pause'),
    btnTimerReset: document.getElementById('btn-timer-reset'),
    presetButtons: document.querySelectorAll('.btn-preset[data-minutes]'),
    btnCustomTimer: document.getElementById('btn-preset-custom'),
    customTimeBar: document.getElementById('custom-time-bar'),
    customTimeInput: document.getElementById('custom-time-input'),
    btnApplyCustomTime: document.getElementById('btn-apply-custom-time'),
    sessionsCompleted: document.getElementById('sessions-completed'),

    // To-Do
    todoForm: document.getElementById('todo-form'),
    todoInput: document.getElementById('todo-input'),
    duplicateWarning: document.getElementById('duplicate-warning'),
    tasksContainer: document.getElementById('tasks-container'),
    todoSortSelect: document.getElementById('todo-sort-select'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    tasksCounter: document.getElementById('tasks-counter'),
    tasksStats: document.getElementById('tasks-stats'),
    btnClearCompleted: document.getElementById('btn-clear-completed'),

    // Quick Links
    quicklinksGrid: document.getElementById('quicklinks-grid'),
    btnAddLink: document.getElementById('btn-add-link'),
    linkModal: document.getElementById('link-modal'),
    linkModalTitle: document.getElementById('link-modal-title'),
    linkForm: document.getElementById('link-form'),
    linkTitleInput: document.getElementById('link-title-input'),
    linkUrlInput: document.getElementById('link-url-input'),
    closeLinkModal: document.getElementById('close-link-modal'),
    cancelLinkModal: document.getElementById('cancel-link-modal'),

    // Toast
    toastContainer: document.getElementById('toast-container'),

    // Opening Splash
    openingSplash: document.getElementById('opening-splash'),
    brandBadge: document.getElementById('brand-badge'),
    timerContainer: document.querySelector('.timer-container'),

    // Interactive Slide Bar
    slidebarTrack: document.getElementById('slidebar-track'),
    slidebarIndicator: document.getElementById('slidebar-indicator'),
    slidebarBtns: document.querySelectorAll('.slidebar-btn'),
    slidebarPrev: document.getElementById('slidebar-prev'),
    slidebarNext: document.getElementById('slidebar-next'),

    // Back to Top Button
    backToTopBtn: document.getElementById('back-to-top'),
    scrollProgressBar: document.getElementById('scroll-progress-bar')
  };

  // --- INITIALIZATION ---
  function init() {
    initTheme();
    initClockAndGreeting();
    initTimer();
    initTodos();
    initQuickLinks();
    initModals();
    initInteractiveSlidebar();
    initBackToTop();
    renderAll();
    initOpeningAnimation();
  }

  // ==========================================
  // INTERACTIVE SLIDE BAR (MENU ALL SECTIONS)
  // ==========================================
  function initInteractiveSlidebar() {
    if (!dom.slidebarTrack || !dom.slidebarIndicator) return;

    const btns = Array.from(dom.slidebarBtns);
    let activeIndex = 0;

    function moveIndicator(btn) {
      if (!btn || !dom.slidebarIndicator) return;
      dom.slidebarIndicator.style.transform = `translateX(${btn.offsetLeft}px)`;
      dom.slidebarIndicator.style.width = `${btn.offsetWidth}px`;
    }

    function setActiveButton(btn, scroll = true) {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeIndex = btns.indexOf(btn);
      moveIndicator(btn);

      if (!scroll) return;

      const targetId = btn.getAttribute('data-target');
      if (targetId === 'all') {
        const topAnchor = document.getElementById('interactive-slidebar') || document.body;
        topAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
        showToast('Viewing All Sections', 'info');
      } else {
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
          targetSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetSection.classList.remove('card-highlight-pulse');
          void targetSection.offsetWidth; // trigger reflow
          targetSection.classList.add('card-highlight-pulse');
          setTimeout(() => {
            targetSection.classList.remove('card-highlight-pulse');
          }, 1300);
        }
      }
    }

    // Attach click events to slide buttons
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        setActiveButton(btn, true);
      });
    });

    // Arrow controls
    if (dom.slidebarPrev) {
      dom.slidebarPrev.addEventListener('click', () => {
        const prevIndex = (activeIndex - 1 + btns.length) % btns.length;
        setActiveButton(btns[prevIndex], true);
      });
    }

    if (dom.slidebarNext) {
      dom.slidebarNext.addEventListener('click', () => {
        const nextIndex = (activeIndex + 1) % btns.length;
        setActiveButton(btns[nextIndex], true);
      });
    }

    // Window resize adjustment
    window.addEventListener('resize', () => {
      const activeBtn = btns[activeIndex] || btns[0];
      moveIndicator(activeBtn);
    });

    // Initial position
    setTimeout(() => {
      const activeBtn = btns[0];
      if (activeBtn) moveIndicator(activeBtn);
    }, 100);
  }

  // ==========================================
  // AUTOMATIC BACK TO TOP
  // ==========================================
  function initBackToTop() {
    if (!dom.backToTopBtn || !dom.scrollProgressBar) return;

    const RADIUS = 20;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

    dom.scrollProgressBar.style.strokeDasharray = `${CIRCUMFERENCE} ${CIRCUMFERENCE}`;
    dom.scrollProgressBar.style.strokeDashoffset = `${CIRCUMFERENCE}`;

    function updateScrollProgress() {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;

      // Automatically show button when scrolled down > 180px
      if (scrollY > 180) {
        dom.backToTopBtn.classList.add('visible');
      } else {
        dom.backToTopBtn.classList.remove('visible');
      }

      // Update circular scroll progress fill
      if (scrollHeight > 0) {
        const progress = Math.min(1, Math.max(0, scrollY / scrollHeight));
        const offset = CIRCUMFERENCE * (1 - progress);
        dom.scrollProgressBar.style.strokeDashoffset = `${offset}`;
      }
    }

    window.addEventListener('scroll', updateScrollProgress, { passive: true });

    // Smooth scroll back to top on click
    dom.backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });

      // Also reset slidebar active button to 'All Sections'
      const btnAll = document.getElementById('btn-section-all');
      if (btnAll) {
        const btns = Array.from(dom.slidebarBtns);
        btns.forEach(b => b.classList.remove('active'));
        btnAll.classList.add('active');
        if (dom.slidebarIndicator) {
          dom.slidebarIndicator.style.transform = `translateX(${btnAll.offsetLeft}px)`;
          dom.slidebarIndicator.style.width = `${btnAll.offsetWidth}px`;
        }
      }
      showToast('Kembali ke atas 🚀', 'info');
    });

    // Run once on load
    updateScrollProgress();
  }

  // ==========================================
  // OPENING ANIMATION
  // ==========================================
  function initOpeningAnimation() {
    if (!dom.openingSplash) return;

    // Automatically dismiss opening animation after 1.2s
    const dismissSplash = () => {
      dom.openingSplash.classList.add('fade-out');
    };

    const timerId = setTimeout(dismissSplash, 1150);

    // Allow user to click to dismiss immediately
    dom.openingSplash.addEventListener('click', () => {
      clearTimeout(timerId);
      dismissSplash();
    });

    // Allow replaying opening animation by clicking the brand badge
    if (dom.brandBadge) {
      dom.brandBadge.addEventListener('click', () => {
        replayOpeningAnimation();
      });
    }
  }

  function replayOpeningAnimation() {
    if (!dom.openingSplash) return;
    dom.openingSplash.classList.remove('fade-out');

    // Reset progress bar animation
    const progressEl = dom.openingSplash.querySelector('.splash-loader-progress');
    if (progressEl) {
      progressEl.style.animation = 'none';
      void progressEl.offsetWidth; // trigger reflow
      progressEl.style.animation = 'loadFill 1.1s cubic-bezier(0.4, 0, 0.2, 1) forwards';
    }

    setTimeout(() => {
      dom.openingSplash.classList.add('fade-out');
    }, 1150);
  }

  // ==========================================
  // 1. THEME HANDLING (Light / Dark Mode)
  // ==========================================
  function initTheme() {
    state.theme = 'dark';
    localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
    applyTheme(state.theme);

    dom.themeToggle.addEventListener('click', () => {
      const newTheme = state.theme === 'light' ? 'dark' : 'light';
      state.theme = newTheme;
      localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
      applyTheme(newTheme);
      showToast(`Switched to ${newTheme} mode`, 'info');
    });
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (dom.themeIcon) {
      if (theme === 'dark') {
        dom.themeIcon.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        `;
        dom.themeToggle.setAttribute('title', 'Switch to light mode');
      } else {
        dom.themeIcon.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        `;
        dom.themeToggle.setAttribute('title', 'Switch to dark mode');
      }
    }
  }

  // ==========================================
  // 2. GREETING, DATE & CLOCK
  // ==========================================
  function initClockAndGreeting() {
    updateClock();
    setInterval(updateClock, 1000);

    // Click custom name to edit
    dom.userNameSpan.parentElement.addEventListener('click', () => {
      openNameModal();
    });

    dom.nameForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredName = dom.nameInput.value.trim();
      state.userName = enteredName || 'Friend';
      localStorage.setItem(STORAGE_KEYS.USER_NAME, state.userName);
      renderGreeting();
      closeModal(dom.nameModal);
      showToast(`Name updated to "${state.userName}"`, 'success');
    });
  }

  function updateClock() {
    const now = new Date();

    // Date formatting (e.g. Tuesday, October 20, 2026)
    const dateOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    dom.currentDate.textContent = now.toLocaleDateString(undefined, dateOptions);

    // Time formatting
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 hour is 12 AM

    dom.currentTime.textContent = `${hours}:${minutes}`;
    dom.timeSeconds.textContent = `:${seconds} ${ampm}`;

    renderGreeting();
  }

  function renderGreeting() {
    const now = new Date();
    const hour = now.getHours();
    let greetingWord = 'Hello';
    let icon = '☀️';

    if (hour >= 5 && hour < 12) {
      greetingWord = 'Good morning';
      icon = '🌅';
    } else if (hour >= 12 && hour < 17) {
      greetingWord = 'Good afternoon';
      icon = '☀️';
    } else if (hour >= 17 && hour < 22) {
      greetingWord = 'Good evening';
      icon = '🌆';
    } else {
      greetingWord = 'Good night';
      icon = '🌙';
    }

    dom.greetingText.innerHTML = `<span class="greeting-icon">${icon}</span> ${greetingWord},`;
    dom.userNameSpan.textContent = state.userName;
  }

  function openNameModal() {
    dom.nameInput.value = state.userName;
    openModal(dom.nameModal);
    setTimeout(() => dom.nameInput.focus(), 50);
  }

  // ==========================================
  // 3. FOCUS TIMER (POMODORO)
  // ==========================================
  const CIRCLE_RADIUS = 92;
  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * CIRCLE_RADIUS;

  function initTimer() {
    dom.timerCircle.style.strokeDasharray = `${CIRCLE_CIRCUMFERENCE} ${CIRCLE_CIRCUMFERENCE}`;
    dom.timerCircle.style.strokeDashoffset = '0';

    // Timer Controls
    dom.btnTimerStart.addEventListener('click', startTimer);
    dom.btnTimerPause.addEventListener('click', pauseTimer);
    dom.btnTimerReset.addEventListener('click', resetTimer);

    // Presets
    dom.presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mins = parseInt(btn.getAttribute('data-minutes'), 10);
        setTimerMinutes(mins);
        highlightActivePreset(btn);
        dom.customTimeBar.classList.remove('active');
      });
    });

    // Custom time toggle
    dom.btnCustomTimer.addEventListener('click', () => {
      dom.customTimeBar.classList.toggle('active');
      if (dom.customTimeBar.classList.contains('active')) {
        dom.customTimeInput.focus();
      }
    });

    dom.btnApplyCustomTime.addEventListener('click', () => {
      applyCustomDuration();
    });

    dom.customTimeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyCustomDuration();
      }
    });

    // Highlight initial active preset
    const currentMins = Math.round(state.timer.totalSeconds / 60);
    const matchedBtn = Array.from(dom.presetButtons).find(b => parseInt(b.getAttribute('data-minutes'), 10) === currentMins);
    if (matchedBtn) {
      highlightActivePreset(matchedBtn);
    }

    renderTimer();
  }

  function applyCustomDuration() {
    const customMins = parseInt(dom.customTimeInput.value, 10);
    if (!isNaN(customMins) && customMins >= 1 && customMins <= 120) {
      setTimerMinutes(customMins);
      dom.presetButtons.forEach(b => b.classList.remove('active'));
      dom.customTimeBar.classList.remove('active');
      showToast(`Timer set to ${customMins} minutes`, 'info');
    } else {
      showToast('Please enter a valid time between 1 and 120 minutes', 'warning');
    }
  }

  function highlightActivePreset(activeBtn) {
    dom.presetButtons.forEach(b => b.classList.remove('active'));
    if (activeBtn) activeBtn.classList.add('active');
  }

  function setTimerMinutes(minutes) {
    pauseTimer();
    const totalSecs = minutes * 60;
    state.timer.totalSeconds = totalSecs;
    state.timer.remainingSeconds = totalSecs;
    localStorage.setItem(STORAGE_KEYS.TIMER_DURATION, totalSecs);
    renderTimer();
  }

  function startTimer() {
    if (state.timer.isRunning) return;

    state.timer.isRunning = true;
    dom.btnTimerStart.style.display = 'none';
    dom.btnTimerPause.style.display = 'inline-flex';
    dom.timerStatusHint.textContent = 'Session in progress';
    if (dom.timerContainer) {
      dom.timerContainer.classList.add('timer-running');
    }

    state.timer.intervalId = setInterval(() => {
      if (state.timer.remainingSeconds > 0) {
        state.timer.remainingSeconds--;
        renderTimer();
      } else {
        handleTimerComplete();
      }
    }, 1000);
  }

  function pauseTimer() {
    if (!state.timer.isRunning) return;

    state.timer.isRunning = false;
    clearInterval(state.timer.intervalId);
    state.timer.intervalId = null;

    dom.btnTimerStart.style.display = 'inline-flex';
    dom.btnTimerPause.style.display = 'none';
    dom.timerStatusHint.textContent = 'Paused';
    if (dom.timerContainer) {
      dom.timerContainer.classList.remove('timer-running');
    }
    document.title = 'Focus Mode - Productivity Dashboard';
  }

  function resetTimer() {
    pauseTimer();
    state.timer.remainingSeconds = state.timer.totalSeconds;
    dom.timerStatusHint.textContent = 'Ready to focus';
    if (dom.timerContainer) {
      dom.timerContainer.classList.remove('timer-running');
    }
    renderTimer();
  }

  function handleTimerComplete() {
    pauseTimer();
    playChime();

    if (dom.timerContainer) {
      dom.timerContainer.classList.add('celebrating');
      setTimeout(() => {
        dom.timerContainer.classList.remove('celebrating');
      }, 1200);
    }

    if (state.timer.mode === 'focus') {
      state.timer.completedSessions++;
      localStorage.setItem(STORAGE_KEYS.COMPLETED_SESSIONS, state.timer.completedSessions);
      showToast('🎉 Focus session completed! Great job! Take a short break.', 'success');
      
      // Prompt break mode
      state.timer.mode = 'break';
      state.timer.totalSeconds = 5 * 60;
      state.timer.remainingSeconds = 5 * 60;
      dom.timerModePill.textContent = 'Short Break';
      dom.timerModePill.classList.add('break');
      dom.timerCircle.classList.add('break-mode');
    } else {
      showToast('⚡ Break finished! Ready for the next focus sprint?', 'info');
      state.timer.mode = 'focus';
      const storedDuration = parseInt(localStorage.getItem(STORAGE_KEYS.TIMER_DURATION), 10) || 25 * 60;
      state.timer.totalSeconds = storedDuration;
      state.timer.remainingSeconds = storedDuration;
      dom.timerModePill.textContent = 'Focus Session';
      dom.timerModePill.classList.remove('break');
      dom.timerCircle.classList.remove('break-mode');
    }

    renderTimer();
  }

  function renderTimer() {
    const mins = Math.floor(state.timer.remainingSeconds / 60);
    const secs = state.timer.remainingSeconds % 60;
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    dom.timerDigits.textContent = formatted;

    if (state.timer.isRunning) {
      document.title = `(${formatted}) Focus Mode`;
    }

    // Circular progress
    const progress = state.timer.remainingSeconds / state.timer.totalSeconds;
    const offset = CIRCLE_CIRCUMFERENCE * (1 - progress);
    dom.timerCircle.style.strokeDashoffset = offset;

    // Sessions count
    dom.sessionsCompleted.textContent = state.timer.completedSessions;
  }

  // Synthesized chime using Web Audio API (100% offline, modern)
  function playChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 chime
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const startTime = ctx.currentTime + idx * 0.12;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.85);
      });
    } catch {
      // Audio context may be restricted by browser policy if unprompted
    }
  }

  // ==========================================
  // 4. TO-DO LIST (With Duplicate Prevention & Sorting)
  // ==========================================
  function loadTasks() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      return data ? JSON.parse(data) : DEFAULT_TASKS;
    } catch {
      return DEFAULT_TASKS;
    }
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(state.tasks));
  }

  function initTodos() {
    // Add task form
    dom.todoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleAddTask();
    });

    // Real-time check for duplicate tasks
    dom.todoInput.addEventListener('input', () => {
      const text = dom.todoInput.value.trim().toLowerCase();
      if (!text) {
        dom.duplicateWarning.classList.remove('visible');
        return;
      }
      const isDuplicate = state.tasks.some(t => t.text.trim().toLowerCase() === text);
      if (isDuplicate) {
        dom.duplicateWarning.classList.add('visible');
      } else {
        dom.duplicateWarning.classList.remove('visible');
      }
    });

    // Sort select change
    dom.todoSortSelect.addEventListener('change', (e) => {
      state.sort = e.target.value;
      renderTasks();
    });

    // Filter tabs
    dom.filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        dom.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.filter = btn.getAttribute('data-filter');
        renderTasks();
      });
    });

    // Clear completed
    dom.btnClearCompleted.addEventListener('click', () => {
      const completedCount = state.tasks.filter(t => t.completed).length;
      if (completedCount === 0) {
        showToast('No completed tasks to clear', 'info');
        return;
      }
      state.tasks = state.tasks.filter(t => !t.completed);
      saveTasks();
      renderTasks();
      showToast(`Cleared ${completedCount} completed task(s)`, 'success');
    });

    renderTasks();
  }

  function handleAddTask() {
    const rawText = dom.todoInput.value.trim();
    if (!rawText) return;

    // Challenge: Prevent duplicate tasks
    const isDuplicate = state.tasks.some(
      t => t.text.trim().toLowerCase() === rawText.toLowerCase()
    );

    if (isDuplicate) {
      dom.duplicateWarning.classList.add('visible');
      showToast('⚠️ Duplicate task: This task already exists in your list!', 'warning');
      dom.todoInput.focus();
      return;
    }

    const newTask = {
      id: 'task_' + Date.now(),
      text: rawText,
      completed: false,
      createdAt: Date.now()
    };

    state.newestTaskId = newTask.id;
    state.tasks.unshift(newTask);
    saveTasks();
    dom.todoInput.value = '';
    dom.duplicateWarning.classList.remove('visible');
    renderTasks();
    showToast('Task added successfully', 'success');
  }

  function getSortedAndFilteredTasks() {
    // 1. Filter
    let filtered = state.tasks.filter(t => {
      if (state.filter === 'active') return !t.completed;
      if (state.filter === 'completed') return t.completed;
      return true;
    });

    // 2. Challenge: Sort tasks
    filtered.sort((a, b) => {
      switch (state.sort) {
        case 'created-desc':
          return b.createdAt - a.createdAt;
        case 'created-asc':
          return a.createdAt - b.createdAt;
        case 'alpha-asc':
          return a.text.localeCompare(b.text);
        case 'alpha-desc':
          return b.text.localeCompare(a.text);
        case 'status':
          // uncompleted first, then completed
          if (a.completed === b.completed) return b.createdAt - a.createdAt;
          return a.completed ? 1 : -1;
        default:
          return b.createdAt - a.createdAt;
      }
    });

    return filtered;
  }

  function renderTasks() {
    const tasksToDisplay = getSortedAndFilteredTasks();
    const totalCount = state.tasks.length;
    const completedCount = state.tasks.filter(t => t.completed).length;

    dom.tasksCounter.textContent = `${completedCount} of ${totalCount} done`;
    dom.tasksStats.textContent = `${totalCount} task${totalCount === 1 ? '' : 's'}`;

    if (tasksToDisplay.length === 0) {
      dom.tasksContainer.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <p class="empty-state-title">No tasks found</p>
          <p class="empty-state-desc">${state.filter === 'all' ? 'Add your first task above to get started!' : 'No tasks match the active filter.'}</p>
        </div>
      `;
      return;
    }

    dom.tasksContainer.innerHTML = '';
    tasksToDisplay.forEach(task => {
      const isNew = state.newestTaskId === task.id;
      const taskEl = document.createElement('div');
      taskEl.className = `task-item ${task.completed ? 'completed' : ''} ${isNew ? 'task-enter' : ''}`;
      taskEl.setAttribute('data-id', task.id);

      const isEditing = state.editingTaskId === task.id;

      if (isEditing) {
        taskEl.innerHTML = `
          <div class="task-edit-row">
            <input type="text" class="task-edit-input" value="${escapeHtml(task.text)}" />
            <button class="btn btn-primary btn-save-task" style="padding: 6px 12px; font-size: 0.8rem;">Save</button>
            <button class="btn btn-secondary btn-cancel-task" style="padding: 6px 10px; font-size: 0.8rem;">Cancel</button>
          </div>
        `;

        const editInput = taskEl.querySelector('.task-edit-input');
        const saveBtn = taskEl.querySelector('.btn-save-task');
        const cancelBtn = taskEl.querySelector('.btn-cancel-task');

        saveBtn.addEventListener('click', () => {
          saveTaskEdit(task.id, editInput.value);
        });

        cancelBtn.addEventListener('click', () => {
          state.editingTaskId = null;
          renderTasks();
        });

        editInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            saveTaskEdit(task.id, editInput.value);
          } else if (e.key === 'Escape') {
            state.editingTaskId = null;
            renderTasks();
          }
        });

        setTimeout(() => editInput.focus(), 10);
      } else {
        const dateFormatted = new Date(task.createdAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric'
        });

        taskEl.innerHTML = `
          <div class="task-left">
            <div class="custom-checkbox" role="checkbox" aria-checked="${task.completed}" title="${task.completed ? 'Mark uncompleted' : 'Mark completed'}">
              <svg class="checkbox-check-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div class="task-content">
              <div class="task-text">${escapeHtml(task.text)}</div>
              <div class="task-date-badge">Added ${dateFormatted}</div>
            </div>
          </div>
          <div class="task-actions">
            <button class="btn-task-action edit" title="Edit task">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="btn-task-action delete" title="Delete task">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        `;

        // Checkbox click
        const checkbox = taskEl.querySelector('.custom-checkbox');
        checkbox.addEventListener('click', () => {
          toggleTask(task.id);
        });

        // Edit button click
        const editBtn = taskEl.querySelector('.btn-task-action.edit');
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          state.editingTaskId = task.id;
          renderTasks();
        });

        // Delete button click
        const deleteBtn = taskEl.querySelector('.btn-task-action.delete');
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteTask(task.id);
        });
      }

      dom.tasksContainer.appendChild(taskEl);
    });
  }

  function toggleTask(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
    if (task.completed) {
      showToast('Task marked as done! 👍', 'success');
    }
  }

  function saveTaskEdit(taskId, newText) {
    const trimmed = newText.trim();
    if (!trimmed) {
      showToast('Task text cannot be empty', 'warning');
      return;
    }

    // Check duplicate among other tasks
    const isDuplicate = state.tasks.some(
      t => t.id !== taskId && t.text.trim().toLowerCase() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      showToast('⚠️ Another task already has this exact name!', 'warning');
      return;
    }

    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
      task.text = trimmed;
      saveTasks();
      state.editingTaskId = null;
      renderTasks();
      showToast('Task updated', 'success');
    }
  }

  function deleteTask(taskId) {
    const taskEl = dom.tasksContainer.querySelector(`.task-item[data-id="${taskId}"]`);
    if (taskEl) {
      taskEl.classList.add('task-exit');
      setTimeout(() => {
        state.tasks = state.tasks.filter(t => t.id !== taskId);
        saveTasks();
        renderTasks();
        showToast('Task deleted', 'info');
      }, 250);
    } else {
      state.tasks = state.tasks.filter(t => t.id !== taskId);
      saveTasks();
      renderTasks();
      showToast('Task deleted', 'info');
    }
  }

  // ==========================================
  // 5. QUICK LINKS
  // ==========================================
  function loadQuickLinks() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.QUICK_LINKS);
      return data ? JSON.parse(data) : DEFAULT_LINKS;
    } catch {
      return DEFAULT_LINKS;
    }
  }

  function saveQuickLinks() {
    localStorage.setItem(STORAGE_KEYS.QUICK_LINKS, JSON.stringify(state.quickLinks));
  }

  function initQuickLinks() {
    dom.btnAddLink.addEventListener('click', () => {
      openAddLinkModal();
    });

    dom.linkForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSaveLink();
    });

    renderQuickLinks();
  }

  function normalizeUrl(url) {
    let clean = url.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = 'https://' + clean;
    }
    return clean;
  }

  function extractDomain(url) {
    try {
      const parsed = new URL(url);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }

  function renderQuickLinks() {
    dom.quicklinksGrid.innerHTML = '';

    if (state.quickLinks.length === 0) {
      dom.quicklinksGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <p class="empty-state-title">No quick links yet</p>
          <p class="empty-state-desc">Add shortcuts to your favorite websites for quick one-click access.</p>
        </div>
      `;
      return;
    }

    state.quickLinks.forEach(link => {
      const linkCard = document.createElement('a');
      linkCard.href = link.url;
      linkCard.target = '_blank';
      linkCard.rel = 'noopener noreferrer';
      linkCard.className = 'link-card';

      const domain = extractDomain(link.url);
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
      const initial = link.title ? link.title.charAt(0).toUpperCase() : '🔗';

      linkCard.innerHTML = `
        <div class="link-favicon">
          <img src="${faviconUrl}" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
          <span style="display: none;">${initial}</span>
        </div>
        <div class="link-info">
          <span class="link-title" title="${escapeHtml(link.title)}">${escapeHtml(link.title)}</span>
          <span class="link-domain">${escapeHtml(domain)}</span>
        </div>
        <div class="link-actions">
          <button class="btn-link-action edit" title="Edit bookmark">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          <button class="btn-link-action delete" title="Delete bookmark">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;

      // Prevent link opening when clicking edit or delete
      const editBtn = linkCard.querySelector('.btn-link-action.edit');
      editBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openEditLinkModal(link);
      });

      const deleteBtn = linkCard.querySelector('.btn-link-action.delete');
      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        deleteQuickLink(link.id);
      });

      dom.quicklinksGrid.appendChild(linkCard);
    });
  }

  function openAddLinkModal() {
    state.editingLinkId = null;
    dom.linkModalTitle.textContent = 'Add Quick Link';
    dom.linkTitleInput.value = '';
    dom.linkUrlInput.value = '';
    openModal(dom.linkModal);
    setTimeout(() => dom.linkTitleInput.focus(), 50);
  }

  function openEditLinkModal(link) {
    state.editingLinkId = link.id;
    dom.linkModalTitle.textContent = 'Edit Quick Link';
    dom.linkTitleInput.value = link.title;
    dom.linkUrlInput.value = link.url;
    openModal(dom.linkModal);
    setTimeout(() => dom.linkTitleInput.focus(), 50);
  }

  function handleSaveLink() {
    const title = dom.linkTitleInput.value.trim();
    let url = dom.linkUrlInput.value.trim();

    if (!title || !url) {
      showToast('Please provide both title and URL', 'warning');
      return;
    }

    url = normalizeUrl(url);

    if (state.editingLinkId) {
      // Edit
      const link = state.quickLinks.find(l => l.id === state.editingLinkId);
      if (link) {
        link.title = title;
        link.url = url;
        showToast('Link updated', 'success');
      }
    } else {
      // Add
      state.quickLinks.push({
        id: 'link_' + Date.now(),
        title,
        url
      });
      showToast('Quick link added', 'success');
    }

    saveQuickLinks();
    renderQuickLinks();
    closeModal(dom.linkModal);
  }

  function deleteQuickLink(linkId) {
    state.quickLinks = state.quickLinks.filter(l => l.id !== linkId);
    saveQuickLinks();
    renderQuickLinks();
    showToast('Quick link removed', 'info');
  }

  // ==========================================
  // MODALS & HELPERS
  // ==========================================
  function initModals() {
    // Close name modal
    dom.closeNameModal.addEventListener('click', () => closeModal(dom.nameModal));
    dom.cancelNameModal.addEventListener('click', () => closeModal(dom.nameModal));

    // Close link modal
    dom.closeLinkModal.addEventListener('click', () => closeModal(dom.linkModal));
    dom.cancelLinkModal.addEventListener('click', () => closeModal(dom.linkModal));

    // Overlay click to close
    [dom.nameModal, dom.linkModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          closeModal(modal);
        }
      });
    });

    // ESC to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal(dom.nameModal);
        closeModal(dom.linkModal);
      }
    });
  }

  function openModal(modalEl) {
    modalEl.classList.add('active');
  }

  function closeModal(modalEl) {
    modalEl.classList.remove('active');
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px) scale(0.95)';
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 200);
    }, 3200);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderAll() {
    renderGreeting();
    renderTimer();
    renderTasks();
    renderQuickLinks();
  }

  // Start app once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
