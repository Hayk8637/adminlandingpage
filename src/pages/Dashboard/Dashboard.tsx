import React, { useState } from 'react';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  QuestionCircleOutlined,
  UnorderedListOutlined,
  ApartmentOutlined,
  MailOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import ContentC from '../../components/Content/Content';
import { Button, Layout, Menu, theme } from 'antd';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { auth } from '../../firebase-config'; // Import auth from your Firebase config

const { Header, Sider, Content } = Layout;

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/'); // Navigate to the login page
    } catch (error) {
      console.error('Ошибка выхода из системы:', error);
    }
  };

  const handleMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case '1':
        navigate('/dashboard/user');
        break;
      case '2':
        navigate('/dashboard/faq');
        break;
      case '3':
        navigate('/dashboard/service-include');
        break;
      case '4':
        navigate('/dashboard/about-app');
        break;
      case '5':
        navigate('/dashboard/partners');
        break;
      case '6':
        navigate('/dashboard/became-a-partner');
        break;
      case '7':
        navigate('/dashboard/page-language');
        break;
      default:
        break;
    }
  };
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['1']}
          onClick={handleMenuClick} // Add onClick handler
          items={[
            {
              key: '1',
              icon: <UserOutlined />,
              label: 'User',
            },
            {
              key: '2',
              icon: <QuestionCircleOutlined />,
              label: 'FAQ',
            },
            {
              key: '3',
              icon: <UnorderedListOutlined />,
              label: 'Service Include',
            },
            {
              key: '4',
              icon: <UnorderedListOutlined />,
              label: 'About App',
            },
            {
              key: '5',
              icon: <ApartmentOutlined />,
              label: 'Partner List',
            },
            {
              key: '6',
              icon: <MailOutlined />,
              label: 'Became a Partner',
            },
            {
              key: '7',
              icon: <DatabaseOutlined />,
              label: 'Page Language',
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <Button
            type="text"
            icon={<LogoutOutlined />} // Logout icon
            onClick={handleLogout}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 8 ,
            paddingTop: 0,
            minHeight: 280,
            height: 'calc(100vh - 112px)',
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <ContentC />
        </Content>
      </Layout>
    </Layout>
  );
};

export default App;
