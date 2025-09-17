// src/pages/SettingPage.jsx
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Header from '../components/Header';

const API_BASE = 'https://app-azuresearch-qa-evolve.azurewebsites.net';

const SettingPage = () => {
  // Get dynamic auth values from Redux store (similar to chatSlice.js)
  const auth = useSelector(state => state.auth);
  
  // Debug the entire auth state to understand its structure
  console.log("Full auth state:", auth);
  
  // Based on your auth slice structure:
  const userName = auth?.user?.name || "Anonymous";
  const loginSessionId = auth?.login_session_id || "";
  
  // Also check localStorage directly as fallback
  const userNameFromStorage = localStorage.getItem("name") ? JSON.parse(localStorage.getItem("name")) : null;
  const loginSessionIdFromStorage = localStorage.getItem("login_session_id") ? JSON.parse(localStorage.getItem("login_session_id")) : null;
  
  // Use fallbacks if Redux state is empty
  const finalUserName = userName !== "Anonymous" ? userName : userNameFromStorage || "Anonymous";
  const finalLoginSessionId = loginSessionId || loginSessionIdFromStorage || "";

  // Debug log to verify auth values
  const [formData, setFormData] = useState({
    azure_search_endpoint: '',
    azure_search_index_name: '',
    current_prompt: '',
    openai_model_deployment_name: '',
    openai_endpoint: '',
    openai_api_version: '',
    openai_model_temperature: '',
    openai_api_key: '',
    semantic_configuration_name_english: '',  // Changed to match API response
    azure_search_index_name_french: '',
    current_prompt_french: '',
    semantic_configuration_name_french: ''  // Added French semantic configuration
  });

  const [originalData, setOriginalData] = useState({});
  const [azureEdit, setAzureEdit] = useState(false);
  const [promptEdit, setPromptEdit] = useState(false);
  const [openaiEdit, setOpenaiEdit] = useState(false);
  const [semanticEdit, setSemanticEdit] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Debug log to verify auth values
  useEffect(() => {
    console.log("=== AUTH DEBUG INFO ===");
    console.log("Auth state structure:", JSON.stringify(auth, null, 2));
    console.log("User Name extracted:", userName);
    console.log("Login Session ID extracted:", loginSessionId);
    console.log("Is userName default?", userName === "Anonymous");
    console.log("Is loginSessionId empty?", loginSessionId === "");
    console.log("======================");
  }, [auth, userName, loginSessionId]);

  // Fetch settings from API
  useEffect(() => {
    fetch(`${API_BASE}/get_settings`)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch settings: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setFormData(data);
        setOriginalData(data);
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  const updateField = (field, value) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const postSettings = async () => {
    setIsSaving(true);
    setError(null);

    const allowedKeys = [
      'azure_search_endpoint',
      'azure_search_index_name',
      'current_prompt',
      'openai_model_deployment_name',
      'openai_endpoint',
      'openai_api_version',
      'openai_model_temperature',
      'openai_api_key',
      'semantic_configuration_name_english',  // Changed to match API
      'azure_search_index_name_french',
      'current_prompt_french',
      'semantic_configuration_name_french'  // Added French semantic configuration to allowed keys
    ];

    const body = new URLSearchParams();
    allowedKeys.forEach(k => {
      if (formData[k] !== undefined) {
        body.append(k, formData[k]);
      }
    });

    // Use the final values (with fallbacks) instead of hardcoded ones
    body.append('user_name', finalUserName);
    body.append('login_session_id', finalLoginSessionId);

    console.log("=== API CALL DEBUG ===");
    console.log("Redux userName:", userName);
    console.log("Redux loginSessionId:", loginSessionId);
    console.log("Storage userName:", userNameFromStorage);
    console.log("Storage loginSessionId:", loginSessionIdFromStorage);
    console.log("Final userName being sent:", finalUserName);
    console.log("Final loginSessionId being sent:", finalLoginSessionId);
    console.log("Full request body:", body.toString());
    console.log("=====================");

    try {
      const response = await fetch(`${API_BASE}/update_settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || `Failed to update settings`);
      }

      const successMsg = await response.json();
      console.log('Update successful:', successMsg);
      setOriginalData({ ...formData });
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const saveSection = async (setter) => {
    if (await postSettings()) setter(false);
  };

  const cancelSection = (fields, setter) => {
    setFormData(prev => {
      const updated = { ...prev };
      fields.forEach(f => updated[f] = originalData[f]);
      return updated;
    });
    setter(false);
  };

  // Show warning if auth values are missing
  const showAuthWarning = !finalUserName || finalUserName === "Anonymous" || !finalLoginSessionId;

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <Header />
      <div className="max-w-4xl mx-auto p-8 space-y-10">
        {isLoading && <LoadingSpinner />}
        {error && <ErrorBanner message={error} onClose={() => setError(null)} />}
        {isSaving && <SavingBanner />}
        
        {/* Auth Info Banner - Always show for debugging */}
        <div className={`px-4 py-3 rounded border ${showAuthWarning ? 'bg-yellow-100 border-yellow-400 text-yellow-700' : 'bg-green-100 border-green-400 text-green-700'}`}>
          <strong className="font-bold">
            {showAuthWarning ? 'Authentication Warning!' : 'Authentication Status: OK'}
          </strong>
          {showAuthWarning && (
            <span className="block sm:inline"> User authentication data is missing or incomplete. Settings changes may not be properly tracked.</span>
          )}
          <div className="text-sm mt-1">
            <div>Current User: <code className="bg-gray-200 px-1 rounded">{finalUserName}</code></div>
            <div>Session ID: <code className="bg-gray-200 px-1 rounded">{finalLoginSessionId || "Not set"}</code></div>
            <div className="text-xs mt-1 opacity-75">
              Check browser console for detailed auth state debugging info
            </div>
          </div>
        </div>

        {!isLoading && (
          <>
            {/* Azure Search Parameters */}
            <SectionCard title="Azure Search Parameters">
              <LabelledInput
                disabled={!azureEdit}
                label="Search Endpoint"
                value={formData.azure_search_endpoint}
                onChange={v => updateField('azure_search_endpoint', v)}
              />
              <LabelledInput
                disabled={!azureEdit}
                label="English Index Name"
                value={formData.azure_search_index_name}
                onChange={v => updateField('azure_search_index_name', v)}
              />
              <LabelledInput
                disabled={!azureEdit}
                label="French Index Name"
                value={formData.azure_search_index_name_french}
                onChange={v => updateField('azure_search_index_name_french', v)}
              />
              {!azureEdit ? (
                <ChangeButton onClick={() => setAzureEdit(true)} />
              ) : (
                <ActionButtons
                  onSave={() => saveSection(setAzureEdit)}
                  onCancel={() =>
                    cancelSection(['azure_search_endpoint', 'azure_search_index_name', 'azure_search_index_name_french'], setAzureEdit)
                  }
                  disabled={isSaving}
                />
              )}
            </SectionCard>

            {/* Semantic Model Parameters - Updated with French support */}
            <SectionCard title="Semantic Model Parameters">
              <LabelledInput
                disabled={!semanticEdit}
                label="English Semantic Configuration Name"
                value={formData.semantic_configuration_name_english}
                onChange={v => updateField('semantic_configuration_name_english', v)}
              />
              <LabelledInput
                disabled={!semanticEdit}
                label="French Semantic Configuration Name"
                value={formData.semantic_configuration_name_french}
                onChange={v => updateField('semantic_configuration_name_french', v)}
              />
              {!semanticEdit ? (
                <ChangeButton onClick={() => setSemanticEdit(true)} />
              ) : (
                <ActionButtons
                  onSave={() => saveSection(setSemanticEdit)}
                  onCancel={() =>
                    cancelSection(['semantic_configuration_name_english', 'semantic_configuration_name_french'], setSemanticEdit)
                  }
                  disabled={isSaving}
                />
              )}
            </SectionCard>

            {/* OpenAI Parameters */}
            <SectionCard title="OpenAI Model Parameters">
              <LabelledInput
                disabled={!openaiEdit}
                label="Deployment Name"
                value={formData.openai_model_deployment_name}
                onChange={v => updateField('openai_model_deployment_name', v)}
              />
              <LabelledInput
                disabled={!openaiEdit}
                label="Endpoint"
                value={formData.openai_endpoint}
                onChange={v => updateField('openai_endpoint', v)}
              />
              <LabelledInput
                disabled={!openaiEdit}
                label="API Version"
                value={formData.openai_api_version}
                onChange={v => updateField('openai_api_version', v)}
              />
              <LabelledInput
                disabled={!openaiEdit}
                label="Temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={formData.openai_model_temperature}
                onChange={v => updateField('openai_model_temperature', v)}
              />
              <LabelledInput
                disabled={!openaiEdit}
                label="OpenAI API Key"
                value={formData.openai_api_key}
                onChange={v => updateField('openai_api_key', v)}
              />
              {!openaiEdit ? (
                <ChangeButton onClick={() => setOpenaiEdit(true)} />
              ) : (
                <ActionButtons
                  onSave={() => saveSection(setOpenaiEdit)}
                  onCancel={() =>
                    cancelSection(
                      [
                        'openai_model_deployment_name',
                        'openai_endpoint',
                        'openai_api_version',
                        'openai_model_temperature',
                        'openai_api_key'
                      ],
                      setOpenaiEdit
                    )
                  }
                  disabled={isSaving}
                />
              )}
            </SectionCard>

            {/* Prompts */}
            <SectionCard title="System Prompts">
              <LabelledTextarea
                disabled={!promptEdit}
                label="English Prompt"
                value={formData.current_prompt}
                onChange={v => updateField('current_prompt', v)}
              />
              <LabelledTextarea
                disabled={!promptEdit}
                label="French Prompt"
                value={formData.current_prompt_french}
                onChange={v => updateField('current_prompt_french', v)}
              />
              {!promptEdit ? (
                <ChangeButton onClick={() => setPromptEdit(true)} />
              ) : (
                <ActionButtons
                  onSave={() => saveSection(setPromptEdit)}
                  onCancel={() => cancelSection(['current_prompt', 'current_prompt_french'], setPromptEdit)}
                  disabled={isSaving}
                />
              )}
            </SectionCard>
          </>
        )}
      </div>
    </div>
  );
};

/* ----------------- SMALL COMPONENTS ------------------ */
const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-12">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <div className="text-lg font-semibold text-blue-600">Loading settings...</div>
    </div>
  </div>
);

const ErrorBanner = ({ message, onClose }) => (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
    <strong className="font-bold">Error!</strong>
    <span className="block sm:inline"> {message}</span>
    <button onClick={onClose} className="absolute top-0 bottom-0 right-0 px-4 py-3">×</button>
  </div>
);

const SavingBanner = () => (
  <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
    <strong className="font-bold">Saving...</strong>
    <span className="block sm:inline"> Please wait while we update your settings.</span>
  </div>
);

const SectionCard = ({ title, children }) => (
  <div className="bg-white p-6 rounded shadow-md">
    <h2 className="text-xl font-semibold text-[#174a7e] mb-4">{title}</h2>
    {children}
  </div>
);

const LabelledInput = ({ label, value, onChange, disabled, type = "text", ...props }) => (
  <div className="mb-4">
    <label className="block font-medium text-gray-700 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      disabled={disabled}
      onChange={e => onChange(e.target.value)}
      className={`w-full border rounded px-4 py-2 ${disabled ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-400'}`}
      {...props}
    />
  </div>
);

const LabelledTextarea = ({ label, value, onChange, disabled }) => (
  <div className="mb-4">
    <label className="block font-medium text-gray-700 mb-1">{label}</label>
    <textarea
      rows="4"
      value={value}
      disabled={disabled}
      onChange={e => onChange(e.target.value)}
      className={`w-full border rounded px-4 py-2 resize-vertical ${disabled ? 'bg-gray-100 border-gray-300' : 'bg-white border-gray-400'}`}
    />
  </div>
);

const ChangeButton = ({ onClick }) => (
  <div className="flex justify-end pt-2">
    <button onClick={onClick} className="text-blue-600 font-medium hover:underline">Change</button>
  </div>
);

const ActionButtons = ({ onSave, onCancel, disabled = false }) => (
  <div className="flex justify-end gap-3 pt-4">
    <button
      onClick={onCancel}
      disabled={disabled}
      className={`px-4 py-2 rounded ${disabled ? 'bg-gray-100 text-gray-400' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
    >
      Cancel
    </button>
    <button
      onClick={onSave}
      disabled={disabled}
      className={`px-4 py-2 rounded ${disabled ? 'bg-yellow-200 text-gray-400' : 'bg-yellow-400 text-black hover:bg-yellow-500'}`}
    >
      {disabled ? 'Saving...' : 'Save'}
    </button>
  </div>
);

export default SettingPage;
