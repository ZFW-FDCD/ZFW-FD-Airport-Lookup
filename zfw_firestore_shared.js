// Firestore correction layer for ZFW FDU Airport Locator.
// Starts after the site login succeeds. Shared corrections are applied to all loaded app data.

(function () {
  "use strict";

  const FIREBASE_APP_URL = "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
  const FIREBASE_AUTH_URL = "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
  const FIREBASE_FIRESTORE_URL = "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
  const FIREBASE_TIMEOUT_MS = 8000;

  let startPromise = null;
  let initialized = false;
  let initFailed = false;
  let firestoreApi = null;
  let db = null;

  function normalizeIdent(value) { return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, ""); }
  function clone(value) { return JSON.parse(JSON.stringify(value || {})); }
  function getAirportRecords() { if (!window.AIRPORT_DATA) window.AIRPORT_DATA = { records: {} }; if (!window.AIRPORT_DATA.records) window.AIRPORT_DATA.records = {}; return window.AIRPORT_DATA.records; }
  function getNavData() { if (!window.ZFW_NAV_DATA) window.ZFW_NAV_DATA = {}; return window.ZFW_NAV_DATA; }
  function getAdjacentData() { if (!window.ZFW_ADJACENT_ARTCC_AIRPORTS) window.ZFW_ADJACENT_ARTCC_AIRPORTS = { centers: {}, airports: {} }; window.ZFW_ADJACENT_ARTCC_AIRPORTS.centers = window.ZFW_ADJACENT_ARTCC_AIRPORTS.centers || {}; window.ZFW_ADJACENT_ARTCC_AIRPORTS.airports = window.ZFW_ADJACENT_ARTCC_AIRPORTS.airports || {}; return window.ZFW_ADJACENT_ARTCC_AIRPORTS; }
  function getFacilityData() { if (!window.ZFW_FACILITY_DATA) window.ZFW_FACILITY_DATA = { records: {} }; if (!window.ZFW_FACILITY_DATA.records) window.ZFW_FACILITY_DATA.records = {}; return window.ZFW_FACILITY_DATA; }
  function timeoutPromise(ms) { return new Promise(function (_, reject) { setTimeout(function () { reject(new Error("Firebase connection timed out.")); }, ms); }); }
  function isAirportType(type) { return String(type || "").toLowerCase() === "airport"; }
  function isNonZfwType(type) { const value = String(type || "").toLowerCase(); return value === "non_zfw_airports" || value === "non_zfw_airport" || value === "non-zfw-airports" || value === "non_zfw" || value === "non-zfw"; }
  function isFacilityType(type) { const value = String(type || "").toLowerCase(); return value === "facility_contacts" || value === "facility"; }
  function recordIsNonZfw(record) { if (!record) return false; return isNonZfwType(record.data_category) || isNonZfwType(record.category) || String(record.record_type || "").toUpperCase() === "NON_ZFW_AIRPORT"; }

  function applyRecord(type, ident, record) {
    ident = normalizeIdent(ident); if (!ident) return; record = clone(record);
    if (isFacilityType(type) || String(record.record_type || "").toUpperCase() === "FACILITY") { const clean = clone(record); clean.identifier = ident; clean.record_type = "FACILITY"; getFacilityData().records[ident] = clean; window.dispatchEvent(new CustomEvent("zfw-facilities-updated")); return; }
    const records = getAirportRecords();
    if (isNonZfwType(type) || recordIsNonZfw(record)) { const adjacent = getAdjacentData(); let cleanIdent = ident; if (cleanIdent.length === 4 && cleanIdent.startsWith("K")) cleanIdent = cleanIdent.slice(1); const center = String(record.center || "").toUpperCase(); const cleanRecord = { center: center, name: record.name || record.airport_name || cleanIdent, fdcd: record.fdcd || "" }; adjacent.airports[cleanIdent] = cleanRecord; adjacent.airports["K" + cleanIdent] = cleanRecord; notifyDataChanged(); return; }
    if (isAirportType(type)) { records[ident] = record; if (ident.length === 4 && ident.startsWith("K")) records[ident.slice(1)] = clone(record); else if (ident.length === 3) records["K" + ident] = clone(record); notifyDataChanged(); return; }

    // Navaids/waypoints are a separate entity class from airports. Never write a
    // shared nav correction into AIRPORT_DATA.records, because the two entities
    // can legitimately have the same identifier (for example HOT). Keeping nav
    // corrections in ZFW_NAV_DATA prevents a nav record from overwriting an
    // airport record during Firestore load or live updates.
    let navIdent = ident;
    if (navIdent.length === 4 && navIdent.startsWith("K")) navIdent = navIdent.slice(1);
    record.record_type = record.record_type || record.type || "WAYPOINT";
    record.airport_name = record.airport_name || record.name || navIdent;
    if (record.nearest_wx) record.nearest_wx = normalizeIdent(record.nearest_wx);
    getNavData()[navIdent] = clone(record);
    notifyDataChanged();
  }

  function notifyDataChanged() {
    if (window.ZFW_MERGE_NAV_DATA) { try { window.ZFW_MERGE_NAV_DATA(); } catch (error) { console.warn("Could not merge shared nav data:", error.message || error); } }
    if (window.ZFW_UPDATE_NEAREST_WX) { setTimeout(window.ZFW_UPDATE_NEAREST_WX, 0); setTimeout(window.ZFW_UPDATE_NEAREST_WX, 250); }
    const airportInput = document.getElementById("airportInput"); if (airportInput && airportInput.value) airportInput.dispatchEvent(new Event("input", { bubbles: true }));
    const omicInput = document.getElementById("omicInput"); if (omicInput && omicInput.value) omicInput.dispatchEvent(new Event("input", { bubbles: true }));
    window.dispatchEvent(new CustomEvent("zfw-shared-corrections-updated"));
  }

  async function initFirebase() {
    if (initialized) return true; if (initFailed) return false;
    try {
      if (!window.ZFW_FIREBASE_CONFIG || window.ZFW_FIREBASE_CONFIG.apiKey === "PASTE_API_KEY_HERE") throw new Error("Firebase config missing.");
      const firebaseLoad = Promise.all([import(FIREBASE_APP_URL), import(FIREBASE_AUTH_URL), import(FIREBASE_FIRESTORE_URL)]);
      const modules = await Promise.race([firebaseLoad, timeoutPromise(FIREBASE_TIMEOUT_MS)]);
      const appMod = modules[0], authMod = modules[1], firestoreMod = modules[2];
      const app = appMod.initializeApp(window.ZFW_FIREBASE_CONFIG); const auth = authMod.getAuth(app); db = firestoreMod.getFirestore(app); firestoreApi = firestoreMod;
      await Promise.race([authMod.signInAnonymously(auth), timeoutPromise(FIREBASE_TIMEOUT_MS)]); initialized = true; console.log("ZFW Firebase connected."); return true;
    } catch (error) { initFailed = true; console.warn("ZFW Firebase disabled:", error.message || error); return false; }
  }

  async function loadFacilityScripts() {
    try {
      await import("./facility_corrections.js?v=" + Date.now());
      await import("./facility_seed_data.js?v=" + Date.now());
      await import("./facility_lookup_integration.js?v=" + Date.now());
      return true;
    } catch (error) {
      console.warn("Could not load facility manager/data/integration:", error.message || error);
      return false;
    }
  }

  async function loadSharedCorrections() {
    await loadFacilityScripts();
    const ok = await initFirebase(); if (!ok) return false;
    try {
      const collection = firestoreApi.collection, getDocs = firestoreApi.getDocs;
      const groups = [
        { type: "airport", path: "airports" },
        { type: "navpoint", path: "navpoints" },
        { type: "non_zfw_airports", path: "non_zfw_airports" },
        { type: "facility_contacts", path: "facility_contacts" }
      ];
      for (const group of groups) {
        try {
          const snapshot = await getDocs(collection(db, "zfw_corrections", group.path, "records"));
          snapshot.forEach(function (docSnap) { applyRecord(group.type, docSnap.id, docSnap.data()); });
        } catch (groupError) {
          console.warn("Could not load Firestore correction group " + group.path + ":", groupError.message || groupError);
        }
      }
      return true;
    } catch (error) { console.warn("Could not load Firestore corrections:", error.message || error); return false; }
  }

  function listenForSharedCorrections() {
    initFirebase().then(function (ok) {
      if (!ok) return;
      try {
        const collection = firestoreApi.collection, onSnapshot = firestoreApi.onSnapshot;
        [
          { type: "airport", path: "airports" },
          { type: "navpoint", path: "navpoints" },
          { type: "non_zfw_airports", path: "non_zfw_airports" },
          { type: "facility_contacts", path: "facility_contacts" }
        ].forEach(function (group) {
          onSnapshot(collection(db, "zfw_corrections", group.path, "records"), function (snapshot) { snapshot.docChanges().forEach(function (change) { if (change.type !== "removed") applyRecord(group.type, change.doc.id, change.doc.data()); }); }, function (error) { console.warn("Firestore listener stopped for " + group.path + ":", error.message || error); });
        });
      } catch (error) { console.warn("Could not start Firestore listeners:", error.message || error); }
    });
  }

  async function saveSharedRecord(type, ident, record) {
    ident = normalizeIdent(ident); if (!ident) return false;
    const nonZfw = isNonZfwType(type) || recordIsNonZfw(record); const facility = isFacilityType(type) || String(record && record.record_type || "").toUpperCase() === "FACILITY";
    if (nonZfw) record = Object.assign({}, record, { identifier: ident, record_type: "NON_ZFW_AIRPORT", data_category: "non_zfw_airports" });
    if (facility) record = Object.assign({}, record, { identifier: ident, record_type: "FACILITY", data_category: "facility_contacts" });
    applyRecord(type, ident, record); const ok = await initFirebase(); if (!ok) return false;
    try {
      const doc = firestoreApi.doc, setDoc = firestoreApi.setDoc, serverTimestamp = firestoreApi.serverTimestamp;
      let collectionName = "navpoints"; if (isAirportType(type)) collectionName = "airports"; if (nonZfw) collectionName = "non_zfw_airports"; if (facility) collectionName = "facility_contacts";
      const cleanRecord = clone(record); cleanRecord.identifier = ident; cleanRecord.data_category = nonZfw ? "non_zfw_airports" : (facility ? "facility_contacts" : collectionName); cleanRecord.updated_at = serverTimestamp();
      try { await setDoc(doc(db, "zfw_corrections", collectionName, "records", ident), cleanRecord); return true; }
      catch (firstError) {
        if (facility) {
          console.warn("Facility collection save failed, using existing airports collection:", firstError.message || firstError);
          await setDoc(doc(db, "zfw_corrections", "airports", "records", ident), cleanRecord);
          return true;
        }
        if (!nonZfw) throw firstError;
        console.warn("Primary non-ZFW save failed, trying airports fallback:", firstError.message || firstError);
        await setDoc(doc(db, "zfw_corrections", "airports", "records", ident), cleanRecord);
        return true;
      }
    } catch (error) { console.warn("Could not save Firestore correction:", error.message || error); return false; }
  }

  function startFirebaseAfterLogin() {
    if (startPromise) return startPromise;
    startPromise = loadSharedCorrections().then(function () { listenForSharedCorrections(); return true; });
    return startPromise;
  }

  window.ZFW_START_FIREBASE = startFirebaseAfterLogin;
  window.ZFW_SAVE_SHARED_RECORD = saveSharedRecord;
  window.ZFW_LOAD_SHARED_CORRECTIONS = loadSharedCorrections;
  window.ZFW_APPLY_SHARED_RECORD = applyRecord;
})();
