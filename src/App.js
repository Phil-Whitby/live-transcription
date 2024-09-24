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
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcription, setTranscription] = useState([]);
  const [fontSize, setFontSize] = useState(18);
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const fetchControllerRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcription]);

  const startTranscription = async () => {
    try {
      if (!apiKey) {
        throw new Error("API key is required");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      fetchControllerRef.current = new AbortController();
      const { signal } = fetchControllerRef.current;

      const response = await fetch('https://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&channels=1&model=general', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'audio/raw',
        },
        body: new ReadableStream({
          start(controller) {
            mediaRecorderRef.current.ondataavailable = (event) => {
              if (event.data.size > 0) {
                controller.enqueue(event.data);
              }
            };
            mediaRecorderRef.current.start(250);
          },
          cancel() {
            mediaRecorderRef.current.stop();
          }
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const decodedChunk = decoder.decode(value, { stream: true });
        const jsonLines = decodedChunk.split('\n').filter(line => line.trim() !== '');
        
        jsonLines.forEach(jsonLine => {
          try {
            const data = JSON.parse(jsonLine);
            const transcript = data.channel?.alternatives[0]?.transcript;
            if (transcript) {
              setTranscription(prev => [...prev, transcript]);
            }
          } catch (error) {
            console.error('Error parsing JSON:', error);
          }
        });
      }

      setIsTranscribing(true);
      setError(null);
    } catch (error) {
      console.error('Error starting transcription:', error);
      setError(`Error starting transcription: ${error.message}`);
      stopTranscription();
    }
  };

  const stopTranscription = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
    }
    setIsTranscribing(false);
  };

  const toggleTranscription = () => {
    if (isTranscribing) {
      stopTranscription();
    } else {
      startTranscription();
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
        onClick={toggleTranscription} 
        disabled={!apiKey}
        style={{ marginBottom: '20px', fontSize: '20px', padding: '15px 30px' }}
      >
        {isTranscribing ? <MicOff style={{ marginRight: '10px' }} /> : <Mic style={{ marginRight: '10px' }} />}
        {isTranscribing ? 'Stop Transcribing' : 'Start Transcribing'}
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