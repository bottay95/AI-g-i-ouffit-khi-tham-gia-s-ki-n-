# 👗 Outfit-Recommendation-Tool

Công cụ gợi ý trang phục thông minh dựa trên bối cảnh sử dụng và hình ảnh được tối ưu hóa.

## ✨ Tính Năng

- 🎯 **Gợi ý theo sự kiện**: Học tập, đi chơi, công sở, tiệc tùng
- 📸 **Hình ảnh tối ưu hóa**: Được tổ chức theo danh mục và bối cảnh
- 👔 **Bộ outfit hoàn chỉnh**: Gợi ý áo + quần + giày + phụ kiện
- 🔄 **Phân loại tự động**: Nhận diện loại quần áo từ tên file
- 📊 **Metadata chi tiết**: JSON manifest cho tất cả ảnh
- 🌐 **API RESTful**: Dễ dàng tích hợp

## 📁 Cấu Trúc Dữ Liệu

```
data/images/
├── donamdihoc/        # Áo học tập
├── donamdichoi/       # Áo đi chơi
├── donamdilam/        # Áo công sở
├── donamdicuoi/       # Áo tiệc/cưới
├── donudichoi/        # Quần đi chơi
├── donudihoc/         # Quần học tập
├── donudilam/         # Quần công sở
├── donudicuoi/        # Quần tiệc/cưới
├── optimized/         # 📊 Cấu trúc tối ưu (tops/bottoms/shoes/accessories)
└── image_manifest.json # 📋 Metadata tất cả ảnh
```

## 🚀 Quick Start

link đồ án 1:https://congtay-ai-goi-y-outffit.hf.space/

## 📊 Quản Lý Ảnh

```python
# Phân tích cấu trúc ảnh hiện tại
python backend/utils/image_manager.py

# Tạo CSV từ ảnh
from backend.utils.image_manager import ImageManager
manager = ImageManager()
df = manager.generate_csv_entries()
```

## 🎨 Gợi Ý Outfit

```python
from backend.recommendation.rule_based import EnhancedRecommender

# Gợi ý cho sự kiện cụ thể
recommender = EnhancedRecommender(df)
outfits = recommender.recommend_for_event('công sở', 'formal')

```

## 📚 Tài Liệu

Xem [IMAGE_OPTIMIZATION_GUIDE.md](docs/IMAGE_OPTIMIZATION_GUIDE.md) để hiểu rõ:
- Cấu trúc thư mục tối ưu
- Ánh xạ context → events
- Cách phân loại ảnh tự động
- API sử dụng

## 🔄 API Endpoints

### GET /recommend
```
?event=công sở&formality=formal&top_n=6
```

Response:
```json
{
  "event": "công sở",
  "formality": "formal",
  "recommendations": [...]
}
```

## 📈 Cải Tiến

- [x] Tối ưu hóa cấu trúc thư mục ảnh
- [x] Tạo metadata manifest
- [x] Phân loại ảnh tự động
- [x] Engine gợi ý nâng cao
- [ ] Resize & optimize ảnh
- [ ] WebP format support
- [ ] Lazy loading
- [ ] Image caching

---

*Tối ưu hóa cho công cụ gợi ý outfit thông minh v1.0*
