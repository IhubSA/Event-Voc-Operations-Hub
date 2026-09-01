// VOC Landing Page
// Welcome/splash page shown before login

export class LandingPage {
  constructor() {}

  render(onGoToLogin) {
    const container = document.getElementById('app');

    const landingHtml = `
      <div class="landing-container">
        <div class="landing-background"></div>

        <div class="landing-content">
          <div class="landing-card">
            <div class="landing-logo-section">
              <h1 class="welcome-text">Welcome to the</h1>

              <div class="voc-logo-container">
                <img class="voc-logo-image" src="./voc-logo.png" alt="VOC Logo" onerror="this.style.display='none'"/>
                <!-- Fallback: Shows only if image fails to load -->
                <svg class="voc-icon" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style="display: none;">
                  <!-- Outer circle -->
                  <circle cx="100" cy="100" r="95" fill="none" stroke="#0099FF" stroke-width="2"/>

                  <!-- Inner segments for the compass/operations indicators -->
                  <g id="compass">
                    <!-- Security (top left) -->
                    <circle cx="60" cy="60" r="12" fill="#0099FF"/>
                    <text x="60" y="67" text-anchor="middle" fill="white" font-size="16" font-weight="bold">🔒</text>

                    <!-- Medical (top right) -->
                    <circle cx="140" cy="60" r="12" fill="#FF6B35"/>
                    <text x="140" y="67" text-anchor="middle" fill="white" font-size="16" font-weight="bold">✚</text>

                    <!-- Operations (right) -->
                    <circle cx="160" cy="100" r="12" fill="#666"/>
                    <text x="160" y="107" text-anchor="middle" fill="white" font-size="16" font-weight="bold">⚙️</text>

                    <!-- Safety (bottom right) -->
                    <circle cx="140" cy="140" r="12" fill="#FF9500"/>
                    <text x="140" y="147" text-anchor="middle" fill="white" font-size="16" font-weight="bold">⚠️</text>

                    <!-- Communications (bottom left) -->
                    <circle cx="60" cy="140" r="12" fill="#00AA00"/>
                    <text x="60" y="147" text-anchor="middle" fill="white" font-size="16" font-weight="bold">📡</text>
                  </g>

                  <!-- Center circle -->
                  <circle cx="100" cy="100" r="20" fill="#0099FF"/>
                  <text x="100" y="108" text-anchor="middle" fill="white" font-size="24" font-weight="bold">V</text>
                </svg>
              </div>

              <div class="voc-branding">
                <h2>VOC</h2>
                <p class="tagline">VENUE OPERATIONS CENTRE</p>
              </div>
            </div>

            <div class="voc-mission">
              <div class="mission-statement">
                <span class="mission-item">CONNECT</span>
                <span class="mission-divider">|</span>
                <span class="mission-item">MANAGE</span>
                <span class="mission-divider">|</span>
                <span class="mission-item">PROTECT</span>
                <span class="mission-divider">|</span>
                <span class="mission-item">DELIVER</span>
              </div>
            </div>

            <div class="operational-pillars">
              <div class="pillar security">
                <div class="pillar-icon">🔒</div>
                <div class="pillar-label">Security</div>
              </div>
              <div class="pillar medical">
                <div class="pillar-icon">✚</div>
                <div class="pillar-label">Medical</div>
              </div>
              <div class="pillar safety">
                <div class="pillar-icon">⚠️</div>
                <div class="pillar-label">Safety</div>
              </div>
              <div class="pillar communications">
                <div class="pillar-icon">📡</div>
                <div class="pillar-label">Communications</div>
              </div>
              <div class="pillar operations">
                <div class="pillar-icon">⚙️</div>
                <div class="pillar-label">Operations</div>
              </div>
            </div>

            <button class="btn btn-primary btn-large" id="login-btn">Go to Login</button>
          </div>

          <div class="landing-info">
            <h3>About VOC</h3>
            <p>The Venue Operations Centre is an integrated platform for managing events with focus on security, medical response, safety compliance, communications, and operational efficiency.</p>
            <ul>
              <li>📊 Real-time operational monitoring</li>
              <li>🏥 Medical incident tracking</li>
              <li>🔒 Security management</li>
              <li>⚠️ Safety compliance</li>
              <li>👥 Staff coordination</li>
              <li>🏃 Participant management</li>
            </ul>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = landingHtml;
    this.addStyles();
    this.setupEventListeners(onGoToLogin);
  }

  setupEventListeners(onGoToLogin) {
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        if (onGoToLogin) onGoToLogin();
      });
    }
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .landing-container {
        min-height: 100vh;
        background: linear-gradient(135deg, #0a1e3e 0%, #1a3a5c 50%, #0d2547 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem 1rem;
        font-family: inherit;
        position: relative;
        overflow: hidden;
      }

      .landing-background {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="rgba(0,153,255,0.05)"/></svg>');
        pointer-events: none;
        z-index: 0;
      }

      .landing-content {
        max-width: 900px;
        width: 100%;
        display: grid;
        grid-template-columns: 1fr 350px;
        gap: 2rem;
        align-items: center;
        position: relative;
        z-index: 1;
      }

      .landing-card {
        background: rgba(255, 255, 255, 0.98);
        border-radius: 24px;
        padding: 3rem;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        border: 2px solid rgba(0, 153, 255, 0.1);
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 2rem;
      }

      .landing-logo-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        width: 100%;
      }

      .welcome-text {
        margin: 0;
        color: #333;
        font-size: 1.3rem;
        font-weight: 400;
        letter-spacing: 0.5px;
      }

      .voc-logo-container {
        width: 140px;
        height: 140px;
      }

      .voc-logo-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 4px 12px rgba(0, 99, 255, 0.2));
      }

      .voc-icon {
        width: 100%;
        height: 100%;
        filter: drop-shadow(0 4px 12px rgba(0, 99, 255, 0.2));
        display: block;
      }

      .voc-branding {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .voc-branding h2 {
        margin: 0;
        font-size: 2.5rem;
        font-weight: 800;
        background: linear-gradient(135deg, #0063FF 0%, #0099FF 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: 2px;
      }

      .tagline {
        margin: 0;
        color: #666;
        font-size: 0.85rem;
        font-weight: 600;
        letter-spacing: 3px;
        text-transform: uppercase;
      }

      .voc-mission {
        width: 100%;
        padding: 1.5rem;
        background: rgba(0, 153, 255, 0.05);
        border-radius: 12px;
        border: 2px solid rgba(0, 153, 255, 0.1);
      }

      .mission-statement {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .mission-item {
        color: #0099FF;
        font-weight: 700;
        font-size: 0.95rem;
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      .mission-divider {
        color: #ccc;
        font-weight: 300;
      }

      .operational-pillars {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 1rem;
        width: 100%;
      }

      .pillar {
        background: linear-gradient(135deg, rgba(0, 153, 255, 0.1) 0%, rgba(0, 153, 255, 0.05) 100%);
        border: 2px solid rgba(0, 153, 255, 0.15);
        border-radius: 12px;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.3s ease;
      }

      .pillar:hover {
        border-color: #0099FF;
        box-shadow: 0 8px 20px rgba(0, 153, 255, 0.15);
        transform: translateY(-2px);
      }

      .pillar-icon {
        font-size: 1.8rem;
      }

      .pillar-label {
        font-size: 0.75rem;
        font-weight: 700;
        color: #333;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .pillar.security {
        border-color: rgba(0, 153, 255, 0.2);
      }

      .pillar.medical {
        border-color: rgba(255, 107, 53, 0.2);
      }

      .pillar.safety {
        border-color: rgba(255, 149, 0, 0.2);
      }

      .pillar.communications {
        border-color: rgba(0, 170, 0, 0.2);
      }

      .pillar.operations {
        border-color: rgba(102, 102, 102, 0.2);
      }

      .btn-large {
        padding: 1rem 2rem;
        font-size: 1rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        width: 100%;
        max-width: 300px;
      }

      .btn-large:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 30px rgba(0, 153, 255, 0.3);
      }

      .btn-large:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .landing-info {
        background: rgba(255, 255, 255, 0.9);
        border-radius: 16px;
        padding: 2rem;
        border: 2px solid rgba(0, 153, 255, 0.1);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        text-align: left;
      }

      .landing-info h3 {
        margin: 0 0 1rem 0;
        color: #0099FF;
        font-size: 1.3rem;
        letter-spacing: 0.5px;
      }

      .landing-info p {
        margin: 0 0 1rem 0;
        color: #555;
        font-size: 0.95rem;
        line-height: 1.6;
      }

      .landing-info ul {
        margin: 0;
        padding: 0 0 0 1.5rem;
        list-style: none;
      }

      .landing-info li {
        margin: 0.5rem 0;
        color: #666;
        font-size: 0.9rem;
        line-height: 1.5;
      }

      .landing-info li:before {
        content: "✓ ";
        color: #0099FF;
        font-weight: 700;
        margin-right: 0.5rem;
      }

      @media (max-width: 1000px) {
        .landing-content {
          grid-template-columns: 1fr;
        }

        .landing-info {
          display: none;
        }
      }

      @media (max-width: 768px) {
        .landing-container {
          padding: 1rem;
        }

        .landing-card {
          padding: 2rem 1.5rem;
        }

        .welcome-text {
          font-size: 1.1rem;
        }

        .voc-logo-container {
          width: 100px;
          height: 100px;
        }

        .voc-branding h2 {
          font-size: 2rem;
        }

        .operational-pillars {
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
        }

        .mission-statement {
          font-size: 0.85rem;
          gap: 0.75rem;
        }

        .mission-divider {
          display: none;
        }
      }

      @media (max-width: 480px) {
        .voc-branding h2 {
          font-size: 1.8rem;
        }

        .tagline {
          font-size: 0.75rem;
          letter-spacing: 2px;
        }

        .operational-pillars {
          grid-template-columns: repeat(2, 1fr);
        }

        .pillar-icon {
          font-size: 1.5rem;
        }

        .pillar-label {
          font-size: 0.7rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  destroy() {
    // Cleanup if needed
  }
}
