(function () {
  'use strict';

  var section = document.querySelector('[data-support-section]');
  if (!section) {
    return;
  }

  var config = window.PORTFOLIO_SUPPORT_CONFIG;
  var amountButtons = Array.prototype.slice.call(section.querySelectorAll('[data-support-amount]'));
  var selectedAmount = section.querySelector('[data-support-selected-amount]');
  var status = section.querySelector('[data-support-status]');
  var note = section.querySelector('[data-support-note]');
  var configuredProviders = Object.create(null);
  var invalidProviders = [];
  var activeAmount = '5';
  var providers = {
    buymeacoffee: {
      configKey: 'buyMeACoffeeUrl',
      signupUrl: 'https://buymeacoffee.com/signup',
      label: 'Buy Me a Coffee'
    },
    kofi: {
      configKey: 'koFiUrl',
      signupUrl: 'https://ko-fi.com/',
      label: 'Ko-fi'
    }
  };

  function normalizeCreatorUrl(value, provider) {
    if (!value) {
      return '';
    }

    var url;
    try {
      url = new URL(value);
    } catch (error) {
      invalidProviders.push(provider.label + ' URL is not valid.');
      return '';
    }

    var allowedHost = provider.configKey === 'buyMeACoffeeUrl'
      ? 'buymeacoffee.com'
      : 'ko-fi.com';
    var validPath = /^\/[A-Za-z0-9._-]+\/?$/.test(url.pathname);
    if (
      url.protocol !== 'https:' ||
      url.hostname !== allowedHost ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !validPath
    ) {
      invalidProviders.push(provider.label + ' URL must be its public creator page on https://' + allowedHost + '.');
      return '';
    }

    return url.origin + url.pathname.replace(/\/$/, '');
  }

  function updateProviderLinks() {
    Object.keys(providers).forEach(function (key) {
      var provider = providers[key];
      var link = section.querySelector('[data-support-provider="' + key + '"]');
      var creatorUrl = configuredProviders[key];
      link.href = creatorUrl || provider.signupUrl;
      link.textContent = creatorUrl
        ? 'Continue to ' + provider.label + ' · $' + activeAmount + ' ↗'
        : 'Create a ' + provider.label + ' page ↗';
      link.setAttribute('aria-label', creatorUrl
        ? 'Open your ' + provider.label + ' support page. Select $' + activeAmount + ' there.'
        : 'Create your ' + provider.label + ' creator page');
    });
  }

  if (!config) {
    throw new Error('Support config is missing. Load js/support-config.js before js/support.js.');
  }

  Object.keys(providers).forEach(function (key) {
    var provider = providers[key];
    configuredProviders[key] = normalizeCreatorUrl(config[provider.configKey], provider);
  });

  amountButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      activeAmount = button.getAttribute('data-support-amount');
      amountButtons.forEach(function (amountButton) {
        amountButton.setAttribute(
          'aria-pressed',
          amountButton === button ? 'true' : 'false'
        );
      });
      selectedAmount.textContent = '$' + activeAmount;
      updateProviderLinks();
    });
  });

  updateProviderLinks();

  var activeProviderCount = Object.keys(configuredProviders).filter(function (key) {
    return configuredProviders[key];
  }).length;
  if (invalidProviders.length) {
    status.textContent = 'Support page setup needs attention';
    note.textContent = invalidProviders.join(' ') + ' Edit js/support-config.js, then reload the page.';
  } else if (activeProviderCount) {
    status.textContent = 'Support page connected';
    note.textContent = 'Choose an amount and continue to your selected provider. Confirm the amount there; payments are processed by the provider.';
  }
})();
