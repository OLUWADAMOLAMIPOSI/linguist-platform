import "server-only";
import { readingMinutes } from "@/lib/utils";

/**
 * Module specific rules applied after generic validation and before the row is written.
 * Return an error string to stop the save, or the (possibly adjusted) values.
 */
export function beforeSave(
  resourceKey: string,
  values: Record<string, unknown>
): { values: Record<string, unknown>; error?: string } {
  const v = { ...values };

  switch (resourceKey) {
    case "blog": {
      const status = v.status as string;
      if (status === "published" && !v.published_at) v.published_at = new Date().toISOString();
      if (status === "scheduled" && !v.published_at) {
        return { values: v, error: "Scheduled posts need a publish date and time." };
      }
      v.reading_minutes = readingMinutes(v.content as string | null);
      break;
    }
    case "interlinear-glosses": {
      const seg = String(v.segmentation ?? "").trim().split(/\s+/).filter(Boolean);
      const gloss = String(v.gloss ?? "").trim().split(/\s+/).filter(Boolean);
      if (seg.length !== gloss.length) {
        return {
          values: v,
          error: `The segmentation line has ${seg.length} word(s) but the gloss line has ${gloss.length}. Leipzig glossing needs one gloss word for each word.`,
        };
      }
      const segMorphs = seg.map((w) => w.split("-").length);
      const glossMorphs = gloss.map((w) => w.split("-").length);
      const mismatch = segMorphs.findIndex((n, i) => n !== glossMorphs[i]);
      if (mismatch !== -1) {
        return {
          values: v,
          error: `Word ${mismatch + 1} ("${seg[mismatch]}") has ${segMorphs[mismatch]} morpheme(s) but its gloss ("${gloss[mismatch]}") has ${glossMorphs[mismatch]}. Morphemes and glosses must line up.`,
        };
      }
      break;
    }
    case "seo": {
      if (!String(v.path ?? "").startsWith("/")) return { values: v, error: "The page path must start with a slash, for example /about." };
      break;
    }
    case "corpus-annotations": {
      if (Number(v.end_offset) <= Number(v.start_offset)) {
        return { values: v, error: "The end offset must be greater than the start offset." };
      }
      break;
    }
    case "languages": {
      const hasLat = v.latitude !== null && v.latitude !== undefined;
      const hasLng = v.longitude !== null && v.longitude !== undefined;
      if (hasLat !== hasLng) return { values: v, error: "Enter both latitude and longitude, or leave both empty." };
      if (hasLat && (Number(v.latitude) < -90 || Number(v.latitude) > 90)) return { values: v, error: "Latitude must be between -90 and 90." };
      if (hasLng && (Number(v.longitude) < -180 || Number(v.longitude) > 180)) return { values: v, error: "Longitude must be between -180 and 180." };
      break;
    }
    case "audio-recordings": {
      if (v.is_published && v.consent_status !== "consent_given") {
        // Allowed to save, but it will not be visible publicly until consent is documented.
      }
      break;
    }
    default:
      break;
  }
  return { values: v };
}
