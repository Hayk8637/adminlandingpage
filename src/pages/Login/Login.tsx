import React from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase-config';
import './style.css'
const Login: React.FC = () => {
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    const { username, password } = values;
    try {
      await auth.signInWithEmailAndPassword(username, password);
      navigate('/dashboard');
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Произошла ошибка при входе');
      }
    }
  };

  return (
    <div className='log'>
          <Form
      name="login"
      initialValues={{ remember: true }}
      style={{ maxWidth: 500, margin: '0 auto' }}
      onFinish={onFinish}
    >
      <Form.Item
        name="username"
        rules={[{ required: true, message: 'Введите ваш Email!' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="Email" />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: 'Введите ваш пароль!' }]}
      >
        <Input prefix={<LockOutlined />} type="password" placeholder="Пароль" />
      </Form.Item>
      <Form.Item>
        <Button block type="primary" htmlType="submit">
          Войти
        </Button>
      </Form.Item>
    </Form>
    </div>

  );
};

export default Login;
