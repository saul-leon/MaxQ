let MaxQ = {
    post_message: async function(endpoint, data, callback) {
        const response = await fetch(
            'http://localhost:8100' + endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            }
        );
        (response.json()).then(data => { callback(data); });
    },
    widget: {
        items: [{
            id: 'clock',
            last_minute: 'NONE',
            render: (self) => {
                var dt = new Date();
                var hour = dt.getHours() < 10 ? '0' + dt.getHours() : dt.getHours();
                var minutes = dt.getMinutes() < 10 ? '0' + dt.getMinutes() : dt.getMinutes();
                var day_week = (['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])[dt.getDay()];
                var month = (['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'])[dt.getMonth()];
                var day = dt.getDate();

                // Break time indicator
                if (self.last_minute == '59' && minutes == '00') {
                    MaxQ.notify({
                        title: 'Stand Up!',
                        icon: 'break-time.webp',
                        body: 'Break time'
                    });
                }
                self.last_minute = minutes;

                document.getElementById('clock').innerHTML = [
                    '<div class="hour">' + hour + '</div>',
                    '<div class="hour" style="margin-top: -40px;">' + minutes + '</div>',
                    '<div class="date">' + day_week + ', ' + month + ' ' + day + '</div>'
                ].join('');
            },
            run: (self) => {
                setInterval(() => { self.render(self); }, 1000);
            }
        }],
        hide_all: () => {
            for (var w of MaxQ.widget.items)
                document.getElementById(w.id).classList.add('hide');
        },
        show_all: () => {
            for (var w of MaxQ.widget.items)
                document.getElementById(w.id).classList.remove('hide');
        }
    },
    omnibar: {
        is_showing: false,
        in_timer: null,
        in: document.getElementById('omnibar-in'),
        out: document.getElementById('omnibar-out'),
        clear: () => {
            MaxQ.omnibar.results.top_hints.innerHTML = '';
            MaxQ.omnibar.results.preview.innerHTML = '';
            MaxQ.omnibar.in.value = '';
        },
        show: () => {
            MaxQ.widget.hide_all();
            MaxQ.omnibar.is_showing = true;

            //var video = document.getElementById('video-background');
            //video.classList.add('blured');
            //setTimeout(()=>{ video.pause(); }, 250);

            MaxQ.omnibar.clear();
            MaxQ.omnibar.in.style.display = 'block';
            MaxQ.omnibar.out.style.display = 'grid';
            MaxQ.omnibar.in.focus();
        },
        hide: () => {
            MaxQ.omnibar.in.style.display = 'none';
            MaxQ.omnibar.out.style.display = 'none';
            MaxQ.omnibar.in.blur();

            //var video = document.getElementById('video-background');
            //video.classList.remove('blured');
            //video.play();

            MaxQ.widget.show_all();
            MaxQ.omnibar.is_showing = false;
        },
        search: () => {
            var query = MaxQ.omnibar.in.value;
            if (query != '') {
                MaxQ.post_message(
                    '/v1/search', { "query": query },
                    MaxQ.omnibar.results.set_results
                );
            }
        },
        results: {
            options: [],
            selected: 0,
            items_ln: 0,
            item_selected: null,
            top_hints: document.getElementById('omnibar-top-hints'),
            preview: document.getElementById('omnibar-preview'),
            render_results: () => {
                var self = MaxQ.omnibar.results;

                var items = [];
                var k = 0;

                for (var category of self.options) {
                    items.push('<div class="category">' + category['name'] + '</div>');
                    for (var item of category.items) {
                        var is_selected = k++ == self.selected;
                        var clazz = is_selected ? 'item_selected' : 'item';
                        items.push('<div class="' + clazz + '">' + item['name'] + '</div>');

                        if (is_selected) {
                            self.item_selected = item;
                            self.preview.innerHTML = item.preview;
                            if (item.cmd == 'copy' && item.preview.indexOf('</pre>') != -1) {
                                var node = self.preview.getElementsByTagName('PRE')[0];
                                Prism.highlightElement(node);
                            }
                        }
                    }
                }

                self.items_ln = k;
                self.top_hints.innerHTML = items.join('');
            },
            render_empty: () => {
                MaxQ.omnibar.results.top_hints.innerHTML = '<div class="category">No Results</div>';
                MaxQ.omnibar.results.preview.innerHTML = '';
            },
            set_results: (categories) => {
                if (categories.length == 0) {
                    MaxQ.omnibar.results.render_empty();
                } else {
                    MaxQ.omnibar.results.options = categories;
                    MaxQ.omnibar.results.selected = 0;
                    MaxQ.omnibar.results.render_results();
                }
            }
        },
        navigate: (direction) => {
            var ln = MaxQ.omnibar.results.items_ln;
            if (ln > 0) {
                var delta = direction == 'DOWN' ? 1 : -1;
                var k = MaxQ.omnibar.results.selected;
                MaxQ.omnibar.results.selected = Math.max(0, Math.min(ln - 1, k + delta));
                MaxQ.omnibar.results.render_results();
            }
        },
        exec: () => {
            var item = MaxQ.omnibar.results.item_selected;

            if (item['type'] == 'front' && item['cmd'] == 'open') {
                MaxQ.omnibar.hide();
                open(item['params'][0]);
            }

            if (item['type'] == 'front' && item['cmd'] == 'copy') {
                var in_aux = document.createElement('textarea');
                in_aux.value = item['params'][0];
                document.body.appendChild(in_aux);
                in_aux.select();
                in_aux.setSelectionRange(0, 99999);
                document.execCommand('copy');
                in_aux.remove();
                MaxQ.omnibar.hide();
            }

            if (item['type'] == 'back') {
                MaxQ.post_message(
                    '/v1/' + item['cmd'], { "params": item['params'] },
                    MaxQ.omnibar.hide
                );
            }
        }
    },

    load: () => {
        // Start widgets
        for (var w of MaxQ.widget.items)
            w.run(w);

        // Activate/Deactivate Omnibar
        document.body.onkeyup = (env) => {
            env.preventDefault();
            var omnibar = MaxQ.omnibar;
            var key = env.code;

            if (!omnibar.is_showing && key == 'Space')
                omnibar.show();

            if (omnibar.is_showing && key == 'Escape')
                if (omnibar.in.value == '')
                    omnibar.hide();
                else
                    omnibar.clear();

            if (omnibar.is_showing && key == 'ArrowDown')
                omnibar.navigate('DOWN');

            if (omnibar.is_showing && key == 'ArrowUp')
                omnibar.navigate('UP');

            if (omnibar.is_showing && key == 'Enter' && omnibar.in.value != '')
                omnibar.exec();
        };

        // Search on text change
        MaxQ.omnibar.in.onkeyup = (env) => {
            var exclude_keys = { 'ArrowUp': 1, 'ArrowDown': 1, 'Enter': 1 };
            if (!(env.code in exclude_keys)) {
                clearTimeout(MaxQ.omnibar.in_timer);
                MaxQ.omnibar.in_timer = setTimeout(() => {
                    MaxQ.omnibar.search();
                }, 100);
            }
        };

        // Animate on load
        setTimeout(MaxQ.widget.show_all, 1000);
    },

    notify: (message) => {
        if (Notification.permission == 'granted') {
            var title = message['title'] || 'MaxQ';
            var icon = message['icon'] || '/favicon.ico';
            var notification = new Notification(
                title, {
                    icon: icon,
                    body: message['body']
                }
            );
            if ('onclick' in message)
                notification.onclick = message['onclick'];
        } else {
            Notification.requestPermission();
        }
    }
};

window.onload = MaxQ.load;