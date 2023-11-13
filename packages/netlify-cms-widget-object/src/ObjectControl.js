import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { ClassNames } from '@emotion/core';
import { List, Map } from 'immutable';
import { colors, lengths, ObjectWidgetTopBar } from 'netlify-cms-ui-default';
import { stringTemplate } from 'netlify-cms-lib-widgets';

const styleStrings = {
  nestedObjectControl: `
    padding: 6px 14px 14px;
    border-top: 0;
    border-top-left-radius: 0;
    border-top-right-radius: 0;
  `,
  objectWidgetTopBarContainer: `
    padding: ${lengths.objectWidgetTopBarContainerPadding};
  `,
  collapsedObjectControl: `
    display: none;
  `,
};

export default class ObjectControl extends React.Component {
  componentValidate = {};

  static propTypes = {
    onChangeObject: PropTypes.func.isRequired,
    onValidateObject: PropTypes.func.isRequired,
    value: PropTypes.oneOfType([PropTypes.node, PropTypes.object, PropTypes.bool]),
    field: PropTypes.object,
    forID: PropTypes.string,
    classNameWrapper: PropTypes.string.isRequired,
    forList: PropTypes.bool,
    controlRef: PropTypes.func,
    editorControl: PropTypes.elementType.isRequired,
    resolveWidget: PropTypes.func.isRequired,
    clearFieldErrors: PropTypes.func.isRequired,
    fieldsErrors: ImmutablePropTypes.map.isRequired,
    hasError: PropTypes.bool,
    t: PropTypes.func.isRequired,
    locale: PropTypes.string,
  };

  static defaultProps = {
    value: Map(),
  };

  constructor(props) {
    super(props);
    this.state = {
      collapsed: props.field.get('collapsed', false),
    };
  }

  /*
   * Always update so that each nested widget has the option to update. This is
   * required because ControlHOC provides a default `shouldComponentUpdate`
   * which only updates if the value changes, but every widget must be allowed
   * to override this.
   */
  shouldComponentUpdate(nextProps, nextState = {}) {
    if (!this.props.parentIds.length) return true;

    if (this.props.forList) {
      if (nextProps.collapsed !== this.props.collapsed) return true;
      return !nextProps.collapsed;
    }
    if (nextState.collapsed !== undefined) {
      if (nextState.collapsed !== this.state.collapsed) return true;
      return !nextState.collapsed;
    }
    return !this.state.collapsed;
  }

  validate = () => {
    const { field } = this.props;
    let fields = field.get('field') || field.get('fields');
    fields = List.isList(fields) ? fields : List([fields]);
    fields.forEach(field => {
      const widget = field.get('widget');
      if (widget === 'hidden' || widget === 'object' && field.has('flat')) return;
      const parentName = field.get('parentName');
      const name = field.get('name');

      const validateName = parentName ? `${parentName}.${name}` : name;
      this.componentValidate[validateName]();
    });
  };

  getFieldValue(field) {
    const { value } = this.props;

    const isWrapper = field.has('wrapper');
    if (isWrapper) {
      const wrapper = field.get('wrapper');
      const isRootWrapper = wrapper === '';

      return isRootWrapper ? value : value.getIn([...wrapper.split('.')]);
    }

    const isMap = value && Map.isMap(value);

    if (isMap) {
      const parentName = field.get('parentName');
      const name = field.get('name');
      if (parentName) return value.getIn([...(parentName.split('.')), name]);
      return value.get(name);
    }

    return value;
  }

  controlFor(field, key) {
    const {
      onChangeObject,
      onValidateObject,
      clearFieldErrors,
      metadata,
      fieldsErrors,
      editorControl: EditorControl,
      controlRef,
      parentIds,
      isFieldDuplicate,
      isFieldHidden,
      locale,
    } = this.props;

    if (field.get('widget') === 'hidden') {
      return null;
    }

    const fieldValue = this.getFieldValue(field);

    const isDuplicate = isFieldDuplicate && isFieldDuplicate(field);
    const isHidden = isFieldHidden && isFieldHidden(field);

    return (
      <EditorControl
        key={key}
        field={field}
        value={fieldValue}
        onChange={onChangeObject}
        clearFieldErrors={clearFieldErrors}
        fieldsMetaData={metadata}
        fieldsErrors={fieldsErrors}
        onValidate={onValidateObject}
        processControlRef={controlRef && controlRef.bind(this)}
        controlRef={controlRef}
        parentIds={parentIds}
        isDisabled={isDuplicate}
        isHidden={isHidden}
        isFieldDuplicate={isFieldDuplicate}
        isFieldHidden={isFieldHidden}
        locale={locale}
      />
    );
  }

  handleCollapseToggle = () => {
    this.setState({ collapsed: !this.state.collapsed });
  };

  orderRenderedFields = (renderedFields, field) => {
    const order = field.get('order').toJS();
    if (!order.length) return renderedFields;

    const orderMap = {};
    order.forEach(key => {
      orderMap[key] = [];
    });

    const notordered = [];
    renderedFields.forEach(render => {
      const { field } = render.props;
      const parentName = field.get('parentName');
      const name = field.get('name');
      const orderKey = parentName ? `${parentName}.${name}` : name;
      if (orderMap[orderKey]) {
        return orderMap[orderKey].push(render);
      }
      return notordered.push(render);
    });

    return [...Object.values(orderMap), ...notordered];
  }

  renderFields = (multiFields, singleField, field) => {
    if (multiFields) {
      const mappedMultiFields = [];
      multiFields.forEach((f, idx) => {
        const isFlat = f.has('flat');
        if (isFlat) {
          const parentName = f.get('parentName');
          const name = f.get('name');

          const fieldParentName = parentName ? `${parentName}.${name}` : name;
          const multiFields = f.get('fields')?.map(field => field.set('parentName', fieldParentName));
          const singleField = f.get('field')?.set('parentName', fieldParentName);

          return mappedMultiFields.push(...this.renderFields(multiFields, singleField, f));
        }
        return mappedMultiFields.push(this.controlFor(f, idx));
      });

      return field.has('order') ? this.orderRenderedFields(mappedMultiFields, field) : mappedMultiFields;
    }
    return this.controlFor(singleField);
  };

  objectLabel = () => {
    const { value, field } = this.props;
    const label = field.get('label', field.get('name'));
    const summary = field.get('summary');
    return summary ? stringTemplate.compileStringTemplate(summary, null, '', value) : label;
  };

  render() {
    const { field, forID, classNameWrapper, forList, hasError, t } = this.props;
    const collapsed = forList ? this.props.collapsed : this.state.collapsed;
    const multiFields = field.get('fields');
    const singleField = field.get('field');
    const isFlat = field.has('flat');
    const lazy = field.get('lazy');
    const render = lazy ? !collapsed : true;

    if (multiFields || singleField) {
      return (
        <ClassNames>
          {({ css, cx }) => isFlat ? (
            <div id={forID}>
              {render && this.renderFields(multiFields, singleField, field)}
            </div>
          ) : (
            <div
              id={forID}
              className={cx(
                classNameWrapper,
                css`
                  ${styleStrings.objectWidgetTopBarContainer}
                `,
                {
                  [css`
                    ${styleStrings.nestedObjectControl}
                  `]: forList,
                },
                {
                  [css`
                    border-color: ${colors.textFieldBorder};
                  `]: forList ? !hasError : false,
                },
              )}
            >
              {forList ? null : (
                <ObjectWidgetTopBar
                  collapsed={collapsed}
                  onCollapseToggle={this.handleCollapseToggle}
                  heading={collapsed && this.objectLabel()}
                  t={t}
                />
              )}
              <div
                className={cx({
                  [css`
                    ${styleStrings.collapsedObjectControl}
                  `]: collapsed,
                })}
              >
                {render && this.renderFields(multiFields, singleField, field)}
              </div>
            </div>
          )}
        </ClassNames>
      );
    }

    return <h3>No field(s) defined for this widget</h3>;
  }
}
