(function () {
  "use strict";

  function normalizeIdent(value) {
    return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  function isAirportRecord(record) {
    if (!record) return false;
    const type = String(record.record_type || record.type || "").toUpperCase();
    return type === "AIRPORT";
  }

  function isNavRecord(record) {
    if (!record) return false;
    const type = String(record.record_type || record.type || "").toUpperCase();
    return ["NAVAID", "WAYPOINT", "FIX", "VOR", "VORTAC", "NDB"].includes(type);
  }

  function aliasesFor(value) {
    const ident = normalizeIdent(value);
    if (!/^[A-Z0-9]{3}$/.test(ident)) return [];
    return [ident, "K" + ident];
  }

  function repairAirportAliases() {
    const records = window.AIRPORT_DATA && window.AIRPORT_DATA.records;
    if (!records) return;

    const adjacent = window.ZFW_ADJACENT_ARTCC_AIRPORTS && window.ZFW_ADJACENT_ARTCC_AIRPORTS.airports;

    if (adjacent) {
      Object.keys(adjacent).forEach(function (key) {
        const ident = normalizeIdent(key);
        if (!/^[A-Z0-9]{3}$/.test(ident)) return;

        aliasesFor(ident).forEach(function (alias) {
          if (isNavRecord(records[alias]) && !isAirportRecord(records[alias])) delete records[alias];
        });

        if (ident === "HOT" && adjacent[key] && String(adjacent[key].record_type || "").toUpperCase() === "AIRPORT") {
          adjacent[key].nearest_wx = "HOT";
        }
      });
    }

    Object.keys(records).forEach(function (key) {
      const ident = normalizeIdent(key);
      if (!/^[A-Z0-9]{3}$/.test(ident)) return;
      if (!isAirportRecord(records[key])) return;
      const kIdent = "K" + ident;
      if (!isAirportRecord(records[kIdent])) records[kIdent] = JSON.parse(JSON.stringify(records[key]));
    });

    Object.keys(records).forEach(function (key) {
      const ident = normalizeIdent(key);
      if (!/^K[A-Z0-9]{3}$/.test(ident) || !isAirportRecord(records[key])) return;
      const base = ident.slice(1);
      if (!isAirportRecord(records[base])) records[base] = JSON.parse(JSON.stringify(records[key]));
    });
  }


  function installWaypointBox() {
    if (document.getElementById("waypointInput")) return;
    const airport = document.getElementById("airportInput");
    if (!airport || !airport.parentElement) return;

    const label = document.createElement("label");
    label.htmlFor = "waypointInput";
    label.textContent = "WAYPOINT / NAVAID";

    const input = document.createElement("input");
    input.id = "waypointInput";
    input.type = "text";
    input.autocomplete = "off";
    input.maxLength = 8;
    input.spellcheck = false;
    input.placeholder = "";
    input.style.width = getComputedStyle(airport).width;
    input.style.boxSizing = "border-box";
    input.style.font = getComputedStyle(airport).font;
    input.style.color = getComputedStyle(airport).color;
    input.style.background = getComputedStyle(airport).backgroundColor;
    input.style.border = getComputedStyle(airport).border;
    input.style.borderRadius = getComputedStyle(airport).borderRadius;
    input.style.padding = getComputedStyle(airport).padding;

    const wrap = document.createElement("div");
    wrap.className = "zfw-waypoint-lookup";
    wrap.style.display = "inline-flex";
    wrap.style.flexDirection = "column";
    wrap.style.gap = getComputedStyle(airport.parentElement).gap || "6px";
    wrap.appendChild(label);
    wrap.appendChild(input);

    const parent = airport.parentElement;
    parent.style.display = "flex";
    parent.style.alignItems = "flex-start";
    parent.style.gap = "18px";
    parent.appendChild(wrap);

    input.addEventListener("input", function () {
      const typed = normalizeIdent(input.value);
      input.value = typed;
      if (!typed) return;
      if (window.__zfwWaypointBridgeTimer) clearTimeout(window.__zfwWaypointBridgeTimer);
      window.__zfwWaypointBridgeActive = true;

      const airportInput = document.getElementById("airportInput");
      if (!airportInput) return;

      airportInput.value = typed;
      airportInput.dispatchEvent(new Event("input", {bubbles:true, cancelable:true}));

      window.__zfwWaypointBridgeTimer = setTimeout(function () {
        window.__zfwWaypointBridgeActive = false;
        input.value = "";
      }, 900);
    });

    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        input.dispatchEvent(new Event("input", {bubbles:true, cancelable:true}));
      }
    });
  }

  function keepAirportLookupAirportOnly() {
    const input = document.getElementById("airportInput");
    if (!input || window.__zfwAirportOnlyGuardInstalled) return;
    window.__zfwAirportOnlyGuardInstalled = true;

    document.addEventListener("input", function (event) {
      if (event.target && event.target.id === "airportInput" && !window.__zfwWaypointBridgeActive) {
        const typed = normalizeIdent(event.target.value);
        if (typed.length >= 3) repairAirportAliases();
      }
    }, true);
  }

  function validCompleteIdentifier(value) {
    const typed = normalizeIdent(value);
    return /^[A-Z0-9]{3,5}$/.test(typed) && (
      typed.length === 3 || /^K[A-Z0-9]{3}$/.test(typed) || typed.length === 4 || typed.length === 5
    );
  }

  function forceLookup(input, typed) {
    if (!input || normalizeIdent(input.value) !== typed) return;

    // Enter is the known-good path in the current application. Use it rather
    // than trying to duplicate the lookup engine here.
    input.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Enter",
      code: "Enter",
      bubbles: true,
      cancelable: true
    }));

    // The weather routine can be delayed by the shared data initialization.
    // Retry it briefly after the airport lookup has completed.
    [25, 100, 300].forEach(function (delay) {
      setTimeout(function () {
        if (normalizeIdent(input.value) !== typed) return;
        if (typeof window.ZFW_UPDATE_NEAREST_WX_FOR_IDENT === "function") {
          window.ZFW_UPDATE_NEAREST_WX_FOR_IDENT(typed);
        }
      }, delay);
    });
  }

  function installAutomaticLookupFallback() {
    if (window.__zfwAirportLookupWatcherInstalled) return;
    window.__zfwAirportLookupWatcherInstalled = true;

    // Use both delegated input events and a small value watcher. The watcher
    // covers environments where the input element is recreated or the browser
    // does not deliver the expected input event to our handler.
    document.addEventListener("input", function (event) {
      const target = event.target;
      if (!target || target.id !== "airportInput") return;
      const typed = normalizeIdent(target.value);
      if (!validCompleteIdentifier(typed)) return;
      setTimeout(function () { forceLookup(target, typed); }, 0);
    }, true);

    let lastValue = "";
    setInterval(function () {
      const input = document.getElementById("airportInput");
      if (!input) return;
      const typed = normalizeIdent(input.value);
      if (typed === lastValue) return;
      lastValue = typed;
      if (!validCompleteIdentifier(typed)) return;
      setTimeout(function () { forceLookup(input, typed); }, 0);
    }, 100);
  }

  repairAirportAliases();
  installAutomaticLookupFallback();
  keepAirportLookupAirportOnly();
  installWaypointBox();
  setTimeout(installWaypointBox, 250);
  setTimeout(installWaypointBox, 1000);

  window.addEventListener("zfw-shared-corrections-updated", repairAirportAliases);
  window.addEventListener("zfw-facilities-updated", repairAirportAliases);
  setTimeout(repairAirportAliases, 0);
  setTimeout(repairAirportAliases, 250);
  setTimeout(repairAirportAliases, 1000);
  setTimeout(installAutomaticLookupFallback, 0);
  setTimeout(installAutomaticLookupFallback, 250);
  setTimeout(installAutomaticLookupFallback, 1000);
})();
