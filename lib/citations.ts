import type { Row } from "@/lib/utils";

export interface Author {
  given_names?: string | null;
  family_name: string;
}

export type CitationStyle = "apa" | "mla" | "chicago" | "bibtex";

function initials(given?: string | null): string {
  if (!given) return "";
  return given
    .split(/[\s]+/)
    .filter(Boolean)
    .map((part) =>
      part
        .split("-")
        .map((p) => p.charAt(0).toUpperCase() + ".")
        .join("-")
    )
    .join(" ");
}

function year(date?: string | null): string {
  if (!date) return "n.d.";
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? "n.d." : String(d.getUTCFullYear());
}

function doiUrl(doi?: string | null): string {
  if (!doi) return "";
  return /^https?:\/\//i.test(doi) ? doi : `https://doi.org/${doi.replace(/^doi:\s*/i, "")}`;
}

function endWithPeriod(text: string): string {
  const t = text.trim();
  return /[.?!]$/.test(t) ? t : t + ".";
}

function apaAuthors(authors: Author[]): string {
  const names = authors.map((a) => `${a.family_name}${a.given_names ? ", " + initials(a.given_names) : ""}`);
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]}, & ${names[1]}`;
  if (names.length <= 20) return `${names.slice(0, -1).join(", ")}, & ${names[names.length - 1]}`;
  return `${names.slice(0, 19).join(", ")}, … ${names[names.length - 1]}`;
}

function fullGiven(a: Author): string {
  return `${a.given_names ?? ""} ${a.family_name}`.trim();
}

function mlaAuthors(authors: Author[]): string {
  if (authors.length === 0) return "";
  const first = authors[0];
  const firstName = `${first.family_name}${first.given_names ? ", " + first.given_names : ""}`;
  if (authors.length === 1) return firstName;
  if (authors.length === 2) return `${firstName}, and ${fullGiven(authors[1])}`;
  return `${firstName}, et al`;
}

function chicagoAuthors(authors: Author[]): string {
  if (authors.length === 0) return "";
  const first = authors[0];
  const firstName = `${first.family_name}${first.given_names ? ", " + first.given_names : ""}`;
  if (authors.length === 1) return firstName;
  const rest = authors.slice(1).map(fullGiven);
  if (rest.length === 1) return `${firstName}, and ${rest[0]}`;
  return `${firstName}, ${rest.slice(0, -1).join(", ")}, and ${rest[rest.length - 1]}`;
}

function sentenceCase(title: string): string {
  return title.trim();
}

export function formatCitation(pub: Row, authors: Author[], style: CitationStyle): string {
  if (style === "apa" && pub.citation_override) return pub.citation_override;

  const title = sentenceCase(pub.title ?? "");
  const y = year(pub.publication_date);
  const venue: string = pub.venue ?? "";
  const link = doiUrl(pub.doi) || pub.url || "";
  const type: string = pub.publication_type;

  if (style === "bibtex") {
    const key =
      `${(authors[0]?.family_name ?? "anon").toLowerCase().replace(/[^a-z]/g, "")}${y === "n.d." ? "" : y}` || "entry";
    const bibType =
      type === "journal_article"
        ? "article"
        : type === "book"
          ? "book"
          : type === "book_chapter"
            ? "incollection"
            : type === "conference_paper"
              ? "inproceedings"
              : type === "dissertation"
                ? "phdthesis"
                : type === "thesis"
                  ? "mastersthesis"
                  : "techreport";
    const lines: string[] = [];
    if (authors.length) lines.push(`  author = {${authors.map((a) => `${a.family_name}${a.given_names ? ", " + a.given_names : ""}`).join(" and ")}}`);
    lines.push(`  title = {${title}}`);
    if (venue) {
      const field = bibType === "article" ? "journal" : bibType === "inproceedings" || bibType === "incollection" ? "booktitle" : bibType === "book" ? "publisher" : "institution";
      lines.push(`  ${field} = {${venue}}`);
    }
    if (y !== "n.d.") lines.push(`  year = {${y}}`);
    if (pub.volume) lines.push(`  volume = {${pub.volume}}`);
    if (pub.issue) lines.push(`  number = {${pub.issue}}`);
    if (pub.pages) lines.push(`  pages = {${String(pub.pages).replace("-", "--")}}`);
    if (pub.doi) lines.push(`  doi = {${String(pub.doi).replace(/^https?:\/\/(dx\.)?doi\.org\//, "")}}`);
    if (pub.url) lines.push(`  url = {${pub.url}}`);
    return `@${bibType}{${key},\n${lines.join(",\n")}\n}`;
  }

  if (style === "apa") {
    const a = apaAuthors(authors);
    const lead = a ? `${endWithPeriod(a)} (${y}). ` : `${title}. (${y}). `;
    const titlePart = a ? `${endWithPeriod(title)} ` : "";
    let source = "";
    if (type === "journal_article") {
      source = venue ? `${venue}` : "";
      if (pub.volume) source += `, ${pub.volume}`;
      if (pub.issue) source += `(${pub.issue})`;
      if (pub.pages) source += `, ${pub.pages}`;
      source = source ? source + ". " : "";
    } else if (type === "book_chapter" || type === "conference_paper") {
      source = venue ? `In ${venue}${pub.pages ? ` (pp. ${pub.pages})` : ""}. ` : "";
    } else if (type === "dissertation" || type === "thesis") {
      source = `${type === "dissertation" ? "Doctoral dissertation" : "Master's thesis"}${venue ? `, ${venue}` : ""}. `;
    } else {
      source = venue ? `${venue}. ` : "";
    }
    return `${lead}${titlePart}${source}${link}`.replace(/\s+/g, " ").trim();
  }

  if (style === "mla") {
    const a = mlaAuthors(authors);
    let out = a ? `${endWithPeriod(a)} ` : "";
    if (type === "journal_article") {
      out += `"${endWithPeriod(title)}" ${venue}`;
      if (pub.volume) out += `, vol. ${pub.volume}`;
      if (pub.issue) out += `, no. ${pub.issue}`;
      out += `, ${y}`;
      if (pub.pages) out += `, pp. ${pub.pages}`;
      out += ".";
    } else if (type === "book_chapter" || type === "conference_paper") {
      out += `"${endWithPeriod(title)}" ${venue}, ${y}${pub.pages ? `, pp. ${pub.pages}` : ""}.`;
    } else {
      out += `${endWithPeriod(title)} ${venue ? venue + ", " : ""}${y}.`;
    }
    if (link) out += ` ${link}.`;
    return out.replace(/\s+/g, " ").trim();
  }

  // chicago (author-date)
  const a = chicagoAuthors(authors);
  let out = a ? `${endWithPeriod(a)} ` : "";
  out += `${y}. `;
  if (type === "journal_article") {
    out += `"${endWithPeriod(title)}" ${venue}`;
    if (pub.volume) out += ` ${pub.volume}`;
    if (pub.issue) out += ` (${pub.issue})`;
    if (pub.pages) out += `: ${pub.pages}`;
    out += ".";
  } else if (type === "book_chapter" || type === "conference_paper") {
    out += `"${endWithPeriod(title)}" In ${venue}${pub.pages ? `, ${pub.pages}` : ""}.`;
  } else {
    out += `${endWithPeriod(title)}${venue ? ` ${endWithPeriod(venue)}` : ""}`;
  }
  if (link) out += ` ${link}.`;
  return out.replace(/\s+/g, " ").trim();
}

export function authorLine(authors: Author[]): string {
  return authors.map((a) => `${a.given_names ? a.given_names + " " : ""}${a.family_name}`).join(", ");
}
