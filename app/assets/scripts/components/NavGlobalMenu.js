import React, { Component } from 'react';
import { PropTypes as T } from 'prop-types';
import { NavLink } from 'react-router-dom';

import ShareOptions from './connected/Share';

import { environment } from '../config';

const isExplorerActive = (match, location) => {
  return location.pathname.match(/^\/(explore|countries)/g);
};

export default class NavGlobalMenu extends Component {
  renderHeaderMenu () {
    return (
      <ul className='global-menu'>
        <li>
          <NavLink
            exact
            to='/'
            title='Visit the home page'
            activeClassName='global-menu__link--active'
            className='global-menu__link global-menu__link--home'
          >
            <span>Home</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to='/countries'
            isActive={isExplorerActive}
            title='Explore scenarios'
            activeClassName='global-menu__link--active'
            className='global-menu__link global-menu__link--explore'
          >
            <span>Explore</span>
          </NavLink>
        </li>
        {/*<li>*/}
          {/*<NavLink*/}
            {/*to='/relevant'*/}
            {/*title='Relevant links and tools'*/}
            {/*activeClassName='global-menu__link--active'*/}
            {/*className='global-menu__link global-menu__link--default'*/}
          {/*>*/}
            {/*<span>Relevant tools</span>*/}
          {/*</NavLink>*/}
        {/*</li>*/}
        {/*<li>*/}
          {/*<a*/}
            {/*href='https://gep-user-guide.readthedocs.io'*/}
            {/*target='_blank'*/}
            {/*title='Visit the documentation'*/}
            {/*rel='noreferrer noopener'*/}
            {/*className='global-menu__link global-menu__link--docs'*/}
          {/*>*/}
            {/*<span>Documentation</span>*/}
          {/*</a>*/}
        {/*</li>*/}
        <li>
          <NavLink
            to='/about'
            title='Learn about this platform'
            activeClassName='global-menu__link--active'
            className='global-menu__link global-menu__link--about'
          >
            <span>About</span>
          </NavLink>
        </li>
        <li>
          <ShareOptions />
        </li>
      </ul>
    );
  }

  renderFooterMenu () {
    return <ul />;
  }

  render () {
    const { forHeader, forFooter } = this.props;
    if (forHeader) return this.renderHeaderMenu();
    if (forFooter) return this.renderFooterMenu();
    return null;
  }
}

if (environment !== 'production') {
  NavGlobalMenu.propTypes = {
    forHeader: T.bool,
    forFooter: T.bool
  };
}
