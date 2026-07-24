/**
 * Voice Portfolio — Client-side interactivity
 * -----------------------------------------------------------
 * Demonstrates:
 *  - Functions, control structures (if/else, for/forEach), event handling
 *  - Interactive menus (genre tabs, mobile nav)
 *  - Conditional content display (EN/BM language toggle)
 *  - Form validation (real-time + on submit)
 *  - Dynamic feature: live character counter
 *  - Talking to the server (fetch -> Node.js -> SQLite)
 * -----------------------------------------------------------
 */

// ============================================================
// 0a. HERO WAVE BARS (dynamic DOM generation)
// ============================================================
(function setupWaveBars() {
  const waveWrap = document.getElementById('waveBars');
  if (!waveWrap) return;

  const BAR_COUNT = 26;
  for (let i = 0; i < BAR_COUNT; i++) {
    const bar = document.createElement('span');
    // stagger each bar's animation so they dance like a real equalizer
    bar.style.animationDelay = (i * 0.09) + 's';
    bar.style.animationDuration = (0.8 + (i % 5) * 0.14) + 's';
    waveWrap.appendChild(bar);
  }
})();

// ============================================================
// 0b. SCROLL REVEAL (IntersectionObserver animation)
// ============================================================
(function setupScrollReveal() {
  // cinematic.js (GSAP ScrollTrigger) takes over scene animation when the
  // CDN libraries loaded — this observer is the offline/no-CDN fallback
  if (window.gsap && window.ScrollTrigger &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }
  const targets = document.querySelectorAll(
    '.section-title, .section-sub, .about-card, .reel-card, .genre-tabs, .spec-item, .booking-wrap'
  );
  targets.forEach(function (el) { el.classList.add('reveal'); });

  if (!('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('visible'); });
    return;
  }

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  targets.forEach(function (el) { observer.observe(el); });
})();

// ============================================================
// 0c. MISSING AUDIO -> "coming soon" note (graceful fallback)
// ============================================================
(function handleMissingAudio() {
  function showComingSoon(audio) {
    const note = document.createElement('p');
    note.className = 'audio-soon';
    note.innerHTML =
      '<span data-lang="en">🎧 Sample coming soon</span>' +
      '<span data-lang="bm">🎧 Sampel akan datang</span>';
    audio.replaceWith(note);
  }

  document.querySelectorAll('audio').forEach(function (audio) {
    const source = audio.querySelector('source');
    if (!source) return;
    // on fast hosting the 404 can arrive before this script runs, so check
    // the already-failed state as well as listening for a future failure
    if (audio.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
      showComingSoon(audio);
      return;
    }
    source.addEventListener('error', function () {
      showComingSoon(audio);
    });
  });
})();

// ============================================================
// 0d. ONLY ONE SAMPLE PLAYS AT A TIME
// ============================================================
(function setupSingleAudioPlayback() {
  const players = document.querySelectorAll('audio');
  players.forEach(function (audio) {
    audio.addEventListener('play', function () {
      players.forEach(function (other) {
        if (other !== audio) other.pause();
      });
    });
  });
})();

// ============================================================
// 1. LANGUAGE TOGGLE (conditional content display)
// ============================================================
(function setupLanguageToggle() {
  const langToggleBtn = document.getElementById('langToggle');
  let currentLang = 'en'; // control variable

  function applyLanguage(lang) {
    if (lang === 'bm') {
      document.body.classList.add('lang-bm');
      langToggleBtn.textContent = 'English';
    } else {
      document.body.classList.remove('lang-bm');
      langToggleBtn.textContent = 'Bahasa Melayu';
    }
    currentLang = lang;
  }

  langToggleBtn.addEventListener('click', function () {
    // simple control structure: toggle between two states
    const nextLang = (currentLang === 'en') ? 'bm' : 'en';
    applyLanguage(nextLang);
  });
})();

// ============================================================
// 2. MOBILE NAV MENU (interactive menu, event handling)
// ============================================================
(function setupMobileMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  menuToggle.addEventListener('click', function () {
    navLinks.classList.toggle('open');
  });

  // close menu after clicking a link (better mobile UX)
  const links = navLinks.querySelectorAll('a');
  for (let i = 0; i < links.length; i++) {
    links[i].addEventListener('click', function () {
      navLinks.classList.remove('open');
    });
  }
})();

// ============================================================
// 3. GENRE TABS (interactive menu + conditional content display)
// ============================================================
(function setupGenreTabs() {
  const tabButtons = document.querySelectorAll('.genre-tab-btn');
  const panels = document.querySelectorAll('.genre-panel');

  function showGenre(genreName) {
    // loop through all panels — control structure (forEach)
    panels.forEach(function (panel) {
      if (panel.id === 'panel-' + genreName) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    tabButtons.forEach(function (btn) {
      if (btn.dataset.genre === genreName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      showGenre(btn.dataset.genre);
    });
  });
})();

// ============================================================
// 4. LIVE CHARACTER COUNTER (dynamic feature)
// ============================================================
(function setupCharCounter() {
  const messageBox = document.getElementById('message');
  const charCount = document.getElementById('charCount');

  messageBox.addEventListener('input', function () {
    charCount.textContent = messageBox.value.length;
  });
})();

// ============================================================
// 5. FORM VALIDATION + SUBMISSION (functions, control structures,
//    event handling, fetch to Node.js server)
// ============================================================
(function setupBookingForm() {
  const form = document.getElementById('bookingForm');
  const statusBox = document.getElementById('formStatus');

  // To go live on cheap hosting without a Node server: create a free form at
  // https://formspree.io (sign up with your email), copy its endpoint, and paste
  // it here — e.g. 'https://formspree.io/f/abcdwxyz'. Bookings will then be
  // emailed to you. Leave it '' to keep using the local server.js + SQLite.
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mojgljwz';

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^[0-9+\-\s]{7,15}$/;

  // Budget ranges shown in whichever currency the client picks
  const budgetRanges = {
    myr: [['under-rm100', 'Under RM100'], ['rm100-300', 'RM100 – RM300'], ['rm300-plus', 'RM300+']],
    usd: [['under-usd25', 'Under $25'], ['usd25-75', '$25 – $75'], ['usd75-plus', '$75+']],
    gbp: [['under-gbp20', 'Under £20'], ['gbp20-60', '£20 – £60'], ['gbp60-plus', '£60+']]
  };

  function updateBudgetOptions() {
    const cur = document.getElementById('currency').value || 'myr';
    const budget = document.getElementById('budget');
    const prevIndex = budget.selectedIndex; // keep the same slot selected across currencies
    const opts = [['', '-- Select --']]
      .concat(budgetRanges[cur])
      .concat([['not-sure', 'Not sure yet']]);

    budget.innerHTML = '';
    opts.forEach(function (pair) {
      const o = document.createElement('option');
      o.value = pair[0];
      o.textContent = pair[1];
      budget.appendChild(o);
    });

    if (prevIndex > -1 && prevIndex < budget.options.length) {
      budget.selectedIndex = prevIndex;
    }
  }

  document.getElementById('currency').addEventListener('change', updateBudgetOptions);

  function setError(rowId, hasError) {
    const row = document.getElementById(rowId);
    if (hasError) {
      row.classList.add('has-error');
    } else {
      row.classList.remove('has-error');
    }
  }

  function validateName() {
    const val = document.getElementById('name').value.trim();
    const valid = val.length >= 2;
    setError('row-name', !valid);
    return valid;
  }

  function validateEmail() {
    const val = document.getElementById('email').value.trim();
    const valid = emailPattern.test(val);
    setError('row-email', !valid);
    return valid;
  }

  function validatePhone() {
    const val = document.getElementById('phone').value.trim();
    // phone is optional — only validate if something was typed
    if (val === '') {
      setError('row-phone', false);
      return true;
    }
    const valid = phonePattern.test(val);
    setError('row-phone', !valid);
    return valid;
  }

  function validateProjectType() {
    const val = document.getElementById('projectType').value;
    const valid = val !== '';
    setError('row-projectType', !valid);
    return valid;
  }

  function validateMessage() {
    const val = document.getElementById('message').value;
    const valid = val.length <= 1000;
    setError('row-message', !valid);
    return valid;
  }

  function validateCurrency() {
    const val = document.getElementById('currency').value;
    const valid = val !== '';
    setError('row-currency', !valid);
    return valid;
  }

  function validateMethod() {
    const val = document.getElementById('payMethod').value;
    const valid = val !== '';
    setError('row-method', !valid);
    return valid;
  }

  function validateDeposit() {
    const val = document.getElementById('deposit').value;
    const valid = val !== '';
    setError('row-deposit', !valid);
    return valid;
  }

  function validateDays() {
    const val = document.getElementById('days').value.trim();
    // days is optional — only validate if something was typed
    if (val === '') {
      setError('row-days', false);
      return true;
    }
    const num = Number(val);
    const valid = Number.isInteger(num) && num >= 1 && num <= 365;
    setError('row-days', !valid);
    return valid;
  }

  // Real-time validation as the user types/selects (event handling)
  document.getElementById('name').addEventListener('blur', validateName);
  document.getElementById('email').addEventListener('blur', validateEmail);
  document.getElementById('phone').addEventListener('blur', validatePhone);
  document.getElementById('projectType').addEventListener('change', validateProjectType);
  document.getElementById('currency').addEventListener('change', validateCurrency);
  document.getElementById('payMethod').addEventListener('change', validateMethod);
  document.getElementById('deposit').addEventListener('change', validateDeposit);
  document.getElementById('days').addEventListener('blur', validateDays);

  function showStatus(message, isSuccess) {
    statusBox.textContent = message;
    statusBox.className = isSuccess ? 'success' : 'error';
  }

  // Badzlina's WhatsApp number in international format (no +, no spaces)
  const WHATSAPP_NUMBER = '60182780523';

  // reads the readable label of a <select> (its chosen option's text)
  function selectedText(id) {
    const el = document.getElementById(id);
    if (!el || el.selectedIndex < 0) return '';
    const txt = el.options[el.selectedIndex].text;
    return (txt.indexOf('--') === 0) ? '' : txt;
  }

  // Build a tidy WhatsApp message from the form (call BEFORE form.reset())
  function buildWhatsAppLink() {
    const lines = ['*New Voice Over Booking*', ''];
    function add(label, value) { if (value) lines.push(label + ': ' + value); }

    add('Name', document.getElementById('name').value.trim());
    add('Email', document.getElementById('email').value.trim());
    add('Phone', document.getElementById('phone').value.trim());
    add('Project', selectedText('projectType'));
    add('Currency', selectedText('currency'));
    add('Budget', selectedText('budget'));
    add('Payment', selectedText('payMethod'));
    add('Deposit', selectedText('deposit'));
    add('Timeline', document.getElementById('days').value.trim()
      ? document.getElementById('days').value.trim() + ' day(s)' : '');
    if (document.getElementById('rush').checked) lines.push('Rush: Yes (24–48h)');
    add('Details', document.getElementById('message').value.trim());

    const text = encodeURIComponent(lines.join('\n'));
    return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + text;
  }

  // After a successful booking, offer to also send it via WhatsApp
  function offerWhatsApp(link) {
    const a = document.createElement('a');
    a.className = 'wa-send';
    a.href = link;
    a.target = '_blank';
    a.rel = 'noopener';
    a.innerHTML =
      '<svg viewBox="0 0 32 32" width="18" height="18" aria-hidden="true">' +
      '<path fill="currentColor" d="M16 3C9.4 3 4 8.4 4 15c0 2.1.6 4.2 1.6 6L4 29l8.2-1.6c1.7.9 3.7 1.4 5.8 1.4 6.6 0 12-5.4 12-12S22.6 3 16 3zm0 21.8c-1.8 0-3.6-.5-5.1-1.4l-.4-.2-4.9 1 1-4.8-.2-.4c-1-1.6-1.5-3.4-1.5-5.3C4.9 9.4 9.9 4.5 16 4.5S27.1 9.4 27.1 15.5 22.1 24.8 16 24.8z"/></svg>' +
      (document.body.classList.contains('lang-bm')
        ? 'Hantar juga melalui WhatsApp'
        : 'Also send via WhatsApp');
    statusBox.appendChild(document.createElement('br'));
    statusBox.appendChild(a);
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault(); // stop normal page reload — we handle it with JS

    // run every validator — control structure combining booleans
    const validations = [
      validateName(),
      validateEmail(),
      validatePhone(),
      validateProjectType(),
      validateCurrency(),
      validateMethod(),
      validateDeposit(),
      validateMessage(),
      validateDays()
    ];

    const allValid = validations.every(function (v) { return v === true; });

    if (!allValid) {
      showStatus('Please fix the highlighted fields above.', false);
      return;
    }

    const payload = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      projectType: document.getElementById('projectType').value,
      budget: document.getElementById('budget').value,
      currency: document.getElementById('currency').value,
      payMethod: document.getElementById('payMethod').value,
      deposit: document.getElementById('deposit').value,
      days: document.getElementById('days').value.trim(),
      rush: document.getElementById('rush').checked,
      message: document.getElementById('message').value.trim()
    };

    try {
      const endpoint = FORMSPREE_ENDPOINT || '/api/bookings';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      // server.js replies { success: true }, Formspree replies { ok: true }
      const succeeded = response.ok && (result.success || result.ok);

      if (succeeded) {
        const waLink = buildWhatsAppLink(); // capture details before reset clears them
        showStatus('Thanks! Your booking request has been sent. I\'ll reply soon.', true);
        offerWhatsApp(waLink);
        form.reset();
        updateBudgetOptions();
        document.getElementById('charCount').textContent = '0';
      } else {
        const errText = (result.errors && result.errors.length > 0)
          ? result.errors.map(function (e) { return e.message || e; }).join(' ')
          : 'Something went wrong. Please try again.';
        showStatus(errText, false);
      }
    } catch (err) {
      const offlineMsg = FORMSPREE_ENDPOINT
        ? 'Could not reach the form service. Please check your connection and try again.'
        : 'Could not reach the server. Is server.js running?';
      showStatus(offlineMsg, false);
    }
  });
})();
