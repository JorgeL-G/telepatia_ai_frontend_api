'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './Chat.module.css';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);

  const messagesRef = useRef(null);
  const audioRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Generate unique ID for messages
  const generateId = useCallback(() => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }, []);

  // Format JSON response for better readability
  const formatJsonResponse = useCallback((jsonString) => {
    try {
      // First, try to parse the JSON string
      const parsed = JSON.parse(jsonString);
      
      // If it's an object or array, format it nicely
      if (typeof parsed === 'object' && parsed !== null) {
        return JSON.stringify(parsed, null, 2);
      }
      
      // If it's a primitive value, return as is
      return String(parsed);
    } catch (error) {
      // If it's not valid JSON, check if it looks like JSON
      const trimmed = jsonString.trim();
      
      // Check if it starts and ends with JSON-like characters
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
          (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          // Try to fix common JSON issues
          const fixed = trimmed
            .replace(/'/g, '"')  // Replace single quotes with double quotes
            .replace(/(\w+):/g, '"$1":')  // Add quotes around keys
            .replace(/:\s*([^",{\[\]]+)([,}])/g, ': "$1"$2');  // Add quotes around string values
          
          const parsed = JSON.parse(fixed);
          return JSON.stringify(parsed, null, 2);
        } catch (fixError) {
          console.log('Could not fix JSON, returning original:', fixError);
          return jsonString;
        }
      }
      
      // If it doesn't look like JSON, return as is
      console.log('Response is not valid JSON, returning as is:', error);
      return jsonString;
    }
  }, []);

  // Check if content is JSON formatted
  const isJsonFormatted = useCallback((content) => {
    try {
      JSON.parse(content);
      return true;
    } catch {
      // Check if it looks like JSON even if it's not valid
      const trimmed = content.trim();
      return (trimmed.startsWith('{') && trimmed.endsWith('}')) || 
             (trimmed.startsWith('[') && trimmed.endsWith(']'));
    }
  }, []);

  // API functions
  const validateText = useCallback(async (text) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
    
    try {
      const response = await fetch(
        'http://0.0.0.0:8000/message/validate-process-text',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('La validación tardó demasiado tiempo. Por favor, intenta de nuevo.');
      }
      throw error;
    }
  }, []);

  const generateText = useCallback(async (validateText) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos timeout
    
    try {
      const response = await fetch('http://0.0.0.0:8000/message/generate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: validateText }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('La generación tardó demasiado tiempo. Por favor, intenta de nuevo.');
      }
      throw error;
    }
  }, []);

  const validateAudio = useCallback(async (audioBlob) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 segundos timeout para audio
    
    try {
      const formData = new FormData();
      
      // Determinar la extensión correcta basada en el tipo MIME del blob
      // Formatos soportados por el backend: .wav, .mp3, .flac, .m4a, .ogg
      let extension = 'wav'; // Por defecto, formato más compatible
      if (audioBlob.type.includes('wav')) {
        extension = 'wav';
      } else if (audioBlob.type.includes('mp4')) {
        extension = 'm4a'; // MP4 audio se envía como .m4a
      } else if (audioBlob.type.includes('ogg')) {
        extension = 'ogg';
      } else if (audioBlob.type.includes('mp3')) {
        extension = 'mp3';
      } else if (audioBlob.type.includes('flac')) {
        extension = 'flac';
      } else {
        console.warn('Formato de audio no soportado por el backend:', audioBlob.type);
        extension = 'wav'; // Fallback a WAV
      }
      
      const filename = `audio.${extension}`;
      formData.append('audio_file', audioBlob, filename);

      console.log('Sending audio file:', {
        size: audioBlob.size,
        type: audioBlob.type,
        filename: filename
      });

      const response = await fetch(
        'http://0.0.0.0:8000/message/validate-process-audio',
        {
          method: 'POST',
          body: formData,
          signal: controller.signal,
        }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('El procesamiento de audio tardó demasiado tiempo. Por favor, intenta de nuevo.');
      }
      throw error;
    }
  }, []);

  // Send text message
  const handleSendText = async () => {
    if (!inputText.trim() || isLoading) return;

    const userText = inputText.trim();
    setInputText('');
    setIsLoading(true);

    // Add user message to chat
    const userMessage = {
      id: generateId(),
      tipo: 'texto',
      contenido: userText,
      timestamp: new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      // Call validation API
      const validationResponse = await validateText(userText);

      if (validationResponse.success) {
        // Call generation API
        const generationResponse = await generateText(
          validationResponse.validate_text
        );

        console.log('Raw response from generate-text:', generationResponse);
        console.log('generated_text content:', generationResponse.generated_text);
        console.log('Type of generated_text:', typeof generationResponse.generated_text);

        // Add bot response to chat
        const botMessage = {
          id: generateId(),
          tipo: 'bot',
          contenido: formatJsonResponse(generationResponse.generated_text),
          timestamp: new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };

        setMessages((prev) => [...prev, botMessage]);
      } else {
        // Show error message in chat
        const errorMessage = {
          id: generateId(),
          tipo: 'error',
          contenido: `Error: ${validationResponse.message}`,
          timestamp: new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      // Show error message in chat
      const errorMessage = {
        id: generateId(),
        tipo: 'error',
        contenido: 'Error al enviar el mensaje. Por favor, intenta de nuevo.',
        timestamp: new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key in input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSendText();
    }
  };

  // Start voice recording
  const handleStartRecording = async () => {
    if (isLoading || isRecording) return;

    console.log('Starting recording...');
    
    // Verificar formatos soportados por el navegador
    const supportedFormats = [
      'audio/wav',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp3'
    ];
    
    console.log('Formatos soportados por el navegador:');
    supportedFormats.forEach(format => {
      console.log(`${format}: ${MediaRecorder.isTypeSupported(format)}`);
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      // Configurar opciones del MediaRecorder con formatos soportados por el backend
      // Formatos permitidos: .wav, .mp3, .flac, .m4a, .ogg
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/wav')) {
        options = { mimeType: 'audio/wav' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' }; // .m4a
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        options = { mimeType: 'audio/ogg;codecs=opus' }; // .ogg
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        options = { mimeType: 'audio/ogg' }; // .ogg
      } else if (MediaRecorder.isTypeSupported('audio/mp3')) {
        options = { mimeType: 'audio/mp3' }; // .mp3
      } else {
        // Fallback: usar el formato por defecto del navegador
        console.warn('No se encontró un formato soportado por el backend, usando formato por defecto');
      }
      
      const recorder = new MediaRecorder(stream, options);
      console.log('MediaRecorder configured with:', options);
      
      // Usar el estado para almacenar los chunks
      setAudioChunks([]);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('Audio chunk received:', event.data.size, 'bytes');
          setAudioChunks(prev => [...prev, event.data]);
        }
      };

      recorder.onstop = () => {
        console.log('Recording stopped, processing audio...');
        stream.getTracks().forEach((track) => track.stop());
        
        // Procesar el audio después de un pequeño delay para asegurar que todos los chunks estén disponibles
        setTimeout(() => {
          setAudioChunks(currentChunks => {
            if (currentChunks.length > 0) {
              // Usar el tipo MIME del recorder para crear el blob
              // Fallback a WAV si no hay tipo MIME válido
              const mimeType = recorder.mimeType || 'audio/wav';
              const audioBlob = new Blob(currentChunks, { type: mimeType });
              console.log('Audio blob created:', {
                size: audioBlob.size,
                type: audioBlob.type,
                chunks: currentChunks.length
              });
              setAudioBlob(audioBlob);
            } else {
              console.log('No audio chunks available');
            }
            return currentChunks; // Mantener el estado para evitar re-renders innecesarios
          });
        }, 100);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      console.log('Recording started');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert(
        'No se pudo acceder al micrófono. Por favor, verifica los permisos.'
      );
    }
  };

  // Stop voice recording
  const handleStopRecording = () => {
    console.log('Trying to stop recording...', {
      mediaRecorder,
      isRecording,
    });
    if (!mediaRecorder || !isRecording) return;

    console.log('Stopping recording...');
    
    // Solo detener el recorder, no cambiar el estado aún
    mediaRecorder.stop();
    
    // Cambiar el estado después de un pequeño delay para asegurar que onstop se ejecute
    setTimeout(() => {
      setIsRecording(false);
      setMediaRecorder(null);
    }, 200);
  };

  // Process audio after stopping recording
  const processRecordedAudio = useCallback(
    async (audioBlob) => {
      console.log('processRecordedAudio called with:', {
        size: audioBlob.size,
        type: audioBlob.type,
        isRecording,
        isLoading
      });

      // Check that audio has content
      if (audioBlob.size === 0) {
        console.log('No audio recorded, canceling processing');
        const errorMessage = {
          id: generateId(),
          tipo: 'error',
          contenido: 'No se grabó ningún audio. Por favor, intenta de nuevo.',
          timestamp: new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsLoading(false);
        return;
      }

      console.log('Processing recorded audio, size:', audioBlob.size, 'type:', audioBlob.type);
      setIsLoading(true);

      // Show voice message in chat
      const voiceMessage = {
        id: generateId(),
        tipo: 'voz',
        contenido: URL.createObjectURL(audioBlob),
        timestamp: new Date().toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setMessages((prev) => [...prev, voiceMessage]);

      try {
        // Call audio validation API
        const validationResponse = await validateAudio(audioBlob);

        if (validationResponse.success) {
          // Show message with transcribed text
          const transcriptionMessage = {
            id: generateId(),
            tipo: 'transcripcion',
            contenido: validationResponse.transcribed_text,
            timestamp: new Date().toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };

          setMessages((prev) => [...prev, transcriptionMessage]);

          // Call generation API with simplified text
          const generationResponse = await generateText(
            validationResponse.simplified_text
          );

          // Add bot response to chat
          const botMessage = {
            id: generateId(),
            tipo: 'bot',
            contenido: formatJsonResponse(generationResponse.generated_text),
            timestamp: new Date().toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };

          setMessages((prev) => [...prev, botMessage]);
        } else {
          // Show error message in chat
          const errorMessage = {
            id: generateId(),
            tipo: 'error',
            contenido: `Error: ${validationResponse.message}`,
            timestamp: new Date().toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      } catch (error) {
        console.error('Error processing audio:', error);
        // Show error message in chat
        const errorMessage = {
          id: generateId(),
          tipo: 'error',
          contenido: 'Error al procesar el audio. Por favor, intenta de nuevo.',
          timestamp: new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [generateId, validateAudio, generateText, formatJsonResponse, isRecording, isLoading]
  );

  // Process audio when recording stops
  useEffect(() => {
    if (audioBlob && !isRecording && audioBlob.size > 0) {
      console.log('Processing audio blob:', audioBlob.size, 'bytes');
      processRecordedAudio(audioBlob);
      setAudioBlob(null);
    }
  }, [audioBlob, isRecording, processRecordedAudio]);

  // Play voice message
  const playAudio = (audioUrl) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Chat de Telepatía AI</h2>
        <p className={styles.subtitle}>
          Envía mensajes de texto o graba tu voz. Te responderemos en texto y en un formato JSON.
        </p>
      </div>

      <div className={styles.messagesContainer} ref={messagesRef}>
        {messages.length === 0 ? (
          <div className={styles.emptyMessage}>
            <p>¡Comienza una conversación!</p>
            <p>Escribe un mensaje o graba tu voz</p>
          </div>
        ) : (
          <>
            {messages.map((mensaje) => (
              <div
                key={mensaje.id}
                className={`${styles.message} ${
                  mensaje.tipo === 'bot' ? styles.messageBot : ''
                } ${mensaje.tipo === 'error' ? styles.messageError : ''}`}
              >
                <div className={styles.messageContent}>
                  {mensaje.tipo === 'texto' ? (
                    <p className={styles.messageText}>{mensaje.contenido}</p>
                  ) : mensaje.tipo === 'bot' ? (
                    isJsonFormatted(mensaje.contenido) ? (
                      <pre className={styles.jsonMessage}>{mensaje.contenido}</pre>
                    ) : (
                      <p className={styles.messageText}>{mensaje.contenido}</p>
                    )
                  ) : mensaje.tipo === 'error' ? (
                    <div className={styles.errorMessage}>
                      <span className={styles.errorIcon}>⚠️</span>
                      <p className={styles.messageText}>{mensaje.contenido}</p>
                    </div>
                  ) : mensaje.tipo === 'transcripcion' ? (
                    <div className={styles.transcriptionMessage}>
                      <span className={styles.transcriptionIndicator}>🎤</span>
                      <p className={styles.messageText}>{mensaje.contenido}</p>
                    </div>
                  ) : (
                    <div className={styles.voiceMessage}>
                      <button
                        className={styles.playButton}
                        onClick={() => playAudio(mensaje.contenido)}
                      >
                        🎵 Reproducir
                      </button>
                      <span className={styles.voiceIndicator}>
                        Mensaje de voz
                      </span>
                    </div>
                  )}
                  <span className={styles.timestamp}>{mensaje.timestamp}</span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className={`${styles.message} ${styles.messageBot}`}>
                <div className={styles.messageContent}>
                  <div className={styles.typingIndicator}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className={styles.timestamp}>
                    {new Date().toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className={styles.inputContainer}>
        <div className={styles.inputWrapper}>
          <textarea
            className={styles.inputText}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje aquí..."
            rows="1"
          />

          <div className={styles.buttonsContainer}>
            {!isRecording ? (
              <button
                className={styles.recordButton}
                onClick={handleStartRecording}
                disabled={isLoading}
                type="button"
              >
                🎤
              </button>
            ) : (
              <button
                className={styles.stopButton}
                onClick={handleStopRecording}
                type="button"
              >
                ⏹️
              </button>
            )}

            <button
              className={styles.sendButton}
              onClick={handleSendText}
              disabled={!inputText.trim() || isLoading}
              title={isLoading ? 'Procesando...' : `Enviar mensaje`}
            >
              {isLoading ? '⏳' : '📤'}
            </button>
          </div>
        </div>

        {isRecording && (
          <div className={styles.recordingIndicator}>
            <span className={styles.pulso}></span>
            <span>Grabando... Haz clic en el botón rojo para detener</span>
          </div>
        )}
      </div>

      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
}
