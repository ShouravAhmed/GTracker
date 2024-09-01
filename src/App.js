import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './components/Home';
import NotFound from './components/NotFound';
import Gamam150 from './components/Gamam150';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path='/' element={<Home/>} exact/>
          <Route path='/gamam150' element={<Gamam150/>} exact/>
          <Route path='*' element={<NotFound/>}/>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
