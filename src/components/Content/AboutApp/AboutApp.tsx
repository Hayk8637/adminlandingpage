import React, { useContext, useMemo, useEffect, useState } from 'react';
import { HolderOutlined, DeleteOutlined } from '@ant-design/icons';
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
import { Button, Table, Popconfirm } from 'antd';
import type { TableColumnsType } from 'antd';
import AboutAppTools from './AboutAppTools/AboutAppTools';
import { database, ref, set, remove } from '../../../firebase-config'; // Import Firebase
import './style.css';

// Define the interface for AboutApp data
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
  const [, setOriginalData] = useState<DataType[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const fetchedData = await fetchAboutAppData();
      setData(fetchedData);
      setOriginalData(fetchedData);
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

  const handleDelete = async (key: string) => {
    try {
      // Remove the item from Firebase
      await Promise.all([
        remove(ref(database, `/LANDING/en/AboutApp/${key}`)),
        remove(ref(database, `/LANDING/am/AboutApp/${key}`)),
        remove(ref(database, `/LANDING/ru/AboutApp/${key}`)),
      ]);
      // Remove the item from local state
      const updatedData = data.filter(item => item.key !== key);
      setData(updatedData);
      await updateOrder(updatedData);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = data.findIndex(item => item.key === active.id);
      const newIndex = data.findIndex(item => item.key === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const updatedData = arrayMove(data, oldIndex, newIndex).map((item, index) => ({
          ...item,
          order: index + 1,
        }));

        setData(updatedData);
        await updateOrder(updatedData);
      }
    }
  };
  const columns: TableColumnsType<DataType> = [
    { key: 'sort', align: 'center', width: 80, fixed:'left' , render: () => <DragHandle /> },
    { title: 'Order', dataIndex: 'order', key: 'order', width: 100 },
    { title: 'Description EN', dataIndex: 'descriptionEN', key: 'descriptionEN', width: 400 },
    { title: 'Description RU', dataIndex: 'descriptionRU', key: 'descriptionRU', width: 400 },
    { title: 'Description AM', dataIndex: 'descriptionAM', key: 'descriptionAM', width: 400 },
    {
      key: 'action',
      title: 'Action',
      fixed: 'right',
      width: '80px',
      render: (_, record) => (
        <Popconfirm
          title="Are you sure you want to delete this item?"
          onConfirm={() => handleDelete(record.key)}
          okText="Yes"
          cancelText="No"
        >
          <Button type="text" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];
  
  return (
    <div className='aboutApp'>
      <AboutAppTools />
      <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={handleDragEnd}>
        <SortableContext items={data.map(item => item.key)} strategy={verticalListSortingStrategy}>
          <Table
            className='aboutAppTable'
            columns={columns}
            dataSource={data}
            rowKey="key"
            components={{ body: { row: Row } }}
            pagination={false}
            scroll={{ y: 'calc(100vh - 240px)' }}
          />
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default AboutApp;