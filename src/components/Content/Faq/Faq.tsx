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
import { Button, Table, Popconfirm } from 'antd';
import type { TableColumnsType } from 'antd';
import { database, ref, set, remove } from '../../../firebase-config';
import './style.css';
import FaqTools from './FaqTools/FaqTools';
import FaqEdit from './FaqEdit/FaqEdit'; 

export interface FaqItem {
  question?: string;
  answer?: string;
}

export interface DataType {
  key: string;
  order: number;
  questionEN: string;
  answerEN: string;
  questionRU: string;
  answerRU: string;
  questionAM: string;
  answerAM: string;
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

const fetchFaqData = async (): Promise<DataType[]> => {
  try {
    const [enRes, amRes, ruRes] = await Promise.all([
      fetch('https://menubyqr-default-rtdb.firebaseio.com/LANDING/en/Faq.json'),
      fetch('https://menubyqr-default-rtdb.firebaseio.com/LANDING/am/Faq.json'),
      fetch('https://menubyqr-default-rtdb.firebaseio.com/LANDING/ru/Faq.json'),
    ]);

    if (!enRes.ok || !amRes.ok || !ruRes.ok) {
      throw new Error('Failed to fetch FAQ data');
    }

    const [enData, amData, ruData] = await Promise.all([
      enRes.json(),
      amRes.json(),
      ruRes.json(),
    ]);

    const enDataArray = Object.entries(enData || {}) as [string, FaqItem][];
    const amDataArray = Object.entries(amData || {}) as [string, FaqItem][];
    const ruDataArray = Object.entries(ruData || {}) as [string, FaqItem][];

    return enDataArray.map(([id, item]: [string, FaqItem], index: number) => ({
      key: id,
      order: index + 1,
      questionEN: item.question || '',
      answerEN: item.answer || '',
      questionRU: ruDataArray.find(i => i[0] === id)?.[1].question || '',
      answerRU: ruDataArray.find(i => i[0] === id)?.[1].answer || '',
      questionAM: amDataArray.find(i => i[0] === id)?.[1].question || '',
      answerAM: amDataArray.find(i => i[0] === id)?.[1].answer || '',
    }));
  } catch (error) {
    console.error('Error fetching FAQ data:', error);
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

const Faq: React.FC = () => {
  const [data, setData] = useState<DataType[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<DataType | null>(null);
  const [, setOriginalData] = useState<DataType[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const fetchedData = await fetchFaqData();
      setData(fetchedData);
      setOriginalData(fetchedData);
    };
    loadData();
  }, []);
  const updateOrder = async (newData: DataType[]) => {
    try {
      const updates: Record<string, any> = {};
      newData.forEach((item) => {
        updates[`/LANDING/en/Faq/${item.key}`] = {
          question: item.questionEN,
          answer: item.answerEN,
          order: item.order,
        };
      });

      await set(ref(database), updates);
      console.log('FAQ data updated successfully.');
    } catch (error) {
      console.error('Error updating FAQ data:', error);
    }
  };
  const handleDelete = async (key: string) => {
    try {
      await Promise.all([
        remove(ref(database, `/LANDING/en/Faq/${key}`)),
        remove(ref(database, `/LANDING/am/Faq/${key}`)),
        remove(ref(database, `/LANDING/ru/Faq/${key}`)),
      ]);
      const updatedData: DataType[] = data.filter(item => item.key !== key);
      setData(updatedData);
      await updateOrder(updatedData);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };
  const handleEdit = (item: DataType) => {
    setCurrentItem(item);
    setEditModalVisible(true);
  };
  const handleSave = async (values: DataType) => {
    if (values) {
      try {
        await set(ref(database, `/LANDING/en/Faq/${values.key}`), {
          question: values.questionEN,
          answer: values.answerEN,
          order: values.order,
        });

        await set(ref(database, `/LANDING/am/Faq/${values.key}`), {
          question: values.questionAM,
          answer: values.answerAM,
          order: values.order,
        });

        await set(ref(database, `/LANDING/ru/Faq/${values.key}`), {
          question: values.questionRU,
          answer: values.answerRU,
          order: values.order,
        });

        const updatedData = data.map((item) => (item.key === values.key ? values : item));
        setData(updatedData);
        setEditModalVisible(false);
      } catch (error) {
        console.error('Error saving FAQ data:', error);
      }
    }
  };
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const activeIndex = data.findIndex(item => item.key === active.id);
      const overIndex = data.findIndex(item => item.key === over?.id);

      const newData = arrayMove(data, activeIndex, overIndex).map((item, index) => ({
        ...item,
        order: index + 1,
      }));

      setData(newData);
      await updateOrder(newData);
    }
  };
  const columns: TableColumnsType<DataType> = [
    { key: 'sort', align: 'center', width: 80, fixed: 'left', render: () => <DragHandle /> },
    { title: 'Order', dataIndex: 'order', key: 'order', width: 80, align: 'center' },
    { title: 'Question EN', dataIndex: 'questionEN', key: 'questionEN', width: 400 },
    { title: 'Answer EN', dataIndex: 'answerEN', key: 'answerEN', width: 400 },
    { title: 'Question RU', dataIndex: 'questionRU', key: 'questionRU', width: 400 },
    { title: 'Answer RU', dataIndex: 'answerRU', key: 'answerRU', width: 400 },
    { title: 'Question AM', dataIndex: 'questionAM', key: 'questionAM', width: 400 },
    { title: 'Answer AM', dataIndex: 'answerAM', key: 'answerAM', width: 400 },
    {
      key: 'action',
      fixed: 'right',
      width: '120px',
      title: 'Action',
      render: (_, record) => (
        <>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Are you sure you want to delete this item?"
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
    <div className='faq'>
      <FaqTools />
      <DndContext modifiers={[restrictToVerticalAxis]} onDragEnd={handleDragEnd}>
        <SortableContext items={data.map(item => item.key)} strategy={verticalListSortingStrategy}>
          <Table
            className='faqTable'
            columns={columns}
            dataSource={data}
            rowKey="key"
            components={{ body: { row: Row } }}
            pagination={false}
            scroll={{ y: 'calc(100vh - 240px)' }} /* Matches CSS adjustment */
          />
        </SortableContext>
      </DndContext>
      <FaqEdit
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onSave={handleSave}
        currentItem={currentItem}
      />
    </div>
  );
};

export default Faq;
