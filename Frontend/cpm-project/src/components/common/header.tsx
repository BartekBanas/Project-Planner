import React from 'react';
import { UserOutlined } from '@ant-design/icons';
import { Avatar, Space, Tooltip } from 'antd';
import logo from './logo.svg';

const AppHeader: React.FC = () => {
  return (
    <h1>
      <Space direction="vertical" size={16}>
        <Space wrap size={16}>
          <Avatar size={120} src={<img src={logo} className="App-logo" alt="logo" />} />
          <Tooltip title="Bartłomiej Burda" placement="bottom" color={'#1890ff'}>
            <Avatar size={80} icon={React.createElement(UserOutlined as any)} />
          </Tooltip>
          <Tooltip title="Bartłomiej Banaś" placement="bottom" color={'#1890ff'}>
            <Avatar size={80} icon={React.createElement(UserOutlined as any)} />
          </Tooltip>
          <Tooltip title="Dawid Chmielowiec" placement="bottom" color={'#1890ff'}>
            <Avatar size={80} icon={React.createElement(UserOutlined as any)} />
          </Tooltip>
          <Tooltip title="Damian Błażowski" placement="bottom" color={'#1890ff'}>
            <Avatar size={80} icon={React.createElement(UserOutlined as any)} />
          </Tooltip>
        </Space>
      </Space>
    </h1>
  );
};

export default AppHeader;
