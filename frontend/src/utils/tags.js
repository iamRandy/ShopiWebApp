// Builds a slug -> label lookup from the canonical tags collection, shared by
// the card views, product modal, and filter modal so each doesn't recompute it.
export function buildTagLabelLookup(canonicalTags = []) {
  return new Map(canonicalTags.map((t) => [t.slug, t.label]));
}

export function resolveTagLabel(tagValue, tagLabelBySlug) {
  return tagLabelBySlug?.get(tagValue) || tagValue;
}
