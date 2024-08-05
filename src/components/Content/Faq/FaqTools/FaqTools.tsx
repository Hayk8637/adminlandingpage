import React, { useState } from 'react';
import { Button, Modal, Form, Input, message, Row, Col } from 'antd';
import { useLocation } from 'react-router-dom';
import { getDatabase, ref, push, set } from 'firebase/database';
import './style.css';

const { TextArea } = Input;

const FaqTools: React.FC = () => {
  const path = useLocation().pathname;
  const location = path.split('/');
  const pageName = location[location.length - 1];

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values: any) => {
    try {
      const { questionEn, answerEn, questionRu, answerRu, questionAm, answerAm } = values;

      const db = getDatabase();
      const faqRef = ref(db, 'LANDING/en/Faq');
      
      const newFaqRef = push(faqRef);
      const faqId = newFaqRef.key;

      // Set the same key for all languages
      await Promise.all([
        set(ref(db, `LANDING/en/Faq/${faqId}`), { question: questionEn, answer: answerEn }),
        set(ref(db, `LANDING/ru/Faq/${faqId}`), { question: questionRu, answer: answerRu }),
        set(ref(db, `LANDING/am/Faq/${faqId}`), { question: questionAm, answer: answerAm }),
      ]);

      message.success('FAQ added successfully!');
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Failed to add FAQ. Please try again.');
      console.error('Error adding FAQ:', error);
    }
  };

  return (
    <>
      <div className='faqTools'>
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
                  name="questionEn"
                  label="Question EN"
                  rules={[{ required: true, message: 'Please input the question in English!' }]}
                >
                  <TextArea
                    rows={4}
                    placeholder="Question EN"
                  />
                </Form.Item>
                <Form.Item
                  name="questionRu"
                  label="Question RU"
                  rules={[{ required: true, message: 'Please input the question in Russian!' }]}
                >
                  <TextArea
                    rows={4}
                    placeholder="Question RU"
                  />
                </Form.Item>
                <Form.Item
                  name="questionAm"
                  label="Question AM"
                  rules={[{ required: true, message: 'Please input the question in Armenian!' }]}
                >
                  <TextArea
                    rows={4}
                    placeholder="Question AM"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="answerEn"
                  label="Answer EN"
                  rules={[{ required: true, message: 'Please input the answer in English!' }]}
                >
                  <TextArea
                    rows={4}
                    placeholder="Answer EN"
                  />
                </Form.Item>
                <Form.Item
                  name="answerRu"
                  label="Answer RU"
                  rules={[{ required: true, message: 'Please input the answer in Russian!' }]}
                >
                  <TextArea
                    rows={4}
                    placeholder="Answer RU"
                  />
                </Form.Item>
                <Form.Item
                  name="answerAm"
                  label="Answer AM"
                  rules={[{ required: true, message: 'Please input the answer in Armenian!' }]}
                >
                  <TextArea
                    rows={4}
                    placeholder="Answer AM"
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

export default FaqTools;
