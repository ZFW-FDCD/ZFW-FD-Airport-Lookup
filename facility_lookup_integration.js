(function () {
  "use strict";

  function normalizeIdent(value) {
    return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  }

  function baseAirportIdent(value) {
    const ident = normalizeIdent(value);
    return ident.length === 4 && ident.startsWith("K") ? ident.slice(1) : ident;
  }

  function facilityRecords() {
    return (window.ZFW_FACILITY_DATA && window.ZFW_FACILITY_DATA.records) || {};
  }

  function getFacilityForAirport(value) {
    const ident = normalizeIdent(value);
    const base = baseAirportIdent(ident);
    const records = facilityRecords();

    if (records[ident] && records[ident].active !== false) return records[ident];
    if (records[base] && records[base].active !== false) return records[base];

    return Object.keys(records).map(function (key) { return records[key]; }).find(function (record) {
      if (!record || record.active === false) return false;
      return (Array.isArray(record.airports) ? record.airports : []).some(function (airport) {
        const candidate = normalizeIdent(airport);
        return candidate === ident || baseAirportIdent(candidate) === base;
      });
    }) || null;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function facilityLines(facility) {
    const lines = [];
    if (facility.facility_name) lines.push(["Facility", facility.facility_name]);
    if (facility.facility_type) lines.push(["Type", facility.facility_type]);
    if (facility.controlling_facility) lines.push(["Controlling", facility.controlling_facility]);
    if (facility.clearance_contact) lines.push(["Clearance", facility.clearance_contact]);
    if (facility.phone) lines.push(["Phone", facility.phone]);
    if (Array.isArray(facility.hours) && facility.hours.length) lines.push(["Hours", facility.hours.join(" / ")]);
    if (facility.vscs) lines.push(["VSCS / ID", facility.vscs]);
    if (facility.frequency) lines.push(["Frequency", facility.frequency]);
    if (facility.notes) lines.push(["Notes", facility.notes]);
    return lines;
  }

  function makeFacilityCard() {
    if (document.getElementById("facilityContactCard")) return;
    const grid = document.querySelector(".grid");
    if (!grid) return;
    const card = document.createElement("div");
    card.id = "facilityContactCard";
    card.className = "card facility-contact-card";
    card.innerHTML = '<div class="card-title">FACILITY / CLEARANCE CONTACT</div><div id="facilityContact" class="card-value">—</div>';
    const mapCard = document.getElementById("mapCard");
    if (mapCard) grid.insertBefore(card, mapCard); else grid.appendChild(card);
  }

  function makeFacilityStyles() {
    if (document.getElementById("facilityLookupIntegrationStyles")) return;
    const style = document.createElement("style");
    style.id = "facilityLookupIntegrationStyles";
    style.textContent = `
      .facility-contact-card { display:none; border-color:var(--cyan) !important; }
      .facility-contact-card .card-title,.facility-contact-card .card-value { color:var(--cyan) !important; }
      .facility-contact-line { margin:0 0 4px; }
      .facility-contact-line:last-child { margin-bottom:0; }
      .facility-contact-label { font-weight:900; }
      .omic-facility-contact-card { display:none; margin-top:12px; border-color:var(--cyan) !important; }
      .omic-facility-contact-card .card-title,.omic-facility-contact-card .card-value { color:var(--cyan) !important; }
    `;
    document.head.appendChild(style);
  }

  function renderFacility(value) {
    makeFacilityCard();
    makeFacilityStyles();
    const card = document.getElementById("facilityContactCard");
    const output = document.getElementById("facilityContact");
    if (!card || !output) return;
    const facility = getFacilityForAirport(value);
    if (!facility) { card.style.display = "none"; output.textContent = "—"; return; }
    const lines = facilityLines(facility);
    output.innerHTML = lines.length ? lines.map(function (line) {
      return '<div class="facility-contact-line"><span class="facility-contact-label">' + escapeHtml(line[0]) + ':</span> ' + escapeHtml(line[1]) + '</div>';
    }).join("") : "Facility record found";
    card.style.display = "block";
  }

  function renderOmicFacility(value) {
    makeFacilityStyles();
    const page = document.getElementById("omicPage");
    const grid = page && page.querySelector(".omic-output-grid");
    if (!grid) return;

    let card = document.getElementById("omicFacilityContactCard");
    if (!card) {
      card = document.createElement("div");
      card.id = "omicFacilityContactCard";
      card.className = "card omic-facility-contact-card";
      card.innerHTML = '<div class="card-title">FACILITY / CLEARANCE CONTACT</div><div id="omicFacilityContact" class="card-value">—</div>';
      grid.appendChild(card);
    }

    const output = document.getElementById("omicFacilityContact");
    const facility = getFacilityForAirport(value);
    if (!facility) { card.style.display = "none"; output.textContent = "—"; return; }

    output.innerHTML = facilityLines(facility).map(function (line) {
      return '<div class="facility-contact-line"><span class="facility-contact-label">' + escapeHtml(line[0]) + ':</span> ' + escapeHtml(line[1]) + '</div>';
    }).join("") || "Facility record found";
    card.style.display = "block";
  }

  function init() {
    makeFacilityCard();
    makeFacilityStyles();
    const input = document.getElementById("airportInput");
    if (input) {
      input.addEventListener("input", function () { renderFacility(input.value); }, true);
      input.addEventListener("change", function () { renderFacility(input.value); }, true);
    }

    const omicInput = document.getElementById("omicInput");
    if (omicInput) {
      omicInput.addEventListener("input", function () { renderOmicFacility(omicInput.value); }, true);
      omicInput.addEventListener("change", function () { renderOmicFacility(omicInput.value); }, true);
    }

    window.addEventListener("zfw-facilities-updated", function () {
      renderFacility(input ? input.value : "");
      renderOmicFacility(omicInput ? omicInput.value : "");
    });
    setTimeout(function () {
      renderFacility(input ? input.value : "");
      renderOmicFacility(omicInput ? omicInput.value : "");
    }, 0);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
