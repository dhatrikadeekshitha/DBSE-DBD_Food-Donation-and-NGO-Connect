function Navbar({
  user,
  onNavigate,
  onLogout
}) {

  return (

    <nav className="navbar">

      <div
        className="logo"
        onClick={() =>
          onNavigate("home")
        }
      >
        FoodConnect
      </div>


      <div className="nav-links">

        <button
          onClick={() =>
            onNavigate("home")
          }
        >
          Home
        </button>


        <button
          onClick={() =>
            onNavigate("donations")
          }
        >
          Available Food
        </button>


        {user?.role?.toUpperCase() === "DONOR" && (

          <button
            onClick={() =>
              onNavigate(
                "donor-dashboard"
              )
            }
          >
            Donor Dashboard
          </button>

        )}


        {user?.role?.toUpperCase() === "NGO" && (

          <button
            onClick={() =>
              onNavigate(
                "ngo-dashboard"
              )
            }
          >
            NGO Dashboard
          </button>

        )}


        {!user && (

          <button
            onClick={() =>
              onNavigate("login")
            }
          >
            Login
          </button>

        )}


        {!user && (

          <button
            className="register-nav"
            onClick={() =>
              onNavigate("register")
            }
          >
            Register
          </button>

        )}


        {user && (

          <button
            className="logout-btn"
            onClick={onLogout}
          >
            Logout
          </button>

        )}

      </div>

    </nav>
  );
}


export default Navbar;