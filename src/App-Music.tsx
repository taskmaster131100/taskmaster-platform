import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MusicHub from './components/music/MusicHub';

function App() {
  return (
    <Routes>
      <Route path="/*" element={<MusicHub />} />
    </Routes>
  );
}

export default App;
