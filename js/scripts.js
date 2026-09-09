/* Progressive enhancement. Content and direct contact links work without JavaScript. */
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  if (window.lucide) window.lucide.createIcons();
  const header = $('.site-header');
  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 25);
  updateHeader(); window.addEventListener('scroll', updateHeader, { passive: true });

  // Mobile navigation uses native links and restores focus when dismissed.
  const menu = $('.menu-toggle'), nav = $('#main-nav');
  function closeMenu(restore = false) {
    nav?.classList.remove('is-open'); menu?.setAttribute('aria-expanded', 'false');
    menu?.setAttribute('aria-label', 'Open navigation'); if (restore) menu?.focus();
  }
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation'); nav.classList.toggle('is-open', open);
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') closeMenu(true); });
  document.addEventListener('click', e => { if (!header?.contains(e.target)) closeMenu(); });
  $$('a', nav).forEach(a => a.addEventListener('click', () => closeMenu()));
  window.matchMedia('(min-width:801px)').addEventListener('change', () => closeMenu());

  // Native dialog supplies focus trapping and Escape handling.
  $$('dialog').forEach(dialog => {
    $('.dialog-close', dialog)?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
    dialog.addEventListener('close', () => document.body.classList.remove('no-scroll'));
  });
  function openDialog(dialog) { if (!dialog) return; dialog.showModal(); document.body.classList.add('no-scroll'); }
  $$('[data-open]').forEach(b => b.addEventListener('click', () => openDialog(document.getElementById(b.dataset.open))));
  const lightbox = $('#lightbox');
  $$('.image-open').forEach(b => b.addEventListener('click', () => {
    $('img', lightbox).src = b.dataset.image; $('img', lightbox).alt = b.dataset.caption;
    $('#lightbox-caption').textContent = b.dataset.caption; openDialog(lightbox);
  }));

  const filters = $$('[data-filter]');
  filters.forEach(button => button.addEventListener('click', () => {
    filters.forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    let count = 0; $$('.gallery-card').forEach(card => {
      const visible = button.dataset.filter === 'All' || card.dataset.category === button.dataset.filter;
      card.hidden = !visible; if (visible) count++;
    }); $('#gallery-count').textContent = `${count} reference image${count === 1 ? '' : 's'}`;
  }));
  $$('.comparison input').forEach(range => range.addEventListener('input', () => range.closest('.comparison').style.setProperty('--position', `${range.value}%`)));
  $('#faq-search')?.addEventListener('input', e => {
    const query = e.target.value.trim().toLocaleLowerCase('en-GB'); let count = 0;
    $$('.faq-item').forEach(item => { item.hidden = !item.textContent.toLocaleLowerCase('en-GB').includes(query); if (!item.hidden) count++; });
    $('#faq-empty').hidden = count !== 0; $('#faq-count').textContent = `${count} question${count === 1 ? '' : 's'}`;
  });
  $$('.checklist input').forEach(input => input.addEventListener('change', () => {
    $('#check-progress').textContent = `${$$('.checklist input:checked').length} of ${$$('.checklist input').length} checked`;
  }));
  $('#print-checklist')?.addEventListener('click', () => window.print());

  // Storage is optional: private modes and denied storage must not break the site.
  const consent = { get() { try { return localStorage.getItem('vfc-cookie-choice'); } catch { return null; } }, set(v) { try { localStorage.setItem('vfc-cookie-choice', v); } catch { /* Keep choice for this page only. */ } } };
  const banner = $('#cookie-banner'); banner.hidden = !!consent.get();
  $$('[data-consent]').forEach(b => b.addEventListener('click', () => { consent.set(b.dataset.consent); banner.hidden = true; }));
  $('#cookie-settings')?.addEventListener('click', () => { banner.hidden = false; $('[data-consent]', banner)?.focus(); });
  function updateClock() { const now = new Date(); const clock = $('#london-clock'); if (clock) { clock.textContent = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' }).format(now); clock.dateTime = now.toISOString(); } }
  updateClock(); setInterval(updateClock, 60000);
  let toastTimer;
  function toast(message) { const el = $('.toast'); el.textContent = message; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => { el.hidden = true; }, 9000); }

  // A front-end-only form cannot promise delivery. Prepare a reviewable mailto draft.
  const form = $('#quote-form');
  if (form) {
    const service = new URLSearchParams(location.search).get('service');
    if ([...$('#service').options].some(o => o.value === service)) $('#service').value = service;
    const labels = { name: 'Full name', email: 'Email address', phone: 'Phone number', postcode: 'Postcode / borough', service: 'Service type', description: 'Project description' };
    function errorFor(input) {
      const value = input.value.trim(); if (!value) return `Enter ${labels[input.id].toLowerCase()}.`;
      if (input.id === 'email' && !input.validity.valid) return 'Enter a valid email address.';
      if (input.id === 'phone') {
        const normal = value.replace(/[\s().-]/g, '').replace(/^0044/, '+44');
        if (!/^(?:0[1-9]\d{9}|\+44[1-9]\d{9})$/.test(normal)) return 'Enter a UK number, such as 07815 710630 or +44 7815 710630.';
      }
      if (input.id === 'description' && value.length < 20) return 'Please add at least 20 characters about your project.';
      return '';
    }
    Object.keys(labels).forEach(id => $('#' + id).addEventListener('input', () => {
      const input = $('#' + id); if (input.getAttribute('aria-invalid') === 'true') { const message = errorFor(input); $('#' + id + '-error').textContent = message; input.setAttribute('aria-invalid', String(!!message)); }
      $('#email-fallback').hidden = true;
    }));
    form.addEventListener('submit', e => {
      e.preventDefault(); const errors = [];
      Object.keys(labels).forEach(id => { const input = $('#' + id), message = errorFor(input); input.setAttribute('aria-invalid', String(!!message)); $('#' + id + '-error').textContent = message; if (message) errors.push([id, message]); });
      const summary = $('#form-errors'); summary.replaceChildren(); summary.hidden = errors.length === 0;
      if (errors.length) {
        const title = document.createElement('p'); title.textContent = 'Please check the following fields:'; summary.append(title);
        const list = document.createElement('ul'); errors.forEach(([id, message]) => { const li = document.createElement('li'), a = document.createElement('a'); a.href = '#' + id; a.textContent = message; a.addEventListener('click', () => $('#' + id).focus()); li.append(a); list.append(li); }); summary.append(list); summary.focus(); return;
      }
      const data = new FormData(form);
      const body = `Hello Vaildo,\n\nI would like to discuss a free survey.\n\nName: ${data.get('name')}\nEmail: ${data.get('email')}\nPhone: ${data.get('phone')}\nPostcode / borough: ${data.get('postcode')}\nService: ${data.get('service')}\nBudget: ${data.get('budget')}\nTimeline: ${data.get('timeline')}\n\nProject details:\n${data.get('description')}\n`;
      const url = `mailto:vava_london@hotmail.com?subject=${encodeURIComponent('VFC project enquiry — ' + data.get('service'))}&body=${encodeURIComponent(body)}`;
      $('#email-preview').value = body; $('#email-draft').href = url; $('#email-fallback').hidden = false;
      toast('Your enquiry is ready. Review and send it in your email app. Nothing has been sent yet.');
      location.href = url;
    });
    $('#copy-enquiry').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText($('#email-preview').value); toast('Enquiry copied. Paste it into an email to vava_london@hotmail.com.'); }
      catch { $('#email-preview').focus(); $('#email-preview').select(); toast('Select and copy the enquiry text, then paste it into your email.'); }
    });
  }
})();
