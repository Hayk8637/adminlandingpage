import React, { useState } from 'react';
import { Button, Modal, Form, Input, message, Row, Col } from 'antd';
import { useLocation } from 'react-router-dom';
import { getDatabase, ref, push, set } from 'firebase/database';
import './style.css';

const { TextArea } = Input;

const ServiceIncludeTools: React.FC = () => {
  const path = useLocation().pathname;
  const location = path.split('/');
  const pageName = location[location.length - 1];

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    try {
      const { includeItemEn, includeItemRu, includeItemAm } = values;

      const db = getDatabase();
      const serviceIncludeRef = ref(db, 'LANDING/en/ServiceInclude');
      
      const newServiceIncludeRef = push(serviceIncludeRef);
      const serviceIncludeId = newServiceIncludeRef.key;

      await Promise.all([
        set(ref(db, `LANDING/en/ServiceInclude/${serviceIncludeId}`), { include: includeItemEn}),
        set(ref(db, `LANDING/ru/ServiceInclude/${serviceIncludeId}`), { include: includeItemRu}),
        set(ref(db, `LANDING/am/ServiceInclude/${serviceIncludeId}`), { include: includeItemAm}),
      ]);

      message.success('Services include added successfully!');
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to add Services include. Please try again.');
      console.error('Error adding Services include:', error);
    }
  };

  return (
    <>
      <div className='serviceIncludeTools'>
        {pageName}
        <div className='searchAdd'>
          <Button type='primary' className='add' onClick={() => setIsModalVisible(true)}>Add {pageName}</Button>
        </div>
        {/* Modal */}
        <Modal
          title={`Add ${pageName}`}
          open={isModalVisible}
          onOk={() => form.submit()}
          onCancel={() => setIsModalVisible(false)}
          width={'500px'}
          
          style={{ maxWidth: '90%', margin: 'a' }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
          >
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="includeItemEn"
                  label="Service Include EN"
                  rules={[{ required: true, message: 'Please input the service include in English!' }]}
                >
                  <TextArea
                    rows={4}
                    placeholder="Service Include EN"
                  />
                </Form.Item>
                <Form.Item
                  name="includeItemRu"
                  label="Service Include RU"
                  rules={[{ required: true, message: 'Please input the service include in Russian!' }]}
                >
                  <TextArea
                    rows={4}
                    placeholder="Service Include RU"
                  />
                </Form.Item>
                <Form.Item
                  name="includeItemAm"
                  label="Service Include AM"
                  rules={[{ required: true, message: 'Please input the Service Include in Armenian!' }]}
                >
                  <TextArea
                    rows={4}
                    placeholder="Service Include AM"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
      </div>
    </>
  );
};

export default ServiceIncludeTools;
