export default `
  // Override the standard console methods
  ['log', 'error', 'warn', 'info'].forEach(function (method) {
    var original = console[method];
    console[method] = function () {
      var args = Array.prototype.slice.call(arguments);
      try {
        if (original) original.apply(console, args);
      } catch (_) {}

      try {
        window.parent.postMessage({
          type: 'IFRAME_CONSOLE',
          method: method,
          arguments: args.map(function (arg) {
            try {
              if (arg === null) return 'null';
              if (arg === undefined) return 'undefined';
              if (typeof arg === 'object') return JSON.stringify(arg);
              return String(arg);
            } catch (_) {
              return String(arg);
            }
          })
        }, '*');
      } catch (_) {}
    };
  });

  window.onerror = function (message, source, lineno, colno) {
    try {
      window.parent.postMessage({
        type: 'IFRAME_CONSOLE',
        method: 'error',
        arguments: [
          'Error: ' + message + (lineno ? ' (' + lineno + ':' + colno + ')' : '')
        ]
      }, '*');
    } catch (_) {}
    return true;
  };

  window.addEventListener('unhandledrejection', function (event) {
    try {
      window.parent.postMessage({
        type: 'IFRAME_CONSOLE',
        method: 'error',
        arguments: [
          'Unhandled Rejection: ' + (event.reason ? (event.reason.message || String(event.reason)) : 'unknown')
        ]
      }, '*');
    } catch (_) {}
  });
`
