import json,re
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.units import inch

ROOT=Path(".")
OUT=ROOT/"ZFW-FD-Programmed-Data-Inventory.pdf"

def load_var(path,var):
    s=(ROOT/path).read_text(encoding="utf-8")
    m=re.search(re.escape(var)+r"\s*=\s*(\{.*\})\s*;?\s*$",s,re.S)
    if not m: raise RuntimeError(f"Could not parse {path}")
    return json.loads(m.group(1))

airport=load_var("airport_data.js","window.AIRPORT_DATA")
nav=load_var("zfw_nav_data.js","window.ZFW_NAV_DATA")
supp_nav=load_var("zfw_supplemental_navaids.js","window.ZFW_SUPPLEMENTAL_NAVAIDS")
supp_wp=load_var("zfw_supplemental_waypoints.js","window.ZFW_SUPPLEMENTAL_WAYPOINTS")
adj=load_var("zfw_adjacent_artcc_airports.js","window.ZFW_ADJACENT_ARTCC_AIRPORTS")

styles=getSampleStyleSheet()
title=ParagraphStyle("title",parent=styles["Title"],fontSize=18,leading=21,spaceAfter=10,alignment=TA_CENTER)
sub=ParagraphStyle("sub",parent=styles["Normal"],fontSize=8.5,leading=11,spaceAfter=6)
h1=ParagraphStyle("h1",parent=styles["Heading1"],fontSize=13,leading=15,spaceBefore=8,spaceAfter=6)
small=ParagraphStyle("small",parent=styles["Normal"],fontSize=6.4,leading=7.5)
tiny=ParagraphStyle("tiny",parent=styles["Normal"],fontSize=5.7,leading=6.6)

def esc(v):
    return str(v if v is not None else "").replace("&","&amp;").replace("<","&lt;").replace(">","&gt;")

def join(v):
    if isinstance(v,list): return ", ".join(map(str,v))
    return str(v or "")

story=[
    Paragraph("ZFW FD Airport / Navaid / Waypoint Programmed Data Inventory",title),
    Paragraph("Generated directly from the current repository data files on the export branch. This document inventories the identifiers and operational records programmed into the lookup application; it does not alter the live application.",sub),
    Paragraph(f"Airport data records: {len(airport['records']):,} &nbsp;&nbsp; NASR NAV/FIX records: {len(nav['records']):,} &nbsp;&nbsp; Supplemental navaids: {len(supp_nav):,} &nbsp;&nbsp; Supplemental waypoints/fixes: {len(supp_wp):,} &nbsp;&nbsp; Adjacent ARTCC entries: {len(adj['airports']):,}",sub),
    Paragraph("Identifier policy note",h1),
    Paragraph("This inventory prints the identifiers as they are stored in the source data. It does not create additional ICAO K-prefix identifiers for the purpose of this report.",sub),
]

def add_table(title_text, rows, widths, header=("Identifier","Name","Type","Nearest WX","Other")):
    story.append(Paragraph(title_text,h1))
    data=[list(header)]
    for r in rows:
        data.append([Paragraph(esc(x),tiny) for x in r])
    t=Table(data,colWidths=widths,repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,0),colors.lightgrey),
        ("TEXTCOLOR",(0,0),(-1,0),colors.black),
        ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),
        ("FONTSIZE",(0,0),(-1,-1),6),
        ("GRID",(0,0),(-1,-1),0.25,colors.grey),
        ("VALIGN",(0,0),(-1,-1),"TOP"),
        ("LEFTPADDING",(0,0),(-1,-1),3),
        ("RIGHTPADDING",(0,0),(-1,-1),3),
        ("TOPPADDING",(0,0),(-1,-1),2),
        ("BOTTOMPADDING",(0,0),(-1,-1),2),
    ]))
    story.append(t)
    story.append(Spacer(1,8))

airport_rows=[]
for ident,rec in sorted(airport["records"].items()):
    airport_rows.append((ident,rec.get("airport_name",""),rec.get("record_type",""),rec.get("nearest_wx",""),f"Areas: {join(rec.get('areas'))}; Sectors: {join(rec.get('sectors'))}"))
add_table("1. Airport data records",airport_rows,[.65*inch,2.55*inch,.75*inch,.7*inch,3.15*inch])

nav_rows=[]
for ident,rec in sorted(nav["records"].items()):
    nav_rows.append((ident,rec.get("airport_name",""),rec.get("record_type",""),rec.get("nearest_wx",""),rec.get("source","")))
add_table("2. NASR NAV/FIX data records",nav_rows,[.65*inch,2.45*inch,.8*inch,.7*inch,3.2*inch])

sn_rows=[]
for ident,rec in sorted(supp_nav.items()):
    sn_rows.append((ident,rec.get("airport_name",""),rec.get("record_type",""),rec.get("nearest_wx",""),rec.get("source","")))
add_table("3. Supplemental navaid records",sn_rows,[.65*inch,2.55*inch,.8*inch,.7*inch,3.1*inch])

wp_rows=[]
for ident,rec in sorted(supp_wp.items()):
    wp_rows.append((ident,rec.get("airport_name",""),rec.get("record_type",""),rec.get("nearest_wx",""),rec.get("source","")))
add_table("4. Supplemental waypoint / fix records",wp_rows,[.65*inch,2.55*inch,.8*inch,.7*inch,3.1*inch])

adj_rows=[]
for ident,rec in sorted(adj["airports"].items()):
    adj_rows.append((ident,rec.get("name",""),rec.get("record_type","AIRPORT"),rec.get("nearest_wx",""),f"Center: {rec.get('center','')}; FDCD: {rec.get('fdcd','')}"))
add_table("5. Adjacent ARTCC airport/facility lookup records",adj_rows,[.65*inch,2.7*inch,.75*inch,.7*inch,3.0*inch])

doc=SimpleDocTemplate(str(OUT),pagesize=landscape(letter),rightMargin=.3*inch,leftMargin=.3*inch,topMargin=.35*inch,bottomMargin=.35*inch,title="ZFW FD Programmed Data Inventory")
def footer(canvas,doc):
    canvas.saveState()
    canvas.setFont("Helvetica",6.5)
    canvas.drawString(.3*inch,.18*inch,"ZFW FD Programmed Data Inventory")
    canvas.drawRightString(10.7*inch,.18*inch,f"Page {doc.page}")
    canvas.restoreState()
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(f"Created {OUT} ({OUT.stat().st_size:,} bytes)")
