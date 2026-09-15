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

    const candidates = Object.keys(records).map(function (key) {
      return records[key];
    }).filter(function (record) {
      if (!record || record.active === false) return false;
      const airports = Array.isArray(record.airports) ? record.airports : [];
      return airports.some(function (airport) {
        const candidate = normalizeIdent(airport);
        return candidate === ident || baseAirportIdent(candidate) === base;
      });
    });

    return candidates[0] || null;
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (!element) return;
    element.textContent = value || "—";
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
    if (mapCard) grid.insertBefore(card, mapCard);
    else grid.appendChild(card);
  }

  function makeFacilityStyles() {
    if (document.getElementById("facilityLookupIntegrationStyles")) return;
    const style = document.createElement("style");
    style.id = "facilityLookupIntegrationStyles";
    style.textContent = `
      .facility-contact-card {
        display: none;
        border-color: var(--cyan) !important;
      }
      .facility-contact-card .card-title,
      .facility-contact-card .card-value {
        color: var(--cyan) !important;
      }
      .facility-contact-line {
        margin: 0 0 4px;
      }
      .facility-contact-line:last-child {
        margin-bottom: 0;
      }
      .facility-contact-label {
        font-weight: 900;
      }
    `;
    document.head.appendChild(style);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function renderFacility(value) {
    makeFacilityCard();
    makeFacilityStyles();

    const card = document.getElementById("facilityContactCard");
    const output = document.getElementById("facilityContact");
    if (!card || !output) return;

    const facility = getFacilityForAirport(value);
    if (!facility) {
      card.style.display = "none";
      output.textContent = "—";
      return;
    }

    const lines = [];
    if (facility.facility_name) {
      lines.push('<div class="facility-contact-line"><span class="facility-contact-label">Facility:</span> ' + escapeHtml(facility.facility_name) + '</div>');
    }
    if (facility.facility_type) {
      lines.push('<div class="facility-contact-line"><span class="facility-contact-label">Type:</span> ' + escapeHtml(facility.facility_type) + '</div>');
    }
    if (facility.controlling_facility) {
      lines.push('<div class="facility-contact-line"><span class="facility-contact-label">Controlling:</span> ' + escapeHtml(facility.controlling_facility) + '</div>');
    }
    if (facility.clearance_contact) {
      lines.push('<div class="facility-contact-line"><span class="facility-contact-label">Clearance:</span> ' + escapeHtml(facility.clearance_contact) + '</div>');
    }
    if (facility.phone) {
      lines.push('<div class="facility-contact-line"><span class="facility-contact-label">Phone:</span> ' + escapeHtml(facility.phone) + '</div>');
    }
    if (Array.isArray(facility.hours) && facility.hours.length) {
      lines.push('<div class="facility-contact-line"><span class="facility-contact-label">Hours:</span> ' + escapeHtml(facility.hours.join(" / ")) + '</div>');
    }
    if (facility.vscs) {
      lines.push('<div class="facility-contact-line"><span class="facility-contact-label">VSCS / ID:</span> ' + escapeHtml(facility.vscs) + '</div>');
    }
    if (facility.frequency) {
      lines.push('<div class="facility-contact-line"><span class="facility-contact-label">Frequency:</span> ' + escapeHtml(facility.frequency) + '</div>');
    }
    if (facility.notes) {
      lines.push('<div class="facility-contact-line"><span class="facility-contact-label">Notes:</span> ' + escapeHtml(facility.notes) + '</div>');
    }

    output.innerHTML = lines.length ? lines.join("") : "Facility record found";
    card.style.display = "block";
  }

  function init() {
    makeFacilityCard();
    makeFacilityStyles();

    const input = document.getElementById("airportInput");
    if (input) {
      input.addEventListener("input", function () {
        renderFacility(input.value);
      }, true);
      input.addEventListener("change", function () {
        renderFacility(input.value);
      }, true);
    }

    window.addEventListener("zfw-facilities-updated", function () {
      renderFacility(input ? input.value : "");
    });

    setTimeout(function () {
      renderFacility(input ? input.value : "");
    }, 0);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
