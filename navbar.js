export default class Navbar {
  constructor(options = {}) {
    this.userEmail = options.userEmail || '';
    this.onLogout = options.onLogout || (() => {});
  }

  render() {
    const navbar = document.createElement('nav');
    navbar.className = 'navbar';

    const container = document.createElement('div');
    container.className = 'navbar-container';

    // Logo
    const logo = document.createElement('div');
    logo.className = 'navbar-logo';
    logo.innerHTML = '<span class="logo-emoji">🎯</span> JOC Command Centre';

    // Nav links
    const navLinks = document.createElement('div');
    navLinks.className = 'navbar-links';

    const links = [
      { text: 'Dashboard', href: '#/' },
      { text: 'Incidents', href: '#/incidents' },
      { text: 'Venues', href: '#/venues' },
      { text: 'Teams', href: '#/teams' }
    ];

    links.forEach(link => {
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.text;
      a.className = 'nav-link';
      navLinks.appendChild(a);
    });

    // Right side (user info)
    const rightSide = document.createElement('div');
    rightSide.className = 'navbar-right';

    if (this.userEmail) {
      const userEmail = document.createElement('span');
      userEmail.className = 'user-email';
      userEmail.textContent = this.userEmail;
      rightSide.appendChild(userEmail);
    }

    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'btn btn-secondary btn-sm';
    logoutBtn.textContent = 'Logout';
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.onLogout();
    });
    rightSide.appendChild(logoutBtn);

    container.appendChild(logo);
    container.appendChild(navLinks);
    container.appendChild(rightSide);
    navbar.appendChild(container);

    return navbar;
  }
}
