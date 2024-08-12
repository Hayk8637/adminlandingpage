import React, { useContext, useMemo, useEffect, useState } from 'react';
import { HolderOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button, Table, Popconfirm, Modal, Input, Form } from 'antd';
import type { TableColumnsType } from 'antd';
import { database, ref, set, remove } from '../../../firebase-config';
import './style.css';
import ServiceIncludeTools from './ServiceIncludeTools/ServiceIncludeTools';

interface ServiceIncludeItem {
  include?: string;
}

interface DataType {
  key: string;
  order: number;
  serviceEN: string;
  serviceRU: string;
  serviceAM: string;
}

interface RowContextProps {
  setActivatorNodeRef?: (element: HTMLElement | null) => void;
  listeners?: SyntheticListenerMap;
}

const RowContext = React.createContext<RowContextProps>({});

const DragHandle: React.FC = () => {
  const { setActivatorNodeRef, listeners } = useContext(RowContext);
  return (
    <Button
      type="text"
      size="small"
      icon={<HolderOutlined />}
      style={{ cursor: 'move' }}
      ref={setActivatorNodeRef}
      {...listeners}
    />
  );
};

const fetchServiceIncludeData = async () => {
  try {
    const [enRes, amRes, ruRes] = await Promise.all([
      fetch('https://menubyqr-default-rtdb.firebaseio.com/LANDING/en/ServiceInclude.json'),
      fetch('https://menubyqr-default-rtdb.firebaseio.com/LANDING/am/ServiceInclude.json'),
      fetch('https://menubyqr-default-rtdb.firebaseio.com/LANDING/ru/ServiceInclude.json'),
    ]);

    if (!enRes.ok || !amRes.ok || !ruRes.ok) {
      throw new Error('Failed to fetch ServiceInclude data');
    }

    const [enData, amData, ruData] = await Promise.all([
      enRes.json(),
      amRes.json(),
      ruRes.json(),
    ]);

    const enDataArray = Object.entries(enData || {}) as [string, ServiceIncludeItem][];
    const amDataArray = Object.entries(amData || {}) as [string, ServiceIncludeItem][];
    const ruDataArray = Object.entries(ruData || {}) as [string, ServiceIncludeItem][];

    return enDataArray.map(([id, item], index) => ({
      key: id,
      order: index + 1,
      serviceEN: item.include || '',
      serviceRU: ruDataArray.find(i => i[0] === id)?.[1].include || '',
      serviceAM: amDataArray.find(i => i[0] === id)?.[1].include || '',
    }));
  } catch (error) {
    console.error('Error fetching Service Include data:', error);
    return [];
  }
};

const Row: React.FC<{ 'data-row-key': string } & React.HTMLAttributes<HTMLTableRowElement>> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props['data-row-key'] });

  const style: React.CSSProperties = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    ...(isDragging ? { position: 'relative', zIndex: 9999 } : {}),
  };

  const contextValue = useMemo<RowContextProps>(
    () => ({ setActivatorNodeRef, listeners }),
    [setActivatorNodeRef, listeners],
  );

  return (
    <RowContext.Provider value={contextValue}>
      <tr {...props} ref={setNodeRef} style={style} {...attributes} />
    </RowContext.Provider>
  );
};

const ServiceInclude: React.FC = () => {
  const [data, setData] = useState<DataType[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [, setCurrentItem] = useState<DataType | null>(null);
  const [, setOriginalData] = useState<DataType[]>([]);
  const [form] = Form.useForm();

  useEffect(() => {
    const loadData = async () => {
      const fetchedData = await fetchServiceIncludeData();
      setData(fetchedData);
      setOriginalData(fetchedData);
    };
    loadData();
  }, []);

  const updateOrder = async (newData: DataType[]) => {
    try {
      const updates: Record<string, any> = {};
      newData.forEach((item) => {
        updates[`/LANDING/en/ServiceInclude/${item.key}`] = {
          include: item.serviceEN,
          order: item.order,
        };
        updates[`/LANDING/am/ServiceInclude/${item.key}`] = {
          include: item.serviceAM,
          order: item.order,
        };
        updates[`/LANDING/ru/ServiceInclude/${item.key}`] = {
          include: item.serviceRU,
          order: item.order,
        };
      });

      await set(ref(database, '/LANDING'), updates);
      console.log('Service Include data updated successfully.');
    } catch (error) {
      console.error('Error updating ServiceInclude data:', error);
    }
  };

  const handleDelete = async (key: string) => {
    try {
      await Promise.all([
        remove(ref(database, `/LANDING/en/ServiceInclude/${key}`)),
        remove(ref(database, `/LANDING/am/ServiceInclude/${key}`)),
        remove(ref(database, `/LANDING/ru/ServiceInclude/${key}`)),
      ]);
      const updatedData = data.filter(item => item.key !== key);
      setData(updatedData);
      await updateOrder(updatedData);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleEdit = (item: DataType) => {
    setCurrentItem(item);
    form.setFieldsValue({
      ...item,
      serviceEN: item.serviceEN || '',
      serviceRU: item.serviceRU || '',
      serviceAM: item.serviceAM || '',
    }); 
    setEditModalVisible(true);
  };

  const handleSave = async (values: DataType) => {
    try {
      await set(ref(database, `/LANDING/en/ServiceInclude/${values.key}`), {
        include: values.serviceEN,
        order: values.order,
      });
      await set(ref(database, `/LANDING/am/ServiceInclude/${values.key}`), {
        include: values.serviceAM,
        order: values.order,
      });
      await set(ref(database, `/LANDING/ru/ServiceInclude/${values.key}`), {
        include: values.serviceRU,
        order: values.order,
      });
      
      const updatedDataList = data.map(item =>
        item.key === values.key ? values : item
      );
      setData(updatedDataList);
      setEditModalVisible(false);
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = data.findIndex(item => item.key === active.id);
      const newIndex = data.findIndex(item => item.key === over?.id);

      const updatedData = arrayMove(data, oldIndex, newIndex).map((item, index) => ({
        ...item,
        order: index + 1,
      }));

      setData(updatedData);
      await updateOrder(updatedData);
    }
  };

  const columns: TableColumnsType<DataType> = [
    { key: 'sort', align: 'center', width: 80, fixed: 'left', render: () => <DragHandle /> },
    { title: 'Order', dataIndex: 'order', key: 'order', width: 100 },
    { title: 'Service EN', dataIndex: 'serviceEN', key: 'serviceEN', width: 400 },
    { title: 'Service RU', dataIndex: 'serviceRU', key: 'serviceRU', width: 400 },
    { title: 'Service AM', dataIndex: 'serviceAM', key: 'serviceAM', width: 400 },
    {
      key: 'action',
      title: 'Action',
      align: 'center',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Are you sure to delete this item?"
            onConfirm={() => handleDelete(record.key)}
            okText="Yes"
            cancelText="No"
          >
            <Button style={{ marginLeft: 10 }} icon={<DeleteOutlined />} type="primary" danger />
            </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <>
      <ServiceIncludeTools />
      <DndContext
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={data.map(item => item.key)} strategy={verticalListSortingStrategy}>
          <Table
            rowKey="key"
            columns={columns}
            dataSource={data}
            pagination={false}
            components={{ body: { row: Row } }}
            scroll={{ y: 'calc(100vh - 240px)' }} 
          />
        </SortableContext>
      </DndContext>

      <Modal
        title="Edit Service Include"
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item name="key" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="order" hidden label="Order" rules={[{ required: true, message: 'Please input order!' }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="serviceEN" label="Service EN" rules={[{ required: true, message: 'Please input service in English!' }]}>
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="serviceRU" label="Service RU" rules={[{ required: true, message: 'Please input service in Russian!' }]}>
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="serviceAM" label="Service AM" rules={[{ required: true, message: 'Please input service in Armenian!' }]}>
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ServiceInclude;
