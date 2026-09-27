(function () {
  'use strict';

  var main = document.getElementById('main');

  if (!main) {
    return;
  }

  var sections = Array.prototype.slice.call(main.querySelectorAll(':scope > section'));

  if (sections.length < 2) {
    return;
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  var dots = document.createElement('nav');
  dots.id = 'section-dots';
  dots.className = 'section-dots';
  dots.setAttribute('aria-label', 'Section navigation');

  var buttons = sections.map(function (section, index) {
    var heading = section.querySelector('h1, h2');
    var label = section.getAttribute('data-label')
      || (heading ? heading.textContent.trim().replace(/\s+/g, ' ').slice(0, 30) : 'Section ' + (index + 1));

    var button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('data-label', label);
    button.setAttribute('aria-label', 'Go to ' + label);

    button.addEventListener('click', function () {
      section.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start'
      });
    });

    dots.appendChild(button);
    return button;
  });

  document.body.appendChild(dots);

  var queued = false;

  function render() {
    queued = false;

    var line = window.innerHeight * 0.4;
    var index = 0;

    for (var i = 0; i < sections.length; i += 1) {
      if (sections[i].getBoundingClientRect().top <= line) {
        index = i;
      }
    }

    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) {
      index = sections.length - 1;
    }

    buttons.forEach(function (button, i) {
      if (i === index) {
        button.classList.add('on');
        button.setAttribute('aria-current', 'true');
      } else {
        button.classList.remove('on');
        button.removeAttribute('aria-current');
      }
    });
  }

  function schedule() {
    if (queued) {
      return;
    }
    queued = true;
    window.requestAnimationFrame(render);
  }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);

  render();
})();
