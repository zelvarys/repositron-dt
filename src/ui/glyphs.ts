const ascii = process.env.REPOSITRON_ASCII === '1'

export const glyphs = ascii
  ? {
      filled: '#',
      empty: '-',
      spark: ['_', '.', ':', '-', '=', '+', '*', '#'],
      pointer: '>',
      dot: '*',
      star: '*',
      pipe: '|',
      uptick: '^',
      downtick: 'v',
    }
  : {
      filled: '█',
      empty: '░',
      spark: ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'],
      pointer: '▸',
      dot: '●',
      star: '★',
      pipe: '│',
      uptick: '↑',
      downtick: '↓',
    }
