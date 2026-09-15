(function () {
  "use strict";

  const SPECIAL_FACILITIES = ["ADS", "AFW", "FTW"];
  const FACILITY_TIME_ZONE = "America/Chicago";
  const ADS_OPEN_START_LOCAL = 6 * 60;
  const ADS_OPEN_END_LOCAL = 22 * 60;

  function normalizeIdent(value) { return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, ""); }
  function baseAirportIdent(value) { const ident = normalizeIdent(value); return ident.length === 4 && ident.startsWith("K") ? ident.slice(1) : ident; }
  function facilityRecords() { return (window.ZFW_FACILITY_DATA && window.ZFW_FACILITY_DATA.records) || {}; }

  function getFacilityForAirport(value) {
    const ident = normalizeIdent(value), base = baseAirportIdent(ident), records = facilityRecords();
    if (records[ident] && records[ident].active !== false) return records[ident];
    if (records[base] && records[base].active !== false) return records[base];
    return Object.keys(records).map(function (key) { return records[key]; }).find(function (record) {
      if (!record || record.active === false) return false;
      return (Array.isArray(record.airports) ? record.airports : []).some(function (airport) {
        const candidate = normalizeIdent(airport); return candidate === ident || baseAirportIdent(candidate) === base;
      });
    }) || null;
  }

  function escapeHtml(value) { return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;"); }
  function facilityHours(facility) {
    if (!facility) return [];
    if (Array.isArray(facility.hours)) return facility.hours.filter(Boolean).map(String);
    if (typeof facility.hours === "string" && facility.hours.trim()) return [facility.hours.trim()];
    return [];
  }
  function facilityLines(facility) {
    const lines = [];
    if (facility.facility_name) lines.push(["Facility", facility.facility_name]);
    if (facility.facility_type) lines.push(["Type", facility.facility_type]);
    if (facility.controlling_facility) lines.push(["Controlling", facility.controlling_facility]);
    if (facility.clearance_contact) lines.push(["Clearance", facility.clearance_contact]);
    if (facility.phone) lines.push(["Phone", facility.phone]);
    const hours = facilityHours(facility); if (hours.length) lines.push(["Facility Hours", hours.join(" / ")]);
    if (facility.vscs) lines.push(["VSCS / ID", facility.vscs]);
    if (facility.frequency) lines.push(["Frequency", facility.frequency]);
    if (facility.notes) lines.push(["Notes", facility.notes]);
    return lines;
  }

  function parseClock(value) {
    const text = String(value || "").trim().toUpperCase();
    let match = text.match(/^(\d{3,4})$/);
    if (match) { const digits = match[1], hour = Number(digits.length === 3 ? digits.slice(0, 1) : digits.slice(0, 2)), minute = Number(digits.slice(-2)); return hour <= 23 && minute <= 59 ? hour * 60 + minute : null; }
    match = text.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i); if (!match) return null;
    let hour = Number(match[1]), minute = Number(match[2] || 0); const meridiem = String(match[3] || "").toUpperCase();
    if (hour > 23 || minute > 59) return null;
    if (meridiem) { if (hour < 1 || hour > 12) return null; if (meridiem === "AM" && hour === 12) hour = 0; if (meridiem === "PM" && hour !== 12) hour += 12; }
    return hour * 60 + minute;
  }

  function currentCentralZone(date) {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: FACILITY_TIME_ZONE, timeZoneName: "short" }).formatToParts(date);
    return String((parts.find(function (p) { return p.type === "timeZoneName"; }) || {}).value || "").toUpperCase();
  }
  function localDateParts(date) {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: FACILITY_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
    return { year: Number((parts.find(function (p) { return p.type === "year"; }) || {}).value), month: Number((parts.find(function (p) { return p.type === "month"; }) || {}).value), day: Number((parts.find(function (p) { return p.type === "day"; }) || {}).value) };
  }
  function localWallClockToUtc(dateParts, minutes) {
    const localAsUtc = Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day, Math.floor(minutes / 60), minutes % 60, 0, 0);
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: FACILITY_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date(localAsUtc));
    const get = function (type) { return Number((parts.find(function (p) { return p.type === type; }) || {}).value || 0); };
    const representedLocal = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
    return localAsUtc - (representedLocal - localAsUtc);
  }
  function shiftDate(dateParts, days) { const d = new Date(Date.UTC(dateParts.year, dateParts.month - 1, dateParts.day + days)); return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }; }
  function parseTimeRange(text) {
    const normalized = String(text || "").trim().toUpperCase().replace(/[–—]/g, "-");
    const match = normalized.match(/(?:OPEN\s+)?(.+?)\s*(?:-|\bTO\b)\s*(.+?)(?:\s+LOCAL)?$/i); if (!match) return null;
    const start = parseClock(match[1]), end = parseClock(match[2]); if (start === null || end === null) return null; return { start: start, end: end };
  }
  function parseSeasonalRanges(text, zone) {
    const normalized = String(text || "").trim().toUpperCase(); if (!/(CST|CDT)\b/.test(normalized)) return [normalized];
    return normalized.split("/").map(function (piece) { return piece.trim(); }).filter(Boolean).filter(function (piece) { const m = piece.match(/\b(CST|CDT)\b/); return !m || m[1] === zone; }).map(function (piece) { return piece.replace(/\s*\(?\b(?:CST|CDT)\b\)?\s*/g, " ").trim(); });
  }

  function facilityIsOpen(facility, ident) {
    const base = baseAirportIdent(ident); if (base === "FTW" || base === "AFW") return true;
    if (base === "ADS") { const now = Date.now(), today = localDateParts(new Date(now)); return now >= localWallClockToUtc(today, ADS_OPEN_START_LOCAL) && now <= localWallClockToUtc(today, ADS_OPEN_END_LOCAL); }
    const hours = facilityHours(facility); if (!hours.length) return null;
    const now = Date.now(), localToday = localDateParts(new Date(now)), zone = currentCentralZone(new Date(now)); let foundSchedule = false;
    for (let i = 0; i < hours.length; i++) {
      const schedules = parseSeasonalRanges(hours[i], zone);
      for (let j = 0; j < schedules.length; j++) {
        const text = schedules[j];
        if (/^24\s*(X|HOURS?|HR|HRS)?\s*7$/.test(text) || text === "24 X 7" || text === "24/7") return true;
        const isClosedSchedule = /^CLOSED\b/i.test(text), range = parseTimeRange(text.replace(/^CLOSED\s+/i, "")); if (!range) continue;
        foundSchedule = true;
        const startUtc = localWallClockToUtc(localToday, range.start), endDate = range.end <= range.start ? shiftDate(localToday, 1) : localToday, endUtc = localWallClockToUtc(endDate, range.end), inRange = now >= startUtc && now <= endUtc;
        if (isClosedSchedule ? inRange : inRange) return isClosedSchedule ? false : true;
      }
    }
    return foundSchedule ? false : null;
  }

  function resetStatus(card) { if (!card) return; card.style.removeProperty("border-color"); card.style.removeProperty("box-shadow"); card.classList.remove("facility-open", "facility-closed"); }
  function applyClearanceStatus(value, facility, cardId, applySpecialApproach) {
    const ident = baseAirportIdent(value), card = document.getElementById(cardId); if (!card) return; resetStatus(card);
    const open = facilityIsOpen(facility, ident); if (open === null) return;
    if (open) {
      card.classList.add("facility-open"); card.style.setProperty("border-color", "var(--green)", "important"); card.style.setProperty("box-shadow", "0 0 0 3px rgba(80,220,120,.25),0 0 18px rgba(80,220,120,.18)", "important");
      if (applySpecialApproach) { const approachCard = document.getElementById("approachCard"); if (approachCard && SPECIAL_FACILITIES.indexOf(ident) !== -1) approachCard.classList.remove("fdcs-green-highlight"); }
    } else {
      card.classList.add("facility-closed"); card.style.setProperty("border-color", "var(--red)", "important"); card.style.setProperty("box-shadow", "0 0 0 3px rgba(255,75,75,.28),0 0 18px rgba(255,75,75,.24)", "important");
      if (applySpecialApproach) { const approachCard = document.getElementById("approachCard"), approach = document.getElementById("approach"); if (approachCard && approach && SPECIAL_FACILITIES.indexOf(ident) !== -1) { approachCard.style.setProperty("border-color", "var(--green)", "important"); approachCard.style.setProperty("box-shadow", "", "important"); approachCard.classList.add("fdcs-green-highlight"); approach.classList.remove("red-text"); approach.classList.add("green-text"); } }
    }
  }

  function makeFacilityCard() { if (document.getElementById("facilityContactCard")) return; const grid = document.querySelector(".grid"); if (!grid) return; const card = document.createElement("div"); card.id = "facilityContactCard"; card.className = "card facility-contact-card"; card.innerHTML = '<div class="card-title">FACILITY / CLEARANCE CONTACT</div><div id="facilityContact" class="card-value">—</div>'; const mapCard = document.getElementById("mapCard"); if (mapCard) grid.insertBefore(card, mapCard); else grid.appendChild(card); }
  function makeFacilityStyles() { if (document.getElementById("facilityLookupIntegrationStyles")) return; const style = document.createElement("style"); style.id = "facilityLookupIntegrationStyles"; style.textContent = `.facility-contact-card { display:none; border-color:var(--cyan) !important; }.facility-contact-card .card-title,.facility-contact-card .card-value { color:var(--cyan) !important; }.facility-contact-line { margin:0 0 4px; }.facility-contact-line:last-child { margin-bottom:0; }.facility-contact-label { font-weight:900; }.omic-facility-contact-card { display:none; margin-top:12px; border-color:var(--cyan) !important; }.omic-facility-contact-card .card-title,.omic-facility-contact-card .card-value { color:var(--cyan) !important; }.facility-open,.facility-closed { transition:box-shadow .15s ease,border-color .15s ease; }`; document.head.appendChild(style); }

  function renderFacility(value) {
    makeFacilityCard(); makeFacilityStyles(); const card = document.getElementById("facilityContactCard"), output = document.getElementById("facilityContact"); if (!card || !output) return;
    const facility = getFacilityForAirport(value); if (!facility) { card.style.display = "none"; output.textContent = "—"; resetStatus(card); return; }
    const lines = facilityLines(facility); output.innerHTML = lines.length ? lines.map(function (line) { return '<div class="facility-contact-line"><span class="facility-contact-label">' + escapeHtml(line[0]) + ':</span> ' + escapeHtml(line[1]) + '</div>'; }).join("") : "Facility record found"; card.style.display = "block"; applyClearanceStatus(value, facility, "facilityContactCard", true);
  }

  function renderOmicFacility(value) {
    makeFacilityStyles(); const page = document.getElementById("omicPage"), grid = page && page.querySelector(".omic-output-grid"); if (!grid) return;
    let card = document.getElementById("omicFacilityContactCard"); if (!card) { card = document.createElement("div"); card.id = "omicFacilityContactCard"; card.className = "card omic-facility-contact-card"; card.innerHTML = '<div class="card-title">FACILITY / CLEARANCE CONTACT</div><div id="omicFacilityContact" class="card-value">—</div>'; grid.appendChild(card); }
    const output = document.getElementById("omicFacilityContact"), facility = getFacilityForAirport(value); if (!facility) { card.style.display = "none"; output.textContent = "—"; resetStatus(card); return; }
    output.innerHTML = facilityLines(facility).map(function (line) { return '<div class="facility-contact-line"><span class="facility-contact-label">' + escapeHtml(line[0]) + ':</span> ' + escapeHtml(line[1]) + '</div>'; }).join("") || "Facility record found"; card.style.display = "block"; applyClearanceStatus(value, facility, "omicFacilityContactCard", false);
  }

  function init() {
    makeFacilityCard(); makeFacilityStyles(); const input = document.getElementById("airportInput");
    if (input) { input.addEventListener("input", function () { renderFacility(input.value); setTimeout(function () { renderFacility(input.value); }, 0); }, true); input.addEventListener("change", function () { renderFacility(input.value); setTimeout(function () { renderFacility(input.value); }, 0); }, true); }
    const omicInput = document.getElementById("omicInput"); if (omicInput) { omicInput.addEventListener("input", function () { renderOmicFacility(omicInput.value); }, true); omicInput.addEventListener("change", function () { renderOmicFacility(omicInput.value); }, true); }
    window.addEventListener("zfw-facilities-updated", function () { renderFacility(input ? input.value : ""); renderOmicFacility(omicInput ? omicInput.value : ""); });
    setTimeout(function () { renderFacility(input ? input.value : ""); renderOmicFacility(omicInput ? omicInput.value : ""); }, 0);
    setInterval(function () { if (input && input.value) renderFacility(input.value); if (omicInput && omicInput.value) renderOmicFacility(omicInput.value); }, 30000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();