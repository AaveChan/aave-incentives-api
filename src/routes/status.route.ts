import { Router } from 'express';

import { IncentivesService } from '@/services/incentives.service';

export function createStatusRoute() {
  const router = Router();

  const incentivesService = new IncentivesService();

  router.get('/', async (_req, res) => {
    const results: Record<string, boolean> = {};

    await Promise.all(
      incentivesService.providers.map(async (provider) => {
        try {
          const healthy = await provider.isHealthy();
          results[provider.name] = healthy;
        } catch {
          results[provider.name] = false;
        }
      }),
    );

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>API Status</title>
          <style>
            body {
              font-family: system-ui, sans-serif;
              background-color: #0a0a0a;
              color: #f5f5f5;
              padding: 40px;
            }
            h1 {
              font-size: 2rem;
              text-align: center;
              margin-bottom: 2rem;
            }
            .provider {
              display: flex;
              justify-content: space-between;
              align-items: center;
              background: #111;
              padding: 14px 20px;
              margin-bottom: 12px;
              border-radius: 8px;
              border: 1px solid #222;
            }
            .status-ok {
              color: #2ecc71;
              font-weight: 600;
            }
            .status-bad {
              color: #e74c3c;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <h1>Providers Health Status</h1>

          ${Object.entries(results)
            .map(
              ([name, healthy]) => `
                <div class="provider">
                  <span>${name}</span>
                  <span class="${healthy ? 'status-ok' : 'status-bad'}">
                    ${healthy ? 'Healthy ✓' : 'Unhealthy ✗'}
                  </span>
                </div>
              `,
            )
            .join('')}
        </body>
      </html>
    `);
  });

  return router;
}
