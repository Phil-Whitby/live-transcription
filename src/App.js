import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import * as Slider from '@radix-ui/react-slider';

const Button = ({ children, ...props }) => (
  <button
    {...props}
    style={{
      padding: '10px 20px',
      fontSize: '16px',
      cursor: 'pointer',
      backgroundColor: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    {children}
  </button>
);

const Input = ({ ...props }) => (
  <input
    {...props}
    style={{
      padding: '10px',
      fontSize: '16px',
      width: '100%',
      marginBottom: '10px',
      border: '1px solid #ccc',
      borderRadius: '5px',
    }}
  />
);

const Alert = ({ children }) => (
  <div style={{ 
    marginBottom: '20px', 
    padding: '10px', 
    backgroundColor: '#e0f0ff', 
    borderRadius: '5px',
    border: '1px solid #b8daff',
    color: '#004085'
  }}>
    {children}
  </div>
);

const LiveTranscriptionDisplay = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState([]);
  const [fontSize, setFontSize] = useState(18);
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcription]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = sendAudioForTranscription;

      audioChunksRef.current = [];
      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      setError(null);
    } catch (error) {
      console.error('Error starting recording:', error);
      setError(`Error starting recording: ${error.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const sendAudioForTranscription = async () => {
    if (!apiKey) {
      setError("API key is required");
      return;
    }

    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', audioBlob);

    try {
      const response = await fetch('https://api.deepgram.com/v1/listen', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
        },  
        body: formData
      });

      if (!response.ok) {
        const text = await response.text(); // Log full response
        console.error(`HTTP error! status: ${response.status}, response: ${text}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const transcript = data.results?.channels[0]?.alternatives[0]?.transcript;
      
      if (transcript) {
        setTranscription(prev => [...prev, transcript]);
      }
    } catch (error) {
      console.error('Error sending audio for transcription:', error);
      setError(`Error sending audio for transcription: ${error.message}`);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <Input
        type="password"
        placeholder="Enter your Deepgram API key"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />
      
      <Button 
        onClick={toggleRecording} 
        disabled={!apiKey}
        style={{ marginBottom: '20px', fontSize: '20px', padding: '15px 30px' }}
      >
        {isRecording ? <MicOff style={{ marginRight: '10px' }} /> : <Mic style={{ marginRight: '10px' }} />}
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </Button>
      
      {error && <Alert>{error}</Alert>}
      
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <span style={{ marginRight: '10px' }}>Font Size:</span>
        <Slider.Root
          min={12}
          max={36}
          step={2}
          value={[fontSize]}
          onValueChange={(value) => setFontSize(value[0])}
          style={{ width: '200px' }}
        >
          <Slider.Track>
            <Slider.Range />
          </Slider.Track>
          <Slider.Thumb />
        </Slider.Root>
        <span style={{ marginLeft: '10px' }}>{fontSize}px</span>
      </div>
      
      <div
        ref={scrollRef}
        style={{
          width: '100%',
          height: '300px',
          overflowY: 'auto',
          border: '1px solid #ccc',
          borderRadius: '5px',
          padding: '10px',
          fontSize: `${fontSize}px`,
          lineHeight: '1.5',
        }}
      >
        {transcription.map((line, index) => (
          <p key={index} style={{ marginBottom: '10px' }}>{line}</p>
        ))}
      </div>
    </div>
  );
};

export default LiveTranscriptionDisplay;