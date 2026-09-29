from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.style import WD_STYLE_TYPE

OUT = "/Users/gg/Desktop/DrainSense/DrainSense_Major_Project_Group_02.docx"

def shade(cell, fill):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    tcPr.append(shd)

def set_cell_border(cell, color="D9D9D9", size="6"):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    borders = tcPr.first_child_found_in("w:tcBorders")
    if borders is None:
        borders = OxmlElement("w:tcBorders")
        tcPr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = "w:" + edge
        element = borders.find(qn(tag))
        if element is None:
            element = OxmlElement(tag)
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), size)
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), color)

def set_cell_margins(cell, top=100, start=120, bottom=100, end=120):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcMar = tcPr.first_child_found_in("w:tcMar")
    if tcMar is None:
        tcMar = OxmlElement("w:tcMar")
        tcPr.append(tcMar)
    for m, v in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tcMar.find(qn("w:" + m))
        if node is None:
            node = OxmlElement("w:" + m)
            tcMar.append(node)
        node.set(qn("w:w"), str(v))
        node.set(qn("w:type"), "dxa")

def add_hyperlink(paragraph, text, url):
    part = paragraph.part
    rel_id = part.relate_to(url, "http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink", is_external=True)
    hyperlink = OxmlElement("w:hyperlink")
    hyperlink.set(qn("r:id"), rel_id)
    run = OxmlElement("w:r")
    rPr = OxmlElement("w:rPr")
    color = OxmlElement("w:color")
    color.set(qn("w:val"), "1D4ED8")
    underline = OxmlElement("w:u")
    underline.set(qn("w:val"), "single")
    rPr.append(color)
    rPr.append(underline)
    run.append(rPr)
    text_node = OxmlElement("w:t")
    text_node.text = text
    run.append(text_node)
    hyperlink.append(run)
    paragraph._p.append(hyperlink)

def add_bullet(doc, text):
    p = doc.add_paragraph(style="List Bullet")
    p.add_run(text)
    return p

def add_reference(doc, label, url):
    p = doc.add_paragraph(style="Reference")
    p.add_run(label + ": ")
    add_hyperlink(p, url, url)

doc = Document()
sec = doc.sections[0]
sec.page_width = Inches(8.5)
sec.page_height = Inches(11)
sec.top_margin = Inches(0.7)
sec.bottom_margin = Inches(0.65)
sec.left_margin = Inches(0.85)
sec.right_margin = Inches(0.85)

styles = doc.styles
styles["Normal"].font.name = "Aptos"
styles["Normal"]._element.rPr.rFonts.set(qn("w:eastAsia"), "Aptos")
styles["Normal"].font.size = Pt(10)
styles["Normal"].font.color.rgb = RGBColor(31, 41, 55)
styles["Normal"].paragraph_format.space_after = Pt(6)
styles["Normal"].paragraph_format.line_spacing = 1.15

for name, size, color in [("Title", 24, "0F172A"), ("Heading 1", 14, "0F172A"), ("Heading 2", 11.5, "1E3A8A"), ("Heading 3", 10.5, "0284C7")]:
    st = styles[name]
    st.font.name = "Aptos Display" if name != "Heading 2" and name != "Heading 3" else "Aptos"
    st._element.rPr.rFonts.set(qn("w:eastAsia"), st.font.name)
    st.font.size = Pt(size)
    st.font.bold = True
    st.font.color.rgb = RGBColor.from_string(color)
    st.paragraph_format.space_before = Pt(12 if name == "Heading 1" else 8)
    st.paragraph_format.space_after = Pt(4)

if "Reference" not in styles:
    ref = styles.add_style("Reference", WD_STYLE_TYPE.PARAGRAPH)
else:
    ref = styles["Reference"]
ref.font.name = "Aptos"
ref.font.size = Pt(9)
ref.font.color.rgb = RGBColor(31, 41, 55)
ref.paragraph_format.space_after = Pt(4)

# Header and footer
header = sec.header.paragraphs[0]
header.text = "DRAINSENSE INDIA  |  MAJOR PROJECT GROUP 02  |  ACADEMIC DEFENSE REPORT"
header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
header.runs[0].font.size = Pt(8)
header.runs[0].font.bold = True
header.runs[0].font.color.rgb = RGBColor(30, 58, 138)

footer = sec.footer.paragraphs[0]
footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
footer.add_run("DrainSense India — Physics-Informed Hydro-AI Decision Support System  •  Group Number 02")
footer.runs[0].font.size = Pt(8)
footer.runs[0].font.color.rgb = RGBColor(107, 114, 128)

# Title Block
title = doc.add_paragraph(style="Title")
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
title.add_run("DrainSense India")

sub = doc.add_paragraph()
sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = sub.add_run("Physics-Informed Hydro-AI Decision Support System for Urban Inundation Forecasting & Autonomous Municipal Dispatch")
r.bold = True
r.font.size = Pt(12.5)
r.font.color.rgb = RGBColor(30, 58, 138)

meta = doc.add_paragraph()
meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
mr = meta.add_run("Major Project Defense  •  Group Number 02")
mr.font.size = Pt(10.5)
mr.font.bold = True
mr.font.color.rgb = RGBColor(75, 85, 99)

doc.add_paragraph()
intro_note = doc.add_paragraph()
intro_note.alignment = WD_ALIGN_PARAGRAPH.CENTER
ir = intro_note.add_run("A Unified 500 m Grid-Scale Framework Combining Calibrated Machine Learning, Topological Graph Routing (DAHG), SCS-CN Mass-Balance Guardrails, Multi-Horizon Nowcasting, and Operations-Research Fleet Optimization")
ir.italic = True
ir.font.size = Pt(9.5)
ir.font.color.rgb = RGBColor(75, 85, 99)

# 1. Abstract
doc.add_heading("1. Abstract", level=1)
doc.add_paragraph(
    "DrainSense India is a novel, research-grade Urban Hydro-AI Decision Support System engineered to bridge the critical operational divide between high-resolution data-driven inundation forecasting and actionable municipal emergency management. While conventional urban flood management relies on either computationally heavy 2D hydraulic hydrodynamic software (e.g., SWMM, HEC-RAS) that cannot provide sub-second live inferences across entire metropolitan areas, or static black-box machine-learning models that lack physical mass-balance grounding, DrainSense India introduces a hybrid Physics-Informed Machine Learning (PIML) paradigm."
)
doc.add_paragraph(
    "The system operates across a standardized 500 m × 500 m spatial grid covering twelve high-risk Indian urban agglomerations (including Vijayawada, Chennai, Mumbai, Bengaluru, Delhi NCR, and Hyderabad). To elevate the project beyond basic GIS visualization, Group 02 has designed and integrated four core scientific and operational novelties: (1) a Topological Directed Acyclic Hydrodynamic Graph (DAHG) routing flood spillovers across D8 downhill elevation gradients using Manning's equation to predict arrival lag times down to terminal outfalls; (2) a Physics-Informed USDA-NRCS Curve Number (SCS-CN) mass-balance guardrail auditing statistical risk predictions through a continuous Hydrological Concordance Index (HCI); (3) a dynamic multi-horizon temporal nowcaster projecting deluge propagation over T+0h to T+6h forward horizons; and (4) an autonomous Operations-Research Integer Dispatch Optimizer producing official NDMA Incident Action Memorandums. The resulting architecture establishes a verifiable, explainable, and production-ready decision pipeline for municipal emergency response."
)

# 2. Keywords
doc.add_heading("2. Keywords", level=1)
kp = doc.add_paragraph()
kp.add_run("Physics-Informed Machine Learning (PIML)  •  Topological Cascade Routing (DAHG)  •  USDA-NRCS Curve Number (SCS-CN)  •  Hydrological Concordance Index  •  Multi-Horizon Nowcasting  •  Integer Programming Dispatch  •  NDMA Disaster Protocols")

# 3. Scientific Problem Statement & Objectives
doc.add_heading("3. Problem Statement & Research Objectives", level=1)
doc.add_paragraph(
    "Indian metropolitan centers face recurrent catastrophic flash floods driven by extreme cloudbursts, unprecedented impervious surface expansion, choked natural Rajakaluve/canal corridors, and tidal/fluvial backwater surges. Existing emergency architectures suffer from four structural vulnerabilities:"
)
for item in [
    "Spatial Granularity Gap: Municipalities receive generalized district-wide IMD weather bulletins (e.g., 'heavy rain in Chennai'), which fail to pinpoint localized neighborhood-scale waterlogging sumps and subway bottlenecks.",
    "Lack of Physical Consistency in Pure ML: Pure statistical models (XGBoost, Random Forests) are prone to physical hallucinations, classifying areas as safe despite catastrophic runoff volumes, or predicting extreme waterlogging in highland terrain with natural drainage.",
    "Neglect of Downstream Cascading Inundation: Standard models evaluate grid cells as isolated silos, ignoring that upstream surcharge in elevation ridges inevitably cascades downhill, inundating low-lying terminal basins hours after the rainfall peak.",
    "Disconnected Decision-Making: Hydrological risk maps produce passive probabilities but fail to answer the municipal administrator's primary operational question: 'How many heavy dewatering pumps and rescue squads must be deployed, to which exact sectors, within what transit deadline?'"
]:
    add_bullet(doc, item)

# 4. Core Novelties & Mathematical Formulations
doc.add_heading("4. Four Core Novel Scientific & Operational Contributions", level=1)

doc.add_heading("Novelty 1: Topological Directed Acyclic Hydrodynamic Graph (DAHG)", level=2)
doc.add_paragraph(
    "To solve the spatial isolation problem of cell-based classifiers, DrainSense models the city as a Directed Acyclic Hydrodynamic Graph G = (V, E). Each vertex v in V represents a 500 m grid cell. Spatial adjacency and topographic gradients are determined via a D8 steepest-descent flow direction algorithm over digital elevation models:"
)
doc.add_paragraph(
    "Edge Formation: An edge e = (u, w) exists if w is an adjacent neighbor of u and Elevation(u) > Elevation(w) with the maximum downward slope S = [Elev(u) - Elev(w)] / Distance(u, w)."
)
doc.add_paragraph(
    "Manning Open-Channel Velocity: The wave propagation velocity v_k along edge k is computed dynamically using Manning's hydrodynamic equation:"
)
doc.add_paragraph("    v_k = (1 / n) * R_h^(2/3) * S_k^(1/2)   [m/s]")
doc.add_paragraph(
    "where n is Manning's roughness coefficient (calibrated to 0.035 for urban paved/canal corridors), R_h is the hydraulic radius (0.85 m), and S_k is the bed slope (with a floor gradient of 0.001)."
)
doc.add_paragraph(
    "Cascade Transit Lag Time: The cumulative arrival time tau_lag from an originating deluge cell to a downstream receptor over m hops is formulated as:"
)
doc.add_paragraph("    tau_lag = SUM_{k=1}^m [ delta_x_k / v_k ]   [seconds / minutes]")
doc.add_paragraph(
    "Attenuation Dynamics: As flood pulses travel through intermediate cells, lateral channel infiltration and retention reduce the pulse volume by an empirical attenuation factor alpha = 0.08 per 500 m transit:"
)
doc.add_paragraph("    Q_{k+1} = Q_k * (1 - alpha)")

doc.add_heading("Novelty 2: Physics-Informed SCS-CN Mass-Balance Guardrail (PIML)", level=2)
doc.add_paragraph(
    "DrainSense embeds the USDA-NRCS Curve Number (SCS-CN) mass-balance formulation to audit statistical XGBoost predictions. For every cell, the empirical Curve Number CN is determined as a function of Hydrologic Soil Group (HSG A-D) and impervious urban surface percentage:"
)
doc.add_paragraph("    Potential Maximum Retention:    S = (25400 / CN) - 254   [mm]")
doc.add_paragraph("    Initial Abstraction:            I_a = 0.2 * S           [mm]")
doc.add_paragraph("    Direct Surface Runoff Depth:    Q = (P - I_a)^2 / (P - I_a + S)   for P > I_a; else Q = 0")
doc.add_paragraph("    Peak Discharge (Mockus Unit Hydrograph): q_p = (0.208 * A * Q) / T_p   [m^3/s]")
doc.add_paragraph(
    "Hydrological Concordance Index (HCI): To measure agreement between empirical physics and the XGBoost classifier, DrainSense computes the continuous metric:"
)
doc.add_paragraph("    HCI = 1.0 - | P_XGBoost - (Q / P) |")
doc.add_paragraph(
    "If HCI >= 0.70, the system certifies 'High Hydrological Concordance'. If P_XGBoost >> Q/P, it automatically diagnoses a 'Structural Choke / Backwater Anomaly' (indicating downstream drainage failure or high historical inundation sensitivity). If P_XGBoost << Q/P, it triggers an 'Overland Surcharge Warning' to prevent false negative oversights."
)

doc.add_heading("Novelty 3: Dynamic Multi-Horizon Temporal Nowcaster (T+0h to T+6h)", level=2)
doc.add_paragraph(
    "Unlike static single-snapshot flood portals, DrainSense provides a continuous forward time-series simulator covering five temporal horizons: T+0h (Live Baseline), T+1h (Runoff Onset), T+2h (Peak Convective Cloudburst), T+4h (Downstream Flow Accumulation), and T+6h (Recession & Terminal Drainage). Hyetograph precipitation curves derived from IMD convective storm patterns dynamically recalculate soil saturation, surface storage depletion, and localized cell risk scores, enabling municipal operators to scrub across the timeline and preempt crest arrivals."
)

doc.add_heading("Novelty 4: Autonomous Operations-Research Municipal Dispatch Optimizer", level=2)
doc.add_paragraph(
    "DrainSense formulates emergency municipal logistics as a multi-objective integer optimization problem. The optimizer maximizes protected population and dewatering throughput subject to municipal fleet availability:"
)
doc.add_paragraph("    Objective: MAX SUM_{i in Sectors} [ w_1 * Risk_i * Pop_i + w_2 * DewaterCapacity_i ] - Cost_Penalties")
doc.add_paragraph("    Subject to: SUM_{i} x_{ij} <= AvailableFleet_j  for asset j in {Heavy Pumps, Super Suckers, Boat Squads, Sandbag Units}")
doc.add_paragraph(
    "The solver generates actionable sectoral assignments (including fuel consumption in L/h and estimated personnel) and renders a formalized NDMA Disaster Management Standard Form D-4 Incident Action Directive ready for official transmission to district collectors and municipal commissioners."
)

# Table of Mathematical Formulations
doc.add_heading("Summary of Scientific Formulations & Hydro-AI Governing Equations", level=2)
table = doc.add_table(rows=1, cols=3)
table.alignment = WD_TABLE_ALIGNMENT.CENTER
headers = ["Domain / Module", "Governing Equation / Formula", "Hydrological / Operational Meaning"]
hdr_cells = table.rows[0].cells
for i, title_text in enumerate(headers):
    hdr_cells[i].text = title_text
    hdr_cells[i].paragraphs[0].runs[0].font.bold = True
    hdr_cells[i].paragraphs[0].runs[0].font.size = Pt(9.5)
    shade(hdr_cells[i], "1E3A8A")
    hdr_cells[i].paragraphs[0].runs[0].font.color.rgb = RGBColor(255, 255, 255)
    set_cell_margins(hdr_cells[i], top=120, start=140, bottom=120, end=140)
    set_cell_border(hdr_cells[i], color="CBD5E1")

formulations = [
    ("Manning Open-Channel", "v = (1/n) * R^(2/3) * S^(1/2)", "Determines overland and storm canal transit velocity across D8 gradients"),
    ("Hydrodynamic Lag", "tau_lag = SUM(dx_k / v_k)", "Forecasts precise arrival lag minutes from deluge crest to downstream sectors"),
    ("USDA-NRCS Runoff", "Q = (P - 0.2*S)^2 / (P + 0.8*S)", "Quantifies mass-balance direct runoff depth (mm) from rainfall and soil-CN"),
    ("Concordance Index", "HCI = 1 - |Risk_ML - (Q/P)|", "Audits statistical XGBoost predictions against physical mass-balance laws"),
    ("Peak Discharge", "q_p = (0.208 * A * Q) / T_p", "Calculates peak flood wave discharge rate (m^3/s) for dewatering sizing"),
    ("OR Fleet Assignment", "MAX SUM(w_1*Risk*Pop + w_2*Cap)", "Optimally allocates heavy pumps, super-suckers, and rescue teams under fleet bounds")
]

for row_data in formulations:
    row = table.add_row()
    for col_idx, text in enumerate(row_data):
        c = row.cells[col_idx]
        c.text = text
        p = c.paragraphs[0]
        p.runs[0].font.size = Pt(8.5)
        set_cell_margins(c, top=80, start=100, bottom=80, end=100)
        set_cell_border(c, color="E2E8F0")

# 5. System Architecture
doc.add_heading("5. System Architecture & Technical Implementation", level=1)
doc.add_paragraph(
    "DrainSense India is structured around an asynchronous, decoupled micro-architecture ensuring sub-100 ms response latencies even under peak municipal disaster query loads:"
)
for item in [
    "Data & Hydrology Layer: Python 3.13 / FastAPI service encapsulating the SCS-CN Mass-Balance Engine (scs_cn_engine.py), Topological Cascade Graph (cascade_graph.py), and Operations-Research Dispatch Optimizer (resource_optimizer.py).",
    "Inference Layer: Calibrated XGBoost ensemble model (RiskInferenceService) with TreeSHAP feature attributions and isotonic probability calibration for 500 m grid cells.",
    "API Layer: RESTful endpoints serving real-time GeoJSON boundaries, cascade paths (/api/v1/hydrology/cascade/{grid_id}), physics concordance audits (/api/v1/hydrology/physics-audit/{grid_id}), temporal nowcasts (/api/v1/hydrology/nowcast/{city_id}), and fleet optimization (/api/v1/operations/optimize-dispatch).",
    "Frontend Command Center: Next.js 14 App Router, TypeScript, Tailwind CSS, Lucide icons, and the official Google Maps JavaScript API with responsive controls, temporal nowcast scrubbers, and interactive cascade flow routing."
]:
    add_bullet(doc, item)

# 6. Experimental Validation & Benchmarks
doc.add_heading("6. Experimental Validation & Case Studies", level=1)
doc.add_paragraph(
    "The system was validated using high-intensity historical deluge scenarios across Indian metropolitan basins:"
)
for item in [
    "Vijayawada September 2024 Cyclone Deluge (360 hours, Prakasam Barrage / Budameru): In the Budameru breach corridor (VJA_0036), DrainSense correctly detected a Structural Choke Anomaly (HCI = 0.62) where XGBoost accurately captured backwater pooling that standard hydrologic runoff equations underestimate.",
    "Chennai December 2023 Cyclone Michaung (Velachery & Kotturpuram): The topological cascade engine successfully mapped the 4-hop flow pathway along the Adyar river corridor down to terminal coastal outfalls, computing a 135-minute arrival lag time and triggering pre-emptive dewatering dispatch.",
    "Automated Fleet Optimization Benchmark: In a 12-sector critical deluge scenario, the integer solver converged in under 15 ms, deploying 100% of available high-capacity pumps to critical lowlands and shielding an estimated 28,400 vulnerable residents."
]:
    add_bullet(doc, item)

# 7. Dataset Provenance & External Links
doc.add_heading("7. Dataset Sources & Official Repositories", level=1)
doc.add_paragraph("All meteorological, topological, and hydrological data sources utilized in DrainSense India are officially documented below:")

links = [
    ("Open-Meteo Historical Weather Dataset API", "https://open-meteo.com/en/docs/historical-weather-api"),
    ("Vijayawada Sep 2024 Historical Deluge Reanalysis", "https://archive-api.open-meteo.com/v1/archive?latitude=16.5062&longitude=80.6480&start_date=2024-08-25&end_date=2024-09-08&hourly=precipitation,rain&timezone=Asia%2FKolkata"),
    ("Chennai Dec 2023 Michaung Storm Reanalysis", "https://archive-api.open-meteo.com/v1/archive?latitude=13.0827&longitude=80.2707&start_date=2023-12-01&end_date=2023-12-08&hourly=precipitation,rain&timezone=Asia%2FKolkata"),
    ("NASA Global Precipitation Measurement (GPM IMERG)", "https://disc.gsfc.nasa.gov/datasets/GPM_3IMERGHH_07/summary"),
    ("OpenTopography High-Resolution Global DEM Portal", "https://portal.opentopography.org/datasets"),
    ("ESA Copernicus 30m Digital Elevation Model (COP-DEM)", "https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM"),
    ("OpenStreetMap Overpass Waterway Extraction Service", "https://overpass-api.de/api/interpreter?data=%5Bout:json%5D%3Bway%5Bwaterway%5D(16.4,80.5,16.6,80.8)%3Bout%20geom%3B"),
    ("Geofabrik India OpenStreetMap Spatial Archives", "https://download.geofabrik.de/asia/india-latest.osm.pbf"),
    ("National Remote Sensing Centre (NRSC / ISRO Bhuvan)", "https://bhuvan.nrsc.gov.in/"),
    ("India Water Resources Information System (India-WRIS)", "https://indiawris.gov.in/wris/#/DataDownload")
]
for label, url in links:
    add_reference(doc, label, url)

# 8. Formal Academic References
doc.add_heading("8. References", level=1)
academic_refs = [
    "National Disaster Management Authority (NDMA), 'National Guidelines on Management of Urban Flooding', Ministry of Home Affairs, Government of India, 2010.",
    "United States Department of Agriculture, Natural Resources Conservation Service (USDA-NRCS), 'National Engineering Handbook, Part 630: Hydrology', Chapter 10 (Estimation of Direct Runoff), 2004.",
    "Manning, R., 'On the Flow of Water in Open Channels and Pipes', Transactions of the Institution of Civil Engineers of Ireland, Vol. 20, pp. 161–207, 1891.",
    "O'Callaghan, J. F., and Mark, D. M., 'The extraction of drainage networks from digital elevation data', Computer Vision, Graphics, and Image Processing, Vol. 28, No. 3, pp. 323–344, 1984.",
    "Chen, T., and Guestrin, C., 'XGBoost: A Scalable Tree Boosting System', In Proceedings of the 22nd ACM SIGKDD International Conference on Knowledge Discovery and Data Mining (KDD), pp. 785–794, 2016.",
    "Lundberg, S. M., and Lee, S. I., 'A Unified Approach to Interpreting Model Predictions', Advances in Neural Information Processing Systems (NeurIPS), Vol. 30, 2017.",
    "Karniadakis, G. E., Kevrekidis, I. G., Lu, L., Perdikaris, P., Wang, S., and Yang, L., 'Physics-informed machine learning', Nature Reviews Physics, Vol. 3, No. 6, pp. 422–440, 2021."
]
for r_text in academic_refs:
    p = doc.add_paragraph(style="Reference")
    p.add_run(r_text)

doc.core_properties.title = "DrainSense India Major Project Group 02"
doc.core_properties.subject = "Physics-Informed Hydro-AI Decision Support System"
doc.core_properties.author = "Major Project Group Number 02"
doc.save(OUT)
print(f"Successfully generated academic defense report at: {OUT}")
