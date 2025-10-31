import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../utils/firebase';
import Header from '../shared/Header';

function Test() {
  const [message, setMessage] = useState('How are you doing, ChatGPT');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResponse('');

      const callOpenAI = httpsCallable(functions, 'callOpenAI');
      const result = await callOpenAI({ message });
      
      setResponse(result.data.response);
    } catch (err) {
      console.error('Error calling OpenAI function:', err);
      setError(err.message || 'Failed to get response from OpenAI');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div>
        <h1>Test</h1>
      </div>

      <div>
        <h2>OpenAI Test</h2>
        
        <div>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div>
          <button
            onClick={handleSend}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>

        {error && (
          <div>
            {error}
          </div>
        )}

        {response && (
          <div >
            <strong>Response:</strong>
            <div>{response}</div>
          </div>
        )}
      </div>
    </>
  )
}

export default Test
