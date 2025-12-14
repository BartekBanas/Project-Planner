import React from 'react';
import { Space, Card } from 'antd';

type InformationCardProps = {
  method: string;
};

const InformationCard: React.FC<InformationCardProps> = ({ method }) => {
  return (
    <Card
      title={method === 'CPM' ? 'Metoda CPM' : 'Metoda Pośrednika'}
      headStyle={{ textAlign: 'center' }}
      style={{ width: 400, margin: '0 auto' }}
    >
      <Space direction="vertical" size={8}>
        <p>
          Program umożliwiający rozwiązywanie zadań z metody{' '}
          {method === 'CPM' ? 'CPM w formie grafu' : 'pośrednika'}
        </p>
      </Space>
    </Card>
  );
};

export default InformationCard;
