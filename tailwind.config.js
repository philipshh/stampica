/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                display: ['Fraunces', 'Georgia', 'serif'],
            },
            colors: {
                cream: '#EDEAD4',
                paper: '#F5F1E8',      // page background
                surface: '#FAF7F0',    // raised panels / cards
                canvas: '#EFEADF',     // editor workspace behind the sheet
                line: '#E0DACC',       // hairline borders
                ink: '#161513',        // primary text
                'ink-soft': '#6D675A', // secondary text
                'ink-faint': '#8D8574',// labels / placeholders
                vermilion: '#E8491D',  // single accent
            },
            boxShadow: {
                sheet: '0 18px 40px rgba(40, 30, 10, 0.22)',
                card: '0 10px 30px rgba(40, 30, 10, 0.10)',
            },
        },
    },
    plugins: [],
}
