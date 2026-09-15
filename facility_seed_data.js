// Initial facility records supplied for the ZFW FDU Airport Locator.
// These are facility records and do not replace or amend existing airport/D10 data.
(function () {
  "use strict";

  window.ZFW_FACILITY_DATA = window.ZFW_FACILITY_DATA || { records: {} };
  window.ZFW_FACILITY_DATA.records = window.ZFW_FACILITY_DATA.records || {};

  const INITIAL_FACILITIES = {
    FTW: {
      identifier: "FTW",
      record_type: "FACILITY",
      data_category: "facility_contacts",
      facility_name: "FTW Tower / ATCT",
      facility_type: "Tower / ATCT",
      controlling_facility: "",
      sector: "",
      area: "",
      clearance_contact: "XXX-XXX-XXXX",
      phone: "XXX-XXX-XXXX",
      hours: ["24 x 7"],
      vscs: "362/76",
      frequency: "1XX.XX",
      airports: ["FTW"],
      notes: "",
      active: true
    },
    AFW: {
      identifier: "AFW",
      record_type: "FACILITY",
      data_category: "facility_contacts",
      facility_name: "AFW Tower / ATCT",
      facility_type: "Tower / ATCT",
      controlling_facility: "",
      sector: "",
      area: "",
      clearance_contact: "XXX-XXX-XXXX",
      phone: "XXX-XXX-XXXX",
      hours: ["24 x 7"],
      vscs: "362/60",
      frequency: "1XX.XX",
      airports: ["AFW"],
      notes: "",
      active: true
    },
    ADS: {
      identifier: "ADS",
      record_type: "FACILITY",
      data_category: "facility_contacts",
      facility_name: "ADS Tower / ATCT",
      facility_type: "Tower / ATCT",
      controlling_facility: "",
      sector: "",
      area: "",
      clearance_contact: "XXX-XXX-XXXX",
      phone: "XXX-XXX-XXXX",
      hours: ["Closed 10:00 pm - 6:00 am local"],
      vscs: "358/27",
      frequency: "1XX.XX",
      airports: ["ADS"],
      notes: "",
      active: true
    }
  };

  Object.keys(INITIAL_FACILITIES).forEach(function (ident) {
    if (!window.ZFW_FACILITY_DATA.records[ident]) {
      window.ZFW_FACILITY_DATA.records[ident] = INITIAL_FACILITIES[ident];
    }
  });
})();

// Loaded after the main app so 3-letter airport identifiers always have both
// bare and K-prefixed lookup aliases. This is deliberately generic and does
// not contain a HOT-specific exception.
import("./airport_lookup_collision_fix.js?v=" + Date.now()).catch(function (error) {
  console.warn("Could not load airport identifier collision fix:", error.message || error);
});
