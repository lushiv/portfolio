(function () {
  'use strict';

  var calendar = document.querySelector('[data-github-activity]');
  if (!calendar) {
    return;
  }

  var total = calendar.querySelector('[data-contribution-total]');
  var chart = calendar.querySelector('[data-contribution-calendar]');
  var yearButtons = Array.prototype.slice.call(calendar.querySelectorAll('[data-contribution-year]'));
  var profileLink = calendar.querySelector('[data-contribution-profile]');
  var cache = Object.create(null);
  var selectedYear = '2026';
  var namespace = 'http://www.w3.org/2000/svg';
  var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var levelColors = ['#e9e5dc', '#d1dfc6', '#a5c58f', '#6f9b5d', '#386b3d'];

  function makeSvgElement(name, attributes, text) {
    var element = document.createElementNS(namespace, name);
    Object.keys(attributes || {}).forEach(function (key) {
      element.setAttribute(key, attributes[key]);
    });
    if (text) {
      element.textContent = text;
    }
    return element;
  }

  function setMessage(message) {
    chart.replaceChildren();
    var paragraph = document.createElement('p');
    paragraph.className = 'github-calendar-message';
    paragraph.textContent = message;
    chart.appendChild(paragraph);
  }

  function fetchYear(year) {
    if (!cache[year]) {
      cache[year] = fetch('https://github-contributions-api.jogruber.de/v4/lushiv?y=' + encodeURIComponent(year))
        .then(function (response) {
          if (!response.ok) {
            throw new Error('Contribution service returned HTTP ' + response.status + '.');
          }
          return response.json();
        })
        .then(function (data) {
          if (!data || !Array.isArray(data.contributions) || !data.total || !Number.isFinite(data.total[year])) {
            throw new Error('Contribution service returned an invalid calendar for ' + year + '.');
          }
          return data;
        })
        .catch(function (error) {
          delete cache[year];
          throw error;
        });
    }
    return cache[year];
  }

  function renderCalendar(year, data) {
    var days = data.contributions;
    var firstDate = new Date(Date.UTC(Number(year), 0, 1));
    var leadingDays = firstDate.getUTCDay();
    var weekCount = Math.ceil((leadingDays + days.length) / 7);
    var labelWidth = 30;
    var cell = 10;
    var gap = 3;
    var step = cell + gap;
    var top = 20;
    var width = labelWidth + weekCount * step;
    var height = top + 7 * step;
    var svg = makeSvgElement('svg', {
      class: 'github-calendar-svg',
      viewBox: '0 0 ' + width + ' ' + height,
      width: width,
      height: height,
      role: 'img',
      'aria-label': 'GitHub contribution calendar for ' + year
    });
    var monthsDrawn = Object.create(null);

    days.forEach(function (day, index) {
      var date = new Date(day.date + 'T00:00:00Z');
      var offset = leadingDays + index;
      var week = Math.floor(offset / 7);
      var weekday = offset % 7;
      var level = Math.max(0, Math.min(4, Number(day.level) || 0));
      var count = Number(day.count) || 0;

      if (date.getUTCDate() === 1 && !monthsDrawn[date.getUTCMonth()]) {
        var monthIndex = date.getUTCMonth();
        svg.appendChild(makeSvgElement('text', {
          x: labelWidth + week * step,
          y: 10,
          class: 'github-calendar-month'
        }, monthNames[monthIndex]));
        monthsDrawn[monthIndex] = true;
      }

      var rect = makeSvgElement('rect', {
        x: labelWidth + week * step,
        y: top + weekday * step,
        width: cell,
        height: cell,
        rx: 2,
        fill: levelColors[level],
        class: 'github-calendar-day',
        'data-level': level,
        'aria-label': day.date + ': ' + count + (count === 1 ? ' contribution' : ' contributions')
      });
      rect.appendChild(makeSvgElement('title', {}, day.date + ': ' + count + (count === 1 ? ' contribution' : ' contributions')));
      svg.appendChild(rect);
    });

    ['Mon', 'Wed', 'Fri'].forEach(function (label, index) {
      var row = index * 2 + 1;
      svg.appendChild(makeSvgElement('text', {
        x: 0,
        y: top + row * step + 8,
        class: 'github-calendar-weekday'
      }, label));
    });

    chart.replaceChildren(svg);
    chart.setAttribute('aria-busy', 'false');
    total.textContent = Number(data.total[year]).toLocaleString() + ' contributions in ' + year;
  }

  function updateProfileLink(year) {
    if (profileLink) {
      profileLink.href = 'https://github.com/users/lushiv/contributions?from=' + year + '-01-01&to=' + year + '-12-31';
    }
  }

  function selectYear(year) {
    selectedYear = year;
    updateProfileLink(year);
    yearButtons.forEach(function (button) {
      var selected = button.getAttribute('data-contribution-year') === year;
      button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    });

    chart.setAttribute('aria-busy', 'true');
    total.textContent = 'Loading contributions for ' + year + '…';
    setMessage('Loading the ' + year + ' contribution calendar…');

    fetchYear(year)
      .then(function (data) {
        if (selectedYear === year) {
          renderCalendar(year, data);
        }
      })
      .catch(function (error) {
        if (selectedYear === year) {
          chart.setAttribute('aria-busy', 'false');
          total.textContent = 'Contribution calendar unavailable for ' + year + '.';
          setMessage(error.message + ' You can still view the year on GitHub using the profile link below.');
        }
      });
  }

  yearButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      selectYear(button.getAttribute('data-contribution-year'));
    });
  });

  selectYear(selectedYear);
})();
