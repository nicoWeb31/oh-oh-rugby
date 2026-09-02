import serverless from 'serverless-http';
import { createApp } from './app';

export const app = createApp();
export const handler = serverless(app);

if (require.main === module) {
  const port = Number(process.env.PORT) || 3333;
  app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}/api`);
  });
}
