// @ts-check

/**
 * Sender IDs API'si ayrı origin'de ve Bearer ile korunur. Token okunmaz/loglanmaz;
 * yalnız uygulamanın kendi GET isteğindeki Authorization başlığı bellekte yeniden
 * kullanılır. Böylece rollback spec'e sır/token sızdırmadan yapılır.
 */
export class SenderIdsApi {
  static HOST = 'https://api.vomenta.com';
  static LIST = '/api/v1/sender-ids';

  /**
   * @param {import('@playwright/test').Page} page
   * @param {(reason: string) => void} mutationGuard
   */
  constructor(page, mutationGuard) {
    this.page = page;
    this.mutationGuard = mutationGuard;
    this.authorization = null;
    page.on('request', (request) => {
      const header = request.headers().authorization;
      if (header && request.url().startsWith(SenderIdsApi.HOST)) {
        this.authorization = header;
      }
    });
  }

  headers() {
    if (!this.authorization) {
      throw new Error(
        'Sender IDs API Authorization yakalanmadı; önce UI listesini yükleyin.'
      );
    }
    return { authorization: this.authorization };
  }

  async list({ page = 1, limit = 100 } = {}) {
    const response = await this.page.request.get(
      `${SenderIdsApi.HOST}${SenderIdsApi.LIST}?page=${page}&limit=${limit}`,
      { headers: this.headers() }
    );
    return this.expectOk(response, 'GET');
  }

  async get(id) {
    const response = await this.page.request.get(
      `${SenderIdsApi.HOST}${SenderIdsApi.LIST}/${id}`,
      { headers: this.headers() }
    );
    return this.expectOk(response, 'GET');
  }

  async delete(id) {
    this.mutationGuard(`DELETE ${SenderIdsApi.LIST}/${id}`);
    const response = await this.page.request.delete(
      `${SenderIdsApi.HOST}${SenderIdsApi.LIST}/${id}`,
      { headers: this.headers() }
    );
    return this.expectOk(response, 'DELETE');
  }

  async expectOk(response, method) {
    if (!response.ok()) {
      const body = await response.text().catch(() => '<response body okunamadı>');
      throw new Error(
        `${method} Sender IDs API başarısız: ${response.status()} ${body.slice(0, 500)}`
      );
    }
    return response;
  }
}
