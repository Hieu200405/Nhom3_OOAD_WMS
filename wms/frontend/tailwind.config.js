import { colors } from './src/styles/colors.js';
import { typography } from './src/styles/typography.js';
import { layout, spacing } from './src/styles/layout.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // We can extend or override defaults here.
        // For now, let's just use the palette we defined if we want custom names,
        // or rely on Tailwind's defaults matching our design system.
        // To enforce our file as source of truth, we could map them:
        // brand: colors.primary,
        // However, Tailwind default palette is quite good.
        // Let's assume user wants to CENTRALIZE control.
        // So we might replace colors here if they differ from defaults.
        // Our file mirrors Tailwind defaults for Slate/Indigo roughly.
      },
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      spacing: spacing,
      screens: layout.screens,
      borderRadius: layout.borderRadius,
      container: layout.container,
    },
  },
  plugins: [],
};
