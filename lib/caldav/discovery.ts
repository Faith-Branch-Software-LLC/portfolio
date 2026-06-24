function extractHref(xml: string, afterTag: string): string | null {
  const tagRe = new RegExp(`<[^>]*${afterTag}[^>]*>[\\s\\S]*?<[^>]*href[^>]*>([^<]+)<\\/[^>]*href>`, 'i');
  return xml.match(tagRe)?.[1]?.trim() ?? null;
}

async function resolveWellKnown(serverUrl: string, auth: string): Promise<string> {
  const base = serverUrl.replace(/\/$/, '');
  try {
    const res = await fetch(`${base}/.well-known/caldav`, {
      method: 'PROPFIND',
      headers: { Authorization: auth, Depth: '0', 'Content-Type': 'application/xml; charset=utf-8' },
      body: `<?xml version="1.0"?><D:propfind xmlns:D="DAV:"><D:prop><D:resourcetype/></D:prop></D:propfind>`,
      redirect: 'manual',
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (loc) return new URL(loc, base).toString().replace(/\/$/, '');
    }
  } catch {}
  return base;
}

async function getPrincipal(serverUrl: string, resolvedUrl: string, auth: string, debug: string[]): Promise<string | null> {
  const body = `<?xml version="1.0"?><D:propfind xmlns:D="DAV:"><D:prop><D:current-user-principal/></D:prop></D:propfind>`;
  for (const url of [resolvedUrl, resolvedUrl + '/', serverUrl.replace(/\/$/, '') + '/.well-known/caldav']) {
    try {
      const res = await fetch(url, { method: 'PROPFIND', headers: { Authorization: auth, Depth: '0', 'Content-Type': 'application/xml; charset=utf-8' }, body, redirect: 'follow' });
      const text = await res.text();
      debug.push(`principal_try: ${url} → ${res.status}`);
      if (!res.ok) continue;
      const href = extractHref(text, 'current-user-principal');
      if (!href) continue;
      return new URL(href, url).toString();
    } catch (e) { debug.push(`principal_err: ${String(e)}`); }
  }
  return null;
}

async function getCalendarHome(principalUrl: string, auth: string, debug: string[]): Promise<string | null> {
  try {
    const res = await fetch(principalUrl, {
      method: 'PROPFIND',
      headers: { Authorization: auth, Depth: '0', 'Content-Type': 'application/xml; charset=utf-8' },
      body: `<?xml version="1.0"?><D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav"><D:prop><C:calendar-home-set/></D:prop></D:propfind>`,
      redirect: 'follow',
    });
    const text = await res.text();
    debug.push(`home_raw: ${text.slice(0, 400)}`);
    if (!res.ok) return null;
    const href = extractHref(text, 'calendar-home-set');
    return href ? new URL(href, principalUrl).toString() : null;
  } catch { return null; }
}

export async function listCalendars(homeUrl: string, auth: string, debug: string[]): Promise<{ url: string; name: string }[]> {
  try {
    const res = await fetch(homeUrl, {
      method: 'PROPFIND',
      headers: { Authorization: auth, Depth: '1', 'Content-Type': 'application/xml; charset=utf-8' },
      body: `<?xml version="1.0"?><D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav"><D:prop><D:resourcetype/><D:displayname/></D:prop></D:propfind>`,
      redirect: 'follow',
    });
    if (!res.ok) return [{ url: homeUrl, name: 'Calendar' }];
    const text = await res.text();
    debug.push(`callist_raw: ${text.slice(0, 1500)}`);

    const blocks = text.match(/<[^:>]*:?response[^>]*>[\s\S]*?<\/[^:>]*:?response>/gi) ?? [];
    const results: { url: string; name: string }[] = [];

    for (const block of blocks) {
      if (!/calendar/i.test(block)) continue;
      if (/\/(inbox|outbox|notification|dropbox|tasks)\/?</i.test(block)) continue;
      const hrefMatch = block.match(/<[^:>]*:?href[^>]*>([^<]+)<\/[^:>]*:?href>/i);
      if (!hrefMatch) continue;
      const fullUrl = new URL(hrefMatch[1].trim(), homeUrl).toString();
      const nameMatch = block.match(/<[^:>]*:?displayname[^>]*>([^<]*)<\/[^:>]*:?displayname>/i);
      const name = nameMatch?.[1]?.trim() || fullUrl.split('/').filter(Boolean).pop() || 'Calendar';
      results.push({ url: fullUrl, name });
    }

    debug.push(`found_calendars: ${results.map((c) => c.name).join(', ')}`);
    return results.length > 0 ? results : [{ url: homeUrl, name: 'Calendar' }];
  } catch (e) { debug.push(`callist_err: ${String(e)}`); return [{ url: homeUrl, name: 'Calendar' }]; }
}

export async function discoverCalendars(serverUrl: string, auth: string, debug: string[]): Promise<{ url: string; name: string }[]> {
  const resolved = await resolveWellKnown(serverUrl, auth);
  debug.push(`resolved: ${resolved}`);
  const principal = await getPrincipal(serverUrl, resolved, auth, debug);
  debug.push(`principal: ${principal}`);
  if (!principal) return [];
  const home = await getCalendarHome(principal, auth, debug);
  debug.push(`home: ${home}`);
  if (!home) return [];
  return listCalendars(home, auth, debug);
}
