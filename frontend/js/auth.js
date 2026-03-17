// Xử lý xác thực người dùng (Đăng nhập / Đăng ký)
document.addEventListener('DOMContentLoaded', () => {
  const authBtn = document.getElementById('auth-btn');
  const authText = document.getElementById('auth-text');
  const authModal = document.getElementById('auth-modal');
  const authOverlay = document.getElementById('auth-overlay');
  const authClose = document.getElementById('auth-close');
  
  const loginFormContainer = document.getElementById('login-form-container');
  const registerFormContainer = document.getElementById('register-form-container');
  
  const showRegisterBtn = document.getElementById('show-register');
  const showLoginBtn = document.getElementById('show-login');
  
  const btnSubmitLogin = document.getElementById('btn-submit-login');
  const btnSubmitRegister = document.getElementById('btn-submit-register');
  
  const loginError = document.getElementById('login-error');
  const registerError = document.getElementById('register-error');

  const API_URL = 'http://localhost:5000/api/auth';

  // Lấy user từ localStorage nếu có
  let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

  // Cập nhật giao diện nếu đã đăng nhập
  function updateAuthUI() {
    if (currentUser) {
      authBtn.innerHTML = `
        <i class="fas fa-sign-out-alt"></i>
        <span id="auth-text">${currentUser.username} (Đăng xuất)</span>
      `;
      authBtn.title = `Xin chào ${currentUser.username} - Nhấn để đăng xuất`;
    } else {
      authBtn.innerHTML = `
        <i class="fas fa-user"></i>
        <span id="auth-text">Đăng nhập</span>
      `;
      authBtn.title = "Tài khoản";
    }
  }

  updateAuthUI();

  // DOM elements cho Logout Modal
  const logoutModal = document.getElementById('logout-modal');
  const logoutOverlay = document.getElementById('logout-overlay');
  const btnConfirmLogout = document.getElementById('btn-confirm-logout');
  const btnCancelLogout = document.getElementById('btn-cancel-logout');

  // Mở modal đăng nhập / Đăng xuất
  authBtn.addEventListener('click', (e) => {
    // find nearest button since content changes
    const btn = e.target.closest('button');
    if (currentUser && btn && btn.textContent.toLowerCase().includes('đăng xuất')) {
      // Hiển thị modal xác nhận đăng xuất
      logoutModal.classList.remove('hidden');
    } else {
      openAuthModal();
      showLogin();
    }
  });

  // Đóng modal đăng xuất
  function closeLogoutModal() {
    logoutModal.classList.add('hidden');
  }

  logoutOverlay.addEventListener('click', closeLogoutModal);
  btnCancelLogout.addEventListener('click', closeLogoutModal);

  // Xử lý xác nhận đăng xuất
  btnConfirmLogout.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    currentUser = null;
    updateAuthUI();
    closeLogoutModal();
    showToast('Đăng xuất thành công!', 'success');
    setTimeout(() => window.location.reload(), 1500);
  });

  // Đóng modal
  function closeAuthModal() {
    authModal.classList.add('hidden');
    clearInputs();
  }

  authClose.addEventListener('click', closeAuthModal);
  authOverlay.addEventListener('click', closeAuthModal);

  function openAuthModal() {
    authModal.classList.remove('hidden');
  }

  function showLogin() {
    loginFormContainer.classList.remove('hidden');
    registerFormContainer.classList.add('hidden');
    clearInputs();
  }

  function showRegister() {
    loginFormContainer.classList.add('hidden');
    registerFormContainer.classList.remove('hidden');
    clearInputs();
  }

  showRegisterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showRegister();
  });

  showLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showLogin();
  });

  function clearInputs() {
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('reg-username').value = '';
    document.getElementById('reg-email').value = '';
    document.getElementById('reg-password').value = '';
    loginError.style.display = 'none';
    registerError.style.display = 'none';
  }

  function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
  }

  // ========== GOOGLE LOGIN ==========
  window.handleGoogleLogin = async function(response) {
    const token = response.credential;
    if (!token) {
      showError(loginError, 'Không nhận được dữ liệu từ Google');
      return;
    }

    try {
      const gRes = await fetch(`${API_URL}/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token })
      });
      
      const data = await gRes.json();
      if (data.status === 'success') {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        currentUser = data.user;
        updateAuthUI();
        closeAuthModal();
        showToast('Đăng nhập bằng Google thành công!', 'success');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showError(loginError, data.message || 'Xác thực Google thất bại.');
      }
    } catch (error) {
      console.error('Lỗi khi đăng nhập Google:', error);
      showError(loginError, 'Không thể kết nối với máy chủ.');
    }
  };

  function initGoogleButton() {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: "300752275426-l4g85u5t9q8sibfa9buhejk6di05cnmu.apps.googleusercontent.com",
        callback: handleGoogleLogin,
        context: "signin",
        ux_mode: "popup"
      });
      
      window.google.accounts.id.renderButton(
        document.getElementById("google-login-btn"),
        { theme: "outline", size: "large", width: "100%", text: "signin_with" }  // customization attributes
      );
    }
  }

  // Khởi tạo Google Button sau khi script load xong
  window.onload = function() {
    initGoogleButton();
  };
  
  // Khởi tạo ngay lập tức phòng khi script đã load trước
  setTimeout(initGoogleButton, 1000);
  
  // Xử lý Đăng Nhập Hệ Thống Cũ
  btnSubmitLogin.addEventListener('click', async () => {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    if (!username || !password) {
      showError(loginError, 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    btnSubmitLogin.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    btnSubmitLogin.disabled = true;

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.status === 'success') {
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        currentUser = data.user;
        updateAuthUI();
        closeAuthModal();
        showToast('Đăng nhập thành công!', 'success');
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showError(loginError, data.message || 'Đăng nhập thất bại.');
      }
    } catch (error) {
      console.error('Lỗi khi đăng nhập:', error);
      showError(loginError, 'Lỗi kết nối đến máy chủ.');
    } finally {
      btnSubmitLogin.innerHTML = 'Đăng Nhập';
      btnSubmitLogin.disabled = false;
    }
  });

  // Xử lý Đăng Ký
  btnSubmitRegister.addEventListener('click', async () => {
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    if (!username || !email || !password) {
      showError(registerError, 'Vui lòng điền đầy đủ thông tin.');
      return;
    }

    if (password.length < 6) {
      showError(registerError, 'Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    btnSubmitRegister.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
    btnSubmitRegister.disabled = true;

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (data.status === 'success') {
        showToast('Đăng ký thành công! Vui lòng đăng nhập.', 'success');
        showLogin();
      } else {
        showError(registerError, data.message || 'Đăng ký thất bại.');
      }
    } catch (error) {
      console.error('Lỗi khi đăng ký:', error);
      showError(registerError, 'Lỗi kết nối đến máy chủ.');
    } finally {
      btnSubmitRegister.innerHTML = 'Đăng Ký';
      btnSubmitRegister.disabled = false;
    }
  });
});
