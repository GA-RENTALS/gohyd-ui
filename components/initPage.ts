// @ts-nocheck
// Original page script, unchanged. Runs once Leaflet has loaded (or failed to).
export function initPage() {
    (function () {
      "use strict";
      var root = document.documentElement;
      var body = document.body;
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      root.classList.add("js-ready");
      document.getElementById("year").textContent = String(new Date().getFullYear());

      // Broken image fallback
      document.addEventListener("error", function (e) {
        var t = e.target;
        if (t && t.tagName === "IMG" && t.parentElement) {
          t.parentElement.classList.add("img-failed");
          if (!t.parentElement.dataset.label) t.parentElement.dataset.label = t.alt || "";
        }
      }, true);

      // Header, progress, hero scroll parallax
      var header = document.getElementById("header");
      var progress = document.getElementById("progress");
      var hero = document.getElementById("home");
      var stickyCta = document.getElementById("sticky-cta");
      var ticking = false;
      function onScroll() {
        var y = window.scrollY;
        var max = root.scrollHeight - window.innerHeight;
        header.classList.toggle("scrolled", y > 24);
        stickyCta.classList.toggle("show", y > hero.offsetHeight * 0.7);
        progress.style.transform = "scaleX(" + (max > 0 ? Math.min(1, y / max) : 0) + ")";
        if (!reduce && y < hero.offsetHeight) hero.style.setProperty("--sy", String(Math.round(y * 0.22)));
        ticking = false;
      }
      window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
      onScroll();

      // Mobile menu
      var menuBtn = document.getElementById("menu-btn");
      var menuIcon = document.getElementById("menu-icon");
      var nav = document.getElementById("nav-links");
      function setMenu(open) {
        body.classList.toggle("menu-open", open);
        menuBtn.setAttribute("aria-expanded", String(open));
        menuBtn.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
        menuIcon.innerHTML = '<use href="#' + (open ? "i-close" : "i-menu") + '"></use>';
      }
      menuBtn.addEventListener("click", function () { setMenu(menuBtn.getAttribute("aria-expanded") !== "true"); });
      nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && menuBtn.getAttribute("aria-expanded") === "true") { setMenu(false); menuBtn.focus(); }
      });
      window.addEventListener("resize", function () { if (window.innerWidth > 860) setMenu(false); });

      // Scroll reveal
      var items = document.querySelectorAll("[data-reveal]");
      items.forEach(function (el) { if (el.dataset.d) el.style.setProperty("--d", el.dataset.d); });
      if ("IntersectionObserver" in window && !reduce) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); } });
        }, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });
        items.forEach(function (el) { io.observe(el); });
      } else {
        items.forEach(function (el) { el.classList.add("is-visible"); });
      }

      // Hero pointer parallax
      if (fine && !reduce) {
        hero.addEventListener("pointermove", function (e) {
          var r = hero.getBoundingClientRect();
          hero.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
          hero.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
        });
        hero.addEventListener("pointerleave", function () { hero.style.setProperty("--mx", "0"); hero.style.setProperty("--my", "0"); });

        // Subtle 3D tilt
        document.querySelectorAll("[data-tilt]").forEach(function (el) {
          var deg = parseFloat(el.dataset.tilt) || 4;
          el.addEventListener("pointermove", function (e) {
            var r = el.getBoundingClientRect();
            var x = (e.clientX - r.left) / r.width - 0.5;
            var y = (e.clientY - r.top) / r.height - 0.5;
            el.style.transform = "perspective(1000px) rotateX(" + (-y * deg).toFixed(2) + "deg) rotateY(" + (x * deg).toFixed(2) + "deg)";
          });
          el.addEventListener("pointerleave", function () { el.style.transform = ""; });
        });
      }

      // Explore accordion
      var places = Array.prototype.slice.call(document.querySelectorAll("#places .place"));
      function activate(p) {
        places.forEach(function (el) {
          var on = el === p;
          el.classList.toggle("is-active", on);
          el.querySelector(".place-hit").setAttribute("aria-expanded", String(on));
        });
      }
      places.forEach(function (p) {
        var hit = p.querySelector(".place-hit");
        hit.addEventListener("click", function () { activate(p); });
        hit.addEventListener("focus", function () { activate(p); });
        if (fine) {
          var timer;
          hit.addEventListener("pointerenter", function () { clearTimeout(timer); timer = setTimeout(function () { activate(p); }, 130); });
          hit.addEventListener("pointerleave", function () { clearTimeout(timer); });
        }
      });

      // Map
      var rows = Array.prototype.slice.call(document.querySelectorAll(".mitem"));
      var mapEl = document.getElementById("map");
      if (window.L && mapEl) {
        var map = L.map(mapEl, { scrollWheelZoom: false, zoomControl: true, dragging: !L.Browser.mobile, tap: false });
        L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}", { maxZoom: 18, attribution: "Tiles &copy; Esri &mdash; Esri, HERE, Garmin, OpenStreetMap contributors" }).addTo(map);
        mapEl.addEventListener("click", function () { map.scrollWheelZoom.enable(); });
        mapEl.addEventListener("mouseleave", function () { map.scrollWheelZoom.disable(); });
        function pinIcon(img, count) {
          return L.divIcon({ className: "pin-wrap", iconSize: [46, 46], iconAnchor: [23, 54], popupAnchor: [0, -50],
            html: '<span class="pin" style="background-image:url(\'' + img + '\')">' + (count ? '<b class="pin-n">' + count + "</b>" : "") + "</span>" });
        }
        function popup(d) {
          var w = document.createElement("div"); w.className = "pop";
          var im = document.createElement("img"); im.src = d.img; im.alt = d.name; im.loading = "lazy";
          var b = document.createElement("div"), h = document.createElement("b"), p = document.createElement("p"), a = document.createElement("a");
          h.textContent = d.name; p.textContent = d.text; a.textContent = "Open in Google Maps \u2197"; a.href = d.href; a.target = "_blank"; a.rel = "noopener noreferrer";
          b.appendChild(h); b.appendChild(p); b.appendChild(a); w.appendChild(im); w.appendChild(b); return w;
        }
        var items = rows.map(function (r) {
          var d = { name: r.dataset.name, text: r.dataset.text, group: r.dataset.group, href: r.href, ll: [+r.dataset.lat, +r.dataset.lng], img: "assets/img/" + r.dataset.slug + "-640.jpg", row: r };
          d.marker = L.marker(d.ll, { icon: pinIcon(d.img), title: d.name, keyboard: true }).bindPopup(popup(d), { closeButton: true, autoPanPadding: [30, 30] });
          return d;
        });
        var old = items.filter(function (d) { return d.group === "old"; });
        var cluster = L.marker(old[0].ll, { icon: pinIcon(old[0].img, old.length), title: "Old City: " + old.length + " places. Zoom in.", keyboard: true });
        cluster.on("click", function () { map.flyTo(old[0].ll, 16, { duration: 1 }); });
        var CLUSTER_ZOOM = 15;
        function sync() {
          var zoomedIn = map.getZoom() >= CLUSTER_ZOOM;
          items.forEach(function (d) {
            var show = d.group !== "old" || zoomedIn;
            if (show && !map.hasLayer(d.marker)) d.marker.addTo(map);
            if (!show && map.hasLayer(d.marker)) map.removeLayer(d.marker);
          });
          if (zoomedIn) { if (map.hasLayer(cluster)) map.removeLayer(cluster); } else if (!map.hasLayer(cluster)) cluster.addTo(map);
        }
        var cityBounds = L.latLngBounds(items.filter(function (d) { return d.name !== "Ananthagiri Hills"; }).map(function (d) { return d.ll; }));
        var allBounds = L.latLngBounds(items.map(function (d) { return d.ll; }));
        map.fitBounds(cityBounds, { padding: [50, 50] });
        map.on("zoomend", sync); sync();
        map.on("popupopen", function (e) { items.forEach(function (d) { var on = d.marker === e.popup._source; d.row.classList.toggle("is-on", on); if (d.marker._icon) d.marker._icon.classList.toggle("is-on", on); }); });
        map.on("popupclose", function () { rows.forEach(function (r) { r.classList.remove("is-on"); }); });
        rows.forEach(function (r, i) {
          r.addEventListener("click", function (e) {
            e.preventDefault();
            var d = items[i], z = d.name === "Ananthagiri Hills" ? 12 : 16;
            map.flyTo(d.ll, z, { duration: 1.1 });
            map.once("moveend", function () { sync(); d.marker.openPopup(); });
            document.getElementById("map").scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" });
          });
        });
        document.getElementById("map-fit").addEventListener("click", function () { map.closePopup(); map.flyToBounds(allBounds, { padding: [40, 40], duration: 1.1 }); });
        window.addEventListener("load", function () { map.invalidateSize(); });
      } else {
        var fit = document.getElementById("map-fit"); if (fit) fit.hidden = true;
        if (mapEl) { mapEl.textContent = "The interactive map couldn't load. Use the list to open each place in Google Maps."; mapEl.style.cssText = "display:grid;place-items:center;padding:24px;text-align:center;color:#5a5a4d"; }
      }

      // Events filter (chips + experience cards)
      var chips = Array.prototype.slice.call(document.querySelectorAll(".chip"));
      var cards = Array.prototype.slice.call(document.querySelectorAll(".ecard"));
      function filter(cat) {
        chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c.dataset.chip === cat)); });
        cards.forEach(function (c) { var show = cat === "all" || c.dataset.cat === cat; c.hidden = !show; if (show) c.classList.add("is-visible"); });
      }
      chips.forEach(function (c) { c.addEventListener("click", function () { filter(c.dataset.chip); }); });
      document.querySelectorAll("[data-filter]").forEach(function (a) {
        a.addEventListener("click", function () { filter(a.dataset.filter); });
      });
    }());
;
}
