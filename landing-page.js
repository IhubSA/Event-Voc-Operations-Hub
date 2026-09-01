// VOC Landing Page
// Welcome/splash page shown before login
// Exact design matching user specifications

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
              <div class="voc-logo-container">
                <img class="voc-logo-image" src="./voc-logo.png" alt="VOC Logo" />
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

              <button class="btn btn-primary btn-large" id="login-btn">GO TO LOGIN</button>
            </div>
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
        max-width: 1100px;
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
      }

      .landing-logo-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        width: 100%;
      }

      .voc-logo-container {
        width: 300px;
        height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .voc-logo-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 4px 12px rgba(0, 99, 255, 0.2));
      }

      .voc-mission {
        width: 100%;
        padding: 0;
        background: transparent;
        border-radius: 0;
        border: none;
      }

      .mission-statement {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .mission-item {
        color: #333;
        font-weight: 700;
        font-size: 0.9rem;
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      .mission-divider {
        color: #999;
        font-weight: 300;
        font-size: 0.8rem;
      }

      .operational-pillars {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 1rem;
        width: 100%;
      }

      .pillar {
        background: linear-gradient(135deg, rgba(0, 153, 255, 0.08) 0%, rgba(0, 153, 255, 0.02) 100%);
        border: 2px solid rgba(0, 153, 255, 0.15);
        border-radius: 12px;
        padding: 1.2rem 0.8rem;
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
        font-size: 2rem;
      }

      .pillar-label {
        font-size: 0.75rem;
        font-weight: 700;
        color: #333;
        text-transform: uppercase;
        letter-spacing: 0.5px;
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
        max-width: 280px;
        background: #0099FF;
        color: white;
      }

      .btn-large:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 30px rgba(0, 153, 255, 0.3);
        background: #0088DD;
      }

      .btn-large:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .landing-info {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 16px;
        padding: 2rem;
        border: 2px solid rgba(0, 153, 255, 0.1);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        text-align: left;
        height: fit-content;
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
        padding: 0;
        list-style: none;
      }

      .landing-info li {
        margin: 0.5rem 0;
        color: #666;
        font-size: 0.9rem;
        line-height: 1.5;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .landing-info li:before {
        content: "✓";
        color: #0099FF;
        font-weight: 700;
        font-size: 1.1rem;
      }

      @media (max-width: 1000px) {
        .landing-content {
          grid-template-columns: 1fr;
        }

        .landing-info {
          display: none;
        }

        .voc-logo-container {
          width: 250px;
          height: 170px;
        }
      }

      @media (max-width: 768px) {
        .landing-container {
          padding: 1rem;
        }

        .landing-card {
          padding: 2rem 1.5rem;
        }

        .voc-logo-container {
          width: 200px;
          height: 140px;
        }

        .operational-pillars {
          grid-template-columns: repeat(3, 1fr);
          gap: 0.75rem;
        }

        .mission-statement {
          font-size: 0.85rem;
          gap: 0.75rem;
        }

        .mission-divider {
          display: none;
        }

        .pillar-icon {
          font-size: 1.5rem;
        }

        .pillar-label {
          font-size: 0.7rem;
        }
      }

      @media (max-width: 480px) {
        .voc-logo-container {
          width: 150px;
          height: 110px;
        }

        .operational-pillars {
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }

        .pillar {
          padding: 1rem 0.6rem;
        }

        .pillar-icon {
          font-size: 1.3rem;
        }

        .mission-statement {
          font-size: 0.75rem;
        }
      }
    `;
    document.head.appendChild(style);
  }

  destroy() {
    // Cleanup if needed
  }
}
