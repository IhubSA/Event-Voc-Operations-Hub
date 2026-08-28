// Login Page Component - Improved UI/UX
import { AuthService } from './auth.js';

export class LoginPage {
  constructor() {
    this.authService = new AuthService();
    this.isLoading = false;
  }

  render(onLoginSuccess) {
    const container = document.getElementById('app');

    container.innerHTML = `
      <div class="login-wrapper">
        <div class="login-background">
          <div class="login-bg-gradient"></div>
          <div class="login-bg-shapes">
            <div class="shape shape-1"></div>
            <div class="shape shape-2"></div>
            <div class="shape shape-3"></div>
          </div>
        </div>

        <div class="login-container">
          <div class="login-left">
            <div class="login-branding">
              <div class="login-logo">🎯</div>
              <h1>JOC Command Centre</h1>
              <p>Joint Operations Centre Event Management System</p>
            </div>
            <div class="login-features">
              <div class="feature-item">
                <span class="feature-icon">📊</span>
                <div>
                  <h4>Real-Time Operations</h4>
                  <p>Monitor and manage events with live updates</p>
                </div>
              </div>
              <div class="feature-item">
                <span class="feature-icon">👥</span>
                <div>
                  <h4>Multi-Module Control</h4>
                  <p>Medical, Security, Safety & more in one place</p>
                </div>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🔒</span>
                <div>
                  <h4>Secure & Scalable</h4>
                  <p>Enterprise-grade security for large events</p>
                </div>
              </div>
            </div>
          </div>

          <div class="login-right">
            <div class="login-form-container">
              <div class="login-form-header">
                <h2>Welcome Back</h2>
                <p>Sign in to your account</p>
              </div>

              <form id="login-form" class="login-form">
                <div class="form-group">
                  <label for="email">Email Address</label>
                  <div class="input-wrapper">
                    <span class="input-icon">✉️</span>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      placeholder="your@email.com"
                      autocomplete="email"
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label for="password">Password</label>
                  <div class="input-wrapper">
                    <span class="input-icon">🔐</span>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      required
                      placeholder="Enter your password"
                      autocomplete="current-password"
                    />
                    <button type="button" class="input-toggle" id="password-toggle">👁️</button>
                  </div>
                </div>

                <div class="form-options">
                  <label class="checkbox-label">
                    <input type="checkbox" id="remember-me" name="remember-me" />
                    <span>Remember me</span>
                  </label>
                </div>

                <button type="submit" class="btn btn-primary btn-full" id="login-btn">
                  <span class="btn-text">Sign In</span>
                  <span class="btn-spinner" style="display: none;">⏳</span>
                </button>

                <div id="error-message" class="error-message"></div>
              </form>

              <div class="login-footer">
                <div class="divider">
                  <span>Demo Access</span>
                </div>
                <p class="demo-text">Demo credentials available for testing the system</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add improved login styles
    const style = document.createElement('style');
    style.textContent = `
      .login-wrapper {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #1F5B7C;
        padding: 1rem;
        position: relative;
        overflow: hidden;
      }

      .login-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
      }

      .login-bg-gradient {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(0, 0, 0, 0.1) 100%);
      }

      .login-bg-shapes {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }

      .shape {
        position: absolute;
        border-radius: 50%;
        opacity: 0.05;
      }

      .shape-1 {
        width: 400px;
        height: 400px;
        background: rgba(255, 255, 255, 0.08);
        top: -100px;
        right: -100px;
      }

      .shape-2 {
        width: 300px;
        height: 300px;
        background: rgba(255, 255, 255, 0.08);
        bottom: -50px;
        left: -50px;
      }

      .shape-3 {
        width: 250px;
        height: 250px;
        background: rgba(255, 255, 255, 0.08);
        top: 50%;
        right: 10%;
      }

      .login-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 3rem;
        width: 100%;
        max-width: 1000px;
        position: relative;
        z-index: 1;
        align-items: center;
      }

      .login-left {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .login-branding {
        text-align: left;
      }

      .login-logo {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      .login-left h1 {
        font-size: 2.25rem;
        font-weight: 700;
        margin: 0 0 0.5rem 0;
        color: #ffffff;
        letter-spacing: -0.5px;
      }

      .login-left p {
        font-size: 1rem;
        color: rgba(255, 255, 255, 0.85);
        margin: 0;
        line-height: 1.5;
      }

      .login-features {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .feature-item {
        display: flex;
        gap: 1rem;
        padding: 1.25rem;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        border-left: 3px solid #FF9800;
        transition: all 0.3s ease;
      }

      .feature-item:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: translateX(4px);
      }

      .feature-icon {
        font-size: 1.75rem;
        flex-shrink: 0;
      }

      .feature-item h4 {
        margin: 0 0 0.25rem 0;
        font-size: 0.95rem;
        color: #ffffff;
        font-weight: 600;
      }

      .feature-item p {
        margin: 0;
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.8);
        line-height: 1.4;
      }

      .login-right {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .login-form-container {
        background: rgba(20, 40, 60, 0.95);
        border-radius: 12px;
        padding: 2.5rem;
        width: 100%;
        max-width: 420px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: fadeInUp 0.6s ease;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .login-form-header {
        margin-bottom: 2rem;
        text-align: center;
      }

      .login-form-header h2 {
        font-size: 1.75rem;
        margin: 0 0 0.5rem 0;
        color: #1a2a3a;
        font-weight: 700;
      }

      .login-form-header p {
        font-size: 0.95rem;
        color: rgba(255, 255, 255, 0.8);
        margin: 0;
      }

      .login-form {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }

      .form-group label {
        font-weight: 600;
        color: #ffffff;
        font-size: 0.9rem;
        letter-spacing: 0.3px;
      }

      .input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }

      .input-icon {
        position: absolute;
        left: 12px;
        font-size: 1rem;
        pointer-events: none;
      }

      .form-group input {
        width: 100%;
        padding: 0.85rem 0.85rem 0.85rem 2.75rem;
        border: 2px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
        font-family: inherit;
        font-size: 0.95rem;
        transition: all 0.3s ease;
      }

      .form-group input::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }

      .form-group input:hover {
        border-color: rgba(255, 255, 255, 0.3);
        background: rgba(255, 255, 255, 0.12);
      }

      .form-group input:focus {
        outline: none;
        border-color: #FF9800;
        background: rgba(255, 255, 255, 0.15);
        box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.2);
      }

      .input-toggle {
        position: absolute;
        right: 12px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        padding: 0.5rem;
        transition: all 0.2s ease;
      }

      .input-toggle:hover {
        opacity: 0.7;
      }

      .form-options {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 0.5rem;
      }

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        cursor: pointer;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.8);
        transition: color 0.2s ease;
      }

      .checkbox-label:hover {
        color: #ffffff;
      }

      .checkbox-label input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
        accent-color: #FF9800;
      }

      .btn-full {
        width: 100%;
        padding: 0.95rem;
        margin-top: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.6rem;
        font-size: 1rem;
        font-weight: 600;
        background: #FF9800;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .btn-full:hover {
        background: #E68900;
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(255, 152, 0, 0.4);
      }

      .btn-full:active {
        transform: translateY(0);
      }

      .btn-full:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .btn-spinner {
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .error-message {
        color: #ff6b6b;
        font-size: 0.9rem;
        padding: 1rem;
        background: rgba(255, 107, 107, 0.1);
        border: 1px solid rgba(255, 107, 107, 0.3);
        border-radius: 8px;
        display: none;
        animation: slideDown 0.3s ease;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .error-message.show {
        display: block;
      }

      .login-footer {
        margin-top: 1.5rem;
        text-align: center;
        padding-top: 1.5rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
      }

      .divider {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }

      .divider::before,
      .divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
      }

      .divider span {
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.8);
        font-weight: 600;
      }

      .demo-text {
        font-size: 0.85rem;
        color: rgba(255, 255, 255, 0.7);
        margin: 0;
      }

      /* Responsive Design */
      @media (max-width: 968px) {
        .login-container {
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        .login-left {
          display: none;
        }

        .login-form-container {
          max-width: 100%;
        }
      }

      @media (max-width: 480px) {
        .login-form-container {
          padding: 1.5rem;
        }

        .login-form-header h2 {
          font-size: 1.4rem;
        }

        .form-group {
          gap: 0.5rem;
        }

        .form-group input {
          padding: 0.75rem 0.75rem 0.75rem 2.5rem;
          font-size: 16px;
        }

        .btn-full {
          padding: 0.85rem;
        }
      }
    `;
    document.head.appendChild(style);

    // Setup password visibility toggle
    const passwordInput = document.getElementById('password');
    const passwordToggle = document.getElementById('password-toggle');

    passwordToggle.addEventListener('click', (e) => {
      e.preventDefault();
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      passwordToggle.textContent = isPassword ? '🙈' : '👁️';
    });

    // Setup form submission
    const form = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');
    const loginBtn = document.getElementById('login-btn');
    const btnText = loginBtn.querySelector('.btn-text');
    const btnSpinner = loginBtn.querySelector('.btn-spinner');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (this.isLoading) return;

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        this.isLoading = true;
        errorMessage.classList.remove('show');

        // Show loading state
        loginBtn.disabled = true;
        btnText.style.display = 'none';
        btnSpinner.style.display = 'inline-block';

        const user = await this.authService.login(email, password);
        onLoginSuccess(user);
      } catch (error) {
        this.isLoading = false;
        errorMessage.textContent = error.message || 'Login failed. Please try again.';
        errorMessage.classList.add('show');

        // Reset button state
        loginBtn.disabled = false;
        btnText.style.display = 'inline';
        btnSpinner.style.display = 'none';
      }
    });
  }
}
