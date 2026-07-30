// @ts-check
import { AnalyticsPage } from './AnalyticsPage.js';
import { ApiKeysPage } from './ApiKeysPage.js';
import { AppShell } from './AppShell.js';
import { AuditLogPage } from './AuditLogPage.js';
import { AutomationsPage } from './AutomationsPage.js';
import { BusinessHoursPage } from './BusinessHoursPage.js';
import { CampaignCreatePage } from './CampaignCreatePage.js';
import { CampaignsOutboundPage } from './CampaignsOutboundPage.js';
import { CannedResponsesPage } from './CannedResponsesPage.js';
import { CompliancePage } from './CompliancePage.js';
import { ContactsPage } from './ContactsPage.js';
import { DashboardsPage } from './DashboardsPage.js';
import { DataRetentionPage } from './DataRetentionPage.js';
import { DispositionCodesPage } from './DispositionCodesPage.js';
import { LoginPage } from './LoginPage.js';
import { NotificationsPage } from './NotificationsPage.js';
import { OrganizationPage } from './OrganizationPage.js';
import { ProfilePage } from './ProfilePage.js';
import { ReportSectionPage } from './ReportSectionPage.js';
import { RolesPage } from './RolesPage.js';
import { SecurityPage } from './SecurityPage.js';
import { UsersPage } from './UsersPage.js';
import { ReportsPage } from './ReportsPage.js';
import { SettingsPage } from './SettingsPage.js';
import { SlaPage } from './SlaPage.js';
import { TeamsPage } from './TeamsPage.js';
import { TemplatesPage } from './TemplatesPage.js';
import { TicketsPage } from './TicketsPage.js';
import { WallboardPage } from './WallboardPage.js';
import { WebhooksPage } from './WebhooksPage.js';
import { WorkforcePage } from './WorkforcePage.js';
import { AgentMonitorPage } from './AgentMonitorPage.js';
import { IntegrationsPage } from './IntegrationsPage.js';
import { InteractionsPage } from './InteractionsPage.js';
import { AgentLivePage } from './AgentLivePage.js';
import { CoachingPage } from './CoachingPage.js';

/**
 * Testlerin uygulamadaki ekranlara tek fixture üzerinden erişmesini sağlar.
 */
export class App {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.shell = new AppShell(page);
    this.analytics = new AnalyticsPage(page);
    this.login = new LoginPage(page);
    this.contacts = new ContactsPage(page);
    this.reports = new ReportsPage(page);
    this.dashboards = new DashboardsPage(page);
    this.settings = new SettingsPage(page);
    this.profile = new ProfilePage(page);
    this.organization = new OrganizationPage(page);
    this.users = new UsersPage(page);
    this.roles = new RolesPage(page);
    this.compliance = new CompliancePage(page);
    this.teams = new TeamsPage(page);
    this.businessHours = new BusinessHoursPage(page);
    this.automations = new AutomationsPage(page);
    this.sla = new SlaPage(page);
    this.templates = new TemplatesPage(page);
    this.dispositionCodes = new DispositionCodesPage(page);
    this.cannedResponses = new CannedResponsesPage(page);
    this.integrations = new IntegrationsPage(page);
    this.security = new SecurityPage(page);
    this.dataRetention = new DataRetentionPage(page);
    this.notifications = new NotificationsPage(page);
    this.apiKeys = new ApiKeysPage(page);
    this.webhooks = new WebhooksPage(page);
    this.auditLog = new AuditLogPage(page);
    this.tickets = new TicketsPage(page);
    this.wallboard = new WallboardPage(page);
    this.workforce = new WorkforcePage(page);
    this.agentMonitor = new AgentMonitorPage(page);
    this.interactions = new InteractionsPage(page);
    this.agentLive = new AgentLivePage(page);
    this.coaching = new CoachingPage(page);
    this.campaignsOutbound = new CampaignsOutboundPage(page);
    this.campaignCreate = new CampaignCreatePage(page);
  }

  /**
   * Ortak kabuğu paylaşan bir rapor bölümü ekranı döndürür (parametreli).
   * @param {string} key - ReportSectionPage.SECTIONS anahtarı (ör. 'call')
   */
  reportSection(key) {
    return new ReportSectionPage(this.page, key);
  }
}
