export const CMS_BRANCH_PREFIX = 'cms';
export const DEFAULT_PR_BODY = 'Automatically generated by Netlify CMS';
export const MERGE_COMMIT_MESSAGE = 'Automatically generated. Merged on Netlify CMS.';

const DEFAULT_NETLIFY_CMS_LABEL_PREFIX = 'netlify-cms/';

export const REF_SUFFIX = (() => {
  const { pathname } = window.location;
  const cleanPathname = pathname.replace(/^\//, '');
  return cleanPathname ? `(${cleanPathname})` : '';
})();

function getLabelPrefix(labelPrefix: string) {
  return labelPrefix || DEFAULT_NETLIFY_CMS_LABEL_PREFIX;
}

export function isCmsRefSuffix(ref: string) {
  return ref.endsWith(REF_SUFFIX)
}

export function isCMSLabel(label: string, labelPrefix: string) {
  return label.startsWith(getLabelPrefix(labelPrefix));
}

export function labelToStatus(label: string, labelPrefix: string) {
  return label.slice(getLabelPrefix(labelPrefix).length);
}

export function statusToLabel(status: string, labelPrefix: string) {
  return `${getLabelPrefix(labelPrefix)}${status}`;
}

export function generateContentKey(collectionName: string, slug: string) {
  return `${collectionName}/${slug}${REF_SUFFIX}`;
}

export function parseContentKey(contentKey: string) {
  const index = contentKey.indexOf('/');
  return {
    collection: contentKey.slice(0, index),
    slug: contentKey.slice(index + 1).replace(REF_SUFFIX, ''),
  };
}

export function contentKeyFromBranch(branch: string) {
  return branch.slice(`${CMS_BRANCH_PREFIX}/`.length);
}

export function branchFromContentKey(contentKey: string) {
  return `${CMS_BRANCH_PREFIX}/${contentKey}`;
}
