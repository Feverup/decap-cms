import React from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/core';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import {
  Icon,
  Dropdown,
  DropdownItem,
  StyledDropdownButton,
  colorsRaw,
  colors,
  buttons,
} from 'netlify-cms-ui-default';
import { connect } from 'react-redux';

import { updateStackStatus, publishStack, closeStack } from '../../actions/stack';
import { status } from '../../constants/publishModes';

const styles = {
  noOverflow: css`
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  `,
  buttonMargin: css`
    margin: 0 10px;
  `,
  toolbarSection: css`
    height: 100%;
    display: flex;
    align-items: center;
    border: 0 solid ${colors.textFieldBorder};
  `,
  publishedButton: css`
    background-color: ${colorsRaw.tealLight};
    color: ${colorsRaw.teal};
  `,
};

const DropdownButton = styled(StyledDropdownButton)`
  ${styles.noOverflow}
  @media (max-width: 1200px) {
    padding-left: 10px;
  }
`;

const ToolbarSectionMain = styled.div`
  ${styles.toolbarSection};
  flex: 10;
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
`;

const ToolbarSubSectionFirst = styled.div`
  display: flex;
  align-items: center;
`;

const ToolbarDropdown = styled(Dropdown)`
  ${styles.buttonMargin};

  ${Icon} {
    color: ${colorsRaw.teal};
  }
`;

const ToolbarButton = styled.button`
  ${buttons.button};
  ${buttons.default};
  ${styles.buttonMargin};
  ${styles.noOverflow};
  display: block;

  @media (max-width: 1200px) {
    padding: 0 10px;
  }
`;

const DeleteButton = styled(ToolbarButton)`
  ${buttons.lightRed};
`;

const PublishButton = styled(DropdownButton)`
  background-color: ${colorsRaw.teal};
`;

const StatusButton = styled(DropdownButton)`
  background-color: ${colorsRaw.tealLight};
  color: ${colorsRaw.teal};

  ${props =>
    props.label === 'stale' &&
    css`
      background-color: ${colors.staleBackground};
      color: ${colors.staleText};
    `}
`;

const StatusDropdownItem = styled(DropdownItem)`
  ${Icon} {
    color: ${colors.infoText};
  }
`;

export class EditorToolbar extends React.Component {
  static propTypes = {
    isPersisting: PropTypes.bool,
    isPublishing: PropTypes.bool,
    isUpdatingStatus: PropTypes.bool,
    isDeleting: PropTypes.bool,
    onPersist: PropTypes.func.isRequired,
    onPersistAndNew: PropTypes.func.isRequired,
    onPersistAndDuplicate: PropTypes.func.isRequired,
    showDelete: PropTypes.bool.isRequired,
    unPublish: PropTypes.func.isRequired,
    user: PropTypes.object,
    useOpenAuthoring: PropTypes.bool,
    currentStatus: PropTypes.string,
    t: PropTypes.func.isRequired,
  };

  handleChangeStatus = newStatusName => {
    const { updateStackStatus, currentStatus, } = this.props;
    const newStatus = status.get(newStatusName);
    updateStackStatus(currentStatus, newStatus);
  };

  handleDelete = () => {
    const { closeStack, t } = this.props;
    if (!window.confirm(t('editor.editor.onStackClosing'))) {
      return;
    }
    closeStack();
  };

  handlePublish = () => {
    const { publishStack, t } = this.props;
    if (!window.confirm(t('editor.editor.onStackPublishing'))) {
      return;
    }
    publishStack()
  };

  componentDidMount() {
    const { isNewEntry, loadDeployPreview } = this.props;
    if (!isNewEntry) {
      loadDeployPreview({ maxAttempts: 3 });
    }
  }

  componentDidUpdate(prevProps) {
    const { isNewEntry, isPersisting, loadDeployPreview } = this.props;
    if (!isNewEntry && prevProps.isPersisting && !isPersisting) {
      loadDeployPreview({ maxAttempts: 3 });
    }
  }

  renderWorkflowStatusControls = () => {
    const { isUpdatingStatus, currentStatus, t, } = this.props;

    const statusToTranslation = {
      [status.get('DRAFT')]: t('editor.editorToolbar.draft'),
      [status.get('PENDING_REVIEW')]: t('editor.editorToolbar.inReview'),
      [status.get('PENDING_PUBLISH')]: t('editor.editorToolbar.ready'),
      [status.get('STALE')]: t('editor.editorToolbar.inStale'),
    };

    const buttonText = isUpdatingStatus
      ? t('editor.editorToolbar.updating')
      : t('editor.editorToolbar.status', { status: statusToTranslation[currentStatus] });

    return (
      <>
        <ToolbarDropdown
          dropdownTopOverlap="40px"
          dropdownWidth="120px"
          renderButton={() => <StatusButton label={currentStatus}>{buttonText}</StatusButton>}
        >
          <StatusDropdownItem
            label={t('editor.editorToolbar.draft')}
            onClick={() => this.handleChangeStatus('DRAFT')}
            icon={currentStatus === status.get('DRAFT') ? 'check' : null}
          />
          <StatusDropdownItem
            label={t('editor.editorToolbar.inReview')}
            onClick={() => this.handleChangeStatus('PENDING_REVIEW')}
            icon={currentStatus === status.get('PENDING_REVIEW') ? 'check' : null}
          />
          <StatusDropdownItem
            label={t('editor.editorToolbar.ready')}
            onClick={() => this.handleChangeStatus('PENDING_PUBLISH')}
            icon={currentStatus === status.get('PENDING_PUBLISH') ? 'check' : null}
          />
        </ToolbarDropdown>
      </>
    );
  };

  renderNewEntryWorkflowPublishControls = () => {
    const { isPublishing, t } = this.props;

    return (
      <ToolbarDropdown
        dropdownTopOverlap="40px"
        dropdownWidth="150px"
        renderButton={() => (
          <PublishButton>
            {isPublishing
              ? t('editor.editorToolbar.publishing')
              : t('editor.editorToolbar.publish')}
          </PublishButton>
        )}
      >
        <DropdownItem
          label={t('editor.editorToolbar.publishNow')}
          icon="arrow"
          iconDirection="right"
          onClick={this.handlePublish}
        />
      </ToolbarDropdown>
    )
  };

  renderWorkflowControls = () => {
    const {
      useOpenAuthoring,
      isDeleting,
      currentStatus,
      collection,
      t,
    } = this.props;

    const canCreate = collection.get('create');
    const canPublish = collection.get('publish') && !useOpenAuthoring;

    return [
      currentStatus && [
        this.renderWorkflowStatusControls(),
        currentStatus === status.get('PENDING_PUBLISH') &&
        this.renderNewEntryWorkflowPublishControls({ canCreate, canPublish }),
        (
          <DeleteButton
            key="delete-button"
            onClick={this.handleDelete}
          >
            {isDeleting ? t('editor.editorToolbar.discarding') : t('editor.editorToolbar.discardChanges')}
          </DeleteButton>
        ),
      ],
    ];
  };

  render() {
    return (
      <ToolbarSectionMain>
        <ToolbarSubSectionFirst>
          {this.renderWorkflowControls()}
        </ToolbarSubSectionFirst>
      </ToolbarSectionMain>
    );
  }
}

function mapStateToProps(state) {
  const { status } = state.stack;
  return {
    currentStatus: status.status,
    ...status
  }
}

const mapDispatchToProps = {
  updateStackStatus,
  publishStack,
  closeStack
};

export default connect(mapStateToProps, mapDispatchToProps)(translate()(EditorToolbar));
