#!/usr/bin/env node
// gplay.mjs - ajudante da Google Play Developer API (androidpublisher v3). Node 18+, sem dependencias.
// Credenciais: .assinaturas/google.json { "keyPath": ".assinaturas/<arquivo-da-conta-de-servico>.json" }
// ou variavel GPLAY_KEY_PATH. O arquivo da conta de servico vem do Google Cloud (Chaves > JSON).
// Este arquivo e um ponto de partida: se o Google responder erro de formato,
// leia a mensagem, confira a documentacao (developers.google.com/android-publisher) e ajuste.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';
const UPLOAD = 'https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications';
const REGIONS_VERSION = process.env.GPLAY_REGIONS_VERSION || '2022/02';
const log = (...a) => console.error(...a);
const out = (o) => console.log(typeof o === 'string' ? o : JSON.stringify(o, null, 2));

function loadKey() {
  let keyPath = process.env.GPLAY_KEY_PATH;
  const f = path.resolve('.assinaturas/google.json');
  if (!keyPath && fs.existsSync(f)) keyPath = JSON.parse(fs.readFileSync(f, 'utf8')).keyPath;
  if (!keyPath) throw new Error('Credenciais ausentes. Crie .assinaturas/google.json com { "keyPath": ".assinaturas/<arquivo>.json" }.');
  if (!fs.existsSync(keyPath)) throw new Error(`Arquivo da conta de servico nao encontrado: ${keyPath}`);
  const k = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  if (!k.client_email || !k.private_key) throw new Error('O arquivo nao parece uma chave JSON de conta de servico (faltam client_email/private_key).');
  return k;
}

let cached = { token: null, exp: 0 };
async function token() {
  const now = Math.floor(Date.now() / 1000);
  if (cached.token && now < cached.exp - 60) return cached.token;
  const k = loadKey();
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const aud = k.token_uri || 'https://oauth2.googleapis.com/token';
  const head = b64({ alg: 'RS256', typ: 'JWT' });
  const body = b64({ iss: k.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher', aud, iat: now, exp: now + 3600 });
  const sig = crypto.sign('RSA-SHA256', Buffer.from(`${head}.${body}`), k.private_key).toString('base64url');
  const res = await fetch(aud, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${body}.${sig}` }),
  });
  const j = await res.json();
  if (!res.ok) throw new Error(`Login do Google falhou: ${res.status} ${JSON.stringify(j)}`);
  cached = { token: j.access_token, exp: now + (j.expires_in || 3600) };
  return cached.token;
}

class ApiError extends Error {
  constructor(status, method, url, payload) {
    const msg = payload?.error?.message || JSON.stringify(payload).slice(0, 600);
    super(`${method} ${url} -> ${status} ${msg}`);
    this.status = status; this.payload = payload;
  }
}
const safeJson = (t) => { try { return JSON.parse(t); } catch { return { raw: t }; } };

async function api(method, url, body, { raw, contentType } = {}) {
  // Caminhos relativos comecam pelo pacote (com.exemplo.app/...), sem barra no comeco:
  // assim o Git Bash do Windows nao troca o caminho por "C:/Program Files/Git/...".
  if (!url.startsWith('http')) url = `${BASE}/${url.replace(/^\/+/, '')}`;
  for (let attempt = 0; ; attempt++) {
    const headers = { Authorization: `Bearer ${await token()}` };
    let payload;
    if (raw) { headers['Content-Type'] = contentType; payload = raw; }
    else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
    const res = await fetch(url, { method, headers, body: payload });
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

// ---------- Edits (pagina da loja, faixas, detalhes) ----------
async function withEdit(pkg, fn, { commit = false } = {}) {
  const edit = await api('POST', `${pkg}/edits`, {});
  const id = edit.id;
  try {
    const r = await fn(id);
    if (commit) {
      await api('POST', `${pkg}/edits/${id}:validate`);
      await api('POST', `${pkg}/edits/${id}:commit`);
    } else {
      await api('DELETE', `${pkg}/edits/${id}`).catch(() => {});
    }
    return r;
  } catch (e) {
    await api('DELETE', `${pkg}/edits/${id}`).catch(() => {});
    throw e;
  }
}

async function check(pkg) {
  const k = loadKey();
  log(`Conta de servico: ${k.client_email}`);
  await token();
  log('Login no Google: ok');
  if (!pkg) return out('Informe o pacote do app (ex.: com.exemplo.app) para testar o acesso a ele.');
  const r = await withEdit(pkg, async (id) => {
    const details = await api('GET', `${pkg}/edits/${id}/details`);
    const tracks = await api('GET', `${pkg}/edits/${id}/tracks`);
    return { details, tracks: (tracks.tracks || []).map((t) => ({ track: t.track, releases: (t.releases || []).map((x) => `${x.status} ${x.versionCodes || ''}`) })) };
  });
  out({ ok: true, pacote: pkg, idiomaPadrao: r.details.defaultLanguage, contato: r.details.contactEmail || null, faixas: r.tracks });
}

// ---------- Precos ----------
function money(str, currency) {
  const [i, d = ''] = String(str).replace(',', '.').split('.');
  return { currencyCode: currency, units: String(Number(i)), nanos: Number((d + '000000000').slice(0, 9)) };
}
const fmt = (m) => m ? `${m.currencyCode} ${m.units}.${String(Math.round((m.nanos || 0) / 1e7)).padStart(2, '0')}` : '-';

async function convert(pkg, price, currency) {
  return api('POST', `${pkg}/pricing:convertRegionPrices`, { price: money(price, currency) });
}

async function prices(pkg, price, currency = 'BRL') {
  const r = await convert(pkg, price, currency);
  const regions = r.convertedRegionPrices || {};
  const sample = ['BR', 'US', 'PT', 'GB', 'DE', 'MX', 'AR', 'IN', 'JP'].filter((c) => regions[c]);
  out({
    regioes: Object.keys(regions).length,
    exemplos: Object.fromEntries(sample.map((c) => [c, fmt(regions[c].price)])),
    outrasRegioes: { usd: fmt(r.convertedOtherRegionsPrice?.usdPrice), eur: fmt(r.convertedOtherRegionsPrice?.eurPrice) },
    versaoRegioes: r.regionVersion?.version,
  });
}

// ---------- Assinaturas ----------
async function subList(pkg) {
  const r = await api('GET', `${pkg}/subscriptions?pageSize=100`);
  return r.subscriptions || [];
}

async function subStatus(pkg) {
  const subs = await subList(pkg);
  if (!subs.length) return out('Nenhuma assinatura no Google Play para este app.');
  const res = [];
  for (const s of subs) {
    const plans = [];
    for (const b of s.basePlans || []) {
      let offers = [];
      try {
        const o = await api('GET', `${pkg}/subscriptions/${s.productId}/basePlans/${b.basePlanId}/offers`);
        offers = (o.subscriptionOffers || []).map((x) => ({ id: x.offerId, estado: x.state, fases: (x.phases || []).map((p) => p.duration) }));
      } catch (e) { offers = [`erro: ${e.message}`]; }
      const br = (b.regionalConfigs || []).find((c) => c.regionCode === 'BR');
      plans.push({
        basePlanId: b.basePlanId,
        estado: b.state,
        periodo: b.autoRenewingBasePlanType?.billingPeriodDuration,
        carencia: b.autoRenewingBasePlanType?.gracePeriodDuration || null,
        precoBR: br ? fmt(br.price) : null,
        regioes: (b.regionalConfigs || []).length,
        ofertas: offers,
        idRevenueCat: `${s.productId}:${b.basePlanId}`,
      });
    }
    res.push({ productId: s.productId, idiomas: (s.listings || []).map((l) => l.languageCode), planos: plans });
  }
  out(res);
}

// Config: veja referencia/google-api.md
async function subSetup(file) {
  const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
  const pkg = cfg.packageName;
  let rv = cfg.regionsVersion || null;
  const existing = await subList(pkg);
  for (const s of cfg.subscriptions) {
    let sub = existing.find((x) => x.productId === s.productId);
    const basePlans = [];
    const regionLists = {};
    for (const bp of s.basePlans) {
      const conv = await convert(pkg, bp.price, bp.currency || 'BRL');
      // A versao de regioes que o proprio Google devolve na conversao e a atual.
      if (!rv) rv = conv.regionVersion?.version || REGIONS_VERSION;
      const regions = conv.convertedRegionPrices || {};
      const home = cfg.homeRegion || 'BR';
      const regionalConfigs = Object.values(regions).map((r) => ({
        regionCode: r.regionCode,
        newSubscriberAvailability: true,
        price: r.regionCode === home ? money(bp.price, bp.currency || 'BRL') : r.price,
      }));
      regionLists[bp.basePlanId] = regionalConfigs.map((r) => r.regionCode);
      const type = { billingPeriodDuration: bp.period, resubscribeState: 'RESUBSCRIBE_STATE_ACTIVE' };
      if (bp.gracePeriod) type.gracePeriodDuration = bp.gracePeriod;
      basePlans.push({
        basePlanId: bp.basePlanId,
        autoRenewingBasePlanType: type,
        regionalConfigs,
        otherRegionsConfig: {
          usdPrice: conv.convertedOtherRegionsPrice?.usdPrice,
          eurPrice: conv.convertedOtherRegionsPrice?.eurPrice,
          newSubscriberAvailability: true,
        },
      });
      log(`${s.productId}/${bp.basePlanId}: ${regionalConfigs.length} regioes, ${home} ${bp.price}`);
    }
    if (!sub) {
      log(`Criando assinatura ${s.productId}...`);
      sub = await api('POST', `${pkg}/subscriptions?productId=${encodeURIComponent(s.productId)}&regionsVersion.version=${encodeURIComponent(rv)}`,
        { packageName: pkg, productId: s.productId, listings: s.listings, basePlans });
    } else {
      const missing = basePlans.filter((b) => !(sub.basePlans || []).some((x) => x.basePlanId === b.basePlanId));
      if (missing.length) {
        log(`Assinatura ${s.productId} ja existe. Acrescentando planos: ${missing.map((m) => m.basePlanId).join(', ')}`);
        sub = await api('PATCH', `${pkg}/subscriptions/${s.productId}?updateMask=basePlans&regionsVersion.version=${encodeURIComponent(rv)}`,
          { packageName: pkg, productId: s.productId, listings: sub.listings, basePlans: [...(sub.basePlans || []), ...missing] });
      } else log(`Assinatura ${s.productId} ja existe com todos os planos. Nada a criar.`);
    }
    for (const bp of s.basePlans) {
      const cur = (sub.basePlans || []).find((x) => x.basePlanId === bp.basePlanId);
      if (cur?.state !== 'ACTIVE') {
        await api('POST', `${pkg}/subscriptions/${s.productId}/basePlans/${bp.basePlanId}:activate`, {});
        log(`Plano ${bp.basePlanId} ativado.`);
      }
      if (!bp.freeTrial) continue;
      const offerId = bp.offerId || `teste-gratis-${bp.freeTrial.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      const offers = await api('GET', `${pkg}/subscriptions/${s.productId}/basePlans/${bp.basePlanId}/offers`).catch(() => ({}));
      let offer = (offers.subscriptionOffers || []).find((o) => o.offerId === offerId);
      if (!offer) {
        const regs = regionLists[bp.basePlanId];
        offer = await api('POST', `${pkg}/subscriptions/${s.productId}/basePlans/${bp.basePlanId}/offers?offerId=${offerId}&regionsVersion.version=${encodeURIComponent(rv)}`, {
          packageName: pkg, productId: s.productId, basePlanId: bp.basePlanId, offerId,
          phases: [{
            recurrenceCount: 1, duration: bp.freeTrial,
            regionalConfigs: regs.map((regionCode) => ({ regionCode, free: {} })),
            otherRegionsConfig: { free: {} },
          }],
          targeting: { acquisitionRule: { scope: { thisSubscription: {} } } },
          regionalConfigs: regs.map((regionCode) => ({ regionCode, newSubscriberAvailability: true })),
          otherRegionsConfig: { otherRegionsNewSubscriberAvailability: true },
        });
        log(`Oferta ${offerId} criada (${bp.freeTrial} gratis, so para quem nunca assinou).`);
      }
      if (offer.state !== 'ACTIVE') {
        await api('POST', `${pkg}/subscriptions/${s.productId}/basePlans/${bp.basePlanId}/offers/${offerId}:activate`, {});
        log(`Oferta ${offerId} ativada.`);
      }
    }
  }
  log('Pronto. Conferindo:');
  await subStatus(pkg);
}

// ---------- Pagina da loja ----------
const IMG_TYPES = ['icon', 'featureGraphic', 'phoneScreenshots', 'sevenInchScreenshots', 'tenInchScreenshots'];
function pngInfo(file) {
  const b = fs.readFileSync(file);
  if (b.slice(1, 4).toString() !== 'PNG') return { type: 'jpeg' };
  return { type: 'png', width: b.readUInt32BE(16), height: b.readUInt32BE(20), colorType: b[25] };
}

// listing.json: { "packageName", "language", "title", "shortDescription", "fullDescription", "contactEmail",
//   "contactWebsite", "images": { "icon": "arquivo", "featureGraphic": "arquivo", "phoneScreenshots": "pasta" } }
async function listing(file) {
  const c = JSON.parse(fs.readFileSync(file, 'utf8'));
  const pkg = c.packageName, lang = c.language;
  const lim = { title: 30, shortDescription: 80, fullDescription: 4000 };
  for (const [k, n] of Object.entries(lim)) if (c[k] && c[k].length > n) throw new Error(`${k} tem ${c[k].length} caracteres (limite ${n}).`);
  await withEdit(pkg, async (id) => {
    if (c.title || c.shortDescription || c.fullDescription) {
      await api('PUT', `${pkg}/edits/${id}/listings/${lang}`, { language: lang, title: c.title, shortDescription: c.shortDescription, fullDescription: c.fullDescription });
      log(`Textos (${lang}) enviados.`);
    }
    if (c.contactEmail || c.contactWebsite || c.defaultLanguage) {
      const d = await api('GET', `${pkg}/edits/${id}/details`);
      await api('PUT', `${pkg}/edits/${id}/details`, { ...d, ...(c.contactEmail && { contactEmail: c.contactEmail }), ...(c.contactWebsite && { contactWebsite: c.contactWebsite }), ...(c.defaultLanguage && { defaultLanguage: c.defaultLanguage }) });
      log('Detalhes de contato enviados.');
    }
    for (const [type, src] of Object.entries(c.images || {})) {
      if (!IMG_TYPES.includes(type)) throw new Error(`Tipo de imagem desconhecido: ${type}`);
      const files = fs.statSync(src).isDirectory()
        ? fs.readdirSync(src).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort().map((f) => path.join(src, f))
        : [src];
      await api('DELETE', `${pkg}/edits/${id}/listings/${lang}/${type}`).catch(() => {});
      for (const f of files) {
        const info = pngInfo(f);
        const mime = info.type === 'png' ? 'image/png' : 'image/jpeg';
        await api('POST', `${UPLOAD}/${pkg}/edits/${id}/listings/${lang}/${type}?uploadType=media`, undefined, { raw: fs.readFileSync(f), contentType: mime });
        log(`${type}: ${path.basename(f)} enviado${info.width ? ` (${info.width}x${info.height})` : ''}.`);
      }
    }
  }, { commit: true });
  log('Alteracoes salvas no Play Console.');
}

// ---------- Autorrevisao (so le) ----------
async function revisaoStatus(pkg) {
  const items = [];
  const add = (estado, item, detalhe = '') => items.push({ estado, item, detalhe });
  await withEdit(pkg, async (id) => {
    const d = await api('GET', `${pkg}/edits/${id}/details`);
    add(d.contactEmail ? 'ok' : 'falta', 'E-mail de contato', d.contactEmail || '');
    add('ok', 'Idioma padrao', d.defaultLanguage);
    const ls = (await api('GET', `${pkg}/edits/${id}/listings`)).listings || [];
    if (!ls.length) add('falta', 'Textos da pagina', 'nenhum idioma');
    for (const l of ls) {
      add(l.title ? 'ok' : 'falta', `Nome (${l.language})`, `${(l.title || '').length}/30`);
      add(l.shortDescription ? 'ok' : 'falta', `Descricao curta (${l.language})`, `${(l.shortDescription || '').length}/80`);
      add(l.fullDescription ? 'ok' : 'falta', `Descricao completa (${l.language})`, `${(l.fullDescription || '').length}/4000`);
      for (const t of ['icon', 'featureGraphic', 'phoneScreenshots']) {
        const imgs = (await api('GET', `${pkg}/edits/${id}/listings/${l.language}/${t}`)).images || [];
        const need = t === 'phoneScreenshots' ? 2 : 1;
        add(imgs.length >= need ? 'ok' : 'falta', `Imagem ${t} (${l.language})`, `${imgs.length}`);
      }
    }
    const tr = (await api('GET', `${pkg}/edits/${id}/tracks`)).tracks || [];
    for (const t of tr) for (const r of t.releases || []) add('ok', `Faixa ${t.track}`, `${r.status} versionCode ${r.versionCodes || ''}`);
    if (!tr.some((t) => (t.releases || []).length)) add('falta', 'Build enviado', 'nenhuma faixa com versao');
  });
  const subs = await subList(pkg);
  if (!subs.length) add('falta', 'Assinaturas', 'nenhuma');
  for (const s of subs) for (const b of s.basePlans || []) add(b.state === 'ACTIVE' ? 'ok' : 'falta', `Plano ${s.productId}:${b.basePlanId}`, b.state);
  for (const t of ['Seguranca dos dados (com link de exclusao de conta)', 'Classificacao do conteudo', 'Publico-alvo', 'Anuncios', 'Acesso ao app (conta de demonstracao)', 'Politica de privacidade (URL)', 'Categoria e tags', 'Paises da faixa', 'Perfil de pagamentos', 'Verificacao do aparelho Android'])
    add('tela', t, 'conferir no Play Console (sem API de leitura)');
  out(items);
}

// ---------- Generico ----------
async function request(method, p, rest) {
  let body;
  const i = rest.indexOf('--body');
  if (i >= 0) body = JSON.parse(fs.readFileSync(rest[i + 1], 'utf8'));
  out(await api(method.toUpperCase(), p, body));
}

const [cmd, ...args] = process.argv.slice(2);
const cmds = {
  check: () => check(args[0]),
  prices: () => prices(args[0], args[1], args[2]),
  'sub-status': () => subStatus(args[0]),
  'sub-setup': () => subSetup(args[0]),
  listing: () => listing(args[0]),
  'revisao-status': () => revisaoStatus(args[0]),
  request: () => request(args[0], args[1], args.slice(2)),
};
if (!cmds[cmd]) {
  out(`Uso: node gplay.mjs <comando>
  check <pacote>                    testa a chave e o acesso ao app
  prices <pacote> <preco> [BRL]     mostra a conversao do preco para os paises
  sub-setup <assinaturas.json>      cria assinatura, planos, precos e teste gratis (pode rodar de novo)
  sub-status <pacote>               mostra assinaturas, planos, precos e ofertas
  listing <loja.json>               envia textos, contato e imagens da pagina da loja
  revisao-status <pacote>           autorrevisao (so le)
  request <METODO> <caminho> [--body arquivo.json]   chamada livre (caminho relativo a /applications)`);
  process.exit(cmd ? 1 : 0);
}
cmds[cmd]().catch((e) => { log(`ERRO: ${e.message}`); process.exit(1); });
