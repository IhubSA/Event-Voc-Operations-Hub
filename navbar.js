// Navbar Component
export class Navbar {
  constructor(currentUser, onLogout) {
    this.currentUser = currentUser;
    this.onLogout = onLogout;
  }

  render() {
    const userEmail = this.currentUser?.email || 'User';

    const html = `
      <nav class="navbar">
        <div class="navbar-brand">
          🎯 JOC Command Centre
        </div>
        <div class="navbar-end">
          <span class="user-info">${userEmail}</span>
          <button class="btn btn-secondary btn-sm" id="logout-btn">Logout</button>
        </div>
      </nav>
    `;

    // Create a temporary container to add the event listener
    setTimeout(() => {
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          this.onLogout();
        });
      }
    }, 0);

    return html;
  }
}
