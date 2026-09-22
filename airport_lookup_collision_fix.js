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



  function keepAirportLookupAirportOnly() {
    const input = document.getElementById("airportInput");
    if (!input || window.__zfwAirportOnlyGuardInstalled) return;
    window.__zfwAirportOnlyGuardInstalled = true;

    document.addEventListener("input", function (event) {
      if (!event.target || event.target.id !== "airportInput") return;
      if (window.__zfwWaypointBridgeActive) return;

      const typed = normalizeIdent(event.target.value);
      if (typed.length < 3) return;

      repairAirportAliases();

      // Airport entry is airport-only. If this identifier exists only as a
      // navaid/fix, stop the legacy airport handler before it can display the
      // navaid as an airport result.
      const records = (window.AIRPORT_DATA && window.AIRPORT_DATA.records) || {};
      const base = typed.length === 4 && typed.charAt(0) === "K" ? typed.slice(1) : typed;
      if (/^[A-Z0-9]{3}$/.test(base)) {
        const airport = records["K" + base] || records[base];
        const navSources = Object.assign({}, window.ZFW_NAV_DATA || {}, window.ZFW_SUPPLEMENTAL_NAVAIDS || {}, window.ZFW_SUPPLEMENTAL_WAYPOINTS || {});
        const navOnly = !isAirportRecord(airport) && (isNavRecord(records[base]) || !!navSources[base]);
        if (navOnly) {
          event.preventDefault();
          event.stopImmediatePropagation();
          const status = document.getElementById("status");
          if (status) {
            status.textContent = base + " not found";
            status.style.color = "var(--red)";
          }
        }
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

  // Unified search is ENTER-only. Do not install any legacy automatic lookup.
  repairAirportAliases();

  window.addEventListener("zfw-shared-corrections-updated", repairAirportAliases);
  window.addEventListener("zfw-facilities-updated", repairAirportAliases);
  setTimeout(repairAirportAliases, 0);
  setTimeout(repairAirportAliases, 250);
  setTimeout(repairAirportAliases, 1000);
  setTimeout(installAutomaticLookupFallback, 0);
  setTimeout(installAutomaticLookupFallback, 250);
  setTimeout(installAutomaticLookupFallback, 1000);
})();
