document.addEventListener('DOMContentLoaded', () => {
  /* ---------- interactive neural network background (whole page) ---------- */
  const canvas = document.getElementById('net-bg');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let neurons = [];
    let pulses = [];
    let mouse = { x: null, y: null };
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* theme-aware colors (reads --color-cyan / --color-amber) */
    let cyanRGB = '94, 234, 212';
    let amberRGB = '245, 185, 66';

    function hexToRgb(hex) {
      hex = hex.trim().replace('#', '');
      if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
      const n = parseInt(hex, 16);
      return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
    }

    function updateColors() {
      const styles = getComputedStyle(document.documentElement);
      cyanRGB  = hexToRgb(styles.getPropertyValue('--color-cyan'));
      amberRGB = hexToRgb(styles.getPropertyValue('--color-amber'));
    }
    updateColors();
    new MutationObserver(updateColors).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    function resizeCanvas() {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      const count = Math.min(60, Math.floor((canvas.width * canvas.height) / 26000));
      neurons = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        r: 1.5 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
      }));
      pulses = [];
    }

    function maybeSpawnPulse(edges) {
      if (Math.random() < 0.02 && edges.length) {
        const edge = edges[Math.floor(Math.random() * edges.length)];
        pulses.push({ from: edge[0], to: edge[1], t: 0 });
      }
    }

    function drawFrame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      neurons.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        n.phase += 0.02;

        if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;

        if (mouse.x !== null) {
          const dx = n.x - mouse.x;
          const dy = n.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130 && dist > 0) {
            const force = (130 - dist) / 130;
            n.x += (dx / dist) * force * 1.5;
            n.y += (dy / dist) * force * 1.5;
          }
        }
      });

      const edges = [];
      for (let i = 0; i < neurons.length; i++) {
        for (let j = i + 1; j < neurons.length; j++) {
          const dx = neurons[i].x - neurons[j].x;
          const dy = neurons[i].y - neurons[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            ctx.strokeStyle = `rgba(${cyanRGB}, ${0.5 - dist / 320})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(neurons[i].x, neurons[i].y);
            ctx.lineTo(neurons[j].x, neurons[j].y);
            ctx.stroke();
            edges.push([neurons[i], neurons[j]]);
          }
        }
      }

      neurons.forEach(n => {
        const glow = 3 + Math.sin(n.phase) * 1.5;
        const gradient = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r + glow * 3);
        gradient.addColorStop(0, `rgba(${cyanRGB}, 0.9)`);
        gradient.addColorStop(1, `rgba(${cyanRGB}, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + glow * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgb(${cyanRGB})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      });

      maybeSpawnPulse(edges);
      pulses = pulses.filter(p => p.t < 1);
      pulses.forEach(p => {
        p.t += 0.02;
        const x = p.from.x + (p.to.x - p.from.x) * p.t;
        const y = p.from.y + (p.to.y - p.from.y) * p.t;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, 6);
        gradient.addColorStop(0, `rgba(${amberRGB}, 0.95)`);
        gradient.addColorStop(1, `rgba(${amberRGB}, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgb(${amberRGB})`;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      if (!reduceMotion) requestAnimationFrame(drawFrame);
    }

    resizeCanvas();
    drawFrame();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resizeCanvas, 150);
    });

    /* mouse repel works anywhere on the page (canvas is fixed, so no scroll offset) */
    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    });
    document.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });
  }
  /* ---------- theme toggle ---------- */
  const themeToggle = document.getElementById('theme-toggle');
  const htmlEl = document.documentElement;

  function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}
  }

  let savedTheme = 'dark';
  try { savedTheme = localStorage.getItem('theme') || 'dark'; } catch (e) {}
  applyTheme(savedTheme);

  themeToggle.addEventListener('click', () => {
    const current = htmlEl.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
  /* ---------- mobile menu ---------- */
  const menuBtn    = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const iconOpen   = document.getElementById('icon-open');
  const iconClose  = document.getElementById('icon-close');

  menuBtn.addEventListener('click', () => {
    const isHidden = mobileMenu.classList.contains('hidden');
    mobileMenu.classList.toggle('hidden');
    iconOpen.classList.toggle('hidden', isHidden);
    iconClose.classList.toggle('hidden', !isHidden);
  });

  document.querySelectorAll('#mobile-menu a[data-nav]').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      iconOpen.classList.remove('hidden');
      iconClose.classList.add('hidden');
    });
  });
/* ---------- resume lightbox ---------- */
const resumeBtn   = document.getElementById('resume-btn');
const resumeModal = document.getElementById('resume-modal');
const resumeClose = document.getElementById('resume-close');

if (resumeBtn && resumeModal) {
  const openResume = () => {
    resumeModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };
  const closeResume = () => {
    resumeModal.classList.add('hidden');
    document.body.style.overflow = '';
  };

  resumeBtn.addEventListener('click', openResume);
  resumeClose.addEventListener('click', closeResume);
  resumeModal.querySelector('.cert-modal-backdrop').addEventListener('click', closeResume);

  document.addEventListener('keydown', (e) => {
    if (resumeModal.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeResume();
  });
}

  /* ---------- typing effect ---------- */
  const roles = [
    'Web Development',
    'AI / ML Researcher',
  ];
  const typedEl = document.getElementById('typed');
  let roleIndex = 0, charIndex = 0, deleting = false;

  function typeLoop() {
    const current = roles[roleIndex];
    if (!deleting) {
      charIndex++;
      typedEl.textContent = current.slice(0, charIndex);
      if (charIndex === current.length) {
        deleting = true;
        setTimeout(typeLoop, 1400);
        return;
      }
    } else {
      charIndex--;
      typedEl.textContent = current.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
      }
    }
    setTimeout(typeLoop, deleting ? 40 : 80);
  }
  typeLoop();

  /* ---------- scan progress bar (page scroll) ---------- */
  const scanBar = document.getElementById('scan-bar');
  function updateScanBar() {
    const scrollTop   = window.scrollY;
    const docHeight   = document.documentElement.scrollHeight - window.innerHeight;
    const pct         = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scanBar.style.width = pct + '%';
  }
  window.addEventListener('scroll', updateScanBar, { passive: true });
  updateScanBar();

  /* ---------- scroll-spy nav highlighting ---------- */
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('a[data-nav]');

  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle('active-link', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { rootMargin: '-45% 0px -45% 0px' });

  sections.forEach(section => spyObserver.observe(section));

  /* ---------- back to top ---------- */
  const backToTop = document.getElementById('back-to-top');
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('show', window.scrollY > 500);
  }, { passive: true });

  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const aboutSection = document.getElementById('about');
if (aboutSection) {
  const skillRows = [...aboutSection.querySelectorAll('.skill-fill')]
    .map(fill => fill.parentElement.parentElement);

  skillRows.forEach(row => {
    row.classList.add('skill-item');

    row.addEventListener('click', () => {
      const wasActive = row.classList.contains('is-active');
      skillRows.forEach(r => r.classList.remove('is-active'));
      if (!wasActive) row.classList.add('is-active');
    });
  });

  const skillsLabel = aboutSection.querySelector('div.font-mono.text-xs.text-cyan');
  if (skillsLabel) skillsLabel.classList.add('skills-label');
}
  /* ---------- reveal-on-scroll ---------- */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ---------- animated counters ---------- */
  const counters = document.querySelectorAll('.counter');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.target, 10);
      let current  = 0;
      const step   = Math.max(1, Math.ceil(target / 30));

      const interval = setInterval(() => {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(interval);
        }
        el.textContent = current;
      }, 40);

      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => counterObserver.observe(el));

  /* ---------- animated skill proficiency bars ---------- */
  const skillFills = document.querySelectorAll('.skill-fill');
  const skillObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.style.width = el.dataset.width + '%';
        skillObserver.unobserve(el);
      }
    });
  }, { threshold: 0.3 });

  skillFills.forEach(el => skillObserver.observe(el));

  /* ---------- project filtering ---------- */
  const filterBtns   = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  const noResults    = document.getElementById('no-results');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active-filter'));
      btn.classList.add('active-filter');

      const filter = btn.dataset.filter;
      let visibleCount = 0;

      projectCards.forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('hidden-card', !match);
        if (match) visibleCount++;
      });

      noResults.classList.toggle('hidden', visibleCount !== 0);
    });
  });
/* ---------- certificate lightbox ---------- */
const certBtns     = document.querySelectorAll('.cert-view-btn');
const certModal    = document.getElementById('cert-modal');
const certImg      = document.getElementById('cert-modal-img');
const certCaption  = document.getElementById('cert-modal-caption');
const certClose    = document.getElementById('cert-close');
const certPrev     = document.getElementById('cert-prev');
const certNext     = document.getElementById('cert-next');

if (certBtns.length && certModal) {
  const certList = [...certBtns].map(btn => ({
    src: btn.dataset.src,
    title: btn.dataset.title
  }));
  let certIndex = 0;

  function openCert(index) {
    certIndex = (index + certList.length) % certList.length;
    certImg.src = certList[certIndex].src;
    certImg.alt = certList[certIndex].title;
    certCaption.textContent = certList[certIndex].title;
    certModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeCert() {
    certModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  certBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => openCert(i));
  });

  certClose.addEventListener('click', closeCert);
  certModal.querySelector('.cert-modal-backdrop').addEventListener('click', closeCert);
  certPrev.addEventListener('click', () => openCert(certIndex - 1));
  certNext.addEventListener('click', () => openCert(certIndex + 1));

  document.addEventListener('keydown', (e) => {
    if (certModal.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeCert();
    if (e.key === 'ArrowLeft') openCert(certIndex - 1);
    if (e.key === 'ArrowRight') openCert(certIndex + 1);
  });
}
  /* ---------- contact form validation + submission (Forminit) ---------- */
  const form       = document.getElementById('contact-form');
  const nameField  = document.getElementById('field-name');
  const emailField = document.getElementById('field-email');
  const msgField   = document.getElementById('field-message');
  const formStatus = document.getElementById('form-status');
  const submitBtn  = document.getElementById('submit-btn');

  const forminit = new Forminit();
  const FORM_ID  = '5i85tr4raun';

  function showFieldError(field, isValid) {
    field.classList.toggle('field-invalid', !isValid);
    const errorEl = field.parentElement.querySelector('.field-error');
    errorEl.classList.toggle('hidden', isValid);
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const nameValid  = nameField.value.trim().length > 0;
    const emailValid = isValidEmail(emailField.value.trim());
    const msgValid   = msgField.value.trim().length > 0;

    showFieldError(nameField, nameValid);
    showFieldError(emailField, emailValid);
    showFieldError(msgField, msgValid);

    if (!nameValid || !emailValid || !msgValid) {
      formStatus.classList.add('hidden');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'sending...';

    const formData = new FormData(form);
    const { error } = await forminit.submit(FORM_ID, formData);

    if (error) {
      formStatus.textContent = error.message || 'something went wrong — please email me directly.';
      formStatus.classList.remove('hidden');
    } else {
      formStatus.textContent = 'message sent — thank you!';
      formStatus.classList.remove('hidden');
      form.reset();
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'send';
  });

   [nameField, emailField, msgField].forEach(field => {
    field.addEventListener('input', () => {
      field.classList.remove('field-invalid');
      field.parentElement.querySelector('.field-error').classList.add('hidden');
    });
  });

  /* ---------- scroll pop-up effect ---------- */
  const popTargets = document.querySelectorAll(
    'section h2, .edu-card, .project-card, .achievement-row, .cert-row, ' +
    '.contact-info-box, .contact-form-box, #about .reveal, #filters, footer > div'
  );

  const popObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('pop-in');
        popObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  popTargets.forEach((el) => {
    el.classList.add('pop');
    const index = [...el.parentElement.children].indexOf(el);
    const isMobile = window.innerWidth < 768;
    el.style.animationDelay = isMobile ? '0s' : `${(index % 3) * 0.12}s`;
    popObserver.observe(el);
  });

});