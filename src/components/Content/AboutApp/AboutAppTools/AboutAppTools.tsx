import React, { useState } from 'react';
import { Button, Modal, Form, Input, message, Row, Col } from 'antd';
import { useLocation } from 'react-router-dom';
import { getDatabase, ref, push, set } from 'firebase/database';
import './style.css';

const { TextArea } = Input;

const AboutAppTools: React.FC = () => {
  const path = useLocation().pathname;
  const location = path.split('/');
  const pageName = location[location.length - 1];

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    try {
      const { aboutAppEn, aboutAppRu, aboutAppAm } = values;

      const db = getDatabase();
      const aboutAppRef = ref(db, 'LANDING/en/AboutApp');

      const newAboutAppRef = push(aboutAppRef);
      const aboutAppId = newAboutAppRef.key;

      await Promise.all([
        set(ref(db, `LANDING/en/AboutApp/${aboutAppId}`), { description: aboutAppEn }),
        set(ref(db, `LANDING/ru/AboutApp/${aboutAppId}`), { description: aboutAppRu }),
        set(ref(db, `LANDING/am/AboutApp/${aboutAppId}`), { description: aboutAppAm }),
      ]);

      message.success('About App section added successfully!');
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to add About App section. Please try again.');
      console.error('Error adding About App section:', error);
    }
  };

  return (
    <>
      <div className='aboutAppTools'>
        {pageName}
        <div className='searchAdd'>
          <Button type='primary' className='add' onClick={() => setIsModalVisible(true)}>Add {pageName}</Button>
        </div>
        <Modal
          title={`Add ${pageName}`}
          open={isModalVisible}
          onOk={() => form.submit()}
          onCancel={() => setIsModalVisible(false)}
          width={'500px'}
          zIndex={10000000}  
          style={{ maxWidth: '90%', margin: 'auto' }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
          >
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="aboutAppEn"
                  label="About App EN"
                  rules={[{ required: true, message: 'Please input the About App description in English!' }]}
                >
                  <TextArea
                    rows={4}
                    placeholder="About App EN"
                  />
                </Form.Item>
                <Form.Item
                  name="aboutAppRu"
                  label="About App RU"
                  rules={[{ required: true, message: 'Please input the About App description in Russian!' }]}
                >
                  <TextArea
                    rows={4}
                    placeholder="About App RU"
                  />
                </Form.Item>
                <Form.Item
                  name="aboutAppAm"
                  label="About App AM"
                  rules={[{ required: true, message: 'Please input the About App description in Armenian!' }]}
                >
                  <TextArea
                    rows={4}
                    placeholder="About App AM"
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

export default AboutAppTools;
