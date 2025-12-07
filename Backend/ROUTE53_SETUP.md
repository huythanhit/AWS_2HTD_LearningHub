# 🌐 Hướng dẫn Setup Route 53 cho LearningHub

## 📋 Tổng quan

Bạn có:
- **Frontend**: Vercel
- **Backend**: AWS Lambda + API Gateway
- **Domain**: `2htdlearninghub.xyz` (quản lý bởi Route 53)

## 🎯 Mục tiêu

1. **Frontend domain**: `2htdlearninghub.xyz` → Vercel
2. **Backend API subdomain**: `api.2htdlearninghub.xyz` → API Gateway

## 📝 Bước 1: Cấu hình Domain trong Vercel

### 1.1. Thêm Domain vào Vercel Project

1. Vào **Vercel Dashboard** → Chọn project
2. Vào **Settings** → **Domains**
3. Thêm domain: `2htdlearninghub.xyz`
4. Vercel sẽ hiển thị DNS records cần cấu hình

### 1.2. Vercel thường yêu cầu:
- **Type A** record trỏ về Vercel IP
- Hoặc **CNAME** record trỏ về Vercel domain (ví dụ: `cname.vercel-dns.com`)

## 📝 Bước 2: Setup Route 53 Records

### 2.1. Trỏ Domain chính về Vercel

1. Vào **Route 53 Console** → **Hosted zones**
2. Chọn hosted zone: `2htdlearninghub.xyz`
3. Tạo records:

#### Option 1: Dùng A Record (IP addresses)
```
Type: A
Name: @ (hoặc để trống)
Value: [IP addresses từ Vercel]
TTL: 300
```

#### Option 2: Dùng CNAME (Recommended)
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
TTL: 300
```

**⚠️ LƯU Ý**: Route 53 không hỗ trợ CNAME cho root domain (@). Nếu Vercel yêu cầu CNAME, bạn có thể:
- Dùng **Alias A record** thay vì CNAME
- Hoặc redirect `www.2htdlearninghub.xyz` về root domain

### 2.2. Setup Subdomain cho API

#### Tạo API Gateway Custom Domain

1. Vào **API Gateway Console**
2. Chọn **Custom domain names**
3. Click **Create**
4. Cấu hình:
   - **Domain name**: `api.2htdlearninghub.xyz`
   - **Endpoint type**: `Regional`
   - **Regional certificate**: Tạo/cấu hình SSL certificate trong ACM (Certificate Manager)
5. Click **Create**

#### Mapping API Gateway

1. Sau khi tạo custom domain, vào **API mappings**
2. Click **Configure API mappings**
3. Thêm mapping:
   - **API**: `learninghub-backend-API`
   - **Stage**: `default` (hoặc `prod`)
   - **Path**: (để trống hoặc `/`)
4. Click **Save**

#### Tạo Route 53 Record cho API Subdomain

1. Vào **Route 53 Console** → **Hosted zones**
2. Chọn hosted zone: `2htdlearninghub.xyz`
3. Tạo record:

```
Type: A (Alias)
Name: api
Alias: Yes
Alias target: API Gateway custom domain (api.2htdlearninghub.xyz)
TTL: N/A (vì là Alias)
```

**Hoặc** nếu API Gateway cung cấp CNAME:

```
Type: CNAME
Name: api
Value: [API Gateway CNAME từ custom domain]
TTL: 300
```

## 🔒 Bước 3: Setup SSL Certificate (HTTPS)

### 3.1. Tạo Certificate trong ACM

1. Vào **AWS Certificate Manager (ACM)**
2. Click **Request certificate**
3. Cấu hình:
   - **Domain names**:
     - `2htdlearninghub.xyz`
     - `*.2htdlearninghub.xyz` (wildcard cho tất cả subdomains)
   - **Validation method**: DNS validation
4. Click **Request**

### 3.2. Validate Certificate

1. ACM sẽ tạo DNS records để validate
2. Copy các records này
3. Tạo records tương ứng trong Route 53
4. Đợi validation hoàn tất (thường 5-30 phút)

### 3.3. Attach Certificate

- **Vercel**: Vercel tự động cung cấp SSL cho domain
- **API Gateway Custom Domain**: Chọn certificate trong ACM khi tạo custom domain

## ✅ Bước 4: Update Frontend API Endpoint

Sau khi setup xong, frontend cần biết API endpoint mới.

### 4.1. Tạo Environment Variable trong Vercel

Vào **Vercel Project** → **Settings** → **Environment Variables**:

```
VITE_API_URL=https://api.2htdlearninghub.xyz
# hoặc
NEXT_PUBLIC_API_URL=https://api.2htdlearninghub.xyz
```

### 4.2. Update Frontend Code

```javascript
// config.js hoặc .env
const API_URL = import.meta.env.VITE_API_URL || 'https://api.2htdlearninghub.xyz';
```

## 📋 Bước 5: Test Setup

### 5.1. Test Frontend Domain

```bash
# Mở browser
https://2htdlearninghub.xyz
```

### 5.2. Test API Subdomain

```bash
# Test health endpoint
curl https://api.2htdlearninghub.xyz/api/health

# Expected response:
# {"status":"ok","service":"2HTD LearningHub Backend"}
```

### 5.3. Test từ Frontend

1. Mở frontend: `https://2htdlearninghub.xyz`
2. Mở Developer Console (F12)
3. Kiểm tra Network tab
4. Test một API call (ví dụ: login)
5. Verify request được gửi đến: `https://api.2htdlearninghub.xyz/api/auth/login`

## 🔄 DNS Propagation

Sau khi tạo records, có thể mất:
- **TTL seconds** (thường 300-3600 giây)
- Tối đa **24-48 giờ** trong một số trường hợp

Để kiểm tra:
```bash
# Check DNS records
nslookup 2htdlearninghub.xyz
nslookup api.2htdlearninghub.xyz

# Hoặc dùng online tool
# https://www.whatsmydns.net/
```

## 📊 Tóm tắt DNS Records

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| A (Alias) | @ | Vercel IP | Frontend domain |
| A (Alias) | api | API Gateway | Backend API |
| CNAME | www | 2htdlearninghub.xyz | Redirect www |

## ⚠️ Troubleshooting

### Frontend không load
- ✅ Kiểm tra Route 53 records
- ✅ Kiểm tra Vercel domain configuration
- ✅ Đợi DNS propagation
- ✅ Clear DNS cache: `ipconfig /flushdns` (Windows)

### API không hoạt động
- ✅ Kiểm tra API Gateway custom domain
- ✅ Kiểm tra SSL certificate
- ✅ Kiểm tra API Gateway deployment
- ✅ Kiểm tra Lambda function logs trong CloudWatch

### CORS errors
- ✅ Cấu hình CORS trong API Gateway
- ✅ Cấu hình CORS trong Express app
- ✅ Kiểm tra frontend URL trong CORS config

## 📚 Tài liệu tham khảo

- [Route 53 Documentation](https://docs.aws.amazon.com/route53/)
- [Vercel Custom Domains](https://vercel.com/docs/concepts/projects/domains)
- [API Gateway Custom Domains](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-custom-domains.html)
- [ACM Documentation](https://docs.aws.amazon.com/acm/)



