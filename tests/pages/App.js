// @ts-check
import { AppShell } from './AppShell.js';
import { CampaignCreatePage } from './CampaignCreatePage.js';
import { CampaignsOutboundPage } from './CampaignsOutboundPage.js';
import { ContactsPage } from './ContactsPage.js';
import { LoginPage } from './LoginPage.js';
import { SettingsPage } from './SettingsPage.js';
import { TicketsPage } from './TicketsPage.js';
import { WallboardPage } from './WallboardPage.js';

/**
 * Testlerin uygulamadaki ekranlara tek fixture üzerinden erişmesini sağlar.
 */
export class App {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.shell = new AppShell(page);
    this.login = new LoginPage(page);
    this.contacts = new ContactsPage(page);
    this.settings = new SettingsPage(page);
    this.tickets = new TicketsPage(page);
    this.wallboard = new WallboardPage(page);
    this.campaignsOutbound = new CampaignsOutboundPage(page);
    this.campaignCreate = new CampaignCreatePage(page);
  }
}
