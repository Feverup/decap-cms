import React from 'react';
import PropTypes from 'prop-types';
import { debounce } from 'lodash';

export default class StringControl extends React.Component {
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

  // The selection to maintain for the input element
  _sel = 0;

  // The input element ref
  _el = null;

  shouldComponentUpdate(nextProps, nextState) {
    return Boolean(
      nextState &&
      (this.state.value !== nextState.value ||
        nextProps.value !== nextState.value)
    );
  }

  // NOTE: This prevents the cursor from jumping to the end of the text for
  // nested inputs. In other words, this is not an issue on top-level text
  // fields such as the `title` of a collection post. However, it becomes an
  // issue on fields nested within other components, namely widgets nested
  // within a `markdown` widget. For example, the alt text on a block image
  // within markdown.
  // SEE: https://github.com/decaporg/decap-cms/issues/4539
  // SEE: https://github.com/decaporg/decap-cms/issues/3578
  componentDidUpdate(prevProps) {
    if (this._el && this._el.selectionStart !== this._sel) {
      this._el.setSelectionRange(this._sel, this._sel);
    }
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
   * When the document value changes, serialize from Slate's AST back to plain
   * text and pass that up as the new value.
   */
  handleStringChange = debounce(value => {
    this.props.onChange(value);
  }, 250);

  render() {
    const { forID, classNameWrapper, setActiveStyle, setInactiveStyle } = this.props;

    return (
      <input
        ref={el => {
          this._el = el;
        }}
        type="text"
        id={forID}
        className={classNameWrapper}
        value={this.state.value}
        onChange={this.handleChange}
        onFocus={setActiveStyle}
        onBlur={setInactiveStyle}
      />
    );
  }
}
