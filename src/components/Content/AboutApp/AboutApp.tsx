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
import AboutAppTools from './AboutAppTools/AboutAppTools';

interface AboutAppItem {
  description?: string;
}

interface DataType {
  key: string;
  order: number;
  descriptionEN: string;
  descriptionRU: string;
  descriptionAM: string;
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

const fetchAboutAppData = async (): Promise<DataType[]> => {
  try {
    const [enRes, amRes, ruRes] = await Promise.all([
      fetch('https://menubyqr-default-rtdb.firebaseio.com/LANDING/en/AboutApp.json'),
      fetch('https://menubyqr-default-rtdb.firebaseio.com/LANDING/am/AboutApp.json'),
      fetch('https://menubyqr-default-rtdb.firebaseio.com/LANDING/ru/AboutApp.json'),
    ]);

    if (!enRes.ok || !amRes.ok || !ruRes.ok) {
      throw new Error('Failed to fetch AboutApp data');
    }

    const [enData, amData, ruData] = await Promise.all([
      enRes.json(),
      amRes.json(),
      ruRes.json(),
    ]);

    // Convert objects to arrays with explicit type assertion
    const enDataArray = Object.entries(enData || {}).map(([key, item]: [string, any]) => ({
      key,
      ...(item as AboutAppItem),
    }));
    const amDataArray = Object.entries(amData || {}).map(([key, item]: [string, any]) => ({
      key,
      ...(item as AboutAppItem),
    }));
    const ruDataArray = Object.entries(ruData || {}).map(([key, item]: [string, any]) => ({
      key,
      ...(item as AboutAppItem),
    }));

    return enDataArray.map((item) => ({
      key: item.key,
      order: enDataArray.findIndex(enItem => enItem.key === item.key) + 1,
      descriptionEN: item.description || '',
      descriptionRU: ruDataArray.find(ruItem => ruItem.key === item.key)?.description || '',
      descriptionAM: amDataArray.find(amItem => amItem.key === item.key)?.description || '',
    }));
  } catch (error) {
    console.error('Error fetching About App data:', error);
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

const AboutApp: React.FC = () => {
  const [data, setData] = useState<DataType[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<DataType | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    const loadData = async () => {
      const fetchedData = await fetchAboutAppData();
      setData(fetchedData);
    };

    loadData();
  }, []);

  const updateOrder = async (newData: DataType[]) => {
    try {
      const updates: Record<string, any> = {};
      newData.forEach((item) => {
        updates[`/LANDING/en/AboutApp/${item.key}`] = {
          key: item.key,
          description: item.descriptionEN,
          order: item.order,
        };
      });

      await set(ref(database), updates);
      console.log('About App data updated successfully.');
    } catch (error) {
      console.error('Error updating AboutApp data:', error);
    }
  };

  const handleDelete = async () => {
    if (!currentItem) return;
    try {
      await Promise.all([
        remove(ref(database, `/LANDING/en/AboutApp/${currentItem.key}`)),
        remove(ref(database, `/LANDING/am/AboutApp/${currentItem.key}`)),
        remove(ref(database, `/LANDING/ru/AboutApp/${currentItem.key}`)),
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

  const handleEdit = (item: DataType) => {
    setCurrentItem(item);
    form.setFieldsValue({
      ...item,
      descriptionEN: item.descriptionEN || '',
      descriptionRU: item.descriptionRU || '',
      descriptionAM: item.descriptionAM || '',
    }); 
    setEditModalVisible(true);
  };

  const handleSave = async (values: DataType) => {
    try {
      await set(ref(database, `/LANDING/en/AboutApp/${values.key}`), {
        description: values.descriptionEN,
        order: values.order,
      });
      await set(ref(database, `/LANDING/am/AboutApp/${values.key}`), {
        description: values.descriptionAM,
        order: values.order,
      });
      await set(ref(database, `/LANDING/ru/AboutApp/${values.key}`), {
        description: values.descriptionRU,
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
    { title: 'Description EN', dataIndex: 'descriptionEN', key: 'descriptionEN', width: 400 },
    { title: 'Description RU', dataIndex: 'descriptionRU', key: 'descriptionRU', width: 400 },
    { title: 'Description AM', dataIndex: 'descriptionAM', key: 'descriptionAM', width: 400 },
    {
      key: 'action',
      title: 'Action',
      align: 'center',
      fixed: 'right',
      width: '100px',
      render: (_, record) => (
        <>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              setCurrentItem(record);
              setDeleteModalVisible(true);
            }}
          />
        </>
      ),
    },
  ];

  return (
    <>
      <AboutAppTools/>
      <DndContext
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={data.map(item => item.key)}
          strategy={verticalListSortingStrategy}
        >
          <Table
            rowKey="key"
            columns={columns}
            dataSource={data}
            pagination={false}
            components={{ body: { row: Row } }}
          />
        </SortableContext>
      </DndContext>

      <Modal
        visible={editModalVisible}
        title="Edit Item"
        onCancel={() => setEditModalVisible(false)}
        cancelButtonProps={{type:'primary' , danger: true}}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
        >
          <Form.Item
            hidden
            label="Order"
            name="order"
            rules={[{ required: true, message: 'Please enter the order!' }]}
          >
            <Input type="number" />
          </Form.Item>
          <Form.Item
            label="Description EN"
            name="descriptionEN"
            rules={[{ required: true, message: 'Please enter the description in English!' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item
            label="Description RU"
            name="descriptionRU"
            rules={[{ required: true, message: 'Please enter the description in Russian!' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item
            label="Description AM"
            name="descriptionAM"
            rules={[{ required: true, message: 'Please enter the description in Armenian!' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        visible={deleteModalVisible}
        title="Confirm Deletion"
        onOk={handleDelete}
        onCancel={() => setDeleteModalVisible(false)}
        cancelButtonProps={{type:'primary'}}
        okButtonProps={{ type: 'primary' , danger: true }}
      >
        <p>Are you sure you want to delete this item?</p>
      </Modal>
    </>
  );
};

export default AboutApp;
