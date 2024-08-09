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
import ServiceIncludeTools from './ServiceIncludeTools/ServiceIncludeTools';
import { database, ref, set, remove } from '../../../firebase-config'; // Import Firebase
import './style.css';

// Define the interface for ServiceInclude data
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
  const [, setOriginalData] = useState<DataType[]>([]);

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
          service: item.serviceEN,
          order: item.order
        };
      });

      const dbRef = ref(database, '/LANDING/en/ServiceInclude');
      
      await set(dbRef, updates);
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
    { title: 'Service EN', dataIndex: 'serviceEN', key: 'serviceEN', width: 400 },
    { title: 'Service RU', dataIndex: 'serviceRU', key: 'serviceRU', width: 400 },
    { title: 'Service AM', dataIndex: 'serviceAM', key: 'serviceAM', width: 400 },
    {
      key: 'action',
      title: 'Action',
      align: 'center',
      fixed: 'right',
      width: 80,
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
    <div className='serviceInclude'>
      <ServiceIncludeTools />
      <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={handleDragEnd}>
        <SortableContext items={data.map(item => item.key)} strategy={verticalListSortingStrategy}>
          <Table
            className='serviceIncludeTable'
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

export default ServiceInclude;
