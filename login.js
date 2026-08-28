import { authService } from './auth.js';

export default class LoginPage {
  constructor(options = {}) {
    this.onLoginSuccess = options.onLoginSuccess || (() => {});
    this.errorMessage = '';
  }

  render() {
    const container = document.createElement('div');
    container.className = 'login-container';

    const loginBox = document.createElement('div');
    loginBox.className = 'login-box';

    const logo = document.createElement('div');
    logo.className = 'login-logo';
    logo.textContent = '🎯';

    const title = document.createElement('h1');
    title.className = 'login-title';
    title.textContent = 'JOC Command Centre';

    const subtitle = document.createElement('p');
    subtitle.className = 'login-subtitle';
    subtitle.textContent = 'Event Operations Management System';

    const form = document.createElement('form');
    form.className = 'login-form';

    // Email input
    const emailLabel = document.createElement('label');
    emailLabel.textContent = 'Email Address';
    const emailInput = document.createElement('input');
    emailInput.type = 'email';
    emailInput.placeholder = 'your@email.com';
    emailInput.required = true;
    emailInput.className = 'form-input';

    // Password input
    const passwordLabel = document.createElement('label');
    passwordLabel.textContent = 'Password';
    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.placeholder = 'Enter your password';
    passwordInput.required = true;
    passwordInput.className = 'form-input';

    // Error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.display = 'none';

    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn btn-primary';
    submitBtn.textContent = 'Sign In';

    // Form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';
      errorDiv.style.display = 'none';

      const result = await authService.login(emailInput.value, passwordInput.value);

      if (result.success) {
        this.onLoginSuccess();
      } else {
        errorDiv.textContent = result.error;
        errorDiv.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    });

    // Assemble form
    form.appendChild(emailLabel);
    form.appendChild(emailInput);
    form.appendChild(passwordLabel);
    form.appendChild(passwordInput);
    form.appendChild(errorDiv);
    form.appendChild(submitBtn);

    // Assemble login box
    loginBox.appendChild(logo);
    loginBox.appendChild(title);
    loginBox.appendChild(subtitle);
    loginBox.appendChild(form);

    container.appendChild(loginBox);
    return container;
  }
}
