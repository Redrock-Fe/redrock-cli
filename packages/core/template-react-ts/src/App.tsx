import { useState } from 'react';
import reactLogo from './assets/react.svg';
import redrockLogo from './assets/redrock.svg';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
        <a href="https://github.com/Redrock-Fe" target="_blank">
          <img src={redrockLogo} className="logo redrock" alt="Redrock logo" />
        </a>
      </div>
      <h1>Vite + React With Redrock</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <p className="visit the redrock">
        Click on the Redrock logos to visit them
      </p>
    </div>
  );
}

export default App;
