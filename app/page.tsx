import KhushaankPet from "./KhushaankPet";

export default function Home() {
  return (
    <main>
      <KhushaankPet />
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Khushaank Gupta, home">
          KG<span>.</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="#focus">Focus</a>
          <a href="#path">Path</a>
          <a href="#contact">Contact</a>
        </nav>
        <a
          className="header-link"
          href="https://www.linkedin.com/in/khushaank"
          target="_blank"
          rel="noreferrer"
        >
          LinkedIn <span aria-hidden="true">↗</span>
        </a>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">AI × business × finance</p>
          <h1>
            Turning businesses <em>AI-first.</em>
            <br />I handle the <i>how.</i>
          </h1>
          <p className="intro">
            I&apos;m Khushaank — interested in businesses, systems, and the people
            who build them. I explore how AI can simplify operations, sharpen
            decisions, and create leverage inside modern companies.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="mailto:khushaankgupta@hotmail.com">
              Start a conversation <span aria-hidden="true">↗</span>
            </a>
            <span className="location">Haryana, India</span>
          </div>
        </div>

        <div className="operating-map" aria-hidden="true">
          <span className="map-orbit orbit-one" />
          <span className="map-orbit orbit-two" />
          <span className="map-axis axis-x" />
          <span className="map-axis axis-y" />
          <span className="map-node node-ai">AI</span>
          <span className="map-node node-finance">Finance</span>
          <span className="map-node node-systems">Systems</span>
          <span className="map-node node-product">Product</span>
          <span className="map-dot dot-one" />
          <span className="map-dot dot-two" />
          <span className="map-dot dot-three" />
          <p>Find the signal. Design the system. Build the leverage.</p>
        </div>
      </section>

      <section className="focus" id="focus">
        <div className="section-heading">
          <p className="eyebrow">Where I spend my attention</p>
          <h2>Four lenses. One aim: useful progress.</h2>
        </div>
        <div className="focus-grid">
          <article>
            <span>01</span>
            <h3>Artificial intelligence</h3>
            <p>Practical uses of AI that reduce friction and improve how work gets done.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Finance</h3>
            <p>Using financial thinking to turn better information into better decisions.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Systems</h3>
            <p>Understanding the processes and incentives that make companies work.</p>
          </article>
          <article>
            <span>04</span>
            <h3>Product</h3>
            <p>Building tools, testing ideas, and learning what creates real value.</p>
          </article>
        </div>
      </section>

      <section className="path" id="path">
        <div className="statement">
          <p className="eyebrow">Current operating principle</p>
          <blockquote>
            Build things. Study business models. Keep looking for problems worth
            solving.
          </blockquote>
        </div>
        <div className="education">
          <p className="eyebrow">Education</p>
          <article>
            <div>
              <h3>ACCA</h3>
              <p>Chartered Accountancy · International Finance</p>
            </div>
            <time>2026 — 2028</time>
          </article>
          <article>
            <div>
              <h3>Delhi University</h3>
              <p>BCom · Accounting and Finance</p>
            </div>
            <time>2025 — 2028</time>
          </article>
        </div>
      </section>

      <section className="contact" id="contact">
        <p className="eyebrow">Open to interesting problems</p>
        <h2>Always thinking.<br />Always building.</h2>
        <p>
          If you&apos;re building something ambitious at the intersection of AI,
          business, or finance, let&apos;s compare notes.
        </p>
        <div className="contact-links">
          <a href="mailto:khushaankgupta@hotmail.com">
            khushaankgupta@hotmail.com <span aria-hidden="true">↗</span>
          </a>
          <a
            href="https://www.linkedin.com/in/khushaank"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>

      <footer>
        <span>© {new Date().getFullYear()} Khushaank Gupta</span>
        <span>AI-first · finance-smart · systems-minded</span>
      </footer>
    </main>
  );
}
