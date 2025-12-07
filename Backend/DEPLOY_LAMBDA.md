# 🚀 Hướng dẫn Deploy Backend lên AWS Lambda

## 📋 Prerequisites

1. ✅ AWS CLI đã cài đặt và cấu hình
2. ✅ AWS Account có quyền tạo/update Lambda, API Gateway
3. ✅ Node.js 18.x hoặc 20.x (Lambda runtime)
4. ✅ Đã setup VPC và Security Groups (nếu Lambda cần truy cập EC2 database)

## 📦 Bước 1: Cài đặt Dependencies

```bash
cd Backend
npm install
npm install --save-dev serverless-http
```

## 📝 Bước 2: Tạo Lambda Deployment Package

### Cách 1: Dùng AWS CLI (Manual)

```bash
# Tạo thư mục package
mkdir -p dist
cp -r node_modules dist/
cp -r src dist/
cp package.json dist/
cp .env dist/  # Hoặc setup environment variables trong Lambda console

# Tạo zip file
cd dist
zip -r ../lambda-deployment.zip .
cd ..
```

### Cách 2: Dùng AWS SAM hoặc Serverless Framework (Recommended)

Cài đặt Serverless Framework:
```bash
npm install -g serverless
```

## 🔧 Bước 3: Setup Lambda Function

### 3.1. Tạo Lambda Function trong AWS Console

1. Vào **AWS Lambda Console**
2. Click **Create function**
3. Chọn **Author from scratch**
4. Thông tin:
   - **Function name**: `learninghub-backend`
   - **Runtime**: `Node.js 20.x` (hoặc 18.x)
   - **Architecture**: `x86_64`
   - **Execution role**: Chọn existing role hoặc tạo mới

### 3.2. Cấu hình Lambda Function

#### Basic Settings:
- **Memory**: `1024 MB` (cho upload file lớn)
- **Timeout**: `30 seconds` (cho upload file)
- **Handler**: `src/lambda.handler`

#### Environment Variables:
Thêm tất cả biến từ `.env`:

```
DB_SERVER=52.74.234.40
DB_USER=sa
DB_PASSWORD=2htdLearningHub@
DB_NAME=2HTD_LearningHub
DB_PORT=1433
COGNITO_REGION=ap-southeast-1
COGNITO_USER_POOL_ID=ap-southeast-1_wgFLpZsho
COGNITO_CLIENT_ID=4quhrr2mrl5t2u4fatc4pdl44s
AWS_REGION=ap-southeast-1
S3_BUCKET_NAME=learninghub-app-bucket
NODE_ENV=production
ADMIN_EMAIL=admin@2htdlearninghub.xyz
```

**⚠️ LƯU Ý**: KHÔNG thêm `AWS_ACCESS_KEY_ID` và `AWS_SECRET_ACCESS_KEY` vào environment variables. Thay vào đó, cấu hình IAM Role cho Lambda.

#### IAM Role Permissions:

Lambda cần các quyền sau:
- **S3**: `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` trên bucket `learninghub-app-bucket`
- **Cognito**: `cognito-idp:Admin*` (nếu cần)
- **VPC**: Nếu Lambda cần truy cập EC2 database trong private subnet

### 3.3. Upload Code

#### Cách 1: Upload từ ZIP file
```bash
aws lambda update-function-code \
  --function-name learninghub-backend \
  --zip-file fileb://lambda-deployment.zip \
  --region ap-southeast-1
```

#### Cách 2: Upload từ S3
```bash
# Upload zip lên S3 trước
aws s3 cp lambda-deployment.zip s3://your-bucket/lambda-deployment.zip

# Deploy từ S3
aws lambda update-function-code \
  --function-name learninghub-backend \
  --s3-bucket your-bucket \
  --s3-key lambda-deployment.zip \
  --region ap-southeast-1
```

#### Cách 3: Dùng AWS Console
1. Vào Lambda function
2. Click **Upload from** → **.zip file**
3. Chọn file `lambda-deployment.zip`

## 🔗 Bước 4: Cấu hình API Gateway

### 4.1. Tạo API Gateway REST API (nếu chưa có)

API Gateway đã có: `learninghub-backend-API`

### 4.2. Tạo Resource và Method

1. Vào **API Gateway Console**
2. Chọn API `learninghub-backend-API`
3. Tạo resource:
   - Path: `{proxy+}`
   - Enable **API Gateway CORS**
4. Tạo method:
   - Method: `ANY`
   - Integration type: **Lambda Function**
   - Lambda Function: `learninghub-backend`
   - Enable **Use Lambda Proxy integration**

### 4.3. Cấu hình CORS

1. Chọn **Actions** → **Enable CORS**
2. Cấu hình:
   - **Access-Control-Allow-Origin**: `*` hoặc domain của bạn
   - **Access-Control-Allow-Headers**: `Content-Type,Authorization,X-Requested-With`
   - **Access-Control-Allow-Methods**: `GET,POST,PUT,PATCH,DELETE,OPTIONS`

### 4.4. Deploy API

1. Chọn **Actions** → **Deploy API**
2. **Deployment stage**: `default` (hoặc tạo stage mới như `prod`)
3. Click **Deploy**

API Gateway URL sẽ là:
```
https://wu256wsp4j.execute-api.ap-southeast-1.amazonaws.com/default
```

## ✅ Bước 5: Test Lambda Function

### Test từ Lambda Console:
1. Vào Lambda function
2. Click **Test**
3. Tạo test event:
```json
{
  "httpMethod": "GET",
  "path": "/api/health",
  "headers": {},
  "body": null
}
```
4. Click **Test** và kiểm tra response

### Test từ API Gateway:
```bash
curl https://wu256wsp4j.execute-api.ap-southeast-1.amazonaws.com/default/api/health
```

## 🔄 Bước 6: Setup Custom Domain (Route 53)

Xem file `ROUTE53_SETUP.md` để biết chi tiết.

## 📚 Tài liệu tham khảo

- [AWS Lambda Node.js](https://docs.aws.amazon.com/lambda/latest/dg/lambda-nodejs.html)
- [API Gateway Lambda Integration](https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html)
- [Serverless HTTP](https://github.com/dougmoscrop/serverless-http)



