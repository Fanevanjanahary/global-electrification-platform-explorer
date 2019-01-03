import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { PropTypes as T } from 'prop-types';
import c from 'classnames';
import clone from 'lodash.clone';
import pull from 'lodash.pull';

import { environment } from '../config';
import { makeZeroFilledArray, cloneArrayAndChangeCell } from '../utils';
import { wrapApiResult, getFromState } from '../redux/utils';
import { fetchModel, fetchScenario, fetchCountry } from '../redux/actions';

import App from './App';
import Dashboard from '../components/explore/dashboard';
import Map from '../components/explore/Map';
import Summary from '../components/explore/Summary';
import DeviceMessage from '../components/DeviceMessage';
import {
  showGlobalLoading,
  hideGlobalLoading
} from '../components/GlobalLoading';

class Explore extends Component {
  constructor (props) {
    super(props);

    this.updateScenario = this.updateScenario.bind(this);
    this.handleFilterChange = this.handleFilterChange.bind(this);
    this.handleLeverChange = this.handleLeverChange.bind(this);
    this.handleLayerChange = this.handleLayerChange.bind(this);

    this.state = {
      dashboardChangedAt: Date.now(),
      filtersState: [],
      leversState: [],
      layersState: []
    };
  }

  async componentDidMount () {
    await this.fetchModelData();
    this.updateScenario({
      filters: this.state.filtersState,
      levers: this.state.leversState
    });
  }

  componentDidUpdate (prevProps) {
    if (prevProps.match.params.modelId !== this.props.match.params.modelId) {
      this.fetchModelData();
    }
  }

  handleLeverChange (leverIdx, optionIdx) {
    const leversState = cloneArrayAndChangeCell(
      this.state.leversState,
      leverIdx,
      optionIdx
    );
    this.setState({ leversState });
  }

  handleFilterChange (filterIdx, value) {
    const filter = this.props.model.getData().filters[filterIdx];
    const filtersState = clone(this.state.filtersState);

    if (filter.type === 'range') {
      let newRange = clone(value);

      // Ensure that range values are between min and max
      const { min, max } = filter.range;
      if (newRange.min <= min) newRange.min = min;

      // Compare using Math.floor because the input uses step=1 and returns a lower integer value when max is float.
      if (newRange.max >= Math.floor(max)) newRange.max = max;

      filtersState[filterIdx] = newRange;
    } else {
      // Get current selected options
      let selectedOptions = clone(this.state.filtersState[filterIdx]);

      // Toggle filter value from select options
      if (selectedOptions.indexOf(value) > -1) {
        pull(selectedOptions, value);
      } else {
        selectedOptions.push(value);
      }

      // Do not allow less than one option selected
      if (selectedOptions.length > 0) {
        filtersState[filterIdx] = selectedOptions;
      }
    }

    this.setState({ filtersState });
  }

  handleLayerChange (leverIdx) {
    const active = this.state.layersState[leverIdx];
    const layersState = cloneArrayAndChangeCell(
      this.state.layersState,
      leverIdx,
      !active
    );

    this.setState({ layersState });
  }

  async fetchModelData () {
    showGlobalLoading();
    await this.props.fetchModel(this.props.match.params.modelId);
    const { hasError, getData } = this.props.model;
    if (!hasError()) {
      const model = getData();

      // Fetch country data to render titles
      this.props.fetchCountry(model.country);

      // Initialize levers and filters
      this.setState({
        leversState: makeZeroFilledArray(model.levers.length),
        filtersState: model.filters
          ? model.filters.map(filter => {
            if (filter.type === 'range') {
              return filter.range;
            } else return filter.options.map(option => option.value);
          })
          : [],
        layersState: model.map.layers.map(() => false)
      });
    }

    hideGlobalLoading();
  }

  async updateScenario (options) {
    showGlobalLoading();
    const model = this.props.model.getData();
    const levers = options.levers || this.state.leversState;
    const filters = options.filters || this.state.filtersState;
    const selectedFilters = [];

    // Compare filters to model defaults to identify actionable filters
    for (let i = 0; i < model.filters.length; i++) {
      const { key } = model.filters[i];
      const type = model.filters[i].type;

      if (type === 'range') {
        const defaultRange = model.filters[i].range;
        const { min, max } = filters[i];
        if (min !== defaultRange.min) {
          selectedFilters.push({ key, min });
        }
        if (max !== defaultRange.max) {
          selectedFilters.push({ key, max });
        }
      } else {
        const defaultOptions = model.filters[i].options;

        if (defaultOptions.length !== filters[i].length) {
          selectedFilters.push({ key, options: filters[i] });
        }
      }
    }

    // Update state if levers are changed
    this.setState({ leversState: levers, filtersState: filters });

    await this.props.fetchScenario(
      `${model.id}-${levers.join('_')}`,
      selectedFilters
    );
    hideGlobalLoading();
  }

  render () {
    const { isReady, getData } = this.props.model;
    const model = getData();

    /**
     * Get country data. If there is only one model for this country, disable "Change Model" button.
     */
    let countryName = '';
    let hasMultipleModels = false;
    if (this.props.country.isReady()) {
      const { name, models } = this.props.country.getData();
      countryName = name;
      hasMultipleModels = models.length > 1;
    }

    return (
      <App pageTitle='Explore'>
        {isReady() && (
          <section className='inpage inpage--single inpage--horizontal inpage--explore'>
            <header className='inpage__header'>
              <div className='inpage__subheader'>
                <div className='inpage__headline'>
                  <h1 className='inpage__title'>
                    <span className='visually-hidden'>Explore</span>
                    {countryName}
                  </h1>
                  <p className='inpage__subtitle'>{model.name}</p>
                </div>
                <div className='inpage__hactions'>
                  <Link
                    to={`/countries/${model.country}/models`}
                    className={c('exp-change-button', {
                      disabled: !hasMultipleModels
                    })}
                    title='Change model'
                  >
                    <span>Change</span>
                  </Link>
                </div>
              </div>

              <Dashboard
                model={model}
                updateScenario={this.updateScenario}
                handleLeverChange={this.handleLeverChange}
                handleFilterChange={this.handleFilterChange}
                leversState={this.state.leversState}
                filtersState={this.state.filtersState}
              />
            </header>
            <div className='inpage__body'>
              <Map
                scenario={this.props.scenario}
                externalLayers={model.map.layers}
                layersState={this.state.layersState}
                handleLayerChange={this.handleLayerChange}
              />
              <Summary
                country={this.props.country}
                model={this.props.model}
                scenario={this.props.scenario}
              />
            </div>
            <DeviceMessage />
          </section>
        )}
      </App>
    );
  }
}

if (environment !== 'production') {
  Explore.propTypes = {
    fetchModel: T.func,
    fetchScenario: T.func,
    fetchCountry: T.func,
    match: T.object,
    model: T.object,
    country: T.object,
    scenario: T.object
  };
}

function mapStateToProps (state, props) {
  const model = wrapApiResult(
    getFromState(state.individualModels, props.match.params.modelId)
  );

  return {
    model,
    country: wrapApiResult(
      getFromState(state.individualCountries, model.getData().country)
    ),
    scenario: wrapApiResult(state.scenario)
  };
}

function dispatcher (dispatch) {
  return {
    fetchModel: (...args) => dispatch(fetchModel(...args)),
    fetchScenario: (...args) => dispatch(fetchScenario(...args)),
    fetchCountry: (...args) => dispatch(fetchCountry(...args))
  };
}

export default connect(
  mapStateToProps,
  dispatcher
)(Explore);
