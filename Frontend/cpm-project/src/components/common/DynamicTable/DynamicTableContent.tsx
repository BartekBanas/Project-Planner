import React from 'react';
import { Empty, Table } from 'antd';
import EditableCell from './EditableCell';
import EditableRow from './EditableRow';

type DynamicTableContentProps = {
  dataSource: any[];
  columns: any[];
  handleCellSave?: (row: any) => void;
};

const DynamicTableContent: React.FC<DynamicTableContentProps> = ({ dataSource, columns, handleCellSave }) => {
  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  } as any;

  const mappedCols = columns.map((col: any) => {
    if (!col.editable) {
      return {
        ...col,
        onCell: (record: any) => ({
          record,
          rowScope: col.rowScope,
        }),
      };
    }

    return {
      ...col,
      onCell: (record: any) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave: handleCellSave,
      }),
    };
  });

  return (
    <div>
      <Table
        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Wypełnij formularz" /> }}
        components={components}
        rowClassName={() => 'editable-row'}
        bordered
        sticky
        dataSource={dataSource}
        columns={mappedCols}
        style={{ maxWidth: '80%', margin: 'auto' }}
        pagination={false}
        scroll={{ x: true }}
      />
    </div>
  );
};

export default DynamicTableContent;

