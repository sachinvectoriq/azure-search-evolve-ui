import { LogOut, User, Settings, Home, HelpCircle } from "lucide-react";
import Logo from './Logo';
import useAuth from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';

const Header = () => {
  const { logoutUser, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [helpOpen, setHelpOpen] = useState(false);
  const helpDropdownRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  const isSettingsPage = location.pathname === '/settings2';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (helpDropdownRef.current && !helpDropdownRef.current.contains(event.target)) {
        setHelpOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logoutUser();
    localStorage.clear();
    navigate('/');
  };

  const handleNavToggle = () => {
    if (isSettingsPage) {
      navigate('/home');
    } else {
      navigate('/settings2');
    }
  };

  const goToQuickTour = () => {
    // Open Quick Tour in a new tab
    window.open('/quick-tour', '_blank');
    setHelpOpen(false);
  };

  const handleMouseEnter = () => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setHelpOpen(true);
  };

  const handleMouseLeave = () => {
    // Add a delay before closing
    hoverTimeoutRef.current = setTimeout(() => {
      setHelpOpen(false);
    }, 400); // 400ms delay
  };

  return (
    <div id="header" className="bg-white sticky top-0 w-full z-50 p-2">
      <div className="container p-4 w-[95%] max-w-[1400px] mx-auto flex justify-between items-center">
        <Logo />
        <h1 className="text-3xl font-semibold text-[#fcbc19]">
          Evolve Knowledge Assistant
        </h1>
        <div className="flex items-center gap-4">

          {/* ✅ Settings Button - Only for admin */}
          {user?.group === 'admin' && (
            <button
              onClick={handleNavToggle}
              className="border border-gray-100 bg-gray-100 font-semibold hover:border-[#174a7e] text-[#174a7e] cursor-pointer p-2 px-4 rounded-md flex items-center gap-2 transition-colors"
            >
              {isSettingsPage ? <Home size={18} /> : <Settings size={18} />}
              {isSettingsPage ? 'Home' : 'Settings'}
            </button>
          )}

          {/* Help Dropdown with Hover Delay 
          <div 
            className="relative" 
            ref={helpDropdownRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              className="border border-gray-100 bg-gray-100 font-semibold text-[#174a7e] cursor-pointer p-2 px-4 rounded-md flex items-center gap-2 hover:border-[#174a7e] transition-colors"
            >
              <HelpCircle size={18} />
              Help
            </button>
            {helpOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white shadow-lg rounded-lg border border-gray-200 z-50 py-2">
                <button
                  onClick={goToQuickTour}
                  className="block w-full text-left px-4 py-3 text-[#174a7e] hover:bg-gray-200 hover:cursor-pointer transition-colors text-sm font-medium cursor-pointer"
                >
                  Quick Tour
                </button>
              </div>
            )}
          </div>*/}

          {/* User Display */}
          <h1 className="border border-gray-100 bg-gray-100 font-semibold hover:border-[#174a7e] text-[#174a7e] cursor-pointer p-2 px-4 rounded-md flex items-center gap-2 transition-colors">
            <User />
            {user ? user.name : 'Test User'}
          </h1>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="border border-[#174a7e] bg-white font-semibold text-[#174a7e] cursor-pointer p-2 px-4 rounded-md flex items-center gap-2 hover:bg-[#082340] hover:text-white transition-colors"
          >
            <span>Logout</span>
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;

