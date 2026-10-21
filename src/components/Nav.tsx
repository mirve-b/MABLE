import logo from "../assets/deco/rabbit.svg";

export function Nav() {
  return (
    <nav className="nav">
      <a className="nav-logo" href="#top" aria-label="Mable">
        <img src={logo} alt="" />
      </a>
      <div className="nav-links">
        <a href="#about">about</a>
        <a href="#work">work</a>
        <a href="#services">services</a>
        <a href="/contact">contact</a>
        <a href="#faq">FAQ</a>
      </div>
      <a className="make" href="/contact">
        let’s make it!!
      </a>
    </nav>
  );
}
