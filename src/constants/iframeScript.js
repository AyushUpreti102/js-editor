export default `
  // Override the standard console methods
  ['log', 'error', 'warn', 'info'].forEach(method => {
    const original = console[method];
    console[method] = (...args) => {
      // Call original console so it still shows in dev tools
      // original.apply(console, args);
      
      // Send the log data to the parent window
      window.parent.postMessage({
        type: 'IFRAME_CONSOLE',
        method: method,
        arguments: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg))
      }, '*'); 
    };
  });
  window.onerror = function (message, source, lineno, colno, error) {
    window.parent.postMessage({
      type: 'IFRAME_CONSOLE',
      method: 'error',
      arguments: [
        'Error: ' + message + '   ' + lineno + ':' + colno
      ]
    }, '*'); // Replace '*' with your actual parent origin for production security
        
        return true;
      };

      // Also catch unhandled promise rejections inside the iframe
      window.addEventListener('unhandledrejection', function (event) {
        window.parent.postMessage({
          type: 'IFRAME_CONSOLE',
          method: 'error',
          arguments: [
            'Unhandled Promise Rejection: ' + event.reason
          ]
      }, '*');
  });
`
