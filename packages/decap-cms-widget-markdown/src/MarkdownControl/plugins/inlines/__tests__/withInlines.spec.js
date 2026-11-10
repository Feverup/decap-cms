import { createEditor, Editor } from 'slate';

import withInlines from '../withInlines';

function normalize(link) {
  const editor = withInlines(createEditor());
  editor.children = [{ type: 'paragraph', children: [{ text: '' }, link, { text: '' }] }];
  Editor.normalize(editor, { force: true });
  return editor.children[0].children.filter(node => node.type === 'link');
}

describe('withInlines normalizeNode', () => {
  it('removes a link with no content', () => {
    expect(normalize({ type: 'link', data: { url: 'x' }, children: [{ text: '' }] })).toEqual([]);
  });

  it('keeps a link whose only content is an image', () => {
    const image = { type: 'image', data: { url: 'a.png' }, children: [{ text: '' }] };
    const links = normalize({ type: 'link', data: { url: 'x' }, children: [image] });
    expect(links).toHaveLength(1);
    expect(links[0].children.some(node => node.type === 'image')).toBe(true);
  });
});
