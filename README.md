 # Tài liệu mô tả chung dự án AWS_2HTD_LEARNINGHUB
  # Tài liệu mô tả chung dự án AWS_2HTD_LEARNINGHUB
 # admin: phamminhtuan171204@gmail.com -- pswd: Pmtuan171204@
 # member: tuanpmse180595@fpt.edu.vn -- pswd: Pmtuan171204@
 # teacher: tranrin174@gmail.com -- pswd: Pmtuan171204@
# Service :
# Luồng 1: Khóa học
<!-- Role admin: admin tạo khóa học trong đó sẽ gồm các thao tác quản lý khóa học (thêm, xóa, sửa, xem chi tiết) sau đó admin sẽ cho khóa học đó ở public để giáo viên và học sinh thấy. Tiếp theo đó admin gán 1 teacher vào lớp học đó (1 khóa học chỉ bao gồm 1 teacher). Admin có thể thể xem 1 bài giảng chi tiết của khóa học đó do teacher up lên. 

Role teacher: sau khi được admin gán vào 1 khóa học, teacher có thể quản lý bên trong khóa học bao gồm các thao tác về bài giảng (thêm, xóa, sửa, xem chi tiết) 

Role member: member thấy các khóa học do admin đưa lên (đã public) sau đó member có thể tham gia vào khóa học và xem được tiến độ của member trong khóa học 



Luồng 2: Quiz
Role admin


Role teacher: quản lý thao tác các bài quiz (thêm, xóa, sửa, xem chi tiết) sau khi tạo ra được bài quiz teacher sẽ tạo ra các list card cho học sinh có thể ôn tập theo dạng lật thẻ (thêm, xóa, sửa, xem chi tiết) và up phần bài quiz ở public cho member có thể ôn tập


Role member: có thể xem các bài quiz teacher up lên để ôn tập


Luồng 3: Test

Role admin

Role teacher: tạo ra các bài test (thêm, xóa, sửa, xem chi tiết) sau khi tạo ra bài test teacher tạo ra list câu hỏi để member có thể làm bài kiểm tra (thêm, xóa, sửa, xem chi tiết)  và up phần bài test ở public để member có thể làm bài kiểm tra

Role Member: có thể làm các bài kiểm tra do teacher up lên, xem điểm câu đúng , lịch sử test và check test -->

# 4/ Công nghệ và kiến trúc
<!-- Frontend: 
Layer
Công nghệ
API Backend
AWS Lambda (Node.js / Typescript) hoặc NestJS chạy trên Lambda
Authentication
Amazon Cognito (Quản lý đăng nhập, phân quyền theo role)
Business Logic
Lambda Function tách theo domain: Course, Exam, User, Realtime, Reporting
Realtime messaging
AWS AppSync (GraphQL Subscriptions) hoặc WebSocket API Gateway



Backend:
Layer
Công nghệ
API Backend
AWS Lambda (Node.js / Typescript) hoặc NestJS chạy trên Lambda
Authentication
Amazon Cognito (Quản lý đăng nhập, phân quyền theo role)
Business Logic
Lambda Function tách theo domain: Course, Exam, User, Realtime, Reporting
Realtime messaging
AWS AppSync (GraphQL Subscriptions) hoặc WebSocket API Gateway


Database:
Thành phần
Lý do
Aurora Serverless v2 (PostgreSQL or MySQL)
Tiết kiệm chi phí vì tự scale theo tải, phù hợp backend quan hệ: khóa học, user, bài thi, điểm.
DynamoDB (tùy chọn)
Lưu caching realtime chat / message / presence để tốc độ nhanh hơn, không cần join.


5/ Hệ thống kiến trúc và các service AWS
Dịch vụ
Chức năng chính
Mô tả ngắn gọn
Amazon Cognito
Quản lý người dùng, đăng nhập
Cung cấp xác thực (login), phân quyền, quản lý tài khoản, hỗ trợ đăng nhập qua email, số điện thoại hoặc mạng xã hội (Google, Facebook…).
Amazon S3
Lưu trữ dữ liệu
Dịch vụ lưu trữ file dạng object như tài liệu học tập, ảnh, video, file bài thi; có độ bền rất cao và mở rộng linh hoạt.
Amazon CloudFront
CDN tăng tốc truy cập
Phân phối nội dung (ảnh/video/dữ liệu) đến người dùng nhanh hơn bằng cách cache tại các máy chủ trên toàn thế giới, giảm tải S3/Server.
Amazon CloudWatch
Theo dõi và ghi log hệ thống
Thu thập log, metrics, cảnh báo từ các dịch vụ AWS để giám sát hiệu năng và phát hiện lỗi.
Amazon EventBridge
Hệ thống event & lịch tự động
Dịch chuyển dữ liệu sự kiện giữa các dịch vụ AWS, hỗ trợ lập lịch (ví dụ: gửi thông báo trước giờ học, auto chấm bài, trigger workflow).
AWS Lambda
Backend không cần server
Chạy code tự động khi có sự kiện (serverless), không cần quản lý máy chủ, tối ưu chi phí theo mức sử dụng.
Amazon SNS
Hệ thống thông báo
Gửi thông báo qua email, push, SMS, hoặc fan-out đến nhiều dịch vụ khác, thường dùng để nhắc lịch học / điểm / thông báo lớp mở.
Amazon Chime SDK
Live class & video call
Cung cấp trò chuyện video/audio thời gian thực, tạo lớp học trực tuyến, chia sẻ màn hình, tương tự Zoom/Google Meet nhưng nhúng được vào web/app.
AWS AppSync
API GraphQL Realtime
Cung cấp GraphQL API, hỗ trợ realtime (chat/live quiz), kết nối dữ liệu đến Lambda, DynamoDB…, tối ưu cho ứng dụng tương tác.
Amazon API Gateway
Cổng API backend
Tạo và quản lý REST / WebSocket API để frontend giao tiếp với backend, định tuyến request đến Lambda hoặc các dịch vụ khác.
Amazon Route 53
Quản lý tên miền & DNS
Dịch vụ DNS + đăng ký tên miền, điều hướng traffic đến web/app với độ ổn định và tốc độ cao. -->




