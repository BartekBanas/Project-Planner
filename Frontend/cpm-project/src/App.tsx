import './App.css';
import React, { useState } from 'react';
import { Layout, notification } from 'antd';
import AppHeader from './components/common/header.tsx';
import InformationCard from './components/common/informator.tsx';
import DataEntryForNewTask from './components/common/dataEntry.tsx';
import TableWithInfo from './components/common/table.tsx';
import Switcher from './components/common/switch.tsx';
import DynamicTable from './components/common/DynamicTable/DynamicTable.tsx';
import axios from 'axios';

axios.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error?.response?.data[0]?.errorMessage) {
    notification.error({
      duration: 7,
      message: 'Error',
      description: error.response.data[0].errorMessage,
    });
  }

  return Promise.reject(error);
});

const App: React.FC = () => {
  const [eventForm, setEventForm] = useState<Record<string, any>>({});
  const [eventFormMP, setEventFormMP] = useState<Record<string, any>>({});
  const [method, setMethod] = useState<string>('Posrednika'); // default is 'CPM'

  return (
    <Layout className="App">
      <header className="App-header">
        <AppHeader />
      </header>
      <Switcher setMethod={setMethod} method={method} />
      <InformationCard method={method} />
      <DataEntryForNewTask setEventForm={setEventForm} setEventFormMP={setEventFormMP} method={method} />
      {method === 'CPM' && <TableWithInfo eventForm={eventForm} />}
      {method === 'Posrednika' && <DynamicTable eventFormMP={eventFormMP} />}
    </Layout>
  );
}

export default App;
