import React from 'react';
import PropTypes from 'prop-types';
import Textarea from 'react-textarea-autosize';
import { debounce } from 'lodash';

export default class TextControl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.value || '',
    };
  }

  static propTypes = {
    onChange: PropTypes.func.isRequired,
    forID: PropTypes.string,
    value: PropTypes.node,
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
  };

  static defaultProps = {
    value: '',
  };

  /**
   * Always update to ensure `react-textarea-autosize` properly calculates
   * height. Certain situations, such as this widget being nested in a list
   * item that gets rearranged, can leave the textarea in a minimal height
   * state. Always updating this particular widget should generally be low cost,
   * but this should be optimized in the future.
   */
  shouldComponentUpdate() {
    return true;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value) {
      this.setState({ value: this.props.value });
    }
  }

  handleChange = e => {
    this._sel = e.target.selectionStart;
    const { value } = e.target;
    if (this.state.value !== value) {
      this.handleStringChange(value);
    }
    this.setState({ value });
  };

  /**
   * When the document value changes, serialize from Slate's AST back to
   * number and pass that up as the new value.
   */
  handleStringChange = debounce(value => {
    this.props.onChange(value);
  }, 250);

  render() {
    const { forID, classNameWrapper, setActiveStyle, setInactiveStyle } =
      this.props;

    return (
      <Textarea
        id={forID}
        value={this.state.value || ''}
        className={classNameWrapper}
        onFocus={setActiveStyle}
        onBlur={setInactiveStyle}
        minRows={5}
        css={{ fontFamily: 'inherit' }}
        onChange={this.handleChange}
      />
    );
  }
}
