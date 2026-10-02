(function () {
  'use strict';

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function setFooterYear() {
    var el = document.getElementById('year');
    if (el) {
      el.textContent = String(new Date().getFullYear());
    }
  }

  function typeInto(target) {
    var lines;
    try {
      lines = JSON.parse(target.getAttribute('data-typed') || '[]');
    } catch (error) {
      return;
    }

    if (!lines.length) {
      return;
    }

    if (prefersReducedMotion()) {
      target.textContent = '\n' + lines.join('\n') + '\n';
      return;
    }

    var text = '\n';
    var lineIndex = 0;
    var charIndex = 0;

    function tick() {
      if (lineIndex >= lines.length) {
        text += '\n';
        target.textContent = text;
        return;
      }

      var line = lines[lineIndex];
      charIndex += 1;
      target.textContent = text + line.slice(0, charIndex);

      if (charIndex >= line.length) {
        text += line + '\n';
        lineIndex += 1;
        charIndex = 0;
        window.setTimeout(tick, 220);
        return;
      }

      window.setTimeout(tick, 28);
    }

    var startDelay = window.innerWidth <= 720 ? 200 : 420;
    window.setTimeout(tick, startDelay);
  }

  function initTerminal() {
    var targets = document.querySelectorAll('[data-typed]');
    Array.prototype.forEach.call(targets, typeInto);
  }

  function initNavToggle() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('primary-nav');
    if (!toggle || !nav) {
      return;
    }

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      nav.classList.toggle('is-open', open);
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        setOpen(false);
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 720) {
        setOpen(false);
      }
    });
  }

  function initScrollSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.primary-nav a[href^="#"]'));
    var sections = links
      .map(function (link) {
        return document.querySelector(link.getAttribute('href'));
      })
      .filter(Boolean);

    if (!sections.length || !('IntersectionObserver' in window)) {
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }
          links.forEach(function (link) {
            var active = link.getAttribute('href') === '#' + entry.target.id;
            if (active) {
              link.setAttribute('aria-current', 'true');
            } else {
              link.removeAttribute('aria-current');
            }
          });
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  function initLab() {
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-lab]'));
    var box = document.getElementById('lightbox');
    if (!items.length || !box) {
      return;
    }

    var stage = box.querySelector('[data-lab-stage]');
    var counter = box.querySelector('[data-lab-count]');
    var index = 0;
    var lastFocus = null;

    function render() {
      var item = items[index];
      var src = item.getAttribute('data-src');
      var type = item.getAttribute('data-type');
      stage.innerHTML = '';

      if (type === 'video') {
        var video = document.createElement('video');
        video.src = src;
        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;
        video.setAttribute('aria-label', 'Lab video');
        stage.appendChild(video);
      } else {
        var img = document.createElement('img');
        img.src = src;
        img.alt = item.querySelector('img').alt + ', full size';
        stage.appendChild(img);
      }

      counter.textContent = (index + 1) + ' / ' + items.length;
    }

    function open(i) {
      index = i;
      render();
      lastFocus = document.activeElement;
      box.hidden = false;
      document.body.style.overflow = 'hidden';
      box.querySelector('[data-lab-close]').focus();
    }

    function close() {
      box.hidden = true;
      stage.innerHTML = '';
      document.body.style.overflow = '';
      if (lastFocus) {
        lastFocus.focus();
      }
    }

    function step(delta) {
      index = (index + delta + items.length) % items.length;
      render();
    }

    items.forEach(function (item, i) {
      item.addEventListener('click', function () {
        open(i);
      });
    });

    box.querySelector('[data-lab-close]').addEventListener('click', close);
    box.querySelector('[data-lab-prev]').addEventListener('click', function () { step(-1); });
    box.querySelector('[data-lab-next]').addEventListener('click', function () { step(1); });

    box.addEventListener('click', function (event) {
      if (event.target === box || event.target === stage) {
        close();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (box.hidden) {
        return;
      }
      if (event.key === 'Escape') {
        close();
      } else if (event.key === 'ArrowLeft') {
        step(-1);
      } else if (event.key === 'ArrowRight') {
        step(1);
      }
    });
  }

  function initGalaxy() {
    var canvas = document.getElementById('galaxy');
    if (!canvas || !canvas.getContext) {
      return;
    }

    var ctx = canvas.getContext('2d');
    var stars = [];
    var width = 0;
    var height = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var pointer = { x: 0, y: 0 };
    var reduced = prefersReducedMotion();
    var running = true;

    function seed() {
      var density = Math.min(Math.round((width * height) / 9000), 190);
      stars = [];
      for (var i = 0; i < density; i += 1) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z: Math.random() * 0.8 + 0.2,
          r: Math.random() * 1.3 + 0.3,
          drift: Math.random() * 0.16 + 0.02,
          phase: Math.random() * Math.PI * 2,
          bright: Math.random() > 0.72
        });
      }
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function drawNebula(time) {
      var drift = reduced ? 0 : time * 0.00004;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      var a = ctx.createRadialGradient(
        width * (0.22 + Math.sin(drift) * 0.06),
        height * 0.18,
        0,
        width * 0.22,
        height * 0.18,
        Math.max(width, height) * 0.62
      );
      a.addColorStop(0, 'rgba(255, 255, 255, 0.10)');
      a.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = a;
      ctx.fillRect(0, 0, width, height);

      var b = ctx.createRadialGradient(
        width * (0.82 + Math.cos(drift * 1.3) * 0.05),
        height * 0.78,
        0,
        width * 0.82,
        height * 0.78,
        Math.max(width, height) * 0.55
      );
      b.addColorStop(0, 'rgba(255, 255, 255, 0.07)');
      b.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = b;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }

    function render(time) {
      ctx.clearRect(0, 0, width, height);
      drawNebula(time);

      for (var i = 0; i < stars.length; i += 1) {
        var s = stars[i];
        var twinkle = reduced ? 0.75 : 0.55 + Math.sin(time * 0.0012 + s.phase) * 0.45;
        var px = s.x + pointer.x * s.z;
        var py = s.y + pointer.y * s.z;

        ctx.beginPath();
        ctx.arc(px, py, s.r * s.z, 0, Math.PI * 2);
        ctx.fillStyle = s.bright
          ? 'rgba(255, 255, 255,' + (twinkle * 0.9).toFixed(3) + ')'
          : 'rgba(255, 255, 255,' + (twinkle * 0.4).toFixed(3) + ')';
        ctx.fill();
      }
    }

    function step(time) {
      if (!running) {
        return;
      }
      if (!reduced) {
        for (var i = 0; i < stars.length; i += 1) {
          var s = stars[i];
          s.x -= s.drift * s.z;
          if (s.x < -4) {
            s.x = width + 4;
            s.y = Math.random() * height;
          }
        }
      }
      render(time);
      window.requestAnimationFrame(step);
    }

    resize();
    render(0);

    if (!reduced) {
      window.addEventListener('resize', resize);
      window.addEventListener('pointermove', function (event) {
        pointer.x = (event.clientX / width - 0.5) * -16;
        pointer.y = (event.clientY / height - 0.5) * -16;
      });
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
          running = false;
        } else if (!running) {
          running = true;
          window.requestAnimationFrame(step);
        }
      });
      window.requestAnimationFrame(step);
    }
  }

  function initThirdEye() {
    var eye = document.querySelector('[data-third-eye]');
    if (!eye || prefersReducedMotion()) {
      return;
    }

    var started = null;
    var max = 13;

    window.addEventListener(
      'scroll',
      function () {
        var box = eye.getBoundingClientRect();
        if (box.bottom < 0 || box.top > window.innerHeight) {
          return;
        }

        var ratio = (box.top + box.height / 2 - window.innerHeight / 2) / window.innerHeight;
        var shift = Math.max(-max, Math.min(max, ratio * -max));

        if (started === null) {
          started = performance.now();
        }
        eye.style.setProperty('--eye-shift', shift.toFixed(2) + 'px');
      },
      { passive: true }
    );
  }

  function initReveal() {
    var targets = document.querySelectorAll(
      '.section-head, .about-grid > *, .card, .work-card, .spotlight-card, .tl-item, .edu-col, .voice-card, .contact-list'
    );

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    Array.prototype.forEach.call(targets, function (el, index) {
      el.classList.add('reveal');
      el.style.transitionDelay = (index % 3) * 70 + 'ms';
      observer.observe(el);
    });
  }

  setFooterYear();
  initGalaxy();
  initTerminal();
  initThirdEye();
  initNavToggle();
  initScrollSpy();
  initLab();
  initReveal();
})();
