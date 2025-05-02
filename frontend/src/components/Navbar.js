import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AppBar, Toolbar, Button, Box, Stack, Container } from "@mui/material";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem("token");
  const user = localStorage.getItem("studentName") ? "student" : "admin";

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <AppBar position="static" color="primary" elevation={3}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: "center", py: 1.5 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              color={isActive("/") ? "secondary" : "inherit"}
              component={Link}
              to="/"
              variant={isActive("/") ? "contained" : "text"}
            >
              Home
            </Button>

            {!isAuthenticated ? (
              <>
                <Button
                  color={isActive("/login") ? "secondary" : "inherit"}
                  component={Link}
                  to="/login"
                  variant={isActive("/login") ? "contained" : "text"}
                >
                  Login
                </Button>
              </>
            ) : (
              <>
                {user === "student" && (
                  <>
                    <Button
                      color={
                        isActive("/student-dashboard") ? "secondary" : "inherit"
                      }
                      component={Link}
                      to="/student-dashboard"
                      variant={
                        isActive("/student-dashboard") ? "contained" : "text"
                      }
                    >
                      Dashboard
                    </Button>
                    <Button
                      color={
                        isActive("/exam-registration") ? "secondary" : "inherit"
                      }
                      component={Link}
                      to="/exam-registration"
                      variant={
                        isActive("/exam-registration") ? "contained" : "text"
                      }
                    >
                      Exam Registration
                    </Button>
                  </>
                )}
                {user === "admin" && (
                  <Button
                    color={
                      isActive("/admin-dashboard") ? "secondary" : "inherit"
                    }
                    component={Link}
                    to="/admin-dashboard"
                    variant={
                      isActive("/admin-dashboard") ? "contained" : "text"
                    }
                  >
                    Admin Panel
                  </Button>
                )}
                <Button color="inherit" onClick={handleLogout}>
                  Logout
                </Button>
              </>
            )}
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
