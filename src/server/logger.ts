export function log(message: string) {
  const timestamp = new Date().toISOString();

  const colors: string[] = [];
  const msg = message.replaceAll(/<([a-z]+):(.*?):>/g, (_, color, text) => {
    colors.push(`color: ${color};`);
    colors.push("color: unset;");

    return `%c${text}%c`;
  });

  console.log(`[${timestamp}] ` + msg, ...colors);
}
