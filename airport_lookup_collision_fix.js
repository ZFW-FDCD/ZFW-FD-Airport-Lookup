(function () {
  "use strict";

  // Keep the traditional 3-letter airport lookup (e.g. HOT) working even
  // when the airport record exists only under its K-prefixed alias or only
  // under the bare identifier. Navaids remain separate in ZFW_NAV_DATA.
  function normalizeIdent(value) {
    return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  function isAirportRecord(record) {
    if (!record) return false;
    const type = String(record.record_type || record.type || "").toUpperCase();
    return type === "AIRPORT";
  }

  function repairAirportAliases() {
    const records = window.AIRPORT_DATA && window.AIRPORT_DATA.records;
    if (!records) return;

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

  repairAirportAliases();
  window.addEventListener("zfw-shared-corrections-updated", repairAirportAliases);
  window.addEventListener("zfw-facilities-updated", repairAirportAliases);
  setTimeout(repairAirportAliases, 0);
  setTimeout(repairAirportAliases, 250);
})();
