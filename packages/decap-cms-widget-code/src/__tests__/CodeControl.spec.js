import React from 'react';
import { render, act } from '@testing-library/react';
import { fromJS } from 'immutable';

import CodeControl from '../CodeControl';

// jsdom has no layout for CodeMirror; the editor itself is not under test
jest.mock('react-codemirror2', () => ({ UnControlled: () => null }));

function setup(field) {
  const onChange = jest.fn();
  const ref = React.createRef();
  render(
    <CodeControl
      ref={ref}
      field={fromJS(field)}
      onChange={onChange}
      forID="code"
      classNameWrapper=""
      widget={{ codeMirrorConfig: {} }}
      setActiveStyle={() => {}}
      setInactiveStyle={() => {}}
    />,
  );
  return { onChange, control: ref.current };
}

describe('CodeControl language persistence', () => {
  it('saves the first language picked when the field has no initial language', () => {
    const { onChange, control } = setup({ name: 'code' });

    act(() => control.setState({ lang: 'JavaScript' }));

    expect(onChange).toHaveBeenCalledWith(fromJS({ lang: 'JavaScript' }));
  });

  it('does not save the initial default language on mount', () => {
    const { onChange } = setup({ name: 'code', default_language: 'JavaScript' });

    expect(onChange).not.toHaveBeenCalled();
  });
});
