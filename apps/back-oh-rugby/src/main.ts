import serverless from 'serverless-http';
import { createApp } from './app';

export const app = createApp();
export const handler = serverless(app);

// `require.main === module` is unreliable here: AWS Lambda's Node.js runtime
// loads this CommonJS bundle via dynamic import(), which makes Node treat it
// as its own require graph root — the check evaluates true even inside
// Lambda, which used to start a useless (and blocking) local server on every
// cold start. AWS_LAMBDA_FUNCTION_NAME is only ever set inside a real Lambda
// execution environment, so it reliably distinguishes local dev from Lambda.
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const port = Number(process.env.PORT) || 3333;
  app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}/api`);
  });
}
