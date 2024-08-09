import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Table, Space, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { ref, get, update, remove } from 'firebase/database';
import { database } from '../../../../firebase-config';

interface SocialSectionProps {
  title: string;
}

const SocialSection: React.FC<SocialSectionProps> = ({ title }) => {
  const [form] = Form.useForm();
  const [socialLink, setSocialLink] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  // Fetch data from Firebase on component mount
  useEffect(() => {
    const fetchData = async () => {
      const linkRef = ref(database, `LANDING/socialPages`);
      const snapshot = await get(linkRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('Fetched data:', data); // Debug: Log fetched data
        setSocialLink(data[title.toLowerCase()] || null);
      } else {
        console.log('No data available');
      }
    };

    fetchData();
  }, [title]);

  const addLink = async (values: { url: string }) => {
    const linkRef = ref(database, `LANDING/socialPages`);

    try {
      const newData = { [title.toLowerCase()]: values.url };
      await update(linkRef, newData);
      message.success(`${title} link ${editingKey ? 'updated' : 'added'} successfully!`);
      setSocialLink(values.url);
      form.resetFields();
      setEditingKey(null);
      console.log('Link added/updated:', newData); // Debug: Log the new data
    } catch (error) {
      message.error(`Failed to ${editingKey ? 'update' : 'add'} ${title} link.`);
      console.error('Error adding/updating link:', error); // Debug: Log the error
    }
  };

  const editLink = () => {
    setEditingKey(title.toLowerCase());
    form.setFieldsValue({ url: socialLink });
    console.log('Editing link:', socialLink); // Debug: Log the link being edited
  };

  const deleteLink = async () => {
    const linkRef = ref(database, `LANDING/socialPages/${title.toLowerCase()}`);

    try {
      await remove(linkRef);
      message.success(`${title} link deleted successfully!`);
      setSocialLink(null);
      setEditingKey(null);
      console.log('Link deleted'); // Debug: Log the deletion
    } catch (error) {
      message.error(`Failed to delete ${title} link.`);
      console.error('Error deleting link:', error); // Debug: Log the error
    }
  };

  const columns = [
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      render: (text: string) => text || 'No link available',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '100px',
      render: (_: any, record: { url: string }) => {
        return (
          <Space size="middle" style={{ float: 'right' }}>
            <Button type="link" icon={<EditOutlined />} onClick={editLink} />
            <Popconfirm title="Are you sure you want to delete this link?" onConfirm={deleteLink}>
              <Button type="link" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ margin: '20px auto', width: '800px'  }}>
      <h2>{title}</h2>
      {(!socialLink || editingKey) && (
        <Form form={form} layout="inline" onFinish={addLink} style={{ marginBottom: '20px' }}>
          <Form.Item name="url" style={{width: '60%'}} rules={[{ required: true, message: `Please enter the ${title} URL!` }]}>
            <Input placeholder="URL" />
          </Form.Item>
          <Form.Item style={{width: '25%'}}> 
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
              {editingKey ? 'Save' : 'Add'}
            </Button>
          </Form.Item>
        </Form>
      )}
      {socialLink && !editingKey && (
        <Table columns={columns} dataSource={[{ key: title.toLowerCase(), url: socialLink }]} pagination={false} />
      )}
    </div>
  );
};

export default SocialSection;
