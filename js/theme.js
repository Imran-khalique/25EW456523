/* Theme switch: light / dark with localStorage persistence.
   Runs on every page that includes this script. */
(function () {
    var STORAGE_KEY = 'ik-theme';
    var root = document.documentElement;

    function applyTheme(theme) {
        if (theme === 'dark') {
            root.setAttribute('data-theme', 'dark');
        } else {
            root.removeAttribute('data-theme');
        }
    }

    function readSaved() {
        try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
    }

    // Apply stored theme as early as possible (inline script in <head> also does
    // this to avoid a flash; this is a backup in case the inline script was edited out).
    var saved = readSaved();
    applyTheme(saved === 'dark' ? 'dark' : 'light');

    function syncSwitchesTo(theme) {
        var inputs = document.querySelectorAll('.theme-switch-input');
        for (var i = 0; i < inputs.length; i++) {
            inputs[i].checked = (theme === 'dark');
        }
    }

    function bindSwitches() {
        var inputs = document.querySelectorAll('.theme-switch-input');
        var current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
        syncSwitchesTo(current);

        for (var i = 0; i < inputs.length; i++) {
            inputs[i].addEventListener('change', function (e) {
                var next = e.target.checked ? 'dark' : 'light';
                applyTheme(next);
                try { localStorage.setItem(STORAGE_KEY, next); } catch (err) {}
                // Keep any other switches on the page in sync
                syncSwitchesTo(next);
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindSwitches);
    } else {
        bindSwitches();
    }

    /* --- Last-section active fix ---
       The template uses scrollIt with topOffset: -60, which means a section only
       receives the .active class once its top scrolls past 60px from the viewport
       top. The last section (Contact on the home page) often can't scroll that
       far because the page ends shortly after it — so its nav link never lights
       up. We watch the last section with IntersectionObserver: any time it is
       visible AND scrolled near the top of the viewport (or we're near the page
       bottom), we manually apply .active to its nav link.

       We also re-apply on a short interval after scroll events, because scrollIt
       runs its own scroll handler that may clear our class. */
    function bindEndOfPageActive() {
        var navLinks = document.querySelectorAll('.navbar-default .navbar-nav a[data-scroll-nav]');
        if (!navLinks.length) { return; }

        // Find the link with the highest data-scroll-nav value
        var lastLink = null;
        var lastIdx = -1;
        for (var i = 0; i < navLinks.length; i++) {
            var v = parseInt(navLinks[i].getAttribute('data-scroll-nav'), 10);
            if (!isNaN(v) && v > lastIdx) { lastIdx = v; lastLink = navLinks[i]; }
        }
        if (!lastLink) { return; }

        // Match that index to a section in the DOM
        var lastSection = document.querySelector('[data-scroll-index="' + lastIdx + '"]');

        function setLastActive() {
            for (var i = 0; i < navLinks.length; i++) {
                navLinks[i].classList.remove('active');
            }
            lastLink.classList.add('active');
        }

        function isAtBottom() {
            var scrollPos = window.innerHeight + window.scrollY;
            var pageHeight = document.documentElement.scrollHeight;
            return scrollPos >= pageHeight - 80;
        }

        function isLastSectionAtTop() {
            if (!lastSection) { return false; }
            var rect = lastSection.getBoundingClientRect();
            // Top of last section is at or above 200px from viewport top
            return rect.top <= 200 && rect.bottom > 0;
        }

        function evaluate() {
            if (isAtBottom() || isLastSectionAtTop()) {
                setLastActive();
            }
        }

        // Listen during scroll, and re-check shortly after — scrollIt's own
        // handler can overwrite our class, so we re-apply on a short timeout.
        var t = null;
        window.addEventListener('scroll', function () {
            evaluate();
            clearTimeout(t);
            t = setTimeout(evaluate, 100);
        }, { passive: true });

        // Also evaluate once on load in case the page opens at the bottom
        evaluate();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindEndOfPageActive);
    } else {
        bindEndOfPageActive();
    }
})();
