(function () {
  'use strict';

  var calendar = document.querySelector('[data-github-activity]');
  if (!calendar) {
    return;
  }

  var total = calendar.querySelector('[data-contribution-total]');
  var chart = calendar.querySelector('[data-contribution-calendar]');
  var historyChart = calendar.querySelector('[data-contribution-history]');
  var yearButtons = Array.prototype.slice.call(calendar.querySelectorAll('[data-contribution-year]'));
  var profileLink = calendar.querySelector('[data-contribution-profile]');
  var cache = Object.create(null);
  var selectedYear = '2026';
  var namespace = 'http://www.w3.org/2000/svg';
  var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var levelColors = ['#e9e5dc', '#d1dfc6', '#a5c58f', '#6f9b5d', '#386b3d'];
  var historyStartYear = 2019;

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

  function fetchHistory() {
    return fetch('https://github-contributions-api.jogruber.de/v4/lushiv?y=all')
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Contribution service returned HTTP ' + response.status + '.');
        }
        return response.json();
      })
      .then(function (data) {
        if (!data || !Array.isArray(data.contributions) || data.contributions.length === 0) {
          throw new Error('Contribution service returned an invalid activity history.');
        }
        var lastAvailableDate = new Date().toISOString().slice(0, 10);
        return data.contributions
          .filter(function (day) {
            return day.date >= historyStartYear + '-01-01' &&
              day.date <= lastAvailableDate &&
              Number.isFinite(Number(day.count));
          })
          .sort(function (a, b) {
            return a.date.localeCompare(b.date);
          });
      });
  }

  function renderHistory(days) {
    var weekly = [];
    for (var i = 0; i < days.length; i += 7) {
      var slice = days.slice(i, i + 7);
      weekly.push({
        start: slice[0].date,
        end: slice[slice.length - 1].date,
        count: slice.reduce(function (sum, day) {
          return sum + Number(day.count);
        }, 0)
      });
    }

    if (weekly.length < 2) {
      throw new Error('Not enough contribution history to draw the activity graph.');
    }

    var width = 960;
    var height = 250;
    var margin = { top: 20, right: 18, bottom: 34, left: 42 };
    var graphWidth = width - margin.left - margin.right;
    var graphHeight = height - margin.top - margin.bottom;
    var maxCount = Math.max(1, weekly.reduce(function (max, week) {
      return Math.max(max, week.count);
    }, 0));
    var namespace = 'http://www.w3.org/2000/svg';
    var svg = makeSvgElement('svg', {
      class: 'github-history-svg',
      viewBox: '0 0 ' + width + ' ' + height,
      role: 'img',
      'aria-label': 'Weekly GitHub contributions from ' + historyStartYear + ' through ' + weekly[weekly.length - 1].end
    });
    var points = weekly.map(function (week, index) {
      return {
        x: margin.left + (index / (weekly.length - 1)) * graphWidth,
        y: margin.top + graphHeight - (week.count / maxCount) * graphHeight,
        week: week
      };
    });
    var linePath = points.map(function (point, index) {
      return (index === 0 ? 'M' : 'L') + point.x.toFixed(2) + ' ' + point.y.toFixed(2);
    }).join(' ');
    var areaPath = linePath + ' L' + points[points.length - 1].x.toFixed(2) + ' ' +
      (margin.top + graphHeight) + ' L' + points[0].x.toFixed(2) + ' ' +
      (margin.top + graphHeight) + ' Z';

    for (var tick = 0; tick <= 4; tick += 1) {
      var y = margin.top + (tick / 4) * graphHeight;
      var value = Math.round(maxCount * (1 - tick / 4));
      svg.appendChild(makeSvgElement('line', {
        x1: margin.left,
        x2: width - margin.right,
        y1: y,
        y2: y,
        class: 'github-history-gridline'
      }));
      svg.appendChild(makeSvgElement('text', {
        x: margin.left - 8,
        y: y + 4,
        class: 'github-history-axis-label',
        'text-anchor': 'end'
      }, String(value)));
    }

    svg.appendChild(makeSvgElement('path', { d: areaPath, class: 'github-history-area' }));
    svg.appendChild(makeSvgElement('path', { d: linePath, class: 'github-history-line' }));

    var previousYear = '';
    points.forEach(function (point) {
      var year = point.week.start.slice(0, 4);
      if (year !== previousYear) {
        svg.appendChild(makeSvgElement('text', {
          x: point.x,
          y: height - 8,
          class: 'github-history-year',
          'text-anchor': 'middle'
        }, year));
        previousYear = year;
      }
      var circle = makeSvgElement('circle', {
        cx: point.x,
        cy: point.y,
        r: 1.8,
        class: 'github-history-point'
      });
      circle.appendChild(makeSvgElement('title', {},
        point.week.start + ' to ' + point.week.end + ': ' + point.week.count + ' contributions'));
      svg.appendChild(circle);
    });

    historyChart.replaceChildren(svg);
    historyChart.setAttribute('aria-busy', 'false');
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
    var contributionCount = Number(data.total[year]);
    total.textContent = contributionCount.toLocaleString() + ' ' +
      (contributionCount === 1 ? 'contribution' : 'contributions') + ' in ' + year;
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

  if (historyChart) {
    fetchHistory()
      .then(renderHistory)
      .catch(function (error) {
        historyChart.setAttribute('aria-busy', 'false');
        var paragraph = document.createElement('p');
        paragraph.className = 'github-calendar-message';
        paragraph.textContent = error.message + ' The yearly contribution calendar is still available above.';
        historyChart.replaceChildren(paragraph);
      });
  }

  selectYear(selectedYear);
})();
