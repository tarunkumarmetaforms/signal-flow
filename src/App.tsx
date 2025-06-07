import { useState, useEffect } from 'react'
import './index.css'
import { Button } from './components/ui/button'

function ClockWidget() {
  const [time, setTime] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(Date.now())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return {
      time: date.toLocaleTimeString(),
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      }),
      timestamp: timestamp
    }
  }

  const { time: formattedTime, date: formattedDate } = formatTime(time)

  return (
    <div className="h-full w-full bg-black/80 backdrop-blur-sm rounded-lg border border-white/20 p-4 text-white">
      <div className="text-center">
        <div className="text-2xl font-mono font-bold mb-1">{formattedTime}</div>
        <div className="text-sm opacity-80">{formattedDate}</div>
      </div>
    </div>
  )
}

function MainApp() {
  const [stream, setStream] = useState<MediaStream | null>(null)

  async function startRecording() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  }

  function stopRecording() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Desktop App</h1>
      
      <div className="space-x-2 mb-4">
        <Button variant="outline" className='bg-red-500' onClick={startRecording}>Start Recording</Button>
        <Button variant="outline" className='bg-red-500' onClick={stopRecording}>Stop Recording</Button>
      </div>
      
      {stream && (
        <video 
          autoPlay
          ref={(videoElement) => {
            if (videoElement && stream) {
              videoElement.srcObject = stream;
            }
          }}
        />
      )}
    </div>
  )
}

function App() {
  // Check if this is the widget window by looking at URL hash
  const isWidget = window.location.hash === '#widget'

  return (
    <div className="h-screen w-full">
      {isWidget ? <ClockWidget /> : <MainApp />}
    </div>
  )
}

export default App
