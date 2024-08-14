import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Table, Space, Modal, message } from 'antd';
import { EditOutlined, DeleteOutlined, CloseOutlined } from '@ant-design/icons';
import { ref, get, set, remove } from 'firebase/database';
import { database } from '../../../firebase-config';
import './style.css';

interface Language {
  key: string;
  en: string;
  ru: string;
  am: string;
}

const Languages: React.FC = () => {
  const [form] = Form.useForm();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [deleteKey, setDeleteKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const enRef = ref(database, 'LANDING/en');
      const ruRef = ref(database, 'LANDING/ru');
      const amRef = ref(database, 'LANDING/am');

      try {
        const [enSnapshot, ruSnapshot, amSnapshot] = await Promise.all([get(enRef), get(ruRef), get(amRef)]);
        const enData = enSnapshot.val() || {};
        const ruData = ruSnapshot.val() || {};
        const amData = amSnapshot.val() || {};

        const languagesArray: Language[] = Object.keys(enData)
          .filter(key => typeof enData[key] === 'string' && typeof ruData[key] === 'string' && typeof amData[key] === 'string')
          .map(key => ({
            key,
            en: enData[key],
            ru: ruData[key],
            am: amData[key],
          }));

        setLanguages(languagesArray);
      } catch (error) {
        console.error('Error fetching data:', error);
        message.error('Failed to fetch data.');
      }
    };

    fetchData();
  }, []);

  const addOrUpdateLanguage = async (values: Language) => {
    const { key, en, ru, am } = values;
    const enRef = ref(database, `LANDING/en/${key}`);
    const ruRef = ref(database, `LANDING/ru/${key}`);
    const amRef = ref(database, `LANDING/am/${key}`);

    if (editingKey) {
      try {
        await Promise.all([set(enRef, en), set(ruRef, ru), set(amRef, am)]);
        message.success('Language updated successfully!');
      } catch (error) {
        message.error('Failed to update language.');
      }
    } else {
      const keyExists = languages.some(lang => lang.key === key);
      if (keyExists) {
        message.error('Key already exists. Please use a different key.');
        return;
      }

      try {
        await Promise.all([set(enRef, en), set(ruRef, ru), set(amRef, am)]);
        message.success('Language added successfully!');
      } catch (error) {
        message.error('Failed to add language.');
      }
    }

    setLanguages(prev => {
      const updatedLanguages = editingKey
        ? prev.map(lang => (lang.key === key ? { key, en, ru, am } : lang))
        : [...prev, { key, en, ru, am }];
      return updatedLanguages;
    });

    form.resetFields();
    setEditingKey(null);
  };

  const editLanguage = (record: Language) => {
    form.setFieldsValue(record);
    setEditingKey(record.key);
  };

  const cancelEdit = () => {
    form.resetFields();
    setEditingKey(null);
  };

  const showDeleteModal = (key: string) => {
    setDeleteKey(key);
    setIsModalVisible(true);
  };

  const handleDelete = async () => {
    if (!deleteKey) return;

    const enRef = ref(database, `LANDING/en/${deleteKey}`);
    const ruRef = ref(database, `LANDING/ru/${deleteKey}`);
    const amRef = ref(database, `LANDING/am/${deleteKey}`);

    try {
      await Promise.all([remove(enRef), remove(ruRef), remove(amRef)]);
      setLanguages(languages.filter(lang => lang.key !== deleteKey));
      message.success('Language deleted successfully!');
    } catch (error) {
      message.error('Failed to delete language.');
    }

    setIsModalVisible(false);
    setDeleteKey(null);
  };

  const handleCancelDelete = () => {
    setIsModalVisible(false);
    setDeleteKey(null);
  };

  const columns = [
    { title: 'Key', dataIndex: 'key', key: 'key' },
    { title: 'English', dataIndex: 'en', key: 'en' },
    { title: 'Russian', dataIndex: 'ru', key: 'ru' },
    { title: 'Armenian', dataIndex: 'am', key: 'am' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Language) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => editLanguage(record)} />
          <Button type="link" icon={<DeleteOutlined />} onClick={() => showDeleteModal(record.key)} />
        </Space>
      ),
    },
  ];

  return (
    <div className='languages'>
      <h2>Manage Languages</h2>
      <Form form={form} layout="inline" onFinish={addOrUpdateLanguage} style={{ marginBottom: '20px' }}>
        <Form.Item name="key" rules={[{ required: true, message: 'Please enter the key!' }]}>
          <Input placeholder="Key" disabled={!!editingKey} />
        </Form.Item>
        <Form.Item name="en" rules={[{ required: true, message: 'Please enter the English translation!' }]}>
          <Input placeholder="English" />
        </Form.Item>
        <Form.Item name="ru" rules={[{ required: true, message: 'Please enter the Russian translation!' }]}>
          <Input placeholder="Russian" />
        </Form.Item>
        <Form.Item name="am" rules={[{ required: true, message: 'Please enter the Armenian translation!' }]}>
          <Input placeholder="Armenian" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            {editingKey ? 'Save' : 'Add'}
          </Button>
        </Form.Item>
        {editingKey && (
          <Form.Item>
            <Button type="primary" onClick={cancelEdit} danger icon={<CloseOutlined />}>
              Cancel
            </Button>
          </Form.Item>
        )}
      </Form>
      <Table columns={columns} dataSource={languages} rowKey="key" pagination={false} />

      <Modal
        title="Confirm Deletion"
        visible={isModalVisible}
        onOk={handleDelete}
        onCancel={handleCancelDelete}
        okText="Delete"
        okButtonProps={{ type: 'primary', danger: true }}
        cancelButtonProps={{ type: 'primary' }}
      >
        <p>Are you sure you want to delete this language?</p>
      </Modal>
    </div>
  );
};

export default Languages;
