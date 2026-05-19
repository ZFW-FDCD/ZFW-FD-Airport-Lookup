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

  
  const D10_OUTAGE_SECTOR_DEFAULTS = {"DFW":"TXK 27","KDFW":"TXK 27","DAL":"TXK 27","KDAL":"TXK 27","ADS":"TXK 27","KADS":"TXK 27","RBD":"TXK 27","KRBD":"TXK 27","GKY":"TXK 27","KGKY":"TXK 27","FTW":"TXK 27","KFTW":"TXK 27","AFW":"TXK 27","KAFW":"TXK 27","FWS":"TXK 27","KFWS":"TXK 27","DTO":"TXK 27","KDTO":"TXK 27","TKI":"TXK 27","KTKI":"TXK 27","JWY":"TXK 27","KJWY":"TXK 27","LNC":"TXK 27","KLNC":"TXK 27","HQZ":"TXK 27","KHQZ":"TXK 27","WEA":"TXK 27","KWEA":"TXK 27","GPM":"TXK 27","KGPM":"TXK 27","F46":"UIM 83","KF46":"UIM 83","GVT":"UIM 83","KGVT":"UIM 83","SLR":"UIM 83","KSLR":"UIM 83","TRL":"UIM 83","KTRL":"UIM 83","SEP":"EDN 62","KSEP":"EDN 62","MWL":"POS 32","KMWL":"POS 32","XBP":"POS 32","KXBP":"POS 32","F00":"SEA 37","KF00":"SEA 37","0F2":"UKW 75","K0F2":"UKW 75","1F0":"FRI 53","K1F0":"FRI 53","JSO":"TXK 27","KJSO":"TXK 27","JXI":"TXK 27","KJXI":"TXK 27","RFI":"TXK 27","KRFI":"TXK 27","TYR":"TXK 27","KTYR":"TXK 27"};

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

