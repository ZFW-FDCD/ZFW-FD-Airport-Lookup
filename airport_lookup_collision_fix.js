(function () {
  "use strict";

  // Airport and navaid identifiers are separate entities. The legacy app uses
  // AIRPORT_DATA.records for its primary airport lookup, while the nav/weather
  // layer also works with ZFW_NAV_DATA. A nav-only record must therefore never
  // block an adjacent-airport lookup such as HOT.

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

    // First, remove nav-only records from the legacy airport map when the same
    // identifier is a known adjacent airport. This lets the normal app lookup
    // fall through to the adjacent ARTCC handler instead of displaying the nav.
    const adjacent = window.ZFW_ADJACENT_ARTCC_AIRPORTS &&
      window.ZFW_ADJACENT_ARTCC_AIRPORTS.airports;

    if (adjacent) {
      Object.keys(adjacent).forEach(function (key) {
        const ident = normalizeIdent(key);
        if (!/^[A-Z0-9]{3}$/.test(ident)) return;

        aliasesFor(ident).forEach(function (alias) {
          if (isNavRecord(records[alias]) && !isAirportRecord(records[alias])) {
            delete records[alias];
          }
        });
      });
    }

    // Keep the normal three-letter airport lookup working when an airport
    // record exists under only one of its two conventional identifiers.
    Object.keys(records).forEach(function (key) {
      const ident = normalizeIdent(key);
      if (!/^[A-Z0-9]{3}$/.test(ident)) return;
      const record = records[key];
      if (!isAirportRecord(record)) return;

      const kIdent = "K" + ident;
      if (!isAirportRecord(records[kIdent])) {
        records[kIdent] = JSON.parse(JSON.stringify(record));
      }
    });

    Object.keys(records).forEach(function (key) {
      const ident = normalizeIdent(key);
      if (!/^K[A-Z0-9]{3}$/.test(ident)) return;
      if (!isAirportRecord(records[key])) return;

      const base = ident.slice(1);
      if (!isAirportRecord(records[base])) {
        records[base] = JSON.parse(JSON.stringify(records[key]));
      }
    });
  }

  // The main lookup normally listens for input events, but the live page has
  // shown that the automatic trigger can fail while the Enter-key path still
  // works. Use the proven Enter path as a compatibility trigger whenever a
  // complete airport identifier is typed. This does not alter lookup logic;
  // it simply guarantees that typing and pressing Enter use the same handler.
  function installAutomaticLookupFallback() {
    const input = document.getElementById("airportInput");
    if (!input || input.dataset.zfwAutoLookupFallback === "1") return;
    input.dataset.zfwAutoLookupFallback = "1";

    input.addEventListener("input", function () {
      const typed = normalizeIdent(input.value);
      if (!/^[A-Z0-9]{3,5}$/.test(typed)) return;
      if (!(
        typed.length === 3 ||
        /^K[A-Z0-9]{3}$/.test(typed) ||
        typed.length === 4 ||
        typed.length === 5
      )) return;

      setTimeout(function () {
        if (normalizeIdent(input.value) !== typed) return;
        input.dispatchEvent(new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          bubbles: true,
          cancelable: true
        }));
      }, 0);
    });
  }

  repairAirportAliases();
  installAutomaticLookupFallback();
  window.addEventListener("zfw-shared-corrections-updated", repairAirportAliases);
  window.addEventListener("zfw-facilities-updated", repairAirportAliases);
  setTimeout(repairAirportAliases, 0);
  setTimeout(repairAirportAliases, 250);
  setTimeout(repairAirportAliases, 1000);
  setTimeout(installAutomaticLookupFallback, 0);
  setTimeout(installAutomaticLookupFallback, 250);
  setTimeout(installAutomaticLookupFallback, 1000);
})();
