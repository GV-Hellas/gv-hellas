type TurnstileApi = {
    render: (
        container: HTMLElement,
        options: {
            sitekey: string;
            action?: string;
            theme?: 'light' | 'dark' | 'auto';
            size?: 'normal' | 'compact' | 'flexible';
            appearance?: 'always' | 'execute' | 'interaction-only';
            callback?: (token: string) => void;
            'expired-callback'?: () => void;
            'error-callback'?: () => void;
        }
    ) => string;

    reset: (widgetId?: string) => void;
    remove: (widgetId?: string) => void;
};

declare global {
    interface Window {
        turnstile?: TurnstileApi;
    }
}

export {};