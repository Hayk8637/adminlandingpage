import React from 'react';
import { useLocation } from 'react-router-dom';
import './style.css';
import Faq from './Faq/Faq';
import AboutApp from './AboutApp/AboutApp';
import ServiceInciude from './ServiceInciude/ServiceInciude';
import PartnersList from './PartnersList/PartnersList';
import SocialPages from './SocialPages/SocialPages';
import Languages from './Languages/Languages';

const Content: React.FC = () => {
  const path = useLocation().pathname.split('/').pop(); 

  return (
    <div className="content">
      {path === 'faq' ? <Faq /> : null}
      {path === 'about-app' ? <AboutApp /> : null}
      {path === 'service-include' ? <ServiceInciude /> : null}
      {path === 'partners-list' ? <PartnersList /> : null}
      {path === 'social-pages' ? <SocialPages /> : null}
      {path === 'languages' ? <Languages /> : null}

    </div>
  );
};

export default Content;
