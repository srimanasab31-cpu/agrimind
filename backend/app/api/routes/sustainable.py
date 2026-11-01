from fastapi import APIRouter, Query
from typing import Optional, List

router = APIRouter()

SUSTAINABLE_GUIDES = [
    {
        "id": "sus-001",
        "title": "Alternate Wetting and Drying (AWD) in Paddy Cultivation",
        "category": "Water-efficient irrigation",
        "crops": ["Rice (Paddy)"],
        "description": "A water-saving irrigation technology where rice fields are allowed to dry out intermittently instead of remaining continuously flooded.",
        "applicability": "Applicable during the vegetative and tillering phases of wetland paddy; avoid during flowering stage.",
        "practical_steps": [
            "Install a perforated field water tube (pani pipe, 30cm length, 15cm dia) in the field with 10cm above soil.",
            "Irrigate field to 5cm water depth, then let water drop below soil surface.",
            "Re-irrigate only when the water level inside the tube drops to 15cm below the soil surface.",
            "Keep 2-5cm standing water continuously during flowering and heading stages."
        ],
        "limitations": "Not suitable for saline soils where continuous standing water is required to suppress salts.",
        "source_citation": "Tamil Nadu Agricultural University (TNAU) Agronomy Guide & IRRI AWD Manual."
    },
    {
        "id": "sus-002",
        "title": "Green Manuring and In-Situ Biomass Incorporation",
        "category": "Organic matter and composting",
        "crops": ["Rice", "Sugarcane", "Cotton", "Banana"],
        "description": "Cultivating nitrogen-fixing fast-growing legumes like Daincha (Sesbania aculeata) or Sunnhemp (Crotalaria juncea) and ploughing them into soil before main crop.",
        "applicability": "Pre-monsoon or summer season before transplanting the main Kharif/Samba crop.",
        "practical_steps": [
            "Sow Daincha or Sunnhemp seed at 20-25 kg/ha with pre-sowing irrigation.",
            "Allow biomass to grow for 45 to 50 days until early flowering initiation.",
            "Incorporate into the soil using a disc plough or rotavator.",
            "Allow 7 to 10 days for decomposition under moist soil conditions before transplanting."
        ],
        "limitations": "Requires sufficient initial soil moisture or pre-monsoon showers for establishment.",
        "source_citation": "ICAR Central Soil Salinity Research Institute & TNAU Soil Science Department."
    },
    {
        "id": "sus-003",
        "title": "Integrated Pest Management (IPM) for Rice Stem Borer",
        "category": "Integrated pest management",
        "crops": ["Rice"],
        "description": "Multi-tactic pest management combining monitoring, cultural practices, biocontrol agents, and threshold-based interventions.",
        "applicability": "From nursery stage through panicle initiation.",
        "practical_steps": [
            "Clip seedling leaf tips before transplanting to eliminate egg masses.",
            "Install pheromone traps @ 12 traps/ha for monitoring moth flight activity.",
            "Release egg parasitoid Trichogramma japonicum @ 1,00,000/ha at weekly intervals starting 30 DAT.",
            "Conserve natural predators including spiders (Lycosa pseudoannulata) and damselflies."
        ],
        "limitations": "Chemical broad-spectrum pyrethroid sprays must be avoided as they eliminate beneficial spiders.",
        "source_citation": "National Research Centre for Integrated Pest Management (ICAR-NCIPM)."
    },
    {
        "id": "sus-004",
        "title": "Soil Testing and Precision Nitrogen Top-Dressing with Leaf Color Chart (LCC)",
        "category": "Responsible fertilizer management",
        "crops": ["Rice", "Maize"],
        "description": "Using a standardized 4-panel or 6-panel Leaf Color Chart to calibrate nitrogen application based on real-time plant leaf chlorophyll demand.",
        "applicability": "During active tillering and panicle initiation phases.",
        "practical_steps": [
            "Take 10 disease-free healthy topmost fully expanded leaves randomly across the field.",
            "Match leaf shade with LCC panels under shade (avoid direct sun glare).",
            "If the average reading falls below critical value (Panel 4 for semi-dwarf varieties), top-dress 25-30 kg N/ha.",
            "Repeat readings every 7-10 days."
        ],
        "limitations": "Requires consistent reading timing (between 8:00 AM - 10:00 AM) to prevent leaf curl bias.",
        "source_citation": "TNAU Crop Physiology & International Rice Research Institute."
    },
    {
        "id": "sus-005",
        "title": "Drip Fertigation and Micro-Irrigation for Horticultural Crops",
        "category": "Water-efficient irrigation",
        "crops": ["Tomato", "Chilli", "Banana", "Sugarcane"],
        "description": "Delivering water and water-soluble nutrients directly to the root zone via emitters, saving 40-60% water.",
        "applicability": "Applicable across all vegetative and fruiting cycles in arid and semi-arid tracts.",
        "practical_steps": [
            "Install inline drip laterals with 4 LPH drippers spaced according to plant canopy.",
            "Conduct regular flushing and acid treatment (1-2% HCl) monthly to prevent emitter clogging.",
            "Split fertilizer application into weekly doses dissolved in irrigation water."
        ],
        "limitations": "Requires initial capital investment and regular filter maintenance.",
        "source_citation": "Department of Agriculture, Government of Tamil Nadu & TNAU Water Technology Centre."
    },
    {
        "id": "sus-006",
        "title": "Biological Control of Soil-Borne Fungal Pathogens using Trichoderma viride",
        "category": "Biological pest control",
        "crops": ["Cotton", "Pulses", "Tomato", "Chilli"],
        "description": "Using antagonistic fungi Trichoderma viride or Pseudomonas fluorescens to prevent root rot, wilt, and damping-off.",
        "applicability": "Seed treatment or soil application enriched with well-decomposed Farmyard Manure (FYM).",
        "practical_steps": [
            "Seed treatment: Mix 4-10g Trichoderma viride per kg of seed with rice gruel as sticker.",
            "Soil enrichment: Mix 2.5 kg Trichoderma with 50 kg well-decomposed FYM, incubate under shade for 7 days, then apply to soil."
        ],
        "limitations": "Do not mix biocontrol formulations with chemical synthetic fungicides like Carbendazim.",
        "source_citation": "ICAR-NBAIR (National Bureau of Agricultural Insect Resources)."
    },
    {
        "id": "sus-007",
        "title": "Legume-Based Crop Rotation for Soil Fertility Restoration",
        "category": "Crop rotation",
        "crops": ["Rice", "Blackgram", "Greengram", "Groundnut"],
        "description": "Rotating exhaustive cereal crops with short-duration grain legumes to break pest cycles and replenish soil nitrogen.",
        "applicability": "Rice-Fallow season (January-March in Cauvery Delta, Tamil Nadu).",
        "practical_steps": [
            "Broadcast blackgram (VBN 6, VBN 8) or greengram seeds into standing paddy 5-7 days before harvest under optimum waxy soil moisture.",
            "Legume nodules fix 30-40 kg atmospheric nitrogen per hectare for subsequent crops.",
            "Incorporate crop residues into soil after pulse pod harvesting."
        ],
        "limitations": "Soil moisture during harvest must be waxy; if completely dry, seed germination fails.",
        "source_citation": "Tamil Nadu Rice Research Institute (TRRI), Aduthurai."
    },
    {
        "id": "sus-008",
        "title": "Mulching and Moisture Conservation in Dryland Farming",
        "category": "Climate-resilient farming",
        "crops": ["Cotton", "Maize", "Millets", "Vegetables"],
        "description": "Covering the soil surface with crop residue or organic straw mulch to reduce evaporation loss and suppress weeds.",
        "applicability": "Post-sowing during dry spells and high atmospheric temperatures.",
        "practical_steps": [
            "Apply paddy straw or dried leaves @ 5 tonnes/ha evenly across inter-row spaces.",
            "Ensure mulch thickness of 5-7cm to inhibit weed emergence.",
            "Decomposed mulch contributes to organic humus over time."
        ],
        "limitations": "Termite monitoring is required in sandy soils prone to microtermes infestation.",
        "source_citation": "ICAR-CRIDA (Central Research Institute for Dryland Agriculture)."
    }
]

@router.get("/")
def get_sustainable_guides(
    category: Optional[str] = Query(None),
    query: Optional[str] = Query(None),
    crop: Optional[str] = Query(None)
):
    """Retrieve sustainable farming practices and guides with category/query filtering."""
    results = SUSTAINABLE_GUIDES
    
    if category and category.lower() != "all":
        results = [g for g in results if g["category"].lower() == category.lower()]
        
    if crop:
        results = [g for g in results if any(crop.lower() in c.lower() for c in g["crops"])]
        
    if query:
        q = query.lower()
        results = [
            g for g in results
            if q in g["title"].lower() or q in g["description"].lower() or any(q in step.lower() for step in g["practical_steps"])
        ]
        
    categories = list(set(g["category"] for g in SUSTAINABLE_GUIDES))
    return {
        "total": len(results),
        "categories": ["All"] + sorted(categories),
        "guides": results
    }
