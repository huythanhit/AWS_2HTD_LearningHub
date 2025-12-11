# 🔧 Cấu hình S3 CORS cho Video Streaming

## Vấn đề
Video không thể phát với lỗi "Định dạng video không được hỗ trợ hoặc URL không hợp lệ" có thể do:
1. S3 bucket CORS chưa được cấu hình đúng
2. Video element cần CORS headers từ S3
3. URL encoding issue

## Giải pháp

### 1. Cấu hình S3 Bucket CORS

Vào **AWS S3 Console** → Chọn bucket `learninghub-app-bucket` → **Permissions** → **Cross-origin resource sharing (CORS)**

Thêm CORS configuration sau:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "HEAD"
        ],
        "AllowedOrigins": [
            "https://2htdlearninghub.xyz",
            "https://www.2htdlearninghub.xyz",
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:5174",
            "https://*.vercel.app"
        ],
        "ExposeHeaders": [
            "ETag",
            "Content-Length",
            "Content-Type",
            "Accept-Ranges"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

**Lưu ý:**
- `AllowedOrigins`: Thêm domain của frontend (Vercel, localhost, production)
- `AllowedMethods`: `GET` và `HEAD` cho video streaming
- `ExposeHeaders`: Cần thiết cho video player
- `MaxAgeSeconds`: Cache CORS preflight (3000 giây = 50 phút)

### 2. Kiểm tra Bucket Policy

Đảm bảo bucket có policy cho phép public read:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::learninghub-app-bucket/*"
        }
    ]
}
```

### 3. Kiểm tra Block Public Access

**S3 Console** → **Permissions** → **Block public access (bucket settings)**

Nếu bucket cần public:
- ✅ Uncheck "Block all public access" (hoặc chỉ block một số settings)
- ✅ Cho phép public read access

### 4. Test Video URL

Sau khi cấu hình CORS, test URL video:

```bash
# Test với curl
curl -I "https://learninghub-app-bucket.s3.ap-southeast-1.amazonaws.com/lectures/.../video.mp4"

# Kiểm tra CORS headers trong response:
# Access-Control-Allow-Origin: https://2htdlearninghub.xyz
# Access-Control-Allow-Methods: GET, HEAD
```

### 5. Debug trong Browser

Mở **Browser DevTools** → **Network tab**:
1. Tìm request đến video URL
2. Kiểm tra Response Headers:
   - `Access-Control-Allow-Origin` phải có domain của bạn
   - `Content-Type` phải là `video/mp4` hoặc video format khác
3. Kiểm tra Status Code: phải là `200 OK`

## Troubleshooting

### Lỗi: "CORS policy: No 'Access-Control-Allow-Origin' header"
→ S3 CORS chưa được cấu hình hoặc origin không match

### Lỗi: "MEDIA_ERR_SRC_NOT_SUPPORTED"
→ Có thể do:
- URL không hợp lệ
- Video format không được hỗ trợ
- CORS issue

### Lỗi: "403 Forbidden"
→ Bucket policy chưa cho phép public read

## Code đã được cập nhật

1. ✅ Frontend: Thêm `crossOrigin="anonymous"` cho video element
2. ✅ Backend: `getS3Url()` clean presigned URL query string
3. ✅ Frontend: Clean URL và encode đúng format

## Sau khi cấu hình CORS

1. Đợi vài phút để CORS settings propagate
2. Clear browser cache
3. Test lại video

