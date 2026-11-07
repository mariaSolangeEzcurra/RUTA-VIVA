const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Overpass"', 'system-ui', 'sans-serif'],
        mono: ['"Overpass Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        navy: { DEFAULT: v('navy'), 2: v('navy-2') },
        primary: { DEFAULT: v('primary'), soft: v('primary-soft') },
        canvas: v('canvas'),
        surface: v('surface'),
        line: v('line'),
        ink: v('ink'),
        muted: v('muted'),
        fatal: v('fatal'),
        signal: v('signal'),
        ok: v('ok'),
        warn: v('warn'),
        prio: {
          muyalta: v('p-muy-alta'),
          alta: v('p-alta'),
          media: v('p-media'),
          baja: v('p-baja'),
        },
      },
    },
  },
};
