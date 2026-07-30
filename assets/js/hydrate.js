/* Applies content/content.json on top of the page's baked-in defaults.
   The HTML keeps sensible fallback copy, so the page still renders if the
   fetch fails (e.g. opened straight from disk). */
(function () {
  window.__hydrated = fetch('content/content.json', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (content) {
      if (!content) return null;

      var text = content.text || {};
      document.querySelectorAll('[data-edit]').forEach(function (el) {
        var key = el.getAttribute('data-edit');
        if (Object.prototype.hasOwnProperty.call(text, key)) el.innerHTML = text[key];
      });

      var images = content.images || {};
      document.querySelectorAll('[data-edit-img]').forEach(function (el) {
        var key = el.getAttribute('data-edit-img');
        var url = images[key];
        if (!url) return;
        if (el.tagName === 'VIDEO') el.setAttribute('poster', url);
        else if (el.tagName === 'IMG') el.setAttribute('src', url);
        else el.style.backgroundImage = 'url("' + url + '")';
      });

      return content;
    })
    .catch(function () { return null; });
})();
