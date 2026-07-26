/**
 * Legacy RSS GUID format from the previous host's writing feed:
 * `siteId:collectionId:itemId`
 *
 * Kept so existing subscribers don't get a flood of "new" items after cutover.
 * Item IDs are embedded in archived post HTML as `id="item-…"`.
 */
const LEGACY_SITE_ID = '64729d819da3551e36816423';
const LEGACY_WRITING_COLLECTION_ID = '64729da89d055b774e23c0b0';

const ITEM_ID_RE = /\bid=["']item-([a-f0-9]+)["']/i;

/** Rebuild a stable legacy feed guid from archived post HTML, if present. */
export function legacyRssGuidFromArchivedBody(
  archivedBody: string | undefined
): string | undefined {
  if (!archivedBody) return undefined;
  const match = archivedBody.match(ITEM_ID_RE);
  if (!match?.[1]) return undefined;
  return `${LEGACY_SITE_ID}:${LEGACY_WRITING_COLLECTION_ID}:${match[1]}`;
}
