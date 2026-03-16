/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{vue,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        'card-foreground': 'hsl(var(--card-foreground))',
        popover: 'hsl(var(--popover))',
        'popover-foreground': 'hsl(var(--popover-foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        secondary: 'hsl(var(--secondary))',
        'secondary-foreground': 'hsl(var(--secondary-foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        accent: 'hsl(var(--accent))',
        'accent-foreground': 'hsl(var(--accent-foreground))',
        destructive: 'hsl(var(--destructive))',
        'destructive-foreground': 'hsl(var(--destructive-foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        'log-rx': 'hsl(var(--log-rx))',
        'log-tx': 'hsl(var(--log-tx))',
        'log-error': 'hsl(var(--log-error))',
        'log-warn': 'hsl(var(--log-warn))',
        'log-info': 'hsl(var(--log-info))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'glow-primary': '0 0 8px 1px hsl(234 89% 74% / 0.3)',
        'glow-success': '0 0 8px 1px hsl(142 71% 45% / 0.3)',
        'glow-error': '0 0 8px 1px hsl(0 84% 60% / 0.3)',
        'inner-panel': 'inset 0 1px 2px 0 rgb(0 0 0 / 0.3)',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 4px 0px hsl(234 89% 74% / 0.2)' },
          '50%': { boxShadow: '0 0 12px 2px hsl(234 89% 74% / 0.4)' },
        },
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
