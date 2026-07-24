/**
 * Serve the RSS feed at the old Squarespace URL so existing subscribers
 * keep working after cutover without changing their feed URL.
 * /writing?format=rss → body of /rss.xml (URL unchanged)
 */
export async function onRequestGet(context) {
  const url = new URL(context.request.url);

  if (url.searchParams.get('format') === 'rss') {
    return context.env.ASSETS.fetch(new URL('/rss.xml', url));
  }

  return context.next();
}
