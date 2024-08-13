import React, { useEffect, useState } from 'react';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  QuestionCircleOutlined,
  UnorderedListOutlined,
  ApartmentOutlined,
  PicRightOutlined,
} from '@ant-design/icons';
import { Button, Layout, Menu, theme } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getAuth, User } from 'firebase/auth'; // Import User type
import ContentC from '../../components/Content/Content';

const { Header, Sider, Content } = Layout;

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null); // Define the type for user state
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const navigate = useNavigate();
  const auth = getAuth(); // Initialize auth here

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (currentUser) {
      setUser(currentUser);
    }
  }, [auth]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/'); 
    } catch (error) {
      console.error('Error signing out:', error);
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
        navigate('/dashboard/partners-list');
        break;
      case '6':
        navigate('/dashboard/social-pages');
        break;
      case '7':
        navigate('/dashboard/languages');
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
          defaultOpenKeys={['sub1']}
          onClick={handleMenuClick}
          items={[
            {
              key: '1',
              icon: <UserOutlined />,
              label: user?.email || 'Guest' // Use optional chaining and fallback
            },
            {
              key: 'sub1',
              icon: <PicRightOutlined />,
              label: 'Landing Page',
              children: [
                {
                  key: '7',
                  icon: <UnorderedListOutlined />,
                  label: 'Languages',
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
                  key: '3',
                  icon: <UnorderedListOutlined />,
                  label: 'Service Include',
                },
                {
                  key: '2',
                  icon: <QuestionCircleOutlined />,
                  label: 'FAQ',
                },
                {
                  key: '6',
                  icon: <QuestionCircleOutlined />,
                  label: 'Social pages',
                },
              ],
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
            icon={<LogoutOutlined />}
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
            padding: 8,
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
