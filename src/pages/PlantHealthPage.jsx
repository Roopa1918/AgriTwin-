// AgriTwin — AI Plant Health & Disease Diagnosis
// Features:
// 1. Photo upload (Mobile camera or gallery selection, JPG/JPEG/PNG/WEBP)
// 2. Client-side optimization and preview
// 3. AI visual analysis via Google Gemini Vision API (disease, pest, nutrient, environmental)
// 4. Structured farmer-friendly diagnosis (Observation, Possible cause, Symptoms, Suggested action, Confidence)
// 5. Clarity feedback for blurry/unclear photographs
// 6. Direct alert creation and session history

import React, { useState, useRef, useEffect } from 'react';
import { useFields } from '../context/FieldsContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  validateImageFile, 
  prepareImageForAnalysis, 
  diagnosePlantPhoto 
} from '../services/plantDiagnosisService';
import { 
  Camera, 
  Upload, 
  Sparkles, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  Info, 
  X, 
  RotateCcw, 
  Bell, 
  Key, 
  HelpCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon
} from 'lucide-react';

export default function PlantHealthPage({ onNavigateToAlerts }) {
  const { t, language } = useLanguage();
  const { activeField, currentField } = useFields();
  const field = activeField || currentField;
  const cropName = field?.crop || 'Crop';
  const fieldName = field?.name || 'My Field';

  // Upload & Image State
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [imageMeta, setImageMeta] = useState(null);
  const [plantPart, setPlantPart] = useState('Leaf / Foliage');
  const [isDragging, setIsDragging] = useState(false);

  // Analysis & Result State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [alertSaved, setAlertSaved] = useState(false);

  // Session History (stored only in memory for this session)
  const [sessionHistory, setSessionHistory] = useState([]);

  // API Key Management (Stored in sessionStorage only)
  const [userApiKey, setUserApiKey] = useState(() => {
    return sessionStorage.getItem('agritwin_gemini_key') || '';
  });
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyInputVal, setKeyInputVal] = useState(userApiKey);
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [keySaveMessage, setKeySaveMessage] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Reset alert saved status when new diagnosis arrives
  useEffect(() => {
    setAlertSaved(false);
  }, [diagnosisResult]);

  // Handle file selection from camera or gallery
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalysisError(null);
    setDiagnosisResult(null);

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setAnalysisError(validation.error);
      return;
    }

    try {
      setSelectedFile(file);
      const processed = await prepareImageForAnalysis(file);
      setImagePreview(processed.dataUrl);
      setImageBase64(processed.base64Data);
      setImageMeta({
        name: file.name || 'Mobile Camera Photo',
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type: file.type || 'image/jpeg',
        dimensions: `${processed.optimizedWidth}×${processed.optimizedHeight}px`
      });
    } catch (err) {
      setAnalysisError(err.message || 'Failed to process the selected photo.');
    } finally {
      // Clear input so same file can be re-selected if desired
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setAnalysisError(null);
    setDiagnosisResult(null);

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setAnalysisError(validation.error);
      return;
    }

    try {
      setSelectedFile(file);
      const processed = await prepareImageForAnalysis(file);
      setImagePreview(processed.dataUrl);
      setImageBase64(processed.base64Data);
      setImageMeta({
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        type: file.type || 'image/jpeg',
        dimensions: `${processed.optimizedWidth}×${processed.optimizedHeight}px`
      });
    } catch (err) {
      setAnalysisError(err.message || 'Failed to process the dropped photo.');
    }
  };

  // Clear current photo
  const handleClearPhoto = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setImageBase64(null);
    setImageMeta(null);
    setDiagnosisResult(null);
    setAnalysisError(null);
  };

  // Save API key to session
  const handleSaveApiKey = () => {
    const trimmed = keyInputVal.trim();
    setUserApiKey(trimmed);
    if (trimmed) {
      sessionStorage.setItem('agritwin_gemini_key', trimmed);
      setKeySaveMessage('API key saved for this session.');
    } else {
      sessionStorage.removeItem('agritwin_gemini_key');
      setKeySaveMessage('API key cleared.');
    }
    setTimeout(() => setKeySaveMessage(null), 3000);
  };

  // Run AI Image Analysis
  const handleAnalyseImage = async () => {
    if (!imageBase64) {
      setAnalysisError('Please select or capture a plant photograph first.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setDiagnosisResult(null);

    try {
      const result = await diagnosePlantPhoto({
        base64Data: imageBase64,
        mimeType: imageMeta?.type || 'image/jpeg',
        cropName,
        plantPart,
        userApiKey: userApiKey || undefined,
        language
      });

      setDiagnosisResult(result);

      // Add to session history
      setSessionHistory(prev => [
        {
          id: `diag-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          imagePreview,
          crop: result.cropIdentified || cropName,
          possibleCause: result.possibleCause,
          causeType: result.causeType,
          confidence: result.confidence,
          isClear: result.isClear
        },
        ...prev.slice(0, 9) // Keep last 10
      ]);
    } catch (err) {
      if (err.code === 'NO_API_KEY' || err.message === 'NO_API_KEY') {
        setShowKeyInput(true);
        setAnalysisError('AI_KEY_REQUIRED');
      } else {
        setAnalysisError(err.message || 'An error occurred during AI analysis. Please try again.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Add diagnosis to Alerts Hub
  const handleAddToAlerts = () => {
    if (!diagnosisResult) return;

    const newAlert = {
      id: `alert-plant-diag-${Date.now()}`,
      category: diagnosisResult.causeType === 'pest' ? 'PEST' : 'PLANT',
      severity: diagnosisResult.causeType === 'healthy' ? 'INFO' : 'WARNING',
      status: 'NEW',
      title: `${diagnosisResult.causeType === 'pest' ? '🦗 Pest Damage' : diagnosisResult.causeType === 'disease' ? '🍄 Plant Disease' : '🌱 Foliar Diagnosis'}: ${diagnosisResult.possibleCause}`,
      message: `${diagnosisResult.observation} (Visible on ${cropName} ${plantPart}).`,
      zoneName: `${fieldName} (${cropName})`,
      timestamp: 'Just now',
      action: diagnosisResult.suggestedAction,
      confidence: diagnosisResult.confidence,
      thumbnail: imagePreview
    };

    try {
      const existing = JSON.parse(localStorage.getItem('agritwin_plant_alerts') || '[]');
      const updated = [newAlert, ...existing.slice(0, 19)];
      localStorage.setItem('agritwin_plant_alerts', JSON.stringify(updated));
      setAlertSaved(true);
    } catch (e) {
      console.warn('Failed to save alert to localStorage', e);
    }
  };

  // Helper for badge colors
  const getCauseStyle = (type) => {
    switch (type) {
      case 'pest':
        return { label: '🦗 Pest Damage', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)' };
      case 'disease':
        return { label: '🍄 Plant Disease', color: '#f87171', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.4)' };
      case 'nutrient':
        return { label: '🟡 Nutrient Deficiency', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.4)' };
      case 'environmental':
        return { label: '☀️ Environmental Stress', color: '#a78bfa', bg: 'rgba(167, 139, 250, 0.15)', border: 'rgba(167, 139, 250, 0.4)' };
      case 'healthy':
        return { label: '🟢 Healthy Foliage', color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.4)' };
      default:
        return { label: '🔍 Inconclusive / Multiple Causes', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)' };
    }
  };

  return (
    <div className="page-container" style={{ paddingBottom: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* ====================================================================
          PAGE HEADER
          ==================================================================== */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div className="page-header-text">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🌱</span> {t('plantHealth.title')}
          </h1>
          <p>
            {t('plantHealth.subtitle')}
          </p>
        </div>

        {/* Field & AI Configuration Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '0.82rem',
            color: 'var(--emerald-300)',
            fontWeight: 700
          }}>
            🌾 {fieldName} &bull; {cropName}
          </div>

          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
            title="Configure Gemini API Key"
          >
            <Key size={14} color="var(--emerald-400)" />
            <span>{t('plantHealth.aiSetup') || 'AI Setup'}</span>
            {showKeyInput ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* ====================================================================
          AI CONFIGURATION DRAWER (Google Gemini Setup)
          ==================================================================== */}
      {showKeyInput && (
        <div 
          className="glass-card" 
          style={{
            padding: '18px 20px',
            background: 'rgba(6, 30, 20, 0.85)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Key size={18} color="var(--emerald-400)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              {t('plantHealth.aiSetupTitle')}
            </h3>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '0 0 12px', lineHeight: 1.5 }}>
            {t('plantHealth.aiSetupDesc')}
          </p>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1 1 280px' }}>
              <input
                type={showKeySecret ? 'text' : 'password'}
                value={keyInputVal}
                onChange={(e) => setKeyInputVal(e.target.value)}
                placeholder="Paste Gemini API Key (AIzaSy...)"
                style={{
                  width: '100%',
                  padding: '9px 40px 9px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid var(--border-medium)',
                  color: '#fff',
                  fontSize: '0.86rem'
                }}
              />
              <button
                type="button"
                onClick={() => setShowKeySecret(!showKeySecret)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer'
                }}
              >
                {showKeySecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <button
              onClick={handleSaveApiKey}
              className="btn btn-primary btn-sm"
              style={{ padding: '9px 16px', fontWeight: 700 }}
            >
              {t('plantHealth.saveKey')}
            </button>

            {userApiKey && (
              <button
                onClick={() => {
                  setKeyInputVal('');
                  setUserApiKey('');
                  sessionStorage.removeItem('agritwin_gemini_key');
                  setKeySaveMessage('Key cleared.');
                  setTimeout(() => setKeySaveMessage(null), 3000);
                }}
                className="btn btn-secondary btn-sm"
                style={{ padding: '9px 14px' }}
              >
                {t('plantHealth.clearKey')}
              </button>
            )}

            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '0.82rem',
                color: 'var(--emerald-400)',
                textDecoration: 'underline',
                marginLeft: '6px'
              }}
            >
              {t('plantHealth.getFreeKey')}
            </a>
          </div>

          {keySaveMessage && (
            <div style={{ color: 'var(--emerald-300)', fontSize: '0.82rem', marginTop: '8px', fontWeight: 600 }}>
              ✓ {keySaveMessage}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          API KEY REQUIRED NOTICE (HONEST & CLEAR)
          ==================================================================== */}
      {analysisError === 'AI_KEY_REQUIRED' && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '2px solid rgba(245, 158, 11, 0.4)',
          borderRadius: 'var(--radius-lg)',
          padding: '18px 22px',
          marginBottom: '20px',
          display: 'flex',
          gap: '14px',
          alignItems: 'flex-start'
        }}>
          <AlertTriangle size={24} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fbbf24', margin: '0 0 6px' }}>
              {t('plantHealth.keyRequiredTitle')}
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#f1f5f9', margin: '0 0 10px', lineHeight: 1.5 }}>
              {t('plantHealth.keyRequiredDesc')}
            </p>
            <ol style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '0 0 12px 20px', padding: 0, lineHeight: 1.6 }}>
              <li>{t('plantHealth.keyStep1')}</li>
              <li>{t('plantHealth.keyStep2')}</li>
              <li>{t('plantHealth.keyStep3')}</li>
            </ol>
            <button
              onClick={() => setShowKeyInput(true)}
              className="btn btn-secondary btn-sm"
              style={{ fontWeight: 700 }}
            >
              {t('plantHealth.openKeyBox')}
            </button>
          </div>
        </div>
      )}

      {/* Generic Error Notice */}
      {analysisError && analysisError !== 'AI_KEY_REQUIRED' && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#fca5a5',
          fontSize: '0.88rem'
        }}>
          <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
          <span>{analysisError}</span>
        </div>
      )}

      {/* ====================================================================
          PHOTO UPLOAD & CAPTURE SECTION
          ==================================================================== */}
      <section aria-labelledby="section-upload">
        <div 
          className="glass-card" 
          style={{
            padding: '24px',
            border: isDragging ? '2px dashed var(--emerald-400)' : '1px solid var(--border-medium)',
            background: isDragging ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-surface-card)',
            transition: 'all 0.2s ease',
            marginBottom: '24px'
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            capture="environment"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          {/* Plant Part Selection Chips */}
          <div style={{ marginBottom: '18px' }}>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
              {t('plantHealth.selectPlantPart')}
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { key: 'partLeaf', defaultVal: 'Leaf / Foliage', icon: '🍃' },
                { key: 'partStem', defaultVal: 'Stem / Branch', icon: '🪵' },
                { key: 'partFruit', defaultVal: 'Fruit / Pod', icon: '🍅' },
                { key: 'partFlower', defaultVal: 'Flower / Bud', icon: '🌸' },
                { key: 'partWhole', defaultVal: 'Whole Plant', icon: '🌱' }
              ].map(item => {
                const isSelected = plantPart === item.defaultVal;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setPlantPart(item.defaultVal)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '999px',
                      background: isSelected ? 'var(--emerald-500)' : 'rgba(255, 255, 255, 0.04)',
                      color: isSelected ? '#000' : '#f1f5f9',
                      border: isSelected ? 'none' : '1px solid var(--border-subtle)',
                      fontSize: '0.82rem',
                      fontWeight: isSelected ? 800 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {item.icon} {t(`plantHealth.${item.key}`)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upload Drop Area or Image Preview */}
          {!imagePreview ? (
            <div style={{
              border: '2px dashed var(--border-medium)',
              borderRadius: 'var(--radius-lg)',
              padding: 'clamp(28px, 6vw, 44px) 20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px'
              }}>
                <ImageIcon size={30} color="var(--emerald-400)" />
              </div>

              <h2 id="section-upload" style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: '0 0 6px' }}>
                {t('plantHealth.uploadHeader')}
              </h2>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 0 20px', lineHeight: 1.4 }}>
                {t('plantHealth.uploadPrompt')}
              </p>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="btn btn-primary"
                  style={{
                    padding: '12px 22px',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Camera size={18} />
                  <span>{t('plantHealth.takePhoto')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary"
                  style={{
                    padding: '12px 22px',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Upload size={18} color="var(--emerald-400)" />
                  <span>{t('plantHealth.chooseGallery')}</span>
                </button>
              </div>

              <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: '16px' }}>
                {t('plantHealth.uploadFormats')}
              </div>
            </div>
          ) : (
            <div>
              {/* Image Preview Box */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                gap: '20px',
                alignItems: 'center'
              }}>
                <div style={{
                  position: 'relative',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  border: '1px solid var(--border-medium)',
                  height: '260px',
                  background: '#041d14'
                }}>
                  <img
                    src={imagePreview}
                    alt="Uploaded plant specimen"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />

                  {/* Remove Button */}
                  <button
                    onClick={handleClearPhoto}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'rgba(0, 0, 0, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                    title={t('plantHealth.removePhoto')}
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Details & Action */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--emerald-400)', fontWeight: 800 }}>
                      {t('plantHealth.selectedSpecimen')}
                    </span>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: '4px 0' }}>
                      {cropName} ({plantPart})
                    </h3>
                    {imageMeta && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        File: {imageMeta.name}<br />
                        Optimized: {imageMeta.dimensions} &bull; {imageMeta.size}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={handleAnalyseImage}
                      disabled={isAnalyzing}
                      className="btn btn-primary"
                      style={{
                        flex: '1 1 180px',
                        padding: '12px 20px',
                        fontWeight: 800,
                        fontSize: '0.94rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <Sparkles size={18} />
                      <span>{isAnalyzing ? t('plantHealth.analysingStatus') : t('plantHealth.analyseButton')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isAnalyzing}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '10px 14px' }}
                    >
                      {t('plantHealth.changePhoto')}
                    </button>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: 0 }}>
                    💡 {t('plantHealth.photoTip')}
                  </p>
                </div>
              </div>

              {/* Analyzing Spinner Banner */}
              {isAnalyzing && (
                <div style={{
                  marginTop: '20px',
                  padding: '20px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    border: '3px solid rgba(52, 211, 153, 0.2)',
                    borderTopColor: 'var(--emerald-400)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    flexShrink: 0
                  }} />
                  <div>
                    <strong style={{ color: '#fff', fontSize: '0.92rem', display: 'block' }}>
                      {t('plantHealth.analysingModelBanner')}
                    </strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {t('plantHealth.analysingModelSubtitle')}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ====================================================================
          DIAGNOSIS RESULTS SECTION (FARMER-FRIENDLY FORMAT)
          ==================================================================== */}
      {diagnosisResult && (
        <section aria-labelledby="section-diagnosis">
          <div style={{
            background: diagnosisResult.isClear ? 'rgba(6, 28, 18, 0.85)' : 'rgba(35, 20, 10, 0.85)',
            border: `2px solid ${diagnosisResult.isClear ? getCauseStyle(diagnosisResult.causeType).border : 'rgba(245, 158, 11, 0.5)'}`,
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(20px, 4vw, 28px)',
            marginBottom: '24px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            
            {/* Header / Category Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800, letterSpacing: '0.06em' }}>
                  {t('plantHealth.diagnosisResultTitle')} &bull; {diagnosisResult.cropIdentified || cropName}
                </span>
                <h2 id="section-diagnosis" style={{ fontSize: 'clamp(1.25rem, 4.5vw, 1.6rem)', fontWeight: 900, color: '#fff', margin: '4px 0 0' }}>
                  {diagnosisResult.isClear ? diagnosisResult.possibleCause : t('plantHealth.photoUnclearTitle')}
                </h2>
              </div>

              {diagnosisResult.isClear && (
                <div style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: getCauseStyle(diagnosisResult.causeType).bg,
                  border: `1px solid ${getCauseStyle(diagnosisResult.causeType).border}`,
                  color: getCauseStyle(diagnosisResult.causeType).color,
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {getCauseStyle(diagnosisResult.causeType).label}
                </div>
              )}
            </div>

            {/* Unclear Photo Alert & Instructions */}
            {!diagnosisResult.isClear && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start'
              }}>
                <AlertTriangle size={22} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ color: '#fbbf24', fontSize: '0.95rem', display: 'block', marginBottom: '4px' }}>
                    {t('plantHealth.clearerPhotoNeeded')}
                  </strong>
                  <p style={{ color: '#f1f5f9', fontSize: '0.88rem', margin: '0 0 8px', lineHeight: 1.4 }}>
                    {diagnosisResult.clarityFeedback || t('plantHealth.photoUnclearTitle')}
                  </p>
                  <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', margin: 0 }}>
                    &rarr; {t('plantHealth.clearerPhotoAdvice')}
                  </p>
                </div>
              </div>
            )}

            {/* Structured 5 Farmer-Friendly Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Field 1: Observation */}
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}>
                <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--emerald-400)', fontWeight: 800, letterSpacing: '0.04em' }}>
                  {t('plantHealth.observationHeading')}
                </span>
                <p style={{ fontSize: '0.94rem', color: '#f1f5f9', margin: '4px 0 0', lineHeight: 1.5, fontWeight: 500 }}>
                  {diagnosisResult.observation}
                </p>
              </div>

              {/* Field 2: Possible Cause */}
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}>
                <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--emerald-400)', fontWeight: 800, letterSpacing: '0.04em' }}>
                  {t('plantHealth.possibleCauseHeading')}
                </span>
                <p style={{ fontSize: '0.94rem', color: '#f1f5f9', margin: '4px 0 0', lineHeight: 1.5, fontWeight: 600 }}>
                  {diagnosisResult.possibleCause}
                </p>
              </div>

              {/* Field 3: Symptoms */}
              {diagnosisResult.symptoms && diagnosisResult.symptoms.length > 0 && (
                <div style={{
                  background: 'rgba(0,0,0,0.3)',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--emerald-400)', fontWeight: 800, letterSpacing: '0.04em' }}>
                    {t('plantHealth.symptomsHeading')}
                  </span>
                  <ul style={{ margin: '6px 0 0 18px', padding: 0, fontSize: '0.9rem', color: '#fca5a5' }}>
                    {diagnosisResult.symptoms.map((sym, idx) => (
                      <li key={idx} style={{ marginBottom: '4px', color: '#f1f5f9' }}>
                        {sym}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Field 4: Suggested Action */}
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                padding: '16px 18px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}>
                <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--emerald-300)', fontWeight: 800, letterSpacing: '0.04em' }}>
                  {t('plantHealth.suggestedActionHeading')}
                </span>
                <p style={{ fontSize: '0.96rem', color: '#fff', margin: '4px 0 0', lineHeight: 1.5, fontWeight: 700 }}>
                  {diagnosisResult.suggestedAction}
                </p>
              </div>

              {/* Field 5: Confidence */}
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '12px 18px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <div>
                  <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 800 }}>
                    {t('plantHealth.confidenceHeading')}
                  </span>
                  <div style={{ fontSize: '0.9rem', color: '#f1f5f9', fontWeight: 600, marginTop: '2px' }}>
                    {diagnosisResult.confidence}
                  </div>
                </div>

                <span style={{
                  fontSize: '0.74rem',
                  color: 'var(--text-dim)',
                  background: 'rgba(255,255,255,0.04)',
                  padding: '3px 8px',
                  borderRadius: '6px'
                }}>
                  {t('plantHealth.evaluatedAt')} {diagnosisResult.analyzedAt}
                </span>
              </div>
            </div>

            {/* Safety Notice Banner */}
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start'
            }}>
              <ShieldAlert size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.78rem', color: '#fca5a5', lineHeight: 1.4 }}>
                <strong>{t('plantHealth.preliminaryAdvisory')}</strong>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', paddingTop: '6px' }}>
              <button
                type="button"
                onClick={handleAddToAlerts}
                disabled={alertSaved}
                className="btn btn-secondary btn-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 700,
                  borderColor: alertSaved ? 'var(--emerald-400)' : 'var(--border-medium)',
                  color: alertSaved ? 'var(--emerald-300)' : '#fff'
                }}
              >
                <Bell size={15} color={alertSaved ? 'var(--emerald-400)' : '#fff'} />
                <span>{alertSaved ? t('plantHealth.addedToAlerts') : t('plantHealth.addToAlerts')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleClearPhoto();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="btn btn-primary btn-sm"
                style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <RotateCcw size={15} />
                <span>{t('plantHealth.diagnoseAnother')}</span>
              </button>
            </div>

          </div>
        </section>
      )}

      {/* ====================================================================
          SESSION DIAGNOSIS HISTORY (In-Memory for current visit)
          ==================================================================== */}
      {sessionHistory.length > 0 && (
        <section aria-labelledby="section-history" style={{ marginTop: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 id="section-history" style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
              {t('plantHealth.recentPhotosHeading')}
            </h3>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
              {t('plantHealth.recentPhotosSubtitle')}
            </span>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
            gap: '14px'
          }}>
            {sessionHistory.map((item) => (
              <div 
                key={item.id}
                className="glass-card" 
                style={{ padding: '14px', display: 'flex', gap: '12px', alignItems: 'center' }}
              >
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  background: '#041d14',
                  flexShrink: 0
                }}>
                  <img
                    src={item.imagePreview}
                    alt={item.crop}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.crop}</span>
                    <span>{item.timestamp}</span>
                  </div>
                  <strong style={{ fontSize: '0.86rem', color: '#fff', display: 'block', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.possibleCause}
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: item.causeType === 'healthy' ? '#34d399' : '#fbbf24' }}>
                    {item.confidence}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ====================================================================
          TRANSPARENCY NOTICE
          ==================================================================== */}
      <div style={{
        marginTop: '32px',
        padding: '14px 18px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <Info size={18} color="var(--emerald-400)" style={{ flexShrink: 0 }} />
        <div>
          <strong>{t('plantHealth.aiTransparencyNotice')}</strong>
        </div>
      </div>

    </div>
  );
}
