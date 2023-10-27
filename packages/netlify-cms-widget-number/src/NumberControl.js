import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { debounce } from 'lodash';

const ValidationErrorTypes = {
  PRESENCE: 'PRESENCE',
  PATTERN: 'PATTERN',
  RANGE: 'RANGE',
  CUSTOM: 'CUSTOM',
};

export function validateMinMax(value, min, max, field, t) {
  let error;

  switch (true) {
    case value !== '' && min !== false && max !== false && (value < min || value > max):
      error = {
        type: ValidationErrorTypes.RANGE,
        message: t('editor.editorControlPane.widget.range', {
          fieldLabel: field.get('label', field.get('name')),
          minValue: min,
          maxValue: max,
        }),
      };
      break;
    case value !== '' && min !== false && value < min:
      error = {
        type: ValidationErrorTypes.RANGE,
        message: t('editor.editorControlPane.widget.min', {
          fieldLabel: field.get('label', field.get('name')),
          minValue: min,
        }),
      };
      break;
    case value !== '' && max !== false && value > max:
      error = {
        type: ValidationErrorTypes.RANGE,
        message: t('editor.editorControlPane.widget.max', {
          fieldLabel: field.get('label', field.get('name')),
          maxValue: max,
        }),
      };
      break;
    default:
      error = null;
      break;
  }

  return error;
}

export default class NumberControl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.value || '',
    };
  }

  static propTypes = {
    field: ImmutablePropTypes.map.isRequired,
    onChange: PropTypes.func.isRequired,
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
    value: PropTypes.node,
    forID: PropTypes.string,
    valueType: PropTypes.string,
    step: PropTypes.number,
    min: PropTypes.number,
    max: PropTypes.number,
    t: PropTypes.func.isRequired,
  };

  static defaultProps = {
    value: '',
  };

  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value) {
      this.setState({ value: this.props.value });
    }
  }

  handleChange = e => {
    const valueType = this.props.field.get('value_type');
    const value = valueType === 'float' ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
    if (this.state.value !== value) {
      this.handleNumberChange(value);
    }
    this.setState({ value });
  };

  handleNumberChange = debounce(value => {
    const { onChange } = this.props;
    onChange(!isNaN(value) ? value : '');
  }, 250);

  isValid = () => {
    const { field, value, t } = this.props;
    const hasPattern = !!field.get('pattern', false);
    const min = field.get('min', false);
    const max = field.get('max', false);

    // Pattern overrides min/max logic always:
    if (hasPattern) {
      return true;
    }

    const error = validateMinMax(value, min, max, field, t);
    return error ? { error } : true;
  };

  render() {
    const { field, classNameWrapper, forID, setActiveStyle, setInactiveStyle } = this.props;
    const min = field.get('min', '');
    const max = field.get('max', '');
    const step = field.get('step', field.get('value_type') === 'int' ? 1 : '');
    return (
      <input
        type="number"
        id={forID}
        className={classNameWrapper}
        onFocus={setActiveStyle}
        onBlur={setInactiveStyle}
        value={this.state.value || (this.state.value === 0 ? this.state.value : '')}
        step={step}
        min={min}
        max={max}
        onChange={this.handleChange}
      />
    );
  }
}
