/* Stony Brook SHPE — Shared JS: scroll-reveal + nav toggle */

(function () {
  'use strict';

  // ── Scroll-reveal ─────────────────────────────────────────
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
  );

  function observeReveal() {
    document.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => io.observe(el));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeReveal);
  } else {
    observeReveal();
  }

  // ── Nav hamburger toggle ───────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.querySelector('.shpe-nav-toggle');
    const links = document.querySelector('.shpe-nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', () => {
        links.classList.toggle('is-open');
        const expanded = links.classList.contains('is-open');
        toggle.setAttribute('aria-expanded', String(expanded));
      });

      // Close on link click (mobile)
      links.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', () => links.classList.remove('is-open'));
      });

      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!toggle.contains(e.target) && !links.contains(e.target)) {
          links.classList.remove('is-open');
        }
      });
    }

    // ── Custom animated select ────────────────────────────────
    document.querySelectorAll('.contact-custom-select').forEach((wrapper) => {
      const trigger = wrapper.querySelector('.contact-custom-select-trigger');
      const valEl   = wrapper.querySelector('.contact-custom-select-val');
      const hidden  = wrapper.querySelector('input[type="hidden"]');
      const opts    = wrapper.querySelectorAll('.contact-custom-select-opt');

      function close() {
        wrapper.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      }

      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const opening = !wrapper.classList.contains('is-open');
        document.querySelectorAll('.contact-custom-select').forEach((w) => {
          w.classList.remove('is-open');
          w.querySelector('.contact-custom-select-trigger').setAttribute('aria-expanded', 'false');
        });
        if (opening) {
          wrapper.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });

      opts.forEach((opt) => {
        opt.addEventListener('click', () => {
          const val = opt.querySelector('span').textContent;
          valEl.textContent = val;
          hidden.value = val;
          opts.forEach((o) => o.classList.remove('is-selected'));
          opt.classList.add('is-selected');
          close();
        });
      });

      document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) close();
      });
    });

    // ── Auth mode switch (sign in / create account) ───────────
    document.querySelectorAll('.auth-form').forEach((card) => {
      const tabs = Array.from(card.querySelectorAll('.auth-switch-btn'));
      const panels = card.querySelectorAll('.auth-panel');
      if (!tabs.length || !panels.length) return;

      // Until this class lands the panels render stacked, so the page degrades
      // to a usable form rather than hiding sign-up behind a dead button.
      card.classList.add('is-enhanced');

      function select(tab) {
        tabs.forEach((other) => {
          const isActive = other === tab;
          other.classList.toggle('is-active', isActive);
          other.setAttribute('aria-selected', String(isActive));
          other.tabIndex = isActive ? 0 : -1;
        });
        const panelId = tab.getAttribute('aria-controls');
        panels.forEach((panel) => {
          panel.classList.toggle('is-active', panel.id === panelId);
        });
      }

      tabs.forEach((tab, index) => {
        tab.tabIndex = tab.classList.contains('is-active') ? 0 : -1;
        tab.addEventListener('click', () => select(tab));
        tab.addEventListener('keydown', (e) => {
          if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
          const step = e.key === 'ArrowRight' ? 1 : -1;
          const next = tabs[(index + step + tabs.length) % tabs.length];
          select(next);
          next.focus();
        });
      });
    });

    // ── Field checks ──────────────────────────────────────────
    // UX only. The server is still the one that decides who is a student.
    // isWrong receives the field's raw value and is only asked about non-empty
    // input, since an empty field is the required attribute's job.
    function wireFieldCheck(input, isWrong, message) {
      const errorEl = document.getElementById(input.getAttribute('aria-describedby'));

      // Tested raw, so this always agrees with any native pattern on the field.
      // A trimming check here could clear the message while the pattern still
      // failed, which rejects the field silently.
      function check() {
        const wrong = input.value !== '' && isWrong(input.value);
        input.setCustomValidity(wrong ? message : '');
        return wrong;
      }

      function render(wrong) {
        input.classList.toggle('is-error', wrong);
        input.setAttribute('aria-invalid', String(wrong));
        if (errorEl) errorEl.textContent = wrong ? message : '';
      }

      // Leaving the field tidies stray paste whitespace, so surrounding spaces
      // never become the user's problem.
      input.addEventListener('blur', () => {
        input.value = input.value.trim();
        render(check());
      });
      input.addEventListener('invalid', () => render(check()));

      // Keep validity current as they type, but only clear a shown error —
      // flagging a half-typed value mid-keystroke reads as nagging.
      input.addEventListener('input', () => {
        if (!check()) render(false);
      });
    }

    const SBU_EMAIL_DOMAIN = '@stonybrook.edu';
    const SBU_EMAIL_MESSAGE = 'Use your Stony Brook email, ending in @stonybrook.edu.';
    document.querySelectorAll('input[data-sbu-email]').forEach((input) => {
      wireFieldCheck(
        input,
        (value) => !value.toLowerCase().endsWith(SBU_EMAIL_DOMAIN),
        SBU_EMAIL_MESSAGE
      );
    });

    const STUDENT_ID_PATTERN = /^\d{9}$/;
    const STUDENT_ID_MESSAGE = 'Your student ID is 9 digits, numbers only.';
    document.querySelectorAll('input[data-student-id]').forEach((input) => {
      wireFieldCheck(input, (value) => !STUDENT_ID_PATTERN.test(value), STUDENT_ID_MESSAGE);
    });

    // ── Auth forms: required fields validate, nothing is sent yet ──
    document.querySelectorAll('.auth-panel').forEach((form) => {
      const status = form.querySelector('.auth-status');
      if (!status) return;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        status.textContent =
          'Design preview: accounts are not connected yet, so nothing was sent.';
      });
    });

    // ── Contact form submit handler ──────────────────────────
    const form = document.getElementById('shpe-contact-form');
    if (form) {
      const submitBtn = form.querySelector('.contact-submit');
      form.addEventListener('submit', () => {
        if (submitBtn) {
          submitBtn.textContent = '✓  Message sent';
          submitBtn.style.background = '#2f9e5a';
          submitBtn.disabled = true;
        }
      });
    }
  });
})();
