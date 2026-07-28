// @ts-check
import { AnalyticsPage } from './AnalyticsPage.js';
import { AppShell } from './AppShell.js';
import { CampaignCreatePage } from './CampaignCreatePage.js';
import { CampaignsOutboundPage } from './CampaignsOutboundPage.js';
import { ContactsPage } from './ContactsPage.js';
import { DashboardsPage } from './DashboardsPage.js';
import { LoginPage } from './LoginPage.js';
import { ReportSectionPage } from './ReportSectionPage.js';
import { SettingsPage } from './SettingsPage.js';
import { TicketsPage } from './TicketsPage.js';
import { WallboardPage } from './WallboardPage.js';
import { WorkforcePage } from './WorkforcePage.js';
import { AgentMonitorPage } from './AgentMonitorPage.js';
import { InteractionsPage } from './InteractionsPage.js';
import { AgentLivePage } from './AgentLivePage.js';

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
    this.dashboards = new DashboardsPage(page);
    this.settings = new SettingsPage(page);
    this.tickets = new TicketsPage(page);
    this.wallboard = new WallboardPage(page);
    this.workforce = new WorkforcePage(page);
    this.agentMonitor = new AgentMonitorPage(page);
    this.interactions = new InteractionsPage(page);
    this.agentLive = new AgentLivePage(page);
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
