from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import pandas as pd
import os
import sys
import sqlite3
import requests
from werkzeug.security import generate_password_hash, check_password_hash
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# Thêm thư mục gốc vào đường dẫn để import
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Lấy đường dẫn thư mục gốc của dự án
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

app = Flask(__name__, static_folder=os.path.join(PROJECT_ROOT, 'frontend'), static_url_path='')
CORS(app)  # Bật chia sẻ tài nguyên chéo (CORS) cho frontend

# Tải bộ dữ liệu đã xử lý ngay khi khởi động
try:
    df = pd.read_csv(os.path.join(PROJECT_ROOT, 'data/processed/cleaned_data.csv'))
except Exception as e:
    print(f"Lu y: Khong the tai du lieu: {e}")
    df = pd.DataFrame()

@app.route('/')
def serve_frontend():
    return send_from_directory(app.static_folder, 'index.html')

# ============ AUTHENTICATION API ============
DB_PATH = os.path.join(PROJECT_ROOT, 'data', 'users.db')

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

init_db()

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'status': 'error', 'message': 'Vui lòng điền đầy đủ thông tin'}), 400

    hashed_password = generate_password_hash(password)

    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', (username, email, hashed_password))
        conn.commit()
        conn.close()
        return jsonify({'status': 'success', 'message': 'Đăng ký thành công!'})
    except sqlite3.IntegrityError:
        return jsonify({'status': 'error', 'message': 'Tên đăng nhập hoặc email đã tồn tại'}), 400
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'status': 'error', 'message': 'Vui lòng nhập tên đăng nhập và mật khẩu'}), 400

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT id, username, password FROM users WHERE username = ?', (username,))
    user = c.fetchone()
    conn.close()

    if user and check_password_hash(user[2], password):
        return jsonify({
            'status': 'success',
            'message': 'Đăng nhập thành công!',
            'user': {'id': user[0], 'username': user[1]}
        })
    else:
        return jsonify({'status': 'error', 'message': 'Tên đăng nhập hoặc mật khẩu không đúng'}), 401

# ĐIỀN GOOGLE CLIENT_ID VÀO ĐÂY (Bước 1 bạn vừa copy)
GOOGLE_CLIENT_ID = "300752275426-l4g85u5t9q8sibfa9buhejk6di05cnmu.apps.googleusercontent.com"

@app.route('/api/auth/google', methods=['POST'])
def google_login():
    data = request.get_json() or {}
    token = data.get('token')

    if not token:
        return jsonify({'status': 'error', 'message': 'Không tìm thấy token đăng nhập'}), 400

    try:
        # Xác thực token với Google (kiểm tra token có hợp lệ và được cấp cho ứng dụng của bạn không)
        # Lưu ý: Cần thêm google-auth vào requirements
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), GOOGLE_CLIENT_ID)

        # Lấy thông tin user từ Google
        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', email.split('@')[0])
        
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        # Kiểm tra xem user có trong database chưa
        c.execute('SELECT id, username FROM users WHERE email = ?', (email,))
        user = c.fetchone()
        
        if not user:
            # Tạo tài khoản tự động với pass mặc định (hoặc random hash)
            random_pass = generate_password_hash(os.urandom(24).hex())
            try:
                c.execute('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', (name, email, random_pass))
                user_id = c.lastrowid
                user_name = name
                conn.commit()
            except sqlite3.IntegrityError:
                # Nếu username bị trùng, tự thêm mã số
                unique_name = f"{name}_{str(os.urandom(4).hex())}"
                c.execute('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', (unique_name, email, random_pass))
                user_id = c.lastrowid
                user_name = unique_name
                conn.commit()
        else:
            user_id = user[0]
            user_name = user[1]
            
        conn.close()

        return jsonify({
            'status': 'success',
            'message': 'Đăng nhập bằng Google thành công!',
            'user': {'id': user_id, 'username': user_name, 'email': email, 'auth_provider': 'google'}
        })

    except ValueError as e:
        # Invalid token
        print("Google login error:", e)
        return jsonify({'status': 'error', 'message': 'Token không hợp lệ hoặc đã hết hạn'}), 401
    except Exception as e:
        print("Lỗi server khi đăng nhập Google:", e)
        return jsonify({'status': 'error', 'message': 'Đã xảy ra lỗi hệ thống'}), 500

# ============ AI LEARNING API ============

# AI Engine instance (new improved AI)
ai_engine = None

def get_ai_engine():
    """
    HÀM KHỞI TẠO BỘ NÃO AI (AI ENGINE)
    -----------------------------------
    Mục đích: Lấy ra hoặc khởi tạo bộ não AI chính của hệ thống.
    Cách hoạt động: Áp dụng 'Singleton Pattern' (chỉ tạo 1 lần duy nhất).
    - Nếu AI đã được bật trước đó, nó sẽ lấy lại bộ nhớ cũ ra sử dụng.
    - Nếu AI chưa bật, nó sẽ gọi 'get_outfit_ai_engine' để nạp toàn bộ
      dữ liệu trang phục từ CSV vào trong não bộ AI.
    """
    global ai_engine
    if ai_engine is None:
        try:
            from backend.recommendation.outfit_ai_engine import get_outfit_ai_engine
            data_path = os.path.join(PROJECT_ROOT, 'data/processed/cleaned_data.csv')
            ai_engine = get_outfit_ai_engine(data_path)
        except ImportError as e:
            print(f"Warning: AI Engine not available: {e}")
    return ai_engine

@app.route('/api/ai/learn', methods=['POST'])
def ai_learn():
    """
    CỔNG KẾT NỐI AI HỌC HỎI (LEARNING API)
    --------------------------------------
    Mục đích: Đây là "lớp học" của AI. Mỗi khi người dùng tương tác
    với một bộ trang phục (như bấm Yêu thích, Xem chi tiết, Click), 
    giao diện sẽ gửi dữ liệu về cổng này.
    
    Quy trình: 
    1. Lấy thông tin outfit và loại tương tác từ người dùng gửi lên.
    2. Nạp dữ liệu vào 'engine.learn_from_interaction' để AI lưu
       sở thích này vào User Profile (Hồ sơ người dùng).
    3. Điểm phù hợp trong lần gợi ý sau với màu sắc/kiểu dáng tương tự
       sẽ được hệ thống đánh giá cao hơn.
    """
    try:
        data = request.get_json() or {}
        outfit = data.get('outfit', {})
        interaction_type = data.get('interaction_type', 'view')
        event = data.get('event', '')
        
        engine = get_ai_engine()
        if engine:
            engine.learn_from_interaction(outfit, interaction_type, event)
            
            return jsonify({
                'status': 'success',
                'message': f'AI đã học từ {interaction_type}',
                'profile_stats': {
                    'total_interactions': engine.user_profile.interaction_count,
                    'favorites_count': len(engine.user_profile.favorite_outfit_ids)
                }
            })
        else:
            return jsonify({
                'status': 'warning',
                'message': 'AI Engine not available, learning saved locally'
            })
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/ai/unlearn', methods=['POST'])
def ai_unlearn():
    """API để hủy học khi unfavorite"""
    try:
        data = request.get_json() or {}
        outfit = data.get('outfit', {})
        event = data.get('event', '')
        
        engine = get_ai_engine()
        if engine:
            engine.unlearn_from_interaction(outfit, event)
            return jsonify({
                'status': 'success',
                'message': 'AI đã hủy học outfit này'
            })
        
        return jsonify({
            'status': 'warning',
            'message': 'AI Engine not available'
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/ai/engine/status', methods=['GET'])
def ai_engine_status():
    """Lấy trạng thái AI Engine mới"""
    try:
        engine = get_ai_engine()
        if engine:
            return jsonify({
                'status': 'success',
                'engine_status': engine.get_status()
            })
        return jsonify({
            'status': 'error',
            'message': 'AI Engine not initialized'
        }), 404
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/ai/engine/recommend', methods=['POST'])
def ai_engine_recommend():
    """
    CỔNG KẾT NỐI KHUYÊN DÙNG TRANG PHỤC (RECOMMENDATION API)
    --------------------------------------------------------
    Mục đích: Đây là chức năng quan trọng nhất của hệ thống.
    Nó tiếp nhận yêu cầu từ người dùng (Giới tính, Sự kiện, Phong cách)
    sau đó sử dụng thuật toán AI để phân tích và trả về các kết quả.
    
    Quy trình hoạt động:
    1. Đọc dữ liệu 'giới tính, sự kiện, độ lịch sự' từ giao diện web (giá trị 'top_n' là 
       số lượng sản phẩm tối đa mà AI nên gợi ý, ví dụ: 24).
    2. Trục trích xuất dữ liệu từ AI Engine: 'engine.recommend(...)'. Hàm này sẽ
       vừa đối chiếu dữ liệu quần áo, vừa kết hợp với điểm số đã học hỏi từ User 
       (Color, Style, Material) để xếp hạng trang phục từ cao xuống thấp.
    3. Gom gói danh sách đó (cùng với điểm phân tích) và trả về cho React/JS hiển thị.
    """
    try:
        data = request.get_json() or {}
        
        engine = get_ai_engine()
        if engine:
            recommendations = engine.recommend(
                gender=data.get('gender', ''),
                event=data.get('event', ''),
                formality=data.get('formality', 'any'),
                top_n=data.get('top_n', 24)
            )
            
            return jsonify({
                'status': 'success',
                'recommendations': recommendations,
                'engine_version': engine.VERSION,
                'is_trained': engine.is_trained
            })
        
        # Dự phòng (Fallback) nếu hệ thống mới lỗi
        return jsonify({
            'status': 'fallback',
            'message': 'Đang sử dụng hệ thống gợi ý cũ'
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/ai/engine/save', methods=['POST'])
def ai_engine_save():
    """Lưu model và user profile"""
    try:
        engine = get_ai_engine()
        if engine:
            model_path = os.path.join(PROJECT_ROOT, 'models/outfit_ai_engine.pkl')
            profile_path = os.path.join(PROJECT_ROOT, 'models/user_profile.json')
            
            # Đảm bảo thư mục tồn tại
            os.makedirs(os.path.dirname(model_path), exist_ok=True)
            
            engine.save_model(model_path)
            engine.save_user_profile(profile_path)
            
            return jsonify({
                'status': 'success',
                'message': 'Model and profile saved'
            })
        
        return jsonify({
            'status': 'error',
            'message': 'AI Engine not available'
        }), 404
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
