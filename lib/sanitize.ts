import sanitizeHtml from "sanitize-html";

/** Allow-list sanitiser for rich text written in the admin editor. */
export function cleanHtml(html: string | null | undefined): string {
  if (!html) return "";
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "strong", "b", "em", "i", "u", "s", "h2", "h3", "h4", "ul", "ol", "li",
      "blockquote", "a", "code", "pre", "hr", "sub", "sup", "table", "thead", "tbody", "tr", "th", "td", "img",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https"] },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, rel: "noopener noreferrer", target: "_blank" },
      }),
    },
  });
}
