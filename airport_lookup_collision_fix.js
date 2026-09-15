(function () {
  "use strict";

  // Airport and navaid identifiers are separate entities. A shared identifier
  // such as HOT must resolve to the airport when entered in the Airport box,
  // while the navaid remains available to the PIREP/nav lookup layer.

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

        // HOT is both a navaid and an airport. The airport's nearest weather
        // station is HOT itself and must remain explicit.
        if (ident === "HOT" && adjacent[key] &&
            String(adjacent[key].record_type || "").toUpperCase() === "AIRPORT") {
          adjacent[key].nearest_wx = "HOT";
        }
      });
    }

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

  function triggerAirportLookup(input, typed) {
    if (!input || normalizeIdent(input.value) !== typed) return;

    // Prefer the real lookup function when it is exposed. This avoids relying
    // on a synthetic keyboard event and guarantees the nearest-weather update
    // runs through the same code path as a real Enter press.
    if (typeof window.updateResults === "function") {
      window.updateResults();
      return;
    }

    // Fallback for builds where updateResults is not exposed globally.
    input.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Enter",
      code: "Enter",
      bubbles: true,
      cancelable: true
    }));
  }

  function validCompleteIdentifier(value) {
    const typed = normalizeIdent(value);
    return /^[A-Z0-9]{3,5}$/.test(typed) && (
      typed.length === 3 ||
      /^K[A-Z0-9]{3}$/.test(typed) ||
      typed.length === 4 ||
      typed.length === 5
    );
  }

  function installAutomaticLookupFallback() {
    // The original app listener is attached directly to the input element.
    // The login/UI initialization can replace that element, leaving the old
    // listener behind. A document-level delegated listener survives that.
    if (document.documentElement.dataset.zfwDelegatedAirportLookup === "1") return;
    document.documentElement.dataset.zfwDelegatedAirportLookup = "1";

    document.addEventListener("input", function (event) {
      const target = event.target;
      if (!target || target.id !== "airportInput") return;

      const typed = normalizeIdent(target.value);
      if (!validCompleteIdentifier(typed)) return;

      setTimeout(function () {
        triggerAirportLookup(target, typed);
      }, 0);
    }, true);
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
