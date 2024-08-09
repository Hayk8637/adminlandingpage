import React from 'react';
import SocialSection from './SocialSections/SocialSections';

const SocialPages: React.FC = () => {
  return (
    <div className='socialPages'>
      <div className="left">
        <SocialSection title="Instagram" />
        <SocialSection title="Tik-Tok" />
      </div>
      <div className="right">
        <SocialSection title="Support Email" />
      </div>
    </div>
  );
};

export default SocialPages;