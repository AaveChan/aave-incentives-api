import { Router } from 'express';

import { getStatus, GlobalStatus } from '@/lib/status/status.js';

export function createStatusRoute() {
  const router = Router();

  router.get('/', async (_req, res) => {
    const status = await getStatus();

    const statusStyles = {
      [GlobalStatus.Healthy]: 'color: #2ecc71;',
      [GlobalStatus.Degraded]: 'color: #f39c12;',
      [GlobalStatus.Down]: 'color: #e74c3c;',
    };

    const statusLabels = {
      [GlobalStatus.Healthy]: 'Healthy ✓',
      [GlobalStatus.Degraded]: 'Degraded ~',
      [GlobalStatus.Down]: 'Down ✗',
    };

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

            .global-status {
              text-align: center;
              font-size: 1.5rem;
              font-weight: 700;
              margin-bottom: 1.5rem;
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
          <h1>API Status</h1>

          <div class="global-status">
            Global status:
            <span style="${statusStyles[status.status]}">
              ${statusLabels[status.status]}
            </span>
          </div>

          ${Object.entries(status.providersStatus)
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
