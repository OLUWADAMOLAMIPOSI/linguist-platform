/**
 * Declarative description of every admin module. The generic list and edit screens,
 * the validation schema and the save/delete actions are all driven from this file,
 * so a module has exactly one definition that matches its database table.
 * Keep this file free of functions: parts of it are passed to client components.
 */

export type FieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "number"
  | "boolean"
  | "date"
  | "datetime"
  | "select"
  | "url"
  | "email"
  | "lines"
  | "file"
  | "files"
  | "relation"
  | "tree"
  | "tags"
  | "children";

export interface SelectOption {
  value: string;
  label: string;
}

export interface FileSpec {
  bucket: string;
  isPublic: boolean;
  accept: string[];
  maxMB: number;
}

export interface ChildSpec {
  table: string;
  fk: string;
  addLabel: string;
  fields: Field[];
}

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  help?: string;
  placeholder?: string;
  options?: SelectOption[];
  relation?: { table: string; labelField: string };
  file?: FileSpec;
  child?: ChildSpec;
  tags?: { junction: string; parentKey: string; tagKey: string; tagTable: string };
  slugFrom?: string;
  isSlug?: boolean;
  step?: string;
  rows?: number;
  default?: string | number | boolean;
  half?: boolean;
}

export interface Resource {
  key: string;
  label: string;
  group: string;
  table: string;
  titleField: string;
  columns: string[];
  searchFields: string[];
  orderBy: [string, boolean];
  fields: Field[];
  singleton?: boolean;
  adminOnly?: boolean;
  noCreate?: boolean;
  description?: string;
}

const IMAGE = ["image/jpeg", "image/png", "image/webp"];
const AUDIO = ["audio/mpeg", "audio/wav", "audio/x-wav", "audio/ogg", "audio/mp4", "audio/x-m4a", "audio/webm", "audio/aac"];
const PDF = ["application/pdf"];

const opts = (pairs: Record<string, string>): SelectOption[] =>
  Object.entries(pairs).map(([value, label]) => ({ value, label }));

const published = (label = "Published (visible on the public website)", def = false): Field => ({
  name: "is_published",
  label,
  type: "boolean",
  default: def,
});

const languageRel = (required = false): Field => ({
  name: "language_id",
  label: "Language",
  type: "relation",
  required,
  relation: { table: "languages", labelField: "name" },
});

const VITALITY_OPTS = opts({
  unknown: "Not assessed",
  safe: "Safe",
  vulnerable: "Vulnerable",
  definitely_endangered: "Definitely endangered",
  severely_endangered: "Severely endangered",
  critically_endangered: "Critically endangered",
  extinct: "Extinct",
});

const PUBLICATION_TYPE_OPTS = opts({
  journal_article: "Journal article",
  conference_paper: "Conference paper",
  book: "Book",
  book_chapter: "Book chapter",
  dissertation: "Dissertation",
  thesis: "Thesis",
  working_paper: "Working paper",
  research_report: "Research report",
});

export const RESOURCES: Resource[] = [
  // ---------------------------------------------------------------- Profile
  {
    key: "profile",
    label: "Profile",
    group: "Profile",
    table: "profiles",
    titleField: "full_name",
    columns: ["full_name", "academic_title", "specialization"],
    searchFields: ["full_name"],
    orderBy: ["created_at", true],
    singleton: true,
    description: "Your name, biography, photograph and CV. This is what visitors see on the home and about pages.",
    fields: [
      { name: "full_name", label: "Full name", type: "text", required: true },
      { name: "academic_title", label: "Academic title", type: "text", placeholder: "e.g. Senior Lecturer in Linguistics", half: true },
      { name: "specialization", label: "Linguistic specialization", type: "text", half: true },
      { name: "headline", label: "Short headline", type: "text", help: "One line shown under your name on the home page." },
      { name: "intro", label: "Professional introduction", type: "textarea", rows: 4 },
      { name: "biography", label: "Academic biography", type: "richtext" },
      {
        name: "photo_url",
        label: "Profile photograph",
        type: "file",
        file: { bucket: "profile-images", isPublic: true, accept: IMAGE, maxMB: 5 },
      },
      {
        name: "cv_url",
        label: "Academic CV (PDF)",
        type: "file",
        file: { bucket: "publication-documents", isPublic: true, accept: PDF, maxMB: 25 },
      },
      { name: "email", label: "Professional email", type: "email", half: true, help: "Stored in a publicly readable table. Leave blank if you prefer the contact form only." },
      { name: "phone", label: "Phone", type: "text", half: true, help: "Also publicly readable. Leave blank to keep it private." },
      { name: "location", label: "Location", type: "text" },
      { name: "teaching_philosophy", label: "Teaching philosophy", type: "richtext" },
      { name: "languages_spoken", label: "Languages spoken or studied", type: "lines", help: "One per line." },
      { name: "specializations", label: "Linguistic specializations", type: "lines", help: "One per line." },
      { name: "awards", label: "Awards and recognitions", type: "lines", help: "One per line." },
      { name: "achievements", label: "Academic achievements", type: "lines", help: "One per line. Shown on the home page." },
    ],
  },
  {
    key: "education",
    label: "Education",
    group: "Profile",
    table: "education",
    titleField: "degree",
    columns: ["degree", "institution", "end_year"],
    searchFields: ["degree", "institution", "field"],
    orderBy: ["sort_order", true],
    fields: [
      { name: "degree", label: "Degree or qualification", type: "text", required: true },
      { name: "field", label: "Field of study", type: "text" },
      { name: "institution", label: "Institution", type: "text", required: true },
      { name: "start_year", label: "Start year", type: "number", half: true },
      { name: "end_year", label: "End year", type: "number", half: true },
      { name: "description", label: "Notes", type: "textarea" },
      { name: "sort_order", label: "Sort order", type: "number", default: 0, help: "Lower numbers appear first." },
    ],
  },
  {
    key: "experience",
    label: "Experience",
    group: "Profile",
    table: "experiences",
    titleField: "role",
    columns: ["role", "organization", "kind"],
    searchFields: ["role", "organization"],
    orderBy: ["sort_order", true],
    fields: [
      { name: "role", label: "Role", type: "text", required: true },
      { name: "organization", label: "Organization", type: "text", required: true },
      { name: "location", label: "Location", type: "text" },
      {
        name: "kind",
        label: "Type",
        type: "select",
        required: true,
        default: "academic",
        options: opts({ academic: "Academic", professional: "Professional" }),
      },
      { name: "start_date", label: "Start date", type: "date", half: true },
      { name: "end_date", label: "End date (leave empty if current)", type: "date", half: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "sort_order", label: "Sort order", type: "number", default: 0 },
    ],
  },
  {
    key: "research-interests",
    label: "Research interests",
    group: "Profile",
    table: "research_interests",
    titleField: "name",
    columns: ["name", "sort_order"],
    searchFields: ["name"],
    orderBy: ["sort_order", true],
    fields: [
      { name: "name", label: "Interest", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "sort_order", label: "Sort order", type: "number", default: 0 },
    ],
  },
  {
    key: "affiliations",
    label: "Affiliations and memberships",
    group: "Profile",
    table: "academic_affiliations",
    titleField: "name",
    columns: ["name", "kind", "role"],
    searchFields: ["name", "role"],
    orderBy: ["sort_order", true],
    fields: [
      { name: "name", label: "Organization", type: "text", required: true },
      { name: "role", label: "Role", type: "text" },
      {
        name: "kind",
        label: "Type",
        type: "select",
        required: true,
        default: "affiliation",
        options: opts({ affiliation: "Academic affiliation", membership: "Professional membership" }),
      },
      { name: "url", label: "Website", type: "url" },
      { name: "sort_order", label: "Sort order", type: "number", default: 0 },
    ],
  },

  // --------------------------------------------------------------- Research
  {
    key: "research",
    label: "Research projects",
    group: "Research",
    table: "research_projects",
    titleField: "title",
    columns: ["title", "status", "category", "is_published"],
    searchFields: ["title", "category", "institution"],
    orderBy: ["created_at", false],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "URL slug", type: "text", isSlug: true, slugFrom: "title", help: "Leave blank to generate from the title." },
      { name: "abstract", label: "Abstract", type: "richtext" },
      { name: "objectives", label: "Research objectives", type: "richtext" },
      { name: "research_questions", label: "Research questions", type: "richtext" },
      { name: "methodology", label: "Methodology", type: "richtext" },
      { name: "findings", label: "Findings and conclusions", type: "richtext" },
      { name: "category", label: "Category", type: "text", half: true, placeholder: "e.g. Language documentation" },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        default: "ongoing",
        half: true,
        options: opts({ planned: "Planned", ongoing: "Ongoing", completed: "Completed" }),
      },
      { name: "start_date", label: "Start date", type: "date", half: true },
      { name: "end_date", label: "End date", type: "date", half: true },
      { name: "institution", label: "Institutional affiliation", type: "text" },
      { ...languageRel(), help: "Link this project to a documented language (optional)." },
      { name: "milestones", label: "Timeline milestones", type: "lines", help: "One per line, e.g. 2024 - Fieldwork phase one." },
      {
        name: "cover_image_url",
        label: "Project photograph",
        type: "file",
        file: { bucket: "research-attachments", isPublic: true, accept: IMAGE, maxMB: 10 },
      },
      {
        name: "attachments",
        label: "Downloadable documents",
        type: "files",
        file: { bucket: "research-attachments", isPublic: true, accept: [...PDF, "text/plain", "text/csv", "application/zip"], maxMB: 25 },
        help: "Only upload material you have permission to share publicly.",
      },
      {
        name: "collaborators",
        label: "Collaborators",
        type: "children",
        child: {
          table: "research_collaborators",
          fk: "project_id",
          addLabel: "Add collaborator",
          fields: [
            { name: "name", label: "Name", type: "text", required: true },
            { name: "affiliation", label: "Affiliation", type: "text" },
            { name: "role", label: "Role", type: "text" },
            { name: "url", label: "Profile URL", type: "url" },
          ],
        },
      },
      { name: "is_featured", label: "Featured on the home page", type: "boolean", default: false },
      published(),
    ],
  },
  {
    key: "publications",
    label: "Publications",
    group: "Research",
    table: "publications",
    titleField: "title",
    columns: ["title", "publication_type", "publication_date", "is_published"],
    searchFields: ["title", "venue", "doi"],
    orderBy: ["publication_date", false],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "URL slug", type: "text", isSlug: true, slugFrom: "title", help: "Leave blank to generate from the title." },
      { name: "publication_type", label: "Publication type", type: "select", required: true, default: "journal_article", options: PUBLICATION_TYPE_OPTS, half: true },
      { name: "publication_date", label: "Publication date", type: "date", half: true },
      {
        name: "authors",
        label: "Authors (in order)",
        type: "children",
        child: {
          table: "publication_authors",
          fk: "publication_id",
          addLabel: "Add author",
          fields: [
            { name: "given_names", label: "Given names", type: "text" },
            { name: "family_name", label: "Family name", type: "text", required: true },
          ],
        },
      },
      { name: "abstract", label: "Abstract", type: "richtext" },
      { name: "venue", label: "Journal, book or publisher", type: "text" },
      { name: "volume", label: "Volume", type: "text", half: true },
      { name: "issue", label: "Issue", type: "text", half: true },
      { name: "pages", label: "Pages", type: "text", half: true, placeholder: "e.g. 101-124" },
      { name: "doi", label: "DOI", type: "text", half: true, placeholder: "e.g. 10.1234/abcd.5678" },
      { name: "url", label: "External publication URL", type: "url" },
      {
        name: "pdf_url",
        label: "PDF (only where permitted)",
        type: "file",
        file: { bucket: "publication-documents", isPublic: true, accept: PDF, maxMB: 25 },
      },
      { name: "category", label: "Category", type: "text", half: true },
      { name: "keywords", label: "Keywords", type: "lines", half: true, help: "One per line." },
      {
        name: "citation_override",
        label: "Custom APA citation (optional)",
        type: "textarea",
        help: "If filled in, this text is used instead of the automatically formatted APA citation.",
      },
      {
        name: "project_id",
        label: "Related research project",
        type: "relation",
        relation: { table: "research_projects", labelField: "title" },
      },
      { name: "is_featured", label: "Featured on the home page", type: "boolean", default: false },
      published(),
    ],
  },

  // -------------------------------------------------------------- Languages
  {
    key: "language-families",
    label: "Language families",
    group: "Language archive",
    table: "language_families",
    titleField: "name",
    columns: ["name"],
    searchFields: ["name"],
    orderBy: ["name", true],
    fields: [
      { name: "name", label: "Family name", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
    ],
  },
  {
    key: "languages",
    label: "Languages",
    group: "Language archive",
    table: "languages",
    titleField: "name",
    columns: ["name", "iso_code", "family_id", "vitality", "is_published"],
    searchFields: ["name", "iso_code", "glottocode"],
    orderBy: ["name", true],
    fields: [
      { name: "name", label: "Language name", type: "text", required: true },
      { name: "slug", label: "URL slug", type: "text", isSlug: true, slugFrom: "name", help: "Leave blank to generate from the name." },
      { name: "alternative_names", label: "Alternative names", type: "lines", help: "One per line." },
      { name: "iso_code", label: "ISO 639-3 code", type: "text", half: true },
      { name: "glottocode", label: "Glottocode", type: "text", half: true },
      { name: "family_id", label: "Language family", type: "relation", relation: { table: "language_families", labelField: "name" } },
      { name: "classification", label: "Classification", type: "text", help: "e.g. branch or group within the family." },
      { name: "region", label: "Region", type: "text", half: true },
      { name: "country", label: "Country", type: "text", half: true },
      { name: "latitude", label: "Latitude", type: "number", step: "any", half: true, help: "Decimal degrees. Leave empty if not verified." },
      { name: "longitude", label: "Longitude", type: "number", step: "any", half: true, help: "Decimal degrees. Leave empty if not verified." },
      { name: "speakers_count", label: "Number of speakers (verified)", type: "number", half: true },
      { name: "speakers_note", label: "Source or note for speaker count", type: "text", half: true },
      { name: "vitality", label: "Language vitality", type: "select", required: true, default: "unknown", options: VITALITY_OPTS, half: true },
      { name: "vitality_source", label: "Vitality source", type: "text", half: true },
      { name: "description", label: "Description", type: "richtext" },
      { name: "grammar_overview", label: "Grammatical description", type: "richtext" },
      { name: "orthography_notes", label: "Orthography notes", type: "richtext" },
      {
        name: "dialects",
        label: "Dialects and varieties",
        type: "children",
        child: {
          table: "language_dialects",
          fk: "language_id",
          addLabel: "Add dialect",
          fields: [
            { name: "name", label: "Name", type: "text", required: true },
            { name: "region", label: "Region", type: "text" },
            { name: "description", label: "Description", type: "textarea" },
          ],
        },
      },
      published("Published (visible on the public website)"),
    ],
  },
  {
    key: "ipa-symbols",
    label: "IPA symbols",
    group: "Phonology",
    table: "ipa_symbols",
    titleField: "symbol",
    columns: ["symbol", "name", "category"],
    searchFields: ["symbol", "name"],
    orderBy: ["sort_order", true],
    description: "The IPA chart is pre-filled. Edit a symbol to add a description or an audio example.",
    fields: [
      { name: "symbol", label: "Symbol", type: "text", required: true, half: true },
      { name: "name", label: "Name", type: "text", required: true, half: true },
      { name: "category", label: "Category", type: "select", required: true, default: "consonant", options: opts({ consonant: "Consonant", other_consonant: "Other consonant", vowel: "Vowel" }) },
      { name: "place", label: "Place of articulation", type: "text", half: true },
      { name: "manner", label: "Manner of articulation", type: "text", half: true },
      { name: "voicing", label: "Voicing", type: "select", half: true, options: opts({ voiced: "Voiced", voiceless: "Voiceless" }) },
      { name: "height", label: "Vowel height", type: "text", half: true },
      { name: "backness", label: "Vowel backness", type: "text", half: true },
      { name: "rounded", label: "Rounded vowel", type: "boolean", default: false },
      { name: "description", label: "Description", type: "textarea" },
      {
        name: "audio_url",
        label: "Audio example",
        type: "file",
        file: { bucket: "dictionary-audio", isPublic: true, accept: AUDIO, maxMB: 10 },
      },
      { name: "sort_order", label: "Sort order", type: "number", default: 0 },
    ],
  },
  {
    key: "phonological-data",
    label: "Phonological descriptions",
    group: "Phonology",
    table: "phonological_data",
    titleField: "title",
    columns: ["title", "category", "language_id", "is_published"],
    searchFields: ["title"],
    orderBy: ["created_at", false],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      languageRel(true),
      {
        name: "category",
        label: "Category",
        type: "select",
        required: true,
        default: "consonant_inventory",
        options: opts({
          consonant_inventory: "Consonant inventory",
          vowel_inventory: "Vowel inventory",
          tone_system: "Tone system",
          syllable_structure: "Syllable structure",
          phonological_rule: "Phonological rule",
          phonological_process: "Phonological process",
        }),
      },
      { name: "symbols", label: "Phonemes or tones (for inventories)", type: "lines", help: "One per line, e.g. p, b, t, d." },
      { name: "content", label: "Description", type: "richtext" },
      { name: "sort_order", label: "Sort order", type: "number", default: 0 },
      published(),
    ],
  },
  {
    key: "phonological-examples",
    label: "Phonological examples",
    group: "Phonology",
    table: "phonological_examples",
    titleField: "orthographic",
    columns: ["orthographic", "phonemic", "example_type", "is_published"],
    searchFields: ["orthographic", "phonemic", "phonetic", "minimal_pair_group"],
    orderBy: ["created_at", false],
    fields: [
      languageRel(),
      { name: "example_type", label: "Example type", type: "select", required: true, default: "word", options: opts({ word: "Word", minimal_pair: "Minimal pair member", rule: "Rule example", tone: "Tone example" }) },
      { name: "minimal_pair_group", label: "Minimal pair group", type: "text", help: "Rows with the same group name are displayed together as one minimal pair set." },
      { name: "orthographic", label: "Orthographic form", type: "text" },
      { name: "phonemic", label: "Phonemic transcription", type: "text", half: true, placeholder: "/.../" },
      { name: "phonetic", label: "Phonetic transcription", type: "text", half: true, placeholder: "[...]" },
      { name: "translation", label: "Translation", type: "text" },
      { name: "ipa_symbol_id", label: "Illustrates IPA symbol", type: "relation", relation: { table: "ipa_symbols", labelField: "symbol" } },
      { name: "notes", label: "Notes", type: "textarea" },
      {
        name: "audio_url",
        label: "Audio",
        type: "file",
        file: { bucket: "dictionary-audio", isPublic: true, accept: AUDIO, maxMB: 10 },
      },
      published(),
    ],
  },
  {
    key: "syntax-trees",
    label: "Syntax trees",
    group: "Syntax and morphology",
    table: "syntax_trees",
    titleField: "title",
    columns: ["title", "is_published"],
    searchFields: ["title"],
    orderBy: ["created_at", false],
    description: "Build phrase-structure trees visually: add nodes, label constituents, drag to reposition and export as an image.",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "description", label: "Description or example sentence", type: "textarea" },
      { name: "tree_data", label: "Tree builder", type: "tree" },
      published(),
    ],
  },
  {
    key: "syntactic-examples",
    label: "Syntactic examples",
    group: "Syntax and morphology",
    table: "syntactic_examples",
    titleField: "sentence",
    columns: ["sentence", "language_id", "is_published"],
    searchFields: ["sentence", "translation"],
    orderBy: ["created_at", false],
    fields: [
      languageRel(),
      { name: "sentence", label: "Sentence", type: "text", required: true },
      { name: "translation", label: "Translation", type: "text" },
      { name: "phrase_structure", label: "Phrase structure (labelled bracketing)", type: "textarea", placeholder: "[S [NP ...] [VP ...]]" },
      { name: "constituency_analysis", label: "Constituency analysis", type: "textarea" },
      { name: "grammatical_relations", label: "Grammatical relations", type: "textarea" },
      { name: "word_order", label: "Word order pattern", type: "text", half: true, placeholder: "e.g. SVO" },
      { name: "clause_structure", label: "Clause structure", type: "text", half: true },
      { name: "transformation_notes", label: "Syntactic transformations", type: "textarea" },
      { name: "syntax_tree_id", label: "Syntax tree", type: "relation", relation: { table: "syntax_trees", labelField: "title" } },
      published(),
    ],
  },
  {
    key: "morphological-examples",
    label: "Morphological examples",
    group: "Syntax and morphology",
    table: "morphological_examples",
    titleField: "word",
    columns: ["word", "segmentation", "process_type", "is_published"],
    searchFields: ["word", "segmentation", "root"],
    orderBy: ["created_at", false],
    fields: [
      languageRel(),
      { name: "word", label: "Word", type: "text", required: true },
      { name: "segmentation", label: "Morpheme segmentation", type: "text", placeholder: "e.g. ev-ler-de", help: "Separate morphemes with hyphens." },
      { name: "root", label: "Root", type: "text", half: true },
      { name: "affixes", label: "Affixes", type: "text", half: true },
      { name: "process_type", label: "Morphological process", type: "select", required: true, default: "inflection", options: opts({ inflection: "Inflection", derivation: "Derivation", compounding: "Compounding", reduplication: "Reduplication", other: "Other" }) },
      { name: "translation", label: "Translation or gloss", type: "text" },
      { name: "description", label: "Word formation notes", type: "textarea" },
      published(),
    ],
  },
  {
    key: "interlinear-glosses",
    label: "Interlinear glosses",
    group: "Syntax and morphology",
    table: "interlinear_glosses",
    titleField: "source_text",
    columns: ["source_text", "free_translation", "language_id", "is_published"],
    searchFields: ["source_text", "free_translation"],
    orderBy: ["created_at", false],
    description: "Follow the Leipzig Glossing Rules. The segmentation line and the gloss line must have the same number of space-separated words.",
    fields: [
      languageRel(),
      { name: "source_text", label: "Original sentence", type: "text", required: true },
      { name: "segmentation", label: "Morpheme segmentation", type: "text", required: true, help: "Words separated by spaces, morphemes separated by hyphens." },
      { name: "gloss", label: "Gloss line", type: "text", required: true, help: "Same number of words as the segmentation line. Use capitals for grammatical labels, e.g. house-PL-LOC." },
      { name: "free_translation", label: "Free translation", type: "text", required: true },
      { name: "notes", label: "Grammatical notes", type: "textarea" },
      { name: "reference", label: "Source or reference", type: "text" },
      published(),
    ],
  },

  // ------------------------------------------------------------- Dictionary
  {
    key: "dictionary",
    label: "Dictionary entries",
    group: "Dictionary and corpus",
    table: "dictionary_entries",
    titleField: "headword",
    columns: ["headword", "translation", "part_of_speech", "language_id", "is_published"],
    searchFields: ["headword", "native_form", "translation"],
    orderBy: ["headword", true],
    description: "Only enter information you have verified. Nothing is auto-translated.",
    fields: [
      languageRel(true),
      { name: "headword", label: "Word or expression", type: "text", required: true, half: true },
      { name: "native_form", label: "Native-language form", type: "text", half: true },
      { name: "translation", label: "English translation", type: "text", required: true },
      { name: "phonetic", label: "Phonetic transcription", type: "text", half: true, placeholder: "[...]" },
      { name: "part_of_speech", label: "Part of speech", type: "text", half: true, placeholder: "noun, verb, adjective..." },
      { name: "grammatical_category", label: "Grammatical category", type: "text", half: true },
      { name: "dialect", label: "Dialect information", type: "text", half: true },
      { name: "definition", label: "Definition", type: "textarea" },
      { name: "morphology", label: "Morphological information", type: "text" },
      {
        name: "audio_url",
        label: "Pronunciation audio",
        type: "file",
        file: { bucket: "dictionary-audio", isPublic: true, accept: AUDIO, maxMB: 10 },
      },
      { name: "related_words", label: "Related words", type: "lines", help: "One per line." },
      { name: "usage_notes", label: "Usage notes", type: "textarea" },
      {
        name: "examples",
        label: "Example sentences",
        type: "children",
        child: {
          table: "dictionary_examples",
          fk: "entry_id",
          addLabel: "Add example",
          fields: [
            { name: "sentence", label: "Sentence", type: "text", required: true },
            { name: "translation", label: "Translation", type: "text" },
          ],
        },
      },
      published(),
    ],
  },
  {
    key: "corpus-collections",
    label: "Corpus collections",
    group: "Dictionary and corpus",
    table: "corpus_collections",
    titleField: "title",
    columns: ["title", "language_id", "allow_download", "is_published"],
    searchFields: ["title"],
    orderBy: ["created_at", false],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "URL slug", type: "text", isSlug: true, slugFrom: "title", help: "Leave blank to generate from the title." },
      languageRel(),
      { name: "description", label: "Description", type: "richtext" },
      { name: "license", label: "License or usage terms", type: "text" },
      {
        name: "dataset_path",
        label: "Downloadable dataset",
        type: "file",
        file: { bucket: "corpus-datasets", isPublic: false, accept: ["text/plain", "text/csv", "application/json", "application/zip", "application/pdf"], maxMB: 50 },
        help: "Stored privately. Visitors can download it only when downloads are allowed below.",
      },
      { name: "allow_download", label: "Allow public download of the dataset", type: "boolean", default: false },
      published(),
    ],
  },
  {
    key: "corpus-documents",
    label: "Corpus documents",
    group: "Dictionary and corpus",
    table: "corpus_documents",
    titleField: "title",
    columns: ["title", "collection_id", "is_public"],
    searchFields: ["title", "source"],
    orderBy: ["created_at", false],
    description: "Documents are shown publicly only when marked public AND their collection is published. Keep confidential fieldwork material private.",
    fields: [
      { name: "collection_id", label: "Collection", type: "relation", required: true, relation: { table: "corpus_collections", labelField: "title" } },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "source", label: "Source", type: "text" },
      { name: "content", label: "Text", type: "textarea", required: true, rows: 14 },
      { name: "is_public", label: "Public (visible on the website)", type: "boolean", default: false },
    ],
  },
  {
    key: "corpus-annotations",
    label: "Corpus annotations",
    group: "Dictionary and corpus",
    table: "corpus_annotations",
    titleField: "label",
    columns: ["label", "document_id", "start_offset", "end_offset"],
    searchFields: ["label", "note"],
    orderBy: ["created_at", false],
    description: "Offsets count characters from the start of the document text (the first character is 0).",
    fields: [
      { name: "document_id", label: "Document", type: "relation", required: true, relation: { table: "corpus_documents", labelField: "title" } },
      { name: "start_offset", label: "Start offset", type: "number", required: true, half: true },
      { name: "end_offset", label: "End offset", type: "number", required: true, half: true },
      { name: "label", label: "Label", type: "text", required: true, placeholder: "e.g. NOUN, ergative, tone-high" },
      { name: "note", label: "Note", type: "textarea" },
    ],
  },
  {
    key: "audio-recordings",
    label: "Audio recordings",
    group: "Audio",
    table: "audio_recordings",
    titleField: "title",
    columns: ["title", "language_id", "consent_status", "is_published"],
    searchFields: ["title", "speaker_label"],
    orderBy: ["created_at", false],
    description: "Recordings are stored privately. They are played publicly only when published AND consent is documented.",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      languageRel(),
      {
        name: "file_path",
        label: "Audio file",
        type: "file",
        required: true,
        file: { bucket: "linguistic-recordings", isPublic: false, accept: AUDIO, maxMB: 50 },
      },
      { name: "description", label: "Description", type: "textarea" },
      { name: "speaker_label", label: "Speaker label", type: "text", half: true, help: "Use a code such as S1. Do not enter names without consent." },
      { name: "duration_seconds", label: "Duration (seconds)", type: "number", step: "0.01", half: true },
      { name: "recorded_on", label: "Recording date", type: "date", half: true },
      { name: "location", label: "Recording location", type: "text", half: true },
      {
        name: "consent_status",
        label: "Consent status",
        type: "select",
        required: true,
        default: "pending",
        options: opts({ pending: "Pending", consent_given: "Consent given for public sharing", restricted: "Restricted (do not share)" }),
      },
      { name: "phonetic_transcription", label: "Phonetic transcription", type: "textarea" },
      { name: "orthographic_transcription", label: "Orthographic transcription", type: "textarea" },
      { name: "translation", label: "Translation", type: "textarea" },
      { name: "gloss_id", label: "Linked interlinear example", type: "relation", relation: { table: "interlinear_glosses", labelField: "source_text" } },
      published("Published (requires consent to be public)"),
    ],
  },

  // ------------------------------------------------------------------- Blog
  {
    key: "blog",
    label: "Blog articles",
    group: "Blog",
    table: "blog_posts",
    titleField: "title",
    columns: ["title", "status", "published_at", "category_id"],
    searchFields: ["title", "author_name"],
    orderBy: ["created_at", false],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "URL slug", type: "text", isSlug: true, slugFrom: "title", help: "Leave blank to generate from the title." },
      { name: "excerpt", label: "Excerpt", type: "textarea", rows: 3 },
      { name: "content", label: "Content", type: "richtext" },
      {
        name: "featured_image_url",
        label: "Featured image",
        type: "file",
        file: { bucket: "media-library", isPublic: true, accept: IMAGE, maxMB: 10 },
      },
      { name: "author_name", label: "Author", type: "text", half: true },
      { name: "category_id", label: "Category", type: "relation", half: true, relation: { table: "blog_categories", labelField: "name" } },
      {
        name: "tags_input",
        label: "Tags",
        type: "tags",
        help: "Separate tags with commas.",
        tags: { junction: "blog_post_tags", parentKey: "post_id", tagKey: "tag_id", tagTable: "blog_tags" },
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        default: "draft",
        half: true,
        options: opts({ draft: "Draft", published: "Published", scheduled: "Scheduled" }),
      },
      {
        name: "published_at",
        label: "Publish date and time",
        type: "datetime",
        half: true,
        help: "Required for scheduled posts. A scheduled post goes live automatically at this time.",
      },
      { name: "seo_title", label: "SEO title", type: "text" },
      { name: "seo_description", label: "SEO description", type: "textarea", rows: 2 },
      {
        name: "og_image_url",
        label: "Open Graph image",
        type: "file",
        file: { bucket: "media-library", isPublic: true, accept: IMAGE, maxMB: 5 },
      },
    ],
  },
  {
    key: "blog-categories",
    label: "Blog categories",
    group: "Blog",
    table: "blog_categories",
    titleField: "name",
    columns: ["name", "slug"],
    searchFields: ["name"],
    orderBy: ["name", true],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "URL slug", type: "text", isSlug: true, slugFrom: "name", help: "Leave blank to generate from the name." },
      { name: "description", label: "Description", type: "textarea" },
    ],
  },
  {
    key: "blog-tags",
    label: "Blog tags",
    group: "Blog",
    table: "blog_tags",
    titleField: "name",
    columns: ["name", "slug"],
    searchFields: ["name"],
    orderBy: ["name", true],
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "slug", label: "URL slug", type: "text", isSlug: true, slugFrom: "name", help: "Leave blank to generate from the name." },
    ],
  },

  // --------------------------------------------------------------- Teaching
  {
    key: "teaching",
    label: "Teaching and professional activity",
    group: "Teaching",
    table: "teaching_experience",
    titleField: "title",
    columns: ["title", "kind", "organization"],
    searchFields: ["title", "organization"],
    orderBy: ["sort_order", true],
    fields: [
      {
        name: "kind",
        label: "Type",
        type: "select",
        required: true,
        default: "appointment",
        options: opts({
          appointment: "Academic appointment",
          workshop: "Workshop",
          conference: "Conference",
          seminar: "Seminar",
          supervision: "Student supervision",
          certificate: "Certificate",
          professional_development: "Professional development",
        }),
      },
      { name: "title", label: "Title", type: "text", required: true },
      { name: "organization", label: "Organization", type: "text", half: true },
      { name: "location", label: "Location", type: "text", half: true },
      { name: "start_date", label: "Start date", type: "date", half: true },
      { name: "end_date", label: "End date", type: "date", half: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "url", label: "Link", type: "url" },
      { name: "sort_order", label: "Sort order", type: "number", default: 0 },
    ],
  },
  {
    key: "courses",
    label: "Courses",
    group: "Teaching",
    table: "courses",
    titleField: "title",
    columns: ["code", "title", "level", "is_published"],
    searchFields: ["title", "code"],
    orderBy: ["sort_order", true],
    fields: [
      { name: "code", label: "Course code", type: "text", half: true },
      { name: "title", label: "Title", type: "text", required: true, half: true },
      { name: "level", label: "Level", type: "text", half: true, placeholder: "Undergraduate, Postgraduate..." },
      { name: "institution", label: "Institution", type: "text", half: true },
      { name: "term", label: "Term or year", type: "text" },
      { name: "description", label: "Description", type: "textarea" },
      { name: "resources_url", label: "Teaching resources link", type: "url" },
      {
        name: "resource_file_url",
        label: "Teaching resource file (PDF)",
        type: "file",
        file: { bucket: "publication-documents", isPublic: true, accept: PDF, maxMB: 25 },
      },
      { name: "sort_order", label: "Sort order", type: "number", default: 0 },
      published("Published (visible on the public website)", true),
    ],
  },
  {
    key: "testimonials",
    label: "Testimonials",
    group: "Teaching",
    table: "testimonials",
    titleField: "author_name",
    columns: ["author_name", "author_role", "is_approved", "created_at"],
    searchFields: ["author_name", "content"],
    orderBy: ["created_at", false],
    description: "Submissions from the public form arrive unapproved. Tick Approved to show one on the site.",
    fields: [
      { name: "author_name", label: "Name", type: "text", required: true },
      { name: "author_role", label: "Role", type: "text", half: true },
      { name: "author_affiliation", label: "Affiliation", type: "text", half: true },
      { name: "content", label: "Testimonial", type: "textarea", required: true, rows: 5 },
      { name: "is_approved", label: "Approved (visible on the website)", type: "boolean", default: true },
    ],
  },

  // ------------------------------------------------------------ Newsletter
  {
    key: "newsletter-issues",
    label: "Newsletter issues",
    group: "Newsletter",
    table: "newsletter_issues",
    titleField: "subject",
    columns: ["subject", "status", "sent_at", "recipients_count"],
    searchFields: ["subject"],
    orderBy: ["created_at", false],
    fields: [
      { name: "subject", label: "Subject", type: "text", required: true },
      { name: "body", label: "Content", type: "richtext", required: true },
    ],
  },
  {
    key: "newsletter-subscribers",
    label: "Subscribers",
    group: "Newsletter",
    table: "newsletter_subscribers",
    titleField: "email",
    columns: ["email", "status", "confirmed_at", "created_at"],
    searchFields: ["email"],
    orderBy: ["created_at", false],
    description: "Visitors subscribe from the website and confirm by email. You can remove subscribers here.",
    fields: [
      { name: "email", label: "Email", type: "email", required: true },
      { name: "status", label: "Status", type: "select", required: true, default: "pending", options: opts({ pending: "Pending confirmation", confirmed: "Confirmed", unsubscribed: "Unsubscribed" }) },
    ],
  },

  // -------------------------------------------------------------------- SEO
  {
    key: "seo",
    label: "SEO and page metadata",
    group: "Site",
    table: "seo_pages",
    titleField: "path",
    columns: ["path", "title", "noindex"],
    searchFields: ["path", "title"],
    orderBy: ["path", true],
    description: "Override the title, description and social image for a page. The sitemap and robots.txt are generated automatically.",
    fields: [
      { name: "path", label: "Page path", type: "text", required: true, placeholder: "/about", help: "Must start with a slash, e.g. /, /about, /publications." },
      { name: "title", label: "Page title", type: "text" },
      { name: "description", label: "Meta description", type: "textarea", rows: 3 },
      {
        name: "og_image_url",
        label: "Open Graph image",
        type: "file",
        file: { bucket: "media-library", isPublic: true, accept: IMAGE, maxMB: 5 },
      },
      { name: "canonical_url", label: "Canonical URL", type: "url" },
      { name: "noindex", label: "Hide this page from search engines", type: "boolean", default: false },
    ],
  },
  {
    key: "website-settings",
    label: "Website settings",
    group: "Site",
    table: "website_settings",
    titleField: "site_name",
    columns: ["site_name"],
    searchFields: ["site_name"],
    orderBy: ["id", true],
    singleton: true,
    adminOnly: true,
    noCreate: true,
    description: "Website identity, contact details, academic profile links and privacy options.",
    fields: [
      { name: "site_name", label: "Website name", type: "text", required: true },
      { name: "tagline", label: "Tagline", type: "text" },
      { name: "institution", label: "Institutional affiliation", type: "text" },
      { name: "contact_email", label: "Contact email", type: "email", half: true },
      { name: "phone", label: "Phone", type: "text", half: true },
      { name: "address", label: "Address", type: "textarea", rows: 2 },
      { name: "logo_url", label: "Logo", type: "file", file: { bucket: "media-library", isPublic: true, accept: [...IMAGE, "image/svg+xml"], maxMB: 2 } },
      { name: "favicon_url", label: "Favicon", type: "file", file: { bucket: "media-library", isPublic: true, accept: [...IMAGE, "image/svg+xml"], maxMB: 1 } },
      { name: "google_scholar_url", label: "Google Scholar URL", type: "url", half: true },
      { name: "orcid_url", label: "ORCID URL", type: "url", half: true },
      { name: "researchgate_url", label: "ResearchGate URL", type: "url", half: true },
      { name: "academia_url", label: "Academia.edu URL", type: "url", half: true },
      { name: "linkedin_url", label: "LinkedIn URL", type: "url", half: true },
      { name: "github_url", label: "GitHub URL", type: "url", half: true },
      { name: "zenodo_url", label: "Zenodo URL", type: "url", half: true },
      { name: "twitter_url", label: "X / Twitter URL", type: "url", half: true },
      { name: "default_meta_title", label: "Default meta title", type: "text" },
      { name: "default_meta_description", label: "Default meta description", type: "textarea", rows: 2 },
      { name: "og_image_url", label: "Default Open Graph image", type: "file", file: { bucket: "media-library", isPublic: true, accept: IMAGE, maxMB: 5 } },
      { name: "noindex_site", label: "Hide the whole site from search engines", type: "boolean", default: false, help: "Useful while the site is still being prepared." },
      { name: "robots_extra", label: "Extra robots.txt lines", type: "textarea", rows: 3, help: "Optional, one directive per line, e.g. Disallow: /private" },
      { name: "show_email_publicly", label: "Show contact email on the contact page", type: "boolean", default: true },
      { name: "show_phone_publicly", label: "Show phone number on the contact page", type: "boolean", default: false },
      { name: "privacy_notice", label: "Privacy notice (shown beside forms)", type: "richtext" },
    ],
  },
  {
    key: "email-settings",
    label: "Email settings",
    group: "Site",
    table: "email_settings",
    titleField: "notify_email",
    columns: ["notify_email"],
    searchFields: ["notify_email"],
    orderBy: ["id", true],
    singleton: true,
    adminOnly: true,
    noCreate: true,
    description: "Where notifications are sent and which address emails are sent from. The Resend API key is set as an environment variable, never here.",
    fields: [
      { name: "notify_email", label: "Send admin notifications to", type: "email", help: "New contact messages and collaboration requests are emailed here." },
      { name: "from_email", label: "Send emails from", type: "text", help: "Must be on a domain verified in Resend, e.g. Name <hello@yourdomain.org>." },
      { name: "reply_to_email", label: "Reply-to address", type: "email" },
    ],
  },
];

export const RESOURCE_MAP: Record<string, Resource> = Object.fromEntries(RESOURCES.map((r) => [r.key, r]));

export function getResource(key: string): Resource | undefined {
  return RESOURCE_MAP[key];
}

export const NAV_GROUPS: { group: string; items: { key: string; label: string; adminOnly?: boolean }[] }[] = (() => {
  const order: string[] = [];
  const map = new Map<string, { key: string; label: string; adminOnly?: boolean }[]>();
  for (const r of RESOURCES) {
    if (!map.has(r.group)) {
      map.set(r.group, []);
      order.push(r.group);
    }
    map.get(r.group)!.push({ key: r.key, label: r.label, adminOnly: r.adminOnly });
  }
  return order.map((group) => ({ group, items: map.get(group)! }));
})();
