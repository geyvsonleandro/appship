#!/usr/bin/env node
// asc.mjs - ajudante da API do App Store Connect. Node 18+, sem dependencias.
// Credenciais: .assinaturas/apple.json { "keyId", "issuerId", "keyPath" }
// ou variaveis ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_PATH.
// Este arquivo e um ponto de partida: se a Apple responder erro de formato,
// leia a mensagem, confira a documentacao e ajuste o script.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.ASC_BASE_URL || 'https://api.appstoreconnect.apple.com';
const log = (...a) => console.error(...a);

function loadCreds() {
  let c = {};
  const f = path.resolve('.assinaturas/apple.json');
  if (fs.existsSync(f)) c = JSON.parse(fs.readFileSync(f, 'utf8'));
  const keyId = process.env.ASC_KEY_ID || c.keyId;
  const issuerId = process.env.ASC_ISSUER_ID || c.issuerId;
  const keyPath = process.env.ASC_KEY_PATH || c.keyPath;
  if (!keyId || !issuerId || !keyPath)
    throw new Error('Credenciais ausentes. Crie .assinaturas/apple.json com keyId, issuerId e keyPath (caminho do AuthKey_XXXX.p8).');
  if (!fs.existsSync(keyPath)) throw new Error(`Arquivo .p8 nao encontrado: ${keyPath}`);
  return { keyId, issuerId, key: fs.readFileSync(keyPath, 'utf8') };
}

let cached = { token: null, at: 0 };
function token() {
  const now = Math.floor(Date.now() / 1000);
  if (cached.token && now - cached.at < 600) return cached.token;
  const { keyId, issuerId, key } = loadCreds();
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const head = b64({ alg: 'ES256', kid: keyId, typ: 'JWT' });
  const body = b64({ iss: issuerId, iat: now, exp: now + 900, aud: 'appstoreconnect-v1' });
  const sig = crypto.sign('sha256', Buffer.from(`${head}.${body}`), { key, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  cached = { token: `${head}.${body}.${sig}`, at: now };
  return cached.token;
}

class ApiError extends Error {
  constructor(status, method, url, payload) {
    const errs = payload?.errors?.map((e) => `${e.code}: ${e.title}. ${e.detail || ''}`).join(' | ');
    super(`${method} ${url} -> ${status} ${errs || JSON.stringify(payload).slice(0, 500)}`);
    this.status = status; this.payload = payload;
  }
}

async function api(method, p, body) {
  // Git Bash no Windows troca "/v1/..." por "C:/Program Files/Git/v1/...". Desfaz isso.
  const m = !p.startsWith('http') && p.match(/^[A-Za-z]:[\\/].*?([\\/]v\d+[\\/].*)$/);
  if (m) p = m[1].replace(/\\/g, '/');
  const url = p.startsWith('http') ? p : BASE + p;
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token()}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if ((res.status === 429 || res.status >= 500) && attempt < 5) {
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
      continue;
    }
    const text = await res.text();
    const json = text ? safeJson(text) : null;
    if (!res.ok) throw new ApiError(res.status, method, url, json ?? text);
    return json;
  }
}
const safeJson = (t) => { try { return JSON.parse(t); } catch { return { raw: t }; } };

async function all(p) {
  const data = [], included = [];
  let next = p;
  while (next) {
    const r = await api('GET', next);
    data.push(...(Array.isArray(r.data) ? r.data : [r.data]));
    if (r.included) included.push(...r.included);
    next = r.links?.next || null;
  }
  return { data, included };
}

async function pool(items, n, fn) {
  const out = []; let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}

const rel = (type, id) => ({ data: { type, id } });

async function findApp(bundleId) {
  const { data } = await all(`/v1/apps?filter[bundleId]=${encodeURIComponent(bundleId)}&limit=50`);
  const app = data.find((a) => a.attributes.bundleId === bundleId);
  if (!app) throw new Error(`App com bundle ${bundleId} nao existe no App Store Connect. Ele e criado no primeiro "eas submit" ou manualmente em Apps > + > Novo app.`);
  return app;
}

// ---------- comandos ----------

async function cmdCheck() {
  const { data } = await all('/v1/apps?limit=200');
  log(`Chave valida. ${data.length} app(s) na conta:`);
  for (const a of data) console.log(`${a.id}\t${a.attributes.bundleId}\t${a.attributes.name}`);
}

async function cmdRequest([method, p, ...rest]) {
  if (!method || !p) throw new Error('Uso: request <GET|POST|PATCH|DELETE> <caminho> [--body arquivo.json] [--all]');
  const bi = rest.indexOf('--body');
  const body = bi >= 0 ? JSON.parse(fs.readFileSync(rest[bi + 1], 'utf8')) : undefined;
  const r = rest.includes('--all') ? await all(p) : await api(method.toUpperCase(), p, body);
  console.log(JSON.stringify(r, null, 2));
}

async function ensureGroup(app, g) {
  const { data } = await all(`/v1/apps/${app.id}/subscriptionGroups?limit=200`);
  let group = data.find((x) => x.attributes.referenceName === g.referenceName);
  if (group) log(`= grupo "${g.referenceName}" ja existe (${group.id})`);
  else {
    group = (await api('POST', '/v1/subscriptionGroups', { data: { type: 'subscriptionGroups', attributes: { referenceName: g.referenceName }, relationships: { app: rel('apps', app.id) } } })).data;
    log(`+ grupo "${g.referenceName}" criado (${group.id})`);
  }
  const locs = (await all(`/v1/subscriptionGroups/${group.id}/subscriptionGroupLocalizations?limit=200`)).data;
  for (const l of g.localizations || []) {
    if (locs.some((x) => x.attributes.locale === l.locale)) { log(`= nome do grupo em ${l.locale} ja existe`); continue; }
    await api('POST', '/v1/subscriptionGroupLocalizations', { data: { type: 'subscriptionGroupLocalizations', attributes: { name: l.name, locale: l.locale, ...(l.customAppName ? { customAppName: l.customAppName } : {}) }, relationships: { subscriptionGroup: rel('subscriptionGroups', group.id) } } });
    log(`+ nome do grupo em ${l.locale}: "${l.name}"`);
  }
  return group;
}

async function ensureSubscription(group, s) {
  const { data } = await all(`/v1/subscriptionGroups/${group.id}/subscriptions?limit=200`);
  let sub = data.find((x) => x.attributes.productId === s.productId);
  if (sub) log(`= assinatura ${s.productId} ja existe (${sub.id}, ${sub.attributes.state})`);
  else {
    sub = (await api('POST', '/v1/subscriptions', { data: { type: 'subscriptions', attributes: { name: s.referenceName, productId: s.productId, subscriptionPeriod: s.period, familySharable: false, ...(s.groupLevel ? { groupLevel: s.groupLevel } : {}), ...(s.reviewNote ? { reviewNote: s.reviewNote } : {}) }, relationships: { group: rel('subscriptionGroups', group.id) } } })).data;
    log(`+ assinatura ${s.productId} criada (${sub.id})`);
  }
  const locs = (await all(`/v1/subscriptions/${sub.id}/subscriptionLocalizations?limit=200`)).data;
  for (const l of s.localizations || []) {
    if (locs.some((x) => x.attributes.locale === l.locale)) { log(`  = texto em ${l.locale} ja existe`); continue; }
    await api('POST', '/v1/subscriptionLocalizations', { data: { type: 'subscriptionLocalizations', attributes: { name: l.name, locale: l.locale, description: l.description }, relationships: { subscription: rel('subscriptions', sub.id) } } });
    log(`  + texto em ${l.locale}: "${l.name}"`);
  }
  return sub;
}

async function ensureAvailability(sub, territories) {
  try {
    const r = await api('GET', `/v1/subscriptions/${sub.id}/subscriptionAvailability`);
    if (r?.data) { log('  = disponibilidade ja configurada'); return; }
  } catch (e) { if (e.status !== 404) throw e; }
  await api('POST', '/v1/subscriptionAvailabilities', { data: { type: 'subscriptionAvailabilities', attributes: { availableInNewTerritories: true }, relationships: { subscription: rel('subscriptions', sub.id), availableTerritories: { data: territories.map((t) => ({ type: 'territories', id: t })) } } } });
  log(`  + disponivel em ${territories.length} paises`);
}

async function postPrice(sub, pricePointId) {
  return api('POST', '/v1/subscriptionPrices', { data: { type: 'subscriptionPrices', attributes: {}, relationships: { subscription: rel('subscriptions', sub.id), subscriptionPricePoint: rel('subscriptionPricePoints', pricePointId) } } });
}

async function ensurePrices(sub, baseTerritory, price) {
  const existing = await all(`/v1/subscriptions/${sub.id}/prices?include=territory&limit=200`);
  const have = new Set(existing.data.map((p) => p.relationships?.territory?.data?.id).filter(Boolean));
  const pts = (await all(`/v1/subscriptions/${sub.id}/pricePoints?filter[territory]=${baseTerritory}&limit=200`)).data;
  const want = Number(price);
  const pt = pts.find((p) => Math.abs(Number(p.attributes.customerPrice) - want) < 0.005);
  if (!pt) {
    const near = pts.map((p) => Number(p.attributes.customerPrice)).sort((a, b) => Math.abs(a - want) - Math.abs(b - want)).slice(0, 6).sort((a, b) => a - b);
    throw new Error(`A Apple nao tem o preco ${price} em ${baseTerritory}. Mais proximos: ${near.join(', ')}. Pergunte ao usuario qual usar.`);
  }
  if (!have.has(baseTerritory)) { await postPrice(sub, pt.id); log(`  + preco base ${price} em ${baseTerritory}`); }
  else log(`  = preco em ${baseTerritory} ja existe`);
  const eq = (await all(`/v1/subscriptionPricePoints/${pt.id}/equalizations?include=territory&limit=200`)).data
    .filter((p) => { const t = p.relationships?.territory?.data?.id; return t && t !== baseTerritory && !have.has(t); });
  let ok = 0; const fails = [];
  await pool(eq, 4, async (p) => {
    try { await postPrice(sub, p.id); ok++; } catch (e) { fails.push(`${p.relationships.territory.data.id}: ${e.message}`); }
  });
  log(`  + preco equivalente em ${ok} outros paises${fails.length ? `, ${fails.length} falharam` : ''}`);
  if (fails.length) log('    falhas (mostre ao usuario se forem muitas):\n    ' + fails.slice(0, 5).join('\n    '));
}

async function ensureFreeTrial(sub, duration, territories) {
  const existing = await all(`/v1/subscriptions/${sub.id}/introductoryOffers?include=territory&limit=200`);
  const have = new Set(existing.data.map((o) => o.relationships?.territory?.data?.id).filter(Boolean));
  const todo = territories.filter((t) => !have.has(t));
  if (!todo.length) { log('  = teste gratis ja configurado em todos os paises'); return; }
  let ok = 0; const fails = [];
  await pool(todo, 4, async (t) => {
    try {
      await api('POST', '/v1/subscriptionIntroductoryOffers', { data: { type: 'subscriptionIntroductoryOffers', attributes: { duration, offerMode: 'FREE_TRIAL', numberOfPeriods: 1 }, relationships: { subscription: rel('subscriptions', sub.id), territory: rel('territories', t) } } });
      ok++;
    } catch (e) { fails.push(`${t}: ${e.message}`); }
  });
  log(`  + teste gratis (${duration}) em ${ok} paises${fails.length ? `, ${fails.length} falharam` : ''}`);
  if (fails.length) log('    falhas:\n    ' + fails.slice(0, 5).join('\n    '));
}

async function cmdSubSetup([specFile]) {
  if (!specFile) throw new Error('Uso: sub-setup <spec.json>');
  const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
  const app = await findApp(spec.bundleId);
  log(`App: ${app.attributes.name} (${app.id})`);
  const territories = (await all('/v1/territories?limit=200')).data.map((t) => t.id);
  const group = await ensureGroup(app, spec.group);
  const result = { appId: app.id, groupId: group.id, subscriptions: [] };
  for (const s of spec.subscriptions) {
    const sub = await ensureSubscription(group, s);
    await ensureAvailability(sub, territories);
    await ensurePrices(sub, spec.baseTerritory || 'BRA', s.price);
    if (s.freeTrial) await ensureFreeTrial(sub, s.freeTrial, territories);
    const fresh = (await api('GET', `/v1/subscriptions/${sub.id}`)).data;
    log(`  estado final: ${fresh.attributes.state}`);
    result.subscriptions.push({ id: sub.id, productId: s.productId, state: fresh.attributes.state });
  }
  console.log(JSON.stringify(result, null, 2));
}

async function cmdSubStatus([bundleId]) {
  if (!bundleId) throw new Error('Uso: sub-status <bundleId>');
  const app = await findApp(bundleId);
  const groups = (await all(`/v1/apps/${app.id}/subscriptionGroups?limit=200`)).data;
  const out = { appId: app.id, name: app.attributes.name, groups: [] };
  for (const g of groups) {
    const subs = (await all(`/v1/subscriptionGroups/${g.id}/subscriptions?limit=200`)).data;
    const list = [];
    for (const s of subs) {
      const prices = (await all(`/v1/subscriptions/${s.id}/prices?limit=200`)).data.length;
      const offers = (await all(`/v1/subscriptions/${s.id}/introductoryOffers?limit=200`)).data.length;
      const locs = (await all(`/v1/subscriptions/${s.id}/subscriptionLocalizations?limit=200`)).data.map((l) => l.attributes.locale);
      let screenshot = false;
      try { screenshot = !!(await api('GET', `/v1/subscriptions/${s.id}/appStoreReviewScreenshot`))?.data; } catch {}
      list.push({ id: s.id, productId: s.attributes.productId, period: s.attributes.subscriptionPeriod, state: s.attributes.state, paisesComPreco: prices, paisesComOferta: offers, idiomas: locs, printDeRevisao: screenshot });
    }
    out.groups.push({ id: g.id, referenceName: g.attributes.referenceName, subscriptions: list });
  }
  console.log(JSON.stringify(out, null, 2));
}

async function uploadAsset(type, relationships, file) {
  const buf = fs.readFileSync(file);
  const res = (await api('POST', `/v1/${type}`, { data: { type, attributes: { fileName: path.basename(file), fileSize: buf.length }, relationships } })).data;
  for (const op of res.attributes.uploadOperations) {
    const headers = Object.fromEntries((op.requestHeaders || []).map((h) => [h.name, h.value]));
    const r = await fetch(op.url, { method: op.method, headers, body: buf.subarray(op.offset, op.offset + op.length) });
    if (!r.ok) throw new Error(`Upload falhou: ${r.status} ${await r.text()}`);
  }
  const md5 = crypto.createHash('md5').update(buf).digest('hex');
  await api('PATCH', `/v1/${type}/${res.id}`, { data: { type, id: res.id, attributes: { uploaded: true, sourceFileChecksum: md5 } } });
  for (let i = 0; i < 20; i++) {
    const cur = (await api('GET', `/v1/${type}/${res.id}`)).data;
    const st = cur.attributes.assetDeliveryState?.state;
    if (st === 'COMPLETE') return cur;
    if (st === 'FAILED') throw new Error(`A Apple recusou a imagem: ${JSON.stringify(cur.attributes.assetDeliveryState.errors)}`);
    await new Promise((r) => setTimeout(r, 3000));
  }
  return res;
}

async function cmdReviewScreenshot([subId, file]) {
  if (!subId || !file) throw new Error('Uso: review-screenshot <subscriptionId> <imagem.png>');
  try {
    const cur = await api('GET', `/v1/subscriptions/${subId}/appStoreReviewScreenshot`);
    if (cur?.data?.id) { await api('DELETE', `/v1/subscriptionAppStoreReviewScreenshots/${cur.data.id}`); log('- print antigo removido'); }
  } catch (e) { if (e.status !== 404) throw e; }
  const r = await uploadAsset('subscriptionAppStoreReviewScreenshots', { subscription: rel('subscriptions', subId) }, file);
  log(`+ print de revisao enviado (${r.id})`);
}

async function cmdUpload([type, relName, relType, relId, file]) {
  if (!file) throw new Error('Uso: upload <tipoDoRecurso> <nomeDaRelacao> <tipoDaRelacao> <id> <arquivo>\nEx.: upload appScreenshots appScreenshotSet appScreenshotSets <id> tela1.png');
  const r = await uploadAsset(type, { [relName]: rel(relType, relId) }, file);
  console.log(JSON.stringify({ id: r.id, state: r.attributes.assetDeliveryState?.state }, null, 2));
}

// Autorrevisao: confere pela API tudo o que a Apple exige antes do envio.
// Saida: lista de itens com status ok | aviso | falta. So le, nao altera nada.
async function cmdRevisaoStatus([bundleId]) {
  if (!bundleId) throw new Error('Uso: revisao-status <bundleId>');
  const items = [];
  const add = (item, status, detalhe) => items.push({ item, status, detalhe });
  const tryGet = async (p) => { try { return await api('GET', p); } catch (e) { if (e.status === 404) return null; throw e; } };

  const app = await findApp(bundleId);
  const primary = app.attributes.primaryLocale;

  // Versao editavel
  const versions = (await all(`/v1/apps/${app.id}/appStoreVersions?filter[platform]=IOS&limit=20`)).data;
  const editable = ['PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED', 'WAITING_FOR_REVIEW', 'IN_REVIEW', 'READY_FOR_REVIEW'];
  const v = versions.find((x) => editable.includes(x.attributes.appStoreState));
  if (!v) { add('Versao', 'falta', 'Nenhuma versao em preparacao. Crie a versao no App Store Connect.'); return print(); }
  const va = v.attributes;
  add('Versao', 'ok', `${va.versionString} (${va.appStoreState})`);
  add('Copyright', va.copyright ? 'ok' : 'falta', va.copyright || 'vazio');

  // Build
  const b = (await tryGet(`/v1/appStoreVersions/${v.id}/build`))?.data;
  if (!b) add('Build', 'falta', 'Nenhum build ligado a versao');
  else add('Build', b.attributes.processingState === 'VALID' && !b.attributes.expired ? 'ok' : 'falta', `build ${b.attributes.version} ${b.attributes.processingState}${b.attributes.expired ? ' EXPIRADO' : ''}`);

  // Textos e imagens por idioma
  const vlocs = (await all(`/v1/appStoreVersions/${v.id}/appStoreVersionLocalizations?limit=50`)).data;
  for (const l of vlocs) {
    const a = l.attributes; const faltam = [];
    if (!a.description) faltam.push('descricao');
    if (!a.keywords) faltam.push('palavras-chave');
    if (!a.supportUrl) faltam.push('URL de suporte');
    add(`Textos (${a.locale})`, faltam.length ? 'falta' : 'ok', faltam.length ? `faltam: ${faltam.join(', ')}` : 'completos');
    const sets = (await all(`/v1/appStoreVersionLocalizations/${l.id}/appScreenshotSets?limit=50`)).data;
    let total = 0, ruins = 0;
    for (const s of sets) {
      const shots = (await all(`/v1/appScreenshotSets/${s.id}/appScreenshots?limit=50`)).data;
      total += shots.length;
      ruins += shots.filter((x) => x.attributes.assetDeliveryState?.state !== 'COMPLETE').length;
    }
    if (!total) add(`Imagens (${a.locale})`, 'falta', 'nenhuma imagem');
    else add(`Imagens (${a.locale})`, ruins ? 'falta' : 'ok', `${total} imagem(ns)${ruins ? `, ${ruins} com erro` : ''}`);
    if (a.supportUrl) await checkUrl(`URL de suporte (${a.locale})`, a.supportUrl);
  }
  if (!vlocs.some((l) => l.attributes.locale === primary)) add('Idioma principal', 'falta', `${primary} sem textos na versao`);

  // Informacoes do app
  const infos = (await all(`/v1/apps/${app.id}/appInfos?include=primaryCategory,ageRatingDeclaration&limit=10`));
  const info = infos.data.find((i) => i.attributes.state !== 'READY_FOR_DISTRIBUTION') || infos.data[0];
  add('Categoria', info.relationships?.primaryCategory?.data ? 'ok' : 'falta', info.relationships?.primaryCategory?.data?.id || 'sem categoria principal');
  const ilocs = (await all(`/v1/appInfos/${info.id}/appInfoLocalizations?limit=50`)).data;
  for (const l of ilocs) {
    const a = l.attributes;
    add(`Nome (${a.locale})`, a.name ? 'ok' : 'falta', a.name || 'vazio');
    if (!a.privacyPolicyUrl) add(`Politica de privacidade (${a.locale})`, 'falta', 'sem URL');
    else await checkUrl(`Politica de privacidade (${a.locale})`, a.privacyPolicyUrl);
  }
  const age = infos.included?.find((x) => x.type === 'ageRatingDeclarations');
  if (age) {
    const nulos = Object.entries(age.attributes).filter(([k, val]) => val === null && !/kidsAgeBand|Override|gracRating|developerAgeRating|socialMediaAgeRestricted|Url$/i.test(k)).map(([k]) => k);
    add('Classificacao etaria', nulos.length ? 'falta' : 'ok', nulos.length ? `sem resposta: ${nulos.join(', ')}` : 'respondida');
  }
  const terr = (await tryGet(`/v1/appInfos/${info.id}/territoryAgeRatings?limit=200`))?.data || [];
  if (terr.length) {
    const faixas = {}; for (const t of terr) { const f = t.attributes.appStoreAgeRating; faixas[f] = (faixas[f] || 0) + 1; }
    add('Faixa etaria por pais', 'ok', Object.entries(faixas).map(([f, n]) => `${f}: ${n} paises`).join(', '));
  }

  // Revisao
  const rd = (await tryGet(`/v1/appStoreVersions/${v.id}/appStoreReviewDetail`))?.data?.attributes;
  if (!rd) add('Informacoes para a revisao', 'falta', 'contato e conta de demonstracao nao preenchidos');
  else {
    const faltam = ['contactFirstName', 'contactLastName', 'contactPhone', 'contactEmail'].filter((k) => !rd[k]);
    add('Contato da revisao', faltam.length ? 'falta' : 'ok', faltam.length ? `faltam: ${faltam.join(', ')}` : rd.contactEmail);
    if (/exemplo|example|teste|test/i.test(rd.contactEmail || '')) add('Contato da revisao', 'aviso', 'e-mail parece ficticio. A Apple pode precisar falar com voce');
    if (rd.demoAccountRequired) add('Conta de demonstracao', rd.demoAccountName && rd.demoAccountPassword ? 'ok' : 'falta', rd.demoAccountName || 'sem usuario/senha');
    else add('Conta de demonstracao', 'aviso', 'marcada como nao necessaria. Se o app tem login, a Apple reprova (2.1)');
  }

  // Assinaturas
  const groups = (await all(`/v1/apps/${app.id}/subscriptionGroups?limit=50`)).data;
  for (const g of groups) {
    const subs = (await all(`/v1/subscriptionGroups/${g.id}/subscriptions?limit=50`)).data;
    for (const s of subs) {
      const st = s.attributes.state;
      add(`Assinatura ${s.attributes.productId}`, ['READY_TO_SUBMIT', 'WAITING_FOR_REVIEW', 'IN_REVIEW', 'APPROVED'].includes(st) ? 'ok' : 'falta', st);
    }
  }

  // Preco e paises
  { const ps = await tryGet(`/v1/apps/${app.id}/appPriceSchedule`); add('Preco do app', ps ? 'ok' : 'falta', ps ? 'definido' : 'nao definido'); }
  const av = await tryGet(`/v1/apps/${app.id}/appAvailabilityV2`);
  add('Paises', av ? 'ok' : 'falta', av ? 'definidos' : 'nao definidos');

  // So pela tela (a API nao mostra)
  add('Privacidade do app (dados coletados)', 'tela', 'conferir se esta publicada: Geral > Privacidade do app');
  add('Dispositivo medico (categorias Saude e fitness / Medicina)', 'tela', 'conferir se foi declarado: Informacoes do app');
  return print();

  async function checkUrl(nome, url) {
    if (/apple\.com|example\.|exemplo\./i.test(url)) return add(nome, 'aviso', `${url} e provisorio. Use uma pagina sua`);
    try {
      const r = await fetch(url, { method: 'GET', redirect: 'follow' });
      add(nome, r.ok ? 'ok' : 'falta', `${url} -> ${r.status}`);
    } catch (e) { add(nome, 'falta', `${url} nao abre (${e.message})`); }
  }
  function print() {
    const ordem = { falta: 0, aviso: 1, tela: 2, ok: 3 };
    items.sort((a, b) => ordem[a.status] - ordem[b.status]);
    const resumo = items.reduce((r, i) => ((r[i.status] = (r[i.status] || 0) + 1), r), {});
    console.log(JSON.stringify({ app: app.attributes.name, resumo, itens: items }, null, 2));
  }
}

const cmds = { check: cmdCheck, request: cmdRequest, 'sub-setup': cmdSubSetup, 'sub-status': cmdSubStatus, 'review-screenshot': cmdReviewScreenshot, upload: cmdUpload, 'revisao-status': cmdRevisaoStatus };
const [cmd, ...args] = process.argv.slice(2);
if (!cmds[cmd]) {
  console.log(`Comandos:
  check                                  testa a chave e lista os apps
  sub-status <bundleId>                  mostra grupos, assinaturas e o que falta
  sub-setup <spec.json>                  cria grupo, assinaturas, precos e teste gratis (pode rodar de novo)
  review-screenshot <subId> <imagem>     envia o print de revisao de uma assinatura
  revisao-status <bundleId>              autorrevisao: confere tudo o que a Apple exige antes do envio
  upload <tipo> <relacao> <tipoRel> <id> <arquivo>   upload generico de imagem
  request <METODO> <caminho> [--body f.json] [--all]  chamada livre a API`);
  process.exit(cmd ? 1 : 0);
}
cmds[cmd](args).catch((e) => { console.error('ERRO: ' + e.message); process.exit(1); });
