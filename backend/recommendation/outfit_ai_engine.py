"""
Outfit AI Engine - Hệ thống AI thực sự cho gợi ý trang phục
Sử dụng Machine Learning để học và chấm điểm % phù hợp

Features:
- TF-IDF vectorization cho text features
- Cosine similarity tính độ tương đồng
- User preference learning
- Explainable AI scoring
- Model persistence (save/load)
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Optional, Tuple, Any
from dataclasses import dataclass, field
import json
import os
import pickle
from datetime import datetime
import hashlib

# Machine Learning imports
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    from sklearn.preprocessing import LabelEncoder, MinMaxScaler, StandardScaler
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.cluster import KMeans
    from sklearn.decomposition import PCA
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    print("⚠️ scikit-learn not installed. Using rule-based fallback.")


@dataclass
class OutfitFeatureVector:
    """Feature vector representation của một outfit"""
    category_vec: np.ndarray = None
    color_vec: np.ndarray = None
    style_vec: np.ndarray = None
    material_vec: np.ndarray = None
    event_vec: np.ndarray = None
    combined_vec: np.ndarray = None
    
    def to_flat(self) -> np.ndarray:
        """Flatten all vectors to single array"""
        vectors = [v for v in [self.category_vec, self.color_vec, self.style_vec, 
                               self.material_vec, self.event_vec] if v is not None]
        if not vectors:
            return np.array([])
        return np.concatenate(vectors)


@dataclass  
class UserPreferenceProfile:
    """Profile học từ tương tác người dùng"""
    color_weights: Dict[str, float] = field(default_factory=dict)
    style_weights: Dict[str, float] = field(default_factory=dict)
    material_weights: Dict[str, float] = field(default_factory=dict)
    category_weights: Dict[str, float] = field(default_factory=dict)
    price_range_preference: Dict[str, float] = field(default_factory=dict)
    
    # Event-specific preferences
    event_preferences: Dict[str, Dict] = field(default_factory=dict)
    
    # Learning history
    interaction_count: int = 0
    favorite_outfit_ids: List[str] = field(default_factory=list)
    last_updated: str = ""
    
    def to_dict(self) -> Dict:
        return {
            'color_weights': self.color_weights,
            'style_weights': self.style_weights,
            'material_weights': self.material_weights,
            'category_weights': self.category_weights,
            'price_range_preference': self.price_range_preference,
            'event_preferences': self.event_preferences,
            'interaction_count': self.interaction_count,
            'favorite_outfit_ids': self.favorite_outfit_ids,
            'last_updated': self.last_updated
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'UserPreferenceProfile':
        return cls(
            color_weights=data.get('color_weights', {}),
            style_weights=data.get('style_weights', {}),
            material_weights=data.get('material_weights', {}),
            category_weights=data.get('category_weights', {}),
            price_range_preference=data.get('price_range_preference', {}),
            event_preferences=data.get('event_preferences', {}),
            interaction_count=data.get('interaction_count', 0),
            favorite_outfit_ids=data.get('favorite_outfit_ids', []),
            last_updated=data.get('last_updated', '')
        )


class OutfitAIEngine:
    """
    AI Engine thực sự cho gợi ý và chấm điểm outfit
    
    Scoring Algorithm:
    1. Context Match Score (30%) - Outfit phù hợp với sự kiện
    2. Feature Quality Score (25%) - Chất lượng features (màu, style, material)
    3. User Preference Score (25%) - Học từ tương tác người dùng
    4. Ensemble ML Score (20%) - Từ trained ML models
    """
    
    VERSION = "2.0.0"
    
    def __init__(self, model_dir: str = None, data_path: str = None):
        self.model_dir = model_dir or os.path.dirname(__file__)
        self.data_path = data_path
        
        # Data
        self.df = None
        self.outfit_count = 0
        
        # TF-IDF Vectorizers
        self.tfidf_combined = None  # Main vectorizer for combined text
        self.tfidf_style = None     # Style-specific vectorizer
        self.tfidf_event = None     # Event-specific vectorizer
        
        # Feature matrices
        self.outfit_vectors = None  # TF-IDF vectors for all outfits
        self.outfit_features = None # Combined feature matrix
        
        # Encoders and scalers
        self.label_encoders = {}
        self.scaler = None
        
        # ML Models
        self.clustering_model = None
        self.scoring_model = None
        self.outfit_clusters = None
        
        # User preference learning
        self.user_profile = UserPreferenceProfile()
        
        # Context knowledge base (học từ data)
        self.event_feature_importance = {}
        self.color_event_scores = {}
        self.style_event_scores = {}
        self.material_event_scores = {}
        
        # State
        self.is_trained = False
        self.training_timestamp = None
        
        # Load data and train if path provided
        if data_path and os.path.exists(data_path):
            self.load_data(data_path)
            self.train()
    
    def load_data(self, data_path: str) -> bool:
        """Load và preprocess data"""
        try:
            self.df = pd.read_csv(data_path)
            self._preprocess_data()
            self.outfit_count = len(self.df)
            print(f"✅ Loaded {self.outfit_count} outfits from {data_path}")
            return True
        except Exception as e:
            print(f"❌ Error loading data: {e}")
            return False
    
    def _preprocess_data(self):
        """Tiền xử lý và chuẩn hóa dữ liệu"""
        if self.df is None or self.df.empty:
            return
        
        # Chuẩn hóa text columns
        text_cols = ['category', 'subcategory', 'color', 'style', 
                     'formality', 'gender', 'suitable_events', 'material']
        
        for col in text_cols:
            if col in self.df.columns:
                self.df[col] = self.df[col].fillna('').astype(str).str.lower().str.strip()
        
        # Chuẩn hóa numerical
        if 'popularity' in self.df.columns:
            self.df['popularity'] = pd.to_numeric(self.df['popularity'], errors='coerce').fillna(50)
        else:
            self.df['popularity'] = 50
            
        if 'price' in self.df.columns:
            self.df['price'] = pd.to_numeric(self.df['price'], errors='coerce').fillna(50)
        else:
            self.df['price'] = 50
        
        # Tạo combined text features
        self.df['text_features'] = (
            self.df['category'].fillna('') + ' ' +
            self.df['subcategory'].fillna('') + ' ' +
            self.df['color'].fillna('') + ' ' +
            self.df['style'].fillna('') + ' ' +
            self.df['material'].fillna('') + ' ' +
            self.df['suitable_events'].fillna('')
        )
        
        # Tạo event-specific text
        self.df['event_style_text'] = (
            self.df['suitable_events'].fillna('') + ' ' +
            self.df['style'].fillna('') + ' ' +
            self.df['formality'].fillna('')
        )
    
    def train(self) -> bool:
        """Train tất cả AI models"""
        if self.df is None or self.df.empty:
            print("❌ No data to train")
            return False
        
        if not SKLEARN_AVAILABLE:
            print("⚠️ scikit-learn not available, using rule-based only")
            self._build_rule_knowledge()
            self.is_trained = True
            return True
        
        try:
            print("🤖 Training AI Engine...")
            
            # 1. Train TF-IDF Vectorizers
            self._train_tfidf_vectorizers()
            
            # 2. Build feature matrices
            self._build_feature_matrices()
            
            # 3. Train clustering
            self._train_clustering()
            
            # 4. Train scoring model
            self._train_scoring_model()
            
            # 5. Build knowledge base từ data
            self._build_knowledge_base()
            
            self.is_trained = True
            self.training_timestamp = datetime.now().isoformat()
            print(f"✅ AI Engine trained successfully! {self.outfit_count} outfits")
            return True
            
        except Exception as e:
            print(f"❌ Training error: {e}")
            self._build_rule_knowledge()
            self.is_trained = True
            return False
    
    def _train_tfidf_vectorizers(self):
        """Train TF-IDF vectorizers"""
        # Combined vectorizer
        self.tfidf_combined = TfidfVectorizer(
            max_features=150,
            ngram_range=(1, 2),
            min_df=1,
            stop_words=None
        )
        self.outfit_vectors = self.tfidf_combined.fit_transform(self.df['text_features'])
        
        # Style vectorizer  
        self.tfidf_style = TfidfVectorizer(
            max_features=50,
            ngram_range=(1, 2)
        )
        style_text = self.df['style'].fillna('') + ' ' + self.df['color'].fillna('')
        self.tfidf_style.fit_transform(style_text)
        
        # Event vectorizer
        self.tfidf_event = TfidfVectorizer(
            max_features=50,
            ngram_range=(1, 2)
        )
        self.tfidf_event.fit_transform(self.df['event_style_text'])
        
        print(f"  📊 TF-IDF: {self.outfit_vectors.shape[1]} combined features")
    
    def _build_feature_matrices(self):
        """Build combined feature matrix"""
        # TF-IDF dense
        tfidf_dense = self.outfit_vectors.toarray()
        
        # Label encode categorical
        cat_features = []
        for col in ['category', 'gender', 'formality']:
            if col in self.df.columns:
                le = LabelEncoder()
                encoded = le.fit_transform(self.df[col].fillna('unknown'))
                self.label_encoders[col] = le
                cat_features.append(encoded.reshape(-1, 1))
        
        # Numerical features
        self.scaler = MinMaxScaler()
        num_cols = ['price', 'popularity']
        available_num = [c for c in num_cols if c in self.df.columns]
        num_features = self.scaler.fit_transform(self.df[available_num].values)
        
        # Combine all features
        all_features = [tfidf_dense]
        if cat_features:
            all_features.append(np.hstack(cat_features))
        all_features.append(num_features)
        
        self.outfit_features = np.hstack(all_features)
        print(f"  📈 Feature matrix: {self.outfit_features.shape}")
    
    def _train_clustering(self):
        """Train clustering để nhóm outfits tương tự"""
        n_clusters = min(8, max(2, len(self.df) // 10))
        
        self.clustering_model = KMeans(
            n_clusters=n_clusters,
            random_state=42,
            n_init=10
        )
        self.outfit_clusters = self.clustering_model.fit_predict(self.outfit_features)
        self.df['cluster'] = self.outfit_clusters
        print(f"  🎯 Clustering: {n_clusters} clusters")
    
    def _train_scoring_model(self):
        """Train scoring model based on popularity"""
        # Tạo labels dựa trên popularity
        pop_threshold = self.df['popularity'].median()
        y_labels = (self.df['popularity'] > pop_threshold).astype(int)
        
        if len(np.unique(y_labels)) > 1:
            self.scoring_model = GradientBoostingClassifier(
                n_estimators=50,
                max_depth=5,
                random_state=42
            )
            self.scoring_model.fit(self.outfit_features, y_labels)
            print("  🎓 Scoring model trained")
        else:
            print("  ⚠️ Not enough variety for scoring model")
    
    def _build_knowledge_base(self):
        """Build knowledge base từ analysis data"""
        # Phân tích event -> features relationship
        events = ['wedding', 'party', 'business', 'casual', 'concert', 'gala',
                  'đi tiệc', 'đi làm', 'đi chơi', 'đi học']
        
        for event in events:
            event_mask = self.df['suitable_events'].str.contains(event, na=False, case=False)
            event_df = self.df[event_mask]
            
            if len(event_df) > 0:
                # Color frequencies
                self.color_event_scores[event] = event_df['color'].value_counts(normalize=True).to_dict()
                # Style frequencies  
                self.style_event_scores[event] = event_df['style'].value_counts(normalize=True).to_dict()
                # Material frequencies
                self.material_event_scores[event] = event_df['material'].value_counts(normalize=True).to_dict()
        
        print(f"  📚 Knowledge base: {len(self.color_event_scores)} events analyzed")
    
    def _build_rule_knowledge(self):
        """Build rule-based knowledge khi không có sklearn"""
        # Event -> style compatibility
        self.style_event_scores = {
            'đi tiệc': {'sang trọng': 1.0, 'thanh lịch': 0.9, 'quyến rũ': 0.85, 'lịch sự': 0.8},
            'đi làm': {'chuyên nghiệp': 1.0, 'lịch sự': 0.9, 'thanh lịch': 0.85},
            'đi chơi': {'năng động': 1.0, 'thoải mái': 0.95, 'trẻ trung': 0.9},
            'đi học': {'đơn giản': 1.0, 'gọn gàng': 0.95, 'năng động': 0.9}
        }
        
        self.color_event_scores = {
            'đi tiệc': {'đen': 1.0, 'đỏ': 0.95, 'xanh navy': 0.9, 'trắng': 0.85},
            'đi làm': {'đen': 1.0, 'trắng': 0.95, 'xám': 0.9, 'xanh navy': 0.85},
            'đi chơi': {'trắng': 1.0, 'xanh': 0.95, 'hồng': 0.9, 'đen': 0.85},
            'đi học': {'trắng': 1.0, 'đen': 0.95, 'xám': 0.9, 'navy': 0.85}
        }
    
    # ==================== SCORING METHODS ====================
    
    def calculate_match_score(
        self, 
        outfit: Dict,
        event: str,
        gender: str = '',
        user_preferences: Dict = None
    ) -> Tuple[int, Dict, str]:
        """
        Tính điểm phù hợp % thực sự dựa trên AI
        
        Returns:
            Tuple[score, score_breakdown, ai_reason]
        """
        breakdown = {}
        
        # 1. Context Match Score (30%) - Outfit phù hợp với sự kiện
        context_score = self._calculate_context_score(outfit, event, gender)
        breakdown['context_match'] = round(context_score, 1)
        
        # 2. Feature Quality Score (25%) - Chất lượng features
        feature_score = self._calculate_feature_quality_score(outfit, event)
        breakdown['feature_quality'] = round(feature_score, 1)
        
        # 3. User Preference Score (25%) - Từ học người dùng
        user_score = self._calculate_user_preference_score(outfit, event, user_preferences)
        breakdown['user_preference'] = round(user_score, 1)
        
        # 4. ML Ensemble Score (20%) - Từ ML models
        ml_score = self._calculate_ml_score(outfit)
        breakdown['ml_ensemble'] = round(ml_score, 1)
        
        # Tổng hợp với trọng số
        total_score = (
            context_score * 0.30 +
            feature_score * 0.25 +
            user_score * 0.25 +
            ml_score * 0.20
        )
        
        # Convert to percentage - tăng điểm nhưng giữ dưới 90%
        # Công thức: min(89, max(55, total_score + 15))
        final_score = int(min(89, max(55, total_score + 15)))
        breakdown['total'] = final_score
        
        # Generate AI reason
        ai_reason = self._generate_ai_reason(outfit, event, breakdown)
        
        return final_score, breakdown, ai_reason
    
    def _calculate_context_score(self, outfit: Dict, event: str, gender: str) -> float:
        """Tính điểm context - outfit phù hợp sự kiện/giới tính"""
        score = 50.0  # Baseline
        
        event_lower = event.lower().strip()
        suitable_events = str(outfit.get('suitable_events', '')).lower()
        
        # Event match
        if event_lower in suitable_events:
            score += 35  # Direct match
        else:
            # Check related events
            event_relations = {
                'đi tiệc': ['wedding', 'party', 'gala', 'tiệc', 'đám cưới'],
                'đi làm': ['business', 'office', 'work', 'công sở'],
                'đi chơi': ['casual', 'party', 'concert', 'date'],
                'đi học': ['casual', 'school', 'học']
            }
            related = event_relations.get(event_lower, [])
            if any(r in suitable_events for r in related):
                score += 25
            else:
                score += 5
        
        # Gender match
        outfit_gender = str(outfit.get('gender', '')).lower()
        gender_lower = gender.lower().strip() if gender else ''
        
        if not gender_lower or outfit_gender == 'any' or outfit_gender == '':
            score += 10
        elif outfit_gender == gender_lower:
            score += 15
        else:
            score -= 10  # Gender mismatch
        
        return min(100, max(0, score))
    
    def _calculate_feature_quality_score(self, outfit: Dict, event: str) -> float:
        """Tính điểm chất lượng features dựa trên knowledge base"""
        scores = []
        event_lower = event.lower().strip()
        
        # Color score from learned knowledge
        color = str(outfit.get('color', '')).lower()
        color_knowledge = self.color_event_scores.get(event_lower, {})
        color_score = color_knowledge.get(color, 0.5) * 100
        scores.append(color_score)
        
        # Style score
        style = str(outfit.get('style', '')).lower()
        style_knowledge = self.style_event_scores.get(event_lower, {})
        style_score = style_knowledge.get(style, 0.5) * 100
        scores.append(style_score)
        
        # Material score
        material = str(outfit.get('material', '')).lower()
        material_knowledge = self.material_event_scores.get(event_lower, {})
        material_score = material_knowledge.get(material, 0.6) * 100
        scores.append(material_score)
        
        # Formality match
        formality = str(outfit.get('formality', '')).lower()
        formal_events = ['đi tiệc', 'đi làm', 'wedding', 'business', 'gala']
        is_formal_event = any(e in event_lower for e in formal_events)
        is_formal_outfit = 'formal' in formality
        
        if is_formal_event == is_formal_outfit:
            scores.append(90)
        else:
            scores.append(50)
        
        return np.mean(scores) if scores else 50.0
    
    def _calculate_user_preference_score(
        self, 
        outfit: Dict, 
        event: str,
        user_preferences: Dict = None
    ) -> float:
        """Tính điểm dựa trên học từ người dùng"""
        if not user_preferences or self.user_profile.interaction_count < 3:
            # Chưa đủ dữ liệu học -> trả về neutral
            return 70.0
        
        scores = []
        event_lower = event.lower()
        
        # Color preference
        color = str(outfit.get('color', '')).lower()
        color_weights = self.user_profile.color_weights or {}
        if color in color_weights:
            # Normalize to 0-100 scale
            max_weight = max(color_weights.values()) if color_weights else 1
            color_pref_score = (color_weights[color] / max_weight) * 100
            scores.append(color_pref_score)
        
        # Style preference
        style = str(outfit.get('style', '')).lower()
        style_weights = self.user_profile.style_weights or {}
        if style in style_weights:
            max_weight = max(style_weights.values()) if style_weights else 1
            style_pref_score = (style_weights[style] / max_weight) * 100
            scores.append(style_pref_score)
        
        # Material preference
        material = str(outfit.get('material', '')).lower()
        material_weights = self.user_profile.material_weights or {}
        if material in material_weights:
            max_weight = max(material_weights.values()) if material_weights else 1
            material_pref_score = (material_weights[material] / max_weight) * 100
            scores.append(material_pref_score)
        
        # Price range preference
        price = outfit.get('price', 50)
        price_range = self._get_price_range(price)
        price_prefs = self.user_profile.price_range_preference or {}
        if price_range in price_prefs:
            max_weight = max(price_prefs.values()) if price_prefs else 1
            price_pref_score = (price_prefs[price_range] / max_weight) * 100
            scores.append(price_pref_score)
        
        return np.mean(scores) if scores else 70.0
    
    def _calculate_ml_score(self, outfit: Dict) -> float:
        """Tính điểm từ ML models"""
        if not SKLEARN_AVAILABLE or self.tfidf_combined is None:
            return self._fallback_ml_score(outfit)
        
        try:
            # Tạo text features cho outfit
            text = ' '.join([
                str(outfit.get('category', '')),
                str(outfit.get('subcategory', '')),
                str(outfit.get('color', '')),
                str(outfit.get('style', '')),
                str(outfit.get('material', '')),
                str(outfit.get('suitable_events', ''))
            ]).lower()
            
            # Transform với TF-IDF
            outfit_vector = self.tfidf_combined.transform([text])
            
            # Tính similarity với top outfits trong data
            if self.outfit_vectors is not None:
                similarities = cosine_similarity(outfit_vector, self.outfit_vectors).flatten()
                top_similarity = np.max(similarities) if len(similarities) > 0 else 0.5
                
                # Nếu có scoring model
                if self.scoring_model is not None and self.outfit_features is not None:
                    # Find most similar outfit in training data
                    most_similar_idx = np.argmax(similarities)
                    if most_similar_idx < len(self.outfit_features):
                        features = self.outfit_features[most_similar_idx].reshape(1, -1)
                        ml_prob = self.scoring_model.predict_proba(features)[0, 1]
                        return (top_similarity * 50 + ml_prob * 50)
                
                return top_similarity * 100
            
            return 70.0
            
        except Exception as e:
            return self._fallback_ml_score(outfit)
    
    def _fallback_ml_score(self, outfit: Dict) -> float:
        """Fallback scoring khi không có ML"""
        popularity = outfit.get('popularity', 50)
        return min(100, max(0, popularity))
    
    def _get_price_range(self, price: float) -> str:
        """Phân loại khoảng giá"""
        if price <= 50:
            return 'budget'
        elif price <= 100:
            return 'medium'
        elif price <= 200:
            return 'premium'
        return 'luxury'
    
    def _generate_ai_reason(self, outfit: Dict, event: str, breakdown: Dict) -> str:
        """Generate lý do AI dựa trên phân tích thực sự"""
        reasons = []
        
        # Xác định điểm mạnh nhất
        score_items = [
            ('context_match', 'Phù hợp sự kiện'),
            ('feature_quality', 'Chất lượng outfit'),
            ('user_preference', 'Phù hợp sở thích'),
            ('ml_ensemble', 'AI đánh giá cao')
        ]
        
        best_score = max(breakdown.get(k, 0) for k, _ in score_items)
        best_items = [(k, v) for k, v in score_items if breakdown.get(k, 0) == best_score]
        
        if best_items:
            _, reason_text = best_items[0]
            reasons.append(reason_text)
        
        # Thêm chi tiết
        total = breakdown.get('total', 0)
        if total >= 90:
            reasons.append(f"Xuất sắc cho {event}")
        elif total >= 80:
            reasons.append(f"Rất phù hợp")
        elif total >= 70:
            reasons.append(f"Phù hợp tốt")
        elif total >= 60:
            reasons.append(f"Khá phù hợp")
        else:
            reasons.append(f"Có thể cân nhắc")
        
        return reasons[0] if reasons else f"Phù hợp cho {event}"
    
    # ==================== USER LEARNING ====================
    
    def learn_from_interaction(
        self, 
        outfit: Dict, 
        interaction_type: str = 'favorite',
        event: str = ''
    ):
        """Học từ tương tác người dùng (favorite, view, click)"""
        weight = {
            'favorite': 5,
            'view_long': 3,
            'click': 2,
            'view': 1
        }.get(interaction_type, 1)
        
        # Update color weights
        color = str(outfit.get('color', '')).lower()
        if color:
            self.user_profile.color_weights[color] = \
                self.user_profile.color_weights.get(color, 0) + weight
        
        # Update style weights
        style = str(outfit.get('style', '')).lower()
        if style:
            self.user_profile.style_weights[style] = \
                self.user_profile.style_weights.get(style, 0) + weight
        
        # Update material weights
        material = str(outfit.get('material', '')).lower()
        if material:
            self.user_profile.material_weights[material] = \
                self.user_profile.material_weights.get(material, 0) + weight
        
        # Update category weights
        category = str(outfit.get('category', '')).lower()
        if category:
            self.user_profile.category_weights[category] = \
                self.user_profile.category_weights.get(category, 0) + weight
        
        # Update price range preference
        price = outfit.get('price', 50)
        price_range = self._get_price_range(price)
        self.user_profile.price_range_preference[price_range] = \
            self.user_profile.price_range_preference.get(price_range, 0) + weight
        
        # Update event-specific preferences
        if event:
            if event not in self.user_profile.event_preferences:
                self.user_profile.event_preferences[event] = {}
            
            event_prefs = self.user_profile.event_preferences[event]
            for key in ['color', 'style', 'material']:
                val = str(outfit.get(key, '')).lower()
                if val:
                    event_prefs[val] = event_prefs.get(val, 0) + weight
        
        # Track favorites
        if interaction_type == 'favorite':
            outfit_id = outfit.get('item_id', '')
            if outfit_id and outfit_id not in self.user_profile.favorite_outfit_ids:
                self.user_profile.favorite_outfit_ids.append(outfit_id)
        
        # Update tracking
        self.user_profile.interaction_count += 1
        self.user_profile.last_updated = datetime.now().isoformat()
        
        print(f"🧠 AI Learned: {interaction_type} - {outfit.get('name', 'outfit')} | {color}, {style}")
    
    def unlearn_from_interaction(self, outfit: Dict, event: str = ''):
        """Hủy học khi unfavorite"""
        weight = 3  # Giảm bớt
        
        color = str(outfit.get('color', '')).lower()
        if color and color in self.user_profile.color_weights:
            self.user_profile.color_weights[color] = max(0, 
                self.user_profile.color_weights[color] - weight)
        
        style = str(outfit.get('style', '')).lower()
        if style and style in self.user_profile.style_weights:
            self.user_profile.style_weights[style] = max(0,
                self.user_profile.style_weights[style] - weight)
        
        # Remove from favorites
        outfit_id = outfit.get('item_id', '')
        if outfit_id in self.user_profile.favorite_outfit_ids:
            self.user_profile.favorite_outfit_ids.remove(outfit_id)
    
    # ==================== RECOMMENDATION ====================
    
    def recommend(
        self,
        gender: str,
        event: str,
        formality: str = 'any',
        top_n: int = 24,
        user_preferences: Dict = None
    ) -> List[Dict]:
        """
        Gợi ý outfits với AI scoring thực sự
        """
        if self.df is None or self.df.empty:
            return []
        
        # Filter by criteria
        gender_lower = gender.lower().strip() if gender else ''
        event_lower = event.lower().strip() if event else ''
        
        mask = pd.Series([True] * len(self.df))
        
        if gender_lower:
            gender_mask = (
                (self.df['gender'] == gender_lower) | 
                (self.df['gender'] == 'any') | 
                (self.df['gender'] == '')
            )
            mask = mask & gender_mask
        
        if event_lower:
            event_mask = self.df['suitable_events'].str.contains(event_lower, na=False, case=False)
            # Nếu không có exact match, lấy tất cả
            if event_mask.sum() == 0:
                event_mask = pd.Series([True] * len(self.df))
            mask = mask & event_mask
        
        filtered_df = self.df[mask]
        
        if filtered_df.empty:
            # Fallback: lấy tất cả theo gender
            filtered_df = self.df
        
        # Calculate AI scores
        results = []
        for idx, row in filtered_df.iterrows():
            outfit = row.to_dict()
            
            ai_score, breakdown, ai_reason = self.calculate_match_score(
                outfit, event, gender, user_preferences
            )
            
            outfit['aiScore'] = ai_score
            outfit['scoreBreakdown'] = breakdown
            outfit['aiReason'] = ai_reason
            results.append(outfit)
        
        # Sort by AI score
        results.sort(key=lambda x: x['aiScore'], reverse=True)
        
        return results[:top_n]
    
    # ==================== PERSISTENCE ====================
    
    def save_model(self, filepath: str = None):
        """Save trained model and user profile"""
        if filepath is None:
            filepath = os.path.join(self.model_dir, 'outfit_ai_engine.pkl')
        
        model_data = {
            'version': self.VERSION,
            'tfidf_combined': self.tfidf_combined,
            'outfit_vectors': self.outfit_vectors,
            'outfit_features': self.outfit_features,
            'label_encoders': self.label_encoders,
            'scaler': self.scaler,
            'clustering_model': self.clustering_model,
            'scoring_model': self.scoring_model,
            'color_event_scores': self.color_event_scores,
            'style_event_scores': self.style_event_scores,
            'material_event_scores': self.material_event_scores,
            'user_profile': self.user_profile.to_dict(),
            'is_trained': self.is_trained,
            'training_timestamp': self.training_timestamp
        }
        
        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)
        print(f"✅ Model saved to {filepath}")
    
    def load_model(self, filepath: str = None) -> bool:
        """Load trained model"""
        if filepath is None:
            filepath = os.path.join(self.model_dir, 'outfit_ai_engine.pkl')
        
        if not os.path.exists(filepath):
            return False
        
        try:
            with open(filepath, 'rb') as f:
                model_data = pickle.load(f)
            
            self.tfidf_combined = model_data.get('tfidf_combined')
            self.outfit_vectors = model_data.get('outfit_vectors')
            self.outfit_features = model_data.get('outfit_features')
            self.label_encoders = model_data.get('label_encoders', {})
            self.scaler = model_data.get('scaler')
            self.clustering_model = model_data.get('clustering_model')
            self.scoring_model = model_data.get('scoring_model')
            self.color_event_scores = model_data.get('color_event_scores', {})
            self.style_event_scores = model_data.get('style_event_scores', {})
            self.material_event_scores = model_data.get('material_event_scores', {})
            
            user_data = model_data.get('user_profile', {})
            self.user_profile = UserPreferenceProfile.from_dict(user_data)
            
            self.is_trained = model_data.get('is_trained', False)
            self.training_timestamp = model_data.get('training_timestamp')
            
            print(f"✅ Model loaded from {filepath}")
            return True
            
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            return False
    
    def save_user_profile(self, filepath: str = None):
        """Save only user profile"""
        if filepath is None:
            filepath = os.path.join(self.model_dir, 'user_profile.json')
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.user_profile.to_dict(), f, ensure_ascii=False, indent=2)
        print(f"✅ User profile saved")
    
    def load_user_profile(self, filepath: str = None):
        """Load user profile"""
        if filepath is None:
            filepath = os.path.join(self.model_dir, 'user_profile.json')
        
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
            self.user_profile = UserPreferenceProfile.from_dict(data)
            print(f"✅ User profile loaded")
    
    def get_status(self) -> Dict:
        """Get engine status"""
        return {
            'version': self.VERSION,
            'is_trained': self.is_trained,
            'outfit_count': self.outfit_count,
            'sklearn_available': SKLEARN_AVAILABLE,
            'user_interaction_count': self.user_profile.interaction_count,
            'favorite_count': len(self.user_profile.favorite_outfit_ids),
            'training_timestamp': self.training_timestamp,
            'features': {
                'tfidf_enabled': self.tfidf_combined is not None,
                'clustering_enabled': self.clustering_model is not None,
                'scoring_model_enabled': self.scoring_model is not None
            }
        }


# Singleton instance
_ai_engine = None

def get_outfit_ai_engine(data_path: str = None) -> OutfitAIEngine:
    """Get singleton instance"""
    global _ai_engine
    
    if _ai_engine is None:
        _ai_engine = OutfitAIEngine(data_path=data_path)
    
    return _ai_engine
