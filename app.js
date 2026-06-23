// ===========================================================
// Loads content.json and renders the current page.
// Edit content.json to change copy — never edit this file for content changes.
// ===========================================================

async function loadContent() {
  try {
    const res = await fetch('content.json');
    if (!res.ok) throw new Error('content.json fetch failed: ' + res.status);
    return await res.json();
  } catch (err) {
    // Sandboxed previews (file:// or restricted iframe) can block fetch()
    // of a sibling file. Fall back to the embedded copy so the preview
    // never breaks. On GitHub Pages the fetch() above succeeds and this
    // fallback is never used — edit content.json there, not this file.
    console.warn('fetch(content.json) failed, using inline fallback:', err.message);
    if (window.__FALLBACK_CONTENT__) return window.__FALLBACK_CONTENT__;
    document.body.innerHTML = '<p style="padding:60px;font-family:monospace;color:#fff;background:#070d09;">Failed to load content.json and no fallback present — check console.</p>';
    throw err;
  }
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  children.flat().forEach(c => {
    if (c == null) return;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return node;
}

function buildImageBlock(cs) {
  if (cs.image && cs.image.trim() !== '') {
    return el('div', { class: 'case-image-placeholder' },
      el('img', { src: cs.image, alt: `Illustrative mockup for ${cs.title}` })
    );
  }
  return el('div', { class: 'case-image-placeholder' },
    el('div', { class: 'ph-icon' }, '🖼'),
    el('div', { class: 'ph-label' }, `add image: set the "image" field for "${cs.id}" in content.json`)
  );
}

// -----------------------------------------------------------
// SHARED: nav, footer
// -----------------------------------------------------------
function setupNav() {
  const toggle = document.getElementById('navToggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => links.classList.toggle('open'));
  links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => links.classList.remove('open')));
}

function renderFooter(data) {
  const copyright = document.getElementById('footerCopyright');
  const location = document.getElementById('footerLocation');
  if (copyright) copyright.textContent = `© ${new Date().getFullYear()} ${data.meta.name}`;
  if (location) location.textContent = data.meta.location;
}

// -----------------------------------------------------------
// HOMEPAGE renderers
// -----------------------------------------------------------
function renderHero(data) {
  const kicker = document.getElementById('heroKicker');
  if (!kicker) return;
  kicker.textContent = data.hero.kicker;
  document.getElementById('heroHeadline').textContent = data.hero.headline;
  document.getElementById('heroRoleLine').textContent = data.hero.role_line;

  // bold key phrases in subtext: wrap "7+ years..." / "4 years..." style fragments
  const sub = document.getElementById('heroSub');
  sub.innerHTML = '';
  sub.appendChild(document.createTextNode(data.hero.subtext));

  const cvLinkEl = document.getElementById('cvLink');
  const cvHref = data.meta.cv_pdf || '#';
  cvLinkEl.setAttribute('href', cvHref);
  if (cvHref && cvHref !== '#') {
    // open in new tab and use download for same-origin/local files
    cvLinkEl.setAttribute('target', '_blank');
    cvLinkEl.setAttribute('rel', 'noopener');
    if (!/^https?:\/\//i.test(cvHref)) cvLinkEl.setAttribute('download', '');
  } else {
    cvLinkEl.removeAttribute('target');
    cvLinkEl.removeAttribute('rel');
    cvLinkEl.removeAttribute('download');
  }

  const stack = document.getElementById('heroStack');
  stack.innerHTML = '';
  data.hero.stack_line.forEach(row => {
    stack.appendChild(
      el('div', { class: 'stack-row' },
        el('span', { class: 'stack-key' }, row.key),
        el('span', { class: 'stack-arrow' }, '→'),
        row.value
      )
    );
  });
}

function renderSignal(data) {
  const statsGrid = document.getElementById('statsGrid');
  if (!statsGrid) return;
  statsGrid.innerHTML = '';
  data.stats.forEach(s => {
    statsGrid.appendChild(
      el('div', { class: 'stat-item' },
        el('div', { class: 'stat-value' }, s.value),
        el('div', { class: 'stat-label' }, s.label)
      )
    );
  });

  const capGrid = document.getElementById('capabilitiesGrid');
  capGrid.innerHTML = '';
  data.capabilities.forEach(c => {
    capGrid.appendChild(
      el('div', { class: 'capability-card' },
        el('div', { class: 'capability-meta' },
          el('span', { class: 'capability-num mono' }, c.num),
          el('span', { class: 'capability-tag' }, c.tag)
        ),
        el('div', { class: 'capability-title' }, c.title),
        el('div', { class: 'capability-description' }, c.description)
      )
    );
  });
}

function renderCaseGrid(data) {
  const grid = document.getElementById('caseGrid');
  if (!grid) return;
  grid.innerHTML = '';
  data.case_studies.forEach(cs => {
    const card = el('a', { class: 'case-card', href: `case-study.html?case=${cs.id}` },
      buildImageBlock(cs),
      el('div', { class: 'case-card-body' },
        el('span', { class: 'case-tag' }, cs.tag),
        el('h3', { class: 'case-title' }, cs.title),
        el('div', { class: 'case-meta' }, `${cs.company} · ${cs.period}`),
        el('p', { class: 'case-summary' }, cs.summary),
        el('span', { class: 'case-expand' }, 'Read case study →')
      )
    );
    grid.appendChild(card);
  });
}

function renderLog(data) {
  const list = document.getElementById('logList');
  if (!list) return;
  list.innerHTML = '';
  data.experience.forEach(exp => {
    const entry = el('div', { class: 'log-entry' },
      el('div', { class: 'log-meta' },
        el('div', { class: 'log-period' }, exp.period),
        el('span', { class: 'log-tag' }, exp.tag || '')
      ),
      el('div', {},
        el('div', { class: 'log-role' }, exp.role),
        el('div', { class: 'log-company' }, exp.company),
        ...(exp.diff_remove || []).map(line => el('div', { class: 'log-bullet' }, '✕ ' + line)),
        ...(exp.diff_add || []).map(line => el('div', { class: 'log-bullet' }, line))
      )
    );
    list.appendChild(entry);
  });
}

function renderToolkit(data) {
  const grid = document.getElementById('toolkitGrid');
  if (!grid) return;
  grid.innerHTML = '';
  Object.entries(data.toolkit).forEach(([group, tags]) => {
    grid.appendChild(
      el('div', { class: 'toolkit-group' },
        el('div', { class: 'toolkit-group-title' }, group.toUpperCase()),
        el('div', { class: 'toolkit-tags' }, ...tags.map(t => el('span', { class: 'toolkit-tag' }, t)))
      )
    );
  });
}

function renderBackground(data) {
  const grid = document.getElementById('backgroundGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const bg = data.background;

  const leftCol = el('div', {},
    el('div', { class: 'bg-subsection-title' }, 'EDUCATION'),
    ...bg.education.map(e =>
      el('div', { class: 'bg-item' },
        el('div', { class: 'bg-item-year' }, e.period),
        el('div', { class: 'bg-item-title' }, e.degree),
        el('div', { class: 'bg-item-meta' }, e.institution),
        e.note ? el('div', { class: 'bg-item-note' }, e.note) : null
      )
    ),
    el('div', { class: 'bg-subsection-title' }, 'PUBLICATIONS'),
    ...bg.publications.map(p =>
      el('div', { class: 'bg-item bg-publication' },
        el('div', { class: 'bg-item-title' }, p.title),
        el('div', { class: 'bg-item-meta' }, `${p.venue} · ${p.year}`),
        el('a', { href: p.url, target: '_blank', rel: 'noopener' }, p.url + ' ↗')
      )
    )
  );

  const rightCol = el('div', {},
    el('div', { class: 'bg-subsection-title' }, 'CERTIFICATIONS'),
    ...bg.certifications.map(c =>
      el('div', { class: 'bg-item' },
        el('div', { class: 'bg-item-year' }, c.year),
        el('div', { class: 'bg-item-title' }, c.url ? el('a', { href: c.url, target: '_blank', rel: 'noopener' }, c.title + ' ↗') : c.title),
        el('div', { class: 'bg-item-meta' }, c.issuer)
      )
    ),
    el('div', { class: 'bg-subsection-title' }, 'HONOURS & VOLUNTEERING'),
    ...bg.honours.map(h =>
      el('div', { class: 'bg-item' },
        el('div', { class: 'bg-item-year' }, h.year),
        el('div', { class: 'bg-item-title' }, h.title),
        el('div', { class: 'bg-item-meta' }, h.issuer)
      )
    ),
    ...bg.volunteering.map(v =>
      el('div', { class: 'bg-item' },
        el('div', { class: 'bg-item-year' }, v.year),
        el('div', { class: 'bg-item-title' }, v.title),
        el('div', { class: 'bg-item-meta' }, v.issuer)
      )
    )
  );

  grid.appendChild(leftCol);
  grid.appendChild(rightCol);
}

function renderServices(data) {
  const grid = document.getElementById('servicesGrid');
  if (!grid) return;
  grid.innerHTML = '';
  data.services.forEach(s => {
    grid.appendChild(
      el('div', { class: 'service-card' },
        el('div', { class: 'service-title' }, s.title),
        el('div', { class: 'service-description' }, s.description)
      )
    );
  });
}

function renderContact(data) {
  const cta = document.getElementById('contactCta');
  if (!cta) return;
  cta.textContent = data.footer.cta;
  const links = document.getElementById('contactLinks');
  links.innerHTML = '';

  const items = [
    { label: 'EMAIL', value: data.meta.email, href: `mailto:${data.meta.email}` },
    { label: 'WHATSAPP', value: data.meta.whatsapp.replace('https://wa.me/', '+'), href: data.meta.whatsapp },
    { label: 'LINKEDIN', value: '/in/' + data.meta.linkedin.split('/').filter(Boolean).pop(), href: data.meta.linkedin },
    { label: 'RESUME', value: 'Download CV (PDF) ↓', href: data.meta.cv_pdf || '#' }
  ];
  items.forEach(item => {
    const isExternal = /^https?:\/\//i.test(item.href);
    const aAttrs = { class: 'contact-link', href: item.href };
    // always open links in a new tab for better UX
    aAttrs.target = '_blank';
    aAttrs.rel = 'noopener';
    // add download attribute for local PDF files
    if (!isExternal && item.href && item.href !== '#') aAttrs.download = '';

    links.appendChild(
      el('a', aAttrs,
        el('div', { class: 'contact-link-label' }, item.label),
        el('div', { class: 'contact-link-value' }, item.value)
      )
    );
  });
}

// -----------------------------------------------------------
// CASE STUDY DETAIL PAGE renderer
// -----------------------------------------------------------
function renderCaseDetail(data) {
  const root = document.getElementById('caseDetailRoot');
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get('case');
  const list = data.case_studies;
  const idx = list.findIndex(cs => cs.id === slug);

  if (idx === -1) {
    root.innerHTML = '';
    root.appendChild(
      el('div', {},
        el('a', { href: 'index.html#cases', class: 'case-detail-back' }, '← Back to all case studies'),
        el('h1', {}, 'Case study not found'),
        el('p', { class: 'case-detail-meta' }, `No case study matches "${slug || '(none)'}" — check the URL or go back to the case studies list.`)
      )
    );
    return;
  }

  const cs = list[idx];
  const prev = list[(idx - 1 + list.length) % list.length];
  const next = list[(idx + 1) % list.length];

  document.title = `${cs.title} — Muhammad Mushfiqur Rahman`;

  root.innerHTML = '';
  root.appendChild(
    el('div', {},
      el('a', { href: 'index.html#cases', class: 'case-detail-back' }, '← Back to all case studies'),
      el('span', { class: 'case-tag' }, cs.tag),
      el('h1', {}, cs.title),
      el('p', { class: 'case-detail-meta' }, `${cs.company} · ${cs.period} · ${cs.industry}`),

      buildImageBlock(cs),
      el('p', { class: 'case-image-caption' }, 'Illustrative recreation — not an actual product screenshot.'),

      el('p', { class: 'case-detail-section-label' }, 'PROBLEM'),
      el('ul', { class: 'detail-list' }, ...cs.problem.map(p => el('li', {}, p))),

      el('p', { class: 'case-detail-section-label' }, 'SOLUTION'),
      el('ul', { class: 'detail-list' }, ...cs.solution.map(s => el('li', {}, s))),

      el('p', { class: 'case-detail-section-label' }, 'IMPACT'),
      el('div', { class: 'impact-row' },
        ...cs.impact.map(i =>
          el('div', { class: 'impact-stat' },
            el('div', { class: 'impact-value' }, i.value),
            el('div', { class: 'impact-label' }, i.label)
          )
        )
      ),

      el('p', { class: 'case-detail-section-label' }, 'TOOLS & SKILLS'),
      el('div', { class: 'detail-tags' }, ...cs.tools.map(t => el('span', { class: 'detail-tag' }, t))),

      el('div', { class: 'case-nav' },
        el('a', { href: `case-study.html?case=${prev.id}`, class: 'case-nav-link prev' },
          el('span', { class: 'nav-direction' }, '← PREVIOUS'),
          el('span', {}, prev.title)
        ),
        el('a', { href: `case-study.html?case=${next.id}`, class: 'case-nav-link next' },
          el('span', { class: 'nav-direction' }, 'NEXT →'),
          el('span', {}, next.title)
        )
      )
    )
  );
}

// -----------------------------------------------------------
// INIT — detect which page we're on and render accordingly
// -----------------------------------------------------------
(async function init() {
  const data = await loadContent();

  setupNav();
  renderFooter(data);

  if (document.getElementById('caseDetailRoot')) {
    // case-study.html
    renderCaseDetail(data);
  } else {
    // index.html
    renderHero(data);
    renderSignal(data);
    renderCaseGrid(data);
    renderLog(data);
    renderToolkit(data);
    renderBackground(data);
    renderServices(data);
    renderContact(data);
  }
})();
