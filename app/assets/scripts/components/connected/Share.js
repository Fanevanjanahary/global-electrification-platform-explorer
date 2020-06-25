'use strict';
import React from 'react';
import { PropTypes as T } from 'prop-types';
import { withRouter } from 'react-router-dom';
import Clipboard from 'clipboard';
import i18n from "i18next";

import { environment } from '../../config';

import Dropdown from '../Dropdown';
import Breakpoint from '../Breakpoint';

class ShareOptions extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      url: window.location.toString()
    };
  }

  componentDidMount () {
    this.unlisten = this.props.history.listen(() => {
      this.setState({
        url: window.location.toString()
      });
    });
  }
  componentWillUnmount () {
    this.unlisten();
  }

  render () {
    const { url } = this.state;
    return (
      <Breakpoint>
        {({ largeUp }) => (
          <Dropdown
            className='share-menu'
            triggerClassName='global-menu__link global-menu__link--share'
            triggerActiveClassName='button--active'
            triggerText='Share'
            triggerTitle={i18n.t('Toggle share options')}
            direction={largeUp ? 'up' : 'down'}
            alignment={largeUp ? 'left' : 'right'}
          >
            <h6 className='drop__title'>Share</h6>
            <ul className='drop__menu drop__menu--iconified'>
              <li>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${url}`}
                  className='drop__menu-item share-facebook'
                  title={i18n.t('Share on') + ' Facebook'}
                  target='_blank'
                >
                  <span>Facebook</span>
                </a>
              </li>
              <li>
                <a
                  href={`https://twitter.com/intent/tweet?url=${url}`}
                  className='drop__menu-item share-twitter'
                  title={i18n.t('Share on')+' Twitter'}
                  target='_blank'
                >
                  <span>Twitter</span>
                </a>
              </li>
            </ul>
            <div className='drop__inset'>
              <CopyField value={url} />
            </div>
          </Dropdown>
        )}
      </Breakpoint>
    );
  }
}

export default withRouter(ShareOptions);

if (environment !== 'production') {
  ShareOptions.propTypes = {
    history: T.object
  };
}

// This needs to be a separate class because of the mount and unmount methods.
// The dropdown unmounts when closed and the refs would be lost otherwise.
class CopyField extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      copiedMsg: false
    };
    this.triggerEl = null;
    this.copiedMsgTimeout = null;
  }

  componentDidMount () {
    this.clipboard = new Clipboard(this.triggerEl, {
      text: () => this.props.value
    });

    this.clipboard.on('success', e => {
      this.setState({ copiedMsg: true });
      this.copiedMsgTimeout = setTimeout(() => {
        this.setState({ copiedMsg: false });
      }, 2000);
    });
  }

  componentWillUnmount () {
    this.clipboard.destroy();
    if (this.copiedMsgTimeout) clearTimeout(this.copiedMsgTimeout);
  }

  render () {
    const val = this.state.copiedMsg ? 'Copied!' : this.props.value;
    return (
      <form action='#' className='form'>
        <div className='form__input-group'>
          <input
            id='site-url'
            name='site-url'
            className='form__control'
            type='text'
            readOnly
            value={val}
          />
          <button
            type='button'
            className='share-copy'
            title='Copy to clipboard'
            ref={el => {
              this.triggerEl = el;
            }}
          >
            <span>Copy to clipboard</span>
          </button>
        </div>
      </form>
    );
  }
}

if (environment !== 'production') {
  CopyField.propTypes = {
    value: T.string
  };
}
