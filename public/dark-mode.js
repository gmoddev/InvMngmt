document.addEventListener('DOMContentLoaded', () => {
    function lerpColor(color1, color2, factor) {
        const result = color1.slice(1).match(/.{2}/g)
            .map((hex, i) => {
                const v1 = parseInt(hex, 16);
                const v2 = parseInt(color2.slice(1).match(/.{2}/g)[i], 16);
                const val = Math.round(v1 + (v2 - v1) * factor).toString(16).padStart(2, '0');
                return val;
            });
        return `#${result.join('')}`;
    }

    function lerpTransition(fromColors, toColors, duration) {
        const startTime = performance.now();

        function update() {
            const elapsed = performance.now() - startTime;
            const factor = Math.min(elapsed / duration, 1);
            document.body.style.backgroundColor = lerpColor(fromColors.bodyBg, toColors.bodyBg, factor);
            document.body.style.color = lerpColor(fromColors.textColor, toColors.textColor, factor);
            document.querySelector('.container').style.backgroundColor = lerpColor(fromColors.containerBg, toColors.containerBg, factor);
            document.querySelectorAll('.item-box').forEach(el => el.style.backgroundColor = lerpColor(fromColors.itemBoxBg, toColors.itemBoxBg, factor));
            if (factor < 1) {
                requestAnimationFrame(update);
            }
        }
        update();
    }

    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function() {
            const isDarkMode = this.checked;

            const lightModeColors = {
                bodyBg: '#f4f4f4',
                textColor: '#333',
                containerBg: 'white',
                itemBoxBg: '#f2f2f2'
            };
            const darkModeColors = {
                bodyBg: '#333',
                textColor: '#f4f4f4',
                containerBg: '#444',
                itemBoxBg: '#555'
            };

            if (isDarkMode) {
                lerpTransition(lightModeColors, darkModeColors, 500);
                document.body.classList.add('dark-mode');
                document.querySelector('.container').classList.add('dark-mode');
                document.querySelectorAll('.item-box').forEach(el => el.classList.add('dark-mode'));
                document.querySelectorAll('.square-btn').forEach(el => el.classList.add('dark-mode'));
            } else {
                lerpTransition(darkModeColors, lightModeColors, 500);
                document.body.classList.remove('dark-mode');
                document.querySelector('.container').classList.remove('dark-mode');
                document.querySelectorAll('.item-box').forEach(el => el.classList.remove('dark-mode'));
                document.querySelectorAll('.square-btn').forEach(el => el.classList.remove('dark-mode'));
            }
        });
    }
});
