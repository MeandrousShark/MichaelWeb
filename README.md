# MichaelWeb
personal website of myself thanks

Static site, served by GitHub Pages at hannonpiano.com. No build step. `styles.css`
imports the section stylesheets in order.

## Contact form

`contact.html` posts to a small self-hosted handler at `contact.hannonpiano.com`
(source: `../hannonpiano-form`), which verifies an ALTCHA proof-of-work and relays
the message to email. GitHub Pages can't run server code, hence the separate service.

- `vendor/altcha.min.js` is the widget, vendored rather than loaded from a CDN so the
  page pulls no third-party JavaScript. Workers are inlined in that file.
- The form needs JavaScript for the proof-of-work; `<noscript>` hides it and shows
  the email address instead.
- `contact.js` points at `127.0.0.1:8099` when served from localhost, so the form can
  be tested against a locally running handler.
