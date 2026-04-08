import React from 'react';
import { Navbar as BSNavbar, Nav, Container } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  return (
    <BSNavbar bg="dark" variant="dark" expand="lg" className="shadow">
      <Container>
        <BSNavbar.Brand as={Link} to="/" className="fw-bold">
          🎯 Decision Maker
        </BSNavbar.Brand>
        <BSNavbar.Toggle aria-controls="navbar-nav" />
        <BSNavbar.Collapse id="navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/" 
              active={location.pathname === '/'}
            >
              🎲 New Decision
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/history" 
              active={location.pathname === '/history'}
            >
              📊 History
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/agent" 
              active={location.pathname === '/agent'}
            >
              🤖 AI Agent
            </Nav.Link>
          </Nav>
          <Nav>
            <Nav.Item className="d-flex align-items-center text-light me-3">
              <small>👤 {user.username}</small>
            </Nav.Item>
            <Nav.Link onClick={logout} className="text-light">
              Logout
            </Nav.Link>
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  );
};

export default Navbar;
