(function() {
  var script = document.getElementById('reserveze-embed');
  if (!script) return;
  var url = script.getAttribute('data-reserveze-url');
  if (!url) return;

  var container = document.createElement('div');
  container.style.width = '100%';
  container.style.height = '600px';
  container.style.overflow = 'hidden';
  container.style.borderRadius = '12px';
  container.style.border = '1px solid rgba(0,0,0,0.08)';
  container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
  container.style.backgroundColor = '#ffffff';

  var iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.setAttribute('frameborder', '0');

  container.appendChild(iframe);
  script.parentNode.insertBefore(container, script.nextSibling);
})();
