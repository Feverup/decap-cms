export default function consoleError(title, description) {
  console.warn(
    `%c ⛔ ${title}\n` + `%c${description}\n\n`,
    'color: white; font-weight: bold; font-size: 16px; line-height: 50px;',
    'color: white;',
  );
}
