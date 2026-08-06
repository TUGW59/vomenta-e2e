// Vomenta /settings/roles — full permission catalog (113) + per-role checked sets.
// Captured live from app.vomenta.com (production), Edit Role → Permissions, 2026-08-05.

const catalog = [
  ["General","dashboard.view","View dashboard"],
  ["General","inbox.view","View inbox"],
  ["Voice","voice.view","View voice section"],
  ["Voice","voice.calls.view","View calls"],
  ["Voice","voice.calls.outbound","Place outbound calls"],
  ["Voice","voice.calls.control","Control active calls"],
  ["Voice","voice.queues.view","View queues"],
  ["Voice","voice.queues.manage","Manage queues"],
  ["Voice","voice.ivr.view","View IVR flows"],
  ["Voice","voice.ivr.manage","Manage IVR flows"],
  ["Voice","voice.dids.view","View phone numbers"],
  ["Voice","voice.dids.manage","Manage phone numbers"],
  ["Voice","voice.recordings.view","View call recordings"],
  ["Voice","voice.recordings.list","List call recordings"],
  ["Voice","voice.recordings.play.masked","Play call recordings (masked)"],
  ["Voice","voice.recordings.play.unmasked","Play call recordings (unmasked)"],
  ["Voice","voice.recordings.download","Download call recordings"],
  ["Voice","voice.recordings.manage","Manage call recordings"],
  ["Voice","voice.voicemails.view","View voicemails"],
  ["Voice","voice.voicemails.manage","Manage voicemails"],
  ["Voice","voice.sipTrunks.manage","Manage SIP trunks"],
  ["Channels","channels.view","View channels"],
  ["Channels","channels.manage","Manage channel configuration"],
  ["Channels","channels.templates.view","View message templates"],
  ["Channels","channels.sms.send","Send SMS"],
  ["Channels","channels.email.send","Send email"],
  ["Channels","channels.whatsapp.send","Send WhatsApp"],
  ["Channels","channels.social.manage","Manage social channels"],
  ["Channels","channels.video.use","Use video"],
  ["Channels","channels.templates.manage","Manage message templates"],
  ["AI","ai.view","View AI features"],
  ["AI","ai.copilot.use","Use AI copilot"],
  ["AI","ai.chatbot.manage","Manage AI chatbot"],
  ["AI","ai.voice.manage","Manage Voice AI"],
  ["AI","ai.prompts.manage","Manage prompt templates"],
  ["AI","ai.providers.manage","Manage AI providers"],
  ["AI","ai.knowledgeBase.view","View knowledge base"],
  ["AI","ai.knowledgeBase.manage","Manage knowledge base"],
  ["AI","ai.botBuilder.manage","Manage bot builder"],
  ["CRM & Contacts","contacts.view","View contacts"],
  ["CRM & Contacts","contacts.view.own","View own contacts"],
  ["CRM & Contacts","contacts.view.team","View team contacts"],
  ["CRM & Contacts","contacts.view.all","View all contacts"],
  ["CRM & Contacts","contacts.manage","Manage contacts"],
  ["CRM & Contacts","contacts.import","Import contacts"],
  ["CRM & Contacts","contacts.delete","Delete contacts"],
  ["CRM & Contacts","contacts.customFields.manage","Manage custom fields"],
  ["CRM & Contacts","contacts.segments.manage","Manage segments"],
  ["CRM & Contacts","contacts.groups.manage","Manage contact groups"],
  ["CRM & Contacts","contacts.documents.view","View customer-shared documents"],
  ["CRM & Contacts","contacts.documents.manage","Manage customer-shared documents"],
  ["CRM & Contacts","contacts.documents.delete","Delete customer-shared documents"],
  ["CRM & Contacts","companies.manage","Manage companies"],
  ["Tickets","tickets.view","View tickets"],
  ["Tickets","tickets.view.own","View own tickets"],
  ["Tickets","tickets.view.team","View team tickets"],
  ["Tickets","tickets.view.all","View all tickets"],
  ["Tickets","tickets.manage","Manage tickets"],
  ["Tickets","tickets.delete","Delete tickets"],
  ["Campaigns","campaigns.view","View campaigns"],
  ["Campaigns","campaigns.manage","Manage campaigns"],
  ["Campaigns","campaigns.start","Start / pause campaigns"],
  ["Campaigns","campaigns.dnc.manage","Manage Do-Not-Call list"],
  ["Campaigns","campaigns.senderIds.view","View sender IDs"],
  ["Campaigns","campaigns.senderIds.manage","Manage sender IDs"],
  ["Campaigns","campaigns.dispositionCodes.manage","Manage disposition codes"],
  ["Reports & Analytics","reports.view.own","View own reports"],
  ["Reports & Analytics","reports.view.team","View team reports"],
  ["Reports & Analytics","reports.view.all","View all reports"],
  ["Reports & Analytics","reports.export","Export reports"],
  ["Reports & Analytics","reports.dashboards.manage","Manage dashboards"],
  ["Reports & Analytics","analytics.view","View advanced analytics"],
  ["Supervisor","supervisor.view","View supervisor dashboard"],
  ["Supervisor","supervisor.monitor.listen","Listen to live calls"],
  ["Supervisor","supervisor.monitor.whisper","Whisper to agent"],
  ["Supervisor","supervisor.monitor.barge","Barge / take over call"],
  ["Supervisor","supervisor.coaching.manage","Manage coaching evaluations"],
  ["Supervisor","supervisor.wallboard.manage","Manage wallboard"],
  ["Supervisor","supervisor.agents.manage","Manage agents (live)"],
  ["Workforce Management","wfm.view","View workforce"],
  ["Workforce Management","wfm.schedules.manage","Manage schedules"],
  ["Workforce Management","wfm.timeOff.manage","Manage time-off"],
  ["Workforce Management","wfm.evaluations.manage","Manage WFM evaluations"],
  ["Workforce Management","wfm.gamification.manage","Manage gamification"],
  ["Compliance","compliance.view","View compliance"],
  ["Compliance","compliance.manage","Manage compliance"],
  ["Compliance","compliance.audit.view","View audit logs"],
  ["Compliance","compliance.dataRetention.manage","Manage data retention"],
  ["Settings","settings.profile.manage","Manage own profile"],
  ["Settings","settings.organization.view","View organization"],
  ["Settings","settings.organization.manage","Manage organization"],
  ["Settings","settings.users.view","View users"],
  ["Settings","settings.users.manage","Manage users"],
  ["Settings","settings.roles.manage","Manage roles"],
  ["Settings","settings.teams.manage","Manage teams"],
  ["Settings","settings.security.view","View security"],
  ["Settings","settings.security.manage","Manage security"],
  ["Settings","settings.businessHours.view","View business hours"],
  ["Settings","settings.businessHours.manage","Manage business hours"],
  ["Settings","settings.notifications.manage","Manage notifications"],
  ["Settings","settings.integrations.manage","Manage integrations"],
  ["Settings","settings.webhooks.manage","Manage webhooks"],
  ["Settings","settings.apiKeys.manage","Manage API keys"],
  ["Settings","settings.templates.manage","Manage response templates"],
  ["Settings","settings.cannedResponses.manage","Manage canned responses"],
  ["Settings","settings.sla.manage","Manage SLA policies"],
  ["Settings","settings.automations.manage","Manage automations"],
  ["Billing","billing.view","View billing"],
  ["Billing","billing.manage","Manage billing"],
  ["Billing","billing.modules.manage","Manage modules"],
  ["Reseller","reseller.access","Access reseller portal"],
  ["Reseller","reseller.tenants.manage","Manage reseller tenants"],
  ["Reseller","reseller.billing.view","View reseller billing"],
];

const allKeys = catalog.map(r => r[1]);

// Roles NOT holding a permission (easier for near-full roles):
const ADMIN_MISSING = ["supervisor.agents.manage","billing.view","billing.manage","billing.modules.manage","reseller.access","reseller.tenants.manage","reseller.billing.view"];
const OWNER_MISSING = ["supervisor.agents.manage","reseller.access","reseller.tenants.manage","reseller.billing.view"];

const AGENT = ["dashboard.view","inbox.view","voice.view","voice.calls.view","voice.calls.outbound","voice.calls.control","voice.queues.view","voice.dids.view","voice.recordings.list","voice.voicemails.view","channels.view","channels.templates.view","channels.sms.send","channels.email.send","channels.whatsapp.send","channels.video.use","ai.view","ai.copilot.use","ai.knowledgeBase.view","contacts.view.own","contacts.manage","contacts.documents.view","companies.manage","tickets.view.own","tickets.manage","campaigns.senderIds.view","reports.view.own","settings.profile.manage","settings.notifications.manage"];

const MANAGER = ["dashboard.view","inbox.view","voice.view","voice.calls.view","voice.calls.outbound","voice.calls.control","voice.queues.view","voice.queues.manage","voice.dids.view","voice.recordings.list","voice.recordings.play.masked","voice.voicemails.view","channels.view","channels.manage","channels.templates.view","channels.sms.send","channels.email.send","channels.whatsapp.send","channels.video.use","channels.templates.manage","ai.view","ai.copilot.use","ai.knowledgeBase.view","ai.knowledgeBase.manage","contacts.view.own","contacts.view.team","contacts.manage","contacts.import","contacts.customFields.manage","contacts.segments.manage","contacts.groups.manage","contacts.documents.view","contacts.documents.manage","contacts.documents.delete","companies.manage","tickets.view.own","tickets.view.team","tickets.manage","campaigns.view","campaigns.manage","campaigns.start","campaigns.dnc.manage","campaigns.senderIds.view","campaigns.senderIds.manage","campaigns.dispositionCodes.manage","reports.view.own","reports.view.team","reports.view.all","reports.export","reports.dashboards.manage","analytics.view","supervisor.view","supervisor.monitor.listen","supervisor.coaching.manage","supervisor.wallboard.manage","wfm.view","wfm.schedules.manage","wfm.timeOff.manage","wfm.evaluations.manage","wfm.gamification.manage","compliance.view","settings.profile.manage","settings.organization.view","settings.users.view","settings.users.manage","settings.teams.manage","settings.security.view","settings.businessHours.view","settings.businessHours.manage","settings.notifications.manage","settings.templates.manage","settings.cannedResponses.manage","settings.sla.manage","settings.automations.manage"];

const SUPERVISOR = ["dashboard.view","inbox.view","voice.view","voice.calls.view","voice.calls.outbound","voice.calls.control","voice.queues.view","voice.queues.manage","voice.dids.view","voice.recordings.list","voice.recordings.play.masked","voice.voicemails.view","channels.view","channels.manage","channels.templates.view","channels.sms.send","channels.email.send","channels.whatsapp.send","channels.video.use","ai.view","ai.copilot.use","ai.knowledgeBase.view","contacts.view.own","contacts.view.team","contacts.manage","contacts.import","contacts.segments.manage","contacts.groups.manage","contacts.documents.view","contacts.documents.manage","companies.manage","tickets.view.own","tickets.view.team","tickets.manage","campaigns.view","campaigns.senderIds.view","reports.view.own","reports.view.team","reports.view.all","reports.export","reports.dashboards.manage","analytics.view","supervisor.view","supervisor.monitor.listen","supervisor.monitor.whisper","supervisor.monitor.barge","supervisor.coaching.manage","supervisor.wallboard.manage","wfm.view","wfm.schedules.manage","wfm.timeOff.manage","wfm.evaluations.manage","wfm.gamification.manage","settings.profile.manage","settings.organization.view","settings.users.view","settings.security.view","settings.businessHours.view","settings.notifications.manage","settings.cannedResponses.manage"];

const VIEWER = ["dashboard.view","voice.recordings.list","channels.templates.view","contacts.view.own","tickets.view.own","campaigns.senderIds.view","reports.view.own","reports.view.team","reports.view.all","analytics.view","supervisor.view","settings.profile.manage"];

const has = (arr, k) => arr.includes(k);
const ADMIN = allKeys.filter(k => !ADMIN_MISSING.includes(k));
const OWNER = allKeys.filter(k => !OWNER_MISSING.includes(k));

const roles = { OWNER, ADMIN, MANAGER, SUPERVISOR, AGENT, VIEWER };
const order = ["OWNER","ADMIN","MANAGER","SUPERVISOR","AGENT","VIEWER"];

// sanity check counts
const expected = { OWNER:109, ADMIN:106, MANAGER:74, SUPERVISOR:60, AGENT:29, VIEWER:12 };
let ok = true;
for (const r of order) { if (roles[r].length !== expected[r]) { ok=false; console.error(`COUNT MISMATCH ${r}: ${roles[r].length} != ${expected[r]}`);} }
console.error("counts ok:", ok, order.map(r=>`${r}:${roles[r].length}`).join(" "));

// Build markdown
let md = "";
const cats = [...new Set(catalog.map(r=>r[0]))];
const catCount = {};
for (const c of cats) catCount[c] = catalog.filter(r=>r[0]===c).length;

md += "| Kategori | İzin (görünen ad) | Anahtar | OWNER | ADMIN | MANAGER | SUPERVISOR | AGENT | VIEWER |\n";
md += "|---|---|---|:--:|:--:|:--:|:--:|:--:|:--:|\n";
let lastCat = null;
for (const [cat, key, name] of catalog) {
  const cell = order.map(r => has(roles[r], key) ? "✅" : "·").join(" | ");
  const catLabel = cat !== lastCat ? `**${cat}**` : "";
  lastCat = cat;
  md += `| ${catLabel} | ${name} | \`${key}\` | ${cell} |\n`;
}

// Per-category tally table
let tally = "\n| Kategori | Toplam | OWNER | ADMIN | MANAGER | SUPERVISOR | AGENT | VIEWER |\n|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|\n";
for (const c of cats) {
  const keys = catalog.filter(r=>r[0]===c).map(r=>r[1]);
  const counts = order.map(r => keys.filter(k=>has(roles[r],k)).length);
  tally += `| ${c} | ${keys.length} | ${counts.join(" | ")} |\n`;
}
tally += `| **TOPLAM** | **${allKeys.length}** | ${order.map(r=>`**${roles[r].length}**`).join(" | ")} |\n`;

console.log("=== TALLY ===");
console.log(tally);
console.log("=== MATRIX ===");
console.log(md);
