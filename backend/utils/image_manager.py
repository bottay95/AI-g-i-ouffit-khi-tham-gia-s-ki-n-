"""
Image Management & Optimization Module
Quản lý, tổ chức và tối ưu hóa hình ảnh outfit theo context và danh mục
"""

import os
import json
import pandas as pd
from pathlib import Path
from typing import Dict, List, Tuple


class ImageManager:
    """Quản lý tổ chức ảnh outfit"""
    
    def __init__(self, image_base_path: str = 'data/images'):
        self.base_path = Path(image_base_path)
        self.manifest_path = self.base_path / 'image_manifest.json'
        self.manifest = self._load_manifest()
        self.contexts = {
            'hoc': 'Học tập',
            'choi': 'Đi chơi', 
            'lam': 'Làm việc',
            'tiec': 'Tiệc tùng'
        }
        self.categories = ['tops', 'bottoms', 'shoes', 'accessories']
    
    def _load_manifest(self) -> Dict:
        """Tải file manifest metadata"""
        if self.manifest_path.exists():
            with open(self.manifest_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def analyze_image_structure(self) -> Dict:
        """Phân tích cấu trúc thư mục ảnh hiện tại"""
        structure = {
            'contexts': {},
            'optimized': {},
            'statistics': {
                'total_images': 0,
                'by_context': {},
                'by_category': {}
            }
        }
        
        # Phân tích thư mục context (dona*, donu*)
        context_dirs = [d for d in self.base_path.iterdir() 
                       if d.is_dir() and d.name.startswith(('dona', 'donu'))]
        
        for ctx_dir in context_dirs:
            images = list(ctx_dir.glob('**/*.*'))
            image_files = [f for f in images if f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif']]
            structure['contexts'][ctx_dir.name] = {
                'path': str(ctx_dir),
                'image_count': len(image_files),
                'images': [f.name for f in image_files]
            }
            structure['statistics']['by_context'][ctx_dir.name] = len(image_files)
            structure['statistics']['total_images'] += len(image_files)
        
        # Phân tích thư mục optimized
        if (self.base_path / 'optimized').exists():
            for cat in self.categories:
                cat_path = self.base_path / 'optimized' / cat
                if cat_path.exists():
                    images = list(cat_path.glob('**/*.*'))
                    image_files = [f for f in images if f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif']]
                    structure['optimized'][cat] = len(image_files)
                    structure['statistics']['by_category'][cat] = len(image_files)
        
        return structure
    
    def map_context_to_events(self) -> Dict:
        """Ánh xạ thư mục context tới các sự kiện gợi ý"""
        mapping = {
            'donamdihoc': {
                'event': 'học tập',
                'contexts': ['hoc'],
                'formality': 'informal'
            },
            'donamdichoi': {
                'event': 'đi chơi',
                'contexts': ['choi'],
                'formality': 'informal'
            },
            'donamdilam': {
                'event': 'công sở',
                'contexts': ['lam'],
                'formality': 'formal'
            },
            'donamdicuoi': {
                'event': 'đám cưới',
                'contexts': ['tiec'],
                'formality': 'formal'
            },
            'donudichoi': {
                'event': 'đi chơi',
                'contexts': ['choi'],
                'formality': 'informal'
            },
            'donudicuoi': {
                'event': 'tiệc',
                'contexts': ['tiec'],
                'formality': 'formal'
            },
            'donudihoc': {
                'event': 'học tập',
                'contexts': ['hoc'],
                'formality': 'informal'
            },
            'donudilam': {
                'event': 'công sở',
                'contexts': ['lam'],
                'formality': 'formal'
            }
        }
        return mapping
    
    def categorize_image(self, image_name: str) -> Tuple[str, str]:
        """
        Phân loại ảnh dựa trên tên file
        Return: (category, subcategory)
        """
        name_lower = image_name.lower()
        
        # Phân loại dựa trên từ khóa trong tên file
        if any(word in name_lower for word in ['top', 'shirt', 'blouse', 'blazer', 'áo']):
            return 'tops', self._infer_subcategory_tops(name_lower)
        elif any(word in name_lower for word in ['bottom', 'pant', 'jean', 'skirt', 'quần', 'váy']):
            return 'bottoms', self._infer_subcategory_bottoms(name_lower)
        elif any(word in name_lower for word in ['shoe', 'heel', 'sneaker', 'giày']):
            return 'shoes', self._infer_subcategory_shoes(name_lower)
        elif any(word in name_lower for word in ['acc', 'jewelry', 'necklace', 'belt', 'phụ kiện']):
            return 'accessories', self._infer_subcategory_accessories(name_lower)
        else:
            return 'unknown', 'unknown'
    
    @staticmethod
    def _infer_subcategory_tops(name: str) -> str:
        if 'blouse' in name or 'sơ mi' in name:
            return 'áo sơ mi'
        elif 'blazer' in name or 'khoác' in name:
            return 'áo khoác'
        elif 'camisole' in name or 'hai dây' in name:
            return 'áo hai dây'
        elif 'sweater' in name or 'len' in name:
            return 'áo len'
        return 'áo thun'
    
    @staticmethod
    def _infer_subcategory_bottoms(name: str) -> str:
        if 'jean' in name or 'jeans' in name:
            return 'quần jean'
        elif 'pant' in name or 'tây' in name:
            return 'quần tây'
        elif 'skirt' in name or 'váy' in name:
            return 'váy'
        return 'quần âu'
    
    @staticmethod
    def _infer_subcategory_shoes(name: str) -> str:
        if 'heel' in name:
            return 'giày cao gót'
        elif 'sneaker' in name or 'thể thao' in name:
            return 'giày thể thao'
        elif 'formal' in name or 'tây' in name:
            return 'giày tây'
        elif 'boot' in name:
            return 'boots'
        return 'sandal'
    
    @staticmethod
    def _infer_subcategory_accessories(name: str) -> str:
        if 'necklace' in name or 'chain' in name:
            return 'dây chuyền'
        elif 'belt' in name:
            return 'thắt lưng'
        elif 'bag' in name or 'túi' in name:
            return 'túi xách'
        elif 'glass' in name or 'kính' in name:
            return 'kính mắt'
        return 'phụ kiện'
    
    def generate_csv_entries(self) -> pd.DataFrame:
        """Tạo entries CSV từ ảnh hiện tại"""
        entries = []
        image_id_counter = 100
        
        context_mapping = self.map_context_to_events()
        
        for context_dir in self.base_path.iterdir():
            if not context_dir.is_dir() or context_dir.name in ['optimized', 'context_mapping']:
                continue
            
            context_key = context_dir.name
            context_info = context_mapping.get(context_key, {})
            event = context_info.get('event', 'unknown')
            formality = context_info.get('formality', 'any')
            
            # Lấy tất cả ảnh trong thư mục
            for img_file in context_dir.glob('**/*.*'):
                if img_file.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif']:
                    category, subcategory = self.categorize_image(img_file.name)
                    
                    entries.append({
                        'item_id': f'{image_id_counter:03d}',
                        'category': category,
                        'subcategory': subcategory,
                        'color': self._infer_color(img_file.name),
                        'style': self._infer_style(img_file.name),
                        'formality': formality,
                        'formality_score': 0.8 if formality == 'formal' else 0.3,
                        'season': 'all',
                        'suitable_events': event,
                        'image_path': f'frontend/images/{context_key}/{img_file.name}',
                        'brand': 'Outfit',
                        'price': 0.00,
                        'material': 'unknown',
                        'size': 'M',
                        'popularity': 75
                    })
                    image_id_counter += 1
        
        return pd.DataFrame(entries)
    
    @staticmethod
    def _infer_color(filename: str) -> str:
        """Suy ra màu từ tên file"""
        colors = {
            'white': 'Trắng', 'black': 'Đen', 'red': 'Đỏ', 'blue': 'Xanh',
            'navy': 'Xanh đậm', 'grey': 'Xám', 'gray': 'Xám', 'beige': 'Kem',
            'trắng': 'Trắng', 'đen': 'Đen', 'đỏ': 'Đỏ', 'xanh': 'Xanh'
        }
        filename_lower = filename.lower()
        for key, value in colors.items():
            if key in filename_lower:
                return value
        return 'Mixed'
    
    @staticmethod
    def _infer_style(filename: str) -> str:
        """Suy ra style từ tên file"""
        styles = {
            'casual': 'Thoải mái', 'formal': 'Lịch sự', 'classic': 'Cổ điển',
            'sporty': 'Năng động', 'elegant': 'Sang trọng', 'chic': 'Thời trang'
        }
        filename_lower = filename.lower()
        for key, value in styles.items():
            if key in filename_lower:
                return value
        return 'Modern'
    
    def print_statistics(self):
        """In thống kê cấu trúc ảnh"""
        stats = self.analyze_image_structure()
        
        print("\n" + "="*60)
        print("📊 THỐNG KÊ CẤU TRÚC HÌNH ẢNH OUTFIT")
        print("="*60)
        print(f"\n📁 Tổng số ảnh: {stats['statistics']['total_images']}")
        
        print("\n📂 Ảnh theo context (event):")
        for context, count in stats['statistics']['by_context'].items():
            print(f"   - {context}: {count} ảnh")
        
        print("\n📂 Ảnh theo danh mục (optimized):")
        for category, count in stats['statistics']['by_category'].items():
            print(f"   - {category}: {count} ảnh")
        
        print("\n🔗 Ánh xạ Context → Events:")
        mapping = self.map_context_to_events()
        for ctx, info in mapping.items():
            print(f"   - {ctx} → {info['event']} ({info['formality']})")
        
        print("\n" + "="*60 + "\n")


def main():
    """Hàm chính - chạy phân tích"""
    manager = ImageManager()
    manager.print_statistics()
    
    # Tạo DataFrame từ ảnh
    df = manager.generate_csv_entries()
    print("\n✅ Tạo được", len(df), "entries từ hình ảnh")
    print("\nMẫu entries:")
    print(df.head().to_string(index=False))
    
    # Lưu vào CSV
    output_path = 'data/processed/cleaned_data_optimized.csv'
    df.to_csv(output_path, index=False, encoding='utf-8')
    print(f"\n💾 Đã lưu vào: {output_path}")


if __name__ == '__main__':
    main()
