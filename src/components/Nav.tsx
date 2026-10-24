import "../hero.css";

export function Nav() {
  return (
    <nav className="nav">
      <a className="nav-brand" href="#top" aria-label="Mable">
        <span className="nav-wordmark" aria-hidden="true" />
        <span className="nav-studio">Design X Code Studio</span>
      </a>
      <div className="nav-links">
        <a href="#about">About</a>
        <a href="#work">Work</a>
        <a href="#services">Services</a>
        <a href="/contact">Contact</a>
        <a href="#faq">FAQ</a>
      </div>
      <a className="make" href="/contact">
        Let’s make it!!
      </a>
    </nav>
  );
}
