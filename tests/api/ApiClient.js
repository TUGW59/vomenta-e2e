// @ts-check

/**
 * Playwright request fixture'ı için ince şirket sarmalayıcısı.
 * Endpoint ayrıntıları feature client'larında (örn. TicketsApi) tutulabilir.
 */
export class ApiClient {
  /**
   * @param {import('@playwright/test').APIRequestContext} request
   * @param {(reason: string) => Promise<void>} mutationGuard
   */
  constructor(request, mutationGuard) {
    this.request = request;
    this.mutationGuard = mutationGuard;
  }

  async get(path, options = {}) {
    return this.expectOk(await this.request.get(path, options), 'GET');
  }

  async post(path, data, options = {}) {
    await this.mutationGuard(`POST ${path}`);
    return this.expectOk(await this.request.post(path, { ...options, data }), 'POST');
  }

  async patch(path, data, options = {}) {
    await this.mutationGuard(`PATCH ${path}`);
    return this.expectOk(await this.request.patch(path, { ...options, data }), 'PATCH');
  }

  async delete(path, options = {}) {
    await this.mutationGuard(`DELETE ${path}`);
    return this.expectOk(await this.request.delete(path, options), 'DELETE');
  }

  /**
   * @param {import('@playwright/test').APIResponse} response
   * @param {string} method
   */
  async expectOk(response, method) {
    if (!response.ok()) {
      const body = await response.text().catch(() => '<response body okunamadı>');
      throw new Error(
        `${method} ${response.url()} başarısız: ` +
          `${response.status()} ${body.slice(0, 500)}`
      );
    }
    return response;
  }
}
