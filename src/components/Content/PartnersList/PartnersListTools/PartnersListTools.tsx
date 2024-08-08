import React, { useState } from 'react';
import { Button, Modal, Form, Input, message, Row, Col } from 'antd';
import { useLocation } from 'react-router-dom';
import { getDatabase, ref, push, set } from 'firebase/database';
import './style.css';


const PartnersListTools: React.FC = () => {
  const path = useLocation().pathname;
  const location = path.split('/');
  const pageName = location[location.length - 1];

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    try {
      const {
        partnerNameEn, partnerImgUrlEn,
        partnerNameRu, partnerImgUrlRu,
        partnerNameAm, partnerImgUrlAm
      } = values;

      const db = getDatabase();
      const partnersRef = ref(db, 'LANDING/en/partnersList');
      
      const newPartnerRef = push(partnersRef);
      const partnerId = newPartnerRef.key;

      // Set the same key for all languages
      await Promise.all([
        set(ref(db, `LANDING/en/partnersList/${partnerId}`), { name: partnerNameEn, imgUrl: partnerImgUrlEn }),
        set(ref(db, `LANDING/ru/partnersList/${partnerId}`), { name: partnerNameRu, imgUrl: partnerImgUrlRu }),
        set(ref(db, `LANDING/am/partnersList/${partnerId}`), { name: partnerNameAm, imgUrl: partnerImgUrlAm }),
      ]);

      message.success('Partner added successfully!');
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to add partner. Please try again.');
      console.error('Error adding partner:', error);
    }
  };

  return (
    <>
      <div className='partnersListTools'>
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
          width={900}
          style={{ maxWidth: '90%' }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="partnerNameEn"
                  label="Partner Name (EN)"
                  rules={[{ required: true, message: 'Please input the partner name in English!' }]}
                >
                  <Input placeholder="Partner Name (EN)" />
                </Form.Item>
                <Form.Item
                  name="partnerNameRu"
                  label="Partner Name (RU)"
                  rules={[{ required: true, message: 'Please input the partner name in Russian!' }]}
                >
                  <Input placeholder="Partner Name (RU)" />
                </Form.Item>
                <Form.Item
                  name="partnerNameAm"
                  label="Partner Name (AM)"
                  rules={[{ required: true, message: 'Please input the partner name in Armenian!' }]}
                >
                  <Input placeholder="Partner Name (AM)" />
                </Form.Item>
              </Col>
              <Col span={12}>
              <Form.Item
                  name="partnerImgUrlEn"
                  label="Image URL (EN)"
                  rules={[{ required: true, message: 'Please input the image URL for English!' }]}
                >
                  <Input placeholder="Image URL (EN)" />
                </Form.Item>
                <Form.Item
                  name="partnerImgUrlRu"
                  label="Image URL (RU)"
                  rules={[{ required: true, message: 'Please input the image URL for Russian!' }]}
                >
                  <Input placeholder="Image URL (RU)" />
                </Form.Item>
                <Form.Item
                  name="partnerImgUrlAm"
                  label="Image URL (AM)"
                  rules={[{ required: true, message: 'Please input the image URL for Armenian!' }]}>
                  <Input placeholder="Image URL (AM)" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
      </div>
    </>
  );
};

export default PartnersListTools;
