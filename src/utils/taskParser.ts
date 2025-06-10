export const parseTaskContent = (line: string): string => {
  // Remove common bullet points and list markers
  let cleanedLine = line
    .replace(/^[-*•]\s*/, '')
    .replace(/^\d+\.\s*/, '')
    .replace(/^- \[ \]\s*/, '')
    .replace(/^- \[x\]\s*/, '')
    .replace(/^- \[X\]\s*/, '')
    .trim();
  
  // Remove brackets if present (e.g., [Optional])
  cleanedLine = cleanedLine.replace(/\[([^\]]+)\]/g, '$1').trim();
  
  // Remove time estimates in parentheses at the end (e.g., (30 min), (2 hours))
  cleanedLine = cleanedLine.replace(/\s*\(\s*\d+\s*(hours?|hrs?|minutes?|mins?)\s*\)\s*$/i, '').trim();
  
  // Remove everything after em dash or double dash
  cleanedLine = cleanedLine.replace(/\s*(—|--)\s*.*$/, '').trim();
  
  // Capitalize first letter
  if (cleanedLine) {
    cleanedLine = cleanedLine.charAt(0).toUpperCase() + cleanedLine.slice(1);
  }
  
  return cleanedLine;
};

export const parseTasks = (text: string): string[] => {
  const lines = text.split('\n').filter(line => line.trim());
  const tasks: string[] = [];

  lines.forEach(line => {
    const parsed = parseTaskContent(line);
    if (parsed) {
      tasks.push(parsed);
    }
  });

  return tasks;
};