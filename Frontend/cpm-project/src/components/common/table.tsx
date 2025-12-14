import { Button, Modal, Drawer, Form, Input, Popconfirm, Table as AntTable } from 'antd';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { isEmpty } from 'lodash';
import axios from 'axios';
import CPMDiagram from './CPMgraf';

const EditableContext = React.createContext<any | null>(null);

const EditableRow: React.FC<any> = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

const EditableCell: React.FC<any> = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<any>(null);
  const form = useContext<any>(EditableContext);
  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);
  const toggleEdit = () => {
    setEditing((editing) => !editing);
    form.setFieldsValue({
      [dataIndex]: record[dataIndex],
    });
  };
  const save = async () => {
    try {
      const values = await form.validateFields();
      toggleEdit();
      handleSave({
        ...record,
        ...values,
      });
    } catch (errInfo) {
      console.log('Zapis nieudany', errInfo);
    }
  };
  let childNode = children;
  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{
          margin: 0,
        }}
        name={dataIndex}
        rules={[
          {
            required: true,
            message: `${title} jest wymagane!`,
          },
        ]}
      >
        <Input ref={inputRef} onPressEnter={save} onBlur={save} />
      </Form.Item>
    ) : (
      <div
        className="editable-cell-value-wrap"
        style={{
          paddingRight: 24,
        }}
        onClick={toggleEdit}
      >
        {children}
      </div>
    );
  }
  return <td {...restProps}>{childNode}</td>;
};

type TableWithInfoProps = {
  eventForm: Record<string, any>;
  method?: any;
};

const TableWithInfo: React.FC<TableWithInfoProps> = ({ eventForm }) => {

  const [dataSource, setDataSource] = useState<any[]>([]);
  const [count, setCount] = useState<number>(0);
  const [open, setOpen] = useState<boolean>(false);
  const [showGraph, setShowGraph] = useState<boolean>(false);

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (isEmpty(eventForm)) {
      return;
    }
    setDataSource((dataSource) => {
      return [...dataSource, { ...eventForm, key: count }];
    });
    setCount(count + 1);
  }, [eventForm]);

  const handleDelete = (key: any) => {
    setDataSource((dataSource) => {
      return [...dataSource.filter((item) => item.key !== key)];
    });
  };
  const defaultColumns: any[] = [
    {
      title: 'Nazwa',
      dataIndex: 'name',
      editable: true,
    },
    {
      title: 'Czas',
      dataIndex: 'time',
      editable: true,
    },
    {
      title: 'Następstwo Zdarzeń',
      colSpan: 2,
      dataIndex: 'futureEvents',
      editable: true,
    },
    {
      title: 'Następstwo Zdarzeń 2',
      colSpan: 0,
      dataIndex: 'futureEvents2',
      editable: true,
    },
    {
      title: 'Opcje',
      dataIndex: 'options',
      render: (_: any, record: any) =>
        dataSource.length >= 1 ? (
          <Popconfirm
            title="Na pewno chcesz usunąć?"
            onConfirm={() => handleDelete(record.key)}
            okText="Tak"
            cancelText="Nie"
          >
            <a>Usuń</a>
          </Popconfirm>
        ) : null,
    },
  ];

  const handleSave = (row: any) => {
    const newData = [...dataSource];
    const index = newData.findIndex((item) => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    });
    setDataSource(newData);
  };
  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };
  const columns = defaultColumns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: any) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave,
      }),
    };
  });

  const [receivedData, setReceivedData] = useState<Record<string, any>>({});
  const [error, setError] = useState<any | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const handleModalOk = () => {
    setModalVisible(false);
    setError(null);
  }

  useEffect(() => {
    console.log('Zmiana danych:', receivedData);
  }, [receivedData]);

  const sendData = (event: React.FormEvent) => {
    event.preventDefault();

    if (isEmpty(dataSource)) {
      return;
    }

    const activities = dataSource.map((activity) => {
      return {
        taskName: activity.name,
        duration: Number(activity.time),
        sequence: [
          Number(activity.futureEvents),
          Number(activity.futureEvents2)
        ]
      };
    });

    console.log(activities)
    axios.post('https://localhost:44363/api/CPM', { activities: activities })
      .then(response => {
        setShowGraph(true);
        console.log(response)
        setReceivedData(response.data)
        console.log(receivedData)
        showDrawer();
      })
      .catch(error => {
        if (error.response) {
          if (error.response.status === 400) {
            setError(error.message);
            setModalVisible(true);
            return;
          } else if (error.response.status === 415) {
            setError(error.message);
            setModalVisible(true);
            return;
          }
        } else if (error.request) {
          setError(error.message);
          setModalVisible(true);
          return;
        } else {
          setError(error.message);
          setModalVisible(true);
          return;
        }
      })
      .finally(() => {
        setShowGraph(true);
      });

  }

  return (
    <h3>
      <div>
        {error !== null && (
          <Modal
            title="Błąd"
            onOk={handleModalOk}
            onCancel={handleModalOk}
            okText="OK"
          >
            <p>{String(error)}</p>
          </Modal>
        )}
        <Button type="primary" onClick={sendData} style={{ marginBottom: 16 }}>
          Zatwierdź
        </Button>
        <Drawer
          title="Graf"
          size="large"
          placement="bottom"
          closable={true}
          onClose={onClose}
          open={open}
        >
          {showGraph && <CPMDiagram receivedData={receivedData} />}
        </Drawer>
        <AntTable
           components={components}
           rowClassName={() => 'editable-row'}
           bordered
           dataSource={dataSource}
           columns={columns}
           size="small"
         />
      </div>
    </h3 >
  );
};
export default TableWithInfo;
