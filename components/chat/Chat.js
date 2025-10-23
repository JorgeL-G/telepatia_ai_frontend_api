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

  // API functions
  const validateText = useCallback(async (text) => {
    const response = await fetch(
      'http://0.0.0.0:8000/message/validate-process-text',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      }
    );
    return await response.json();
  }, []);

  const generateText = useCallback(async (validateText) => {
    const response = await fetch('http://0.0.0.0:8000/message/generate-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: validateText }),
    });
    return await response.json();
  }, []);

  const validateAudio = useCallback(async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'audio.mp3');

    const response = await fetch(
      'http://0.0.0.0:8000/message/validate-process-audio',
      {
        method: 'POST',
        body: formData, // Don't include Content-Type, browser sets it automatically
      }
    );
    return await response.json();
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

        // Add bot response to chat
        const botMessage = {
          id: generateId(),
          tipo: 'bot',
          contenido: generationResponse.generated_text,
          timestamp: new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        };

        setMessages((prev) => [...prev, botMessage]);
      } else {
        // Show error if validation fails
        alert(`Error: ${validationResponse.message}`);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      alert('Error al enviar el mensaje. Por favor, intenta de nuevo.');
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

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        console.log('Recording stopped, saving audio...');
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
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
    mediaRecorder.stop();
    setIsRecording(false);
    setMediaRecorder(null);
  };

  // Process audio after stopping recording
  const processRecordedAudio = useCallback(
    async (audioBlob) => {
      // Check that audio has content
      if (audioBlob.size === 0) {
        console.log('No audio recorded, canceling processing');
        setIsLoading(false);
        return;
      }

      console.log('Processing recorded audio, size:', audioBlob.size);
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
            contenido: generationResponse.generated_text,
            timestamp: new Date().toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };

          setMessages((prev) => [...prev, botMessage]);
        } else {
          // Show error if validation fails
          alert(`Error: ${validationResponse.message}`);
        }
      } catch (error) {
        console.error('Error processing audio:', error);
        alert('Error al procesar el audio. Por favor, intenta de nuevo.');
      } finally {
        setIsLoading(false);
      }
    },
    [generateId, validateAudio, generateText]
  );

  // Process audio when recording stops
  useEffect(() => {
    if (audioBlob && !isRecording) {
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
          Envía mensajes de texto o graba tu voz
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
                }`}
              >
                <div className={styles.messageContent}>
                  {mensaje.tipo === 'texto' ? (
                    <p className={styles.messageText}>{mensaje.contenido}</p>
                  ) : mensaje.tipo === 'bot' ? (
                    <p className={styles.messageText}>{mensaje.contenido}</p>
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
            >
              📤
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
