import React from 'react';
import { useLocation } from 'react-router-dom';
import './style.css';
import Faq from './Faq/Faq';
import AboutApp from './AboutApp/AboutApp';
import ServiceInciude from './ServiceInciude/ServiceInciude';
import Partners from './Partners/Partners';

const Content: React.FC = () => {
  const path = useLocation().pathname.split('/').pop(); // Get the last segment of the path

  return (
    <div className="content">
      {path === 'faq' ? <Faq /> : null}
      {path === 'about-app' ? <AboutApp /> : null}
      {path === 'service-include' ? <ServiceInciude /> : null}
      {path === 'partners' ? <Partners /> : null}
    </div>
  );
};

export default Content;
