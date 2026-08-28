// Login Page Component
import { AuthService } from './auth.js';

export class LoginPage {
  constructor() {
    this.authService = new AuthService();
  }

  render(onLoginSuccess) {
    const container = document.getElementById('app');

    container.innerHTML = `
      <div class="login-wrapper">
        <div class="login-container">
          <div class="login-header">
            <h1>🎯 JOC Command Centre</h1>
            <p>Joint Operations Centre Event Management</p>
          </div>

          <form id="login-form" class="login-form">
            <div class="form-group">
              <label for="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                placeholder="your@email.com"
              />
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                required
                placeholder="Enter your password"
              />
            </div>

            <button type="submit" class="btn btn-primary btn-full">
              Login
            </button>

            <div id="error-message" class="error-message"></div>
          </form>

          <div class="login-footer">
            <p>Demo credentials available for testing</p>
          </div>
        </div>
      </div>
    `;

    // Add login form styles
    const style = document.createElement('style');
    style.textContent = `
      .login-wrapper {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, var(--primary) 0%, var(--bg-secondary) 100%);
        padding: 1rem;
      }

      .login-container {
        background: var(--bg-primary);
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        width: 100%;
        max-width: 400px;
        padding: 2rem;
      }

      .login-header {
        text-align: center;
        margin-bottom: 2rem;
      }

      .login-header h1 {
        font-size: 1.75rem;
        margin: 0 0 0.5rem 0;
        color: var(--text-primary);
      }

      .login-header p {
        font-size: 0.95rem;
        color: var(--text-secondary);
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
        gap: 0.5rem;
      }

      .form-group label {
        font-weight: 600;
        color: var(--text-primary);
        font-size: 0.9rem;
      }

      .form-group input {
        padding: 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        background: var(--bg-secondary);
        color: var(--text-primary);
        font-family: inherit;
        font-size: 0.95rem;
        transition: all 0.2s ease;
      }

      .form-group input:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
      }

      .btn-full {
        width: 100%;
      }

      .error-message {
        color: var(--critical);
        font-size: 0.9rem;
        padding: 1rem;
        background: rgba(179, 27, 27, 0.1);
        border-radius: 6px;
        display: none;
      }

      .error-message.show {
        display: block;
      }

      .login-footer {
        text-align: center;
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--border-color);
      }

      .login-footer p {
        font-size: 0.85rem;
        color: var(--text-secondary);
        margin: 0;
      }
    `;
    document.head.appendChild(style);

    // Setup form submission
    const form = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        errorMessage.classList.remove('show');
        const user = await this.authService.login(email, password);
        onLoginSuccess(user);
      } catch (error) {
        errorMessage.textContent = error.message || 'Login failed. Please try again.';
        errorMessage.classList.add('show');
      }
    });
  }
}
