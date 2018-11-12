import React from 'react';
import { PropTypes as T } from 'prop-types';
import { Link } from 'react-router-dom';

import NavGlobalMenu from './NavGlobalMenu';

import { environment, appTitle } from '../config';

export default class PageHeader extends React.PureComponent {
  render () {
    return (
      <header className='page__header' role='banner'>
        <div className='inner'>
          <div className='page__headline'>
            <h1 className='page__title'><Link to='/' title='View page'>{appTitle}</Link></h1>
          </div>
          <nav className='page__prime-nav nav' role='navigation'>
            <NavGlobalMenu forHeader />
          </nav>
        </div>
      </header>
    );
  }
}

if (environment !== 'production') {
  PageHeader.propTypes = {
    location: T.object
  };
}
