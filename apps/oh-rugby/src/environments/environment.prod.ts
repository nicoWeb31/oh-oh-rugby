// Overwritten by the deploy-prod GitHub Actions workflow with the API Gateway
// URL output by Terraform, just before `nx build --configuration=production`.
export const environment = {
  production: true,
  apiUrl: 'https://REPLACED_AT_DEPLOY_TIME/api',
};
