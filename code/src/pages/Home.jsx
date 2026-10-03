import "./Home.css";

function Home({ onNavigate }) {
  return (
    <main className="fc-home">

      {/* FULL SCREEN HERO */}

      <section className="fc-hero">

        {/* Background overlay */}

        <div className="fc-hero-overlay"></div>


        {/* Hero content */}

        <div className="fc-hero-content">

          <div className="fc-eyebrow">
            FOOD DONATION PLATFORM
          </div>


          <h1>
            From surplus food
            <br />
            to <em>meaningful support.</em>
          </h1>


          <p className="fc-description">
            FoodConnect creates a clear connection between
            people with surplus food and organizations that
            can put it to use. Every donation follows a
            structured and traceable process.
          </p>


          <div className="fc-actions">

            <button
              className="fc-primary-button"
              onClick={() => onNavigate("donations")}
            >
              View available food
              <span>→</span>
            </button>


            <button
              className="fc-secondary-button"
              onClick={() => onNavigate("register")}
            >
              Create an account
            </button>

          </div>


          {/* Donation hours */}

          <div className="fc-hours">

            <div className="fc-hours-line"></div>

            <div className="fc-hours-content">

              <small>
                DONATION HOURS
              </small>

              <strong>
                8:00 AM — 10:00 PM
              </strong>

            </div>

          </div>

        </div>


        {/* Small bottom information */}

        <div className="fc-hero-footer">

          <span>
            FOODCONNECT
          </span>

          <span className="fc-footer-line"></span>

          <span>
            SAFE
          </span>

          <span>
            TRACEABLE
          </span>

          <span>
            LOCAL
          </span>

        </div>

      </section>

    </main>
  );
}

export default Home;