// AI Outfit Advisor - Hệ thống gợi ý trang phục thông minh
// Sử dụng AI để phân tích và gợi ý outfit phù hợp

// ==========================================
// PHẦN 1: CẤU HÌNH API VÀ ĐƯỜNG DẪN AI
// ==========================================
// Đoạn này dùng để cấu hình tự động tìm đường kết nối
// với máy chủ Flask (Python) ở Backend. Khi nhấn tìm kiếm,
// web sẽ gửi yêu cầu sang đường dẫn AI_API_ENDPOINT này.
const API_BASE_URL = window.location.origin; 
const AI_API_ENDPOINT = `${API_BASE_URL}/api/ai/engine/recommend`;

// Cấu hình thư mục ảnh theo giới tính và sự kiện
// Toast Notification System
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return alert(message);

  const toast = document.createElement('div');
  toast.className = `toast`;
  
  let iconHtml = '';
  switch (type) {
    case 'success':
      iconHtml = '<i class="fas fa-check-circle"></i>';
      break;
    case 'error':
      iconHtml = '<i class="fas fa-exclamation-circle"></i>';
      break;
    default:
      iconHtml = '<i class="fas fa-info-circle"></i>';
  }

  // Tiêu đề dựa trên loại
  const titleMap = {
    'success': 'Thành công!',
    'error': 'Thất bại!',
    'info': 'Thông báo'
  };
  const title = titleMap[type] || 'Thông báo';

  // Format message, chuyển đổi \n thành <br>
  const formattedMessage = message.replace(/\n/g, '<br>');

  toast.innerHTML = `
    <div class="toast-icon ${type}">
      ${iconHtml}
    </div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${formattedMessage}</div>
    </div>
    <button class="toast-close">
      <i class="fas fa-times"></i>
    </button>
  `;

  container.appendChild(toast);

  // Trigger animation after adding to DOM
  setTimeout(() => toast.classList.add('show'), 10);

  // Close functionality
  const closer = toast.querySelector('.toast-close');
  closer.addEventListener('click', () => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => toast.remove());
  });

  // Auto close
  if (duration > 0) {
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
      }
    }, duration);
  }
}

const imageFolders = {
  'nam': {
    'đi học': { folder: 'donamdihoc', prefix: 'Namdihoc', count: 70 },
    'đi chơi': { folder: 'donamdichoi', prefix: 'namdichoi', count: 76 },
    'đi làm': { folder: 'donamdilam', prefix: 'dodilamnam', count: 72, format: '(#).jpg' },
    'đi tiệc': { folder: 'donamdicuoi', prefix: 'donamdamcuoi', count: 78, format: '(#).jpg' }
  },
  'nữ': {
    'đi học': { folder: 'donudihoc', prefix: 'dihocnu', count: 10, altPrefix: 'nudihoc', altStart: 11, altCount: 60 },
    'đi chơi': { folder: 'donudichoi', prefix: 'nudichoi', count: 76, format: '(#).jpg' },
    'đi làm': { folder: 'donudilam', prefix: 'donudilam', count: 76, format: '(#).jpg' },
    'đi tiệc': { folder: 'donudicuoi', prefix: 'donudicuoi', count: 79, format: '(#).jpg' }
  }
};

// Hàm lấy đường dẫn ảnh dựa trên giới tính, sự kiện và index
function getImagePath(gender, event, index) {
  const config = imageFolders[gender]?.[event];
  if (!config) return '../data/images/placeholder.jpg';

  const folder = config.folder;
  let fileName;

  // Xử lý trường hợp có nhiều định dạng tên file (donudihoc)
  if (config.altPrefix && index > config.count) {
    const altIndex = config.altStart + (index - config.count - 1);
    fileName = `${config.altPrefix}${altIndex}.jpg`;
  } else if (config.format === '(#).jpg') {
    fileName = `${config.prefix} (${index}).jpg`;
  } else {
    fileName = `${config.prefix}${index}.jpg`;
  }

  return `../data/images/${folder}/${fileName}`;
}

// Template dữ liệu outfit cơ bản - phân biệt theo giới tính
// === DIAGNOSTIC FUNCTION FOR DEBUGGING ===
function runDiagnostics() {
  console.group('🔍 OUTFIT APP DIAGNOSTICS');

  // Check 1: Verify database loaded
  console.group('1️⃣ Database Check');
  const dbLoaded = typeof outfitDatabase !== 'undefined';
  console.log('✓ outfitDatabase defined:', dbLoaded);
  if (dbLoaded) {
    console.log('✓ Database keys:', Object.keys(outfitDatabase));
    console.log('✓ Total genders:', Object.keys(outfitDatabase).length);

    for (const gender of ['nữ', 'nam']) {
      if (outfitDatabase[gender]) {
        const events = Object.keys(outfitDatabase[gender]);
        console.log(`✓ ${gender} events:`, events);
        for (const event of events) {
          const count = outfitDatabase[gender][event].length;
          console.log(`  • ${event}: ${count} outfits`);
        }
      }
    }
  }
  console.groupEnd();

  // Check 2: Verify getImagePath function works
  console.group('2️⃣ Image Path Check');
  const testPath = getImagePath('nữ', 'đi chơi', 1);
  console.log('✓ Sample path for nữ/đi chơi/1:', testPath);
  console.log('✓ getImagePath function works:', typeof testPath === 'string' && testPath.includes('data/images'));
  console.groupEnd();

  // Check 3: Verify HTML elements exist
  console.group('3️⃣ HTML Elements Check');
  const container = document.getElementById('results');
  console.log('✓ #results container:', !!container);

  const demoBtn = document.getElementById('demo-btn');
  console.log('✓ #demo-btn exists:', !!demoBtn);

  const genderSelect = document.getElementById('gender');
  console.log('✓ #gender select:', !!genderSelect);

  const eventSelect = document.getElementById('event');
  console.log('✓ #event select:', !!eventSelect);

  if (container && window.getComputedStyle) {
    const style = window.getComputedStyle(container);
    console.log('✓ #results display:', style.display);
    console.log('✓ #results visibility:', style.visibility);
    console.log('✓ #results opacity:', style.opacity);
  }
  console.groupEnd();

  // Check 4: Test renderCard function
  console.group('4️⃣ renderCard Function Check');
  try {
    const testItem = {
      id: 1,
      name: 'Test Outfit',
      category: 'Váy',
      color: 'Đen',
      style: 'Casual',
      material: 'Cotton',
      item_id: 'test_outfit_1',
      image_path: '../data/images/placeholder.jpg'
    };
    const testCard = renderCard(testItem);
    console.log('✓ renderCard return type:', testCard?.constructor?.name || typeof testCard);
    console.log('✓ testCard is HTMLElement:', testCard instanceof HTMLElement);
    if (testCard) {
      console.log('✓ Card className:', testCard.className);
      console.log('✓ Card innerHTML length:', testCard.innerHTML.length);
    }
  } catch (err) {
    console.error('✗ renderCard error:', err);
  }
  console.groupEnd();

  // Check 5: Test loadDemo function
  console.group('5️⃣ loadDemo Function Check');
  console.log('✓ loadDemo function type:', typeof loadDemo);
  console.log('Current gender select value:', document.getElementById('gender').value);
  console.log('Current event select value:', document.getElementById('event').value);
  console.groupEnd();

  console.groupEnd();
  console.log('%c✅ Diagnostics Complete! Check console above for details', 'background: #28a745; color: white; padding: 5px 10px; border-radius: 3px;');
}

// Run diagnostics on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, running diagnostics in 1 second...');
    setTimeout(runDiagnostics, 1000);
  });
} else {
  console.log('DOM already ready, running diagnostics...');
  setTimeout(runDiagnostics, 500);
}

// Also make diagnostic available globally
window.diagnostics = runDiagnostics;
window.testRender = function () {
  console.log('Testing renderCard with database outfit...');
  if (window.outfitDatabase && window.outfitDatabase['nữ'] && window.outfitDatabase['nữ']['đi chơi']) {
    const firstOutfit = window.outfitDatabase['nữ']['đi chơi'][0];
    console.log('First outfit:', firstOutfit);

    const outfit = {
      ...firstOutfit,
      item_id: 'test_' + Math.random(),
      image_path: getImagePath('nữ', 'đi chơi', 1)
    };

    console.log('Test outfit with image_path:', outfit);
    const card = renderCard(outfit);
    console.log('Rendered card:', card);

    if (card) {
      const container = document.getElementById('results');
      if (container) {
        container.innerHTML = '';
        container.appendChild(card);
        console.log('✓ Card added to container!');
      }
    }
  }
};
// === END DIAGNOSTICS ===


// Nam: Áo, Quần | Nữ: Đầm, Váy, Áo, Quần
const outfitTemplates = {
  'nam': {
    'đi tiệc': [
      { category: 'Áo', subcategory: 'Áo vest', color: 'Đen', style: 'Lịch sự', material: 'Len cao cấp', popularity: 90 },
      { category: 'Áo', subcategory: 'Áo sơ mi trắng', color: 'Trắng', style: 'Cổ điển', material: 'Cotton', popularity: 90 },
      { category: 'Quần', subcategory: 'Quần tây', color: 'Đen', style: 'Sang trọng', material: 'Len', popularity: 90 },
      { category: 'Áo', subcategory: 'Suit complete', color: 'Xám đậm', style: 'Thanh lịch', material: 'Len Ý', popularity: 88 },
      { category: 'Quần', subcategory: 'Quần âu', color: 'Xám', style: 'Lịch sự', material: 'Polyester', popularity: 86 },
      { category: 'Áo', subcategory: 'Áo ghi-lê', color: 'Xanh navy', style: 'Cổ điển', material: 'Len', popularity: 84 },
      { category: 'Áo', subcategory: 'Áo vest slim fit', color: 'Xanh đen', style: 'Hiện đại', material: 'Len pha', popularity: 90 },
      { category: 'Quần', subcategory: 'Quần tây ống đứng', color: 'Đen', style: 'Cổ điển', material: 'Wool', popularity: 89 },
      { category: 'Áo', subcategory: 'Áo sơ mi đen', color: 'Đen', style: 'Sang trọng', material: 'Cotton lụa', popularity: 87 },
      { category: 'Áo', subcategory: 'Tuxedo', color: 'Đen', style: 'Cao cấp', material: 'Len Ý', popularity: 90 },
      { category: 'Quần', subcategory: 'Quần tây slim', color: 'Xanh navy', style: 'Thanh lịch', material: 'Polyester', popularity: 85 },
      { category: 'Áo', subcategory: 'Áo blazer đôi', color: 'Xám bạc', style: 'Độc đáo', material: 'Len cashmere', popularity: 83 }
    ],
    'đi làm': [
      { category: 'Áo', subcategory: 'Áo sơ mi công sở', color: 'Trắng', style: 'Chuyên nghiệp', material: 'Cotton', popularity: 90 },
      { category: 'Áo', subcategory: 'Áo sơ mi kẻ', color: 'Xanh nhạt', style: 'Năng động', material: 'Cotton', popularity: 88 },
      { category: 'Quần', subcategory: 'Quần tây slim', color: 'Đen', style: 'Hiện đại', material: 'Polyester', popularity: 90 },
      { category: 'Áo', subcategory: 'Áo blazer', color: 'Xám', style: 'Thanh lịch', material: 'Len', popularity: 85 },
      { category: 'Quần', subcategory: 'Quần âu', color: 'Xám đậm', style: 'Chuyên nghiệp', material: 'Cotton', popularity: 82 },
      { category: 'Áo', subcategory: 'Áo polo công sở', color: 'Xanh navy', style: 'Smart casual', material: 'Cotton pique', popularity: 87 },
      { category: 'Quần', subcategory: 'Quần chinos', color: 'Be', style: 'Thanh lịch', material: 'Cotton', popularity: 84 },
      { category: 'Áo', subcategory: 'Áo sơ mi Oxford', color: 'Xanh nhạt', style: 'Cổ điển', material: 'Cotton Oxford', popularity: 86 },
      { category: 'Áo', subcategory: 'Áo cardigan', color: 'Xám', style: 'Nhã nhặn', material: 'Len merino', popularity: 80 },
      { category: 'Quần', subcategory: 'Quần tây regular', color: 'Đen', style: 'Cổ điển', material: 'Wool blend', popularity: 83 }
    ],
    'đi chơi': [
      { category: 'Áo', subcategory: 'Áo thun polo', color: 'Trắng', style: 'Năng động', material: 'Cotton', popularity: 90 },
      { category: 'Áo', subcategory: 'Áo thun basic', color: 'Đen', style: 'Thoải mái', material: 'Cotton', popularity: 90 },
      { category: 'Quần', subcategory: 'Quần jean', color: 'Xanh đậm', style: 'Cá tính', material: 'Denim', popularity: 90 },
      { category: 'Áo', subcategory: 'Áo khoác bomber', color: 'Xanh rêu', style: 'Trẻ trung', material: 'Nylon', popularity: 88 },
      { category: 'Quần', subcategory: 'Quần short', color: 'Kem', style: 'Năng động', material: 'Cotton', popularity: 85 },
      { category: 'Áo', subcategory: 'Áo thun oversize', color: 'Xám', style: 'Streetwear', material: 'Cotton', popularity: 90 },
      { category: 'Quần', subcategory: 'Quần jogger', color: 'Đen', style: 'Thể thao', material: 'Cotton pha', popularity: 87 },
      { category: 'Áo', subcategory: 'Áo hoodie', color: 'Xanh navy', style: 'Trẻ trung', material: 'Cotton fleece', popularity: 89 },
      { category: 'Áo', subcategory: 'Áo thun họa tiết', color: 'Nhiều màu', style: 'Phá cách', material: 'Cotton', popularity: 84 },
      { category: 'Quần', subcategory: 'Quần jean rách', color: 'Xanh nhạt', style: 'Bụi bặm', material: 'Denim', popularity: 86 },
      { category: 'Áo', subcategory: 'Áo khoác denim', color: 'Xanh', style: 'Vintage', material: 'Denim', popularity: 83 },
      { category: 'Quần', subcategory: 'Quần cargo', color: 'Xanh rêu', style: 'Năng động', material: 'Cotton canvas', popularity: 81 }
    ],
    'đi học': [
      { category: 'Áo', subcategory: 'Áo thun basic', color: 'Trắng', style: 'Đơn giản', material: 'Cotton', popularity: 90 },
      { category: 'Áo', subcategory: 'Áo sơ mi casual', color: 'Xanh nhạt', style: 'Gọn gàng', material: 'Cotton', popularity: 85 },
      { category: 'Quần', subcategory: 'Quần kaki', color: 'Be', style: 'Đơn giản', material: 'Cotton', popularity: 82 },
      { category: 'Áo', subcategory: 'Áo hoodie', color: 'Xám', style: 'Trẻ trung', material: 'Cotton', popularity: 88 },
      { category: 'Quần', subcategory: 'Quần jogger', color: 'Đen', style: 'Năng động', material: 'Cotton', popularity: 80 },
      { category: 'Áo', subcategory: 'Áo thun cổ tròn', color: 'Navy', style: 'Cơ bản', material: 'Cotton', popularity: 87 },
      { category: 'Quần', subcategory: 'Quần jean slim', color: 'Xanh đậm', style: 'Gọn gàng', material: 'Denim stretch', popularity: 84 },
      { category: 'Áo', subcategory: 'Áo sweater', color: 'Xám nhạt', style: 'Ấm áp', material: 'Cotton pha', popularity: 83 },
      { category: 'Áo', subcategory: 'Áo polo', color: 'Trắng', style: 'Lịch sự', material: 'Cotton pique', popularity: 81 },
      { category: 'Quần', subcategory: 'Quần short thể thao', color: 'Đen', style: 'Năng động', material: 'Polyester', popularity: 79 }
    ]
  },
  'nữ': {
    'đi tiệc': [
      { category: 'Đầm', subcategory: 'Đầm dạ hội', color: 'Đỏ', style: 'Quyến rũ', material: 'Lụa', popularity: 90 },
      { category: 'Váy', subcategory: 'Váy dạ hội', color: 'Hồng', style: 'Nữ tính', material: 'Voan', popularity: 90 },
      { category: 'Đầm', subcategory: 'Đầm cocktail', color: 'Đen', style: 'Sang trọng', material: 'Satin', popularity: 90 },
      { category: 'Váy', subcategory: 'Váy maxi', color: 'Xanh navy', style: 'Thanh lịch', material: 'Lụa', popularity: 89 },
      { category: 'Đầm', subcategory: 'Đầm ren', color: 'Trắng', style: 'Lãng mạn', material: 'Ren', popularity: 87 },
      { category: 'Váy', subcategory: 'Váy đuôi cá', color: 'Vàng gold', style: 'Lux', material: 'Satin', popularity: 85 },
      { category: 'Đầm', subcategory: 'Đầm sequin', color: 'Bạc', style: 'Lấp lánh', material: 'Sequin', popularity: 90 },
      { category: 'Váy', subcategory: 'Váy xẻ tà', color: 'Đỏ wine', style: 'Gợi cảm', material: 'Velvet', popularity: 90 },
      { category: 'Đầm', subcategory: 'Đầm bodycon', color: 'Đen', style: 'Sexy', material: 'Spandex', popularity: 88 },
      { category: 'Váy', subcategory: 'Váy bèo nhún', color: 'Hồng pastel', style: 'Ngọt ngào', material: 'Chiffon', popularity: 86 },
      { category: 'Đầm', subcategory: 'Đầm off-shoulder', color: 'Trắng ngà', style: 'Thanh thoát', material: 'Organza', popularity: 84 },
      { category: 'Váy', subcategory: 'Váy tulle', color: 'Hồng', style: 'Công chúa', material: 'Tulle', popularity: 82 }
    ],
    'đi làm': [
      { category: 'Đầm', subcategory: 'Đầm công sở', color: 'Đen', style: 'Chuyên nghiệp', material: 'Polyester', popularity: 90 },
      { category: 'Váy', subcategory: 'Chân váy bút chì', color: 'Xám', style: 'Lịch sự', material: 'Cotton', popularity: 90 },
      { category: 'Đầm', subcategory: 'Đầm suông', color: 'Xanh navy', style: 'Thanh lịch', material: 'Len', popularity: 88 },
      { category: 'Váy', subcategory: 'Váy chữ A', color: 'Be', style: 'Nhã nhặn', material: 'Cotton', popularity: 86 },
      { category: 'Đầm', subcategory: 'Đầm vest', color: 'Trắng', style: 'Hiện đại', material: 'Polyester', popularity: 84 },
      { category: 'Váy', subcategory: 'Chân váy midi', color: 'Đen', style: 'Cổ điển', material: 'Tweed', popularity: 89 },
      { category: 'Đầm', subcategory: 'Đầm sơ mi', color: 'Trắng', style: 'Smart casual', material: 'Cotton', popularity: 87 },
      { category: 'Váy', subcategory: 'Váy xếp ly', color: 'Xám nhạt', style: 'Thanh lịch', material: 'Polyester', popularity: 85 },
      { category: 'Đầm', subcategory: 'Đầm ôm body', color: 'Wine', style: 'Quyền lực', material: 'Ponte', popularity: 83 },
      { category: 'Váy', subcategory: 'Chân váy chữ A', color: 'Camel', style: 'Vintage', material: 'Wool blend', popularity: 81 }
    ],
    'đi chơi': [
      { category: 'Đầm', subcategory: 'Đầm hoa', color: 'Nhiều màu', style: 'Tươi tắn', material: 'Cotton', popularity: 90 },
      { category: 'Váy', subcategory: 'Váy ngắn', color: 'Hồng', style: 'Trẻ trung', material: 'Denim', popularity: 90 },
      { category: 'Đầm', subcategory: 'Đầm maxi', color: 'Trắng', style: 'Thoải mái', material: 'Voan', popularity: 90 },
      { category: 'Váy', subcategory: 'Váy xòe', color: 'Đen', style: 'Năng động', material: 'Cotton', popularity: 89 },
      { category: 'Đầm', subcategory: 'Đầm hai dây', color: 'Đỏ', style: 'Quyến rũ', material: 'Lụa', popularity: 87 },
      { category: 'Váy', subcategory: 'Váy tennis', color: 'Trắng', style: 'Sporty', material: 'Polyester', popularity: 90 },
      { category: 'Đầm', subcategory: 'Đầm babydoll', color: 'Hồng nhạt', style: 'Dễ thương', material: 'Cotton', popularity: 90 },
      { category: 'Váy', subcategory: 'Váy jeans', color: 'Xanh', style: 'Casual', material: 'Denim', popularity: 88 },
      { category: 'Đầm', subcategory: 'Đầm wrap', color: 'Xanh mint', style: 'Thanh thoát', material: 'Rayon', popularity: 86 },
      { category: 'Váy', subcategory: 'Váy kẻ caro', color: 'Đỏ đen', style: 'Vintage', material: 'Cotton flannel', popularity: 84 },
      { category: 'Đầm', subcategory: 'Đầm thun dài', color: 'Xám', style: 'Basic', material: 'Cotton', popularity: 82 },
      { category: 'Váy', subcategory: 'Váy xếp tầng', color: 'Be', style: 'Boho', material: 'Linen', popularity: 80 }
    ],
    'đi học': [
      { category: 'Đầm', subcategory: 'Đầm suông', color: 'Be', style: 'Đơn giản', material: 'Cotton', popularity: 90 },
      { category: 'Váy', subcategory: 'Váy midi', color: 'Xanh nhạt', style: 'Nhã nhặn', material: 'Cotton', popularity: 88 },
      { category: 'Đầm', subcategory: 'Đầm thun', color: 'Xám', style: 'Thoải mái', material: 'Cotton', popularity: 86 },
      { category: 'Váy', subcategory: 'Chân váy chữ A', color: 'Đen', style: 'Gọn gàng', material: 'Polyester', popularity: 84 },
      { category: 'Đầm', subcategory: 'Đầm polo', color: 'Trắng', style: 'Trẻ trung', material: 'Cotton', popularity: 82 },
      { category: 'Váy', subcategory: 'Váy xếp ly ngắn', color: 'Xanh navy', style: 'Học đường', material: 'Polyester', popularity: 89 },
      { category: 'Đầm', subcategory: 'Đầm caro', color: 'Đỏ trắng', style: 'Preppy', material: 'Cotton', popularity: 87 },
      { category: 'Váy', subcategory: 'Chân váy jeans', color: 'Xanh', style: 'Casual', material: 'Denim', popularity: 85 },
      { category: 'Đầm', subcategory: 'Đầm oversized', color: 'Đen', style: 'Thoải mái', material: 'Cotton', popularity: 83 },
      { category: 'Váy', subcategory: 'Váy thể thao', color: 'Trắng', style: 'Năng động', material: 'Polyester', popularity: 81 }
    ]
  }
};

// ========== HỆ THỐNG AI SCORING THỰC SỰ ==========

// Bảng điểm màu sắc phù hợp cho từng sự kiện
const colorScoreMatrix = {
  'đi tiệc': {
    high: ['Đen', 'Đỏ', 'Xanh navy', 'Vàng gold', 'Bạc', 'Trắng ngà', 'Đỏ wine', 'Xám đậm'],
    medium: ['Trắng', 'Xám', 'Hồng', 'Xanh đen', 'Hồng pastel'],
    low: ['Be', 'Kem', 'Nhiều màu', 'Xanh nhạt']
  },
  'đi làm': {
    high: ['Đen', 'Trắng', 'Xám', 'Xanh navy', 'Be', 'Xám đậm', 'Camel'],
    medium: ['Xanh nhạt', 'Wine', 'Xám nhạt'],
    low: ['Đỏ', 'Hồng', 'Nhiều màu', 'Vàng gold']
  },
  'đi chơi': {
    high: ['Trắng', 'Đen', 'Xanh', 'Hồng', 'Nhiều màu', 'Xanh mint', 'Đỏ'],
    medium: ['Xám', 'Be', 'Kem', 'Xanh rêu', 'Xanh nhạt'],
    low: ['Xanh navy', 'Xám đậm']
  },
  'đi học': {
    high: ['Trắng', 'Đen', 'Xanh navy', 'Xám', 'Be', 'Navy'],
    medium: ['Xanh nhạt', 'Xám nhạt', 'Đỏ trắng'],
    low: ['Đỏ', 'Hồng', 'Nhiều màu', 'Vàng gold']
  }
};

// Bảng điểm chất liệu phù hợp cho từng sự kiện
const materialScoreMatrix = {
  'đi tiệc': {
    high: ['Lụa', 'Satin', 'Len cao cấp', 'Len Ý', 'Velvet', 'Sequin', 'Ren', 'Organza', 'Tulle', 'Chiffon'],
    medium: ['Len', 'Cotton lụa', 'Len cashmere', 'Len pha', 'Voan'],
    low: ['Cotton', 'Denim', 'Nylon', 'Polyester']
  },
  'đi làm': {
    high: ['Cotton', 'Polyester', 'Len', 'Wool blend', 'Cotton Oxford', 'Tweed', 'Ponte'],
    medium: ['Cotton pique', 'Len merino', 'Wool'],
    low: ['Denim', 'Nylon', 'Sequin', 'Spandex']
  },
  'đi chơi': {
    high: ['Cotton', 'Denim', 'Nylon', 'Cotton pha', 'Cotton fleece', 'Rayon', 'Linen'],
    medium: ['Polyester', 'Cotton canvas', 'Cotton flannel', 'Voan', 'Lụa'],
    low: ['Len cao cấp', 'Satin', 'Tweed', 'Len Ý']
  },
  'đi học': {
    high: ['Cotton', 'Denim', 'Polyester', 'Denim stretch', 'Cotton pha'],
    medium: ['Cotton pique', 'Nylon'],
    low: ['Len cao cấp', 'Satin', 'Sequin', 'Lụa', 'Velvet']
  }
};

// Bảng điểm phong cách phù hợp cho từng sự kiện
const styleScoreMatrix = {
  'đi tiệc': {
    high: ['Sang trọng', 'Lịch sự', 'Thanh lịch', 'Quyến rũ', 'Cao cấp', 'Lux', 'Gợi cảm', 'Lấp lánh', 'Sexy', 'Thanh thoát', 'Công chúa'],
    medium: ['Cổ điển', 'Hiện đại', 'Nữ tính', 'Lãng mạn', 'Ngọt ngào'],
    low: ['Thoải mái', 'Năng động', 'Đơn giản', 'Streetwear', 'Thể thao', 'Casual']
  },
  'đi làm': {
    high: ['Chuyên nghiệp', 'Lịch sự', 'Thanh lịch', 'Hiện đại', 'Nhã nhặn', 'Smart casual', 'Quyền lực'],
    medium: ['Cổ điển', 'Gọn gàng', 'Vintage'],
    low: ['Streetwear', 'Năng động', 'Thể thao', 'Thoải mái', 'Sexy', 'Gợi cảm']
  },
  'đi chơi': {
    high: ['Năng động', 'Thoải mái', 'Trẻ trung', 'Cá tính', 'Streetwear', 'Phá cách', 'Casual', 'Sporty', 'Dễ thương', 'Boho'],
    medium: ['Đơn giản', 'Vintage', 'Basic', 'Quyến rũ', 'Thanh thoát'],
    low: ['Chuyên nghiệp', 'Lịch sự', 'Sang trọng', 'Cao cấp', 'Quyền lực']
  },
  'đi học': {
    high: ['Đơn giản', 'Gọn gàng', 'Trẻ trung', 'Năng động', 'Cơ bản', 'Học đường', 'Preppy', 'Thoải mái'],
    medium: ['Lịch sự', 'Nhã nhặn', 'Ấm áp', 'Casual'],
    low: ['Sang trọng', 'Cao cấp', 'Sexy', 'Gợi cảm', 'Lấp lánh', 'Streetwear']
  }
};

// Hàm tính điểm màu sắc - TĂNG ĐIỂM
function calculateColorScore(color, event) {
  const matrix = colorScoreMatrix[event] || colorScoreMatrix['đi chơi'];
  if (matrix.high.some(c => color.includes(c) || c.includes(color))) return 80;
  if (matrix.medium.some(c => color.includes(c) || c.includes(color))) return 68;
  if (matrix.low.some(c => color.includes(c) || c.includes(color))) return 58;
  return 65; // Điểm mặc định
}

// Hàm tính điểm chất liệu - TĂNG ĐIỂM
function calculateMaterialScore(material, event) {
  const matrix = materialScoreMatrix[event] || materialScoreMatrix['đi chơi'];
  if (matrix.high.some(m => material.includes(m) || m.includes(material))) return 80;
  if (matrix.medium.some(m => material.includes(m) || m.includes(material))) return 68;
  if (matrix.low.some(m => material.includes(m) || m.includes(material))) return 58;
  return 62;
}

// Hàm tính điểm phong cách - SỬ DỤNG USER FORMALITY - TĂNG ĐIỂM
function calculateStyleScore(style, event, userFormality) {
  const matrix = styleScoreMatrix[event] || styleScoreMatrix['đi chơi'];
  let baseScore = 60;

  if (matrix.high.some(s => style.includes(s) || s.includes(style))) baseScore = 80;
  else if (matrix.medium.some(s => style.includes(s) || s.includes(style))) baseScore = 68;
  else if (matrix.low.some(s => style.includes(s) || s.includes(style))) baseScore = 55;

  // ========== ĐIỀU CHỈNH THEO LỰA CHỌN PHONG CÁCH CỦA NGƯỜI DÙNG ==========
  // Lưu ý: HTML value là 'formal' và 'informal' (không phải 'casual')
  if (userFormality && userFormality !== 'all' && userFormality !== '') {
    const formalKeywords = ['Sang trọng', 'Lịch sự', 'Chuyên nghiệp', 'Thanh lịch', 'Cao cấp', 'Cổ điển', 'Trang trọng', 'Elegant', 'Formal', 'Executive', 'Luxe', 'Luxury', 'Power', 'Distinguished', 'Refined', 'Timeless', 'Royal', 'Premium', 'Sharp', 'Sophisticated'];
    const casualKeywords = ['Thoải mái', 'Năng động', 'Streetwear', 'Casual', 'Thể thao', 'Basic', 'Đơn giản', 'Sporty', 'Relaxed', 'Comfy', 'Cozy', 'Simple', 'Beach', 'Summer', 'Street', 'Trendy', 'Cool', 'Y2K', 'Vintage', 'Retro', 'Hippie', 'Grunge', 'Active', 'Athletic', 'Preppy', 'Korean', 'Cute', 'Sweet'];

    const styleLower = (style || '').toLowerCase();
    const isFormalStyle = formalKeywords.some(s => styleLower.includes(s.toLowerCase()));
    const isCasualStyle = casualKeywords.some(s => styleLower.includes(s.toLowerCase()));

    // Loại trừ chéo dứt khoát
    if (userFormality === 'formal') {
      // Nếu là đồ chỉ dành cho casual (sporty, relax, v.v) mà ko có tính formal -> XÓA SỔ
      if (isCasualStyle && !isFormalStyle) return 0;
      if (isFormalStyle) return 100;
      return 40; // Đồ trung tính
    } else if (userFormality === 'informal') {
      // Nếu là đồ chỉ dành cho formal (vest, suit, elegance) mà ko có casual -> XÓA SỔ
      if (isFormalStyle && !isCasualStyle) return 0;
      if (isCasualStyle) return 100;
      return 40; // Đồ trung tính
    }
  }

  return baseScore;
}

// Hàm tính điểm formality (độ trang trọng) - SỬ DỤNG USER INPUT
function calculateFormalityScore(style, material, event, userFormality) {
  const formalStyles = ['Sang trọng', 'Lịch sự', 'Chuyên nghiệp', 'Thanh lịch', 'Cao cấp', 'Cổ điển', 'Trang trọng', 'Executive', 'Formal', 'Elegant', 'Luxe', 'Power', 'Distinguished', 'Refined', 'Timeless', 'Royal', 'Premium', 'Sharp', 'Sophisticated'];
  const casualStyles = ['Thoải mái', 'Năng động', 'Streetwear', 'Casual', 'Thể thao', 'Basic', 'Đơn giản', 'Sporty', 'Relaxed', 'Comfy', 'Cozy', 'Beach', 'Summer', 'Street', 'Grunge', 'Hippie', 'Y2K', 'Trendy', 'Cool', 'Vintage', 'Retro', 'Active', 'Athletic', 'Preppy', 'Korean', 'Cute', 'Sweet'];
  const formalMaterials = ['Len', 'Len Ý', 'Satin', 'Silk', 'Lụa', 'Velvet', 'Crepe', 'Jacquard', 'Sequin', 'Wool', 'Mohair', 'Brocade'];
  const casualMaterials = ['Cotton', 'Denim', 'Nylon', 'Polyester', 'Jersey', 'Fleece', 'Terry', 'Linen', 'Canvas', 'Mesh'];

  const styleLower = (style || '').toLowerCase();
  const materialLower = (material || '').toLowerCase();

  const isFormalStyle = formalStyles.some(s => styleLower.includes(s.toLowerCase()));
  const isCasualStyle = casualStyles.some(s => styleLower.includes(s.toLowerCase()));
  const isFormalMaterial = formalMaterials.some(m => materialLower.includes(m.toLowerCase()));
  const isCasualMaterial = casualMaterials.some(m => materialLower.includes(m.toLowerCase()));

  // ========== SỬ DỤNG LỰA CHỌN CỦA NGƯỜI DÙNG NẾU CÓ ==========
  if (userFormality && userFormality !== 'all' && userFormality !== '') {
    if (userFormality === 'formal') {
      // Trang trọng tuyệt đối
      if (isFormalStyle) return 100;
      if (isCasualStyle) return 0; // Phạt hẳn 0 thay vì 50
      return 50;
    } else if (userFormality === 'informal') {
      // Casual thoải mái tuyệt đối
      if (isCasualStyle) return 100;
      if (isFormalStyle) return 0; // Phạt hẳn 0
      return 50;
    }
  }

  // ========== FALLBACK: DỰA VÀO EVENT NẾU KHÔNG CÓ USER INPUT ==========
  const isFormalEvent = event === 'đi tiệc' || event === 'đi làm';

  if (isFormalEvent && isFormalStyle) return 80;
  if (isFormalEvent && isCasualStyle) return 60;
  if (!isFormalEvent && isCasualStyle) return 80;
  if (!isFormalEvent && isFormalStyle) return 65;
  return 72;
}

// Hàm tính điểm giá cả - TĂNG ĐIỂM
function calculatePriceScore(price, event) {
  if (event === 'đi tiệc') {
    // Đi tiệc thường cần đồ cao cấp hơn
    if (price >= 150) return 75;
    if (price >= 100) return 68;
    if (price >= 50) return 60;
    return 55;
  } else if (event === 'đi làm') {
    // Đi làm cần đồ vừa phải
    if (price >= 50 && price <= 150) return 75;
    if (price < 50) return 68;
    return 72;
  } else {
    // Đi chơi/đi học ưu tiên giá hợp lý
    if (price <= 60) return 75;
    if (price <= 100) return 68;
    return 60;
  }
}

// ========== HÀM TÍNH ĐIỂM PHÙ HỢP THỜI TIẾT - MỚI THÊM ==========
function calculateWeatherScore(material, color, style, weather, outFitName = '') {
  if (!weather || weather === '') return 70; // Điểm mặc định nếu không có thời tiết

  const materialLower = (material || '').toLowerCase();
  const colorLower = (color || '').toLowerCase();
  const styleLower = (style || '').toLowerCase();
  const nameLower = outFitName.toLowerCase();

  let score = 50; // Điểm cơ bản

  // Lấy các chi tiết chung có thể kết hợp
  const textToScan = materialLower + ' ' + styleLower + ' ' + nameLower;

  // ========== NẮNG NÓNG (>30°C) ==========
  if (weather === 'sunny') {
    // Chất liệu mỏng, thoáng mát (Tăng điểm mạnh)
    const coolMaterials = ['cotton', 'linen', 'voan', 'chiffon', 'rayon', 'mesh', 'polyester'];
    if (coolMaterials.some(m => materialLower.includes(m))) score += 25;

    // Màu sáng giúp không nóng
    const lightColors = ['trắng', 'kem', 'hồng', 'xanh nhạt', 'vàng', 'cam', 'be'];
    if (lightColors.some(c => colorLower.includes(c))) score += 15;

    // Khuyến khích áo tay ngắn, quần short, ba lỗ, croptop
    const summerItems = ['short', 'ngắn', 'croptop', 'ba lỗ', 'tank', 'hở', 'cộc', 'trễ vai', 'bikini'];
    if (summerItems.some(i => textToScan.includes(i))) score += 30;

    // Phạt RẤT nặng nề nếu mặc đồ dày hoặc ấm
    const heavyMaterials = ['len', 'wool', 'velvet', 'tweed', 'cashmere', 'nhung', 'nỉ', 'jacket', 'phao', 'fleece', 'sweater', 'áo khoác', 'măng tô'];
    if (heavyMaterials.some(m => textToScan.includes(m))) score -= 80;

    // Tránh màu tối hút nóng
    const darkColors = ['đen', 'xám đậm', 'wine', 'navy đậm'];
    if (darkColors.some(c => colorLower.includes(c))) score -= 15;
  }

  // ========== ẤM ÁP (25-30°C) ==========
  else if (weather === 'warm') {
    const mediumMaterials = ['cotton', 'polyester', 'linen', 'rayon', 'denim'];
    if (mediumMaterials.some(m => materialLower.includes(m))) score += 20;

    const versatileColors = ['trắng', 'xám', 'be', 'xanh', 'navy'];
    if (versatileColors.some(c => colorLower.includes(c))) score += 10;

    const heavyMaterials = ['len', 'wool', 'velvet', 'tweed', 'cashmere', 'phao', 'măng tô', 'nỉ'];
    if (heavyMaterials.some(m => textToScan.includes(m))) score -= 40;
  }

  // ========== MÁT MẼ (18-25°C) ==========
  else if (weather === 'cool') {
    const warmMaterials = ['cotton', 'polyester', 'wool blend', 'fleece', 'denim'];
    if (warmMaterials.some(m => materialLower.includes(m))) score += 20;

    // Có thể mặc khoác nhẹ
    if (textToScan.includes('khoác') || textToScan.includes('cardigan') || textToScan.includes('blazer') || textToScan.includes('len')) {
      score += 25;
    }

    const naturalColors = ['xám', 'be', 'navy', 'đen', 'trắng'];
    if (naturalColors.some(c => colorLower.includes(c))) score += 10;

    const summerItems = ['short', 'tank', 'ba lỗ', 'croptop', 'bikini'];
    if (summerItems.some(i => textToScan.includes(i))) score -= 25;
  }

  // ========== LẠNH (<18°C) ==========
  else if (weather === 'cold') {
    // Chất liệu ấm áp
    const warmMaterials = ['wool', 'fleece', 'len', 'cashmere', 'wool blend', 'suede', 'nỉ', 'phao', 'nhung', 'velvet'];
    if (warmMaterials.some(m => materialLower.includes(m))) score += 40;

    // Cần khoác ấm
    if (textToScan.includes('khoác') || textToScan.includes('vest') || textToScan.includes('áo cổ lọ') || textToScan.includes('măng tô') || textToScan.includes('hoodie') || textToScan.includes('sweater')) {
      score += 35;
    }

    const warmColors = ['xám', 'xám đậm', 'đen', 'navy', 'wine', 'camel'];
    if (warmColors.some(c => colorLower.includes(c))) score += 10;

    // Tránh chất liệu mỏng RẤT NẶNG
    const thinMaterials = ['voan', 'linen', 'chiffon', 'mesh', 'lụa'];
    if (thinMaterials.some(m => materialLower.includes(m))) score -= 40;

    const summerItems = ['short', 'ngắn', 'croptop', 'ba lỗ', 'tank', 'hở', 'cộc', 'trễ vai', 'váy ngắn'];
    if (summerItems.some(i => textToScan.includes(i))) score -= 60;
  }

  // ========== MƯA ==========
  else if (weather === 'rainy') {
    // Chất liệu chống thấm
    const waterproofMaterials = ['polyester', 'nylon', 'denim', 'wool', 'canvas', 'da', 'leather'];
    if (waterproofMaterials.some(m => materialLower.includes(m))) score += 50;

    // Tránh chất liệu dễ thấm nước / khó giặt
    const delicateMaterials = ['lụa', 'voan', 'chiffon', 'satin', 'suede'];
    if (delicateMaterials.some(m => materialLower.includes(m))) score -= 80;

    // Màu tối không thấy bẩn
    const darkColors = ['đen', 'xám', 'navy', 'xanh rêu'];
    if (darkColors.some(c => colorLower.includes(c))) score += 20;

    // Tránh màu sáng dễ bẩn
    const lightColors = ['trắng', 'kem', 'hồng nhạt'];
    if (lightColors.some(c => colorLower.includes(c))) score -= 50;

    if (textToScan.includes('áo khoác') || textToScan.includes('khoác') || textToScan.includes('jacket') || textToScan.includes('gió')) {
      score += 40;
    }
  }

  return Math.min(100, Math.max(0, score)); // Thang điểm rộng giúp lọc tốt hơn
}

// ========== CACHE ĐIỂM AI - ĐỂ ĐIỂM ỔN ĐỊNH KHÔNG ĐỔI ==========
const scoreCache = {
  get key() {
    let userSuffix = '_guest';
    try {
      const user = JSON.parse(localStorage.getItem('currentUser'));
      if (user && user.username) userSuffix = `_${user.username}`;
    } catch (e) {}
    return `outfit_ai_scores_v2${userSuffix}`;
  },
  data: null,

  load() {
    if (this.data === null) {
      try {
        this.data = JSON.parse(localStorage.getItem(this.key) || '{}');
      } catch (e) {
        this.data = {};
      }
    }
    return this.data;
  },

  get(outfitId, event) {
    this.load();
    const cacheKey = `${outfitId}_${event}`;
    return this.data[cacheKey] || null;
  },

  set(outfitId, event, scoreDetails) {
    this.load();
    const cacheKey = `${outfitId}_${event}`;
    this.data[cacheKey] = scoreDetails;
    localStorage.setItem(this.key, JSON.stringify(this.data));
  },

  clear() {
    this.data = {};
    localStorage.removeItem(this.key);
  }
};

// HÀM TỔNG HỢP TÍNH ĐIỂM AI - VERSION 2.0 REAL AI SCORING
// Biến global lưu formality hiện tại từ user
let currentUserFormality = 'all';
let currentWeather = ''; // Lưu thời tiết hiện tại

function calculateAIScore(outfit, event, userFormality, weather = '') {
  // Sử dụng userFormality được truyền vào hoặc global
  const formality = userFormality || currentUserFormality || 'all';
  const weatherCondition = weather || currentWeather || '';

  // ========== KIỂM TRA CACHE - NHƯNG PHẢI BAO GỒM FORMALITY VÀ WEATHER ==========
  const outfitId = outfit.item_id || outfit.id || `${outfit.name}_${outfit.color}`;
  const cacheKey = `${outfitId}_${formality}_${weatherCondition}`; // Cache riêng cho từng formality + weather
  const cachedScore = scoreCache.get(cacheKey, event);
  if (cachedScore && cachedScore.total !== undefined) {
    return cachedScore; // Trả về điểm đã cache, không tính lại
  }

  // ========== TRỌNG SỐ ĐA DẠNG CHO TỪNG YẾU TỐ - GIẢM ĐỂ ĐIỂM THẤP HƠN ==========
  let weights = {
    color: 0.10,           
    material: 0.10,        
    style: 0.30,           // AI tập trung cực mạnh vào phong cách
    formality: 0.12,       
    price: 0.07,           
    completeness: 0.08,    
    seasonality: 0.05,     
    versatility: 0.03,     
    weather: 0.15          
  };

  // TĂNG MẠNH TRỌNG SỐ NẾU CHỌN THỜI TIẾT ĐỂ TẠO RA KHÁC BIỆT LỚN
  if (weatherCondition && weatherCondition !== '') {
    weights = {
      color: 0.05,
      material: 0.05,
      style: 0.15, // AI vẫn chú trọng vào phong cách
      formality: 0.05,
      price: 0.05,
      completeness: 0.05,
      seasonality: 0.05,
      versatility: 0.05,
      weather: 0.60  // Tăng cực đỉnh lên 60% cho thời tiết
    };
  }

  // ========== TÍNH ĐIỂM TỪNG YẾU TỐ - TRUYỀN USER FORMALITY ==========
  const colorScore = calculateColorScore(outfit.color, event);
  const materialScore = calculateMaterialScore(outfit.material, event);
  const styleScore = calculateStyleScore(outfit.style, event, formality);
  const formalityScore = calculateFormalityScore(outfit.style, outfit.material, event, formality);
  const priceScore = calculatePriceScore(outfit.price, event);

  // ========== YẾU TỐ MỚI: ĐỘ HOÀN CHỈNH OUTFIT ==========
  const completenessScore = calculateCompletenessScore(outfit);

  // ========== YẾU TỐ MỚI: PHÙ HỢP MÙA ==========
  const seasonalityScore = calculateSeasonalityScore(outfit.material, outfit.color);

  // ========== YẾU TỐ MỚI: TÍNH LINH HOẠT ==========
  const versatilityScore = calculateVersatilityScore(outfit, event);

  // ========== YẾU TỐ MỚI: PHÙ HỢP THỜI TIẾT ==========
  const weatherScore = calculateWeatherScore(outfit.material, outfit.color, outfit.style, weatherCondition, outfit.name || outfit.subcategory || '');

  // ========== TÍNH ĐIỂM TỔNG HỢP CÓ TRỌNG SỐ ==========
  let baseScore = Math.round(
    colorScore * weights.color +
    materialScore * weights.material +
    styleScore * weights.style +
    formalityScore * weights.formality +
    priceScore * weights.price +
    completenessScore * weights.completeness +
    seasonalityScore * weights.seasonality +
    versatilityScore * weights.versatility +
    weatherScore * weights.weather
  );

  // ========== TÍNH DIVERSITY FACTOR - ỔN ĐỊNH (không random) ==========
  // Dựa trên hash của outfit để cùng outfit luôn có cùng điểm
  const diversityFactor = calculateDiversityFactor(outfit);
  // Điều chỉnh trong khoảng -5 đến +5 (không quá ảnh hưởng)
  let adjustedDiversity = Math.max(-5, Math.min(5, diversityFactor));

  // TĂNG SỰ KHÁC BIỆT NẾU CHỌN THỜI TIẾT VÀ PHONG CÁCH CÙNG LÚC
  // Nếu bật weather, hãy ngẫu nhiên xáo trộn một xíu.
  if (weatherCondition && weatherCondition !== '') {
    // Để thấy sự thay đổi rõ rệt cho người dùng mỗi khi chọn (jitter)
    const jitter = Math.floor(Math.random() * 20) - 10; // -10 đến +10
    adjustedDiversity += jitter;
  }

  baseScore = baseScore + adjustedDiversity;

  // ========== HARSH CONTRADICTION PENALTIES ==========
  // Kéo điểm cực thấp nếu outfit hoàn toàn trái ngược tiêu chí
  if (weatherScore <= 20) {
    baseScore -= 60; // Quá nóng/quá lạnh so với outfit
  }
  if (styleScore <= 10 || formalityScore <= 10) {
    baseScore -= 50; // Quá trang trọng khi đi chơi, hoặc quá xuề xòa khi đi làm
  }

  // ========== THÊM ĐIỂM BONUS TỪ AI LEARNING - TĂNG LỰC CỰC MẠNH ==========
  let learningBonus = 0;
  if (typeof aiLearning !== 'undefined' && aiLearning) {
    learningBonus = aiLearning.calculateLearningBonus(outfit, event);
    // AI Learning tác động cực lớn để đẩy các outfit đúng pattern lên ngay top đầu
    learningBonus = Math.min(35, learningBonus); 
    baseScore = baseScore + learningBonus;
  }

  // ========== ĐIỂM CUỐI CÙNG - TĂNG LÊN ==========
  // Điểm từ 0-89 để thể hiện chính xác đánh giá AI
  // Cộng thêm 8 điểm để tăng mức điểm trung bình
  const adjustedScore = baseScore + 8;
  const finalScore = Math.max(0, Math.min(89, adjustedScore));

  // ========== LƯU CHI TIẾT ĐIỂM ==========
  const scoreDetails = {
    color: colorScore,
    material: materialScore,
    style: styleScore,
    formality: formalityScore,
    price: priceScore,
    completeness: completenessScore,
    seasonality: seasonalityScore,
    versatility: versatilityScore,
    weather: weatherScore,
    diversityFactor: adjustedDiversity,  // Đã điều chỉnh
    learningBonus: learningBonus,
    total: finalScore  // Điểm cuối cùng thực sự
  };

  // ========== LƯU VÀO CACHE ĐỂ ĐIỂM ỔN ĐỊNH (THEO FORMALITY + WEATHER) ==========
  scoreCache.set(cacheKey, event, scoreDetails);

  return scoreDetails;
}

// ========== HÀM TÍNH ĐIỂM ĐỘ HOÀN CHỈNH OUTFIT - TĂNG ĐIỂM ==========
function calculateCompletenessScore(outfit) {
  const name = (outfit.name || outfit.subcategory || '').toLowerCase();
  let score = 65; // Điểm cơ bản

  // Set đồ hoàn chỉnh được điểm cao
  if (name.includes('set') || name.includes('combo') || name.includes('complete')) {
    score = 82;
  }
  // Có cả áo và quần/váy
  else if ((name.includes('áo') && (name.includes('quần') || name.includes('váy'))) ||
    (name.includes('+') && name.split('+').length >= 2)) {
    score = 78;
  }
  // Outfit phụ kiện đi kèm
  else if (name.includes('túi') || name.includes('giày') || name.includes('mũ') || name.includes('phụ kiện')) {
    score = 62;
  }
  // Đồ đơn lẻ
  else if (name.includes('áo') || name.includes('quần') || name.includes('váy') || name.includes('đầm')) {
    score = 72;
  }

  return score;
}

// ========== HÀM TÍNH ĐIỂM PHÙ HỢP MÙA - GIẢM ĐIỂM ==========
function calculateSeasonalityScore(material, color) {
  const currentMonth = new Date().getMonth() + 1;
  let score = 50; // Điểm cơ bản

  // Xác định mùa (Việt Nam: nóng quanh năm, nhưng có 2 mùa mưa/khô)
  const isHotSeason = currentMonth >= 4 && currentMonth <= 9; // Mùa nóng: tháng 4-9
  const isCoolSeason = currentMonth >= 11 || currentMonth <= 2; // Mùa mát: tháng 11-2

  const materialLower = (material || '').toLowerCase();
  const colorLower = (color || '').toLowerCase();

  // Chất liệu phù hợp mùa
  const hotMaterials = ['cotton', 'lụa', 'voan', 'linen', 'chiffon', 'rayon'];
  const coolMaterials = ['len', 'wool', 'cashmere', 'fleece', 'tweed', 'velvet'];

  if (isHotSeason) {
    if (hotMaterials.some(m => materialLower.includes(m))) score += 10;
    if (coolMaterials.some(m => materialLower.includes(m))) score -= 5;
    // Màu sáng cho mùa nóng
    if (['trắng', 'hồng', 'xanh nhạt', 'be', 'kem'].some(c => colorLower.includes(c))) score += 5;
  } else if (isCoolSeason) {
    if (coolMaterials.some(m => materialLower.includes(m))) score += 10;
    // Màu tối cho mùa mát
    if (['đen', 'xám', 'navy', 'wine', 'đậm'].some(c => colorLower.includes(c))) score += 5;
  }

  return Math.min(75, Math.max(25, score));
}

// ========== HÀM TÍNH TÍNH LINH HOẠT - GIẢM ĐIỂM ==========
function calculateVersatilityScore(outfit, event) {
  const style = (outfit.style || '').toLowerCase();
  const color = (outfit.color || '').toLowerCase();
  let score = 45; // Điểm cơ bản

  // Màu trung tính linh hoạt
  const neutralColors = ['đen', 'trắng', 'xám', 'be', 'navy', 'kem'];
  if (neutralColors.some(c => color.includes(c))) score += 15;

  // Phong cách có thể dùng nhiều dịp
  const versatileStyles = ['basic', 'đơn giản', 'thanh lịch', 'hiện đại', 'casual', 'smart casual'];
  if (versatileStyles.some(s => style.includes(s))) score += 12;

  // Màu quá nổi bật kém linh hoạt
  if (['sequin', 'lấp lánh', 'vàng gold', 'nhiều màu'].some(c => color.includes(c))) score -= 10;

  return Math.min(75, Math.max(25, score));
}

// ========== HÀM TẠO DIVERSITY FACTOR ==========
// Tạo điểm khác biệt cho mỗi outfit dựa trên đặc điểm riêng
function calculateDiversityFactor(outfit) {
  const name = outfit.name || outfit.subcategory || 'outfit';
  const color = outfit.color || '';
  const style = outfit.style || '';
  const material = outfit.material || '';
  const price = outfit.price || 50;

  // Tạo hash từ tên outfit để có điểm nhất quán
  let hash = 0;
  const str = name + color + style + material;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }

  // Chuyển hash thành số từ -8 đến +8
  const diversityRange = (Math.abs(hash) % 17) - 8;

  // Điều chỉnh thêm dựa trên đặc điểm
  let adjustment = 0;

  // Outfit độc đáo/cao cấp có thể +/-
  if (price > 150) adjustment += 2;
  if (price < 30) adjustment -= 2;

  // Phong cách đặc biệt
  const uniqueStyles = ['streetwear', 'vintage', 'boho', 'punk', 'grunge'];
  if (uniqueStyles.some(s => (style || '').toLowerCase().includes(s))) {
    adjustment += (Math.abs(hash) % 5) - 2; // Random -2 to +2
  }

  return Math.max(-10, Math.min(10, diversityRange + adjustment));
}

// ========== HÀM TẠO TOOLTIP CHI TIẾT ĐIỂM AI ==========
function buildScoreTooltip(scoreDetails) {
  if (!scoreDetails || Object.keys(scoreDetails).length === 0) {
    return 'AI đang phân tích...';
  }

  const lines = [];
  lines.push(`📊 CHI TIẾT ĐIỂM AI`);
  lines.push(`━━━━━━━━━━━━━━━`);

  if (scoreDetails.color !== undefined) {
    lines.push(`🎨 Màu sắc: ${scoreDetails.color}%`);
  }
  if (scoreDetails.material !== undefined) {
    lines.push(`👔 Chất liệu: ${scoreDetails.material}%`);
  }
  if (scoreDetails.style !== undefined) {
    lines.push(`✨ Phong cách: ${scoreDetails.style}%`);
  }
  if (scoreDetails.formality !== undefined) {
    lines.push(`🎯 Trang trọng: ${scoreDetails.formality}%`);
  }
  if (scoreDetails.price !== undefined) {
    lines.push(`💰 Giá cả: ${scoreDetails.price}%`);
  }
  if (scoreDetails.completeness !== undefined) {
    lines.push(`📦 Hoàn chỉnh: ${scoreDetails.completeness}%`);
  }
  if (scoreDetails.seasonality !== undefined) {
    lines.push(`🌤️ Phù hợp mùa: ${scoreDetails.seasonality}%`);
  }
  if (scoreDetails.versatility !== undefined) {
    lines.push(`🔄 Linh hoạt: ${scoreDetails.versatility}%`);
  }
  if (scoreDetails.weather !== undefined) {
    lines.push(`☀️ Phù hợp thời tiết: ${scoreDetails.weather}%`);
  }

  lines.push(`━━━━━━━━━━━━━━━`);

  if (scoreDetails.diversityFactor !== undefined) {
    const diversitySign = scoreDetails.diversityFactor >= 0 ? '+' : '';
    lines.push(`🎲 Đa dạng: ${diversitySign}${scoreDetails.diversityFactor}`);
  }

  if (scoreDetails.learningBonus !== undefined && scoreDetails.learningBonus > 0) {
    lines.push(`🧠 Bonus AI học: +${scoreDetails.learningBonus}`);
  }

  lines.push(`━━━━━━━━━━━━━━━`);
  lines.push(`🏆 TỔNG: ${scoreDetails.total}%`);

  return lines.join(' | ');
}

// Hàm tạo dữ liệu outfit động dựa trên giới tính và sự kiện
// AI sẽ tính toán độ phù hợp cho từng outfit
function generateOutfits(gender, event, count = 100, userFormality = null, weather = '') {
  // Lưu userFormality vào biến global để các hàm con sử dụng
  if (userFormality) {
    currentUserFormality = userFormality;
  }

  // Lưu weather vào biến global
  if (weather) {
    currentWeather = weather;
  }

  // Sử dụng database chi tiết nếu có
  const dbItems = outfitDatabase?.[gender]?.[event] || [];
  const genderTemplates = outfitTemplates[gender];

  if (!genderTemplates && dbItems.length === 0) return [];

  const items = genderTemplates?.[event] || [];

  // Lấy formality phù hợp - Ưu tiên userFormality
  const formality = userFormality || ((event === 'đi tiệc' || event === 'đi làm') ? 'formal' : 'informal');

  const results = [];
  // Tính tổng số ảnh (bao gồm cả altCount nếu có)
  const config = imageFolders[gender]?.[event];
  const maxImages = config ? (config.count + (config.altCount || 0)) : 20;

  for (let i = 0; i < Math.min(count, maxImages); i++) {
    const imageIndex = i + 1;

    // Ưu tiên lấy từ database chi tiết
    const dbItem = dbItems[i] || null;
    const template = items[i % items.length] || {};

    // Lấy thông tin từ database hoặc fallback về template
    const outfitInfo = dbItem || {
      name: template.subcategory || 'Outfit',
      category: template.category || 'Đồ',
      subcategory: template.subcategory || 'Outfit',
      color: template.color || 'Đa màu',
      style: template.style || 'Casual',
      material: template.material || 'Cotton',
      price: template.price || 50.99,
      description: ''
    };

    // Kiểm tra custom name từ người dùng
    const customInfo = outfitNameManager?.getOutfitInfo(gender, event, imageIndex);
    if (customInfo) {
      outfitInfo.name = customInfo.name;
      if (customInfo.customized) {
        outfitInfo.customized = true;
      }
    }

    // AI THỰC SỰ tính toán độ phù hợp dựa trên phân tích outfit - TRUYỀN USER FORMALITY VÀ WEATHER
    const aiAnalysis = calculateAIScore(outfitInfo, event, userFormality, weather);

    results.push({
      item_id: `${gender}_${event}_${imageIndex}`.replace(/\s/g, '_'),
      name: outfitInfo.name, // Tên chính xác từ database
      category: outfitInfo.category,
      subcategory: outfitInfo.subcategory || outfitInfo.name,
      color: outfitInfo.color,
      style: outfitInfo.style,
      formality: formality,
      gender: gender,
      suitable_events: event,
      image_path: getImagePath(gender, event, imageIndex),
      brand: `Brand${String.fromCharCode(65 + (i % 10))}`,
      price: outfitInfo.price,
      material: outfitInfo.material,
      description: outfitInfo.description || '',
      popularity: (template.popularity || 85) - (i % 10),
      aiScore: aiAnalysis.total, // Điểm AI thực sự từ phân tích
      scoreDetails: aiAnalysis, // Chi tiết điểm để hiển thị tooltip
      aiAnalysis: aiAnalysis, // Chi tiết phân tích
      aiReason: generateAIReason(outfitInfo, event, aiAnalysis), // Lý do dựa trên phân tích
      customized: outfitInfo.customized || false,
      imageIndex: imageIndex // Lưu index để có thể sửa tên
    });
  }

  // Sắp xếp theo điểm AI
  results.sort((a, b) => b.aiScore - a.aiScore);

  return results;
}

// AI SINH LÝ DO DỰA TRÊN PHÂN TÍCH THỰC SỰ
function generateAIReason(outfit, event, analysis) {
  const reasons = [];

  // Phân tích điểm mạnh nhất
  const scores = [
    { name: 'phong cách', score: analysis.style, detail: outfit.style },
    { name: 'chất liệu', score: analysis.material, detail: outfit.material },
    { name: 'màu sắc', score: analysis.color, detail: outfit.color },
    { name: 'độ trang trọng', score: analysis.formality, detail: '' }
  ];

  // Sắp xếp theo điểm cao nhất
  scores.sort((a, b) => b.score - a.score);

  // Lấy điểm mạnh nhất
  const topStrength = scores[0];

  // Sinh lý do dựa trên điểm mạnh
  if (topStrength.name === 'phong cách' && topStrength.score >= 90) {
    reasons.push(`Phong cách ${outfit.style} rất phù hợp cho ${event}`);
  } else if (topStrength.name === 'chất liệu' && topStrength.score >= 90) {
    reasons.push(`Chất liệu ${outfit.material} lý tưởng cho ${event}`);
  } else if (topStrength.name === 'màu sắc' && topStrength.score >= 90) {
    reasons.push(`Màu ${outfit.color} hoàn hảo cho ${event}`);
  } else if (topStrength.name === 'độ trang trọng' && topStrength.score >= 90) {
    reasons.push(`Độ trang trọng phù hợp tuyệt vời`);
  }

  // Thêm lý do dựa trên điểm tổng
  if (analysis.total >= 90) {
    reasons.push('AI đánh giá rất cao');
  } else if (analysis.total >= 80) {
    reasons.push('Phù hợp tốt với dịp này');
  } else if (analysis.total >= 70) {
    reasons.push('Lựa chọn khá phù hợp');
  }

  // Thêm lý do từ AI Learning
  if (analysis.learningBonus && analysis.learningBonus >= 10) {
    reasons.unshift('⭐ Phù hợp sở thích của bạn');
  } else if (analysis.learningBonus && analysis.learningBonus >= 5) {
    reasons.unshift('🎯 AI nhận thấy bạn thích style này');
  }

  // Thêm chi tiết về giá
  if (analysis.price >= 90) {
    if (event === 'đi tiệc') {
      reasons.push('Giá trị xứng đáng cho sự kiện');
    } else {
      reasons.push('Giá cả hợp lý');
    }
  }

  // Trả về lý do hoặc mặc định
  return reasons.length > 0 ? reasons[0] : `Phù hợp cho ${event}`;
}



// ========== HỆ THỐNG AI LEARNING NÂNG CAO - HỌC SÂU TỪ NGƯỜI DÙNG ==========

class AILearningManager {
  constructor() {
    let userSuffix = '_guest';
    try {
      const user = JSON.parse(localStorage.getItem('currentUser'));
      if (user && user.username) userSuffix = `_${user.username}`;
    } catch (e) {}
    
    this.storageKey = `ai_learning_data_v2${userSuffix}`; // Version mới, chia theo user
    this.data = this.loadData();
    this.applyTimeDecay(); // Giảm dần điểm cũ theo thời gian
  }

  // Load dữ liệu học từ localStorage
  loadData() {
    const defaultData = {
      // ========== PREFERENCES CƠ BẢN ==========
      colorPreferences: {},
      materialPreferences: {},
      stylePreferences: {},
      categoryPreferences: {},
      pricePreferences: {},

      // ========== PREFERENCES NÂNG CAO ==========
      // Học kết hợp màu + phong cách
      colorStyleCombos: {},
      // Học khoảng giá yêu thích theo sự kiện
      priceRangeByEvent: {},
      // Học outfit hoàn chỉnh vs đơn lẻ
      completenessPreference: {},
      // Học pattern từ tên outfit
      namePatterns: {},
      // Học sự kết hợp chất liệu + màu
      materialColorCombos: {},

      // ========== TRACKING ==========
      totalInteractions: 0,
      favoriteCount: 0,
      viewCount: 0,
      lastInteractionDate: null,
      history: [],

      // ========== PROFILE NGƯỜI DÙNG ==========
      userProfile: {
        preferredPriceLevel: 'medium', // budget, medium, premium, luxury
        styleType: 'balanced',          // minimalist, maximalist, balanced
        colorPalette: 'neutral',        // warm, cool, neutral, vibrant
        lastUpdated: null
      }
    };

    const saved = localStorage.getItem(this.storageKey);
    if (!saved) return defaultData;

    // QUAN TRỌNG: Merge saved data với default để đảm bảo tất cả fields tồn tại
    const savedData = JSON.parse(saved);
    return { ...defaultData, ...savedData };
  }

  // ========== TIME DECAY - GIẢM ĐIỂM CŨ THEO THỜI GIAN ==========
  applyTimeDecay() {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    const decayRate = 0.95; // Giảm 5% mỗi tuần

    if (this.data.lastInteractionDate) {
      const daysSinceLastInteraction = Math.floor((now - this.data.lastInteractionDate) / dayInMs);
      const weeksPassed = Math.floor(daysSinceLastInteraction / 7);

      if (weeksPassed > 0) {
        const decayFactor = Math.pow(decayRate, weeksPassed);
        this.applyDecayToPreferences(decayFactor);
      }
    }
  }

  // Áp dụng decay cho tất cả preferences
  applyDecayToPreferences(factor) {
    const prefTypes = ['colorPreferences', 'materialPreferences', 'stylePreferences',
      'categoryPreferences', 'pricePreferences', 'colorStyleCombos',
      'namePatterns', 'materialColorCombos'];

    prefTypes.forEach(type => {
      if (this.data[type]) {
        Object.keys(this.data[type]).forEach(event => {
          Object.keys(this.data[type][event]).forEach(key => {
            this.data[type][event][key] = Math.round(this.data[type][event][key] * factor);
            if (this.data[type][event][key] <= 0) {
              delete this.data[type][event][key];
            }
          });
        });
      }
    });
    this.saveData();
  }

  // Lưu dữ liệu học
  saveData() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.data));
  }

  // ========== HỌC SÂU TỪ OUTFIT ĐƯỢC YÊU THÍCH ==========
  learnFromOutfit(outfit, interactionType = 'favorite') {
    try {
      const event = outfit.suitable_events || 'đi chơi';
      const weight = interactionType === 'favorite' ? 5 : 2; // Favorite có trọng số cao hơn

      // ========== HỌC CƠ BẢN ==========
      // Học màu sắc
      this.incrementPreference('colorPreferences', event, outfit.color, weight);

      // Học chất liệu
      this.incrementPreference('materialPreferences', event, outfit.material, weight);

      // Học phong cách
      this.incrementPreference('stylePreferences', event, outfit.style, weight);

      // Học category
      this.incrementPreference('categoryPreferences', event, outfit.category, weight);

      // Học giá
      const priceRange = this.getPriceRange(outfit.price);
      this.incrementPreference('pricePreferences', event, priceRange, weight);

      // ========== HỌC NÂNG CAO ==========
      // Học kết hợp màu + phong cách
      if (outfit.color && outfit.style) {
        const colorStyleCombo = `${outfit.color}|${outfit.style}`;
        this.incrementPreference('colorStyleCombos', event, colorStyleCombo, weight);
      }

      // Học kết hợp chất liệu + màu
      if (outfit.material && outfit.color) {
        const materialColorCombo = `${outfit.material}|${outfit.color}`;
        this.incrementPreference('materialColorCombos', event, materialColorCombo, weight);
      }

      // Học pattern từ tên outfit
      const outfitName = outfit.name || outfit.subcategory || '';
      const namePatterns = this.extractNamePatterns(outfitName);
      namePatterns.forEach(pattern => {
        this.incrementPreference('namePatterns', event, pattern, weight);
      });

      // Học sự hoàn chỉnh (set đồ vs đơn lẻ)
      const completeness = this.getCompletenessType(outfitName);
      this.incrementPreference('completenessPreference', event, completeness, weight);

      // ========== CẬP NHẬT TRACKING ==========
      this.data.totalInteractions = (this.data.totalInteractions || 0) + 1;
      this.data.lastInteractionDate = Date.now();
      if (interactionType === 'favorite') {
        this.data.favoriteCount = (this.data.favoriteCount || 0) + 1;
      } else {
        this.data.viewCount = (this.data.viewCount || 0) + 1;
      }

      // ========== CẬP NHẬT USER PROFILE ==========
      this.updateUserProfile(outfit, event);

      // Lưu lịch sử (giữ 200 tương tác gần nhất)
      if (!this.data.history) this.data.history = [];
      this.data.history.unshift({
        outfitId: outfit.item_id,
        outfitName: outfitName,
        color: outfit.color,
        style: outfit.style,
        material: outfit.material,
        price: outfit.price,
        event: event,
        type: interactionType,
        timestamp: Date.now()
      });
      if (this.data.history.length > 200) {
        this.data.history.pop();
      }

      this.saveData();
      this.updateLearningStatus();
    } catch (error) {
      console.error('❌ Lỗi trong learnFromOutfit:', error);
    }

    // ========== SYNC VỚI BACKEND AI ENGINE ==========
    this.syncWithBackend(outfit, interactionType, event);
  }

  // ========== SYNC LEARNING VỚI BACKEND ==========
  async syncWithBackend(outfit, interactionType, event) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/learn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          outfit: {
            item_id: outfit.item_id,
            color: outfit.color,
            style: outfit.style,
            material: outfit.material,
            category: outfit.category,
            price: outfit.price,
            name: outfit.name || outfit.subcategory
          },
          interaction_type: interactionType,
          event: event
        })
      });

      if (response.ok) {
        const data = await response.json();
      }
    } catch (error) {
      // Không log lỗi để không spam console khi offline
      // Learning vẫn được lưu locally
    }
  }

  // ========== TRÍCH XUẤT PATTERN TỪ TÊN OUTFIT ==========
  extractNamePatterns(name) {
    const patterns = [];
    const nameLower = name.toLowerCase();

    // Pattern loại đồ
    const itemTypes = ['áo', 'quần', 'váy', 'đầm', 'set', 'combo', 'hoodie', 'blazer', 'vest', 'polo', 'sweater', 'jean', 'jogger', 'chinos', 'short'];
    itemTypes.forEach(type => {
      if (nameLower.includes(type)) patterns.push(`type:${type}`);
    });

    // Pattern style trong tên
    const styleKeywords = ['oversize', 'slim', 'fit', 'basic', 'classic', 'casual', 'sporty', 'vintage', 'streetwear'];
    styleKeywords.forEach(kw => {
      if (nameLower.includes(kw)) patterns.push(`style:${kw}`);
    });

    // Pattern màu trong tên
    const colorKeywords = ['đen', 'trắng', 'xám', 'navy', 'be', 'hồng', 'xanh', 'đỏ', 'vàng', 'nâu'];
    colorKeywords.forEach(c => {
      if (nameLower.includes(c)) patterns.push(`color:${c}`);
    });

    return patterns;
  }

  // ========== XÁC ĐỊNH LOẠI ĐỘ HOÀN CHỈNH ==========
  getCompletenessType(name) {
    const nameLower = (name || '').toLowerCase();
    if (nameLower.includes('set') || nameLower.includes('combo') || nameLower.includes('+')) {
      return 'complete_set';
    } else if (nameLower.includes('áo') && (nameLower.includes('quần') || nameLower.includes('váy'))) {
      return 'multi_piece';
    }
    return 'single_item';
  }

  // ========== CẬP NHẬT USER PROFILE TỰ ĐỘNG ==========
  updateUserProfile(outfit, event) {
    const profile = this.data.userProfile;

    // Cập nhật price level
    if (outfit.price) {
      const priceLevel = this.getPriceRange(outfit.price);
      profile.preferredPriceLevel = this.calculateDominantValue('pricePreferences', event) || priceLevel;
    }

    // Cập nhật style type
    const style = (outfit.style || '').toLowerCase();
    if (['đơn giản', 'basic', 'minimalist'].some(s => style.includes(s))) {
      profile.styleType = 'minimalist';
    } else if (['lấp lánh', 'phong phú', 'maximalist', 'nhiều màu'].some(s => style.includes(s))) {
      profile.styleType = 'maximalist';
    }

    // Cập nhật color palette
    const color = (outfit.color || '').toLowerCase();
    if (['đỏ', 'hồng', 'vàng', 'cam'].some(c => color.includes(c))) {
      profile.colorPalette = 'warm';
    } else if (['xanh', 'tím', 'navy'].some(c => color.includes(c))) {
      profile.colorPalette = 'cool';
    } else if (['nhiều màu', 'neon', 'sáng'].some(c => color.includes(c))) {
      profile.colorPalette = 'vibrant';
    }

    profile.lastUpdated = Date.now();
  }

  // ========== LẤY GIÁ TRỊ THỐNG TRỊ ==========
  calculateDominantValue(prefType, event) {
    if (!this.data[prefType]?.[event]) return null;
    const prefs = this.data[prefType][event];
    const sorted = Object.entries(prefs).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : null;
  }

  // Hủy học khi unfavorite
  unlearnFromOutfit(outfit) {
    const event = outfit.suitable_events || 'đi chơi';
    const weight = 5; // Trọng số khi yêu thích là 5

    // ========== HỦY HỌC CƠ BẢN ==========
    this.decrementPreference('colorPreferences', event, outfit.color, weight);
    this.decrementPreference('materialPreferences', event, outfit.material, weight);
    this.decrementPreference('stylePreferences', event, outfit.style, weight);
    this.decrementPreference('categoryPreferences', event, outfit.category, weight);

    const priceRange = this.getPriceRange(outfit.price);
    this.decrementPreference('pricePreferences', event, priceRange, weight);

    // ========== HỦY HỌC NÂNG CAO ==========
    if (outfit.color && outfit.style) {
      const colorStyleCombo = `${outfit.color}|${outfit.style}`;
      this.decrementPreference('colorStyleCombos', event, colorStyleCombo, weight);
    }
    if (outfit.material && outfit.color) {
      const materialColorCombo = `${outfit.material}|${outfit.color}`;
      this.decrementPreference('materialColorCombos', event, materialColorCombo, weight);
    }
    const outfitName = outfit.name || outfit.subcategory || '';
    const namePatterns = this.extractNamePatterns(outfitName);
    namePatterns.forEach(pattern => {
      this.decrementPreference('namePatterns', event, pattern, weight);
    });
    const completeness = this.getCompletenessType(outfitName);
    this.decrementPreference('completenessPreference', event, completeness, weight);

    // ========== CẬP NHẬT TRACKING ==========
    if (this.data.totalInteractions > 0) this.data.totalInteractions--;
    if (this.data.favoriteCount > 0) this.data.favoriteCount--;

    // Xóa khỏi lịch sử (history)
    if (this.data.history) {
      this.data.history = this.data.history.filter(h => h.outfitId !== outfit.item_id);
    }

    this.saveData();
    this.updateLearningStatus();

    // Sync với backend
    this.syncUnlearnWithBackend(outfit, event);
  }

  // Sync unlearn với backend
  async syncUnlearnWithBackend(outfit, event) {
    try {
      await fetch(`${API_BASE_URL}/api/ai/unlearn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outfit: {
            item_id: outfit.item_id,
            color: outfit.color,
            style: outfit.style,
            material: outfit.material
          },
          event
        })
      });
    } catch (error) {
      // Silent fail - local unlearn already done
    }
  }

  // Tăng điểm ưa thích
  incrementPreference(type, event, value, weight = 1) {
    if (!value) return;
    // Đảm bảo type tồn tại
    if (!this.data[type]) {
      this.data[type] = {};
    }
    if (!this.data[type][event]) {
      this.data[type][event] = {};
    }
    if (!this.data[type][event][value]) {
      this.data[type][event][value] = 0;
    }
    this.data[type][event][value] += weight;
  }

  // Giảm điểm ưa thích
  decrementPreference(type, event, value, weight = 3) {
    if (!value || !this.data[type][event] || !this.data[type][event][value]) return;
    this.data[type][event][value] = Math.max(0, this.data[type][event][value] - weight);
    
    // Xóa key nếu điểm báo về 0 cho sạch
    if (this.data[type][event][value] === 0) {
      delete this.data[type][event][value];
    }
  }

  // Xác định khoảng giá
  getPriceRange(price) {
    if (price <= 50) return 'budget';
    if (price <= 100) return 'medium';
    if (price <= 200) return 'premium';
    return 'luxury';
  }

  // ========== TÍNH ĐIỂM TĂNG CƯỜNG NÂNG CAO TỪ HỌC AI ==========
  calculateLearningBonus(outfit, event) {
    if (this.data.totalInteractions < 2) {
      return 0; // Chưa đủ dữ liệu để học
    }

    let bonus = 0;

    // ========== BONUS CƠ BẢN ==========
    // Bonus từ màu sắc yêu thích
    const colorScore = this.getPreferenceScore('colorPreferences', event, outfit.color);
    bonus += colorScore * 0.10;

    // Bonus từ chất liệu yêu thích
    const materialScore = this.getPreferenceScore('materialPreferences', event, outfit.material);
    bonus += materialScore * 0.10;

    // AI NHẬN DIỆN VÀ HỌC PHONG CÁCH CỰC MẠNH (Dựa vào Tương Tác Yêu Thích)
    const styleScore = this.getPreferenceScore('stylePreferences', event, outfit.style);
    bonus += styleScore * 0.60; // Tăng lên 60% chỉ cho phong cách

    // ========== BONUS NÂNG CAO ==========
    // Bonus từ kết hợp màu + phong cách
    if (outfit.color && outfit.style) {
      const colorStyleCombo = `${outfit.color}|${outfit.style}`;
      const comboScore = this.getPreferenceScore('colorStyleCombos', event, colorStyleCombo);
      bonus += comboScore * 0.15;
    }

    // Bonus từ kết hợp chất liệu + màu  
    if (outfit.material && outfit.color) {
      const materialColorCombo = `${outfit.material}|${outfit.color}`;
      const matColorScore = this.getPreferenceScore('materialColorCombos', event, materialColorCombo);
      bonus += matColorScore * 0.10;
    }

    // Bonus từ name patterns
    const outfitName = outfit.name || outfit.subcategory || '';
    const namePatterns = this.extractNamePatterns ? this.extractNamePatterns(outfitName) : [];
    let patternBonus = 0;
    namePatterns.forEach(pattern => {
      patternBonus += this.getPreferenceScore('namePatterns', event, pattern) * 0.05;
    });
    bonus += Math.min(patternBonus, 3); // Tối đa 3 điểm từ pattern

    // Bonus từ completeness preference
    const completeness = this.getCompletenessType ? this.getCompletenessType(outfitName) : 'single_item';
    const completenessScore = this.getPreferenceScore('completenessPreference', event, completeness);
    bonus += completenessScore * 0.05;

    // ========== BONUS TỪ USER PROFILE (20% tổng bonus) ==========
    bonus += this.calculateProfileBonus(outfit, event);

    // ========== PHẠT NẾU KHÔNG TƯƠNG TÁC LÂU ==========
    // Nếu người dùng không tương tác lâu, giảm độ tin cậy
    if (this.data.lastInteractionDate) {
      const daysSinceInteraction = (Date.now() - this.data.lastInteractionDate) / (24 * 60 * 60 * 1000);
      if (daysSinceInteraction > 14) {
        bonus = bonus * 0.8; // Giảm 20% nếu không tương tác > 2 tuần
      }
    }

    return Math.min(maxBonus, Math.round(bonus));
  }

  // ========== TÍNH BONUS TỪ USER PROFILE ==========
  calculateProfileBonus(outfit, event) {
    const profile = this.data.userProfile;
    if (!profile || !profile.lastUpdated) return 0;

    let profileBonus = 0;

    // Check price level match
    const outfitPriceLevel = this.getPriceRange(outfit.price);
    if (outfitPriceLevel === profile.preferredPriceLevel) {
      profileBonus += 2;
    }

    // Check color palette match
    const color = (outfit.color || '').toLowerCase();
    if (profile.colorPalette === 'warm' && ['đỏ', 'hồng', 'vàng', 'cam'].some(c => color.includes(c))) {
      profileBonus += 1.5;
    } else if (profile.colorPalette === 'cool' && ['xanh', 'tím', 'navy'].some(c => color.includes(c))) {
      profileBonus += 1.5;
    } else if (profile.colorPalette === 'neutral' && ['đen', 'trắng', 'xám', 'be'].some(c => color.includes(c))) {
      profileBonus += 1.5;
    }

    // Check style type match
    const style = (outfit.style || '').toLowerCase();
    if (profile.styleType === 'minimalist' && ['đơn giản', 'basic', 'clean'].some(s => style.includes(s))) {
      profileBonus += 1.5;
    } else if (profile.styleType === 'balanced') {
      profileBonus += 0.5; // Neutral style always gets small bonus
    }

    return profileBonus;
  }

  // Lấy điểm ưa thích (0-20 dựa trên ranking và tần suất)
  getPreferenceScore(type, event, value) {
    if (!value || !this.data[type]?.[event]) return 0;

    const preferences = this.data[type][event];
    const sorted = Object.entries(preferences).sort((a, b) => b[1] - a[1]);
    const index = sorted.findIndex(([key]) => key === value);

    if (index === -1) return 0;

    // Tính điểm dựa trên ranking VÀ số lần tương tác
    const [, frequency] = sorted[index];
    let rankScore = 0;

    if (index === 0) rankScore = 18;       // Top 1
    else if (index === 1) rankScore = 14;  // Top 2
    else if (index === 2) rankScore = 10;  // Top 3
    else if (index <= 4) rankScore = 7;    // Top 5
    else if (index <= 9) rankScore = 4;    // Top 10
    else rankScore = 2;                     // Còn lại

    // Tăng điểm nếu tần suất cao (đã yêu thích nhiều lần)
    const frequencyBonus = Math.min(5, Math.floor(frequency / 5));

    return Math.min(20, rankScore + frequencyBonus);
  }

  // Lấy sở thích hàng đầu
  getTopPreferences(event) {
    const result = {
      colors: this.getTopItems('colorPreferences', event, 3),
      materials: this.getTopItems('materialPreferences', event, 3),
      styles: this.getTopItems('stylePreferences', event, 3),
      categories: this.getTopItems('categoryPreferences', event, 2)
    };
    return result;
  }

  // Lấy top items của một loại
  getTopItems(type, event, count = 3) {
    if (!this.data[type][event]) return [];

    const sorted = Object.entries(this.data[type][event])
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([key, score]) => ({ name: key, score }));

    return sorted;
  }

  // Cập nhật hiển thị trạng thái học
  updateLearningStatus() {
    const statusEl = document.getElementById('ai-learning-status');
    if (statusEl) {
      const level = this.getLearningLevel();

      // Chỉ cập nhật text, KHÔNG ghi đè HTML để giữ nút Reset
      const iconEl = statusEl.querySelector('.learning-icon');
      const textEl = statusEl.querySelector('.learning-text');
      const countEl = statusEl.querySelector('.learning-count');

      if (iconEl) iconEl.textContent = level.icon;
      if (textEl) textEl.textContent = level.text;
      if (countEl) countEl.textContent = `(${this.data.totalInteractions} tương tác)`;

      statusEl.className = `ai-learning-status level-${level.level}`;
    }
  }

  // Xác định mức độ học
  getLearningLevel() {
    const count = this.data.totalInteractions;
    if (count === 0) return { level: 0, icon: '🤖', text: 'AI chưa học' };
    if (count < 5) return { level: 1, icon: '📚', text: 'AI đang học' };
    if (count < 15) return { level: 2, icon: '🧠', text: 'AI đã hiểu bạn' };
    if (count < 30) return { level: 3, icon: '🎯', text: 'AI rất hiểu bạn' };
    return { level: 4, icon: '⭐', text: 'AI chuyên gia về bạn' };
  }

  // Reset dữ liệu học
  resetLearning() {
    this.data = {
      colorPreferences: {},
      materialPreferences: {},
      stylePreferences: {},
      categoryPreferences: {},
      pricePreferences: {},
      totalInteractions: 0,
      history: []
    };
    this.saveData();
    this.updateLearningStatus();
  }

  // Xuất báo cáo học
  getLearningReport() {
    return {
      totalInteractions: this.data.totalInteractions,
      level: this.getLearningLevel(),
      colorPreferences: this.data.colorPreferences,
      materialPreferences: this.data.materialPreferences,
      stylePreferences: this.data.stylePreferences
    };
  }
}

// Khởi tạo AI Learning Manager
const aiLearning = new AILearningManager();

// === DEBUG: Test AI Learning từ Console ===
window.testAILearn = function () {
  aiLearning.data.totalInteractions++;
  aiLearning.saveData();
  aiLearning.updateLearningStatus();
  return 'OK! Đã tăng tương tác.';
};

// ==========================================
// PHẦN 2: QUẢN LÝ DANH SÁCH YÊU THÍCH (FAVORITES)
// ==========================================
// Lớp FavoritesManager giúp người dùng có thể "Thả tim"
// trang phục và nó sẽ lưu ngay vào bộ nhớ LocalStorage
// của trình duyệt (F12 -> Application -> LocalStorage).
// Vì vậy nếu tắt web mở lại thì danh sách tim vẫn còn đó.
let allViewedItems = {};

// Quản lý mục yêu thích bằng localStorage - Lưu cả dữ liệu item
class FavoritesManager {
  constructor() {
    let userSuffix = '_guest';
    try {
      const user = JSON.parse(localStorage.getItem('currentUser'));
      if (user && user.username) userSuffix = `_${user.username}`;
    } catch (e) {}

    this.key = `outfit_favorites${userSuffix}`;
    this.itemsKey = `outfit_favorites_items${userSuffix}`; // Lưu full item data
    this.favs = JSON.parse(localStorage.getItem(this.key) || '{}');
    this.items = JSON.parse(localStorage.getItem(this.itemsKey) || '{}');

    // Load saved items vào allViewedItems khi khởi tạo
    Object.assign(allViewedItems, this.items);
  }
  add(id, itemData = null) {
    this.favs[id] = true;
    // Lưu item data nếu có
    if (itemData) {
      this.items[id] = itemData;
      localStorage.setItem(this.itemsKey, JSON.stringify(this.items));
    }
    this.save();
    this.updateCount();
  }
  addWithData(id, itemData) {
    this.favs[id] = true;
    this.items[id] = itemData;
    localStorage.setItem(this.itemsKey, JSON.stringify(this.items));
    // Cập nhật allViewedItems
    if (typeof allViewedItems !== 'undefined') {
      allViewedItems[id] = itemData;
    }
    this.save();
    this.updateCount();
  }
  remove(id) {
    delete this.favs[id];
    delete this.items[id];
    localStorage.setItem(this.itemsKey, JSON.stringify(this.items));
    this.save();
    this.updateCount();
  }
  toggle(id, itemData = null) {
    if (this.favs[id]) {
      this.remove(id);
    } else {
      if (itemData) {
        this.addWithData(id, itemData);
      } else {
        this.add(id);
      }
    }
  }
  isFav(id) {
    return !!this.favs[id];
  }
  getAll() {
    return Object.keys(this.favs);
  }
  getAllItems() {
    return this.items;
  }
  save() {
    localStorage.setItem(this.key, JSON.stringify(this.favs));
  }
  updateCount() {
    document.getElementById('fav-count').textContent = Object.keys(this.favs).length;
  }
  clearAll() {
    this.favs = {};
    this.items = {};
    localStorage.removeItem(this.key);
    localStorage.removeItem(this.itemsKey);
    this.updateCount();
  }
}

const favorites = new FavoritesManager();
// Xóa dữ liệu yêu thích cũ không hợp lệ (không có item data)
(function cleanupInvalidFavorites() {
  const favKeys = Object.keys(favorites.favs);
  const itemKeys = Object.keys(favorites.items);
  let cleaned = false;
  favKeys.forEach(id => {
    if (!favorites.items[id]) {
      delete favorites.favs[id];
      cleaned = true;
    }
  });
  if (cleaned) {
    favorites.save();
    favorites.updateCount();
  }
})();

// ==========================================
// PHẦN 3: VẼ GIAO DIỆN (UI RENDERING)
// ==========================================

// Hàm renderCard chịu trách nhiệm "vẽ" ra một khung hình ảnh 
// trang phục lên trang web. Mọi cấu trúc html (như thẻ div, tiêu đề, img)
// đều được sinh ra tự động ở đây. Thêm cả chức năng gắn 'thẻ điểm AI'.
// Vẽ thẻ trang phục
function renderCard(item) {
  try {
    if (!item) {
      console.warn('renderCard: item is null');
      return null;
    }

    const card = document.createElement('div');
    card.className = 'card';

    const displayName = item.name || item.subcategory || 'Outfit';

    const showAIScore = item.aiScore !== null && item.aiScore !== undefined && !isSampleMode;

    let scoreBadgeHtml = '';
    if (showAIScore) {
      const scoreClass = item.aiScore >= 90 ? 'excellent' : item.aiScore >= 80 ? 'good' : 'normal';
      const scoreDetails = item.scoreDetails || {};
      const tooltipContent = buildScoreTooltip(scoreDetails);
      scoreBadgeHtml = `
        <div class="ai-score-badge ${scoreClass}" title="${tooltipContent}">
          <span class="score">🤖 ${item.aiScore}%</span>
        </div>
      `;
    }

    const aiReasonHtml = showAIScore && item.aiReason ? `<p class="ai-reason">💡 ${item.aiReason}</p>` : '';

    const imagePath = item.image_path || '../data/images/placeholder.jpg';

    card.innerHTML = `
      <div class="card-image">
        <img src="${imagePath}" alt="${displayName}" loading="lazy" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2214%22%3ENo Image%3C/text%3E%3C/svg%3E'" />
        ${scoreBadgeHtml}
      </div>
      <div class="card-info">
        <h3 class="card-title">${displayName}</h3>
        <p class="card-meta">💡 Phù hợp tốt với dịp ${item.suitable_events || 'này'}</p>
        <div class="card-actions">
          <button class="btn-small view-btn" data-id="${item.item_id}">Xem</button>
          <button class="btn-small fav-toggle" data-id="${item.item_id}">❤️</button>
        </div>
      </div>
    `;

    const favToggle = card.querySelector('.fav-toggle');
    if (favToggle) {
      if (favorites.isFav(item.item_id)) {
        favToggle.style.background = '#e74c3c';
        favToggle.style.color = '#fff'
      }
      favToggle.addEventListener('click', (e) => {
        e.stopPropagation();

        // Kiểm tra đăng nhập
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!currentUser || !currentUser.username) {
          showToast('Vui lòng đăng nhập để sử dụng tính năng yêu thích!', 'info');
          const authModal = document.getElementById('auth-modal');
          if (authModal) authModal.classList.remove('hidden');
          return;
        }

        const wasAlreadyFav = favorites.isFav(item.item_id);
        favorites.toggle(item.item_id, item);
        if (favorites.isFav(item.item_id)) {
          favToggle.style.background = '#e74c3c';
          favToggle.style.color = '#fff';
          if (typeof aiLearning !== 'undefined' && aiLearning) {
            aiLearning.learnFromOutfit(item, 'favorite');
          }
        } else {
          favToggle.style.background = '#fff';
          favToggle.style.color = '#000';
          if (typeof aiLearning !== 'undefined' && aiLearning) {
            aiLearning.unlearnFromOutfit(item);
          }
        }
      });
    }

    const viewBtn = card.querySelector('.view-btn');
    if (viewBtn) {
      viewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showDetailModal(item);
      });
    }

    return card;
  } catch (err) {
    console.error('renderCard error:', err, 'item:', item);
    return null;
  }
}

function renderResults(items, title = '', info = '') {
  const container = document.getElementById('results');
  container.innerHTML = '';

  // Ẩn AI stats và load more wrapper ban đầu
  const aiStats = document.getElementById('ai-stats');
  const resultsTitle = document.getElementById('results-title');
  const resultsInfo = document.getElementById('results-info');
  const loadMoreWrapper = document.getElementById('load-more-wrapper');

  // Nếu đây là reset (items rỗng nhưng allResults có data) - chỉ set title
  if ((!items || items.length === 0) && allResults.length > 0) {
    if (resultsTitle) resultsTitle.innerHTML = title || '<i class="fas fa-fire-alt"></i> AI Gợi Ý Trang Phục';
    if (resultsInfo) resultsInfo.textContent = info || 'Đang tải outfit...';
    if (aiStats) aiStats.classList.add('hidden');
    if (loadMoreWrapper) loadMoreWrapper.classList.add('hidden');
    return;
  }

  // Không có kết quả thực sự
  if (!items || items.length === 0) {
    if (resultsTitle) resultsTitle.innerHTML = '<i class="fas fa-search"></i> Không tìm thấy kết quả';
    if (resultsInfo) resultsInfo.textContent = 'Hãy thử lại với tham số khác.';
    if (aiStats) aiStats.classList.add('hidden');
    if (loadMoreWrapper) loadMoreWrapper.classList.add('hidden');
    const div = document.createElement('div');
    div.className = 'empty-state';
    div.innerHTML = '<i class="fas fa-sad-tear"></i><h3>Không tìm thấy outfit</h3><p>Hãy thử tiêu chí khác</p>';
    container.appendChild(div);
    return;
  }

  if (resultsTitle) resultsTitle.innerHTML = title || '<i class="fas fa-fire-alt"></i> AI Gợi Ý Trang Phục';
  if (resultsInfo) resultsInfo.textContent = info || `AI đã phân tích và gợi ý ${items.length} outfit phù hợp.`;

  // Cập nhật AI stats
  if (aiStats) {
    aiStats.classList.remove('hidden');
    const avgScore = Math.round(items.reduce((sum, item) => sum + (item.aiScore || 80), 0) / items.length);
    const matchScore = document.getElementById('match-score');
    const analysisCount = document.getElementById('analysis-count');
    if (matchScore) matchScore.textContent = avgScore + '%';
    if (analysisCount) analysisCount.textContent = items.length;
  }

  const fragment = document.createDocumentFragment();
  items.forEach(item => {
    const card = renderCard(item);
    if (card) fragment.appendChild(card);
  });
  container.appendChild(fragment);
}

// Detail Modal - Hiển thị chi tiết với thông tin AI
function showDetailModal(item) {
  // Lưu item vào allViewedItems để có thể tìm trong favorites
  if (item.item_id) {
    allViewedItems[item.item_id] = item;
  }

  const modalImg = document.getElementById('modal-img');
  const modalName = document.getElementById('modal-name');
  const modalCategory = document.getElementById('modal-category');
  const modalDesc = document.getElementById('modal-desc');
  const modalColor = document.getElementById('modal-color');
  const modalStyle = document.getElementById('modal-style');
  const modalMaterial = document.getElementById('modal-material');
  const modalEvents = document.getElementById('modal-events');

  // Sử dụng tên từ database
  const displayName = item.name || item.subcategory;

  if (modalImg) { modalImg.src = item.image_path; modalImg.alt = displayName; }
  if (modalName) modalName.textContent = displayName;
  if (modalCategory) modalCategory.textContent = `Set đồ • ${item.material || '...'}`;
  if (modalDesc) modalDesc.textContent = `💡 ${item.aiReason || 'Phù hợp với phong cách của bạn'} | Phong cách: ${item.style}`;
  if (modalColor) modalColor.textContent = item.color;
  if (modalStyle) modalStyle.textContent = item.style;
  if (modalMaterial) modalMaterial.textContent = item.material;
  if (modalEvents) modalEvents.textContent = (item.suitable_events || '—').replace(/;/g, ', ');

  const favBtn = document.getElementById('modal-fav-btn');
  if (favorites.isFav(item.item_id)) { favBtn.textContent = '❤️ Đã thêm vào yêu thích'; favBtn.style.background = '#e74c3c' }
  else { favBtn.textContent = '❤️ Thêm vào yêu thích'; favBtn.style.background = 'var(--primary)' }
  favBtn.onclick = (e) => {
    e.stopPropagation();

    // Kiểm tra đăng nhập
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.username) {
      showToast('Vui lòng đăng nhập để sử dụng tính năng yêu thích!', 'info');
      const authModal = document.getElementById('auth-modal');
      if (authModal) authModal.classList.remove('hidden');
      return;
    }

    const wasAlreadyFav = favorites.isFav(item.item_id);
    favorites.toggle(item.item_id, item);  // Truyền item data
    // AI Learning: Học khi user yêu thích, hủy học khi bỏ yêu thích
    if (favorites.isFav(item.item_id)) {
      favBtn.textContent = '❤️ Đã thêm vào yêu thích'; favBtn.style.background = '#e74c3c';
      aiLearning.learnFromOutfit(item, 'favorite');
    } else {
      favBtn.textContent = '❤️ Thêm vào yêu thích'; favBtn.style.background = 'var(--primary)';
      aiLearning.unlearnFromOutfit(item);
    }
  };

  document.getElementById('detail-modal').classList.remove('hidden');
}

// Modal sửa tên outfit
function showEditNameModal(item) {
  const displayName = item.name || item.subcategory;

  // Tạo modal nếu chưa có
  let modal = document.getElementById('edit-name-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'edit-name-modal';
    modal.className = 'modal hidden';
    modal.innerHTML = `
      <div class="modal-overlay"></div>
      <div class="modal-content modal-small">
        <button class="modal-close" id="edit-name-close"><i class="fas fa-times"></i></button>
        <h2><i class="fas fa-edit"></i> Sửa tên outfit</h2>
        <p class="edit-help">AI sẽ học tên mới này cho lần sau</p>
        <div class="edit-preview">
          <img id="edit-preview-img" src="" alt="Preview" />
        </div>
        <div class="form-group">
          <label>Tên hiện tại:</label>
          <p id="edit-current-name" class="current-name"></p>
        </div>
        <div class="form-group">
          <label for="edit-new-name">Tên mới:</label>
          <input type="text" id="edit-new-name" placeholder="Nhập tên mới cho outfit..." />
        </div>
        <div class="edit-actions">
          <button id="edit-save-btn" class="btn-primary"><i class="fas fa-save"></i> Lưu</button>
          <button id="edit-reset-btn" class="btn-secondary"><i class="fas fa-undo"></i> Reset</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector('#edit-name-close').addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    modal.querySelector('.modal-overlay').addEventListener('click', () => {
      modal.classList.add('hidden');
    });
  }

  // Cập nhật thông tin modal
  modal.querySelector('#edit-preview-img').src = item.image_path;
  modal.querySelector('#edit-current-name').textContent = displayName;
  const newNameInput = modal.querySelector('#edit-new-name');
  newNameInput.value = displayName;

  // Lưu tên mới
  modal.querySelector('#edit-save-btn').onclick = () => {
    const newName = newNameInput.value.trim();
    if (newName && newName !== displayName) {
      // Lưu vào manager
      outfitNameManager.setOutfitName(item.gender, item.suitable_events, item.imageIndex, newName);

      // Thông báo
      showToast(`✅ Đã cập nhật tên thành: ${newName}\n\nAI đã học tên mới này!`, 'success');

      // Đóng modal
      modal.classList.add('hidden');

      // Refresh kết quả
      performSearch();
    }
  };

  // Reset tên về mặc định
  modal.querySelector('#edit-reset-btn').onclick = () => {
    outfitNameManager.resetOutfitName(item.gender, item.suitable_events, item.imageIndex);
    showToast('🔄 Đã reset tên về mặc định!', 'success');
    modal.classList.add('hidden');
    performSearch();
  };

  modal.classList.remove('hidden');
  newNameInput.focus();
  newNameInput.select();
}

// Bảng điều khiển mục yêu thích

function showFavoritesPanel() {
  const favIds = favorites.getAll();
  const savedItems = favorites.getAllItems(); // Items đã lưu trong localStorage

  // Kết hợp items từ allViewedItems và savedItems
  const allItems = { ...savedItems, ...allViewedItems };
  const favItems = Object.values(allItems).filter(d => d && d.item_id && favIds.includes(d.item_id));

  const container = document.getElementById('favorites-list');
  container.innerHTML = '';

  // Cập nhật số lượng yêu thích
  const favTotal = document.getElementById('fav-total');
  if (favTotal) favTotal.textContent = favItems.length;

  if (favItems.length === 0) {
    const p = document.createElement('p');
    p.style.textAlign = 'center';
    p.style.color = 'var(--muted)';
    p.textContent = 'Bạn chưa thêm sản phẩm yêu thích nào.';
    container.appendChild(p);
  } else {
    const fragment = document.createDocumentFragment();
    favItems.forEach(item => {
      const card = renderCard(item);
      if (card) fragment.appendChild(card);
    });
    container.appendChild(fragment);
  }
  document.getElementById('favorites-panel').classList.remove('hidden');
}

// Tìm kiếm & Lọc bộ lọc - Gợi ý AI
// Lưu trữ kết quả tìm kiếm hiện tại để dùng cho favorites
let currentResults = [];

// Phân trang: Hiển thị 10 outfit mỗi lần
const ITEMS_PER_PAGE = 10;
let displayedCount = 0;
let allResults = [];

// Cờ báo: Chế độ xem mẫu (không có AI score) hay chế độ AI gợi ý
let isSampleMode = false;

// Hiển thị/ẩn AI processing indicator
function showAIProcessing(show) {
  const processingEl = document.getElementById('ai-processing');
  if (processingEl) {
    if (show) {
      processingEl.classList.remove('hidden');
    } else {
      processingEl.classList.add('hidden');
    }
  }
}

// Gọi AI API để lấy recommendations
async function callAIRecommendAPI(gender, event, formality, category) {
  try {
    const response = await fetch(AI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        gender: gender,
        event: event,
        formality: formality,
        top_n: 24
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('AI API Error:', error);
    return null;
  }
}

// Hàm dự phòng khi API không hoạt động
function performSearchFallback(gender, event, formality, category, sort, weather = '') {
  // Lưu formality vào global để các hàm con sử dụng
  currentUserFormality = formality || 'all';
  currentWeather = weather || '';

  // Sử dụng generateOutfits local khi API fails - lấy TẤT CẢ outfit (100) - TRUYỀN FORMALITY VÀ WEATHER
  let results = generateOutfits(gender, event, 100, formality, weather);

  // Lọc theo category nếu có
  if (category) {
    results = results.filter(d => d.category === category);
  }

  // Sort
  if (sort === 'popularity') { results.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0)) }
  else if (sort === 'price-low') { results.sort((a, b) => a.price - b.price) }
  else if (sort === 'price-high') { results.sort((a, b) => b.price - a.price) }

  return results;
}

// ==========================================
// PHẦN 4: HÀM TÌM KIẾM CHI CHÍNH (PERFORM SEARCH)
// ==========================================
// Đây là hàm kích hoạt ngay khi bạn bấm nút "Gợi Ý Outfit".
// Trình tự làm việc:
// 1. Lấy thông số (Giới tính, Sự kiện, Thời tiết) từ biểu mẫu.
// 2. Hiện thẻ xoay vòng "AI Đang Suy Nghĩ...".
// 3. Gửi thông số này thẳng tới Backend qua đường dẫn /api/ai/engine/recommend.
// 4. Nhận dữ liệu Backend trả về. Nếu lấy dữ liệu lỗi, nó tự động
//    chuyển sang 'performSearchFallback' để lấy dữ liệu có sẵn.
// 5. Tính toán vẽ thẻ hình bằng DocumentFragment và nhét lên trang.
async function performSearch() {
  isSampleMode = false; // Tắt chế độ sample, bật chế độ AI

  const event = (document.getElementById('event').value || '').toLowerCase().trim();
  const formality = document.getElementById('formality').value;
  const gender = document.getElementById('gender').value;
  const weather = document.getElementById('weather').value || ''; // THÊM LẤY WEATHER
  const category = ''; // Đã loại bỏ dropdown category
  const sort = 'popularity'; // Đã loại bỏ dropdown sort, mặc định sắp xếp theo AI score

  // ========== LƯU FORMALITY VÀO GLOBAL ĐỂ AI SỬ DỤNG ==========
  currentUserFormality = formality || 'all';
  currentWeather = weather || ''; // THÊM LƯU WEATHER VÀO GLOBAL

  // ========== XÓA CACHE CŨ KHI ĐỔI FORMALITY HOẶC WEATHER ==========
  scoreCache.clear();

  if (!gender) { showToast('Vui lòng chọn giới tính để AI phân tích', 'error'); return }
  if (!event) { showToast('Vui lòng chọn sự kiện để AI gợi ý', 'error'); return }

  // Hiển thị AI đang xử lý
  showAIProcessing(true);

  // Xóa màn hình cũ và ẩn các thông số trong lúc AI "đang suy nghĩ"
  const container = document.getElementById('results');
  if (container) container.innerHTML = '';
  const resultsTitle = document.getElementById('results-title');
  if (resultsTitle) resultsTitle.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AI Đang Suy Nghĩ...';
  const aiStats = document.getElementById('ai-stats');
  if (aiStats) aiStats.classList.add('hidden');
  const loadMoreWrapper = document.getElementById('load-more-wrapper');
  if (loadMoreWrapper) loadMoreWrapper.classList.add('hidden');

  // Tạo độ trễ nhân tạo 2.5 giây để người dùng thấy AI đang làm việc (theo yêu cầu)
  const artificialDelay = 2500;
  await new Promise(resolve => setTimeout(resolve, artificialDelay));

  try {
    let results;
    let analysisInfo = '';

    // ========== NẾU CÓ WEATHER, FORCE DÙNG LOCAL GENERATION (backend API không support weather) ==========
    if (weather) {
      results = performSearchFallback(gender, event, formality, category, sort, weather);
    } else {
      // Gọi AI API nếu không có weather
      const apiResponse = await callAIRecommendAPI(gender, event, formality, category);

      if (apiResponse && apiResponse.status === 'success' && apiResponse.recommendations) {
        // Sử dụng kết quả từ AI API
        results = apiResponse.recommendations;

        // Thêm image_path cho các items từ API
        results = results.map((item, index) => ({
          ...item,
          image_path: item.image_path || getImagePath(gender, event, index + 1),
          item_id: item.item_id || `${gender}_${event}_${index + 1}`.replace(/\s/g, '_')
        }));

        // Hiển thị thông tin phân tích từ AI
        if (apiResponse.analysis) {
          analysisInfo = `AI đã phân tích ${apiResponse.analysis.total_items} mẫu với độ phù hợp trung bình ${apiResponse.analysis.avg_ai_score}%`;
        }
      } else {
        // Fallback to local generation
        results = performSearchFallback(gender, event, formality, category, sort, weather);
      }
    }

    // Lọc theo category nếu có
    if (category) {
      results = results.filter(d => d.category === category);
    }

    // Sort
    if (sort === 'popularity') { results.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0)) }
    else if (sort === 'price-low') { results.sort((a, b) => a.price - b.price) }
    else if (sort === 'price-high') { results.sort((a, b) => b.price - a.price) }

    // Đổi tên thành Set 1, Set 2... theo sự kiện
    results.forEach((item, index) => {
      const eventName = item.suitable_events ? (item.suitable_events.charAt(0).toUpperCase() + item.suitable_events.slice(1)) : '';
      item.name = `Set ${index + 1} ${eventName}`;
    });

    // Lưu kết quả để dùng cho favorites
    currentResults = results;
    allResults = results;
    results.forEach(item => { allViewedItems[item.item_id] = item; });

    const titleGender = gender === 'nữ' ? 'Nữ' : 'Nam';
    const eventName = event.charAt(0).toUpperCase() + event.slice(1);
    const title = `🤖 AI Gợi Ý ${eventName} cho ${titleGender}`;

    showAIProcessing(false);

    // Reset và hiển thị 5 items đầu tiên
    displayedCount = 0;
    renderResults([], title, analysisInfo); // Clear first
    loadMoreOutfits();

  } catch (error) {
    console.error('Search Error:', error);

    // Fallback to local generation
    const results = performSearchFallback(gender, event, formality, category, sort, weather);

    // Đổi tên thành Set 1, Set 2...
    results.forEach((item, index) => {
      const eventName = item.suitable_events ? (item.suitable_events.charAt(0).toUpperCase() + item.suitable_events.slice(1)) : '';
      item.name = `Set ${index + 1} ${eventName}`;
    });

    currentResults = results;
    allResults = results;
    results.forEach(item => { allViewedItems[item.item_id] = item; });

    const titleGender = gender === 'nữ' ? 'Nữ' : 'Nam';
    const eventName = event.charAt(0).toUpperCase() + event.slice(1);
    const title = `🤖 AI Gợi Ý ${eventName} cho ${titleGender}`;

    showAIProcessing(false);

    // Reset và hiển thị 5 items đầu tiên
    displayedCount = 0;
    renderResults([], title); // Clear first
    loadMoreOutfits();
  }
}

// Hàm load thêm 5 outfit tiếp theo
async function loadMoreOutfits(e) {
  const container = document.getElementById('results');
  const loadMoreWrapper = document.getElementById('load-more-wrapper');
  const loadMoreBtn = document.getElementById('load-more-btn');

  // Lấy 5 items tiếp theo
  const nextItems = allResults.slice(displayedCount, displayedCount + ITEMS_PER_PAGE);

  if (nextItems.length === 0) {
    if (loadMoreWrapper) loadMoreWrapper.classList.add('hidden');
    return;
  }

  // Nếu người dùng click nút "Gợi Ý Tiếp", hiển thị hiệu ứng AI suy nghĩ
  if (e && e.type === 'click' && loadMoreBtn && !isSampleMode) {
    loadMoreBtn.disabled = true;
    const originalText = loadMoreBtn.innerHTML;
    loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> AI đang suy nghĩ...';
    
    // Tạo độ trễ nhân tạo 2.5 giây để người dùng thấy AI đang làm việc (theo yêu cầu)
    const artificialDelay = 2500;
    await new Promise(resolve => setTimeout(resolve, artificialDelay));
    
    loadMoreBtn.disabled = false;
  }

  // Xóa empty state nếu có
  const emptyState = container.querySelector('.empty-state');
  if (emptyState) emptyState.remove();

  // Thêm các items mới (tối ưu hóa DOM)
  const fragment = document.createDocumentFragment();
  nextItems.forEach(item => {
    const card = renderCard(item);
    if (card) fragment.appendChild(card);
  });
  container.appendChild(fragment);

  displayedCount += nextItems.length;

  // Cập nhật AI stats (chỉ hiện khi không phải sample mode)
  const aiStats = document.getElementById('ai-stats');
  const matchScore = document.getElementById('match-score');
  const analysisCount = document.getElementById('analysis-count');

  if (aiStats) {
    if (isSampleMode) {
      aiStats.classList.add('hidden');
    } else {
      aiStats.classList.remove('hidden');
      const displayedItems = allResults.slice(0, displayedCount);
      const avgScore = Math.round(displayedItems.reduce((sum, item) => sum + (item.aiScore || 80), 0) / displayedItems.length);
      if (matchScore) matchScore.textContent = avgScore + '%';
      if (analysisCount) analysisCount.textContent = displayedCount + '/' + allResults.length;
    }
  }

  // Hiển thị/Ẩn nút "Xem thêm"
  if (displayedCount < allResults.length) {
    if (loadMoreWrapper) loadMoreWrapper.classList.remove('hidden');
    if (loadMoreBtn) {
      const remaining = allResults.length - displayedCount;
      const btnText = isSampleMode ? `Xem Tiếp (còn ${remaining} mẫu)` : `Gợi Ý Tiếp (còn ${remaining} bộ)`;
      loadMoreBtn.innerHTML = `<i class="fas fa-sync-alt"></i> ${btnText}`;
    }
  } else {
    if (loadMoreWrapper) loadMoreWrapper.classList.add('hidden');
  }

  // Cập nhật results info
  const resultsInfo = document.getElementById('results-info');
  if (resultsInfo) {
    const moreText = isSampleMode ? 'Bấm "Xem Tiếp" để xem thêm!' : 'Bấm "Gợi Ý Tiếp" để xem thêm!';
    resultsInfo.textContent = `Đang hiển thị ${displayedCount}/${allResults.length} outfit. ${displayedCount < allResults.length ? moreText : 'Đã hiển thị tất cả!'}`;
  }
}

function loadDemo() {
  console.log('=== LOADEMO START ===');

  // Chế độ xem mẫu - không có điểm AI
  const event = (document.getElementById('event').value || '').toLowerCase().trim();
  const gender = document.getElementById('gender').value;
  const weather = document.getElementById('weather').value || '';

  console.log('Event:', event, 'Gender:', gender, 'Weather:', weather);

  if (!gender) { showToast('Vui lòng chọn giới tính', 'error'); return }
  if (!event) { showToast('Vui lòng chọn sự kiện', 'error'); return }

  isSampleMode = true;

  // Lấy outfit từ database theo bộ lọc
  const genderKey = gender.toLowerCase();
  const eventKey = event;

  console.log('GenderKey:', genderKey, 'EventKey:', eventKey);
  console.log('Database exists:', typeof outfitDatabase !== 'undefined');

  if (outfitDatabase) {
    console.log('Database keys:', Object.keys(outfitDatabase));
    console.log('Gender data exists:', genderKey in outfitDatabase);
    if (genderKey in outfitDatabase) {
      console.log('Available events:', Object.keys(outfitDatabase[genderKey]));
    }
  }

  let outfits = [];

  // QUAN TRỌNG: Luôn dùng database nếu có, không dùng templates mẫu
  if (outfitDatabase && outfitDatabase[genderKey] && outfitDatabase[genderKey][eventKey]) {
    const dbOutfits = outfitDatabase[genderKey][eventKey];
    console.log('Found outfits in DB:', dbOutfits.length);

    outfits = dbOutfits.map((item, index) => ({
      ...item,
      item_id: `${genderKey}_${eventKey}_${item.id || index + 1}`,
      image_path: getImagePath(genderKey, event, index + 1),
      aiScore: null,
      category: item.category || 'Đồ',
      color: item.color || 'Nhiều màu',
      style: item.style || 'Casual',
      suitable_events: eventKey
    }));

    console.log('Mapped outfits:', outfits.length);

    if (weather) {
      const beforeWeather = outfits.length;
      outfits = outfits.filter(outfit => {
        const weatherScore = calculateWeatherScore(outfit.material, outfit.color, outfit.style, weather);
        return weatherScore >= 50;
      });
      console.log('After weather filter:', outfits.length, `(filtered ${beforeWeather - outfits.length})`);
    }
  } else {
    console.error('Database lookup failed for:', genderKey, eventKey);
    showToast('Không tìm thấy outfit cho ' + genderKey + ' - ' + eventKey, 'error');
    return;
  }

  console.log('Final outfits count:', outfits.length);

  // Đổi tên thành Set 1, Set 2...
  outfits.forEach((item, index) => {
    const eventName = item.suitable_events ? (item.suitable_events.charAt(0).toUpperCase() + item.suitable_events.slice(1)) : '';
    item.name = `Set ${index + 1} ${eventName}`;
  });

  // Lưu kết quả
  currentResults = outfits;
  allResults = outfits;
  outfits.forEach(item => { allViewedItems[item.item_id] = item; });

  const titleGender = gender === 'nữ' ? 'Nữ' : 'Nam';
  const eventName = event.charAt(0).toUpperCase() + event.slice(1);
  const title = `👀 Xem Mẫu ${eventName} cho ${titleGender}`;

  // CRITICAL: Clear container FIRST
  const container = document.getElementById('results');
  console.log('Container found:', !!container);

  if (!container) {
    console.error('Results container not found!');
    return;
  }

  container.innerHTML = '';

  // Cập nhật title
  const resultsTitle = document.getElementById('results-title');
  if (resultsTitle) resultsTitle.innerHTML = title;

  // Ẩn AI stats khi xem mẫu
  const aiStats = document.getElementById('ai-stats');
  if (aiStats) aiStats.classList.add('hidden');

  // Hiển thị tất cả outfit cùng lúc
  console.log('Starting to render cards...');

  const fragment = document.createDocumentFragment();
  outfits.forEach((item, idx) => {
    try {
      const card = renderCard(item);
      if (card) {
        fragment.appendChild(card);
        if (idx < 3) console.log(`Card ${idx} prepared:`, item.name);
      } else {
        console.warn('renderCard returned null for item:', item.name);
      }
    } catch (err) {
      console.error('Error rendering card', idx, ':', err);
    }
  });
  container.appendChild(fragment);

  displayedCount = outfits.length;
  console.log('Cards rendered:', displayedCount);

  // Ẩn nút "Xem Tiếp" vì đã hiển thị hết
  const loadMoreWrapper = document.getElementById('load-more-wrapper');
  if (loadMoreWrapper) loadMoreWrapper.classList.add('hidden');

  // Cập nhật info
  const resultsInfo = document.getElementById('results-info');
  if (resultsInfo) {
    resultsInfo.textContent = `Đang hiển thị ${outfits.length} outfit. ${outfits.length > 0 ? 'Bấm ❤️ để AI học sở thích của bạn!' : 'Không tìm thấy outfit phù hợp.'}`;
  }

  console.log('=== LOADDEMO END ===');
}

// Event Listeners
document.getElementById('search-btn').addEventListener('click', performSearch);
document.getElementById('demo-btn').addEventListener('click', loadDemo);
document.getElementById('load-more-btn').addEventListener('click', loadMoreOutfits);

// Reset AI button - xóa cache điểm và dữ liệu học
document.getElementById('reset-ai-btn').addEventListener('click', function () {
  if (confirm('Bạn có chắc muốn reset AI về ban đầu? Điểm và dữ liệu học sẽ được tính lại.')) {
    // Xóa cache điểm
    scoreCache.clear();
    // Reset AI learning
    if (typeof aiLearning !== 'undefined' && aiLearning) {
      aiLearning.resetLearning();
    }
    // Reset favorites
    favorites.clearAll();
    showToast('Đã reset AI! Refresh trang để thấy thay đổi.', 'success');
    location.reload();
  }
});

// Cập nhật category khi chọn giới tính (không tự động search)
document.getElementById('gender').addEventListener('change', function () {
  updateCategoryOptions(this.value);
});

document.getElementById('modal-close').addEventListener('click', () => {
  document.getElementById('detail-modal').classList.add('hidden');
});
document.getElementById('fav-close').addEventListener('click', () => {
  document.getElementById('favorites-panel').classList.add('hidden');
});
document.getElementById('favorites-btn').addEventListener('click', showFavoritesPanel);

// Close modals on background click
['detail-modal', 'favorites-panel'].forEach(id => {
  document.getElementById(id).addEventListener('click', (e) => {
    if (e.target.id === id) e.target.classList.add('hidden');
  });
});

// ========== THEME TOGGLE LOGIC ==========
const themeToggleBtn = document.getElementById('theme-toggle');
const body = document.body;
const icon = themeToggleBtn.querySelector('i');
const themeText = document.getElementById('theme-text');

// Kiểm tra theme đã được lưu trước đó chưa
const currentTheme = localStorage.getItem('theme');
if (currentTheme === 'dark') {
  body.classList.add('dark-theme');
  icon.classList.remove('fa-moon');
  icon.classList.add('fa-sun');
  themeText.textContent = 'Chế độ sáng';
}

themeToggleBtn.addEventListener('click', () => {
  body.classList.toggle('dark-theme');
  if (body.classList.contains('dark-theme')) {
    localStorage.setItem('theme', 'dark');
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
    themeText.textContent = 'Chế độ sáng';
  } else {
    localStorage.setItem('theme', 'light');
    icon.classList.remove('fa-sun');
    icon.classList.add('fa-moon');
    themeText.textContent = 'Chế độ tối';
  }
});

// Init
favorites.updateCount();

// ========== SYNC FAVORITES CŨ VỚI AI LEARNING ==========
// Nếu có favorites nhưng AI chưa học → học từ favorites
(function syncFavoritesWithAI() {
  const favCount = Object.keys(favorites.favs).length;
  const aiInteractions = aiLearning.data.totalInteractions;
  const itemsCount = Object.keys(favorites.items).length;

  if (favCount > 0 && aiInteractions < favCount) {

    let syncCount = 0;

    // Học từ mỗi favorite item đã lưu
    Object.keys(favorites.items).forEach(id => {
      const item = favorites.items[id];
      if (item && item.color) {
        aiLearning.learnFromOutfit(item, 'favorite');
        syncCount++;
      }
    });

    // Nếu có favorites nhưng không có item data → tạo tương tác giả
    if (syncCount === 0 && favCount > 0) {
      aiLearning.data.totalInteractions = favCount;
      aiLearning.saveData();
    }

  }
})();

aiLearning.updateLearningStatus(); // Cập nhật trạng thái AI Learning

// ========== LIGHTWEIGHT SMOOTH SCROLLING ==========
document.documentElement.style.scrollBehavior = 'smooth';

// Không tự động load demo khi mở trang
// window.addEventListener('load',loadDemo);
