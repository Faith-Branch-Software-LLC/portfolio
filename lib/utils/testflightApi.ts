import { createPrivateKey, createSign } from 'crypto';

const BASE = 'https://api.appstoreconnect.apple.com/v1';

function makeJwt(issuerId: string, keyId: string, privateKey: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' })).toString(
    'base64url',
  );
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({
      iss: issuerId,
      iat: now,
      exp: now + 1200,
      aud: 'appstoreconnect-v1',
    }),
  ).toString('base64url');

  const data = `${header}.${payload}`;
  const normalizedKey = privateKey.replace(/\\n/g, '\n');
  const key = createPrivateKey(normalizedKey);
  const sign = createSign('SHA256');
  sign.update(data);
  const sig = sign.sign({ key, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return `${data}.${sig}`;
}

function authHeaders(issuerId: string, keyId: string, privateKey: string) {
  return {
    Authorization: `Bearer ${makeJwt(issuerId, keyId, privateKey)}`,
    'Content-Type': 'application/json',
  };
}

export interface TestFlightFeedback {
  id: string;
  attributes: {
    comment: string | null;
    createdDate: string;
    email: string | null;
    deviceModel: string | null;
    osVersion: string | null;
    locale: string | null;
    architecture: string | null;
    appPlatform: string | null;
    deviceFamily: string | null;
    buildBundleId: string | null;
    screenshots: { url: string; width: number; height: number; expirationDate: string }[];
  };
}

export async function probeFeedbackPath(
  issuerId: string,
  keyId: string,
  privateKey: string,
  appId: string,
): Promise<{ path: string; status: number; body: string }[]> {
  const h = authHeaders(issuerId, keyId, privateKey);
  const results: { path: string; status: number; body: string }[] = [];

  const buildsRes = await fetch(
    `${BASE}/builds?filter[app]=${appId}&sort=-uploadedDate&limit=3&fields[builds]=uploadedDate`,
    { headers: h },
  );
  const buildsBody = await buildsRes.text();
  results.push({ path: `builds?filter[app]=${appId}`, status: buildsRes.status, body: buildsBody.slice(0, 400) });

  if (buildsRes.ok) {
    const buildsJson: { data: { id: string }[] } = JSON.parse(buildsBody);
    for (const build of buildsJson.data.slice(0, 2)) {
      const fbRes = await fetch(`${BASE}/builds/${build.id}/betaFeedback?limit=5`, { headers: h });
      const fbBody = await fbRes.text();
      results.push({ path: `builds/${build.id}/betaFeedback`, status: fbRes.status, body: fbBody.slice(0, 400) });
    }
  }

  const appFbRes = await fetch(`${BASE}/apps/${appId}/betaFeedbackScreenshotSubmissions?limit=2`, { headers: h });
  const appFbBody = await appFbRes.text();
  results.push({ path: `apps/${appId}/betaFeedbackScreenshotSubmissions`, status: appFbRes.status, body: appFbBody.slice(0, 600) });

  if (appFbRes.ok) {
    const fbJson: { data: { id: string }[] } = JSON.parse(appFbBody);
    const firstId = fbJson.data[0]?.id;
    if (firstId) {
      const singleRes = await fetch(`${BASE}/betaFeedbackScreenshotSubmissions/${firstId}`, { headers: h });
      results.push({ path: `betaFeedbackScreenshotSubmissions/${firstId}`, status: singleRes.status, body: (await singleRes.text()).slice(0, 3000) });

      const screenshotRes = await fetch(`${BASE}/betaFeedbackScreenshotSubmissions/${firstId}/screenshot`, { headers: h });
      results.push({ path: `betaFeedbackScreenshotSubmissions/${firstId}/screenshot`, status: screenshotRes.status, body: (await screenshotRes.text()).slice(0, 800) });
    }
  }

  return results;
}

export async function listFeedback(
  issuerId: string,
  keyId: string,
  privateKey: string,
  appId: string,
): Promise<TestFlightFeedback[]> {
  const h = authHeaders(issuerId, keyId, privateKey);
  const all: TestFlightFeedback[] = [];
  let url: string | null = `${BASE}/apps/${appId}/betaFeedbackScreenshotSubmissions?limit=200`;

  while (url) {
    const fetchRes: Response = await fetch(url, { headers: h });
    if (!fetchRes.ok) {
      const body: string = await fetchRes.text();
      throw new Error(`TestFlight feedback fetch failed ${fetchRes.status}: ${body}`);
    }
    const json: { data: TestFlightFeedback[]; links?: { next?: string } } = await fetchRes.json();
    all.push(...(json.data ?? []));
    url = json.links?.next ?? null;
  }
  return all;
}

export async function deleteFeedback(
  issuerId: string,
  keyId: string,
  privateKey: string,
  feedbackId: string,
): Promise<void> {
  const res = await fetch(`${BASE}/betaFeedbackScreenshotSubmissions/${feedbackId}`, {
    method: 'DELETE',
    headers: authHeaders(issuerId, keyId, privateKey),
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`TestFlight deleteFeedback failed: ${res.status}`);
  }
}
