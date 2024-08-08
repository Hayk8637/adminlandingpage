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
import { database, ref, set, remove } from '../../../firebase-config'; // Import Firebase
import './style.css';
import PartnersListTools from './PartnersListTools/PartnersListTools';

// Define the interface for Partner data
interface Partner {
  name: string;
  imgUrl: string;
}

interface DataType {
  key: string;
  order: number;
  nameEN: string;
  imageEN: string;
  nameRU: string;
  imageRU: string;
  nameAM: string;
  imageAM: string;
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

const fetchPartnersData = async (): Promise<DataType[]> => {
  try {
    const [enRes, amRes, ruRes] = await Promise.all([
      fetch('https://menubyqr-default-rtdb.firebaseio.com/LANDING/en/partnersList.json'),
      fetch('https://menubyqr-default-rtdb.firebaseio.com/LANDING/am/partnersList.json'),
      fetch('https://menubyqr-default-rtdb.firebaseio.com/LANDING/ru/partnersList.json'),
    ]);

    if (!enRes.ok || !amRes.ok || !ruRes.ok) {
      throw new Error('Failed to fetch partners data');
    }

    const [enData, amData, ruData] = await Promise.all([
      enRes.json(),
      amRes.json(),
      ruRes.json(),
    ]);

    const enDataArray = Object.entries(enData || {}) as [string, Partner][];
    const amDataArray = Object.entries(amData || {}) as [string, Partner][];
    const ruDataArray = Object.entries(ruData || {}) as [string, Partner][];

    return enDataArray.map(([id, item], index) => ({
      key: id,
      order: index + 1,
      nameEN: item.name || '',
      imageEN: item.imgUrl || '',
      nameRU: ruDataArray.find(i => i[0] === id)?.[1].name || '',
      imageRU: ruDataArray.find(i => i[0] === id)?.[1].imgUrl || '',
      nameAM: amDataArray.find(i => i[0] === id)?.[1].name || '',
      imageAM: amDataArray.find(i => i[0] === id)?.[1].imgUrl || '',
    }));
  } catch (error) {
    console.error('Error fetching partners data:', error);
    return [];
  }
};

const sanitizeKey = (key: string): string => {
  return key.replace(/[/.[#$\][]/g, '_');
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

const PartnersList: React.FC = () => {
  const [data, setData] = useState<DataType[]>([]);
  const [, setOriginalData] = useState<DataType[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const fetchedData = await fetchPartnersData();
      setData(fetchedData);
      setOriginalData(fetchedData);
    };
    loadData();
  }, []);

  const updateOrder = async (newData: DataType[]) => {
    try {
      const updates: Record<string, any> = {};
      newData.forEach((item) => {
        const sanitizedKey = sanitizeKey(item.key);
        updates[`/LANDING/en/partnersList/${sanitizedKey}`] = {
          name: item.nameEN,
          imgUrl: item.imageEN,
          order: item.order,
        };
        updates[`/LANDING/am/partnersList/${sanitizedKey}`] = {
          name: item.nameAM,
          imgUrl: item.imageAM,
          order: item.order,
        };
        updates[`/LANDING/ru/partnersList/${sanitizedKey}`] = {
          name: item.nameRU,
          imgUrl: item.imageRU,
          order: item.order,
        };
      });

      await Promise.all([
        set(ref(database, '/LANDING/en/partnersList'), updates['/LANDING/en/partnersList']),
        set(ref(database, '/LANDING/am/partnersList'), updates['/LANDING/am/partnersList']),
        set(ref(database, '/LANDING/ru/partnersList'), updates['/LANDING/ru/partnersList']),
      ]);

      console.log('Partners data updated successfully.');
    } catch (error) {
      console.error('Error updating partners data:', error);
    }
  };

  const handleDelete = async (key: string) => {
    try {
      const sanitizedKey = sanitizeKey(key);
      await Promise.all([
        remove(ref(database, `/LANDING/en/partnersList/${sanitizedKey}`)),
        remove(ref(database, `/LANDING/am/partnersList/${sanitizedKey}`)),
        remove(ref(database, `/LANDING/ru/partnersList/${sanitizedKey}`)),
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
    { title: 'Name (EN)', dataIndex: 'nameEN', key: 'nameEN', width: 200 },
    { title: 'Image (EN)', dataIndex: 'imageEN', key: 'imageEN', width: 200 },
    { title: 'Name (RU)', dataIndex: 'nameRU', key: 'nameRU', width: 200 },
    { title: 'Image (RU)', dataIndex: 'imageRU', key: 'imageRU', width: 200 },
    { title: 'Name (AM)', dataIndex: 'nameAM', key: 'nameAM', width: 200 },
    { title: 'Image (AM)', dataIndex: 'imageAM', key: 'imageAM', width: 200 },
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
    <div className='partnersList'>
      <PartnersListTools />
      <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={handleDragEnd}>
        <SortableContext items={data.map(item => item.key)} strategy={verticalListSortingStrategy}>
          <Table
            className='partnersListTable'
            columns={columns}
            dataSource={data}
            rowKey="key"
            components={{ body: { row: Row } }}
            pagination={false}
            scroll={{ y: 600 }}
          />
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default PartnersList;
