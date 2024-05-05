/* Theme toggle */
const theme = {
    current: localStorage.getItem('theme') ?? null,
    update: function() {
        if (this.current === null && window.matchMedia('(prefers-color-scheme: light)').matches) {
            this.current = 'light';
        }
        localStorage.setItem('theme', this.current);
        document.documentElement.setAttribute('data-theme', this.current);
    },
    toggle: function() {
        this.current = (this.current === 'dark' ? 'light' : 'dark');
        this.update();
    }
};
theme.update();
document.getElementById('theme-toggle').addEventListener('click', function() {
    theme.toggle();
});