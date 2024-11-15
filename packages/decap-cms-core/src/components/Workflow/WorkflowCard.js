import React from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { translate } from 'react-polyglot';
import { Link } from 'react-router-dom';
import { components, colors, colorsRaw, transitions, buttons } from 'decap-cms-ui-default';

const styles = {
  text: css`
    font-size: 13px;
    font-weight: normal;
    margin-top: 4px;
  `,
  button: css`
    ${buttons.button};
    width: auto;
    flex: 1 0 0;
    font-size: 13px;
    padding: 6px 0;
  `,
};

const WorkflowLink = styled(Link)`
  display: block;
  padding: 0 18px 18px;
  height: 200px;
  overflow: hidden;
`;

const CardCollection = styled.div`
  font-size: 14px;
  color: ${colors.textLead};
  text-transform: uppercase;
  margin-top: 12px;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;

const CardTitle = styled.h2`
  margin: 28px 0 0;
  color: ${colors.textLead};
`;

const CardDateContainer = styled.div`
  ${styles.text};
`;

const CardBody = styled.p`
  ${styles.text};
  color: ${colors.text};
  margin: 24px 0 0;
  overflow-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
`;

const CardButtonContainer = styled.div`
  background-color: ${colors.foreground};
  position: absolute;
  bottom: 0;
  width: 100%;
  padding: 12px 18px;
  display: flex;
  opacity: 0;
  transition: opacity ${transitions.main};
  cursor: pointer;
`;

const DeleteButton = styled.button`
  ${styles.button};
  background-color: ${colorsRaw.redLight};
  color: ${colorsRaw.red};
  margin-right: 6px;
`;

const PublishButton = styled.button`
  ${styles.button};
  background-color: ${colorsRaw.teal};
  color: ${colors.textLight};
  margin-left: 6px;

  &[disabled] {
    ${buttons.disabled};
  }
`;

const PublishDeleteButton = styled(PublishButton)`
  background-color: ${colorsRaw.redLight};
  color: ${colors.ed};
`;

const WorkflowCardContainer = styled.div`
  ${components.card};
  margin-bottom: 24px;
  position: relative;
  overflow: hidden;

  &:hover ${CardButtonContainer} {
    opacity: 1;
  }
`;

function lastChangePhraseKey(date, author) {
  if (date && author) {
    return 'lastChange';
  } else if (date) {
    return 'lastChangeNoAuthor';
  } else if (author) {
    return 'lastChangeNoDate';
  }
}

const CardDate = translate()(({ t, date, author }) => {
  const key = lastChangePhraseKey(date, author);
  if (key) {
    return (
      <CardDateContainer>{t(`workflow.workflowCard.${key}`, { date, author })}</CardDateContainer>
    );
  }
});

const PublishButtonWorkflow = translate()(({
  canPublish,
  onPublish,
  isModification,
  isDeleteWorkflow,
  t
}) => {
  const Component = isDeleteWorkflow ? PublishDeleteButton : PublishButton;

  return (
    <Component
      disabled={!canPublish} onClick={onPublish}>
      {isModification
        ? t('workflow.workflowCard.publishChanges')
        : t('workflow.workflowCard.publishNewEntry')}
    </Component>
  );
});


function WorkflowCard({
  collectionLabel,
  title,
  authorLastChange,
  body,
  isModification,
  isDeleteWorkflow,
  editLink,
  timestamp,
  onDelete,
  allowPublish,
  postAuthor,
  canPublish,
  onPublish,
  t,
}) {
  return (
    <WorkflowCardContainer>
      <WorkflowLink to={editLink}>
        <CardCollection>{collectionLabel}</CardCollection>
        {postAuthor}
        <CardTitle>{title}</CardTitle>
        {(timestamp || authorLastChange) && <CardDate date={timestamp} author={authorLastChange} />}
        <CardBody>{body}</CardBody>
      </WorkflowLink>
      <CardButtonContainer>
        <DeleteButton onClick={onDelete}>
          {isModification
            ? t('workflow.workflowCard.deleteChanges')
            : t('workflow.workflowCard.deleteNewEntry')}
        </DeleteButton>
        {allowPublish && <PublishButtonWorkflow canPublish={canPublish} onPublish={onPublish} isDeleteWorkflow={isDeleteWorkflow} />}
      </CardButtonContainer>
    </WorkflowCardContainer>
  );
}

WorkflowCard.propTypes = {
  collectionLabel: PropTypes.string.isRequired,
  title: PropTypes.string,
  authorLastChange: PropTypes.string,
  body: PropTypes.string,
  isModification: PropTypes.bool,
  isDeleteWorkflow: PropTypes.bool,
  editLink: PropTypes.string.isRequired,
  timestamp: PropTypes.string.isRequired,
  onDelete: PropTypes.func.isRequired,
  allowPublish: PropTypes.bool.isRequired,
  canPublish: PropTypes.bool.isRequired,
  onPublish: PropTypes.func.isRequired,
  postAuthor: PropTypes.string,
  t: PropTypes.func.isRequired,
};

export default translate()(WorkflowCard);
