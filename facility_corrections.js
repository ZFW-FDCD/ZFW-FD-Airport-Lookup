(function () {
  "use strict";

  const STORAGE_KEY = "zfwFacilityCorrections";

  const FACILITY_TYPES = [
    "TRACON",
    "ARTCC",
    "Tower / ATCT",
    "Tower with Radar",
    "Combined Tower/TRACON",
    "FCT — Federal Contract Tower",
    "RAPCON",
    "CERAP",
    "Other"
  ];

  function normalizeIdent(value) {
    return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  }

  function getFacilityData() {
    if (!window.ZFW_FACILITY_DATA) window.ZFW_FACILITY_DATA = { records: {} };
    if (!window.ZFW_FACILITY_DATA.records) window.ZFW_FACILITY_DATA.records = {};
    return window.ZFW_FACILITY_DATA;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value || {}));
  }

  function loadCorrections() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (error) {
      console.warn("Could not read facility corrections.", error);
      return {};
    }
  }

  function saveCorrections(corrections) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(corrections));
  }

  function applyFacilityRecord(ident, record) {
    ident = normalizeIdent(ident);
    if (!ident) return;
    const clean = clone(record);
    clean.identifier = ident;
    clean.record_type = "FACILITY";
    getFacilityData().records[ident] = clean;
    window.dispatchEvent(new CustomEvent("zfw-facilities-updated"));
  }

  function findFacility(ident) {
    return getFacilityData().records[normalizeIdent(ident)] || null;
  }

  function splitList(value) {
    return String(value || "")
      .split(/[,\n;]/)
      .map(function (item) { return item.trim(); })
      .filter(Boolean);
  }

  function getValue(form, name) {
    const element = form.elements[name] || form.querySelector('[name="' + name + '"]');
    return element ? String(element.value || "").trim() : "";
  }

  function setValue(form, name, value) {
    const element = form.elements[name] || form.querySelector('[name="' + name + '"]');
    if (element) element.value = value || "";
  }

  function showMessage(message, isError) {
    const element = document.getElementById("facilityMessage");
    if (!element) return;
    element.textContent = message;
    element.className = isError ? "correction-message error" : "correction-message";
  }

  function clearForm(form) {
    Array.from(form.elements).forEach(function (element) {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName)) element.value = "";
      if (element.type === "checkbox") element.checked = false;
    });
  }

  function fillForm(form, ident, record) {
    setValue(form, "identifier", ident);
    setValue(form, "facilityName", record.facility_name);
    setValue(form, "facilityType", record.facility_type);
    setValue(form, "customFacilityType", record.custom_facility_type);
    setValue(form, "controllingFacility", record.controlling_facility);
    setValue(form, "sector", record.sector);
    setValue(form, "area", record.area);
    setValue(form, "clearanceContact", record.clearance_contact);
    setValue(form, "phone", record.phone);
    setValue(form, "hours", Array.isArray(record.hours) ? record.hours.join(", ") : record.hours);
    setValue(form, "vscs", record.vscs);
    setValue(form, "frequency", record.frequency);
    setValue(form, "airports", Array.isArray(record.airports) ? record.airports.join(", ") : record.airports);
    setValue(form, "notes", record.notes);
    const active = form.elements.active;
    if (active) active.checked = record.active !== false;
    toggleCustomType(form);
  }

  function toggleCustomType(form) {
    const type = getValue(form, "facilityType");
    const wrap = form.querySelector("[data-custom-facility-type]");
    if (wrap) wrap.style.display = type === "Custom" ? "block" : "none";
  }

  function makeRecordFromForm(form) {
    const ident = normalizeIdent(getValue(form, "identifier"));
    const type = getValue(form, "facilityType");
    const customType = getValue(form, "customFacilityType");
    const existing = findFacility(ident) || {};
    const record = Object.assign({}, clone(existing), {
      identifier: ident,
      record_type: "FACILITY",
      facility_name: getValue(form, "facilityName"),
      facility_type: type === "Custom" ? (customType || "Other") : type,
      custom_facility_type: customType,
      controlling_facility: getValue(form, "controllingFacility"),
      sector: getValue(form, "sector"),
      area: getValue(form, "area"),
      clearance_contact: getValue(form, "clearanceContact"),
      phone: getValue(form, "phone"),
      hours: splitList(getValue(form, "hours")),
      vscs: getValue(form, "vscs"),
      frequency: getValue(form, "frequency"),
      airports: splitList(getValue(form, "airports")),
      notes: getValue(form, "notes"),
      active: Boolean(form.elements.active && form.elements.active.checked)
    });
    return { ident, record };
  }

  function openModal() {
    const modal = document.getElementById("facilityModal");
    const form = document.getElementById("facilityForm");
    const currentSearch = document.getElementById("airportInput");
    clearForm(form);
    showMessage("", false);
    form.elements.active.checked = true;
    const currentIdent = normalizeIdent(currentSearch ? currentSearch.value : "");
    if (currentIdent && findFacility(currentIdent)) {
      fillForm(form, currentIdent, findFacility(currentIdent));
      showMessage(currentIdent + " loaded from facility records. Amend only the fields that need to change.", false);
    } else if (currentIdent) {
      setValue(form, "identifier", currentIdent);
    }
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("correction-modal-open");
    setTimeout(function () {
      const field = form.elements.identifier;
      if (field) field.focus();
    }, 0);
  }

  function closeModal() {
    const modal = document.getElementById("facilityModal");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("correction-modal-open");
  }

  function bindFacilityButton() {
    const button = document.getElementById("addFacilityButton");
    if (!button || button.dataset.facilityBound === "true") return;
    button.dataset.facilityBound = "true";
    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      openModal();
    }, true);
  }

  function createUi() {
    if (document.getElementById("facilityModal")) {
      bindFacilityButton();
      return;
    }
    const tools = document.getElementById("correctionTools");
    if (tools && !document.getElementById("addFacilityButton")) {
      const button = document.createElement("button");
      button.type = "button";
      button.id = "addFacilityButton";
      button.className = "secondary";
      button.textContent = "Add/Amend Facility";
      tools.appendChild(button);
    }
    const style = document.createElement("style");
    style.textContent = `
      #addFacilityButton { background: #475569 !important; }
      .facility-custom-type { display: none; }
      .facility-status-row { display: flex; align-items: center; gap: 10px; margin-top: 8px; }
      .facility-status-row input { width: auto !important; }
      .facility-status-row label { margin: 0 !important; }
    `;
    document.head.appendChild(style);
    const modal = document.createElement("div");
    modal.id = "facilityModal";
    modal.className = "correction-modal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="correction-panel" role="dialog" aria-modal="true" aria-labelledby="facilityModalTitle">
        <h2 id="facilityModalTitle">Add / Amend Facility</h2>
        <p>Create a reusable facility record for a TRACON, ARTCC, tower, contract tower, or any other operational facility. Existing airport/D10 records are not changed by saving a facility.</p>
        <form id="facilityForm" novalidate>
          <div class="correction-grid">
            <div class="correction-field">
              <label for="facilityIdentifier">Facility ID</label>
              <input id="facilityIdentifier" name="identifier" type="text" maxlength="12" required />
              <div class="correction-help">Examples: FTW, AFW, ADS, D10, or another facility identifier.</div>
            </div>
            <div class="correction-field">
              <label for="facilityName">Facility Name</label>
              <input id="facilityName" name="facilityName" type="text" />
            </div>
            <div class="correction-field">
              <label for="facilityType">Facility Type</label>
              <select id="facilityType" name="facilityType">
                <option value="">Select facility type</option>
                ${FACILITY_TYPES.map(function (type) { return '<option value="' + type.replace(/"/g, '&quot;') + '">' + type + '</option>'; }).join("")}
                <option value="Custom">Custom...</option>
              </select>
            </div>
            <div class="correction-field facility-custom-type" data-custom-facility-type>
              <label for="customFacilityType">Custom Facility Type</label>
              <input id="customFacilityType" name="customFacilityType" type="text" placeholder="Enter your own facility type" />
            </div>
            <div class="correction-field">
              <label for="controllingFacility">Controlling / Associated Facility</label>
              <input id="controllingFacility" name="controllingFacility" type="text" placeholder="Example: D10" />
            </div>
            <div class="correction-field">
              <label for="facilitySector">Sector</label>
              <input id="facilitySector" name="sector" type="text" placeholder="Example: 96 ACT or D10" />
            </div>
            <div class="correction-field">
              <label for="facilityArea">Area</label>
              <input id="facilityArea" name="area" type="text" placeholder="Example: DAL" />
            </div>
            <div class="correction-field">
              <label for="clearanceContact">Clearance Contact</label>
              <input id="clearanceContact" name="clearanceContact" type="text" placeholder="Facility / position / contact identifier" />
            </div>
            <div class="correction-field">
              <label for="facilityPhone">Phone Number</label>
              <input id="facilityPhone" name="phone" type="text" placeholder="Optional" />
            </div>
            <div class="correction-field">
              <label for="facilityHours">Facility Hours</label>
              <input id="facilityHours" name="hours" type="text" placeholder="0000-2359 or 24 x 7" />
            </div>
            <div class="correction-field">
              <label for="facilityVscs">VSCS / ID</label>
              <input id="facilityVscs" name="vscs" type="text" placeholder="Optional" />
            </div>
            <div class="correction-field">
              <label for="facilityFrequency">Frequency</label>
              <input id="facilityFrequency" name="frequency" type="text" placeholder="Optional" />
            </div>
            <div class="correction-field full">
              <label for="facilityAirports">Associated Airports / Identifiers</label>
              <input id="facilityAirports" name="airports" type="text" placeholder="FTW, AFW, ADS" />
              <div class="correction-help">Optional. Separate multiple identifiers with commas. This creates the relationship for future lookup integration without altering existing airport records.</div>
            </div>
            <div class="correction-field full">
              <label for="facilityNotes">Additional Notes</label>
              <textarea id="facilityNotes" name="notes" placeholder="Operational notes, special instructions, or source information."></textarea>
            </div>
            <div class="correction-field full facility-status-row">
              <input id="facilityActive" name="active" type="checkbox" checked />
              <label for="facilityActive">Facility record is active</label>
            </div>
          </div>
          <div id="facilityMessage" class="correction-message"></div>
          <div class="correction-actions">
            <button type="button" class="cancel" id="facilityCancel">Cancel</button>
            <button type="submit" id="facilitySubmit">Save Facility</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    const form = document.getElementById("facilityForm");
    form.elements.facilityType.addEventListener("change", function () { toggleCustomType(form); });
    document.getElementById("facilityCancel").addEventListener("click", closeModal);
    modal.addEventListener("click", function (event) {
      if (event.target === modal) closeModal();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && modal.getAttribute("aria-hidden") === "false") closeModal();
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const result = makeRecordFromForm(form);
      if (!result.ident) {
        showMessage("Facility ID is required.", true);
        return;
      }
      if (!result.record.facility_name) {
        showMessage("Facility name is required.", true);
        return;
      }
      if (!result.record.facility_type) {
        showMessage("Facility type is required. Select a type or choose Custom... and enter one.", true);
        return;
      }
      const corrections = loadCorrections();
      corrections[result.ident] = result.record;
      saveCorrections(corrections);
      applyFacilityRecord(result.ident, result.record);
      if (window.ZFW_SAVE_SHARED_RECORD) {
        window.ZFW_SAVE_SHARED_RECORD("facility_contacts", result.ident, result.record)
          .then(function (saved) {
            showMessage(saved
              ? "Facility saved for all PCs."
              : "Facility saved locally only. Firebase is not configured.", !saved);
          })
          .catch(function (error) {
            console.error(error);
            showMessage("Facility saved locally, but Firestore save failed. Check Firebase config/rules.", true);
          });
      } else {
        showMessage("Facility saved locally only.", false);
      }
      setTimeout(closeModal, 700);
    });
    bindFacilityButton();
  }

  Object.keys(loadCorrections()).forEach(function (ident) {
    applyFacilityRecord(ident, loadCorrections()[ident]);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createUi);
  } else {
    createUi();
  }
})();