// Deployed by Terraform only to give the Lambda function a valid initial
// package. The real application code is pushed by the deploy workflow via
// `aws lambda update-function-code` right after this module is applied.
exports.handler = async () => ({
  statusCode: 200,
  body: JSON.stringify({
    message: 'oh-rugby placeholder — awaiting app deployment.',
  }),
});
