import React from 'react';
import { Modal, Input, Form } from 'antd';
import { DataType } from '../Faq';

interface FaqEditProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (values: DataType) => void;
  currentItem: DataType | null;
}

const FaqEdit: React.FC<FaqEditProps> = ({ visible, onCancel, onSave, currentItem }) => {
  const [form] = Form.useForm();

  return (
    <Modal
      title="Edit FAQ Item"
      visible={visible}
      onCancel={onCancel}
      okButtonProps={{ type: 'primary' }}
      cancelButtonProps={{ type: 'primary', danger: true }}
      onOk={() => {
        form
          .validateFields()
          .then(values => {
            if (currentItem) {
              onSave({ ...currentItem, ...values });
            }
          })
          .catch(info => {
            console.log('Validate Failed:', info);
          });
      }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={currentItem || {}}
      >
        <Form.Item
          name="questionEN"
          label="Question EN"
          rules={[{ required: true, message: 'Please input the question in English!' }]}
        >
          <Input.TextArea />
        </Form.Item>
        <Form.Item
          name="answerEN"
          label="Answer EN"
          rules={[{ required: true, message: 'Please input the answer in English!' }]}
        >
          <Input.TextArea />
        </Form.Item>
        <Form.Item
          name="questionRU"
          label="Question RU"
          rules={[{ required: true, message: 'Please input the question in Russian!' }]}
        >
          <Input.TextArea />
        </Form.Item>
        <Form.Item
          name="answerRU"
          label="Answer RU"
          rules={[{ required: true, message: 'Please input the answer in Russian!' }]}
        >
          <Input.TextArea />
        </Form.Item>
        <Form.Item
          name="questionAM"
          label="Question AM"
          rules={[{ required: true, message: 'Please input the question in Armenian!' }]}
        >
          <Input.TextArea />
        </Form.Item>
        <Form.Item
          name="answerAM"
          label="Answer AM"
          rules={[{ required: true, message: 'Please input the answer in Armenian!' }]}
        >
          <Input.TextArea />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FaqEdit;
