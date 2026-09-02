// Overwritten by the deploy-dev GitHub Actions workflow with the API Gateway
// URL output by Terraform, just before `nx build --configuration=dev`.
export const environment = {
  production: false,
  apiUrl: 'https://REPLACED_AT_DEPLOY_TIME/api',
};
