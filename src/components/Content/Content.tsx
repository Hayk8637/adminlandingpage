import React from 'react';
import { useLocation } from 'react-router-dom';
import './style.css';
import Faq from './Faq/Faq';
import AboutApp from './AboutApp/AboutApp';
import ServiceInciude from './ServiceInciude/ServiceInciude';
import PartnersList from './PartnersList/PartnersList';
import PageLanguage from './PageLanguage/PageLanguage';
import SocialPages from './SocialPages/SocialPages';

const Content: React.FC = () => {
  const path = useLocation().pathname.split('/').pop(); 

  return (
    <div className="content">
      {path === 'faq' ? <Faq /> : null}
      {path === 'about-app' ? <AboutApp /> : null}
      {path === 'service-include' ? <ServiceInciude /> : null}
      {path === 'page-language' ? <PageLanguage /> : null}
      {path === 'partners-list' ? <PartnersList /> : null}
      {path === 'social-pages' ? <SocialPages /> : null}
    </div>
  );
};

export default Content;
