/* Injected by the admin shell into the framed page (same origin).
   Turns every [data-edit] element into an inline-editable region and every
   [data-edit-img] element into a click-to-replace image slot. The page's own
   styling is untouched, so what admins see is exactly what visitors see. */
(function () {
  'use strict';

  var dirty = false;
  var pendingImages = {}; // key -> File
  var filePicker = document.createElement('input');
  filePicker.type = 'file';
  filePicker.accept = 'image/*';
  var pickTarget = null;

  var style = document.createElement('style');
  style.textContent = [
    '[data-edit], [data-edit-img] { outline: 1.5px dashed rgba(224,162,74,.55); outline-offset: 4px; transition: outline-color .15s; }',
    '[data-edit]:hover, [data-edit-img]:hover { outline-color: #e0a24a; cursor: text; }',
    '[data-edit-img]:hover { cursor: pointer; }',
    '[data-edit]:focus { outline: 2px solid #e0a24a; outline-offset: 4px; }'
  ].join('\n');
  document.head.appendChild(style);

  document.querySelectorAll('[data-edit]').forEach(function (el) {
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('spellcheck', 'true');
    el.addEventListener('input', function () { markDirty(); });
    // Keep single-element regions single-line-ish: Enter inserts a <br>
    // instead of letting the browser create nested block elements.
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        document.execCommand('insertLineBreak');
      }
    });
  });

  document.querySelectorAll('[data-edit-img]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      pickTarget = el;
      filePicker.click();
    });
  });

  filePicker.addEventListener('change', function () {
    var file = filePicker.files && filePicker.files[0];
    filePicker.value = '';
    if (!file || !pickTarget) return;
    var key = pickTarget.getAttribute('data-edit-img');
    pendingImages[key] = file;
    var url = URL.createObjectURL(file);
    if (pickTarget.tagName === 'VIDEO') {
      pickTarget.setAttribute('poster', url);
      // Pause playback so the new poster is actually visible for review.
      try { pickTarget.pause(); pickTarget.removeAttribute('autoplay'); pickTarget.currentTime = 0; pickTarget.load(); } catch (_) {}
    } else if (pickTarget.tagName === 'IMG') {
      pickTarget.setAttribute('src', url);
    } else {
      pickTarget.style.backgroundImage = 'url("' + url + '")';
    }
    markDirty();
  });

  // Links stay put while editing — a click should edit the label, not navigate.
  document.addEventListener('click', function (e) {
    var link = e.target && e.target.closest && e.target.closest('a[href]');
    if (link) e.preventDefault();
  }, true);

  function markDirty() {
    if (!dirty) {
      dirty = true;
      notify();
    }
  }

  function notify() {
    try { window.parent.postMessage({ type: 'editor:dirty' }, window.location.origin); } catch (_) {}
  }

  window.__editor = {
    isDirty: function () { return dirty; },
    collect: function () {
      var text = {};
      document.querySelectorAll('[data-edit]').forEach(function (el) {
        text[el.getAttribute('data-edit')] = el.innerHTML.trim();
      });
      return { text: text, pendingImages: pendingImages };
    },
    markSaved: function () { dirty = false; pendingImages = {}; }
  };

  try { window.parent.postMessage({ type: 'editor:ready' }, window.location.origin); } catch (_) {}
})();
