import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Table, Space, Modal, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, CloseOutlined } from '@ant-design/icons';
import { ref, get, update, remove } from 'firebase/database';
import { database } from '../../../../firebase-config';

interface SocialSectionProps {
  title: string;
}

const SocialSection: React.FC<SocialSectionProps> = ({ title }) => {
  const [form] = Form.useForm();
  const [socialLink, setSocialLink] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const linkRef = ref(database, `LANDING/socialPages`);
      const snapshot = await get(linkRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
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
    } catch (error) {
      message.error(`Failed to ${editingKey ? 'update' : 'add'} ${title} link.`);
      console.error('Error adding/updating link:', error);
    }
  };

  const editLink = () => {
    setEditingKey(title.toLowerCase());
    form.setFieldsValue({ url: socialLink });
  };

  const cancelEdit = () => {
    form.resetFields();
    setEditingKey(null);
  };

  const deleteLink = async () => {
    const linkRef = ref(database, `LANDING/socialPages/${title.toLowerCase()}`);

    try {
      await remove(linkRef);
      message.success(`${title} link deleted successfully!`);
      setSocialLink(null);
      setEditingKey(null);
    } catch (error) {
      message.error(`Failed to delete ${title} link.`);
      console.error('Error deleting link:', error);
    }
  };

  const showDeleteModal = () => {
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    setIsModalVisible(false);
    await deleteLink();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
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
            <Button type="link" icon={<DeleteOutlined />} onClick={showDeleteModal} />
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ margin: '20px auto', width: '800px' }}>
      <h2>{title}</h2>
      {(!socialLink || editingKey) && (
        <Form form={form} layout="inline" onFinish={addLink} style={{ marginBottom: '20px' }}>
          <Form.Item name="url" style={{ width: '60%' }} rules={[{ required: true, message: `Please enter the ${title} URL!` }]}>
            <Input placeholder="URL" />
          </Form.Item>
          <Form.Item style={{ width: editingKey ? 'auto' : '25%' }}> 
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
              {editingKey ? 'Save' : 'Add'}
            </Button>
          </Form.Item>
          {editingKey && (
            <Form.Item style={{ width: 'auto' }}>
              <Button type="primary" onClick={cancelEdit} danger icon={<CloseOutlined />}>
                Cancel
              </Button>
            </Form.Item>
          )}
        </Form>
      )}
      {socialLink && !editingKey && (
        <Table columns={columns} dataSource={[{ key: title.toLowerCase(), url: socialLink }]} pagination={false} />
      )}
      <Modal
        title="Confirm Deletion"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText="Delete"
        okButtonProps={{ danger: true }}
        cancelButtonProps={{ type: 'primary' }} // Set cancel button to primary
      >
        <p>Are you sure you want to delete this link?</p>
      </Modal>
    </div>
  );
};

export default SocialSection;
