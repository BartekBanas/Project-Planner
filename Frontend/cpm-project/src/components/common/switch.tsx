import React from 'react';
import { Radio, Space } from 'antd';

type SwitcherProps = {
  setMethod: (method: string) => void;
  method: string;
};

function Switcher({ setMethod, method }: SwitcherProps) {
  return (
    <h1>
      <Space>
        <Radio.Group value={method} onChange={(e) => setMethod((e.target as HTMLInputElement).value)}>
          <Radio.Button type="primary" value={'CPM'}>Metoda CPM</Radio.Button>
          <Radio.Button type="primary" value={'Posrednika'}>Metoda Pośrednika</Radio.Button>
        </Radio.Group>
      </Space>
    </h1>
  );
}

export default Switcher;

