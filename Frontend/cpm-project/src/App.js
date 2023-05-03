import './App.css';
import { useState } from 'react';
import { Layout } from 'antd';
import backg from './images/backg.jpg';
import AppHeader from './components/common/header';
import InformationCard from './components/common/informator';
import DataEntryForNewTask from './components/common/dataEntry';
import TableWithInfo from './components/common/table';
import CPMDiagram from './components/common/CPMgraf';
import Switcher from './components/common/switch';

function App() {
  const [eventForm, setEventForm] = useState({});

  return (
    <Layout className="App">
      <header className="App-header" style={{
        backgroundImage: `url(${backg})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover'
      }}>
        <AppHeader />
        <Switcher />
        <InformationCard />
        <DataEntryForNewTask setEventForm={setEventForm} />
        <TableWithInfo eventForm={eventForm} />
      </header>
    </Layout>
  );
}

export default App;
