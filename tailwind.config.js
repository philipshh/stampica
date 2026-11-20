/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Geist Variable"', 'system-ui', 'sans-serif'],
                display: ['"Archivo Variable"', '"Geist Variable"', 'system-ui', 'sans-serif'],
            },
            colors: {
                cream: '#EDEAD4',
                paper: '#F3F3F0',      // page background (neutral off-white)
                surface: '#FBFBF9',    // raised panels / cards
                canvas: '#E9E9E5',     // editor workspace behind the sheet
                line: '#DDDDD8',       // hairline borders
                ink: '#141414',        // primary text
                'ink-soft': '#55554F', // secondary text
                'ink-faint': '#7C7C76',// labels / placeholders
                vermilion: '#E8491D',  // single accent
            },
            boxShadow: {
                sheet: '0 18px 40px rgba(20, 20, 18, 0.18)',
                card: '0 10px 30px rgba(20, 20, 18, 0.08)',
            },
        },
    },
    plugins: [],
}
