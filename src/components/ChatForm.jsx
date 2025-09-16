import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Eraser, AlertTriangle, Globe } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { franc } from 'franc-min';
import {
  sendQuestionToAPI,
  setInput,
  clearIfInputEmpty,
  resetSessionId,
  resetUserId,
} from '../app/features/chat/chatSlice';
import { setSelectedLanguage } from '../app/features/chat/chatSlice';

// Enhanced language detection using franc library
const detectLanguage = (text) => {
  if (text.length < 8) return null;
  
  const detected = franc(text);
  
  if (detected === 'eng') return 'en';
  if (detected === 'fra') return 'fr';
  
  const frenchIndicators = /\b(je|tu|il|elle|nous|vous|ils|elles|le|la|les|un|une|des|du|de|à|avec|pour|dans|sur|par|sans|sous|entre|est|sont|était|étaient|avoir|être|faire|aller|venir|voir|savoir|pouvoir|vouloir|devoir)\b|[àâäéèêëïîôöùûüÿç]/gi;
  const englishIndicators = /\b(the|and|or|but|in|on|at|to|for|of|with|by|from|about|into|through|during|before|after|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|could|should|may|might|can|must|shall|this|that|these|those|what|which|who|when|where|why|how)\b/gi;
  
  const frenchMatches = (text.match(frenchIndicators) || []).length;
  const englishMatches = (text.match(englishIndicators) || []).length;
  
  if (frenchMatches > englishMatches && frenchMatches > 0) return 'fr';
  if (englishMatches > frenchMatches && englishMatches > 0) return 'en';
  
  return null;
};

// Simple Language Switch Warning Banner
const LanguageSwitchWarning = ({ isVisible, currentLang, targetLang, onConfirm, onCancel }) => {
  if (!isVisible) return null;

  const getLanguageName = (code) => code === 'en' ? 'English' : 'French';

  return (
    <div className="mb-2 px-3 py-3 bg-orange-50 border-l-4 border-orange-400 rounded text-sm shadow-lg relative z-50">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-orange-800 flex-1">
          <Globe className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="mb-1">
              <strong>Switch to {getLanguageName(targetLang)}? All chats will be cleared.</strong>
            </p>
            <p className="text-xs opacity-90">
              <strong>Basculer vers {targetLang === 'fr' ? 'Français' : 'Anglais'}? Tous les chats seront effacés.</strong>
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
          >
            No / Non
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded transition-colors"
          >
            Yes / Oui
          </button>
        </div>
      </div>
    </div>
  );
};

const ChatForm = () => {
  const dispatch = useDispatch();
  const { input, isResponding } = useSelector((state) => state.chat);
  const [text, setText] = useState(input);
  const selectedLanguage = useSelector((state) => state.chat.selectedLanguage);
  const [showLanguageMismatch, setShowLanguageMismatch] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [submitError, setSubmitError] = useState(false);
  const [showLanguageSwitchWarning, setShowLanguageSwitchWarning] = useState(false);
  const [pendingLanguageSwitch, setPendingLanguageSwitch] = useState(null);
  const textareaRef = useRef(null);

  // Language detection with debouncing for typing
  useEffect(() => {
    if (!text.trim()) {
      setShowLanguageMismatch(false);
      setDetectedLanguage(null);
      setSubmitError(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      const detected = detectLanguage(text);
      setDetectedLanguage(detected);
      
      if (detected && detected !== selectedLanguage && text.length > 15) {
        setShowLanguageMismatch(true);
        setSubmitError(false);
      } else {
        setShowLanguageMismatch(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [text, selectedLanguage]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!text.trim() || isResponding) {
      return;
    }

    const currentDetected = detectLanguage(text.trim());
    
    if (currentDetected && currentDetected !== selectedLanguage) {
      setSubmitError(true);
      setDetectedLanguage(currentDetected);
      setShowLanguageMismatch(true);
      return;
    }
    
    dispatch(sendQuestionToAPI(text.trim()));
    setText('');
    dispatch(setInput(''));
    setShowLanguageMismatch(false);
    setDetectedLanguage(null);
    setSubmitError(false);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleClearChat = () => {
    if (!input.trim()) {
      dispatch(clearIfInputEmpty());
    }
    dispatch(resetSessionId());
    dispatch(resetUserId());
    setText('');
    setShowLanguageMismatch(false);
    setDetectedLanguage(null);
    setSubmitError(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Enhanced language change handler with warning banner
  const handleLanguageChange = (targetLanguage) => {
    // If switching to the same language, do nothing
    if (targetLanguage === selectedLanguage) {
      return;
    }

    // Show confirmation banner before switching
    setPendingLanguageSwitch(targetLanguage);
    setShowLanguageSwitchWarning(true);
  };

  // Confirm language switch and clear chat
  const confirmLanguageSwitch = () => {
    if (pendingLanguageSwitch) {
      // Clear all chat data first
      handleClearChat();
      
      // Then switch the language
      dispatch(setSelectedLanguage(pendingLanguageSwitch));
      
      // Reset warning state
      setShowLanguageSwitchWarning(false);
      setPendingLanguageSwitch(null);
      
      // Clear any language mismatch warnings
      setShowLanguageMismatch(false);
      setSubmitError(false);
      setDetectedLanguage(null);
    }
  };

  // Cancel language switch
  const cancelLanguageSwitch = () => {
    setShowLanguageSwitchWarning(false);
    setPendingLanguageSwitch(null);
  };

  // Adjust textarea height
  useEffect(() => {
    const adjustHeight = () => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        const newHeight = Math.min(textareaRef.current.scrollHeight, 200);
        textareaRef.current.style.height = `${newHeight}px`;
      }
    };

    adjustHeight();
  }, [text]);

  const getPlaceholderText = () => {
    if (showLanguageSwitchWarning) return '';
    if (isResponding) return 'Please wait for the response...';
    return selectedLanguage === 'fr' 
      ? 'Tapez votre question en français...' 
      : 'Type a new question...';
  };

  const getLanguageName = (code) => {
    return code === 'en' ? 'English' : 'French';
  };

  return (
    <div className="relative w-[95%] max-w-[968px] mb-4">
      {/* Language Switch Warning Banner */}
      <LanguageSwitchWarning
        isVisible={showLanguageSwitchWarning}
        currentLang={selectedLanguage}
        targetLang={pendingLanguageSwitch}
        onConfirm={confirmLanguageSwitch}
        onCancel={cancelLanguageSwitch}
      />

      {/* Small Language Mismatch Disclaimer */}
      {showLanguageMismatch && detectedLanguage && (
        <div className="mb-2 px-3 py-2 bg-red-50 border-l-3 border-red-400 rounded text-sm">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              You're typing in <strong>{getLanguageName(detectedLanguage)}</strong> but have selected <strong>{getLanguageName(selectedLanguage)}</strong>. 
              Switch to {getLanguageName(detectedLanguage)} or retype in {getLanguageName(selectedLanguage)}.
            </span>
          </div>
        </div>
      )}

      <div
        id='chat_form'
        className={`border-b-4 border-b-[#174a7e] p-4 h-auto min-h-20 flex items-end border border-gray-300 shadow-md rounded-md bg-white relative ${
          showLanguageSwitchWarning ? 'z-40' : 'z-10'
        }`}
      >
        {/* Clear Chat Button */}
        <button
          type='button'
          onClick={handleClearChat}
          title={showLanguageSwitchWarning ? '' : 'Clear Chat'}
          className={`flex items-center justify-center w-10 h-10 rounded-md transition-colors mr-3 ${
            showLanguageSwitchWarning 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer'
          }`}
          disabled={showLanguageSwitchWarning} // Disable when warning is showing
        >
          <Eraser className='w-5 h-5' />
        </button>

        <textarea
          ref={textareaRef}
          name='text'
          id='text'
          className={`border-none outline-none grow mr-4 rounded-md resize-none overflow-y-auto scroll-smooth
            ${isResponding || showLanguageSwitchWarning ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            ${submitError ? 'bg-red-50' : ''}
            pt-2 pb-2 transition-all duration-200`}
          placeholder={getPlaceholderText()}
          value={text}
          onChange={(e) => {
            if (showLanguageSwitchWarning) return; // Block typing when warning is showing
            setText(e.target.value);
            dispatch(setInput(e.target.value));
            setSubmitError(false);
          }}
          onKeyDown={(e) => {
            if (showLanguageSwitchWarning) {
              e.preventDefault(); // Block all key interactions when warning is showing
              return;
            }
            if (e.key === 'Enter' && !e.shiftKey && !isResponding) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          rows={1}
          disabled={isResponding || showLanguageSwitchWarning} // Disable when warning is showing
        />

        {/* Enhanced Language Toggle with Warning */}
        <div className="mr-3">
          <div className="flex border-2 border-gray-300 rounded-lg overflow-hidden shadow-sm">
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`px-4 py-2 text-sm font-bold transition-all duration-200 ${
                selectedLanguage === 'en'
                  ? 'bg-[#174a7e] text-white shadow-lg transform scale-105'
                  : showLanguageSwitchWarning
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={showLanguageSwitchWarning ? '' : 'Switch to English'}
              disabled={showLanguageSwitchWarning} // Disable when warning is showing
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => handleLanguageChange('fr')}
              className={`px-4 py-2 text-sm font-bold transition-all duration-200 ${
                selectedLanguage === 'fr'
                  ? 'bg-[#174a7e] text-white shadow-lg transform scale-105'
                  : showLanguageSwitchWarning
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={showLanguageSwitchWarning ? '' : 'Passer au français'}
              disabled={showLanguageSwitchWarning} // Disable when warning is showing
            >
              FR
            </button>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className={`flex items-center justify-center w-10 h-10 rounded-md transition-all duration-200 ${
            isResponding || showLanguageSwitchWarning
              ? 'bg-gray-400 cursor-not-allowed'
              : text.trim()
              ? 'bg-[#174a7e] text-white hover:bg-blue-800 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={isResponding || !text.trim() || showLanguageSwitchWarning} // Disable when warning is showing
          title={
            showLanguageSwitchWarning
              ? ''
              : text.trim() 
              ? `Send message in ${selectedLanguage === 'en' ? 'English' : 'French'}`
              : 'Type a message first'
          }
        >
          {isResponding ? (
            <Loader2 className='animate-spin w-5 h-5' />
          ) : (
            <Send className='w-5 h-5' />
          )}
        </button>
      </div>
    </div>
  );
};

export default ChatForm;
