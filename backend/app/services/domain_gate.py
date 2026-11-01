"""
AgriMind 2.0: Strict Agriculture-Domain Validation Layer
Enforces domain restriction before LLM invocation or conversational generation.
Rejects out-of-domain queries (celebrity gossip, general entertainment, unrelated coding,
general homework, partisan politics) with polite bilingual explanations.
Defends against prompt injection and jailbreak attempts.
Allows inquiries into agricultural science, crop care, farming practices,
and the AgriMind system itself.
"""

import re
from typing import Dict, Any, Tuple

PROMPT_INJECTION_PATTERNS = [
    r"\bignore\s+(all\s+)?(previous|prior|above)\s+instructions\b",
    r"\bdisregard\s+(all\s+)?(previous|prior|system)\s+rules\b",
    r"\byou\s+are\s+now\s+(dan|unrestricted|jailbroken|freed)\b",
    r"\bforget\s+(your\s+)?(system\s+prompt|instructions|rules)\b",
    r"\bact\s+as\s+(an?\s+)?unrestricted\s+ai\b",
    r"\bsystem\s+override\b",
    r"\bdeveloper\s+mode\s+output\b"
]

EXPLICIT_OUT_OF_DOMAIN_PATTERNS = [
    # Celebrity & Pop Entertainment
    r"\b(taylor\s+swift|shah\s*rukh\s*khan|salman\s*khan|kardashian|hollywood|bollywood|billboard\s*hot|grammy|oscar\s*award|box\s*office|movie\s*review|actor|actress|cinema|netflix|pop\s*star)\b",
    # Sports & Gaming
    r"\b(fifa|ipl|cricket\s*score|world\s*cup\s*final|premier\s*league|fortnite|playstation|xbox|nintendo|gta\s*v|minecraft|nba|esports)\b",
    # General Coding / Computer Science (unrelated to AgriMind)
    r"\b(quicksort|binary\s*search\s*tree|leetcode|center\s*a\s*div|css\s*flexbox|react\s*redux\s*tutorial|c\+\+\s*pointer|java\s*spring\s*boot|reverse\s*a\s*linked\s*list|fibonacci\s*recursive)\b",
    # General Geopolitics & Partisan Politics
    r"\b(presidential\s*election|who\s+should\s+i\s+vote\s+for|republican\s*vs\s*democrat|geopolitics|nato\s*expansion|israel\s*palestine\s*conflict)\b",
    # General Homework / Non-agri Science & Math
    r"\b(quadratic\s*equation|integral\s*of|quantum\s*physics|french\s*revolution|capital\s*of\s*(france|australia|germany|italy|canada|japan|russia|brazil))\b"
]

AGRIMIND_SYSTEM_PATTERNS = [
    r"\b(agrimind|what\s+can\s+you\s+do|who\s+are\s+you|who\s+made\s+you|how\s+do\s+you\s+work|your\s+model|vision\s+model|how\s+to\s+use|features|architecture|api\s*key|how\s+does\s+this\s+website\s+work)\b",
    r"\b(python\s+code\s+for\s+agrimind|agrimind\s+backend|fastapi\s+endpoint|agrimind\s+accuracy)\b",
    r"(அக்ரிமைண்ட்|நீ\s+யார்|உன்னால்\s+என்ன\s+செய்ய\s+முடியும்|எவ்வாறு\s+பயன்படுத்துவது)"
]

AGRICULTURAL_KEYWORDS = [
    # Core Crops (English, Tanglish, and variants)
    "rice", "paddy", "nellu", "nel", "arisi", "tomato", "thakkali", "cotton", "paruthi",
    "chilli", "milagai", "banana", "vazhai", "mango", "manga", "mambazham", "coconut", "thennai",
    "thennamaram", "groundnut", "verkadalai", "maize", "makkacholam", "sorghum", "cholam", "sugarcane",
    "karumbu", "onion", "vengayam", "vengaya", "millet", "ragi", "kambu", "pulse", "blackgram",
    "ulunthu", "greengram", "turmeric", "manjal", "brinjal", "kathiri", "bhendi", "okra", "vendaikkai",
    
    # Plant parts & Anatomy
    "plant", "crop", "tree", "chedi", "chediku", "chedila", "maram", "marathula", "payir", "payirla",
    "leaf", "leaves", "foliage", "elai", "ilai", "ilaigal", "ilaigalla", "ela", "root", "ver", "stem",
    "thandu", "flower", "poo", "fruit", "kaai", "kani", "grain", "seed", "vithai", "vidhai", "naathu", "nadavu",
    
    # Agronomy, Soil, Nutrients, Fertilizer
    "soil", "mann", "mannu", "ph", "fertilizer", "uram", "urapoda", "podanum", "urea", "nitrogen", "phosphorus",
    "dap", "potassium", "potash", "zinc", "khaira", "magnesium", "chlorosis", "compost",
    "manure", "vermicompost", "green manure", "daincha", "sunnhemp", "gypsum", "lime",
    "saline", "alkaline", "acidic", "soil test", "soil health card", "lcc", "leaf colour chart",
    
    # Diseases, Stresses, Symptoms, Pathology
    "disease", "noi", "blast", "blight", "spot", "pulli", "thitte", "rot", "azhugal", "azhugudhu", "wilt",
    "vaadal", "vaadudhu", "curl", "suruttal", "surundhu", "surungudhu", "mosaic", "mildew", "rust", "canker",
    "anthracnose", "karugal", "karugudhu", "karuguthu", "manjala", "yellowing", "yellow", "stunted", "valarave",
    "valarala", "valarchi", "damage", "damaged", "stress",
    
    # Pests, Entomology & Control
    "pest", "poochi", "borer", "caterpillar", "puzhu", "aphid", "whitefly", "vandu",
    "thrip", "mite", "bollworm", "bph", "planthopper", "ipm", "etl", "light trap",
    "pheromone", "nske", "neem oil", "spray", "thelikkanum", "thelikka", "marunthu", "pesticide",
    "fungicide", "biocontrol",
    
    # Water, Weather, Seasons, Cultivation
    "water", "thannir", "thanni", "irrigation", "paasanam", "awd", "drip", "sprinkler",
    "drainage", "waterlog", "drought", "weather", "vanilai", "rainfall", "rain", "mazhai",
    "monsoon", "humidity", "cyclone", "kuruvai", "samba", "thaladi", "navarai", "kharif",
    "rabi", "sowing", "transplanting", "nursery", "harvest", "aruwadai", "storage",
    "tnau", "icar", "kvk", "uzhavar sandhai", "pm-kisan", "pmfby", "crop insurance",
    
    # Common conversational follow-up agricultural tokens
    "pazhaiya", "pazhaya", "pudhu", "puthiya", "mattum"
]

TAMIL_AGRI_TERMS = [
    "நெல்", "பயிர்", "விவசாயம்", "வேளாண்மை", "மண்", "உரம்", "தழைச்சத்து", "சாம்பல்",
    "மணிச்சத்து", "யூரியா", "நோய்", "கருகல்", "புள்ளி", "வாடல்", "அழுகல்", "பூச்சி",
    "புழு", "தண்ணீர்", "நீர்", "பாசனம்", "வானிலை", "மழை", "குறுவை", "சம்பா", "நவரை",
    "தக்காளி", "பருத்தி", "மிளகாய்", "வாழை", "மாங்காய்", "தென்னை", "வெங்காயம்", "கரும்பு",
    "செடி", "இலை", "இலைகள்", "மஞ்சள்", "மஞ்சளாக", "வளரவில்லை", "சேதம்"
]

def validate_agricultural_domain(query: str, language: str = "en", conversation_history: Any = None) -> Dict[str, Any]:
    """
    Validates whether the query is strictly agricultural or system-related.
    Blocks prompt injections and out-of-domain requests.
    Supports English, Tamil script, and Tanglish.
    Preserves multi-turn agricultural context for follow-up questions.
    """
    if not query or not query.strip():
        return {
            "is_valid": False,
            "category": "empty",
            "reason": "Empty query",
            "refusal_message": (
                "தயவுசெய்து ஒரு விவசாயக் கேள்வியை உள்ளிடவும்." if language == "ta"
                else "Dayavuseidhu oru vivasaaya kelviyai type pannunga." if language in ["tanglish", "mixed"]
                else "Please enter an agricultural question."
            )
        }

    q = query.strip().lower()
    
    # 1. Prompt Injection Defense
    for pattern in PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, q):
            msg = (
                "அக்ரிமைண்ட் தமிழ்நாடு விவசாயத்திற்கான பிரத்யேக AI அமைப்பாகும். பாதுகாப்பு விதிமுறைகளை மீறும் கோரிக்கைகள் ஏற்கப்படாது. விவசாயம் சார்ந்த கேள்விகளைக் கேளுங்கள்."
                if language == "ta" else
                "AgriMind Tamil Nadu vivasaayathirkkana special AI assistant. System override anuvadikkappadadhu. Ungaloda chedi, payir, uram pathina kelvigalai kelunga."
                if language in ["tanglish", "mixed"] else
                "AgriMind is strictly programmed as an agricultural decision-support assistant for Tamil Nadu. "
                "System prompt override attempts are rejected. Please ask a question related to crops, soil, or farming."
            )
            return {
                "is_valid": False,
                "category": "prompt_injection",
                "reason": "Prompt injection pattern detected",
                "refusal_message": msg
            }

    # 2. AgriMind System Self-Inquiries (Allowed)
    for pattern in AGRIMIND_SYSTEM_PATTERNS:
        if re.search(pattern, q):
            return {
                "is_valid": True,
                "category": "agrimind_system",
                "reason": "AgriMind platform inquiry",
                "refusal_message": ""
            }

    # 3. Conversational greetings, doubts, and assistance openings (Allowed)
    greeting_patterns = [
        r"^(hi|hello|hey|good\s+(morning|afternoon|evening)|vanakkam|வணக்கம்|namaste|thanks|thank\s+you|நன்றி|nandri)\b",
        r"\b(enakku\s+oru\s+doubt|oru\s+doubt|doubt\s+irukku|doubt|oru\s+kelvi|kelvi\s+kekalama|oru\s+question|help\s+pannunga|help\s+me|can\s+i\s+ask|can\s+you\s+help)\b"
    ]
    is_greeting_or_opening = any(re.search(p, q) for p in greeting_patterns)
    if is_greeting_or_opening:
        return {
            "is_valid": True,
            "category": "greeting_conversational",
            "reason": "Conversational greeting or inquiry opening",
            "refusal_message": ""
        }

    # 4. Check for presence of agricultural keywords & Tamil text
    has_agri_en = any(re.search(r'\b' + re.escape(k) + r'\b', q) for k in AGRICULTURAL_KEYWORDS)
    has_agri_ta = any(term in query for term in TAMIL_AGRI_TERMS)
    has_tamil_chars = sum(1 for char in query if '\u0b80' <= char <= '\u0bff') > 1

    # 5. Multi-turn Follow-up Continuity:
    # If the user is replying in an ongoing active agricultural conversation (e.g., 'pazhaiya elai mattum', 'yes', 'bottom leaves')
    has_active_agri_context = False
    if conversation_history and len(conversation_history) > 0:
        # Check if previous assistant or user message contained agricultural terms
        for turn in conversation_history[-4:]:
            content = (turn.get("content") or "").lower()
            if any(k in content for k in ["tomato", "rice", "leaf", "leaves", "crop", "plant", "fertilizer", "soil", "disease", "தக்காளி", "நெல்", "இலை", "chedi", "payir", "elai", "uram"]):
                has_active_agri_context = True
                break

    if has_active_agri_context and len(q.split()) <= 8:
        # User is answering follow-up questions from the assistant
        return {
            "is_valid": True,
            "category": "agriculture_followup",
            "reason": "Active agricultural conversation continuation",
            "refusal_message": ""
        }

    # 6. Explicit Out-of-Domain Detection
    has_explicit_ood = any(re.search(pat, q) for pat in EXPLICIT_OUT_OF_DOMAIN_PATTERNS)
    if has_explicit_ood and not (has_agri_en or has_agri_ta):
        msg = (
            "அக்ரிமைண்ட் தமிழ்நாடு வேளாண்மை மற்றும் விவசாயப் பயிர்களுக்காக பிரத்யேகமாக வடிவமைக்கப்பட்ட AI உதவியாளர் ஆகும். "
            "பொழுதுபோக்கு, சினிமா, அல்லது தொடர்பில்லாத தலைப்புகளுக்கு என்னால் பதிலளிக்க இயலாது. "
            "பயிர் பாதுகாப்பு, நோயறிதல், உர மேலாண்மை, மண் வளம் அல்லது நீர்ப்பாசனம் தொடர்பான உங்கள் விவசாயக் கேள்விகளைத் தாராளமாகக் கேளுங்கள்!"
            if language == "ta" else
            "AgriMind vivasaayam mattrum payir paadhukaappukku mattum thaan help pannum. "
            "Cinima, sports, illa non-agri topics-ku pathil solla mudiyaadhu. "
            "Unga chedi, payir, uram, poochi, illa noi pathina kelvigalai kelunga, kandippa pathil solren!"
            if language in ["tanglish", "mixed"] else
            "AgriMind is a specialized agricultural AI platform dedicated to farmers, agronomists, and researchers in Tamil Nadu. "
            "I cannot assist with entertainment, celebrity gossip, unrelated coding, or non-agricultural topics. "
            "Please feel free to ask any question regarding crop care, plant diseases, fertilizers, soil testing, or seasonal planning!"
        )
        return {
            "is_valid": False,
            "category": "out_of_domain",
            "reason": "Explicit out-of-domain query",
            "refusal_message": msg
        }

    # 7. Standard Agricultural Domain Gate
    if has_agri_en or has_agri_ta or (has_tamil_chars and len(query.strip()) > 3):
        return {
            "is_valid": True,
            "category": "agriculture",
            "reason": "Verified agricultural or platform inquiry",
            "refusal_message": ""
        }

    # 8. Generic Non-Agricultural Filter
    msg = (
        "அக்ரிமைண்ட் விவசாயப் பயிர்கள், மண் வளம் மற்றும் நிலையான வேளாண்மை வழிகாட்டுதலுக்காக மட்டுமே வடிவமைக்கப்பட்டுள்ளது. "
        "உங்கள் கேள்வி விவசாயம் சார்ந்ததாக இல்லை. நெல், தக்காளி, பருத்தி, மிளகாய் போன்ற பயிர்கள், உரங்கள் அல்லது நோய்கள் குறித்த கேள்விகளைக் கேட்கவும்!"
        if language == "ta" else
        "AgriMind vivasaayam mattrum payir paadhukaappukku mattum thaan help pannum. "
        "Unga kelvi vivasaayam sambandhapattadha illa. Thakkali, nel, vazhai, uram, poochi, illa noi pathina kelvigalai kelunga!"
        if language in ["tanglish", "mixed"] else
        "AgriMind is specifically tailored to assist with Tamil Nadu agriculture, sustainable farming, crop diseases, and soil health. "
        "Your question does not appear to be related to farming or agriculture. "
        "Please ask about crops (Rice, Tomato, Cotton, Chilli, etc.), pests, fertilizers, irrigation, or seasonal advisories!"
    )
    return {
        "is_valid": False,
        "category": "out_of_domain",
        "reason": "Query lacks agricultural context",
        "refusal_message": msg
    }
