import { useSelector, useDispatch } from 'react-redux';
import {
  login,
  logout,
  setToken,
  removeToken,
  //storeSessionId,
  setLoginSessionId,
} from '../app/features/auth/authSlice';

const useAuth = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const token = useSelector((state) => state.auth.token);
  const loginSessionId = useSelector((state) => state.auth.login_session_id);  // ✅ Add this

  const isLoggedIn = !!token;

  const loginUser = (userData) => {
    dispatch(login({ user: userData, token: userData.token }));
    localStorage.setItem('name', JSON.stringify(userData.name));
    localStorage.setItem('group', JSON.stringify(userData.group));
    localStorage.setItem('job_title', JSON.stringify(userData.job_title));
    localStorage.setItem('token', userData.token);
    localStorage.setItem('login_session_id', JSON.stringify(loginSessionId)); // ✅ Add this
  };

  const logoutUser = () => {
    dispatch(logout());
  };

  //const storeSession = (session_id) => {
    //dispatch(storeSessionId(session_id));
    //localStorage.setItem('session_id', session_id);
  //};

  const storeLoginSessionId = (id) => {
    localStorage.setItem('login_session_id', JSON.stringify(id)); // <-- UPDATE LOCALSTORAGE KEY
    dispatch(setLoginSessionId(id)); // <-- USE NEW REDUCER
  };

  const updateToken = (newToken) => {
    dispatch(setToken(newToken));
  };

  const clearToken = () => {
    dispatch(removeToken());
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
    //storeSession,
    loginSessionId,
    storeLoginSessionId,
  };
};

export default useAuth;
