// Staff Login Page
// Allows staff members to sign in with their credentials
import { supabase } from './supabase.js';

export class StaffLoginPage {
  constructor() {
    this.isLoading = false;
  }

  render(onLoginSuccess, onSwitchToAdminLogin) {
    const container = document.getElementById('app');

    const loginHtml = `
      <div class="staff-login-container">
        <div class="login-card">
          <div class="login-header">
            <div class="login-logo">👥</div>
            <h1>Staff Check-In</h1>
            <p>Sign in to manage your assignments and check-in/out</p>
          </div>

          <form id="staff-login-form" class="login-form">
            <div class="form-group">
              <label for="staff-email">Email Address</label>
              <input
                type="email"
                id="staff-email"
                name="email"
                placeholder="your.email@example.com"
                required
              />
            </div>

            <div class="form-group">
              <label for="staff-password">Password</label>
              <input
                type="password"
                id="staff-password"
                name="password"
                placeholder="Enter your password"
                required
              />
            </div>

            <div id="login-error" class="error-message"></div>

            <button type="submit" class="btn btn-primary btn-login" id="login-btn">
              Sign In
            </button>
          </form>

          <div class="login-footer">
            <p>Are you an admin? <a href="#" id="switch-to-admin">Sign in here</a></p>
          </div>
        </div>

        <div class="login-background"></div>
      </div>
    `;

    container.innerHTML = loginHtml;

    // Add styles
    this.addStyles();

    // Setup event listeners
    document.getElementById('staff-login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin(onLoginSuccess);
    });

    document.getElementById('switch-to-admin').addEventListener('click', (e) => {
      e.preventDefault();
      onSwitchToAdminLogin();
    });
  }

  async handleLogin(onLoginSuccess) {
    if (this.isLoading) return;

    const email = document.getElementById('staff-email').value.trim();
    const password = document.getElementById('staff-password').value;
    const errorDiv = document.getElementById('login-error');
    const loginBtn = document.getElementById('login-btn');

    // Clear previous error
    errorDiv.textContent = '';
    errorDiv.classList.remove('show');

    // Validate inputs
    if (!email || !password) {
      errorDiv.textContent = 'Please enter both email and password';
      errorDiv.classList.add('show');
      return;
    }

    this.isLoading = true;
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in...';

    try {
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data.user) {
        // Verify this user is a staff member
        const { data: staffAccount, error: staffError } = await supabase
          .from('staff_accounts')
          .select('staff_id, account_status')
          .eq('auth_user_id', data.user.id)
          .single();

        if (staffError || !staffAccount) {
          throw new Error('Your account is not set up as a staff member. Contact an administrator.');
        }

        if (staffAccount.account_status !== 'active') {
          throw new Error('Your staff account is currently disabled. Contact an administrator.');
        }

        // Get the staff member's details
        const { data: staffData, error: staffDataError } = await supabase
          .from('event_staff')
          .select('*')
          .eq('id', staffAccount.staff_id)
          .single();

        if (staffDataError) throw staffDataError;

        // Call success callback with user and staff data
        onLoginSuccess({
          user: data.user,
          staffData: staffData,
          staffId: staffAccount.staff_id
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      errorDiv.textContent = error.message || 'Login failed. Please check your credentials.';
      errorDiv.classList.add('show');
    } finally {
      this.isLoading = false;
      loginBtn.disabled = false;
      loginBtn.textContent = 'Sign In';
    }
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .staff-login-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
        padding: 1rem;
      }

      .login-card {
        background: var(--bg-primary);
        border-radius: 16px;
        padding: 3rem 2rem;
        width: 100%;
        max-width: 400px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        border: 2px solid var(--border-color);
      }

      .login-header {
        text-align: center;
        margin-bottom: 2rem;
      }

      .login-logo {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      .login-header h1 {
        margin: 0 0 0.5rem 0;
        color: var(--text-primary);
        font-size: 1.75rem;
      }

      .login-header p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.95rem;
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
        color: var(--text-primary);
        font-weight: 600;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }

      .form-group input {
        padding: 0.85rem;
        border: 2px solid var(--border-color);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-primary);
        font-size: 0.95rem;
        font-family: inherit;
        transition: all 0.3s ease;
      }

      .form-group input:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(0, 153, 255, 0.1);
      }

      .form-group input::placeholder {
        color: var(--text-secondary);
      }

      .error-message {
        color: #ff6b6b;
        font-size: 0.9rem;
        padding: 1rem;
        background: rgba(255, 107, 107, 0.1);
        border: 1px solid rgba(255, 107, 107, 0.3);
        border-radius: 8px;
        display: none;
      }

      .error-message.show {
        display: block;
      }

      .btn-login {
        padding: 0.95rem;
        font-size: 1rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-top: 0.5rem;
      }

      .btn-login:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 30px rgba(0, 153, 255, 0.3);
      }

      .btn-login:disabled {
        opacity: 0.7;
        cursor: not-allowed;
      }

      .login-footer {
        text-align: center;
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--border-color);
      }

      .login-footer p {
        margin: 0;
        color: var(--text-secondary);
        font-size: 0.9rem;
      }

      .login-footer a {
        color: var(--primary);
        text-decoration: none;
        font-weight: 600;
        transition: all 0.3s ease;
      }

      .login-footer a:hover {
        color: var(--primary-light);
        text-decoration: underline;
      }

      @media (max-width: 480px) {
        .login-card {
          padding: 2rem 1.5rem;
        }

        .login-header h1 {
          font-size: 1.5rem;
        }

        .login-logo {
          font-size: 2.5rem;
        }
      }
    `;
    document.head.appendChild(style);
  }
}
