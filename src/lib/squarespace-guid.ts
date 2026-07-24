/** Squarespace writing-collection RSS GUID: siteId:collectionId:itemId */
const SQUARESPACE_SITE_ID = '64729d819da3551e36816423';
const SQUARESPACE_WRITING_COLLECTION_ID = '64729da89d055b774e23c0b0';

const ITEM_ID_RE = /id="item-([0-9a-f]+)"/i;

/** Rebuild the original Squarespace RSS guid from archived post HTML, if present. */
export function squarespaceGuidFromArchivedBody(archivedBody: string | undefined): string | undefined {
  if (!archivedBody) return undefined;
  const match = archivedBody.match(ITEM_ID_RE);
  if (!match) return undefined;
  return `${SQUARESPACE_SITE_ID}:${SQUARESPACE_WRITING_COLLECTION_ID}:${match[1]}`;
}
