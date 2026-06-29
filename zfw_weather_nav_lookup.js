(function(){
  "use strict";

  let lastLookupIdent = "";
  let lastDisplayedWx = "";
  let lastDisplayedTitle = "";
  let lastFoundWasNav = false;
  let lastFoundRecord = null;

  function normalizeIdent(value){ return String(value || "").trim().toUpperCase(); }

  function isCompleteLookupIdent(ident){
    ident = normalizeIdent(ident);
    return /^[A-Z0-9]{3}$/.test(ident) || /^K[A-Z0-9]{3}$/.test(ident) || /^[A-Z0-9]{4}$/.test(ident) || /^[A-Z0-9]{5}$/.test(ident);
  }

  function ensureAirportData(){
    if(!window.AIRPORT_DATA) window.AIRPORT_DATA = { records: {} };
    if(!window.AIRPORT_DATA.records) window.AIRPORT_DATA.records = {};
    return window.AIRPORT_DATA.records;
  }

  function isNavType(record){
    const type = String(record?.record_type || record?.type || "").toUpperCase();
    return ["NAVAID","WAYPOINT","FIX","VOR","VORTAC","NDB"].includes(type);
  }

  function isAirportRecord(record){
    if(!record) return false;
    const type = String(record.record_type || record.type || "").toUpperCase();
    if(type === "AIRPORT") return true;
    if(isNavType(record)) return false;
    return !!((Array.isArray(record.apps) && record.apps.length) || (Array.isArray(record.sectors) && record.sectors.length) || (Array.isArray(record.contacts) && record.contacts.length) || (Array.isArray(record.hours) && record.hours.length));
  }

  function clone(record){ return JSON.parse(JSON.stringify(record || {})); }

  function baseAirportIdent(ident){
    ident = normalizeIdent(ident);
    if(ident.length === 4 && ident.startsWith("K")) return ident.slice(1);
    return ident;
  }

  function airportRecordForSameIdent(ident){
    const records = ensureAirportData();
    const base = baseAirportIdent(ident);
    if(!/^[A-Z0-9]{3}$/.test(base)) return null;

    const kIdent = "K" + base;
    if(records[kIdent] && isAirportRecord(records[kIdent])) return records[kIdent];
    if(records[base] && isAirportRecord(records[base])) return records[base];

    return null;
  }

  function navRecordExistsForSameIdent(ident){
    const records = ensureAirportData();
    const navData = sourceNavData();
    const base = baseAirportIdent(ident);
    if(!/^[A-Z0-9]{3}$/.test(base)) return false;

    if(navData[base] || navData["K" + base]) return true;
    return Boolean(records[base] && isNavType(records[base]));
  }

  function isSharedAirportNavIdent(ident){
    return Boolean(airportRecordForSameIdent(ident) && navRecordExistsForSameIdent(ident));
  }

  function airportWeatherForIdent(ident){
    const base = baseAirportIdent(ident);
    const airportRecord = airportRecordForSameIdent(ident);

    if(airportRecord && airportRecord.nearest_wx){
      const wx = normalizeIdent(airportRecord.nearest_wx);
      return {
        id: wx,
        title: wx === base
          ? "Airport identifier also serves as the weather reporting station."
          : "Nearest weather reporting station assigned for this airport/navaid identifier."
      };
    }

    const station = weatherStationCandidates().find(item => {
      const sid = normalizeIdent(item.id);
      return sid === base || normalizeIdent("K" + sid) === normalizeIdent(ident);
    });

    if(station){
      return {
        id: base,
        title: "Airport identifier also serves as the weather reporting station."
      };
    }

    return null;
  }

  function airportWeatherIdForIdent(ident){
    const wx = airportWeatherForIdent(ident);
    return wx ? wx.id : "";
  }


  const BUILT_IN_ADJACENT_WEATHER = {
    MON: { id: "LLQ", title: "MON is outside ZFW in ZME. Stored nearest weather reporting station." },
    LLQ: { id: "LLQ", title: "LLQ is outside ZFW in ZME. Stored nearest weather reporting station." },
    KLLQ: { id: "LLQ", title: "LLQ is outside ZFW in ZME. Stored nearest weather reporting station." }
  };

  function adjacentWeatherForIdent(ident){
    const store = window.ZFW_ADJACENT_ARTCC_AIRPORTS || {};
    const airports = store.airports || {};
    ident = normalizeIdent(ident);

    if(BUILT_IN_ADJACENT_WEATHER[ident]) return BUILT_IN_ADJACENT_WEATHER[ident];

    const aliases = [ident];
    if(/^K[A-Z0-9]{3}$/.test(ident)) aliases.push(ident.slice(1));
    else if(/^[A-Z0-9]{3}$/.test(ident)) aliases.push("K" + ident);

    for(const alias of [...new Set(aliases)]){
      const rec = airports[alias];
      if(rec && rec.nearest_wx){
        return {
          id: normalizeIdent(rec.nearest_wx),
          title: (rec.name || alias) + " is outside ZFW. Stored nearest weather reporting station."
        };
      }
    }

    return null;
  }

  function getRecord(ident){
    const records = ensureAirportData();
    ident = normalizeIdent(ident);

    if(!isCompleteLookupIdent(ident)) return null;

    if(ident.length === 4 && ident.startsWith("K")){
      const stripped = ident.slice(1);

      if(records[ident] && isAirportRecord(records[ident])) return records[ident];
      if(records[stripped]) return records[stripped];
      if(records[ident]) return records[ident];

      return null;
    }

    if(ident.length === 3){
      const kIdent = "K" + ident;

      // Airport records win when a valid K-airport exists, which prevents
      // airport/NAVAID duplicates like SPS from being treated as the navaid.
      if(records[kIdent] && isAirportRecord(records[kIdent])) return records[kIdent];

      if(records[ident]) return records[ident];
      if(records[kIdent]) return records[kIdent];

      return null;
    }

    if(ident.length === 4){
      if(records[ident]) return records[ident];
      return null;
    }

    if(ident.length === 5){
      if(records[ident]) return records[ident];
      return null;
    }

    return null;
  }

  function mergeUnique(base, add){
    const out = Array.isArray(base) ? base.slice() : [];
    (Array.isArray(add) ? add : []).forEach(item => { if(item && !out.includes(item)) out.push(item); });
    return out;
  }

  function normalizeNavRecord(ident, source){
    const rec = clone(source);
    rec.sectors = Array.isArray(rec.sectors) ? rec.sectors : [];
    rec.areas = Array.isArray(rec.areas) ? rec.areas : [];
    rec.apps = Array.isArray(rec.apps) ? rec.apps : [];
    rec.vscs = Array.isArray(rec.vscs) ? rec.vscs : [];
    rec.contacts = Array.isArray(rec.contacts) ? rec.contacts : [];
    rec.hours = Array.isArray(rec.hours) ? rec.hours : [];
    rec.airport_name = rec.airport_name || rec.name || (ident + " NAVAID");
    if(rec.lat !== undefined) rec.lat = Number(rec.lat);
    if(rec.lon !== undefined) rec.lon = Number(rec.lon);
    if(rec.nearest_wx) rec.nearest_wx = normalizeIdent(rec.nearest_wx);
    if(!rec.record_type) rec.record_type = "NAVAID";
    return rec;
  }

  function sourceNavData(){
    return Object.assign({}, window.ZFW_NAV_DATA || {}, window.ZFW_SUPPLEMENTAL_NAVAIDS || {}, window.ZFW_SUPPLEMENTAL_WAYPOINTS || {});
  }

  function mergeNavData(){
    const records = ensureAirportData();
    const navData = sourceNavData();

    Object.keys(navData).forEach(rawIdent => {
      let ident = normalizeIdent(rawIdent);
      if(!ident) return;
      if(ident.length === 4 && ident.startsWith("K")) ident = ident.slice(1);

      const nav = normalizeNavRecord(ident, navData[rawIdent]);

      if(records[ident]){
        const existing = records[ident];
        const existingIsAirport = isAirportRecord(existing);

        const existingName = existing.airport_name || existing.name || ident;
        const navName = nav.airport_name || nav.name || ident;
        if(navName && existingName && existingName !== navName && !existingName.includes(navName)){
          existing.airport_name = existingName + " / " + navName;
        }

        if(existingIsAirport){
          existing.record_type = "AIRPORT";
          if(nav.nearest_wx && !existing.nearest_wx) existing.nearest_wx = nav.nearest_wx;
          if(!Number.isFinite(existing.lat) && Number.isFinite(nav.lat)) existing.lat = nav.lat;
          if(!Number.isFinite(existing.lon) && Number.isFinite(nav.lon)) existing.lon = nav.lon;
        } else {
          existing.sectors = mergeUnique(existing.sectors, nav.sectors);
          existing.areas = mergeUnique(existing.areas, nav.areas);
          existing.apps = mergeUnique(existing.apps, nav.apps);
          existing.vscs = mergeUnique(existing.vscs, nav.vscs);
          existing.contacts = mergeUnique(existing.contacts, nav.contacts);
          existing.hours = mergeUnique(existing.hours, nav.hours);
          if(!Number.isFinite(existing.lat) && Number.isFinite(nav.lat)) existing.lat = nav.lat;
          if(!Number.isFinite(existing.lon) && Number.isFinite(nav.lon)) existing.lon = nav.lon;
          if(nav.nearest_wx) existing.nearest_wx = nav.nearest_wx;
          existing.record_type = existing.record_type || nav.record_type || "NAVAID";
        }
      } else {
        records[ident] = nav;
      }

      const fakeK = "K" + ident;
      if(records[fakeK] && !isAirportRecord(records[fakeK])) delete records[fakeK];
    });
  }

  function toRad(deg){ return deg * Math.PI / 180; }
  function nmBetween(aLat, aLon, bLat, bLon){
    const R = 3440.065, dLat = toRad(bLat-aLat), dLon = toRad(bLon-aLon);
    const lat1 = toRad(aLat), lat2 = toRad(bLat);
    const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
    return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
  }

  function weatherStationCandidates(){
    const stations = window.ZFW_WEATHER_STATIONS || [];
    const seen = new Set();
    const candidates = [];

    stations.forEach(station => {
      const id = normalizeIdent(station.id);
      const lat = Number(station.lat);
      const lon = Number(station.lon);

      if(!id || !Number.isFinite(lat) || !Number.isFinite(lon)) return;
      if(seen.has(id)) return;

      seen.add(id);
      candidates.push({
        id,
        name: station.name || "",
        lat,
        lon,
        source: "weather"
      });
    });

    return candidates;
  }

  function stationNameById(id){
    id = normalizeIdent(id);
    const match = weatherStationCandidates().find(station => {
      const sid = normalizeIdent(station.id);
      return sid === id || normalizeIdent("K" + sid) === id;
    });
    return match ? (match.name || "") : "";
  }

  function calculateNearest(record){
    if(!record) return null;

    if(record.nearest_wx){
      const id = normalizeIdent(record.nearest_wx);
      return {
        id,
        title: stationNameById(id) || "Stored nearest weather reporting station"
      };
    }

    const lat = Number(record.lat);
    const lon = Number(record.lon);
    const stations = weatherStationCandidates();

    if(Number.isFinite(lat) && Number.isFinite(lon) && stations.length){
      let best = null;

      stations.forEach(station => {
        const distanceNm = nmBetween(lat, lon, station.lat, station.lon);
        if(!best || distanceNm < best.distanceNm){
          best = {
            id: normalizeIdent(station.id),
            name: station.name || "",
            distanceNm
          };
        }
      });

      if(best){
        return {
          id: best.id,
          title: best.name
            ? best.name + " — " + best.distanceNm.toFixed(1) + " NM calculated nearest"
            : best.distanceNm.toFixed(1) + " NM calculated nearest"
        };
      }
    }

    return null;
  }

  function forceStatus(text){
    const status = document.getElementById("status");
    if(status){
      status.textContent = text;
      status.classList.remove("error", "not-found");
      status.style.color = "";
    }
  }

  function statusLooksBad(){
    const status = document.getElementById("status");
    if(!status) return false;
    const txt = normalizeIdent(status.textContent);
    return txt.includes("NO MATCH") || txt.includes("NOT FOUND") || txt.includes("NO RECORD");
  }

  function nearestWeatherCard(){
    return document.getElementById("nearestWeatherCard") || document.getElementById("nearestWeather")?.closest(".card");
  }

  function setNearestHighlight(on){
    const card = nearestWeatherCard();
    if(!card) return;
    if(on){
      card.classList.add("nearest-wx-highlight");
      card.style.borderColor = "var(--green)";
      card.style.boxShadow = "";
    } else {
      card.classList.remove("nearest-wx-highlight");
      card.style.borderColor = "";
      card.style.boxShadow = "";
    }
  }

  function injectHighlightStyle(){
    if(document.getElementById("nearestWxHighlightStyle")) return;
    const style = document.createElement("style");
    style.id = "nearestWxHighlightStyle";
    style.textContent = `@keyframes zfwNearestWxPulseGlow{0%,100%{box-shadow:0 0 0 2px rgba(65,209,125,.28),0 0 10px rgba(65,209,125,.22)}50%{box-shadow:0 0 0 5px rgba(65,209,125,.58),0 0 26px rgba(65,209,125,.56)}}.nearest-wx-highlight{border-color:var(--green)!important;animation:zfwNearestWxPulseGlow 2.2s ease-in-out infinite!important}.nearest-wx-highlight .card-title,.nearest-wx-highlight .card-value{color:var(--green)!important}`;
    document.head.appendChild(style);
  }

  function hideMapForNav(record){
    const mapCard = document.querySelector(".map-card") || document.getElementById("zfwMap")?.closest(".card");
    if(mapCard) mapCard.style.display = (record && isNavType(record)) ? "none" : "";
  }

  function clearAirportOutputsForNav(record){
    if(!record || !isNavType(record)) return;

    const idsToClear = [
      "sector",
      "area",
      "approach",
      "vscs",
      "contact",
      "hours",
      "appVscs",
      "appContact",
      "appHours"
    ];

    idsToClear.forEach(id => {
      const el = document.getElementById(id);
      if(!el) return;

      el.textContent = "—";
      el.innerHTML = "—";
      el.title = "";
      el.style.color = "";
      el.classList.remove("red-text", "green-text", "amber-text", "cyan-text", "omic-green-text", "omic-red-text");

      const card = el.closest(".card");
      if(card){
        card.classList.remove(
          "nearest-wx-highlight",
          "highlight",
          "active",
          "warning",
          "primary",
          "omic-green-highlight",
          "omic-red-highlight"
        );
        card.style.background = "";
        card.style.borderColor = "";
        card.style.boxShadow = "";

        const title = card.querySelector(".card-title");
        if(title) title.style.color = "";
      }
    });

    const nameEl = document.getElementById("airportName");
    if(nameEl){
      nameEl.textContent = record.airport_name || record.name || lastLookupIdent || "Navaid/Waypoint";
      nameEl.classList.remove("red-text", "green-text", "amber-text");
      nameEl.classList.add("cyan-text");
    }

    document.querySelectorAll(".card").forEach(card => {
      const isNearest = card.contains(document.getElementById("nearestWeather"));
      if(!isNearest){
        card.classList.remove(
          "nearest-wx-highlight",
          "highlight",
          "active",
          "warning",
          "primary",
          "omic-green-highlight",
          "omic-red-highlight"
        );
        card.style.background = "";
        card.style.borderColor = "";
        card.style.boxShadow = "";

        card.querySelectorAll(".card-value").forEach(value => {
          value.classList.remove("red-text", "green-text", "amber-text", "cyan-text", "omic-green-text", "omic-red-text");
          value.style.color = "";
        });

        const title = card.querySelector(".card-title");
        if(title) title.style.color = "";
      }
    });

    hideMapForNav(record);
  }


  function clearInputAfterLookup(){
    const input = document.getElementById("airportInput");
    if(!input) return;
    if(!normalizeIdent(input.value)) return;
    setTimeout(() => { input.value = ""; }, 650);
  }

  function writeNearest(output, nearest, ident, record){
    output.textContent = nearest.id;
    output.title = nearest.title || "";
    lastLookupIdent = ident || lastLookupIdent;
    lastDisplayedWx = nearest.id;
    lastDisplayedTitle = nearest.title || "";
    lastFoundWasNav = isNavType(record);
    lastFoundRecord = record || null;

    if(isNavType(record)){
      forceStatus((ident || lastLookupIdent || "SEARCH") + " found");
      clearAirportOutputsForNav(record);
      setNearestHighlight(true);
      hideMapForNav(record);
      clearInputAfterLookup();
    } else {
      setNearestHighlight(false);
      hideMapForNav(record);
    }
  }

  function restoreLast(output){
    if(!lastDisplayedWx) return false;
    output.textContent = lastDisplayedWx;
    output.title = lastDisplayedTitle || "";
    if(lastFoundWasNav){
      forceStatus((lastLookupIdent || "SEARCH") + " found");
      clearAirportOutputsForNav(lastFoundRecord);
      setNearestHighlight(true);
      hideMapForNav(lastFoundRecord);
    }
    return true;
  }

  function updateNearestWeather(){
    const input = document.getElementById("airportInput");
    const output = document.getElementById("nearestWeather");
    if(!input || !output) return;

    const typedIdent = normalizeIdent(input.value);
    if(!typedIdent){
      restoreLast(output);
      if(lastFoundWasNav && statusLooksBad()) forceStatus((lastLookupIdent || "SEARCH") + " found");
      return;
    }

    if(!isCompleteLookupIdent(typedIdent)){
      if(!restoreLast(output)){
        output.textContent = "—";
        output.title = "";
      }
      return;
    }

    const adjacentWeather = adjacentWeatherForIdent(typedIdent);
    if(adjacentWeather){
      output.textContent = adjacentWeather.id;
      output.title = adjacentWeather.title || "";
      lastLookupIdent = typedIdent;
      lastDisplayedWx = adjacentWeather.id;
      lastDisplayedTitle = adjacentWeather.title || "";
      lastFoundWasNav = false;
      lastFoundRecord = null;
      setNearestHighlight(true);
      return;
    }

    const record = getRecord(typedIdent);

    if(isSharedAirportNavIdent(typedIdent)){
      const airportWx = airportWeatherForIdent(typedIdent);
      if(airportWx){
        output.textContent = airportWx.id;
        output.title = airportWx.title || "";
        lastLookupIdent = typedIdent;
        lastDisplayedWx = airportWx.id;
        lastDisplayedTitle = airportWx.title || "";
        lastFoundWasNav = false;
        lastFoundRecord = null;
        setNearestHighlight(false);
        hideMapForNav(null);
        return;
      }
    }

    if(record && isNavType(record)){ forceStatus(typedIdent + " found"); clearAirportOutputsForNav(record); }

    const nearest = calculateNearest(record);
    if(!nearest){
      if(!record && lastFoundWasNav && lastDisplayedWx){ restoreLast(output); return; }
      output.textContent = "—";
      output.title = "No nearest weather reporting station assigned.";
      lastDisplayedWx = "";
      lastDisplayedTitle = "";
      lastFoundWasNav = false;
      lastFoundRecord = null;
      setNearestHighlight(false);
      hideMapForNav(record);
      return;
    }

    writeNearest(output, nearest, typedIdent, record);
  }

  function scheduleUpdate(){
    const scheduledIdent = normalizeIdent(document.getElementById("airportInput")?.value || "");
    [0,100,300,700,1200].forEach(t => setTimeout(() => {
      const currentIdent = normalizeIdent(document.getElementById("airportInput")?.value || "");
      if(scheduledIdent && currentIdent && currentIdent !== scheduledIdent) return;
      updateNearestWeather();
    }, t));
  }

  function wire(){
    injectHighlightStyle();
    mergeNavData();

    const input = document.getElementById("airportInput");
    if(input) ["input","change","keyup","blur"].forEach(evt => input.addEventListener(evt, scheduleUpdate));

    setInterval(() => {
      const input = document.getElementById("airportInput");
      const output = document.getElementById("nearestWeather");
      if(!input || !output) return;
      const typedIdent = normalizeIdent(input.value);
      const outText = normalizeIdent(output.textContent);
      if(typedIdent) updateNearestWeather();
      else {
        if(lastDisplayedWx && (!outText || outText === "—")) restoreLast(output);
        if(lastFoundWasNav && statusLooksBad()) forceStatus((lastLookupIdent || "SEARCH") + " found");
        if(lastFoundWasNav) clearAirportOutputsForNav(lastFoundRecord);
      }
    }, 250);

    scheduleUpdate();
  }


  function updateNearestWeatherForIdent(identifier){
    const input = document.getElementById("airportInput");
    const output = document.getElementById("nearestWeather");
    if(!output) return;

    const typedIdent = normalizeIdent(identifier || (input ? input.value : ""));
    if(!typedIdent || !isCompleteLookupIdent(typedIdent)) return;

    const adjacentWeather = adjacentWeatherForIdent(typedIdent);
    if(adjacentWeather){
      output.textContent = adjacentWeather.id;
      output.title = adjacentWeather.title || "";
      lastLookupIdent = typedIdent;
      lastDisplayedWx = adjacentWeather.id;
      lastDisplayedTitle = adjacentWeather.title || "";
      lastFoundWasNav = false;
      lastFoundRecord = null;
      setNearestHighlight(true);
      return;
    }

    const record = getRecord(typedIdent);

    if(isSharedAirportNavIdent(typedIdent)){
      const airportWx = airportWeatherForIdent(typedIdent);
      if(airportWx){
        output.textContent = airportWx.id;
        output.title = airportWx.title || "";
        lastLookupIdent = typedIdent;
        lastDisplayedWx = airportWx.id;
        lastDisplayedTitle = airportWx.title || "";
        lastFoundWasNav = false;
        lastFoundRecord = null;
        setNearestHighlight(false);
        hideMapForNav(null);
        return;
      }
    }

    const nearest = calculateNearest(record);
    if(!nearest) return;

    writeNearest(output, nearest, typedIdent, record);
  }

  window.ZFW_UPDATE_NEAREST_WX = updateNearestWeather;
  window.ZFW_MERGE_NAV_DATA = mergeNavData;

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();
})();


/* Navaid / waypoint entry protection */
(function () {
  "use strict";

  function normalizeIdent(value) {
    return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  function isCompleteLookupIdent(value) {
    const ident = normalizeIdent(value);
    return /^[A-Z0-9]{3}$/.test(ident) ||
      /^K[A-Z0-9]{3}$/.test(ident) ||
      /^[A-Z0-9]{4}$/.test(ident) ||
      /^[A-Z0-9]{5}$/.test(ident);
  }

  function airportRecords() {
    return (window.AIRPORT_DATA && window.AIRPORT_DATA.records) || {};
  }

  function navSources() {
    return Object.assign(
      {},
      window.ZFW_NAV_DATA || {},
      window.ZFW_SUPPLEMENTAL_NAVAIDS || {},
      window.ZFW_SUPPLEMENTAL_WAYPOINTS || {}
    );
  }

  function recordType(record) {
    return String(record && (record.record_type || record.type) || "").toUpperCase();
  }

  function isAirportRecord(record) {
    const type = recordType(record);
    if (type === "AIRPORT") return true;
    if (["NAVAID", "WAYPOINT", "FIX", "VOR", "VORTAC", "NDB"].includes(type)) return false;

    return Boolean(
      record &&
      (
        (Array.isArray(record.sectors) && record.sectors.length) ||
        (Array.isArray(record.apps) && record.apps.length) ||
        (Array.isArray(record.contacts) && record.contacts.length) ||
        (Array.isArray(record.hours) && record.hours.length)
      )
    );
  }

  function isNavRecord(record) {
    const type = recordType(record);
    return ["NAVAID", "WAYPOINT", "FIX", "VOR", "VORTAC", "NDB"].includes(type);
  }

  function findNavOnlyRecord(identifier) {
    let ident = normalizeIdent(identifier);
    if (!isCompleteLookupIdent(ident)) return null;

    if (ident.length === 4 && ident.startsWith("K")) {
      ident = ident.slice(1);
    }

    const records = airportRecords();
    const sources = navSources();
    const kIdent = ident.length === 3 ? "K" + ident : "";

    // Airport identifiers must continue to win when an airport and navaid share the same ID.
    if (kIdent && isAirportRecord(records[kIdent])) return null;
    if (isAirportRecord(records[ident])) return null;

    if (sources[ident]) {
      return { ident: ident, record: sources[ident] };
    }

    if (records[ident] && isNavRecord(records[ident])) {
      return { ident: ident, record: records[ident] };
    }

    return null;
  }

  function handleNavEntry(event) {
    const input = event && event.target;
    if (!input || input.id !== "airportInput") return;

    const ident = normalizeIdent(input.value);
    const found = findNavOnlyRecord(ident);
    if (!found) return;

    // Stop the airport-only FDCS lookup from converting 3-letter navaids into K-airport
    // searches and marking them "not found".
    if (event.preventDefault) event.preventDefault();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    else if (event.stopPropagation) event.stopPropagation();

    input.value = found.ident;

    if (window.ZFW_MERGE_NAV_DATA) {
      try { window.ZFW_MERGE_NAV_DATA(); } catch (error) {}
    }

    if (window.ZFW_UPDATE_NEAREST_WX_FOR_IDENT) {
      window.ZFW_UPDATE_NEAREST_WX_FOR_IDENT(found.ident);
    }

    setTimeout(function () {
      if (window.ZFW_UPDATE_NEAREST_WX_FOR_IDENT) {
        window.ZFW_UPDATE_NEAREST_WX_FOR_IDENT(found.ident);
      }
    }, 75);

    setTimeout(function () {
      if (window.ZFW_UPDATE_NEAREST_WX_FOR_IDENT) {
        window.ZFW_UPDATE_NEAREST_WX_FOR_IDENT(found.ident);
      }
    }, 250);
  }

  function bindNavaidEntryProtection() {
    const input = document.getElementById("airportInput");
    if (!input || input.dataset.navaidEntryProtectionBound === "true") return;

    input.dataset.navaidEntryProtectionBound = "true";
    ["input", "change", "keyup"].forEach(function (eventName) {
      input.addEventListener(eventName, handleNavEntry, true);
    });
  }

  function boot() {
    bindNavaidEntryProtection();

    let runs = 0;
    const timer = setInterval(function () {
      bindNavaidEntryProtection();
      runs += 1;
      if (runs > 40) clearInterval(timer);
    }, 250);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

