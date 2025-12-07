// src/lambda.js
// Lambda handler để deploy lên AWS Lambda
// Lambda sẽ sử dụng API Gateway làm proxy

import serverless from 'serverless-http';
import app from './app.js';

// Wrap Express app với serverless-http
export const handler = serverless(app, {
  // Cấu hình cho API Gateway
  binary: [
    'image/*',
    'video/*',
    'audio/*',
    'application/pdf',
    'application/octet-stream',
  ],
  // Request timeout (seconds)
  request: (request, event, context) => {
    // Log request cho CloudWatch
    console.log('Lambda request:', {
      path: event.path,
      method: event.httpMethod,
      headers: event.headers,
    });
  },
});

// Lambda cần context để handle correctly
// API Gateway sẽ tự động convert HTTP request thành Lambda event



