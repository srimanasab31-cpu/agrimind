import re
from typing import Dict, Any, List, Optional

# Transliteration and regional agricultural synonyms mapping
AGRI_SYNONYMS = {
    # Crops
    "nellu": "rice paddy",
    "nel": "rice paddy",
    "arisi": "rice",
    "paddy": "rice",
    "thakkali": "tomato",
    "paruthi": "cotton",
    "karumbu": "sugarcane",
    "makkacholam": "maize",
    "cholam": "sorghum maize",
    "kambu": "pearl millet bajra",
    "ragi": "finger millet kelvaragu",
    "ulunthu": "blackgram pulses",
    "pasippayiru": "greengram mungbean",
    "manilakottai": "groundnut peanut",
    "verkadalai": "groundnut peanut",
    "vazhai": "banana",
    "mambazham": "mango",
    "manga": "mango",
    "milagai": "chilli pepper",
    "kathiri": "brinjal eggplant",
    "vendaikkai": "bhendi okra",
    "vengayam": "onion shallot",
    "vengaya": "onion shallot",
    "thennai": "coconut",
    "thennamaram": "coconut tree",
    "turmeric": "turmeric manjal",
    
    # Plant parts & symptoms
    "ilai": "leaf leaves foliage",
    "ela": "leaf leaves foliage",
    "elai": "leaf leaves foliage",
    "ilaigal": "leaves foliage",
    "ilaigalla": "in leaves foliage",
    "chedi": "plant crop",
    "chediku": "for plant crop",
    "chedila": "in plant crop",
    "maram": "tree crop",
    "marathula": "in tree crop",
    "payir": "crop plant",
    "payirla": "in crop",
    "ver": "root",
    "thandu": "stem shoot",
    "poo": "flower blossom",
    "kaai": "fruit pod",
    "kani": "fruit",
    "manjal": "yellow yellowing chlorosis",
    "manjala": "yellow yellowing chlorosis",
    "yellow": "yellow yellowing",
    "karuppu": "black necrotic dark",
    "brown": "brown necrotic spot",
    "pulli": "spot lesions",
    "pulla": "spot lesions",
    "thitte": "patch lesion",
    "vaadal": "wilting wilt",
    "vaadudhu": "wilting wilt",
    "azhugal": "rot rotting",
    "azhugudhu": "rot rotting",
    "poochi": "pest insect borer aphid",
    "puzhu": "caterpillar larva borer",
    "vandu": "beetle bug",
    "suruttal": "leaf curl mosaic",
    "surundhu": "curling curl",
    "karugal": "blast blight scorch burn necrosis",
    "karugudhu": "blast blight scorch necrosis",
    "valarave": "stunted stunted-growth failure to grow",
    "valarala": "stunted stunted-growth failure to grow",
    "damage": "crop damage stress injury",
    
    # Agronomy terms
    "uram": "fertilizer nutrient nitrogen",
    "urapoda": "apply fertilizer",
    "podanum": "apply fertilize",
    "thannir": "water irrigation",
    "thanni": "water irrigation",
    "paasanam": "irrigation water",
    "mann": "soil",
    "mannu": "soil",
    "noi": "disease blast blight infection",
    "marunthu": "pesticide biocontrol treatment spray",
    "thelikkanum": "foliar spray apply treatment",
    "iyarkai": "organic sustainable bio",
    "awd": "alternate wetting and drying water conservation",
    "ipm": "integrated pest management",
    "lcc": "leaf colour chart nitrogen",
    "sri": "system of rice intensification",
    "kuruvai": "kuruvai short duration season",
    "samba": "samba long duration season",
    "thaladi": "thaladi medium duration season",
    "navarai": "navarai summer season",
    "mazhai": "rain rainfall water stagnation excess water",
    "veyil": "sunlight heat high temperature",

    # Tamil script direct mappings
    "நெல்": "rice paddy",
    "இலை": "leaf leaves",
    "இலைகள்": "leaf leaves",
    "மஞ்சள்": "yellow yellowing chlorosis",
    "மஞ்சளாக": "yellow yellowing chlorosis",
    "பழுப்பு": "brown necrosis spot",
    "புள்ளி": "spot lesions",
    "புள்ளிகள்": "spot lesions",
    "கருகல்": "blast blight necrosis",
    "நோய்": "disease blast blight infection",
    "உரம்": "fertilizer nutrient nitrogen",
    "தண்ணீர்": "water irrigation",
    "நீர்": "water irrigation",
    "பூச்சி": "pest insect borer",
    "புழு": "caterpillar larva borer",
    "விவசாயம்": "farming agriculture sustainable",
    "நிலையான": "sustainable organic awd",
    "தக்காளி": "tomato",
    "பருத்தி": "cotton",
    "கரும்பு": "sugarcane",
    "சோளம்": "sorghum maize",
    "மக்காச்சோளம்": "maize",
    "வாழை": "banana",
    "மாங்காய்": "mango",
    "மாம்பழம்": "mango",
    "மிளகாய்": "chilli",
    "கத்தரி": "brinjal",
    "வெண்டை": "bhendi okra",
    "உளுந்து": "blackgram",
    "பாசிப்பயறு": "greengram",
    "வேர்க்கடலை": "groundnut",
    "நிலக்கடலை": "groundnut",
    "மண்": "soil",
    "பாசனம்": "irrigation",
    "குறுவை": "kuruvai season",
    "சம்பா": "samba season",
    "தாளடி": "thaladi season",
    "நவரை": "navarai season"
}

TANGLISH_INDICATOR_WORDS = {
    # Pronouns & question markers
    "enakku", "unakku", "ungalukku", "en", "ennoda", "enoda", "unga", "ungaloda",
    "enna", "edhu", "eppadi", "eppidi", "eppo", "eppa", "enga", "engu", "yen", "yaen",
    "edhuku", "ethuku", "ethukku", "yaaru", "adhu", "idhu", "andha", "indha", "oru",
    # Verbs / Auxiliaries / Predicates
    "irukku", "irukudhu", "irukka", "illa", "illai", "illaye", "aagudhu", "aaguthu",
    "aagiduchu", "aayiduchu", "panradhu", "pannanum", "pananum", "podanum", "thelikkanum",
    "kudukkanum", "kekalama", "kekalaam", "kelunga", "sollunga", "pannunga", "solla",
    "vara", "varudhu", "varala", "valarave", "valarala", "valarudhu", "valaruthu",
    "theriyala", "theriyuma", "puriyala", "mudiyuma", "mudiyum", "thara", "paakanum",
    "paarkkanum", "vaanga", "ponga",
    # Discourse & Adverbs
    "kandippa", "romba", "konjam", "mattum", "pazhaiya", "pazhaya", "pudhu", "puthiya",
    "nala", "nalla", "pathina", "paththi", "pathi", "kooda", "mela", "keela", "kulla",
    "than", "thaan", "dhaan", "vanakkam", "nandri", "aama", "sari", "apdi", "ipdi",
    # Agriculture & Symptom terms in Latin alphabet
    "chedi", "chediku", "chedila", "maram", "marathula", "payir", "payirla", "elai",
    "ilai", "ilaigal", "ilaigalla", "ela", "thandu", "ver", "poo", "kaai", "kani",
    "thakkali", "vazhai", "nel", "nellu", "thennai", "vengayam", "vengaya", "paruthi",
    "karumbu", "milagai", "kathiri", "manga", "mambazham", "cholam", "makkacholam",
    "kambu", "ragi", "uram", "mannu", "mann", "thanni", "thannir", "paasanam",
    "poochi", "puzhu", "vandu", "noi", "karugudhu", "azhugudhu", "vaadudhu", "surundhu",
    "manjala", "pulli", "thitte", "mazhai", "veyil", "kaathu", "marunthu", "naathu", "nadavu"
}

TANGLISH_SUFFIXES = (
    "thula", "marathula", "chedila", "payirla", "ilaigalla",
    "chediku", "payirukku", "thakkaliku",
    "aagudhu", "aaguthu", "aagiduchu", "aayiduchu",
    "pannanum", "panradhu", "podanum", "thelikkanum",
    "valarave", "valarala"
)

def detect_language(text: str) -> str:
    """
    Detect whether query is Tamil script ('ta'), Tanglish ('tanglish'), 
    code-mixed ('mixed'), or English ('en').
    """
    if not text or not text.strip():
        return "en"
    
    # 1. Check for Tamil Unicode characters
    tamil_chars = sum(1 for char in text if '\u0b80' <= char <= '\u0bff')
    if tamil_chars >= 2:
        return "ta"
    
    # 2. Check for Tanglish words and morphological patterns
    clean_text = re.sub(r'[^\w\s]', ' ', text.lower())
    words = clean_text.split()
    if not words:
        return "en"
        
    tanglish_matches = 0
    for w in words:
        if w in TANGLISH_INDICATOR_WORDS:
            tanglish_matches += 1
        elif any(w.endswith(sfx) for sfx in TANGLISH_SUFFIXES) and len(w) > 4:
            tanglish_matches += 1

    # Check for code-mixed Tanglish query
    if tanglish_matches >= 1:
        # If pure Tanglish or high ratio
        if tanglish_matches >= 2 or len(words) <= 3:
            return "tanglish"
        else:
            return "tanglish"
            
    return "en"

def normalize_and_expand_query(query: str) -> str:
    """
    Normalize text and expand Tamil/Tanglish transliterations to facilitate multi-lingual RAG retrieval.
    """
    if not query:
        return ""
    text_clean = re.sub(r'[^\w\s\u0b80-\u0bff]', ' ', query.lower())
    words = text_clean.split()
    
    expanded_terms = []
    for w in words:
        expanded_terms.append(w)
        if w in AGRI_SYNONYMS:
            expanded_terms.append(AGRI_SYNONYMS[w])
            
    return " ".join(expanded_terms)

def extract_entities(query: str) -> Dict[str, Any]:
    """
    Extract specific agricultural entities (crop, symptom, nutrient, soil factor, practice, season).
    """
    q = query.lower()
    entities: Dict[str, Any] = {
        "crop": None,
        "symptoms": [],
        "nutrients": [],
        "soil_factors": [],
        "practices": [],
        "seasons": []
    }
    
    # 1. Crops
    crop_keywords = {
        "rice": ["rice", "paddy", "nellu", "nel", "arisi", "நெல்"],
        "tomato": ["tomato", "thakkali", "தக்காளி"],
        "cotton": ["cotton", "paruthi", "பருத்தி"],
        "sugarcane": ["sugarcane", "karumbu", "கரும்பு"],
        "maize": ["maize", "makkacholam", "மக்காச்சோளம்"],
        "sorghum": ["sorghum", "cholam", "சோளம்"],
        "millet": ["millet", "ragi", "kambu", "kelvaragu", "கம்பு", "கேழ்வரகு"],
        "pulses": ["pulse", "blackgram", "greengram", "ulunthu", "pasippayiru", "உளுந்து", "பயறு", "cowpea"],
        "groundnut": ["groundnut", "peanut", "verkadalai", "வேர்க்கடலை", "நிலக்கடலை"],
        "banana": ["banana", "vazhai", "வாழை"],
        "mango": ["mango", "mambazham", "manga", "மாங்காய்", "மா"],
        "chilli": ["chilli", "pepper", "milagai", "மிளகாய்"],
        "brinjal": ["brinjal", "eggplant", "kathiri", "கத்தரி"],
        "bhendi": ["bhendi", "okra", "ladies finger", "vendaikkai", "வெண்டை"],
        "onion": ["onion", "vengayam", "vengaya", "வெங்காயம்", "வெங்காய", "shallot", "shallots"],
        "coconut": ["coconut", "thennai", "thennamaram", "தென்னை", "தென்னை மரம்"]
    }
    for crop_name, aliases in crop_keywords.items():
        if any(re.search(r'\b' + re.escape(alias) + r'\b', q) for alias in aliases):
            entities["crop"] = crop_name
            break

    # 2. Symptoms & Disease Signs
    symptom_keywords = {
        "yellowing": ["yellow", "yellowing", "chlorosis", "manjal", "manjala", "மஞ்சள்", "மஞ்சளாக"],
        "spots": ["spot", "spots", "lesion", "lesions", "pulli", "புள்ளி", "புள்ளிகள்"],
        "blight": ["blight", "blights", "blast", "karugal", "karugudhu", "karuguthu", "கருகல்", "இலைக்கருகல்"],
        "wilting": ["wilt", "wilting", "vaadal", "vaadudhu", "வாடல்"],
        "rot": ["rot", "rotting", "azhugal", "azhugudhu", "அழுகல்"],
        "curl": ["curl", "curling", "mosaic", "suruttal", "surundhu", "surungudhu", "சுருட்டல்", "சுருள்"],
        "stunted": ["valarave illa", "valarala", "valarchi illa", "stunted", "வளரவில்லை"],
        "damage": ["damage", "paadhikkappattadhu", "damaged", "சேதம்", "பாதிப்பு"],
        "pest": ["poochi", "puzhu", "vandu", "பூச்சி", "புழு", "வண்டு"],
        "mildew": ["mildew", "powdery", "சாம்பல்"],
        "rust": ["rust", "rusts", "துரு"],
        "anthracnose": ["anthracnose", "ஆந்த்ராக்னோஸ்"]
    }
    for sym_name, aliases in symptom_keywords.items():
        if any(alias in q for alias in aliases):
            entities["symptoms"].append(sym_name)

    # 3. Nutrients
    nutrient_keywords = {
        "nitrogen": ["nitrogen", "urea", "n", "தழைச்சத்து"],
        "phosphorus": ["phosphorus", "dap", "ssp", "மணிச்சத்து"],
        "potassium": ["potassium", "potash", "mop", "சாம்பல் சத்து"],
        "zinc": ["zinc", "துத்தநாகம்"],
        "iron": ["iron", "ferrous", "இரும்புச்சத்து"],
        "magnesium": ["magnesium", "மெக்னீசியம்"]
    }
    for nut_name, aliases in nutrient_keywords.items():
        if any(re.search(r'\b' + re.escape(alias) + r'\b', q) for alias in aliases):
            entities["nutrients"].append(nut_name)

    # 4. Soil Factors
    soil_keywords = {
        "ph": ["ph", "acid", "acidic", "alkali", "alkaline", "saline", "salinity", "அமில", "கார"],
        "texture": ["clay", "sandy", "loam", "alluvial", "black cotton", "red soil", "மண் வகை"],
        "testing": ["test", "testing", "soil health card", "மண் பரிசோதனை"]
    }
    for sf_name, aliases in soil_keywords.items():
        if any(alias in q for alias in aliases):
            entities["soil_factors"].append(sf_name)

    # 5. Practices
    practice_keywords = {
        "awd": ["awd", "alternate wetting and drying", "மாற்று நனைத்தல்"],
        "sri": ["sri", "intensification", "ஒற்றை நாற்று"],
        "lcc": ["lcc", "leaf colour chart", "இலை வண்ண அட்டை"],
        "ipm": ["ipm", "integrated pest management", "ஒருங்கிணைந்த பூச்சி"],
        "organic": ["organic", "panchagavya", "jeevamrutham", "vermicompost", "இயற்கை உரம்"]
    }
    for pr_name, aliases in practice_keywords.items():
        if any(alias in q for alias in aliases):
            entities["practices"].append(pr_name)

    # 6. Seasons
    season_keywords = {
        "kuruvai": ["kuruvai", "குறுவை"],
        "samba": ["samba", "சம்பா"],
        "thaladi": ["thaladi", "தாளடி"],
        "navarai": ["navarai", "நவரை"],
        "kharif": ["kharif"],
        "rabi": ["rabi"]
    }
    for sea_name, aliases in season_keywords.items():
        if any(alias in q for alias in aliases):
            entities["seasons"].append(sea_name)

    return entities

def classify_intent(query: str) -> str:
    """
    Granularly classify query into one of the 16+ agricultural and interaction categories.
    Accurately supports singular and plural forms, synonyms, Tamil transliterations,
    and entity-guided intent routing.
    """
    q = query.strip().lower()
    entities = extract_entities(query)
    
    # 1. Greetings & Pleasantries & Opening Inquiries
    greeting_patterns = [
        r"^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening)|howdy)\b",
        r"^(vanakkam|வணக்கம்|namaste|halo)\b",
        r"^(hi\s+there|hello\s+agrimind|hi\s+agrimind)\b",
        r"^(thanks|thank\s+you|நன்றி|romba\s+nandri|mikka\s+nandri)\b",
        r"\b(enakku\s+oru\s+doubt|oru\s+doubt|doubt\s+irukku|oru\s+kelvi\s+kekalama|kelvi\s+kekalama|oru\s+question\s+kekalama)\b",
        r"\b(help\s+pannunga|help\s+me|can\s+you\s+help\s+me|can\s+i\s+ask\s+a\s+question)\b"
    ]
    for pat in greeting_patterns:
        if re.search(pat, q):
            return "greeting_conversational"

    # 2. Capability Inquiries
    capability_patterns = [
        r"\b(what\s+can\s+you\s+do|what\s+are\s+your\s+features|who\s+are\s+you|tell\s+me\s+about\s+yourself)\b",
        r"\b(i\s+have\s+a\s+question|can\s+i\s+ask)\b",
        r"^(what\s+is\s+agrimind|what\s+do\s+you\s+do)\b",
        r"\b(enna\s+panna\s+mudiyum|neenga\s+yaaru|agrimind\s+enna\s+pannum)\b"
    ]
    for pat in capability_patterns:
        if re.search(pat, q):
            return "capability"

    # 3. Followup / Conversation continuation
    followup_patterns = [
        r"^(tell\s+me\s+more|what\s+about\s+the\s+second|and\s+then|how\s+to\s+apply\s+it|can\s+i\s+use\s+that|what\s+else)\b",
        r"^(மேலும்\s+விளக்கவும்|அடுத்தது\s+என்ன)\b"
    ]
    for pat in followup_patterns:
        if re.search(pat, q):
            return "followup_conversation"

    # 4. Image / Photo Plant Health Inquiries
    if any(k in q for k in ["upload", "photo", "image", "picture", "leaf image", "படம்", "புகைப்படம்"]):
        return "image_plant_health"

    # 5. Plant Diseases & Symptom Diagnosis (check early for high specificity)
    disease_patterns = [
        r"\b(diseases?|blast|blights?|brown\s*spots?|spots?|lesions?|sheath\s*blights?|powdery\s*mildews?|damping\s*offs?|fungal|fungus|fungi|bacteria|bacterial|viruses?|viral|mosaics?|rots?|rotting|wilts?|wilting|cankers?|rusts?|anthracnoses?|sigatoka|purple\s*blotch|yellow\s*leaves|yellowing|tikka|treatments?|treat|controls?|protect|protection|symptoms?)\b",
        r"(நோய்|கருகல்|இலைக்கருகல்|பழுப்பு\s*புள்ளி|வெண்புள்ளி|வாடல்|மஞ்சள்\s*இலை|வைரஸ்|சாம்பல்|துரு|ஆந்த்ராக்னோஸ்|அழுகல்)"
    ]
    for pat in disease_patterns:
        if re.search(pat, q):
            return "plant_diseases_symptoms"
    if entities.get("symptoms"):
        return "plant_diseases_symptoms"

    # 6. Insect Pests & Integrated Pest Management (IPM)
    pest_patterns = [
        r"\b(pests?|insects?|stem\s*borers?|borers?|planthoppers?|bph|leaf\s*folders?|caterpillars?|larvae?|larva|aphids?|whitefl(y|ies)|thrips?|mites?|mealybugs?|bollworms?|ipm|etl|light\s*traps?|traps?|pheromones?|nske|neem\s*oil|predators?|biocontrol|sprays?)\b",
        r"(பூச்சி|புழு|குருத்துப்பூச்சி|இலைச்சுருட்டு|தண்டுத்துளைப்பான்|பூச்சி\s*மேலாண்மை|பொறி|வேப்ப\s*எண்ணெய்)"
    ]
    for pat in pest_patterns:
        if re.search(pat, q):
            return "insect_pests_ipm"

    # 7. Nutrient Deficiencies & Fertilizer Management
    nutrient_patterns = [
        r"\b(nutrients?|deficienc(y|ies)|fertilizers?|fertilisers?|urea|nitrogens?|npk|potassium|potash|mop|phosphorus|dap|ssp|zinc|iron|magnesium|calcium|boron|chlorosis|leaf\s*colour\s*charts?|lcc|split\s*applications?|inm|manures?|composts?|dosage|dose|doses)\b",
        r"(உரம்|தழைச்சத்து|சாம்பல்\s*சத்து|மணிச்சத்து|துத்தநாகம்|யூரியா|இலை\s*வண்ண\s*அட்டை|தொழு\s*உரம்|ஊட்டச்சத்து)"
    ]
    for pat in nutrient_patterns:
        if re.search(pat, q):
            return "nutrient_deficiencies_fertilizer"
    if entities.get("nutrients"):
        return "nutrient_deficiencies_fertilizer"

    # 8. Soil Types, pH, and Testing
    soil_patterns = [
        r"\b(soil\s*phs?|phs?\s*levels?|ph|soil\s*tests?|soil\s*testings?|acidic\s*soils?|alkaline\s*soils?|saline|salinity|soil\s*health|soil\s*types?|alluvial|black\s*cotton|red\s*soils?|sandy|clay|gypsum|lime|liming)\b",
        r"(அமில\s*மண்|கார\s*மண்|மண்\s*பரிசோதனை|மண்\s*வளம்|மண்ணின்\s*ph|மண்\s*வகை|செம்மண்|கரிசல்\s*மண்)"
    ]
    for pat in soil_patterns:
        if re.search(pat, q):
            return "soil_ph_testing"
    if entities.get("soil_factors"):
        return "soil_ph_testing"

    # 9. Crop Selection & Seasonal Planning
    season_patterns = [
        r"\b(seasons?|kuruvai|samba|thaladi|navarai|kharif|rabi|zaid|summer|monsoon|crop\s*selections?|which\s*crops?|variet(y|ies)|cultivars?|planting\s*times?|sowing\s*times?|duration|short\s*duration|long\s*duration)\b",
        r"(பருவம்|பருவங்கள்|குறுவை|சம்பா|தாளடி|நவரை|பயிர்\s*தேர்வு|நடவு\s*காலம்|ரகங்கள்|பயிர்\s*ரகம்)"
    ]
    for pat in season_patterns:
        if re.search(pat, q):
            return "crop_selection_season"
    if entities.get("seasons"):
        return "crop_selection_season"

    # 10. Irrigation, Drainage & Water Conservation
    water_patterns = [
        r"\b(waters?|irrigations?|awd|alternate\s*wetting|drip|sprinklers?|drainages?|waterlogg(ed|ing)|droughts?|floods?|flooding|water\s*conservations?|pani\s*pipe|submersion|percolation)\b",
        r"(தண்ணீர்|நீர்|நீர்ப்பாசனம்|சொட்டுநீர்|வடிகால்|மாற்று\s*நனைத்தல்|பாசனம்|பாசன\s*நீர்)"
    ]
    for pat in water_patterns:
        if re.search(pat, q):
            return "irrigation_water_conservation"

    # 11. Weather & Climate Decisions
    weather_patterns = [
        r"\b(weathers?|rainfalls?|rains?|monsoons?|humidit(y|ies)|temperatures?|heat\s*waves?|cyclones?|forecasts?|climates?|dew|sunshine|cloudy|winds?)\b",
        r"(வானிலை|மழை|பருவமழை|ஈரப்பதம்|வெப்பநிலை|புயல்|பனி)"
    ]
    for pat in weather_patterns:
        if re.search(pat, q):
            return "weather_climate_decisions"

    # 12. Sustainable & Organic Farming
    organic_patterns = [
        r"\b(sustainab(le|ility)|organics?|panchagavya|jeevamrutham|vermicomposts?|composts?|green\s*manures?|daincha|sunnhemp|biofertilizers?|azospirillum|phosphobacteria|crop\s*rotations?|natural\s*farming|traditional)\b",
        r"(இயற்கை\s*விவசாயம்|பஞ்சகாவ்யா|ஜீவாமிர்தம்|மண்புழு\s*உரம்|பசுந்தாள்\s*உரம்|உயிர்\s*உரம்|நிலையான\s*விவசாயம்)"
    ]
    for pat in organic_patterns:
        if re.search(pat, q):
            return "sustainable_organic_farming"

    # 13. Cultivation Methods & Agronomy
    cultivation_patterns = [
        r"\b(cultivations?|how\s*to\s*grow|grow|plantings?|transplantings?|sri|nurser(y|ies)|spacings?|weedings?|weeds?|direct\s*seedings?|land\s*preparations?|puddling|tillering|panicle|heading|germination)\b",
        r"(சாகுபடி|பயிரிடுதல்|நாற்று|நடவு|களை\s*மேலாண்மை|உழவு|முளைப்பு|நாற்றங்கால்)"
    ]
    for pat in cultivation_patterns:
        if re.search(pat, q):
            return "cultivation_methods"

    # 14. Harvesting, Storage & Post-harvest Handling
    harvest_patterns = [
        r"\b(harvests?|harvestings?|storages?|moisture\s*contents?|grain\s*dryings?|threshings?|post\s*harvests?|hermetic|warehouses?|curing|shelf\s*life|bruising)\b",
        r"(அறுவடை|தானிய\s*சேமிப்பு|ஈரப்பதம்|சேமிப்பு|களஞ்சியம்)"
    ]
    for pat in harvest_patterns:
        if re.search(pat, q):
            return "harvesting_storage_postharvest"

    # 15. Farm Economics & Government Schemes
    scheme_patterns = [
        r"\b(schemes?|pm-?kisans?|pmfby|insurances?|subsid(y|ies)|costs?|prices?|markets?|msps?|uzhavar\s*sandhai|loans?|credit|kisan\s*credit\s*card)\b",
        r"(திட்டம்|மானியம்|காப்பீடு|விலை|உழவர்\s*சந்தை|கடன்|கிசான்)"
    ]
    for pat in scheme_patterns:
        if re.search(pat, q):
            return "government_schemes_policies"

    # 16. General Agricultural Knowledge / Crop Entity Catch-all
    general_agri_patterns = [
        r"\b(agricultur(e|al)|farming|crops?|plants?|botany|agronomy|tnau|icar|kvk|field|orchard|seed|seeds|yield|acre|hectare)\b",
        r"(விவசாயம்|வேளாண்மை|பயிர்|விதை|விளைச்சல்)"
    ]
    for pat in general_agri_patterns:
        if re.search(pat, q):
            return "general_agri_knowledge"

    # If any specific crop is detected, default to cultivation methods or general agri
    if entities.get("crop"):
        if any(w in q for w in ["how", "care", "guide", "manage", "cultivate", "grow", "tips"]):
            return "cultivation_methods"
        return "general_agri_knowledge"

    # If practices detected (AWD, organic, IPM, LCC, etc.)
    if entities.get("practices"):
        if "awd" in entities["practices"]:
            return "irrigation_water_conservation"
        if "organic" in entities["practices"]:
            return "sustainable_organic_farming"
        if "ipm" in entities["practices"]:
            return "insect_pests_ipm"
        if "lcc" in entities["practices"]:
            return "nutrient_deficiencies_fertilizer"
        return "general_agri_knowledge"

    # If Tamil script is used, default to agricultural knowledge
    if detect_language(query) == "ta":
        return "general_agri_knowledge"

    # Non-agricultural / General knowledge
    return "general_non_agricultural"

def get_conversational_response(intent: str, query: str, language: str = "en") -> str:
    """
    Produce natural conversational responses for greetings and capability questions.
    Supports English, Tamil script, and Tanglish.
    """
    det_lang = detect_language(query)
    effective_lang = language if language in ["ta", "tanglish", "en"] else det_lang
    q = query.lower()

    if any(w in q for w in ["thank", "thanks", "நன்றி", "nandri"]):
        if effective_lang == "ta":
            return (
                "மகிழ்ச்சி! உங்கள் விவசாயப் பயிர்கள் மற்றும் மண் வளம் சார்ந்த ஏதேனும் கூடுதல் சந்தேகங்கள் இருந்தால் எப்போதும் கேளுங்கள். வளமான சாகுபடிக்கு வாழ்த்துகள்!"
            )
        elif effective_lang == "tanglish":
            return (
                "Romba nandri! Unga payir, uram, mannu, poochi, illa noi pathina vera edhavadhu sandhegam irundha kandippa kelunga. Nalamaana vivasaayam amaiya vaazhthukkal!"
            )
        return (
            "You are very welcome! If you have any further questions about your crops, irrigation, soil health, or pest management, feel free to ask anytime. Wishing you a bountiful harvest!"
        )
    
    # Check for specific "doubt" or "kelvi" opening
    if any(w in q for w in ["doubt", "kelvi", "question", "help", "சந்தேகம்", "உதவி"]):
        if effective_lang == "ta":
            return (
                "கண்டிப்பாக! என்ன சந்தேகம்? உங்கள் பயிர், செடி, உரம், நோய், பூச்சி, அல்லது பாசனம் பற்றி தாராளமாகக் கேளுங்கள். உங்களுக்கு என்ன உதவி தேவை?"
            )
        elif effective_lang == "tanglish":
            return (
                "Kandippa! Enna doubt? Unga payir, chedi, uram, noi, poochi, illa irrigation pathi kelunga. Ungalukku enna problem irukku?"
            )
        return (
            "Certainly! What doubt do you have? Please ask about your crop, plant health, fertilizers, pests, diseases, or irrigation. How can I help you today?"
        )

    if intent in ["greeting", "greeting_conversational"]:
        if effective_lang == "ta":
            return (
                "வணக்கம்! அக்ரிமைண்ட் (AgriMind) உங்களை அன்புடன் வரவேற்கிறது. "
                "உங்கள் பயிர்கள், மண் வளம், பூச்சி மேலாண்மை, பருவகால சாகுபடி அல்லது நிலையான விவசாயம் குறித்து நான் எவ்வாறு உதவ முடியும்?"
            )
        elif effective_lang == "tanglish":
            return (
                "Vanakkam! AgriMind-ku ungalai anbudan varaverkirom. "
                "Unga payir, chedi valarchi, uram, poochi, illa noi pathi enna sandhegam irukku? Sollunga, kandippa help panren!"
            )
        return (
            "Hello! Welcome to AgriMind — your Multimodal AI Assistant for Sustainable Agriculture. "
            "How can I help you today with your crops, soil health, pest management, or sustainable farming practices?"
        )
        
    elif intent == "capability":
        if effective_lang == "ta":
            return (
                "நிச்சயமாக! தாராளமாகக் கேளுங்கள். அக்ரிமைண்ட் தமிழ்நாடு வேளாண்மைப் பல்கலைக்கழகம் (TNAU) மற்றும் ICAR வழிகாட்டுதல்களின் அடிப்படையில் உங்களுக்கு பின்வரும் துறைகளில் உதவ முடியும்:\n\n"
                "🌾 **பயிர் பாதுகாப்பு & நோய் கண்டறிதல்:** இலை புள்ளிகள், கருகல் நோய் மற்றும் நோய்த்தடுப்பு முறைகள்.\n"
                "🌱 **மண் வளம் & உர மேலாண்மை:** மண் பரிசோதனை வழிகாட்டுதல் (pH), இலை வண்ண அட்டை (LCC) மற்றும் ஊட்டச்சத்து.\n"
                "💧 **நிலையான நீர்ப்பாசனம்:** மாற்று நனைத்தல் மற்றும் உலர்த்துதல் (AWD), சொட்டு நீர் முறை.\n"
                "🛡️ **ஒருங்கிணைந்த பூச்சி கட்டுப்பாடு (IPM):** நன்மை செய்யும் பூச்சிகளைப் பாதுகாத்தல், பொருளாதார சேத நிலை (ETL).\n"
                "📅 **பருவகால சாகுபடி:** குறுவை, சம்பா, தாளடி மற்றும் நவரை பருவ வழிகாட்டுதல்கள்.\n"
                "🌐 **பன்மொழி ஆதரவு:** தமிழ் (Tamil), ஆங்கிலம் (English) மற்றும் கலந்து பேசும் Tanglish கேள்விகள்.\n\n"
                "உங்கள் விவசாயக் கேள்வியை இப்போதே தட்டச்சு செய்யுங்கள்!"
            )
        elif effective_lang == "tanglish":
            return (
                "Kandippa! AgriMind ungalukku TNAU mattrum ICAR valikaattuthalgal padi ivatril guidance tharum:\n\n"
                "🌾 **Payir Paadhukaappu & Noi:** Ilai pulli, karugal noi, vaadal noi thaduppu.\n"
                "🌱 **Mann Valam & Uram:** Mann parichodanai (pH), LCC leaf colour chart, balanced NPK uram.\n"
                "💧 **Thannir Paasanam:** Alternate Wetting & Drying (AWD) mattrum drip paasanam.\n"
                "🛡️ **Poochi Melanmai (IPM):** Nanmai seyyum poochigal, neem oil spray.\n"
                "📅 **Paruva Sagu padi:** Kuruvai, Samba, Thaladi seasonal advice.\n"
                "🌐 **Language Support:** English, Tamil script, mattrum Tanglish!\n\n"
                "Unga kelviyai ippovae type pannunga!"
            )
        return (
            "Of course! Ask me your question. AgriMind is designed with specialized agronomic grounding from TNAU & ICAR publications to assist across:\n\n"
            "🌾 **Crop Care & Disease Diagnosis:** Identifying symptoms (leaf blast, blight, brown spot) and distinguishing biotic vs abiotic stress.\n"
            "🌱 **Soil Health & Balanced Nutrition:** Soil pH interpretation, soil-testing guidance, Leaf Colour Chart (LCC) nitrogen splits, and organic enrichment.\n"
            "💧 **Water Management:** Alternate Wetting & Drying (AWD), micro-irrigation scheduling, and drainage during excess rains.\n"
            "🛡️ **Integrated Pest Management (IPM):** Economic Threshold Level (ETL) scouting, biological predators, and neem-based solutions.\n"
            "📅 **Seasonal Planning:** Kuruvai, Samba, Thaladi, and Navarai season calendars and varietal selection.\n"
            "🌐 **Multilingual Communication:** Seamless answers in English, Tamil (தமிழ்), or Tanglish inquiries.\n\n"
            "Go ahead and ask your question!"
        )

    return "Hello! How can I assist you with your farming inquiries today?"
