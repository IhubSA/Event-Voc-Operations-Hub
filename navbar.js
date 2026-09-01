// Navbar Component
export class Navbar {
  constructor(currentUser, onLogout, onSwitchToAdmin) {
    this.currentUser = currentUser;
    this.onLogout = onLogout;
    this.onSwitchToAdmin = onSwitchToAdmin;
  }

  render() {
    const userEmail = this.currentUser?.email || 'User';
    const adminButton = this.onSwitchToAdmin ? `<button class="btn btn-primary btn-sm" id="switch-to-admin-btn">→ Admin Dashboard</button>` : '';

    const html = `
      <nav class="navbar">
        <div class="navbar-brand">
          <img src="./voc-logo.png" alt="VOC Logo" class="navbar-logo" />
          <span class="navbar-title">Venue Operations Centre</span>
        </div>
        <div class="navbar-end">
          <span class="user-info">${userEmail}</span>
          ${adminButton}
          <button class="btn btn-secondary btn-sm" id="logout-btn">Logout</button>
        </div>
      </nav>
    `;

    // Add navbar logo styles
    const style = document.createElement('style');
    style.textContent = `
      .navbar-brand {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex: 1;
      }

      .navbar-logo {
        height: 45px;
        width: auto;
        object-fit: contain;
      }

      .navbar-title {
        font-size: 1.1rem;
        font-weight: 700;
        color: var(--text-primary);
        letter-spacing: -0.3px;
      }

      .navbar-end {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .user-info {
        font-size: 0.9rem;
        color: var(--text-secondary);
      }

      @media (max-width: 768px) {
        .navbar-title {
          display: none;
        }

        .navbar-logo {
          height: 40px;
        }

        .user-info {
          display: none;
        }
      }
    `;
    document.head.appendChild(style);

    // Create a temporary container to add the event listener
    setTimeout(() => {
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          this.onLogout();
        });
      }

      const switchAdminBtn = document.getElementById('switch-to-admin-btn');
      if (switchAdminBtn && this.onSwitchToAdmin) {
        switchAdminBtn.addEventListener('click', () => {
          this.onSwitchToAdmin();
        });
      }
    }, 0);

    return html;
  }
}
