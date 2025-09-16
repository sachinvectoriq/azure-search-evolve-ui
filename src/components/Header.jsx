import { LogOut, User, Settings, Home } from 'lucide-react';
import Logo from './Logo';
import useAuth from '../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';

const Header = () => {
  const { logoutUser, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSettingsPage, setIsSettingsPage] = useState(location.pathname === '/settings');

  const handleLogout = () => {
    logoutUser();
    localStorage.clear();
    navigate('/');
  };

  const handleNavToggle = () => {
    if (isSettingsPage) {
      navigate('/home');
      setIsSettingsPage(false);
    } else {
      navigate('/settings');
      setIsSettingsPage(true);
    }
  };

  return (
    <div id="header" className="bg-white sticky top-0 w-full z-50 p-2">
      <div className="container p-4 w-[95%] max-w-[1400px] mx-auto flex justify-between items-center">
        <Logo />
        <h1 className="text-3xl font-semibold text-[#fcbc19]">
          Evolve Knowledge Assistant
        </h1>
        <div className="flex items-center gap-4">
          {/* ✅ Settings Button - visible for all users */}
          <button
            onClick={handleNavToggle}
            className="border border-gray-100 bg-gray-100 font-semibold hover:border-[#174a7e] text-[#174a7e] cursor-pointer p-2 px-4 rounded-md flex items-center gap-2 transition-colors"
          >
            {isSettingsPage ? <Home size={18} /> : <Settings size={18} />}
            {isSettingsPage ? 'Home' : 'Settings'}
          </button>

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
