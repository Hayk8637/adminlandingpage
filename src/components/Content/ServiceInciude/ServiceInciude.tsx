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
import { Button, Table, Modal, Input, Form } from 'antd';
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
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<DataType | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const loadData = async () => {
      const fetchedData = await fetchServiceIncludeData();
      setData(fetchedData);
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

  const handleDelete = async () => {
    if (!currentItem) return;
    try {
      await Promise.all([
        remove(ref(database, `/LANDING/en/ServiceInclude/${currentItem.key}`)),
        remove(ref(database, `/LANDING/am/ServiceInclude/${currentItem.key}`)),
        remove(ref(database, `/LANDING/ru/ServiceInclude/${currentItem.key}`)),
      ]);
      const updatedData = data.filter(item => item.key !== currentItem.key);
      setData(updatedData);
      await updateOrder(updatedData);
      setDeleteModalVisible(false);
      setCurrentItem(null);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleDeleteClick = (item: DataType) => {
    setCurrentItem(item);
    setDeleteModalVisible(true);
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
          <Button
            onClick={() => handleEdit(record)}
            icon={<EditOutlined />}
            style={{ marginRight: '8px' }}
            type='link'
          />
          <Button
            danger
            onClick={() => handleDeleteClick(record)}
            icon={<DeleteOutlined />}
            type='link'
          />
        </>
      ),
    },
  ];

  return (
    <>
      <ServiceIncludeTools/>
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
        okButtonProps={{ type: 'primary' }}
        cancelButtonProps={{ type: 'primary', danger: true }}        
        onOk={() => form.submit()}
        okText="Save"
      >
        <Form form={form} onFinish={handleSave} layout="vertical">
          <Form.Item name="serviceEN" label="Service EN" rules={[{ required: true, message: 'Please enter service in English' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="serviceRU" label="Service RU" rules={[{ required: true, message: 'Please enter service in Russian' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="serviceAM" label="Service AM" rules={[{ required: true, message: 'Please enter service in Armenian' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Confirm Deletion"
        visible={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        onOk={handleDelete}
        okButtonProps={{ type: 'primary', danger: true }}
        cancelButtonProps={{ type: 'primary' }}
        okText="Delete"
        cancelText="Cancel"
      >
        <p>Are you sure you want to delete this item?</p>
      </Modal>
    </>
  );
};

export default ServiceInclude;
