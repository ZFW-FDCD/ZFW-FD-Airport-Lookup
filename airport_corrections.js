(function () {
  "use strict";

  const STORAGE_KEY = "zfwAirportLocatorCorrections";

  const SECTOR_ALIASES = {
    "LBBL": "LBB 64",
    "LBB L": "LBB 64",
    "LBB-L": "LBB 64",
    "LBB64": "LBB 64",
    "64": "LBB 64",

    "SPSL": "SPS 34",
    "SPS L": "SPS 34",
    "SPS-L": "SPS 34",
    "SPS34": "SPS 34",
    "34": "SPS 34",

    "OKCL": "OKC 35",
    "OKC L": "OKC 35",
    "OKC-L": "OKC 35",
    "OKC35": "OKC 35",
    "35": "OKC 35",

    "UKWL": "UKW 75",
    "UKW L": "UKW 75",
    "UKW-L": "UKW 75",
    "UKW75": "UKW 75",
    "75": "UKW 75",

    "ABIL": "ABI 63",
    "ABI L": "ABI 63",
    "ABI-L": "ABI 63",
    "ABI63": "ABI 63",
    "63": "ABI 63",

    "EDNL": "EDN 62",
    "EDN L": "EDN 62",
    "EDN-L": "EDN 62",
    "EDN62": "EDN 62",
    "62": "EDN 62",

    "MAFL": "MAF 40",
    "MAF L": "MAF 40",
    "MAF-L": "MAF 40",
    "MAF40": "MAF 40",
    "40": "MAF 40",

    "SEAL": "SEA 37",
    "SEA L": "SEA 37",
    "SEA-L": "SEA 37",
    "SEA37": "SEA 37",
    "37": "SEA 37",

    "MLCL": "MLC 38",
    "MLC L": "MLC 38",
    "MLC-L": "MLC 38",
    "MLC38": "MLC 38",
    "38": "MLC 38",

    "FRIL": "FRI 53",
    "FRI L": "FRI 53",
    "FRI-L": "FRI 53",
    "FRI53": "FRI 53",
    "53": "FRI 53",

    "UIML": "UIM 83",
    "UIM L": "UIM 83",
    "UIM-L": "UIM 83",
    "UIM83": "UIM 83",
    "83": "UIM 83",

    "DONL": "DON 29",
    "DON L": "DON 29",
    "DON-L": "DON 29",
    "DON29": "DON 29",
    "29": "DON 29",

    "POSL": "POS 32",
    "POS L": "POS 32",
    "POS-L": "POS 32",
    "POS32": "POS 32",
    "32": "POS 32",

    "ACTL": "ACT 96",
    "ACT L": "ACT 96",
    "ACT-L": "ACT 96",
    "ACT96": "ACT 96",
    "96": "ACT 96",

    "TXKL": "TXK 27",
    "TXK L": "TXK 27",
    "TXK-L": "TXK 27",
    "TXK27": "TXK 27",
    "27": "TXK 27",

    "MLUL": "MLU 30",
    "MLU L": "MLU 30",
    "MLU-L": "MLU 30",
    "MLU30": "MLU 30",
    "30": "MLU 30"
  };

  const SECTOR_TO_AREA = {
    "LBB 64": "RDR",
    "POS 32": "RDR",
    "MAF 40": "JEN",
    "ABI 63": "JEN",
    "EDN 62": "JEN",
    "ACT 96": "DAL",
    "UIM 83": "DAL",
    "TXK 27": "DAL",
    "SPS 34": "UKW",
    "OKC 35": "UKW",
    "UKW 75": "UKW",
    "FRI 53": "BYP",
    "MLC 38": "BYP",
    "SEA 37": "BYP",
    "DON 29": "CQY",
    "MLU 30": "CQY"
  };

  function getRecords() {
    if (!window.AIRPORT_DATA) {
      window.AIRPORT_DATA = { records: {} };
    }
    if (!window.AIRPORT_DATA.records) {
      window.AIRPORT_DATA.records = {};
    }
    return window.AIRPORT_DATA.records;
  }

  function splitList(value) {
    if (!value) return [];
    return String(value)
      .split(/[,\n;]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function dedupe(values) {
    const out = [];
    values.forEach((value) => {
      if (value && !out.includes(value)) out.push(value);
    });
    return out;
  }

  function normalizeIdent(value) {
    return String(value || "").trim().toUpperCase();
  }

  function getFormValue(form, names) {
    const list = Array.isArray(names) ? names : [names];
    for (const name of list) {
      const byElements = form.elements ? form.elements[name] : null;
      const element = byElements || form.querySelector('[name="' + name + '"]');
      if (element && typeof element.value !== "undefined") return element.value || "";
    }
    return "";
  }

  function setFormValue(form, names, value) {
    const list = Array.isArray(names) ? names : [names];
    for (const name of list) {
      const byElements = form.elements ? form.elements[name] : null;
      const element = byElements || form.querySelector('[name="' + name + '"]');
      if (element && typeof element.value !== "undefined") {
        element.value = value || "";
        return;
      }
    }
  }

  function aliasForIdent(ident) {
    ident = normalizeIdent(ident);
    if (ident.length === 4 && ident.startsWith("K")) return ident.slice(1);
    if (ident.length === 3) return "K" + ident;
    return "";
  }

  function lookupRecord(ident) {
    const records = getRecords();
    ident = normalizeIdent(ident);
    if (records[ident]) return { ident, record: records[ident] };

    const alias = aliasForIdent(ident);
    if (alias && records[alias]) return { ident: alias, record: records[alias] };

    return null;
  }

  function makeSectorAliasKey(value) {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, " ")
      .replace(/[^A-Z0-9 ]/g, "")
      .replace(/\s+/g, " ");
  }

  function buildDynamicSectorAliases() {
    const records = getRecords();
    Object.values(records).forEach((record) => {
      (record.sectors || []).forEach((sector) => {
        const clean = String(sector || "").trim().toUpperCase();
        if (!clean) return;

        const numberMatch = clean.match(/\b(\d{2})\b/);
        const nameMatch = clean.match(/^([A-Z]{2,4})/);

        if (numberMatch && !SECTOR_ALIASES[numberMatch[1]]) {
          SECTOR_ALIASES[numberMatch[1]] = clean;
        }

        if (nameMatch) {
          const prefix = nameMatch[1];
          SECTOR_ALIASES[prefix] = clean;
          SECTOR_ALIASES[prefix + "L"] = clean;
          SECTOR_ALIASES[prefix + " L"] = clean;
          SECTOR_ALIASES[prefix + "-" + "L"] = clean;
        }
      });
    });
  }

  function normalizeSector(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";

    const upper = raw.toUpperCase();
    const compact = upper.replace(/[^A-Z0-9]/g, "");
    const spaced = makeSectorAliasKey(upper);

    if (SECTOR_ALIASES[upper]) return SECTOR_ALIASES[upper];
    if (SECTOR_ALIASES[spaced]) return SECTOR_ALIASES[spaced];
    if (SECTOR_ALIASES[compact]) return SECTOR_ALIASES[compact];

    const numberOnly = upper.match(/^\d{2}$/);
    if (numberOnly && SECTOR_ALIASES[numberOnly[0]]) return SECTOR_ALIASES[numberOnly[0]];

    const lFormat = upper.match(/^([A-Z]{2,4})[\s-]*L$/);
    if (lFormat) {
      const key = lFormat[1] + "L";
      if (SECTOR_ALIASES[key]) return SECTOR_ALIASES[key];
    }

    const lNumberFormat = upper.match(/^([A-Z]{2,4})[\s-]*L[\s-]*(\d{2})$/);
    if (lNumberFormat) return lNumberFormat[1] + " " + lNumberFormat[2];

    const sectorFormat = upper.match(/^([A-Z]{2,4})[\s-]*(\d{2})$/);
    if (sectorFormat) return sectorFormat[1] + " " + sectorFormat[2];

    return upper;
  }

  function normalizeSectors(value) {
    return dedupe(splitList(value).map(normalizeSector));
  }

  function normalizeAreas(value, sectors) {
    const direct = splitList(value).map((item) => item.toUpperCase());
    if (direct.length) return dedupe(direct);

    const derived = (sectors || [])
      .map((sector) => SECTOR_TO_AREA[sector])
      .filter(Boolean);

    return dedupe(derived);
  }

  function normalizeApps(value) {
    const noAppValues = new Set([
      "N/A",
      "NA",
      "NONE",
      "NO APP",
      "NO APPROACH",
      "NO APPROACH CONTROL",
      "NIL",
      "-",
      "—"
    ]);

    return dedupe(
      splitList(value).map((item) => {
        let app = item.toUpperCase().trim();
        if (!app || noAppValues.has(app)) return "";
        if (!app.endsWith("APP") && app !== "D10") app += " APP";
        if (app === "D10") app = "D10 APP";
        return app;
      })
    );
  }

  function makeRecordFromForm(form) {
    const ident = normalizeIdent(getFormValue(form, "identifier"));
    const sectors = normalizeSectors(getFormValue(form, ["sectors", "sector"]));
    const areas = normalizeAreas(getFormValue(form, ["areas", "area"]), sectors);
    const apps = normalizeApps(getFormValue(form, ["apps", "app", "approach"]));
    const vscs = splitList(getFormValue(form, "vscs"));
    const contacts = splitList(getFormValue(form, ["contacts", "contact"]));
    const hours = splitList(getFormValue(form, "hours"));

    const latText = String(getFormValue(form, "lat") || "").trim();
    const lonText = String(getFormValue(form, "lon") || "").trim();

    const record = {
      record_type: "AIRPORT",
      sectors,
      areas,
      apps,
      vscs,
      contacts,
      hours,
      airport_name: String(getFormValue(form, "airportName") || "").trim()
    };

    if (latText !== "") {
      const latValue = Number(latText);
      record.lat = Number.isFinite(latValue) ? Math.round(latValue * 10000) / 10000 : NaN;
    }
    if (lonText !== "") {
      const lonValue = Number(lonText);
      record.lon = Number.isFinite(lonValue) ? Math.round(lonValue * 10000) / 10000 : NaN;
    }

    return { ident, record };
  }

  function loadCorrections() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (error) {
      console.warn("Could not read airport corrections.", error);
      return {};
    }
  }

  function saveCorrections(corrections) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(corrections));
  }

  function applyOneCorrection(ident, record) {
    const records = getRecords();
    ident = normalizeIdent(ident);
    const alias = aliasForIdent(ident);

    delete records[ident];
    if (alias) delete records[alias];

    records[ident] = JSON.parse(JSON.stringify(record));

    if (alias) {
      records[alias] = JSON.parse(JSON.stringify(record));
    }
  }

  function applySavedCorrections() {
    buildDynamicSectorAliases();
    const corrections = loadCorrections();
    Object.keys(corrections).forEach((ident) => {
      applyOneCorrection(ident, corrections[ident]);
    });
  }
  const AIRSPACE_SECTOR_REVALIDATIONS = {"08AR":{"sectors":["TXK 27"],"areas":["DAL"]},"0AR8":{"sectors":["TXK 27"],"areas":["DAL"]},"1AR7":{"sectors":["TXK 27"],"areas":["DAL"]},"1OK4":{"sectors":["TXK 27"],"areas":["DAL"]},"2AR7":{"sectors":["TXK 27"],"areas":["DAL"]},"4F7":{"sectors":["TXK 27"],"areas":["DAL"]},"4O4":{"sectors":["TXK 27"],"areas":["DAL"]},"57AR":{"sectors":["TXK 27"],"areas":["DAL"]},"5M8":{"sectors":["TXK 27"],"areas":["DAL"]},"6TE4":{"sectors":["TXK 27"],"areas":["DAL"]},"70XA":{"sectors":["TXK 27"],"areas":["DAL"]},"74XS":{"sectors":["TXK 27"],"areas":["DAL"]},"7TX9":{"sectors":["TXK 27"],"areas":["DAL"]},"8F5":{"sectors":["TXK 27"],"areas":["DAL"]},"90F":{"sectors":["TXK 27"],"areas":["DAL"]},"KATA":{"sectors":["TXK 27"],"areas":["DAL"]},"ATA":{"sectors":["TXK 27"],"areas":["DAL"]},"KDEQ":{"sectors":["TXK 27"],"areas":["DAL"]},"DEQ":{"sectors":["TXK 27"],"areas":["DAL"]},"KLBR":{"sectors":["TXK 27"],"areas":["DAL"]},"LBR":{"sectors":["TXK 27"],"areas":["DAL"]},"M18":{"sectors":["TXK 27"],"areas":["DAL"]},"M77":{"sectors":["TXK 27"],"areas":["DAL"]},"TA40":{"sectors":["TXK 27"],"areas":["DAL"]},"TX19":{"sectors":["TXK 27"],"areas":["DAL"]},"TX35":{"sectors":["TXK 27"],"areas":["DAL"]},"0TA4":{"sectors":["DON 29"],"areas":["CQY"]},"11XA":{"sectors":["DON 29"],"areas":["CQY"]},"1XA8":{"sectors":["DON 29"],"areas":["CQY"]},"25TE":{"sectors":["DON 29"],"areas":["CQY"]},"2XA8":{"sectors":["DON 29"],"areas":["CQY"]},"2XS3":{"sectors":["DON 29"],"areas":["CQY"]},"48TT":{"sectors":["DON 29"],"areas":["CQY"]},"4TS3":{"sectors":["DON 29"],"areas":["CQY"]},"4XS1":{"sectors":["DON 29"],"areas":["CQY"]},"58TT":{"sectors":["DON 29"],"areas":["CQY"]},"5TA8":{"sectors":["DON 29"],"areas":["CQY"]},"63TX":{"sectors":["DON 29"],"areas":["CQY"]},"68F":{"sectors":["DON 29"],"areas":["CQY"]},"68TT":{"sectors":["DON 29"],"areas":["CQY"]},"6TA1":{"sectors":["DON 29"],"areas":["CQY"]},"6TX6":{"sectors":["DON 29"],"areas":["CQY"]},"74XA":{"sectors":["DON 29"],"areas":["CQY"]},"7TA4":{"sectors":["DON 29"],"areas":["CQY"]},"7TS4":{"sectors":["DON 29"],"areas":["CQY"]},"80XA":{"sectors":["DON 29"],"areas":["CQY"]},"8TX0":{"sectors":["DON 29"],"areas":["CQY"]},"8TX1":{"sectors":["DON 29"],"areas":["CQY"]},"91TA":{"sectors":["DON 29"],"areas":["CQY"]},"9TE0":{"sectors":["DON 29"],"areas":["CQY"]},"F44":{"sectors":["DON 29"],"areas":["CQY"]},"KCRS":{"sectors":["DON 29"],"areas":["CQY"]},"CRS":{"sectors":["DON 29"],"areas":["CQY"]},"KPSN":{"sectors":["DON 29"],"areas":["CQY"]},"PSN":{"sectors":["DON 29"],"areas":["CQY"]},"TA05":{"sectors":["DON 29"],"areas":["CQY"]},"TA49":{"sectors":["DON 29"],"areas":["CQY"]},"TA70":{"sectors":["DON 29"],"areas":["CQY"]},"TS70":{"sectors":["DON 29"],"areas":["CQY"]},"TS72":{"sectors":["DON 29"],"areas":["CQY"]},"TT56":{"sectors":["DON 29"],"areas":["CQY"]},"TT73":{"sectors":["DON 29"],"areas":["CQY"]},"TX17":{"sectors":["DON 29"],"areas":["CQY"]},"TX25":{"sectors":["DON 29"],"areas":["CQY"]},"TX43":{"sectors":["DON 29"],"areas":["CQY"]},"TX51":{"sectors":["DON 29"],"areas":["CQY"]},"XA42":{"sectors":["DON 29"],"areas":["CQY"]},"XA55":{"sectors":["DON 29"],"areas":["CQY"]},"XA87":{"sectors":["DON 29"],"areas":["CQY"]},"XA97":{"sectors":["DON 29"],"areas":["CQY"]},"XS17":{"sectors":["DON 29"],"areas":["CQY"]},"09AR":{"sectors":["MLU 30"],"areas":["CQY"]},"4F8":{"sectors":["MLU 30"],"areas":["CQY"]},"AR42":{"sectors":["MLU 30"],"areas":["CQY"]},"AR48":{"sectors":["MLU 30"],"areas":["CQY"]},"F17":{"sectors":["MLU 30"],"areas":["CQY"]},"F43":{"sectors":["MLU 30"],"areas":["CQY"]},"KAGO":{"sectors":["MLU 30"],"areas":["CQY"]},"AGO":{"sectors":["MLU 30"],"areas":["CQY"]},"CDH":{"sectors":["MLU 30"],"areas":["CQY"]},"KCDH":{"sectors":["MLU 30"],"areas":["CQY"]},"KELD":{"sectors":["MLU 30"],"areas":["CQY"]},"ELD":{"sectors":["MLU 30"],"areas":["CQY"]},"KSPH":{"sectors":["MLU 30"],"areas":["CQY"]},"SPH":{"sectors":["MLU 30"],"areas":["CQY"]},"01TX":{"sectors":["POS 32"],"areas":["RDR"]},"04XA":{"sectors":["POS 32"],"areas":["RDR"]},"08TX":{"sectors":["POS 32"],"areas":["RDR"]},"0TS7":{"sectors":["POS 32"],"areas":["RDR"]},"10TT":{"sectors":["POS 32"],"areas":["RDR"]},"12TS":{"sectors":["POS 32"],"areas":["RDR"]},"21F":{"sectors":["POS 32"],"areas":["RDR"]},"2TS7":{"sectors":["POS 32"],"areas":["RDR"]},"3TA7":{"sectors":["POS 32"],"areas":["RDR"]},"4TA3":{"sectors":["POS 32"],"areas":["RDR"]},"58TX":{"sectors":["POS 32"],"areas":["RDR"]},"77TX":{"sectors":["POS 32"],"areas":["RDR"]},"78XA":{"sectors":["POS 32"],"areas":["RDR"]},"86TE":{"sectors":["POS 32"],"areas":["RDR"]},"88TS":{"sectors":["POS 32"],"areas":["RDR"]},"95TS":{"sectors":["POS 32"],"areas":["RDR"]},"98TA":{"sectors":["POS 32"],"areas":["RDR"]},"F35":{"sectors":["POS 32"],"areas":["RDR"]},"KBKD":{"sectors":["POS 32"],"areas":["RDR"]},"BKD":{"sectors":["POS 32"],"areas":["RDR"]},"KMWL":{"sectors":["POS 32"],"areas":["RDR"]},"MWL":{"sectors":["POS 32"],"areas":["RDR"]},"KONY":{"sectors":["POS 32"],"areas":["RDR"]},"ONY":{"sectors":["POS 32"],"areas":["RDR"]},"RPH":{"sectors":["POS 32"],"areas":["RDR"]},"KRPH":{"sectors":["POS 32"],"areas":["RDR"]},"XBP":{"sectors":["POS 32"],"areas":["RDR"]},"KXBP":{"sectors":["POS 32"],"areas":["RDR"]},"TA19":{"sectors":["POS 32"],"areas":["RDR"]},"TA51":{"sectors":["POS 32"],"areas":["RDR"]},"TA65":{"sectors":["POS 32"],"areas":["RDR"]},"TE34":{"sectors":["POS 32"],"areas":["RDR"]},"TE93":{"sectors":["POS 32"],"areas":["RDR"]},"TT16":{"sectors":["POS 32"],"areas":["RDR"]},"TT40":{"sectors":["POS 32"],"areas":["RDR"]},"TT74":{"sectors":["POS 32"],"areas":["RDR"]},"TX32":{"sectors":["POS 32"],"areas":["RDR"]},"TX34":{"sectors":["POS 32"],"areas":["RDR"]},"TX71":{"sectors":["POS 32"],"areas":["RDR"]},"XA26":{"sectors":["POS 32"],"areas":["RDR"]},"XS53":{"sectors":["POS 32"],"areas":["RDR"]},"15F":{"sectors":["SPS 34"],"areas":["UKW"]},"28TX":{"sectors":["SPS 34"],"areas":["UKW"]},"37F":{"sectors":["SPS 34"],"areas":["UKW"]},"3F6":{"sectors":["SPS 34"],"areas":["UKW"]},"60F":{"sectors":["SPS 34"],"areas":["UKW"]},"72F":{"sectors":["SPS 34"],"areas":["UKW"]},"F01":{"sectors":["SPS 34"],"areas":["UKW"]},"F75":{"sectors":["SPS 34"],"areas":["UKW"]},"CDS":{"sectors":["SPS 34"],"areas":["UKW"]},"KCDS":{"sectors":["SPS 34"],"areas":["UKW"]},"TA91":{"sectors":["SPS 34"],"areas":["UKW"]},"TT10":{"sectors":["SPS 34"],"areas":["UKW"]},"TT50":{"sectors":["SPS 34"],"areas":["UKW"]},"TX12":{"sectors":["SPS 34"],"areas":["UKW"]},"05OK":{"sectors":["OKC 35"],"areas":["UKW"]},"08OL":{"sectors":["OKC 35"],"areas":["UKW"]},"0TX4":{"sectors":["OKC 35"],"areas":["UKW"]},"16OK":{"sectors":["OKC 35"],"areas":["UKW"]},"1O4":{"sectors":["OKC 35"],"areas":["UKW"]},"1OK2":{"sectors":["OKC 35"],"areas":["UKW"]},"1OK6":{"sectors":["OKC 35"],"areas":["UKW"]},"29OK":{"sectors":["OKC 35"],"areas":["UKW"]},"2O8":{"sectors":["OKC 35"],"areas":["UKW"]},"32OK":{"sectors":["OKC 35"],"areas":["UKW"]},"36XS":{"sectors":["OKC 35"],"areas":["UKW"]},"3O4":{"sectors":["OKC 35"],"areas":["UKW"]},"3OK2":{"sectors":["OKC 35"],"areas":["UKW"]},"46OK":{"sectors":["OKC 35"],"areas":["UKW"]},"4OK1":{"sectors":["OKC 35"],"areas":["UKW"]},"5OK0":{"sectors":["OKC 35"],"areas":["UKW"]},"5OK5":{"sectors":["OKC 35"],"areas":["UKW"]},"5OK8":{"sectors":["OKC 35"],"areas":["UKW"]},"60OK":{"sectors":["OKC 35"],"areas":["UKW"]},"64OK":{"sectors":["OKC 35"],"areas":["UKW"]},"7OK4":{"sectors":["OKC 35"],"areas":["UKW"]},"86F":{"sectors":["OKC 35"],"areas":["UKW"]},"93F":{"sectors":["OKC 35"],"areas":["UKW"]},"F06":{"sectors":["OKC 35"],"areas":["UKW"]},"F36":{"sectors":["OKC 35"],"areas":["UKW"]},"F68":{"sectors":["OKC 35"],"areas":["UKW"]},"KCLK":{"sectors":["OKC 35"],"areas":["UKW"]},"CLK":{"sectors":["OKC 35"],"areas":["UKW"]},"CSM":{"sectors":["OKC 35"],"areas":["UKW"]},"KCSM":{"sectors":["OKC 35"],"areas":["UKW"]},"ELK":{"sectors":["OKC 35"],"areas":["UKW"]},"KELK":{"sectors":["OKC 35"],"areas":["UKW"]},"OJA":{"sectors":["OKC 35"],"areas":["UKW"]},"KOJA":{"sectors":["OKC 35"],"areas":["UKW"]},"O13":{"sectors":["OKC 35"],"areas":["UKW"]},"OK10":{"sectors":["OKC 35"],"areas":["UKW"]},"OK70":{"sectors":["OKC 35"],"areas":["UKW"]},"OK77":{"sectors":["OKC 35"],"areas":["UKW"]},"OK98":{"sectors":["OKC 35"],"areas":["UKW"]},"OL07":{"sectors":["OKC 35"],"areas":["UKW"]},"OL08":{"sectors":["OKC 35"],"areas":["UKW"]},"OL10":{"sectors":["OKC 35"],"areas":["UKW"]},"OL18":{"sectors":["OKC 35"],"areas":["UKW"]},"OL28":{"sectors":["OKC 35"],"areas":["UKW"]},"OL44":{"sectors":["OKC 35"],"areas":["UKW"]},"OL46":{"sectors":["OKC 35"],"areas":["UKW"]},"OL51":{"sectors":["OKC 35"],"areas":["UKW"]},"02XA":{"sectors":["SEA 37"],"areas":["BYP"]},"06XA":{"sectors":["SEA 37"],"areas":["BYP"]},"09TA":{"sectors":["SEA 37"],"areas":["BYP"]},"0TX9":{"sectors":["SEA 37"],"areas":["BYP"]},"19TE":{"sectors":["SEA 37"],"areas":["BYP"]},"1TE8":{"sectors":["SEA 37"],"areas":["BYP"]},"21TX":{"sectors":["SEA 37"],"areas":["BYP"]},"23TA":{"sectors":["SEA 37"],"areas":["BYP"]},"2TS6":{"sectors":["SEA 37"],"areas":["BYP"]},"39TA":{"sectors":["SEA 37"],"areas":["BYP"]},"41TS":{"sectors":["SEA 37"],"areas":["BYP"]},"42TX":{"sectors":["SEA 37"],"areas":["BYP"]},"48TX":{"sectors":["SEA 37"],"areas":["BYP"]},"4TX3":{"sectors":["SEA 37"],"areas":["BYP"]},"5TX2":{"sectors":["SEA 37"],"areas":["BYP"]},"5XS0":{"sectors":["SEA 37"],"areas":["BYP"]},"65TE":{"sectors":["SEA 37"],"areas":["BYP"]},"66XS":{"sectors":["SEA 37"],"areas":["BYP"]},"6TA2":{"sectors":["SEA 37"],"areas":["BYP"]},"70TE":{"sectors":["SEA 37"],"areas":["BYP"]},"72XS":{"sectors":["SEA 37"],"areas":["BYP"]},"80F":{"sectors":["SEA 37"],"areas":["BYP"]},"97XS":{"sectors":["SEA 37"],"areas":["BYP"]},"99TE":{"sectors":["SEA 37"],"areas":["BYP"]},"F00":{"sectors":["SEA 37"],"areas":["BYP"]},"HHW":{"sectors":["SEA 37"],"areas":["BYP"]},"KHHW":{"sectors":["SEA 37"],"areas":["BYP"]},"PRX":{"sectors":["SEA 37"],"areas":["BYP"]},"KPRX":{"sectors":["SEA 37"],"areas":["BYP"]},"OK68":{"sectors":["SEA 37"],"areas":["BYP"]},"OL26":{"sectors":["SEA 37"],"areas":["BYP"]},"TE06":{"sectors":["SEA 37"],"areas":["BYP"]},"TE44":{"sectors":["SEA 37"],"areas":["BYP"]},"TT15":{"sectors":["SEA 37"],"areas":["BYP"]},"TT29":{"sectors":["SEA 37"],"areas":["BYP"]},"TT44":{"sectors":["SEA 37"],"areas":["BYP"]},"TT47":{"sectors":["SEA 37"],"areas":["BYP"]},"TT98":{"sectors":["SEA 37"],"areas":["BYP"]},"TX16":{"sectors":["SEA 37"],"areas":["BYP"]},"TX47":{"sectors":["SEA 37"],"areas":["BYP"]},"XA81":{"sectors":["SEA 37"],"areas":["BYP"]},"XS30":{"sectors":["SEA 37"],"areas":["BYP"]},"XS88":{"sectors":["SEA 37"],"areas":["BYP"]},"02OL":{"sectors":["MLC 38"],"areas":["BYP"]},"08F":{"sectors":["MLC 38"],"areas":["BYP"]},"08OK":{"sectors":["MLC 38"],"areas":["BYP"]},"0F7":{"sectors":["MLC 38"],"areas":["BYP"]},"0OK4":{"sectors":["MLC 38"],"areas":["BYP"]},"13OK":{"sectors":["MLC 38"],"areas":["BYP"]},"14OK":{"sectors":["MLC 38"],"areas":["BYP"]},"19OK":{"sectors":["MLC 38"],"areas":["BYP"]},"24OK":{"sectors":["MLC 38"],"areas":["BYP"]},"26OK":{"sectors":["MLC 38"],"areas":["BYP"]},"37OK":{"sectors":["MLC 38"],"areas":["BYP"]},"3OK0":{"sectors":["MLC 38"],"areas":["BYP"]},"49OK":{"sectors":["MLC 38"],"areas":["BYP"]},"57OK":{"sectors":["MLC 38"],"areas":["BYP"]},"59OK":{"sectors":["MLC 38"],"areas":["BYP"]},"5OK2":{"sectors":["MLC 38"],"areas":["BYP"]},"6F1":{"sectors":["MLC 38"],"areas":["BYP"]},"6OK5":{"sectors":["MLC 38"],"areas":["BYP"]},"8OL1":{"sectors":["MLC 38"],"areas":["BYP"]},"90OK":{"sectors":["MLC 38"],"areas":["BYP"]},"91F":{"sectors":["MLC 38"],"areas":["BYP"]},"94OK":{"sectors":["MLC 38"],"areas":["BYP"]},"9OK6":{"sectors":["MLC 38"],"areas":["BYP"]},"F08":{"sectors":["MLC 38"],"areas":["BYP"]},"F10":{"sectors":["MLC 38"],"areas":["BYP"]},"F81":{"sectors":["MLC 38"],"areas":["BYP"]},"F99":{"sectors":["MLC 38"],"areas":["BYP"]},"H05":{"sectors":["MLC 38"],"areas":["BYP"]},"H45":{"sectors":["MLC 38"],"areas":["BYP"]},"KHAX":{"sectors":["MLC 38"],"areas":["BYP"]},"HAX":{"sectors":["MLC 38"],"areas":["BYP"]},"KADH":{"sectors":["MLC 38"],"areas":["BYP"]},"ADH":{"sectors":["MLC 38"],"areas":["BYP"]},"AQR":{"sectors":["MLC 38"],"areas":["BYP"]},"KAQR":{"sectors":["MLC 38"],"areas":["BYP"]},"GZL":{"sectors":["MLC 38"],"areas":["BYP"]},"KGZL":{"sectors":["MLC 38"],"areas":["BYP"]},"MKO":{"sectors":["MLC 38"],"areas":["BYP"]},"KMKO":{"sectors":["MLC 38"],"areas":["BYP"]},"KMLC":{"sectors":["MLC 38"],"areas":["BYP"]},"MLC":{"sectors":["MLC 38"],"areas":["BYP"]},"SRE":{"sectors":["MLC 38"],"areas":["BYP"]},"KSRE":{"sectors":["MLC 38"],"areas":["BYP"]},"O47":{"sectors":["MLC 38"],"areas":["BYP"]},"OK33":{"sectors":["MLC 38"],"areas":["BYP"]},"OK35":{"sectors":["MLC 38"],"areas":["BYP"]},"OK73":{"sectors":["MLC 38"],"areas":["BYP"]},"OK92":{"sectors":["MLC 38"],"areas":["BYP"]},"OL34":{"sectors":["MLC 38"],"areas":["BYP"]},"OL41":{"sectors":["MLC 38"],"areas":["BYP"]},"OL47":{"sectors":["MLC 38"],"areas":["BYP"]},"OL48":{"sectors":["MLC 38"],"areas":["BYP"]},"46TE":{"sectors":["MAF 40"],"areas":["JEN"]},"4XA8":{"sectors":["MAF 40"],"areas":["JEN"]},"58XS":{"sectors":["MAF 40"],"areas":["JEN"]},"5TA0":{"sectors":["MAF 40"],"areas":["JEN"]},"8TE2":{"sectors":["MAF 40"],"areas":["JEN"]},"94TT":{"sectors":["MAF 40"],"areas":["JEN"]},"96TE":{"sectors":["MAF 40"],"areas":["JEN"]},"E01":{"sectors":["MAF 40"],"areas":["JEN"]},"E06":{"sectors":["MAF 40"],"areas":["JEN"]},"E13":{"sectors":["MAF 40"],"areas":["JEN"]},"E26":{"sectors":["MAF 40"],"areas":["JEN"]},"E41":{"sectors":["MAF 40"],"areas":["JEN"]},"KBPG":{"sectors":["MAF 40"],"areas":["JEN"]},"BPG":{"sectors":["MAF 40"],"areas":["JEN"]},"KHOB":{"sectors":["MAF 40"],"areas":["JEN"]},"HOB":{"sectors":["MAF 40"],"areas":["JEN"]},"INK":{"sectors":["MAF 40"],"areas":["JEN"]},"KINK":{"sectors":["MAF 40"],"areas":["JEN"]},"NM59":{"sectors":["MAF 40"],"areas":["JEN"]},"NM83":{"sectors":["MAF 40"],"areas":["JEN"]},"NM94":{"sectors":["MAF 40"],"areas":["JEN"]},"TA54":{"sectors":["MAF 40"],"areas":["JEN"]},"TE61":{"sectors":["MAF 40"],"areas":["JEN"]},"TS13":{"sectors":["MAF 40"],"areas":["JEN"]},"01OL":{"sectors":["FRI 53"],"areas":["BYP"]},"07TE":{"sectors":["FRI 53"],"areas":["BYP"]},"0F9":{"sectors":["FRI 53"],"areas":["BYP"]},"0OK1":{"sectors":["FRI 53"],"areas":["BYP"]},"12OK":{"sectors":["FRI 53"],"areas":["BYP"]},"12TT":{"sectors":["FRI 53"],"areas":["BYP"]},"14XA":{"sectors":["FRI 53"],"areas":["BYP"]},"15TX":{"sectors":["FRI 53"],"areas":["BYP"]},"16XA":{"sectors":["FRI 53"],"areas":["BYP"]},"1F0":{"sectors":["FRI 53"],"areas":["BYP"]},"1F4":{"sectors":["FRI 53"],"areas":["BYP"]},"1K2":{"sectors":["FRI 53"],"areas":["BYP"]},"1OK7":{"sectors":["FRI 53"],"areas":["BYP"]},"1OK9":{"sectors":["FRI 53"],"areas":["BYP"]},"22OK":{"sectors":["FRI 53"],"areas":["BYP"]},"23OK":{"sectors":["FRI 53"],"areas":["BYP"]},"2OK1":{"sectors":["FRI 53"],"areas":["BYP"]},"2OK8":{"sectors":["FRI 53"],"areas":["BYP"]},"33TE":{"sectors":["FRI 53"],"areas":["BYP"]},"3OK5":{"sectors":["FRI 53"],"areas":["BYP"]},"3T0":{"sectors":["FRI 53"],"areas":["BYP"]},"51TS":{"sectors":["FRI 53"],"areas":["BYP"]},"58TE":{"sectors":["FRI 53"],"areas":["BYP"]},"65TT":{"sectors":["FRI 53"],"areas":["BYP"]},"66OK":{"sectors":["FRI 53"],"areas":["BYP"]},"69XS":{"sectors":["FRI 53"],"areas":["BYP"]},"73OK":{"sectors":["FRI 53"],"areas":["BYP"]},"7T0":{"sectors":["FRI 53"],"areas":["BYP"]},"8TA2":{"sectors":["FRI 53"],"areas":["BYP"]},"8TX9":{"sectors":["FRI 53"],"areas":["BYP"]},"9OK4":{"sectors":["FRI 53"],"areas":["BYP"]},"9TX7":{"sectors":["FRI 53"],"areas":["BYP"]},"9XS4":{"sectors":["FRI 53"],"areas":["BYP"]},"F30":{"sectors":["FRI 53"],"areas":["BYP"]},"KADM":{"sectors":["FRI 53"],"areas":["BYP"]},"ADM":{"sectors":["FRI 53"],"areas":["BYP"]},"DUA":{"sectors":["FRI 53"],"areas":["BYP"]},"KDUA":{"sectors":["FRI 53"],"areas":["BYP"]},"GLE":{"sectors":["FRI 53"],"areas":["BYP"]},"KGLE":{"sectors":["FRI 53"],"areas":["BYP"]},"KGYI":{"sectors":["FRI 53"],"areas":["BYP"]},"GYI":{"sectors":["FRI 53"],"areas":["BYP"]},"PVJ":{"sectors":["FRI 53"],"areas":["BYP"]},"KPVJ":{"sectors":["FRI 53"],"areas":["BYP"]},"SWI":{"sectors":["FRI 53"],"areas":["BYP"]},"KSWI":{"sectors":["FRI 53"],"areas":["BYP"]},"OK09":{"sectors":["FRI 53"],"areas":["BYP"]},"OK16":{"sectors":["FRI 53"],"areas":["BYP"]},"OK17":{"sectors":["FRI 53"],"areas":["BYP"]},"OK23":{"sectors":["FRI 53"],"areas":["BYP"]},"OK24":{"sectors":["FRI 53"],"areas":["BYP"]},"OK28":{"sectors":["FRI 53"],"areas":["BYP"]},"OK29":{"sectors":["FRI 53"],"areas":["BYP"]},"OK48":{"sectors":["FRI 53"],"areas":["BYP"]},"OK62":{"sectors":["FRI 53"],"areas":["BYP"]},"OL03":{"sectors":["FRI 53"],"areas":["BYP"]},"OL11":{"sectors":["FRI 53"],"areas":["BYP"]},"OL27":{"sectors":["FRI 53"],"areas":["BYP"]},"OL37":{"sectors":["FRI 53"],"areas":["BYP"]},"OL54":{"sectors":["FRI 53"],"areas":["BYP"]},"T29":{"sectors":["FRI 53"],"areas":["BYP"]},"T32":{"sectors":["FRI 53"],"areas":["BYP"]},"T47":{"sectors":["FRI 53"],"areas":["BYP"]},"TA93":{"sectors":["FRI 53"],"areas":["BYP"]},"TE68":{"sectors":["FRI 53"],"areas":["BYP"]},"TS85":{"sectors":["FRI 53"],"areas":["BYP"]},"X65":{"sectors":["FRI 53"],"areas":["BYP"]},"XA48":{"sectors":["FRI 53"],"areas":["BYP"]},"XS31":{"sectors":["FRI 53"],"areas":["BYP"]},"XS62":{"sectors":["FRI 53"],"areas":["BYP"]},"0TX0":{"sectors":["EDN 62"],"areas":["JEN"]},"0TX1":{"sectors":["EDN 62"],"areas":["JEN"]},"13TX":{"sectors":["EDN 62"],"areas":["JEN"]},"13XA":{"sectors":["EDN 62"],"areas":["JEN"]},"17TX":{"sectors":["EDN 62"],"areas":["JEN"]},"17XS":{"sectors":["EDN 62"],"areas":["JEN"]},"1XA0":{"sectors":["EDN 62"],"areas":["JEN"]},"22XA":{"sectors":["EDN 62"],"areas":["JEN"]},"3XS9":{"sectors":["EDN 62"],"areas":["JEN"]},"41TA":{"sectors":["EDN 62"],"areas":["JEN"]},"4TE6":{"sectors":["EDN 62"],"areas":["JEN"]},"4TX9":{"sectors":["EDN 62"],"areas":["JEN"]},"62XS":{"sectors":["EDN 62"],"areas":["JEN"]},"66TE":{"sectors":["EDN 62"],"areas":["JEN"]},"74TE":{"sectors":["EDN 62"],"areas":["JEN"]},"79TX":{"sectors":["EDN 62"],"areas":["JEN"]},"81TS":{"sectors":["EDN 62"],"areas":["JEN"]},"83TS":{"sectors":["EDN 62"],"areas":["JEN"]},"8TS7":{"sectors":["EDN 62"],"areas":["JEN"]},"9F0":{"sectors":["EDN 62"],"areas":["JEN"]},"F23":{"sectors":["EDN 62"],"areas":["JEN"]},"F78":{"sectors":["EDN 62"],"areas":["JEN"]},"ETN":{"sectors":["EDN 62"],"areas":["JEN"]},"KETN":{"sectors":["EDN 62"],"areas":["JEN"]},"KGDJ":{"sectors":["EDN 62"],"areas":["JEN"]},"GDJ":{"sectors":["EDN 62"],"areas":["JEN"]},"KMKN":{"sectors":["EDN 62"],"areas":["JEN"]},"MKN":{"sectors":["EDN 62"],"areas":["JEN"]},"KSEP":{"sectors":["EDN 62"],"areas":["JEN"]},"SEP":{"sectors":["EDN 62"],"areas":["JEN"]},"TA25":{"sectors":["EDN 62"],"areas":["JEN"]},"TA35":{"sectors":["EDN 62"],"areas":["JEN"]},"TA78":{"sectors":["EDN 62"],"areas":["JEN"]},"TA90":{"sectors":["EDN 62"],"areas":["JEN"]},"TE02":{"sectors":["EDN 62"],"areas":["JEN"]},"TE35":{"sectors":["EDN 62"],"areas":["JEN"]},"TS14":{"sectors":["EDN 62"],"areas":["JEN"]},"TS61":{"sectors":["EDN 62"],"areas":["JEN"]},"TS89":{"sectors":["EDN 62"],"areas":["JEN"]},"TT12":{"sectors":["EDN 62"],"areas":["JEN"]},"TT86":{"sectors":["EDN 62"],"areas":["JEN"]},"TX28":{"sectors":["EDN 62"],"areas":["JEN"]},"TX36":{"sectors":["EDN 62"],"areas":["JEN"]},"TX48":{"sectors":["EDN 62"],"areas":["JEN"]},"TX52":{"sectors":["EDN 62"],"areas":["JEN"]},"TX93":{"sectors":["EDN 62"],"areas":["JEN"]},"XA04":{"sectors":["EDN 62"],"areas":["JEN"]},"XA54":{"sectors":["EDN 62"],"areas":["JEN"]},"XA69":{"sectors":["EDN 62"],"areas":["JEN"]},"XA86":{"sectors":["EDN 62"],"areas":["JEN"]},"10XS":{"sectors":["ABI 63"],"areas":["JEN"]},"1TS8":{"sectors":["ABI 63"],"areas":["JEN"]},"3TA4":{"sectors":["ABI 63"],"areas":["JEN"]},"56F":{"sectors":["ABI 63"],"areas":["JEN"]},"81TE":{"sectors":["ABI 63"],"areas":["JEN"]},"88XS":{"sectors":["ABI 63"],"areas":["JEN"]},"94TX":{"sectors":["ABI 63"],"areas":["JEN"]},"BWD":{"sectors":["ABI 63"],"areas":["JEN"]},"KBWD":{"sectors":["ABI 63"],"areas":["JEN"]},"SNK":{"sectors":["ABI 63"],"areas":["JEN"]},"KSNK":{"sectors":["ABI 63"],"areas":["JEN"]},"T37":{"sectors":["ABI 63"],"areas":["JEN"]},"T60":{"sectors":["ABI 63"],"areas":["JEN"]},"T88":{"sectors":["ABI 63"],"areas":["JEN"]},"TA24":{"sectors":["ABI 63"],"areas":["JEN"]},"TT07":{"sectors":["ABI 63"],"areas":["JEN"]},"TT57":{"sectors":["ABI 63"],"areas":["JEN"]},"18T":{"sectors":["LBB 64"],"areas":["RDR"]},"1TE0":{"sectors":["LBB 64"],"areas":["RDR"]},"1TX3":{"sectors":["LBB 64"],"areas":["RDR"]},"22F":{"sectors":["LBB 64"],"areas":["RDR"]},"29F":{"sectors":["LBB 64"],"areas":["RDR"]},"2T1":{"sectors":["LBB 64"],"areas":["RDR"]},"2TE7":{"sectors":["LBB 64"],"areas":["RDR"]},"3TS5":{"sectors":["LBB 64"],"areas":["RDR"]},"60XS":{"sectors":["LBB 64"],"areas":["RDR"]},"6TE6":{"sectors":["LBB 64"],"areas":["RDR"]},"6TX4":{"sectors":["LBB 64"],"areas":["RDR"]},"75TA":{"sectors":["LBB 64"],"areas":["RDR"]},"79XS":{"sectors":["LBB 64"],"areas":["RDR"]},"83XA":{"sectors":["LBB 64"],"areas":["RDR"]},"8TE0":{"sectors":["LBB 64"],"areas":["RDR"]},"9TX6":{"sectors":["LBB 64"],"areas":["RDR"]},"9XS6":{"sectors":["LBB 64"],"areas":["RDR"]},"E57":{"sectors":["LBB 64"],"areas":["RDR"]},"F85":{"sectors":["LBB 64"],"areas":["RDR"]},"F98":{"sectors":["LBB 64"],"areas":["RDR"]},"I06":{"sectors":["LBB 64"],"areas":["RDR"]},"GNC":{"sectors":["LBB 64"],"areas":["RDR"]},"KGNC":{"sectors":["LBB 64"],"areas":["RDR"]},"LUV":{"sectors":["LBB 64"],"areas":["RDR"]},"KLUV":{"sectors":["LBB 64"],"areas":["RDR"]},"TS21":{"sectors":["LBB 64"],"areas":["RDR"]},"TT27":{"sectors":["LBB 64"],"areas":["RDR"]},"TT97":{"sectors":["LBB 64"],"areas":["RDR"]},"TX99":{"sectors":["LBB 64"],"areas":["RDR"]},"XA05":{"sectors":["LBB 64"],"areas":["RDR"]},"XA77":{"sectors":["LBB 64"],"areas":["RDR"]},"XS36":{"sectors":["LBB 64"],"areas":["RDR"]},"XS76":{"sectors":["LBB 64"],"areas":["RDR"]},"0F2":{"sectors":["UKW 75"],"areas":["UKW"]},"1XA1":{"sectors":["UKW 75"],"areas":["UKW"]},"35XS":{"sectors":["UKW 75"],"areas":["UKW"]},"55TT":{"sectors":["UKW 75"],"areas":["UKW"]},"64XA":{"sectors":["UKW 75"],"areas":["UKW"]},"67XA":{"sectors":["UKW 75"],"areas":["UKW"]},"8XS2":{"sectors":["UKW 75"],"areas":["UKW"]},"93XA":{"sectors":["UKW 75"],"areas":["UKW"]},"F32":{"sectors":["UKW 75"],"areas":["UKW"]},"T39":{"sectors":["UKW 75"],"areas":["UKW"]},"TE76":{"sectors":["UKW 75"],"areas":["UKW"]},"TS20":{"sectors":["UKW 75"],"areas":["UKW"]},"TX21":{"sectors":["UKW 75"],"areas":["UKW"]},"XA09":{"sectors":["UKW 75"],"areas":["UKW"]},"XA16":{"sectors":["UKW 75"],"areas":["UKW"]},"12TE":{"sectors":["UIM 83"],"areas":["DAL"]},"18TX":{"sectors":["UIM 83"],"areas":["DAL"]},"1TA7":{"sectors":["UIM 83"],"areas":["DAL"]},"2F7":{"sectors":["UIM 83"],"areas":["DAL"]},"2TS1":{"sectors":["UIM 83"],"areas":["DAL"]},"2TS9":{"sectors":["UIM 83"],"areas":["DAL"]},"31XS":{"sectors":["UIM 83"],"areas":["DAL"]},"33XA":{"sectors":["UIM 83"],"areas":["DAL"]},"37TS":{"sectors":["UIM 83"],"areas":["DAL"]},"38TT":{"sectors":["UIM 83"],"areas":["DAL"]},"3TS9":{"sectors":["UIM 83"],"areas":["DAL"]},"53TX":{"sectors":["UIM 83"],"areas":["DAL"]},"67TX":{"sectors":["UIM 83"],"areas":["DAL"]},"76F":{"sectors":["UIM 83"],"areas":["DAL"]},"77TA":{"sectors":["UIM 83"],"areas":["DAL"]},"77TE":{"sectors":["UIM 83"],"areas":["DAL"]},"7F3":{"sectors":["UIM 83"],"areas":["DAL"]},"88TX":{"sectors":["UIM 83"],"areas":["DAL"]},"8TA5":{"sectors":["UIM 83"],"areas":["DAL"]},"8TE1":{"sectors":["UIM 83"],"areas":["DAL"]},"94TS":{"sectors":["UIM 83"],"areas":["DAL"]},"F53":{"sectors":["UIM 83"],"areas":["DAL"]},"GVT":{"sectors":["UIM 83"],"areas":["DAL"]},"KGVT":{"sectors":["UIM 83"],"areas":["DAL"]},"KOSA":{"sectors":["UIM 83"],"areas":["DAL"]},"OSA":{"sectors":["UIM 83"],"areas":["DAL"]},"SLR":{"sectors":["UIM 83"],"areas":["DAL"]},"KSLR":{"sectors":["UIM 83"],"areas":["DAL"]},"KTRL":{"sectors":["UIM 83"],"areas":["DAL"]},"TRL":{"sectors":["UIM 83"],"areas":["DAL"]},"T14":{"sectors":["UIM 83"],"areas":["DAL"]},"T48":{"sectors":["UIM 83"],"areas":["DAL"]},"TE74":{"sectors":["UIM 83"],"areas":["DAL"]},"TS11":{"sectors":["UIM 83"],"areas":["DAL"]},"TS16":{"sectors":["UIM 83"],"areas":["DAL"]},"TT11":{"sectors":["UIM 83"],"areas":["DAL"]},"TT99":{"sectors":["UIM 83"],"areas":["DAL"]},"XA00":{"sectors":["UIM 83"],"areas":["DAL"]},"XA17":{"sectors":["UIM 83"],"areas":["DAL"]},"XA23":{"sectors":["UIM 83"],"areas":["DAL"]},"XA27":{"sectors":["UIM 83"],"areas":["DAL"]},"XA33":{"sectors":["UIM 83"],"areas":["DAL"]},"XA35":{"sectors":["UIM 83"],"areas":["DAL"]},"XA56":{"sectors":["UIM 83"],"areas":["DAL"]},"XS14":{"sectors":["UIM 83"],"areas":["DAL"]},"XS48":{"sectors":["UIM 83"],"areas":["DAL"]},"XS70":{"sectors":["UIM 83"],"areas":["DAL"]},"XS89":{"sectors":["UIM 83"],"areas":["DAL"]}};
  const LBB_APP_AUTHORIZED_AIRPORTS = new Set(["0TA2","0XA6","1TX5","2F4","2TX6","30TE","41F","47XS","5F1","6TS0","74TS","7TA3","82TE","8F3","8XS8","9TX2","9TX3","F49","F82","KBFE","KLBB","KLIU","KLLN","KPVW","T96","TA67","TA79","TE70","TS22","TS66","TS84","TX63","XA25","XS06","BFE","LBB","LIU","LLN","PVW"]);

  function removeAppFromRecord(record, appName) {
    if (!record) return false;
    const apps = Array.isArray(record.apps) ? record.apps : [];
    if (!apps.includes(appName)) return false;
    record.apps = apps.filter((app) => app !== appName);
    if (!record.apps.length) {
      record.vscs = [];
      record.contacts = [];
      record.hours = [];
    }
    return true;
  }

  
  const D10_OUTAGE_SECTOR_DEFAULTS = {"00TS":"ACT 96","06XS":"FRI 53","07XS":"FRI 53","09T":"UKW 75","K09T":"UKW 75","0TA3":"UKW 75","0TE2":"UKW 75","0TX2":"FRI 53","0TX5":"FRI 53","0TX7":"UIM 83","0XA0":"POS 32","0XA9":"POS 32","11TE":"ACT 96","12T":"ACT 96","K12T":"ACT 96","12TA":"ACT 96","13TA":"ACT 96","13XS":"UIM 83","15TT":"UIM 83","16X":"POS 32","K16X":"POS 32","19XA":"POS 32","19XS":"ACT 96","1F7":"UIM 83","K1F7":"UIM 83","1TS4":"UIM 83","1TX1":"UIM 83","1XS3":"EDN 62","20T":"EDN 62","K20T":"EDN 62","20XS":"UIM 83","23TE":"UIM 83","24TS":"UIM 83","25TT":"ACT 96","25XS":"ACT 96","29TA":"ACT 96","2TA2":"POS 32","2TE2":"POS 32","2TX7":"POS 32","2TX8":"UKW 75","30F":"FRI 53","K30F":"FRI 53","30XA":"FRI 53","31TT":"FRI 53","32XS":"EDN 62","35TA":"EDN 62","35TT":"EDN 62","35X":"UKW 75","K35X":"UKW 75","37TA":"UKW 75","38TX":"ACT 96","39TT":"ACT 96","39XA":"ACT 96","3T6":"UKW 75","K3T6":"UKW 75","3TE3":"UIM 83","3TX":"UKW 75","K3TX":"UKW 75","3TX3":"UKW 75","3TX7":"UKW 75","3TX9":"ACT 96","3XA0":"ACT 96","3XA1":"FRI 53","3XA8":"EDN 62","3XS0":"FRI 53","3XS7":"FRI 53","43TT":"FRI 53","45XA":"FRI 53","46XA":"POS 32","49TS":"POS 32","4T2":"POS 32","K4T2":"POS 32","4TA1":"FRI 53","4TA9":"FRI 53","4TX2":"POS 32","4TX8":"UKW 75","4XA7":"UKW 75","4XS2":"POS 32","4XS4":"POS 32","50F":"EDN 62","K50F":"EDN 62","51TA":"EDN 62","51TE":"ACT 96","51XA":"ACT 96","52F":"POS 32","K52F":"POS 32","53TS":"POS 32","54TA":"ACT 96","54XA":"FRI 53","56TA":"FRI 53","56XA":"UKW 75","58T":"UKW 75","K58T":"UKW 75","59TX":"EDN 62","5TA9":"UIM 83","5TX0":"FRI 53","5TX9":"FRI 53","5XA9":"FRI 53","61TE":"POS 32","61XA":"SEA 37","62TS":"POS 32","64TA":"POS 32","65TA":"UKW 75","67TT":"UKW 75","6TA3":"UIM 83","6TS2":"POS 32","6TS5":"POS 32","6TS9":"ACT 96","6TX7":"ACT 96","6X8":"FRI 53","K6X8":"FRI 53","6XA7":"FRI 53","6XS2":"ACT 96","6XS7":"POS 32","70T":"POS 32","K70T":"POS 32","73T":"POS 32","K73T":"POS 32","73TE":"POS 32","74T":"UKW 75","K74T":"UKW 75","75TS":"ACT 96","76T":"UKW 75","K76T":"UKW 75","78TX":"UKW 75","79TS":"SEA 37","79TT":"SEA 37","7TX4":"POS 32","7XA2":"UKW 75","85TS":"UKW 75","85XA":"UKW 75","87XA":"UKW 75","88TT":"FRI 53","88XA":"SEA 37","89TE":"SEA 37","8F7":"SEA 37","K8F7":"SEA 37","8TA4":"SEA 37","8TA7":"ACT 96","8TE3":"ACT 96","8TS1":"ACT 96","8TS5":"ACT 96","8XA6":"FRI 53","90TA":"FRI 53","93TX":"POS 32","93XS":"POS 32","94TE":"POS 32","95TE":"POS 32","97XA":"SEA 37","99XS":"SEA 37","9F9":"EDN 62","K9F9":"EDN 62","9S1":"SEA 37","K9S1":"SEA 37","9TA4":"SEA 37","9TS6":"ACT 96","9XA4":"ACT 96","E58":"UKW 75","KE58":"UKW 75","ESA":"UKW 75","KESA":"UKW 75","F41":"DON 29","KF41":"DON 29","F46":"UIM 83","KF46":"UIM 83","F69":"UIM 83","KF69":"UIM 83","KADS":"UIM 83","ADS":"UIM 83","KAFW":"POS 32","AFW":"POS 32","KCPT":"ACT 96","CPT":"ACT 96","KDAL":"UIM 83","DAL":"UIM 83","KDFW":"POS 32","DFW":"POS 32","KDTO":"FRI 53","DTO":"FRI 53","KFTW":"POS 32","FTW":"POS 32","KFWS":"ACT 96","FWS":"ACT 96","KGKY":"ACT 96","GKY":"ACT 96","KGPM":"ACT 96","GPM":"ACT 96","KHQZ":"UIM 83","HQZ":"UIM 83","KJWY":"ACT 96","JWY":"ACT 96","KLNC":"DON 29","LNC":"DON 29","KLUD":"UKW 75","LUD":"UKW 75","KRBD":"ACT 96","RBD":"ACT 96","KTKI":"SEA 37","TKI":"SEA 37","KWEA":"POS 32","WEA":"POS 32","T13":"DON 29","KT13":"DON 29","T28":"UKW 75","KT28":"UKW 75","T31":"SEA 37","KT31":"SEA 37","T38":"FRI 53","KT38":"FRI 53","T56":"ACT 96","KT56":"ACT 96","T57":"ACT 96","KT57":"ACT 96","T58":"FRI 53","KT58":"FRI 53","T67":"POS 32","KT67":"POS 32","T76":"POS 32","KT76":"POS 32","T80":"SEA 37","KT80":"SEA 37","T87":"UKW 75","KT87":"UKW 75","TA01":"ACT 96","TA02":"POS 32","TA11":"POS 32","TA18":"UIM 83","TA21":"FRI 53","TA26":"ACT 96","TA46":"DON 29","TA47":"UKW 75","TA48":"UKW 75","TA69":"POS 32","TA87":"POS 32","TA92":"POS 32","TA94":"POS 32","TA99":"FRI 53","TE24":"FRI 53","TE30":"FRI 53","TE39":"FRI 53","TE40":"DON 29","TE43":"DON 29","TE45":"EDN 62","TE52":"EDN 62","TE65":"EDN 62","TE66":"EDN 62","TE80":"FRI 53","TE81":"FRI 53","TE82":"FRI 53","TE92":"POS 32","TS00":"POS 32","TS06":"POS 32","TS31":"POS 32","TS56":"SEA 37","TS58":"SEA 37","TS63":"SEA 37","TS71":"ACT 96","TS73":"POS 32","TS74":"UKW 75","TT21":"UKW 75","TT32":"UIM 83","TX06":"UIM 83","TX15":"POS 32","TX18":"POS 32","TX22":"FRI 53","TX29":"ACT 96","TX30":"ACT 96","TX46":"ACT 96","TX50":"ACT 96","TX53":"UKW 75","TX64":"UKW 75","TX67":"ACT 96","TX94":"FRI 53","TX96":"FRI 53","TX98":"FRI 53","X16":"FRI 53","KX16":"FRI 53","XA03":"FRI 53","XA07":"UKW 75","XA10":"UKW 75","XA11":"UKW 75","XA18":"UKW 75","XA21":"UKW 75","XA34":"UKW 75","XA36":"UKW 75","XA37":"UKW 75","XA40":"UKW 75","XA49":"UKW 75","XA53":"UKW 75","XA57":"UKW 75","XA59":"UKW 75","XA61":"UKW 75","XA62":"UKW 75","XA63":"UKW 75","XA64":"UKW 75","XA65":"UKW 75","XA72":"UKW 75","XA75":"ACT 96","XA78":"FRI 53","XA79":"FRI 53","XA98":"UKW 75","XA99":"POS 32","XS04":"POS 32","XS05":"POS 32","XS37":"POS 32","XS42":"SEA 37","XS54":"SEA 37","XS60":"FRI 53","XS96":"FRI 53","XS97":"POS 32","KNFW":"POS 32","NFW":"POS 32"};

  function recordUsesD10Approach(record) {
    const apps = Array.isArray(record && record.apps) ? record.apps : [];
    const appText = apps.map((app) => String(app || "").toUpperCase()).join(" ");
    return appText.includes("D10") || appText.includes("DFW APP");
  }

  function applyD10OutageSectorDefaults() {
    Object.keys(D10_OUTAGE_SECTOR_DEFAULTS).forEach((ident) => {
      const found = lookupRecord(ident);
      if (!found || !found.record || !recordUsesD10Approach(found.record)) return;

      const sector = D10_OUTAGE_SECTOR_DEFAULTS[ident];
      const area = SECTOR_TO_AREA[sector] || "";

      found.record.record_type = "AIRPORT";
      found.record.sectors = [sector];
      found.record.areas = area ? [area] : [];
    });
  }

  
  const GGG_APP_SECTOR_DEFAULTS = {"07F":"UIM 83","K07F":"UIM 83","0TX3":"UIM 83","11TA":"UIM 83","16TE":"UIM 83","18TE":"UIM 83","1TT8":"UIM 83","1TX9":"UIM 83","2XA7":"UIM 83","3F9":"UIM 83","K3F9":"UIM 83","3TS0":"UIM 83","3XS6":"UIM 83","4TX6":"UIM 83","4XA9":"UIM 83","59XA":"UIM 83","61TA":"UIM 83","6F7":"UIM 83","K6F7":"UIM 83","6TX3":"UIM 83","81TX":"UIM 83","91XA":"UIM 83","96TA":"UIM 83","96TS":"UIM 83","F51":"UIM 83","KF51":"UIM 83","KGGG":"UIM 83","GGG":"UIM 83","KJDD":"UIM 83","JDD":"UIM 83","KJXI":"UIM 83","JXI":"UIM 83","TA27":"UIM 83","TX09":"UIM 83","TX62":"UIM 83","XA01":"UIM 83","XA46":"UIM 83","XA50":"UIM 83","XS02":"UIM 83","00TX":"UIM 83","0XS9":"DON 29","10TS":"MLU 30","27TA":"MLU 30","38XA":"DON 29","3TX1":"DON 29","51TX":"UIM 83","5TX7":"UIM 83","5XS5":"UIM 83","60TA":"MLU 30","6X0":"DON 29","K6X0":"DON 29","71XA":"DON 29","7TA7":"DON 29","99X":"DON 29","K99X":"DON 29","KJSO":"DON 29","JSO":"DON 29","KRFI":"MLU 30","RFI":"MLU 30","KTYR":"DON 29","TYR":"DON 29","T25":"DON 29","KT25":"DON 29","TA37":"DON 29","TA61":"UIM 83","TE18":"UIM 83","TE91":"DON 29","TX1":"DON 29","KTX1":"DON 29","TX40":"DON 29","TX85":"DON 29","XA28":"DON 29","XA58":"DON 29","XS91":"DON 29"};

  function recordUsesGGGApproach(record) {
    const apps = Array.isArray(record && record.apps) ? record.apps : [];
    const appText = apps.map((app) => String(app || "").toUpperCase()).join(" ");
    return appText.includes("GGG APP") || appText.includes("LONGVIEW APP");
  }

  function applyGGGAppSectorDefaults() {
    Object.keys(GGG_APP_SECTOR_DEFAULTS).forEach((ident) => {
      const found = lookupRecord(ident);
      if (!found || !found.record || !recordUsesGGGApproach(found.record)) return;

      const sector = GGG_APP_SECTOR_DEFAULTS[ident];
      const area = SECTOR_TO_AREA[sector] || "";

      found.record.record_type = "AIRPORT";
      found.record.sectors = [sector];
      found.record.areas = area ? [area] : [];

      if (ident === "60TA") {
        found.record.airport_name = "UT Health Henderson Heliport";
        found.record.lat = 32.161186;
        found.record.lon = -94.794822;
        found.record.nearest_wx = "RFI";
      }
    });
  }

  
  function applyAslSixf7DepartureRules() {
    const ewDepartureUpdates = {
      apps: ["SHV APP", "GGG APP"],
      vscs: ["351 (05)", "349 (03)"],
      contacts: [
        "E Dep: SHV APP VSCS 351 (05) TEL (318) 747-8519",
        "W Dep: GGG APP VSCS 349 (03) TEL (903) 643-4020"
      ],
      hours: ["E Dep SHV 0000-2359", "W Dep GGG 0600-2200"]
    };

    ["ASL", "KASL"].forEach((ident) => {
      const found = lookupRecord(ident);
      if (!found || !found.record) return;
      found.record.record_type = "AIRPORT";
      found.record.sectors = ["MLU 30"];
      found.record.areas = ["CQY"];
      found.record.apps = ewDepartureUpdates.apps.slice();
      found.record.vscs = ewDepartureUpdates.vscs.slice();
      found.record.contacts = ewDepartureUpdates.contacts.slice();
      found.record.hours = ewDepartureUpdates.hours.slice();
    });

    ["6F7"].forEach((ident) => {
      const found = lookupRecord(ident);
      if (!found || !found.record) return;
      found.record.record_type = "AIRPORT";
      const sector = GGG_APP_SECTOR_DEFAULTS["6F7"] || "UIM 83";
      found.record.sectors = [sector];
      found.record.areas = [SECTOR_TO_AREA[sector] || "DAL"];
      found.record.apps = ewDepartureUpdates.apps.slice();
      found.record.vscs = ewDepartureUpdates.vscs.slice();
      found.record.contacts = ewDepartureUpdates.contacts.slice();
      found.record.hours = ewDepartureUpdates.hours.slice();
    });
  }

  function applyAirportNameFallbacks() {
    const records = getRecords();
    Object.keys(records).forEach((ident) => {
      const record = records[ident];
      if (!record) return;
      const recordType = String(record.record_type || record.type || "").toUpperCase();
      const isAirport = recordType === "AIRPORT" ||
        (Array.isArray(record.apps) && record.apps.length) ||
        (Array.isArray(record.sectors) && record.sectors.length) ||
        (Array.isArray(record.contacts) && record.contacts.length) ||
        (Array.isArray(record.hours) && record.hours.length);

      if (isAirport && !String(record.airport_name || "").trim()) {
        record.airport_name = ident + " Airport";
      }
    });
  }

  
  const AIRPORT_NEAREST_WX_SECTOR_DEFAULTS = {"MAF 40":"MDD","EDN 62":"INJ","ACT 96":"INJ","ABI 63":"SWW","SPS 34":"DUC","OKC 35":"OJA","UKW 75":"GLE","SEA 37":"SWI","MLC 38":"SRE","FRI 53":"GLE","POS 32":"GLE","LBB 64":"PVW","TXK 27":"TXK","UIM 83":"JDD","DON 29":"TYR","MLU 30":"MLU"};
  const AIRPORT_NEAREST_WX_IDENT_DEFAULTS = {"OL50":"LTS","TS30":"LTS","02LA":"SHV","0LA4":"SHV","15LA":"SHV","41LA":"SHV","43LA":"SHV","5LA0":"SHV","73LA":"SHV","77LA":"SHV","84LA":"SHV","L87":"SHV","LA19":"SHV","LA85":"SHV","LA94":"SHV","LS07":"SHV","LS29":"SHV","LS41":"SHV","LS78":"SHV","TS32":"SHV","03TS":"SJT","24TT":"SJT","7TA9":"SJT"};

  function applyNearestWxFallbacks() {
    const records = getRecords();
    const stationIds = new Set(
      (window.ZFW_WEATHER_STATIONS || [])
        .map((station) => String(station && station.id || "").trim().toUpperCase())
        .filter(Boolean)
    );

    Object.keys(records).forEach((ident) => {
      const record = records[ident];
      if (!record) return;

      const recordType = String(record.record_type || record.type || "").toUpperCase();
      const isAirport = recordType === "AIRPORT" ||
        (Array.isArray(record.apps) && record.apps.length) ||
        (Array.isArray(record.sectors) && record.sectors.length) ||
        (Array.isArray(record.contacts) && record.contacts.length) ||
        (Array.isArray(record.hours) && record.hours.length);

      if (!isAirport) return;

      if (ident === "GTH" || ident === "KGTH") {
        record.record_type = "AIRPORT";
        record.airport_name = "Guthrie Airport";
        record.sectors = ["LBB 64"];
        record.areas = ["RDR"];
        record.nearest_wx = "CDS";
        return;
      }

      const current = String(record.nearest_wx || "").trim().toUpperCase();
      if (current && (!stationIds.size || stationIds.has(current))) return;

      if (AIRPORT_NEAREST_WX_IDENT_DEFAULTS[ident]) {
        record.nearest_wx = AIRPORT_NEAREST_WX_IDENT_DEFAULTS[ident];
        return;
      }

      const baseIdent = /^K[A-Z0-9]{3}$/.test(ident) ? ident.slice(1) : ident;
      if (stationIds.has(baseIdent)) {
        record.nearest_wx = baseIdent;
        return;
      }

      const sector = Array.isArray(record.sectors) && record.sectors.length ? record.sectors[0] : "";
      if (AIRPORT_NEAREST_WX_SECTOR_DEFAULTS[sector]) {
        record.nearest_wx = AIRPORT_NEAREST_WX_SECTOR_DEFAULTS[sector];
      }
    });
  }

  
  const APPROACH_ONLY_SECTOR_DEFAULTS = {"SHV APP":"MLU 30","LTS APP":"OKC 35","SJT APP":"MAF 40"};

  function applyApproachOnlySectorDefaults() {
    const records = getRecords();

    Object.keys(records).forEach((ident) => {
      const record = records[ident];
      if (!record) return;

      const recordType = String(record.record_type || record.type || "").toUpperCase();
      if (["NAVAID", "WAYPOINT", "FIX", "VOR", "VORTAC", "NDB"].includes(recordType)) return;

      if (Array.isArray(record.sectors) && record.sectors.length) return;

      const apps = Array.isArray(record.apps) ? record.apps : [];
      const appText = apps.map((app) => String(app || "").toUpperCase()).join(" ");

      Object.keys(APPROACH_ONLY_SECTOR_DEFAULTS).forEach((appName) => {
        if (!appText.includes(appName)) return;

        const sector = APPROACH_ONLY_SECTOR_DEFAULTS[appName];
        const area = SECTOR_TO_AREA[sector] || "";

        record.record_type = "AIRPORT";
        record.sectors = [sector];
        record.areas = area ? [area] : [];
      });
    });
  }

  
  function applyDirectAirportOverrides() {
    ["LBB", "KLBB"].forEach((ident) => {
      const found = lookupRecord(ident);
      if (!found || !found.record) return;
      found.record.record_type = "AIRPORT";
      found.record.sectors = ["LBB 64"];
      found.record.areas = ["RDR"];
      found.record.apps = ["LBB APP"];
      found.record.nearest_wx = "LBB";
      if (!String(found.record.airport_name || "").trim()) {
        found.record.airport_name = "Lubbock Preston Smith International Airport";
      }
    });

    ["7F7", "K7F7"].forEach((ident) => {
      const found = lookupRecord(ident);
      if (!found || !found.record) return;
      found.record.record_type = "AIRPORT";
      found.record.sectors = ["ACT 96"];
      found.record.areas = ["DAL"];
    });
  }

  function applyBuiltInAirportCorrections() {
    const records = getRecords();

    Object.keys(AIRSPACE_SECTOR_REVALIDATIONS).forEach((ident) => {
      const found = lookupRecord(ident);
      if (!found || !found.record) return;

      const override = AIRSPACE_SECTOR_REVALIDATIONS[ident];
      found.record.record_type = found.record.record_type || "AIRPORT";
      found.record.sectors = (override.sectors || []).slice();
      found.record.areas = (override.areas || []).slice();
    });

    Object.keys(records).forEach((ident) => {
      const record = records[ident];
      const sectors = Array.isArray(record && record.sectors) ? record.sectors : [];
      const isLbbSector = sectors.includes("LBB 64") || (AIRSPACE_SECTOR_REVALIDATIONS[ident] && AIRSPACE_SECTOR_REVALIDATIONS[ident].sectors.includes("LBB 64"));
      if (isLbbSector && !LBB_APP_AUTHORIZED_AIRPORTS.has(ident)) {
        removeAppFromRecord(record, "LBB APP");
      }
    });

    ["KGNC", "GNC", "KLUV", "LUV", "GTH", "KGTH"].forEach((ident) => {
      const found = lookupRecord(ident);
      if (!found || !found.record) return;
      found.record.record_type = found.record.record_type || "AIRPORT";
      found.record.sectors = ["LBB 64"];
      found.record.areas = ["RDR"];
      removeAppFromRecord(found.record, "LBB APP");
    });

    ["E06"].forEach((ident) => {
      const found = lookupRecord(ident);
      if (!found || !found.record) return;
      found.record.record_type = found.record.record_type || "AIRPORT";
      found.record.sectors = ["MAF 40"];
      found.record.areas = ["JEN"];
      removeAppFromRecord(found.record, "LBB APP");
    });

    ["COM", "KCOM"].forEach((ident) => {
      const found = lookupRecord(ident);
      if (!found || !found.record) return;
      found.record.record_type = "AIRPORT";
      found.record.sectors = ["ABI 63"];
      found.record.areas = ["JEN"];
      found.record.apps = [];
      found.record.vscs = [];
      found.record.contacts = [];
      found.record.hours = [];
    });

    const ewDepartureUpdates = {
      apps: ["SHV APP", "GGG APP"],
      vscs: ["351 (05)", "349 (03)"],
      contacts: [
        "E Dep: SHV APP VSCS 351 (05) TEL (318) 747-8519",
        "W Dep: GGG APP VSCS 349 (03) TEL (903) 643-4020"
      ],
      hours: ["E Dep SHV 0000-2359", "W Dep GGG 0600-2200"]
    };

    ["ASL", "KASL"].forEach((ident) => {
      const found = lookupRecord(ident);
      if (!found || !found.record) return;
      found.record.record_type = "AIRPORT";
      found.record.sectors = ["MLU 30"];
      found.record.areas = ["CQY"];
      found.record.apps = ewDepartureUpdates.apps.slice();
      found.record.vscs = ewDepartureUpdates.vscs.slice();
      found.record.contacts = ewDepartureUpdates.contacts.slice();
      found.record.hours = ewDepartureUpdates.hours.slice();
    });

    ["6F7"].forEach((ident) => {
      const found = lookupRecord(ident);
      if (!found || !found.record) return;
      found.record.record_type = "AIRPORT";
      found.record.apps = ewDepartureUpdates.apps.slice();
      found.record.vscs = ewDepartureUpdates.vscs.slice();
      found.record.contacts = ewDepartureUpdates.contacts.slice();
      found.record.hours = ewDepartureUpdates.hours.slice();
    });

    const lbbAppAuthorizedAirports = ["0TA2","0XA6","1TX5","2F4","2TX6","30TE","41F","47XS","5F1","6TS0","74TS","7TA3","82TE","8F3","8XS8","9TX2","9TX3","F49","F82","KBFE","KLBB","KLIU","KLLN","KPVW","T96","TA67","TA79","TE70","TS22","TS66","TS84","TX63","XA25","XS06","BFE","LBB","LIU","LLN","PVW"];
    lbbAppAuthorizedAirports.forEach((ident) => {
      const found = lookupRecord(ident);
      if (!found || !found.record) return;
      found.record.record_type = "AIRPORT";
      found.record.sectors = Array.isArray(found.record.sectors) ? found.record.sectors : [];
      found.record.areas = Array.isArray(found.record.areas) ? found.record.areas : [];
      found.record.apps = Array.isArray(found.record.apps) ? found.record.apps : [];
      found.record.vscs = Array.isArray(found.record.vscs) ? found.record.vscs : [];
      found.record.contacts = Array.isArray(found.record.contacts) ? found.record.contacts : [];
      found.record.hours = Array.isArray(found.record.hours) ? found.record.hours : [];

      if (!found.record.sectors.includes("LBB 64")) found.record.sectors.push("LBB 64");
      if (!found.record.areas.includes("RDR")) found.record.areas.push("RDR");
      if (!found.record.apps.includes("LBB APP")) found.record.apps.push("LBB APP");
      if (!found.record.vscs.length) found.record.vscs.push("344 (04)");
      if (!found.record.contacts.length) found.record.contacts.push("(806) 474-0450");
      if (!found.record.hours.length) found.record.hours.push("0000-2359");
    });

    applyD10OutageSectorDefaults();

    applyGGGAppSectorDefaults();

    applyAslSixf7DepartureRules();

    applyAirportNameFallbacks();

    applyNearestWxFallbacks();

    applyApproachOnlySectorDefaults();

    applyDirectAirportOverrides();

  }

  function showMessage(message, isError) {
    const existing = document.getElementById("correctionMessage");
    if (!existing) return;

    existing.textContent = message;
    existing.className = isError ? "correction-message error" : "correction-message";
  }

  function fillFormFromRecord(form, ident, record) {
    record = record || {};
    setFormValue(form, "identifier", ident || "");
    setFormValue(form, "airportName", record.airport_name || "");
    setFormValue(form, ["sectors", "sector"], (record.sectors || []).join(", "));
    setFormValue(form, ["areas", "area"], (record.areas || []).join(", "));
    setFormValue(form, ["apps", "app", "approach"], (record.apps || []).join(", "));
    setFormValue(form, "vscs", (record.vscs || []).join(", "));
    setFormValue(form, ["contacts", "contact"], (record.contacts || []).join(", "));
    setFormValue(form, "hours", (record.hours || []).join(", "));
    setFormValue(form, "lat", Number.isFinite(Number(record.lat)) ? String(record.lat) : "");
    setFormValue(form, "lon", Number.isFinite(Number(record.lon)) ? String(record.lon) : "");
  }

  function clearForm(form) {
    Array.from(form.elements).forEach((element) => {
      if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
        element.value = "";
      }
    });
  }

  function openModal(mode) {
    const modal = document.getElementById("correctionModal");
    const form = document.getElementById("correctionForm");
    const title = document.getElementById("correctionModalTitle");
    const submitButton = document.getElementById("correctionSubmit");
    const currentSearch = document.getElementById("airportInput");

    clearForm(form);
    showMessage("", false);

    form.dataset.mode = "combined";
    title.textContent = "Add/Amend Airport";
    submitButton.textContent = "Save Airport";

    const currentIdent = normalizeIdent(currentSearch ? currentSearch.value : "");
    if (currentIdent) {
      const found = lookupRecord(currentIdent);
      if (found) {
        fillFormFromRecord(form, found.ident, found.record);
      } else {
        setFormValue(form, "identifier", currentIdent);
      }
    }

    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("correction-modal-open");
    setTimeout(() => { const idField = form.elements.identifier || form.querySelector("[name=\"identifier\"]"); if (idField) idField.focus(); }, 0);
  }

  function closeModal() {
    const modal = document.getElementById("correctionModal");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("correction-modal-open");
  }

  function refreshCurrentLookup(ident) {
    const input = document.getElementById("airportInput");
    if (!input) return;

    input.value = ident;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.focus();
  }

  function createCorrectionUi() {
    if (document.getElementById("correctionModal")) return;

    const style = document.createElement("style");
    style.textContent = `
      .correction-tools {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        margin-top: 10px;
      }

      .correction-tools button,
      .correction-modal button {
        border: 0;
        border-radius: 10px;
        background: #156082;
        color: #ffffff;
        font-weight: 700;
        padding: 10px 14px;
        cursor: pointer;
      }

      .correction-tools button.secondary {
        background: #475569;
      }

      .correction-modal[aria-hidden="true"] {
        display: none;
      }

      .correction-modal[aria-hidden="false"] {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        background: rgba(15, 23, 42, 0.78);
      }

      .correction-panel {
        width: min(920px, 100%);
        max-height: 92vh;
        overflow: auto;
        background: #ffffff;
        color: #0f172a;
        border-radius: 18px;
        box-shadow: 0 24px 70px rgba(0, 0, 0, 0.35);
        padding: 24px;
      }

      .correction-panel h2 {
        margin: 0 0 6px;
        font-size: 1.45rem;
      }

      .correction-panel p {
        margin: 0 0 18px;
        color: #475569;
      }

      .correction-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }

      .correction-field.full {
        grid-column: 1 / -1;
      }

      .correction-field label {
        display: block;
        font-weight: 700;
        margin-bottom: 5px;
      }

      .correction-field input,
      .correction-field textarea {
        width: 100%;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        padding: 10px 12px;
        font: inherit;
        box-sizing: border-box;
      }

      .correction-field textarea {
        min-height: 72px;
        resize: vertical;
      }

      .correction-help {
        margin-top: 4px;
        color: #64748b;
        font-size: 0.85rem;
      }

      .correction-actions {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 18px;
      }

      .correction-actions .cancel {
        background: #64748b;
      }

      .correction-message {
        margin-top: 12px;
        font-weight: 700;
        color: #166534;
      }

      .correction-message.error {
        color: #b91c1c;
      }

      body.correction-modal-open {
        overflow: hidden;
      }

      @media (max-width: 720px) {
        .correction-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);

    let tools = document.getElementById("correctionTools");
    if (!tools) {
      tools = document.createElement("div");
      tools.id = "correctionTools";
      tools.className = "correction-tools";
      tools.innerHTML = `
        <button type="button" id="amendAirportButton">Add/Amend Airport</button>
      `;

      const searchRow = document.querySelector(".search-row");
      if (searchRow) {
        searchRow.appendChild(tools);
      }
    }

    const modal = document.createElement("div");
    modal.id = "correctionModal";
    modal.className = "correction-modal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="correction-panel" role="dialog" aria-modal="true" aria-labelledby="correctionModalTitle">
        <h2 id="correctionModalTitle">Airport Correction</h2>
        <p>Add or amend a local airport record. Separate multiple sectors, apps, VSCS entries, contacts, or hours with commas.</p>

        <form id="correctionForm" novalidate>
          <div class="correction-grid">
            <div class="correction-field">
              <label for="corrIdentifier">Airport Identifier</label>
              <input id="corrIdentifier" name="identifier" type="text" maxlength="5" required />
              <div class="correction-help">Examples: F82, KGGG, GGG</div>
            </div>

            <div class="correction-field">
              <label for="corrAirportName">Airport Name</label>
              <input id="corrAirportName" name="airportName" type="text" />
            </div>

            <div class="correction-field">
              <label for="corrSectors">Sector</label>
              <input id="corrSectors" name="sectors" type="text" placeholder="LBB L, LBB-L, LBB 64, or 64" />
              <div class="correction-help">Common shorthand is accepted and normalized.</div>
            </div>

            <div class="correction-field">
              <label for="corrAreas">Area</label>
              <input id="corrAreas" name="areas" type="text" placeholder="RDR, UKW, JEN, DAL, BYP, CQY" />
              <div class="correction-help">Leave blank to derive area from the sector when possible.</div>
            </div>

            <div class="correction-field">
              <label for="corrApps">Approach</label>
              <input id="corrApps" name="apps" type="text" placeholder="LBB, LBB APP, SPS APP" />
            </div>

            <div class="correction-field">
              <label for="corrVscs">APP VSCS</label>
              <input id="corrVscs" name="vscs" type="text" placeholder='346 (05), 353 (04), 337 (08)' />
            </div>

            <div class="correction-field full">
              <label for="corrContacts">APP Contact / Notes</label>
              <textarea id="corrContacts" name="contacts" placeholder="Phone Number and Additional Info (Do Not Enter Military Approach Control Numbers)"></textarea>
              <div class="correction-help">Phone Number and Additional Info (Do Not Enter Military Approach Control Numbers)</div>
            </div>

            <div class="correction-field">
              <label for="corrHours">APP Hours</label>
              <input id="corrHours" name="hours" type="text" placeholder="0000-2359" />
            </div>

            <div class="correction-field">
              <label for="corrLat">Latitude</label>
              <input id="corrLat" name="lat" type="number" step="0.0001" placeholder="33.1234" />
              <div class="correction-help">Approximation is okay. Four decimals is enough.</div>
            </div>

            <div class="correction-field">
              <label for="corrLon">Longitude</label>
              <input id="corrLon" name="lon" type="number" step="0.0001" placeholder="-101.1234" />
              <div class="correction-help">Approximation is okay. Four decimals is enough.</div>
            </div>
          </div>

          <div id="correctionMessage" class="correction-message"></div>

          <div class="correction-actions">
            <button type="button" class="cancel" id="correctionCancel">Cancel</button>
            <button type="submit" id="correctionSubmit">Save</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    const addAirportButton = document.getElementById("addAirportButton");
    const amendAirportButton = document.getElementById("amendAirportButton");

    if (addAirportButton) {
      addAirportButton.addEventListener("click", () => openModal("combined"));
    }

    if (amendAirportButton) {
      amendAirportButton.addEventListener("click", () => openModal("combined"));
    }
    document.getElementById("correctionCancel").addEventListener("click", closeModal);

    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.getAttribute("aria-hidden") === "false") closeModal();
    });

    const correctionSubmitButton = document.getElementById("correctionSubmit");
    const correctionForm = document.getElementById("correctionForm");
    if (correctionSubmitButton && correctionForm && correctionSubmitButton.dataset.forceSubmitBound !== "true") {
      correctionSubmitButton.dataset.forceSubmitBound = "true";
      correctionSubmitButton.addEventListener("click", function (event) {
        event.preventDefault();
        correctionForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      });
    }

    document.getElementById("correctionForm").addEventListener("submit", function (event) {
      event.preventDefault();

      const mode = this.dataset.mode;
      const { ident, record } = makeRecordFromForm(this);

      if (!ident) {
        showMessage("Airport identifier is required.", true);
        return;
      }

      if (Number.isNaN(record.lat) || Number.isNaN(record.lon)) {
        showMessage("Latitude and longitude must be valid numbers when entered. APP, contact, VSCS, and hours may be left blank when none apply.", true);
        return;
      }

      const corrections = loadCorrections();
      corrections[ident] = record;
      saveCorrections(corrections);
      applyOneCorrection(ident, record);

      if (window.ZFW_SAVE_SHARED_RECORD) {
        window.ZFW_SAVE_SHARED_RECORD("airport", ident, record)
          .then(function (saved) {
            showMessage(saved
              ? "Airport saved for all PCs."
              : "Airport saved locally only. Firebase is not configured.",
              !saved
            );
          })
          .catch(function (error) {
            console.error(error);
            showMessage("Airport saved locally, but Firestore save failed. Check Firebase config/rules.", true);
          });
      } else {
        showMessage("Airport saved locally only.", false);
      }

      refreshCurrentLookup(ident);

      setTimeout(closeModal, 600);
    });
  }

  applySavedCorrections();
  applyBuiltInAirportCorrections();

  let zfwBuiltInAirportCorrectionRuns = 0;
  const zfwBuiltInAirportCorrectionTimer = setInterval(function () {
    applyBuiltInAirportCorrections();
    zfwBuiltInAirportCorrectionRuns += 1;
    if (zfwBuiltInAirportCorrectionRuns >= 12) {
      clearInterval(zfwBuiltInAirportCorrectionTimer);
    }
  }, 500);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createCorrectionUi);
  } else {
    createCorrectionUi();
  }
})();


/* PIREP waypoint/navaid add-amend tool */
(function () {
  "use strict";

  const STORAGE_KEY = "zfwPirepNavCorrections";

  function normalizeIdent(value) {
    return String(value || "").trim().toUpperCase();
  }

  function getAirportRecords() {
    if (!window.AIRPORT_DATA) window.AIRPORT_DATA = { records: {} };
    if (!window.AIRPORT_DATA.records) window.AIRPORT_DATA.records = {};
    return window.AIRPORT_DATA.records;
  }

  function getNavData() {
    if (!window.ZFW_NAV_DATA) window.ZFW_NAV_DATA = {};
    return window.ZFW_NAV_DATA;
  }

  function loadCorrections() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch (error) {
      console.warn("Could not read PIREP waypoint/navaid corrections.", error);
      return {};
    }
  }

  function saveCorrections(corrections) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(corrections));
  }

  function applyPirepCorrection(ident, record) {
    const navData = getNavData();
    const airportRecords = getAirportRecords();

    ident = normalizeIdent(ident);

    // Navaids/waypoints are FAA identifiers, not airports. Never store a K-prefixed alias.
    if (ident.length === 4 && ident.startsWith("K")) {
      ident = ident.slice(1);
    }

    record.record_type = record.record_type || "WAYPOINT";

    delete navData[ident];
    delete airportRecords[ident];

    const fakeK = "K" + ident;
    if (airportRecords[fakeK] && String(airportRecords[fakeK].record_type || "").toUpperCase() !== "AIRPORT") {
      delete airportRecords[fakeK];
    }

    navData[ident] = JSON.parse(JSON.stringify(record));
    airportRecords[ident] = JSON.parse(JSON.stringify(record));
  }

  function applySavedPirepCorrections() {
    const corrections = loadCorrections();
    Object.keys(corrections).forEach(function (ident) {
      applyPirepCorrection(ident, corrections[ident]);
    });
  }

  function findExistingRecord(ident) {
    ident = normalizeIdent(ident);
    const navData = getNavData();
    const airportRecords = getAirportRecords();

    if (navData[ident]) return navData[ident];
    if (airportRecords[ident]) return airportRecords[ident];

    return null;
  }

  function showPirepMessage(message, isError) {
    const msg = document.getElementById("pirepNavMessage");
    if (!msg) return;

    msg.textContent = message;
    msg.className = isError ? "correction-message error" : "correction-message";
  }

  function clearPirepForm(form) {
    Array.from(form.elements).forEach(function (element) {
      if (element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.tagName === "SELECT") {
        element.value = "";
      }
    });
  }

  function fillPirepForm(form, ident, record) {
    form.identifier.value = ident || "";

    form.recordType.value = record.record_type || "WAYPOINT";
    form.nearestWx.value = record.nearest_wx || "";

    if (form.notes) form.notes.value = Array.isArray(record.contacts) ? record.contacts.join(", ") : "";
  }

  function makePirepRecordFromForm(form) {
    const ident = normalizeIdent(form.identifier.value);

    const record = {
      sectors: [],
      areas: [],
      apps: [],
      vscs: [],
      contacts: [],
      hours: [],
      airport_name: ident,
      record_type: form.recordType.value || "WAYPOINT",
      nearest_wx: normalizeIdent(form.nearestWx.value)
    };

    return { ident, record };
  }

  function openPirepModal() {
    const modal = document.getElementById("pirepNavModal");
    const form = document.getElementById("pirepNavForm");
    const input = document.getElementById("airportInput");

    clearPirepForm(form);
    showPirepMessage("", false);

    const currentIdent = normalizeIdent(input ? input.value : "");
    if (currentIdent) {
      const existing = findExistingRecord(currentIdent);
      if (existing) {
        fillPirepForm(form, currentIdent, existing);
        showPirepMessage("Existing waypoint/navaid loaded. Saving will replace the old data.", false);
      } else {
        form.identifier.value = currentIdent;
      }
    }

    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("correction-modal-open");
    setTimeout(function () { form.identifier.focus(); }, 0);
  }

  function closePirepModal() {
    const modal = document.getElementById("pirepNavModal");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("correction-modal-open");
  }

  function refreshCurrentLookup(ident) {
    const input = document.getElementById("airportInput");
    if (!input) return;

    input.value = ident;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));

    if (window.ZFW_UPDATE_NEAREST_WX) {
      setTimeout(window.ZFW_UPDATE_NEAREST_WX, 0);
      setTimeout(window.ZFW_UPDATE_NEAREST_WX, 100);
    }

    input.focus();
  }

  function bindPirepNavButton() {
    let button = document.getElementById("addPirepNavButton");
    const tools = document.getElementById("correctionTools");

    if (!button && tools) {
      button = document.createElement("button");
      button.type = "button";
      button.id = "addPirepNavButton";
      button.className = "secondary";
      button.textContent = "Add/Amend Waypoint/Navaid for PIREP";
      tools.appendChild(button);
    }

    if (button && button.dataset.pirepNavBound !== "true") {
      button.dataset.pirepNavBound = "true";
      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        openPirepModal();
      }, true);
    }
  }

  function createPirepUi() {
    bindPirepNavButton();

    if (document.getElementById("pirepNavModal")) return;

    const modal = document.createElement("div");
    modal.id = "pirepNavModal";
    modal.className = "correction-modal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="correction-panel" role="dialog" aria-modal="true" aria-labelledby="pirepNavModalTitle">
        <h2 id="pirepNavModalTitle">Add/Amend Waypoint/Navaid for PIREP</h2>
        <p>Use this form to add/amend PIREP reference fixes (Waypoints/Navaids). Saving an existing identifier replaces the old waypoint/navaid weather station data.</p>

        <form id="pirepNavForm">
          <div class="correction-grid">
            <div class="correction-field">
              <label for="pirepIdentifier">Waypoint/Navaid Identifier</label>
              <input id="pirepIdentifier" name="identifier" type="text" maxlength="5" required />
              <div class="correction-help">Examples: BYP, EMG, CHMLI, BSKAT</div>
            </div>

            <div class="correction-field">
              <label for="pirepRecordType">Type</label>
              <select id="pirepRecordType" name="recordType">
                <option value="WAYPOINT">Waypoint</option>
                <option value="NAVAID">Navaid</option>
              </select>
            </div>

<div class="correction-field">
              <label for="pirepNearestWx">Nearest Weather Reporting Station</label>
              <input id="pirepNearestWx" name="nearestWx" type="text" maxlength="4" required />
              <div class="correction-help">Enter the valid reporting station identifier only, such as SHV, F00, SPS, GGG.</div>
            </div>
          </div>

          <div id="pirepNavMessage" class="correction-message"></div>

          <div class="correction-actions">
            <button type="button" class="cancel" id="pirepNavCancel">Cancel</button>
            <button type="submit" id="pirepNavSubmit">Save Waypoint/Navaid</button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("pirepNavCancel").addEventListener("click", closePirepModal);

    modal.addEventListener("click", function (event) {
      if (event.target === modal) closePirepModal();
    });

    document.getElementById("pirepNavForm").addEventListener("submit", function (event) {
      event.preventDefault();

      const result = makePirepRecordFromForm(this);
      let ident = result.ident;
      const record = result.record;

      if (ident.length === 4 && ident.startsWith("K")) {
        ident = ident.slice(1);
      }

      if (!ident) {
        showPirepMessage("Waypoint/navaid identifier is required.", true);
        return;
      }

if (!record.nearest_wx) {
        showPirepMessage("Nearest weather reporting station is required.", true);
        return;
      }

const corrections = loadCorrections();
      corrections[ident] = record;
      saveCorrections(corrections);
      applyPirepCorrection(ident, record);

      if (window.ZFW_SAVE_SHARED_RECORD) {
        window.ZFW_SAVE_SHARED_RECORD("navpoint", ident, record)
          .then(function (saved) {
            showPirepMessage(saved
              ? "Waypoint/navaid saved for all PCs."
              : "Waypoint/navaid saved locally only. Firebase is not configured.",
              !saved
            );
          })
          .catch(function (error) {
            console.error(error);
            showPirepMessage("Waypoint/navaid saved locally, but Firestore save failed. Check Firebase config/rules.", true);
          });
      } else {
        showPirepMessage("Waypoint/navaid saved locally only.", false);
      }

      refreshCurrentLookup(ident);
      setTimeout(closePirepModal, 700);
    });
  }

  applySavedPirepCorrections();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", createPirepUi);
  } else {
    createPirepUi();
  }
})();




/* PIREP waypoint/navaid button safety rebinder */
(function () {
  "use strict";

  function tryOpenPirepModal() {
    const modal = document.getElementById("pirepNavModal");
    const form = document.getElementById("pirepNavForm");
    const input = document.getElementById("airportInput");

    if (!modal || !form) return false;

    Array.from(form.elements).forEach(function (element) {
      if (element.tagName === "INPUT" || element.tagName === "TEXTAREA" || element.tagName === "SELECT") {
        element.value = "";
      }
    });

    const currentIdent = String((input && input.value) || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (currentIdent && form.identifier) {
      form.identifier.value = currentIdent;
    }

    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("correction-modal-open");
    setTimeout(function () {
      if (form.identifier) form.identifier.focus();
    }, 0);

    return true;
  }

  function zfwPirepNavButtonSafetyRebind() {
    const button = document.getElementById("addPirepNavButton");
    if (!button || button.dataset.pirepSafetyBound === "true") return;

    button.dataset.pirepSafetyBound = "true";
    button.addEventListener("click", function (event) {
      if (tryOpenPirepModal()) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", zfwPirepNavButtonSafetyRebind);
  } else {
    zfwPirepNavButtonSafetyRebind();
  }

  setInterval(zfwPirepNavButtonSafetyRebind, 500);
})();


/* Combined Add/Amend button behavior */
(function () {
  "use strict";

  function normalizeIdent(value) {
    return String(value || "").trim().toUpperCase();
  }

  function getAirportRecords() {
    if (!window.AIRPORT_DATA) window.AIRPORT_DATA = { records: {} };
    if (!window.AIRPORT_DATA.records) window.AIRPORT_DATA.records = {};
    return window.AIRPORT_DATA.records;
  }

  function airportExists(ident) {
    ident = normalizeIdent(ident);
    const records = getAirportRecords();
    if (records[ident]) return true;
    if (ident.length === 4 && ident.startsWith("K") && records[ident.slice(1)]) return true;
    if (ident.length === 3 && records["K" + ident]) return true;
    return false;
  }

  function createCombinedButtonCleanup() {
    const addAirportButton = document.getElementById("addAirportButton");
    const amendAirportButton = document.getElementById("amendAirportButton");

    if (amendAirportButton) {
      amendAirportButton.textContent = "Add/Amend Airport";
      amendAirportButton.style.display = "";
    }

    if (addAirportButton && amendAirportButton && addAirportButton !== amendAirportButton) {
      addAirportButton.style.display = "none";
    } else if (addAirportButton) {
      addAirportButton.textContent = "Add/Amend Airport";
    }

    const pirepButton = document.getElementById("addPirepNavButton");
    if (pirepButton) {
      pirepButton.textContent = "Add/Amend Waypoint/Navaid for PIREP";
    }
  }

  function patchAirportFormSubmit() {
    const form = document.getElementById("correctionForm");
    if (!form || form.dataset.combinedAddAmendPatched === "true") return;

    form.dataset.combinedAddAmendPatched = "true";

    // Force all airport corrections through amend mode. The existing submit logic
    // treats amend as replace when record exists and add when record does not, after this patch.
    form.addEventListener("submit", function () {
      form.dataset.mode = "combined";
    }, true);
  }

  // Patch the legacy modal title after it opens.
  function patchModalText() {
    const title = document.getElementById("correctionModalTitle");
    const submit = document.getElementById("correctionSubmit");
    if (title) title.textContent = "Add/Amend Airport";
    if (submit) submit.textContent = "Save Airport";
  }

  function observeModal() {
    const modal = document.getElementById("correctionModal");
    if (!modal || !window.MutationObserver) return;

    new MutationObserver(function () {
      if (modal.getAttribute("aria-hidden") === "false") {
        patchModalText();
        patchAirportFormSubmit();
      }
    }).observe(modal, { attributes: true, attributeFilter: ["aria-hidden"] });
  }

  function boot() {
    createCombinedButtonCleanup();
    patchAirportFormSubmit();
    observeModal();

    setInterval(function () {
      createCombinedButtonCleanup();
      patchModalText();
    }, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();



/* Airport form dropdown/GPS enhancement */
(function () {
  "use strict";

  const LOW_SECTORS = [
    "",
    "MAF-L 40",
    "LBB-L 64",
    "ABI-L 63",
    "EDN-L 62",
    "SPS-L 34",
    "OKC-L 35",
    "UKW-L 75",
    "POS-L 32",
    "ACT-L 96",
    "FRI-L 53",
    "MLC-L 38",
    "SEA-L 37",
    "UIM-L 83",
    "DON-L 29",
    "MLU-L 30",
    "TXK-L 27"
  ];

  const AREAS = ["", "DAL", "CQY", "BYP", "JEN", "UKW", "RDR"];

  const APPROACHES = [
    "N/A",
    "D10 APP", "LBB APP", "SPS APP", "LTS APP", "FSI APP",
    "GGG APP", "SHV APP", "TYR APP", "ACT APP", "ABI APP", "SJT APP",
    "MLU APP", "FSM APP", "OKC APP", "TUL APP", "LAW APP"
  ];

  function normalizeIdent(value) {
    return String(value || "").trim().toUpperCase();
  }

  function sectorOptionKey(value) {
    const text = String(value || "").trim().toUpperCase();
    const match = text.match(/^([A-Z]{2,4})[\s-]*L?[\s-]*(\d{2})$/);
    if (match) return match[1] + match[2];
    return normalizeIdent(text);
  }

  function optionHtml(values, selected) {
    const selectedKey = sectorOptionKey(selected);
    return values.map(function (value) {
      const label = value || "";
      const sel = sectorOptionKey(value) === selectedKey ? " selected" : "";
      return `<option value="${value}"${sel}>${label || "Select"}</option>`;
    }).join("");
  }

  function replaceInputWithSelect(input, values, currentValue) {
    if (!input || input.tagName === "SELECT") return input;

    const select = document.createElement("select");
    select.id = input.id;
    select.name = input.name;
    select.className = input.className;
    select.innerHTML = optionHtml(values, currentValue || input.value || input.placeholder || "");

    input.replaceWith(select);
    return select;
  }

  function dmmToDecimal(deg, minutes, hemi) {
    let value = Number(deg) + Number(minutes) / 60;
    if (String(hemi).toUpperCase() === "S" || String(hemi).toUpperCase() === "W") {
      value *= -1;
    }
    return Math.round(value * 10000) / 10000;
  }

  function parseSkyVectorGps(value) {
    const text = String(value || "").toUpperCase().replace(/GPS/g, "").trim();

    // Accept N33°39.84' W101°49.07'
    let m = text.match(/([NS])\s*(\d{1,2})\s*[°\s]\s*(\d{1,2}(?:\.\d+)?)\s*['’]?\s*[, ]+\s*([EW])\s*(\d{1,3})\s*[°\s]\s*(\d{1,2}(?:\.\d+)?)\s*['’]?/);
    if (m) {
      return {
        lat: dmmToDecimal(m[2], m[3], m[1]),
        lon: dmmToDecimal(m[5], m[6], m[4])
      };
    }

    // Accept 33°39.84'N 101°49.07'W
    m = text.match(/(\d{1,2})\s*[°\s]\s*(\d{1,2}(?:\.\d+)?)\s*['’]?\s*([NS])\s*[, ]+\s*(\d{1,3})\s*[°\s]\s*(\d{1,2}(?:\.\d+)?)\s*['’]?\s*([EW])/);
    if (m) {
      return {
        lat: dmmToDecimal(m[1], m[2], m[3]),
        lon: dmmToDecimal(m[4], m[5], m[6])
      };
    }

    // Accept decimal pair as fallback.
    m = text.match(/(-?\d{1,3}\.\d+)\s*,?\s+(-?\d{1,3}\.\d+)/);
    if (m) {
      return {
        lat: Math.round(Number(m[1]) * 10000) / 10000,
        lon: Math.round(Number(m[2]) * 10000) / 10000
      };
    }

    return null;
  }

  function createGpsField() {
    const latInput = document.querySelector('#correctionForm input[name="lat"], #correctionForm input[name="latitude"], #correctionForm #latitude, #correctionForm #airportLat');
    const lonInput = document.querySelector('#correctionForm input[name="lon"], #correctionForm input[name="longitude"], #correctionForm #longitude, #correctionForm #airportLon');

    if (!latInput && !lonInput) return;

    const existingGps = document.getElementById("airportGpsPaste");
    if (existingGps) return;

    const wrapper = document.createElement("div");
    wrapper.className = "correction-field full";
    wrapper.innerHTML = `
      <label for="airportGpsPaste">GPS Coordinates</label>
      <input id="airportGpsPaste" name="gps" type="text" placeholder="Copy & Paste the GPS info from SkyVector" />
      <div class="correction-help">Accepted example: GPS N33°39.84' W101°49.07'</div>
    `;

    const insertAt = latInput ? latInput.closest(".correction-field") : lonInput.closest(".correction-field");
    if (insertAt && insertAt.parentNode) {
      insertAt.parentNode.insertBefore(wrapper, insertAt);
    }

    if (latInput) {
      latInput.closest(".correction-field")?.remove();
    }

    if (lonInput) {
      lonInput.closest(".correction-field")?.remove();
    }
  }


  function removeAreaField() {
    const areaInput = document.querySelector('#correctionForm [name="area"], #correctionForm [name="areas"], #correctionForm #area, #correctionForm #airportArea');
    const areaField = areaInput ? areaInput.closest(".correction-field") : null;
    if (areaField) {
      areaField.remove();
    }
  }


  function areaFromSectorValue(sectorValue) {
    const sector = String(sectorValue || "").toUpperCase();
    if (sector.includes("LBB") || sector.includes("POS")) return "RDR";
    if (sector.includes("MAF") || sector.includes("ABI") || sector.includes("EDN")) return "JEN";
    if (sector.includes("ACT") || sector.includes("UIM") || sector.includes("TXK")) return "DAL";
    if (sector.includes("SPS") || sector.includes("OKC") || sector.includes("UKW")) return "UKW";
    if (sector.includes("FRI") || sector.includes("MLC") || sector.includes("SEA")) return "BYP";
    if (sector.includes("DON") || sector.includes("MLU")) return "CQY";
    return "";
  }

  function ensureDerivedAreaField(form) {
    if (!form) return;

    const sectorField = form.querySelector('[name="sector"], [name="sectors"], #sector, #airportSector');
    const sectorValue = sectorField ? sectorField.value : "";
    const derivedArea = areaFromSectorValue(sectorValue);

    let hiddenArea = form.querySelector('input[name="area"]');
    if (!hiddenArea) {
      hiddenArea = document.createElement("input");
      hiddenArea.type = "hidden";
      hiddenArea.name = "area";
      form.appendChild(hiddenArea);
    }

    hiddenArea.value = derivedArea;
  }

  function enhanceAirportForm() {
    const form = document.getElementById("correctionForm");
    if (!form) return;

    removeAreaField();

    const sectorInput = form.querySelector('[name="sector"], [name="sectors"], #sector, #airportSector');
    const appInput = form.querySelector('[name="app"], [name="apps"], [name="approach"], #approach, #airportApproach');

    replaceInputWithSelect(sectorInput, LOW_SECTORS);
    replaceInputWithSelect(appInput, APPROACHES);

    createGpsField();

    if (form.dataset.gpsPatched !== "true") {
      form.dataset.gpsPatched = "true";
      form.addEventListener("submit", function (event) {
        ensureDerivedAreaField(form);
        const gpsInput = document.getElementById("airportGpsPaste");
        if (!gpsInput || !gpsInput.value.trim()) return;

        const parsed = parseSkyVectorGps(gpsInput.value);
        if (!parsed) {
          event.preventDefault();
          const message = document.getElementById("correctionMessage");
          if (message) {
            message.textContent = "GPS format not recognized. Use format like GPS N33°39.84' W101°49.07'";
            message.className = "correction-message error";
          } else {
            alert("GPS format not recognized. Use format like GPS N33°39.84' W101°49.07'");
          }
          return;
        }

        // Create hidden lat/lon fields so the existing save logic continues to work.
        let latHidden = form.querySelector('input[name="lat"]');
        let lonHidden = form.querySelector('input[name="lon"]');

        if (!latHidden) {
          latHidden = document.createElement("input");
          latHidden.type = "hidden";
          latHidden.name = "lat";
          form.appendChild(latHidden);
        }

        if (!lonHidden) {
          lonHidden = document.createElement("input");
          lonHidden.type = "hidden";
          lonHidden.name = "lon";
          form.appendChild(lonHidden);
        }

        latHidden.value = parsed.lat;
        lonHidden.value = parsed.lon;
      }, true);
    }
  }

  function bootAirportFormEnhancement() {
    enhanceAirportForm();

    const modal = document.getElementById("correctionModal");
    if (modal && window.MutationObserver) {
      new MutationObserver(function () {
        if (modal.getAttribute("aria-hidden") === "false") {
          setTimeout(enhanceAirportForm, 0);
          setTimeout(enhanceAirportForm, 150);
        }
      }).observe(modal, { attributes: true, attributeFilter: ["aria-hidden"] });
    }

    setInterval(enhanceAirportForm, 500);
  }

  window.ZFW_PARSE_SKYVECTOR_GPS = parseSkyVectorGps;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootAirportFormEnhancement);
  } else {
    bootAirportFormEnhancement();
  }
})();

