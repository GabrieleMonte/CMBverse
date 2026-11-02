// Site chrome. Loaded synchronously in <head>, before the stylesheets.
// - Light / dark theme: <html data-theme> is set before first paint. A saved choice
//   wins; otherwise the OS setting is followed live. The toggle is added to the right end of <nav>.
// - Phone menu: at <= 600px (style.css) the nav list folds behind a "Menu" button; the current page is marked.
(function(){
  var KEY = 'cmbverse-theme', root = document.documentElement;
  var os = window.matchMedia('(prefers-color-scheme: dark)');

  function saved(){
    try { var t = localStorage.getItem(KEY); return t === 'light' || t === 'dark' ? t : null; }
    catch (e){ return null; }               // storage blocked: follow the OS, no persistence
  }
  function apply(t){
    root.dataset.theme = t;
    var b = document.querySelector('.theme-toggle');
    if (b){
      var dark = t === 'dark';
      b.setAttribute('aria-checked', dark ? 'true' : 'false');
      b.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
    }
  }

  apply(saved() || (os.matches ? 'dark' : 'light'));
  os.addEventListener('change', function(e){ if (!saved()) apply(e.matches ? 'dark' : 'light'); });
  window.addEventListener('storage', function(e){        // another tab toggled
    if (e.key === KEY && (e.newValue === 'light' || e.newValue === 'dark')) apply(e.newValue);
  });

  document.addEventListener('DOMContentLoaded', function(){
    var nav = document.querySelector('nav');
    if (!nav) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'theme-toggle';
    b.setAttribute('role', 'switch'); b.setAttribute('aria-label', 'Dark mode');
    // placeholder icons until the toggle design is chosen: moon in light mode, sun in dark mode
    b.innerHTML =
      '<svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" fill="currentColor"/></svg>' +
      '<svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/>' +
      '<g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></g></svg>';
    b.addEventListener('click', function(){
      var t = root.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(KEY, t); } catch (e){}
      apply(t);
    });
    nav.appendChild(b);
    apply(root.dataset.theme);
    setupMenu(nav);
  });

  // The .has-menu class is what lets CSS collapse the list, so without JavaScript the list simply stays open.
  function setupMenu(nav){
    var list = nav.querySelector(':scope > ul');
    if (!list) return;
    list.id = 'site-menu';
    var m = document.createElement('button');
    m.type = 'button'; m.className = 'nav-menu-btn';
    m.setAttribute('aria-controls', 'site-menu'); m.setAttribute('aria-expanded', 'false');
    m.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>Menu';
    function setOpen(open){
      nav.classList.toggle('menu-open', open);
      m.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    m.addEventListener('click', function(){ setOpen(!nav.classList.contains('menu-open')); });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && nav.classList.contains('menu-open')){ setOpen(false); m.focus(); }
    });
    nav.insertBefore(m, list);
    nav.classList.add('has-menu');
    // mark the current page; hrefs are extensionless ("home", "neutrinos")
    var here = pageName(location.pathname);
    list.querySelectorAll('a[href]').forEach(function(a){
      if (a.getAttribute('href') !== '#' && pageName(a.pathname) === here) a.setAttribute('aria-current', 'page');
    });
  }
  function pageName(path){ return path.split('/').pop().replace(/\.html$/, '') || 'home'; }
})();
