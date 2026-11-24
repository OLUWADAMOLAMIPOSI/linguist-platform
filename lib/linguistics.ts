export const VITALITY: Record<string, { label: string; color: string }> = {
  safe: { label: "Safe", color: "#2f4a3c" },
  vulnerable: { label: "Vulnerable", color: "#6b7f45" },
  definitely_endangered: { label: "Definitely endangered", color: "#9a8a3f" },
  severely_endangered: { label: "Severely endangered", color: "#a2753f" },
  critically_endangered: { label: "Critically endangered", color: "#8a4b3f" },
  extinct: { label: "Extinct", color: "#7a7f7b" },
  unknown: { label: "Not assessed", color: "#9aa39d" },
};

export const PUBLICATION_TYPES: Record<string, string> = {
  journal_article: "Journal article",
  conference_paper: "Conference paper",
  book: "Book",
  book_chapter: "Book chapter",
  dissertation: "Dissertation",
  thesis: "Thesis",
  working_paper: "Working paper",
  research_report: "Research report",
};

export const PHONOLOGY_CATEGORIES: Record<string, string> = {
  consonant_inventory: "Consonant inventory",
  vowel_inventory: "Vowel inventory",
  tone_system: "Tone system",
  syllable_structure: "Syllable structure",
  phonological_rule: "Phonological rule",
  phonological_process: "Phonological process",
};

export const MORPH_PROCESSES: Record<string, string> = {
  inflection: "Inflection",
  derivation: "Derivation",
  compounding: "Compounding",
  reduplication: "Reduplication",
  other: "Other",
};

export const TEACHING_KINDS: Record<string, string> = {
  appointment: "Academic appointments",
  workshop: "Workshops",
  conference: "Conferences",
  seminar: "Seminars",
  supervision: "Student supervision",
  certificate: "Certificates",
  professional_development: "Professional development",
};

/** Standard abbreviations from the Leipzig Glossing Rules. */
export const LEIPZIG_ABBREVIATIONS: [string, string][] = [
  ["1", "first person"], ["2", "second person"], ["3", "third person"],
  ["A", "agent-like argument of canonical transitive verb"], ["ABL", "ablative"], ["ABS", "absolutive"],
  ["ACC", "accusative"], ["ADJ", "adjective"], ["ADV", "adverb(ial)"], ["AGR", "agreement"],
  ["ALL", "allative"], ["ANTIP", "antipassive"], ["APPL", "applicative"], ["ART", "article"],
  ["AUX", "auxiliary"], ["BEN", "benefactive"], ["CAUS", "causative"], ["CLF", "classifier"],
  ["COM", "comitative"], ["COMP", "complementizer"], ["COMPL", "completive"], ["COND", "conditional"],
  ["COP", "copula"], ["CVB", "converb"], ["DAT", "dative"], ["DECL", "declarative"],
  ["DEF", "definite"], ["DEM", "demonstrative"], ["DET", "determiner"], ["DIST", "distal"],
  ["DISTR", "distributive"], ["DU", "dual"], ["DUR", "durative"], ["ERG", "ergative"],
  ["EXCL", "exclusive"], ["F", "feminine"], ["FOC", "focus"], ["FUT", "future"],
  ["GEN", "genitive"], ["IMP", "imperative"], ["INCL", "inclusive"], ["IND", "indicative"],
  ["INDF", "indefinite"], ["INF", "infinitive"], ["INS", "instrumental"], ["INTR", "intransitive"],
  ["IPFV", "imperfective"], ["IRR", "irrealis"], ["LOC", "locative"], ["M", "masculine"],
  ["N", "neuter"], ["N-", "non- (e.g. NSG nonsingular, NPST nonpast)"], ["NEG", "negation, negative"],
  ["NMLZ", "nominalizer / nominalization"], ["NOM", "nominative"], ["OBJ", "object"], ["OBL", "oblique"],
  ["P", "patient-like argument of canonical transitive verb"], ["PASS", "passive"], ["PFV", "perfective"],
  ["PL", "plural"], ["POSS", "possessive"], ["PRED", "predicative"], ["PRF", "perfect"],
  ["PRS", "present"], ["PROG", "progressive"], ["PROH", "prohibitive"], ["PROX", "proximal / proximate"],
  ["PST", "past"], ["PTCP", "participle"], ["PURP", "purposive"], ["Q", "question particle / marker"],
  ["QUOT", "quotative"], ["RECP", "reciprocal"], ["REFL", "reflexive"], ["REL", "relative"],
  ["RES", "resultative"], ["S", "single argument of canonical intransitive verb"], ["SBJ", "subject"],
  ["SBJV", "subjunctive"], ["SG", "singular"], ["TOP", "topic"], ["TR", "transitive"], ["VOC", "vocative"],
];

export const CONSONANT_PLACES = [
  "bilabial", "labiodental", "dental", "alveolar", "postalveolar",
  "retroflex", "palatal", "velar", "uvular", "pharyngeal", "glottal",
];
export const CONSONANT_MANNERS = [
  "plosive", "nasal", "trill", "tap or flap", "fricative",
  "lateral fricative", "approximant", "lateral approximant",
];
export const VOWEL_HEIGHTS = ["close", "near-close", "close-mid", "mid", "open-mid", "near-open", "open"];
export const VOWEL_BACKNESS = ["front", "central", "back"];
