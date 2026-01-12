# Visual QA Checklist ✅

Purpose: ensure UI changes (buttons, forms, micro-interactions) look correct across breakpoints and accessibility settings.

How to use:
- Open the app in Incognito (`npm run dev`) and use DevTools Device Mode for breakpoints.
- Tab through interactive elements to verify visible focus rings and order.
- Use `prefers-reduced-motion` in DevTools -> Rendering to check reduced-motion behavior.
- Capture screenshots for each item below and attach to PR or issue.

Checklist:

1. Login Page
   - [ ] Sign In button: correct color, rounded pill, full-width on mobile
   - [ ] Sign In hover: shadow grows slightly (hover:shadow-md)
   - [ ] Sign In active: scale down (active:scale-95)
   - [ ] Inputs: proper padding, placeholder color, focus ring visible
   - [ ] Error card: red tone, retry/copy buttons styled as primary/ghost

2. Loading State
   - [ ] Full page spinner centered and single spinner visible
   - [ ] Loading text present and legible

3. Accessibility
   - [ ] Keyboard navigation: Tab order logical, focus rings visible
   - [ ] Contrast: text and CTA pass WCAG AA for normal text
   - [ ] Reduced motion: interactions do not animate when reduced-motion is set

4. Breakpoints
   - [ ] Mobile (375x812): form fits, button full width, typography scales down
   - [ ] Tablet (768px): layout looks balanced
   - [ ] Desktop (1280px+): hero typography spacing and card placement correct

Notes:
- If something fails, capture a short screencast and list steps to reproduce.
- If CSS/utility classes appear missing, confirm `src/index.css` is loading and Tailwind is processed (run `npx tailwindcss -i src/index.css -o src/tw-test.css --minify`).

Owner: UI reviewer
