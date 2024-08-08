import React, { useContext, useMemo, useEffect, useState } from 'react';
import { HolderOutlined } from '@ant-design/icons';
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
import { Button, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import ServiceIncludeTools from './ServiceIncludeTools/ServiceIncludeTools';
import { database, ref, set } from '../../../firebase-config'; // Import Firebase
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

const columns: TableColumnsType<DataType> = [
  { key: 'sort', align: 'center', width: 80, render: () => <DragHandle /> },
  { title: 'Order', dataIndex: 'order', key: 'order', width: 100 },
  { title: 'Service EN', dataIndex: 'serviceEN', key: 'serviceEN', width: 400 },
  { title: 'Service RU', dataIndex: 'serviceRU', key: 'serviceRU', width: 400 },
  { title: 'Service AM', dataIndex: 'serviceAM', key: 'serviceAM', width: 400 },
];

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

    // Convert objects to arrays
    const enDataArray = Object.values(enData || {}) as ServiceIncludeItem[];
    const amDataArray = Object.values(amData || {}) as ServiceIncludeItem[];
    const ruDataArray = Object.values(ruData || {}) as ServiceIncludeItem[];

    return enDataArray.map((item: ServiceIncludeItem, index: number) => ({
      key: index.toString(),
      order: index + 1,
      serviceEN: item.include || '',
      serviceRU: ruDataArray[index]?.include || '',
      serviceAM: amDataArray[index]?.include || '',
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
        updates[`ServiceInclude/${item.key}`] = {
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
