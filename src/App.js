import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Home from './components/Home';
// import NotFound from './components/NotFound';
import Gamam150 from './components/Gamam150';
import GamamCategory from './components/GamamCategory';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path='/' element={<Home/>} exact/>

          <Route path='/gamam-150' element={<Gamam150/>} exact/>
          
          <Route path='/coding' element={<GamamCategory categoryName="Coding" />} exact />
          <Route path='/system-design' element={<GamamCategory categoryName="SystemDesign" />} exact />
          <Route path='/object-oriented-design' element={<GamamCategory categoryName="ObjectOrientedDesign" />} exact />
          <Route path='/schema-design' element={<GamamCategory categoryName="SchemaDesign" />} exact />
          <Route path='/api-design' element={<GamamCategory categoryName="APIDesign" />} exact />
          <Route path='/behavioral' element={<GamamCategory categoryName="Behavioral" />} exact />
          <Route path='*' element={<NotFound/>}/>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
