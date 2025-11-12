// src/hooks/useAuth.js
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  login,
  logout,
  setToken,
  removeToken,
  setLoginSessionId,
} from '../app/features/auth/authSlice';

// ✅ Helper: Safely decode JWT to extract email
const decodeJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('❌ JWT decode failed:', e);
    return null;
  }
};

const useAuth = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const loginSessionId = useSelector((state) => state.auth.login_session_id);

  const isLoggedIn = !!token;
  
  // ✅ Restore Redux auth state from localStorage after refresh
  useEffect(() => {
  // If Redux user is empty but localStorage has data, restore it
  if (!user && localStorage.getItem('name')) {
    const restoredUser = {
      name: JSON.parse(localStorage.getItem('name') || '""'),
      group: JSON.parse(localStorage.getItem('group') || '""'),
      email: JSON.parse(localStorage.getItem('email') || '""'),
      job_title: JSON.parse(localStorage.getItem('job_title') || '""'),
    };
    const savedToken = localStorage.getItem('token') || '';
    const savedSessionId = JSON.parse(localStorage.getItem('login_session_id') || '""');
    dispatch(login({ user: restoredUser, token: savedToken }));
    dispatch(setLoginSessionId(savedSessionId));
  }
}, [dispatch, user]);


  const loginUser = (userData) => {
    // ✅ Decode JWT and extract email if backend didn’t send
    let extractedEmail = null;
    if (userData.token) {
      const decoded = decodeJwt(userData.token);
      extractedEmail = decoded?.user_data?.email?.[0] || null;
    }

    if (!userData.email && extractedEmail) {
      userData.email = extractedEmail;
    }

    if (!userData.email) {
      console.warn('⚠️ No email found for user:', userData.name);
    }

    // ✅ Dispatch Redux login
    dispatch(login({ user: userData, token: userData.token }));

    // ✅ Persist to localStorage
    localStorage.setItem('name', JSON.stringify(userData.name || ''));
    localStorage.setItem('group', JSON.stringify(userData.group || ''));
    localStorage.setItem('email', JSON.stringify(userData.email || ''));
    localStorage.setItem('job_title', JSON.stringify(userData.job_title || ''));
    localStorage.setItem('token', userData.token || '');
    localStorage.setItem('login_session_id', JSON.stringify(loginSessionId || ''));
  };

  const logoutUser = () => {
    dispatch(logout());
    localStorage.clear(); // ✅ Completely clear storage on logout
  };

  const storeLoginSessionId = (id) => {
    localStorage.setItem('login_session_id', JSON.stringify(id));
    dispatch(setLoginSessionId(id));
  };

  const updateToken = (newToken) => {
    dispatch(setToken(newToken));
    localStorage.setItem('token', newToken); // ✅ Keep token persistent
  };

  const clearToken = () => {
    dispatch(removeToken());
    localStorage.removeItem('token');
  };

  return {
    user,
    token,
    loginSessionId,
    isLoggedIn,
    loginUser,
    logoutUser,
    updateToken,
    clearToken,
    storeLoginSessionId,
  };
};

export default useAuth;
