import React, { useState } from 'react';
import { Button, Form, Input, Space, Card, Radio } from 'antd';

type DataEntryProps = {
  setEventForm: (v: Record<string, any>) => void;
  setEventFormMP: (v: Record<string, any>) => void;
  method: string;
};

const DataEntryForNewTask: React.FC<DataEntryProps> = ({ setEventForm, setEventFormMP, method }) => {
  const [form] = Form.useForm();

  const onReset = () => {
    form.resetFields();
  };

  const handleFinished = (values: Record<string, any>) => {
    if (method === 'CPM') {
      setEventForm(values);
    } else setEventFormMP(values);
  };

  const [entryType, setEnrtyType] = useState<string>('Dostawca');

  if (method === 'CPM') {
    return (
      <h2>
        <Form form={form} onFinish={handleFinished}>
          <Space direction="vertical">
            <Card title="Nowe zdarzenie" style={{ width: 400 }}>
              <Form.Item name="name" label="Nazwa" rules={[{ required: true }]}>
                <Input id="iName" />
              </Form.Item>
              <Form.Item name="time" label="Czas" rules={[{ required: true }]}>
                <Input id="iTime" type="number" min={0} />
              </Form.Item>
              <Form.Item label="Nastepstwo Zdarzeń" required>
                <Form.Item
                  name="futureEvents"
                  rules={[{ required: true }]}
                  style={{ display: 'inline-block', width: 'calc(50% - 3px)' }}
                >
                  <Input id="iZd1" type="number" min={0} />
                </Form.Item>
                <div style={{ display: 'inline-block', lineHeight: '32px', textAlign: 'center' }}>-</div>
                <Form.Item
                  name="futureEvents2"
                  rules={[{ required: true }]}
                  style={{ display: 'inline-block', width: 'calc(50% - 3px)' }}
                >
                  <Input id="iZd2" type="number" min={0} />
                </Form.Item>
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" style={{ display: 'inline-block', margin: '0 5%' }}>
                  Prześlij
                </Button>
                <Button htmlType="button" onClick={onReset} style={{ display: 'inline-block', margin: '0 5%' }}>
                  Reset
                </Button>
              </Form.Item>
            </Card>
          </Space>
        </Form>
      </h2>
    );
  }
  else return (
    <h2>
      <Form form={form} onFinish={handleFinished}>
        <Space direction="vertical" size={16}>
          <Card title="Dodaj" style={{ width: 400 }}>
            <Form.Item>
              <Radio.Group value={entryType} onChange={(e) => setEnrtyType(e.target.value)}>
                <Radio.Button type="primary" value={'Dostawca'}>Dostawca</Radio.Button>
                <Radio.Button type="primary" value={'Odbiorca'}>Odbiorca</Radio.Button>
              </Radio.Group>
            </Form.Item>
            <Form.Item name={entryType === 'Dostawca' ? 'supply' : 'demand'} label={entryType === 'Dostawca' ? 'Podaż' : 'Popyt'} rules={[{ required: true }]}>
              <Input id={entryType === 'Dostawca' ? 'iSupply' : 'iDemand'} />
            </Form.Item>
            <Form.Item name="cost" label="Cena" rules={[{ required: true }]}>
              <Input id='iCost' type="number" min={0} />
            </Form.Item>
            <Button type="primary" htmlType="submit" style={{ display: 'inline-block', margin: '0 5%' }}>
              Prześlij
            </Button>
            <Button htmlType="button" onClick={onReset} style={{ display: 'inline-block', margin: '0 5%' }}>
              Reset
            </Button>
          </Card>
        </Space>
      </Form>
    </h2>
  );
};

export default DataEntryForNewTask;

