/* Contact form: proof-of-work verification, then submit via fetch with the
   native form POST as the fallback if anything here fails to run. */
(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const widget = document.getElementById('altcha');
  const button = document.getElementById('submit-btn');
  const status = document.getElementById('form-status');
  const startedAt = document.getElementById('started_at');

  // Used server-side to reject submissions filled faster than a human could.
  if (startedAt) startedAt.value = String(Date.now());

  // Served locally, talk to a locally running handler. The HTML keeps the
  // production endpoint so the no-JS path still points somewhere real.
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  if (local) {
    const endpoint = 'http://127.0.0.1:8099';
    form.action = `${endpoint}/submit`;
    widget.setAttribute('challenge', `${endpoint}/altcha/challenge`);
  }

  // Service links from the home page arrive as ?about=lessons|event|collab.
  const about = new URLSearchParams(location.search).get('about');
  if (about) {
    const preselect = form.querySelector(`input[name="service"][value="${CSS.escape(about)}"]`);
    if (preselect) preselect.checked = true;
  }

  // A rejected submission bounces back here with the reason in the query string.
  const bounced = new URLSearchParams(location.search).get('error');
  if (bounced) setStatus(bounced, 'error');

  /* The lessons-only question is hidden by CSS when it doesn't apply, and a
     hidden required radio would block submission with no visible reason, so
     the requirement follows the visibility. */
  const studentRadios = form.querySelectorAll('input[name="student"]');
  function syncStudentRequired() {
    const lessons = form.querySelector('input[name="service"][value="lessons"]');
    const required = !!(lessons && lessons.checked);
    studentRadios.forEach((radio) => {
      radio.required = required;
      if (!required) radio.checked = false;
    });
  }

  form.querySelectorAll('input[name="service"]').forEach((radio) => {
    radio.addEventListener('change', syncStudentRequired);
  });
  syncStudentRequired();

  function setStatus(message, kind) {
    status.textContent = message;
    status.className = `form-status${kind ? ` form-status-${kind}` : ''}`;
  }

  function setBusy(busy, label) {
    button.disabled = busy;
    button.textContent = busy ? label : 'Send message';
  }

  /* The widget owns the first submit: it blocks it, solves the proof-of-work,
     then calls requestSubmit(), which lands here again with the payload filled
     in. So an empty payload means verification is still in flight. */
  form.addEventListener('submit', async (event) => {
    const payloadInput = form.querySelector('input[name="altcha"]');
    const payload = payloadInput && payloadInput.value;

    if (!payload) {
      setBusy(true, 'Checking…');
      setStatus('Running the spam check, one moment.');
      return;
    }

    event.preventDefault();
    setBusy(true, 'Sending…');
    setStatus('Sending your message.');

    const body = Object.fromEntries(new FormData(form));
    body.altcha = payload;

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        form.reset();
        widget.reset();
        setBusy(false);
        form.classList.add('sent');
        setStatus('Thanks, your message is on its way. I’ll be in touch soon.', 'ok');
        return;
      }

      setBusy(false);
      widget.reset();
      setStatus(data.error || 'Something went wrong. Please email me directly at michael@hannonpiano.com.', 'error');
    } catch {
      setBusy(false);
      widget.reset();
      setStatus(
        'Couldn’t reach the server. Please email me directly at michael@hannonpiano.com.',
        'error',
      );
    }
  });
})();
