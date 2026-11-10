import { Element, Node, Transforms } from 'slate';

import keyDown from './events/keyDown';

function withInlines(editor) {
  const { isInline, isVoid, normalizeNode } = editor;

  editor.isInline = element =>
    ['link', 'button', 'break', 'image'].includes(element.type) || isInline(element);

  editor.isVoid = element =>
    ['break', 'image', 'thematic-break'].includes(element.type) || isVoid(element);

  // Remove empty links (fixes #7640: hidden link remains when deleting linked text)
  editor.normalizeNode = entry => {
    const [node, path] = entry;

    if (Element.isElement(node) && node.type === 'link') {
      // Empty = no text and no void child (a linked image has no text but is content)
      const hasVoid = Array.from(Node.elements(node)).some(([el]) => editor.isVoid(el));
      if (Node.string(node) === '' && !hasVoid) {
        Transforms.removeNodes(editor, { at: path });
        return;
      }
    }

    normalizeNode(entry);
  };

  if (editor.keyDownHandlers === undefined) {
    editor.keyDownHandlers = [];
  }
  editor.keyDownHandlers.push((event, editor) => keyDown(event, editor));

  return editor;
}

export default withInlines;
