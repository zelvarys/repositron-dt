const ascii = process.env.REPOSITRON_ASCII === '1'

export const glyphs = ascii
  ? {
      filled: '=',
      empty: '-',
      pointer: '>',
      dot: '*',
      star: '*',
      pipe: '|',
      uptick: '^',
      downtick: 'v',
    }
  : {
      filled: '━',
      empty: '─',
      pointer: '▸',
      dot: '●',
      star: '★',
      pipe: '│',
      uptick: '↑',
      downtick: '↓',
    }
