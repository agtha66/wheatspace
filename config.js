// Public runtime config only. Never put provider API keys or service-role keys here.
window.WHEATSPACE_CONFIG = {
    // The Pages workflow replaces this with public Supabase project settings.
    // Keep the local Express defaults for development.
    apiBase: '/api',
    publishableKey: ''
};

// Supabase's publishable key is public configuration. Attach it only to calls
// made to this app's configured API, never to third-party requests.
(() => {
    const config = window.WHEATSPACE_CONFIG;
    if (!config.publishableKey || !config.apiBase) return;
    const nativeFetch = window.fetch.bind(window);
    window.fetch = (input, init = {}) => {
        const requestUrl = input instanceof Request ? input.url : String(input);
        if (!requestUrl.startsWith(config.apiBase)) return nativeFetch(input, init);
        const headers = new Headers(input instanceof Request ? input.headers : undefined);
        new Headers(init.headers).forEach((value, key) => headers.set(key, value));
        headers.set('apikey', config.publishableKey);
        return nativeFetch(input, { ...init, headers });
    };
})();
