# 🚀 Hướng dẫn Deploy Complete: Backend Lambda + Frontend Vercel + Route 53

## ✅ Kết quả mong đợi

Sau khi hoàn tất, bạn sẽ có:
- ✅ Frontend: `https://2htdlearninghub.xyz` (Vercel)
- ✅ Backend API: `https://api.2htdlearninghub.xyz` (Lambda + API Gateway)
- ✅ Tất cả hoạt động với HTTPS/SSL

## 📋 Checklist Deploy

### Phase 1: Backend (Lambda + API Gateway)
- [ ] Cài đặt dependencies (`serverless-http`)
- [ ] Tạo Lambda deployment package
- [ ] Upload code lên Lambda
- [ ] Cấu hình Lambda environment variables
- [ ] Setup Lambda IAM role permissions
- [ ] Cấu hình API Gateway integration
- [ ] Setup API Gateway CORS
- [ ] Deploy API Gateway
- [ ] Test Lambda function
- [ ] Test API Gateway endpoint

### Phase 2: Domain Setup (Route 53)
- [ ] Tạo SSL certificate trong ACM
- [ ] Validate SSL certificate
- [ ] Setup Vercel custom domain
- [ ] Tạo Route 53 record cho frontend domain
- [ ] Tạo API Gateway custom domain
- [ ] Tạo Route 53 record cho API subdomain
- [ ] Test DNS propagation

### Phase 3: Frontend (Vercel)
- [ ] Update frontend API endpoint config
- [ ] Thêm environment variables trong Vercel
- [ ] Deploy frontend lên Vercel
- [ ] Verify frontend domain
- [ ] Test API calls từ frontend

## 🔄 Workflow hoàn chỉnh

```
┌─────────────────┐
│   Route 53      │
│  (DNS Manager)  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────────┐
│Vercel  │ │API Gateway   │
│Frontend│ │Custom Domain │
└────────┘ └──────┬───────┘
                  │
                  ▼
           ┌─────────────┐
           │   Lambda    │
           │  Function   │
           └─────────────┘
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
    ┌────────┐      ┌──────────┐
    │   S3   │      │   EC2    │
    │ (Files)│      │(Database)│
    └────────┘      └──────────┘
```

## 📝 Chi tiết các bước

### 1️⃣ Backend Deployment

Xem file `DEPLOY_LAMBDA.md` để biết chi tiết.

**Tóm tắt**:
1. Tạo Lambda handler (`src/lambda.js`)
2. Package code
3. Upload lên Lambda
4. Cấu hình environment variables
5. Setup API Gateway integration

### 2️⃣ Domain Configuration

Xem file `ROUTE53_SETUP.md` để biết chi tiết.

**Tóm tắt**:
1. Tạo SSL certificate trong ACM
2. Setup Vercel custom domain
3. Tạo Route 53 records
4. Setup API Gateway custom domain

### 3️⃣ Frontend Configuration

#### Update API Endpoint

Trong frontend code, thay đổi API URL:

```javascript
// Before (development)
const API_URL = 'http://localhost:4000';

// After (production)
const API_URL = 'https://api.2htdlearninghub.xyz';
```

#### Environment Variables trong Vercel

```
VITE_API_URL=https://api.2htdlearninghub.xyz
# hoặc cho Next.js
NEXT_PUBLIC_API_URL=https://api.2htdlearninghub.xyz
```

#### Update CORS trong Backend

File `Backend/src/app.js` - đảm bảo CORS cho phép domain production:

```javascript
const corsOptions = {
  origin: [
    'https://2htdlearninghub.xyz',
    'https://www.2htdlearninghub.xyz',
    process.env.FRONTEND_URL,
  ],
  credentials: true,
};
```

## 🧪 Testing Checklist

### Backend API
```bash
# Test health endpoint
curl https://api.2htdlearninghub.xyz/api/health

# Test từ API Gateway URL cũ (nếu vẫn hoạt động)
curl https://wu256wsp4j.execute-api.ap-southeast-1.amazonaws.com/default/api/health
```

### Frontend
1. Mở `https://2htdlearninghub.xyz`
2. Test login/signup
3. Kiểm tra Network tab trong DevTools
4. Verify API calls đến `api.2htdlearninghub.xyz`

### Database Connection
- Lambda có thể truy cập EC2 database?
- Security Group cho phép connection từ Lambda?

## ⚠️ Common Issues & Solutions

### 1. DNS không resolve
**Vấn đề**: Domain không load
**Giải pháp**:
- Đợi DNS propagation (5-30 phút)
- Clear DNS cache
- Kiểm tra Route 53 records

### 2. API Gateway 502/503 errors
**Vấn đề**: Lambda error hoặc timeout
**Giải pháp**:
- Kiểm tra CloudWatch logs
- Tăng Lambda timeout
- Kiểm tra Lambda permissions

### 3. CORS errors
**Vấn đề**: Frontend không gọi được API
**Giải pháp**:
- Cấu hình CORS trong API Gateway
- Cấu hình CORS trong Express app
- Kiểm tra frontend domain trong CORS config

### 4. SSL Certificate issues
**Vấn đề**: HTTPS không hoạt động
**Giải pháp**:
- Validate SSL certificate
- Attach certificate vào API Gateway custom domain
- Đợi certificate activation

## 📊 Monitoring

### CloudWatch
- Lambda function logs
- API Gateway logs
- Lambda metrics (invocations, errors, duration)

### Vercel Analytics
- Frontend performance
- API call statistics

## 🔒 Security Best Practices

1. ✅ **Không commit credentials** vào code
2. ✅ **Dùng IAM Roles** cho Lambda (không dùng Access Keys)
3. ✅ **Enable HTTPS** cho tất cả endpoints
4. ✅ **Cấu hình CORS** đúng domain
5. ✅ **Restrict database access** (Security Groups)
6. ✅ **Enable CloudWatch Logs** monitoring
7. ✅ **Setup API Gateway throttling** (nếu cần)

## 📚 Files Reference

- `DEPLOY_LAMBDA.md` - Chi tiết deploy Lambda
- `ROUTE53_SETUP.md` - Chi tiết setup Route 53
- `src/lambda.js` - Lambda handler
- `AWS_INTEGRATION.md` - Tổng quan AWS services

## ✅ Final Checklist

Sau khi hoàn tất, verify:

- [ ] Frontend accessible: `https://2htdlearninghub.xyz`
- [ ] API accessible: `https://api.2htdlearninghub.xyz/api/health`
- [ ] SSL working (HTTPS, không warning)
- [ ] Frontend có thể gọi API
- [ ] Login/Signup hoạt động
- [ ] Upload file hoạt động
- [ ] Database connection working
- [ ] CloudWatch logs accessible
- [ ] No CORS errors
- [ ] No SSL errors

## 🎉 Kết luận

Sau khi hoàn tất tất cả các bước, hệ thống sẽ hoạt động hoàn chỉnh:
- Users truy cập `https://2htdlearninghub.xyz`
- Frontend gọi API đến `https://api.2htdlearninghub.xyz`
- Backend xử lý requests qua Lambda
- Files được lưu trên S3
- Database trên EC2
- Tất cả được quản lý bởi Route 53



