FROM python:3.9-slim

WORKDIR /app

# Copy file requirements.txt từ thư mục backend
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ code vào container
COPY . .

# Cấu hình Port cho Hugging Face
ENV PORT=7860
EXPOSE 7860

# Lệnh chạy file Python (chạy file app.py trong thư mục backend)
CMD ["python", "backend/app.py"]