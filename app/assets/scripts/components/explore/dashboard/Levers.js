import React, { Component } from 'react';
import { PropTypes as T } from 'prop-types';

import ShadowScrollbars from '../../ShadowScrollbar';

import { environment } from '../../../config';

class Levers extends Component {
  render () {
    return (
      <section className='econtrols__section' id='econtrols-scenarios'>
        <h1 className='econtrols__title'>Scenarios</h1>
        <form className='form econtrols__block' id='#econtrols__scenarios'>
          <div className='econtrols__subblock'>
            <ShadowScrollbars theme='light'>
              <div className='form__group econtrols__item'>
                <label className='form__label'>Electricity demand profile</label>
                <label className='form__option form__option--custom-radio'>
                  <input
                    type='radio'
                    name='form-radio-a'
                    id='form-radio-1'
                    value='Radio 1'
                    checked='checked'
                  />
                  <span className='form__option__ui' />
                  <span className='form__option__text'>Radio 1</span>
                </label>
                <label className='form__option form__option--custom-radio'>
                  <input
                    type='radio'
                    name='form-radio-a'
                    id='form-radio-2'
                    value='Radio 2'
                  />
                  <span className='form__option__ui' />
                  <span className='form__option__text'>Radio 2</span>
                </label>
              </div>
            </ShadowScrollbars>
          </div>
          <div className='form__actions econtrols__actions'>
            <button
              type='submit'
              className='econtrols__submit'
              title='Apply'
              onClick={e => {
                e.preventDefault();
                this.props.updateMap();
              }}
            >
              <span>Apply changes</span>
            </button>
          </div>
        </form>
      </section>
    );
  }
}

if (environment !== 'production') {
  Levers.propTypes = {
    updateMap: T.function
  };
}

export default Levers;
