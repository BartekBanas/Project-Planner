import './App.css';
import React from 'react';
import { Button, Layout, Space } from 'antd';
import backg from './images/backg.jpg';

import AppHeader from './components/common/header';
import InformationCard from './components/common/informator';

function App() {
  return (
    <Layout className="App">
      <header className="App-header" style={{
        backgroundImage: `url(${backg})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover'
      }}>
        <AppHeader />
        <InformationCard />
      </header>
    </Layout>
  );
}

export default App;
