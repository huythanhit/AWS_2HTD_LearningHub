// src/lambda.js
// Lambda handler để deploy lên AWS Lambda
// Lambda sẽ sử dụng API Gateway làm proxy
//
// IMPORTANT: File này chỉ được dùng cho Lambda deployment
// Không import server.js ở đây vì Lambda không cần start HTTP server

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
    'application/zip',
  ],
  // Request timeout configuration
  request: (request, event, context) => {
    // Log request cho CloudWatch (chỉ log trong development)
    if (process.env.NODE_ENV !== 'production') {
      console.log('Lambda request:', {
        path: event.path || event.requestContext?.path,
        method: event.httpMethod,
        requestId: event.requestContext?.requestId,
      });
    }
  },
  // Response configuration
  response: (response, event, context) => {
    // Đảm bảo CORS headers được set đúng
    if (!response.headers) {
      response.headers = {};
    }
    // CloudWatch logging
    if (process.env.NODE_ENV !== 'production') {
      console.log('Lambda response:', {
        statusCode: response.statusCode,
        requestId: event.requestContext?.requestId,
      });
    }
  },
});

// Lambda cần context để handle correctly
// API Gateway sẽ tự động convert HTTP request thành Lambda event




