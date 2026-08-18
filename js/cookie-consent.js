(() => {
    const storageKey = 'veritium_cookie_consent_v1';
    const language = document.documentElement.lang === 'en' ? 'en' : 'de';
    const privacyHref = 'data-protection.html';
    const measurementId = typeof window.VERITIUM_GA_MEASUREMENT_ID === 'string'
        ? window.VERITIUM_GA_MEASUREMENT_ID.trim()
        : '';
    const copy = {
        de: {
            title: 'Datenschutz-Einstellungen',
            bannerText: 'Wir verwenden notwendige lokale Speicherung, um Ihre Auswahl zu merken. Optionale Analyse wird nur nach ausdrücklicher Zustimmung geladen.',
            details: 'Details ansehen',
            necessary: 'Notwendig',
            necessaryText: 'Speichert Ihre Einwilligung und grundlegende Einstellungen. Diese Speicherung ist für den Betrieb des Banners erforderlich.',
            optional: 'Optionale Analyse',
            optionalText: 'Wird nur nach ausdrücklicher Zustimmung geladen. Derzeit ist noch keine Mess-ID konfiguriert.',
            alwaysActive: 'Immer aktiv',
            notActive: 'Derzeit nicht verwendet',
            reject: 'Alle ablehnen',
            save: 'Auswahl speichern',
            accept: 'Alle akzeptieren',
            settings: 'Cookie-Einstellungen',
            close: 'Schließen',
            privacy: 'Datenschutzerklärung',
            modalIntro: 'Wählen Sie, welche optionalen Speicherungen Sie zulassen möchten. Ihre Auswahl kann jederzeit über den Footer geändert werden.'
        },
        en: {
            title: 'Privacy settings',
            bannerText: 'We use necessary local storage to remember your choice. Optional analytics is loaded only after explicit consent.',
            details: 'View details',
            necessary: 'Necessary',
            necessaryText: 'Stores your consent and basic settings. This storage is required for the consent interface to work.',
            optional: 'Optional analytics',
            optionalText: 'Loaded only after explicit consent. No Measurement ID is configured yet.',
            alwaysActive: 'Always active',
            notActive: 'Not currently used',
            reject: 'Reject all',
            save: 'Save selection',
            accept: 'Accept all',
            settings: 'Cookie settings',
            close: 'Close',
            privacy: 'Data protection',
            modalIntro: 'Choose which optional storage categories you want to allow. You can change your choice at any time from the footer.'
        }
    }[language];

    if (measurementId) {
        copy.optionalText = language === 'de'
            ? 'Google Analytics 4 wird nur nach ausdrücklicher Zustimmung geladen. Werbefunktionen bleiben deaktiviert.'
            : 'Google Analytics 4 is loaded only after explicit consent. Advertising features remain disabled.';
    }

    const readConsent = () => {
        try {
            const stored = window.localStorage.getItem(storageKey);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            return null;
        }
    };

    const storeConsent = (analytics = false) => {
        try {
            window.localStorage.setItem(storageKey, JSON.stringify({
                necessary: true,
                analytics: Boolean(analytics),
                updatedAt: new Date().toISOString()
            }));
        } catch (error) {
            // If storage is blocked, the current choice still applies for this visit.
        }

        updateGoogleConsent(Boolean(analytics));
    };

    const clearAnalyticsCookies = () => {
        document.cookie.split(';').forEach((cookie) => {
            const name = cookie.split('=')[0].trim();
            if (/^_ga(?:_|$)/.test(name)) {
                document.cookie = `${name}=; Max-Age=0; path=/`;
            }
        });
    };

    const unloadGoogleAnalytics = () => {
        const script = document.querySelector('script[data-veritium-google-analytics]');
        if (script) script.remove();
    };

    const updateGoogleConsent = (analyticsGranted) => {
        if (typeof window.gtag === 'function') {
            window.gtag('consent', 'update', {
                analytics_storage: analyticsGranted ? 'granted' : 'denied',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied'
            });
        }
        if (!analyticsGranted) {
            clearAnalyticsCookies();
            unloadGoogleAnalytics();
        }
    };

    const loadGoogleAnalytics = () => {
        if (!measurementId || document.querySelector('script[data-veritium-google-analytics]')) return;

        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function gtag() {
            window.dataLayer.push(arguments);
        };
        window.gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
        });
        window.gtag('consent', 'update', {
            analytics_storage: 'granted',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
        });
        window.gtag('js', new Date());
        window.gtag('config', measurementId, {
            allow_google_signals: false,
            allow_ad_personalization_signals: false
        });

        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
        script.dataset.veritiumGoogleAnalytics = 'true';
        document.head.appendChild(script);
    };

    const createElement = (tag, className, html = '') => {
        const element = document.createElement(tag);
        if (className) element.className = className;
        element.innerHTML = html;
        return element;
    };

    let banner;
    let modal;
    let lastFocusedElement;

    const showBanner = () => {
        if (banner) banner.hidden = false;
    };

    const hideBanner = () => {
        if (banner) banner.hidden = true;
    };

    const closeModal = () => {
        if (!modal) return;
        modal.hidden = true;
        document.body.classList.remove('cookie-consent-modal-open');
        if (!readConsent()) showBanner();
        const returnTarget = lastFocusedElement && !lastFocusedElement.hidden
            ? lastFocusedElement
            : banner && banner.querySelector('.cookie-consent-details');
        if (returnTarget && typeof returnTarget.focus === 'function') {
            returnTarget.focus();
        }
    };

    const openModal = () => {
        if (!modal) return;
        const analyticsCheckbox = modal.querySelector('#cookie-analytics');
        const consent = readConsent();
        if (analyticsCheckbox) {
            analyticsCheckbox.checked = Boolean(consent && consent.analytics && measurementId);
        }
        lastFocusedElement = document.activeElement;
        hideBanner();
        modal.hidden = false;
        document.body.classList.add('cookie-consent-modal-open');
        modal.querySelector('.cookie-consent-close').focus();
    };

    const saveAndClose = (analytics = false) => {
        storeConsent(analytics);
        if (analytics) loadGoogleAnalytics();
        closeModal();
        hideBanner();
    };

    const addFooterTrigger = () => {
        const footer = document.querySelector('.footer-links, .document-footer nav');
        if (!footer || footer.querySelector('.cookie-settings-trigger')) return;
        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'cookie-settings-trigger';
        trigger.textContent = copy.settings;
        trigger.addEventListener('click', openModal);
        footer.appendChild(trigger);
    };

    const buildBanner = () => {
        banner = createElement('aside', 'cookie-consent-banner');
        banner.id = 'cookie-consent-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-labelledby', 'cookie-consent-title');
        banner.innerHTML = `
            <div class="cookie-consent-copy">
                <p class="cookie-consent-eyebrow">Veritium · privacy</p>
                <h2 id="cookie-consent-title">${copy.title}</h2>
                <p>${copy.bannerText} <a href="${privacyHref}">${copy.privacy}</a>.</p>
            </div>
            <div class="cookie-consent-actions">
                <button type="button" class="cookie-consent-link cookie-consent-details">${copy.details}</button>
                <button type="button" class="cookie-consent-secondary cookie-consent-reject">${copy.reject}</button>
                <button type="button" class="cookie-consent-primary cookie-consent-accept">${copy.accept}</button>
            </div>
        `;
        document.body.appendChild(banner);

        banner.querySelector('.cookie-consent-details').addEventListener('click', openModal);
        banner.querySelector('.cookie-consent-reject').addEventListener('click', () => saveAndClose(false));
        banner.querySelector('.cookie-consent-accept').addEventListener('click', () => saveAndClose(Boolean(measurementId)));
    };

    const buildModal = () => {
        modal = createElement('div', 'cookie-settings-modal');
        modal.id = 'cookie-settings-modal';
        modal.hidden = true;
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'cookie-settings-title');
        modal.innerHTML = `
            <div class="cookie-settings-backdrop" data-cookie-close="true"></div>
            <div class="cookie-settings-dialog" role="document">
                <button type="button" class="cookie-consent-close" aria-label="${copy.close}">&times;</button>
                <p class="cookie-consent-eyebrow">Veritium · privacy</p>
                <h2 id="cookie-settings-title">${copy.title}</h2>
                <p class="cookie-settings-intro">${copy.modalIntro}</p>
                <div class="cookie-category cookie-category--required">
                    <div>
                        <h3>${copy.necessary}</h3>
                        <p>${copy.necessaryText}</p>
                    </div>
                    <span class="cookie-category-status">${copy.alwaysActive}</span>
                </div>
                <div class="cookie-category">
                    <div>
                        <h3>${copy.optional}</h3>
                        <p>${copy.optionalText}</p>
                    </div>
                    <label class="cookie-toggle">
                        <input type="checkbox" id="cookie-analytics" aria-label="${copy.optional}" ${measurementId ? '' : 'disabled'}>
                        <span class="cookie-toggle-track" aria-hidden="true"></span>
                        <span class="sr-only">${copy.notActive}</span>
                    </label>
                </div>
                <div class="cookie-settings-actions">
                    <button type="button" class="cookie-consent-secondary cookie-modal-reject">${copy.reject}</button>
                    <button type="button" class="cookie-consent-secondary cookie-modal-save">${copy.save}</button>
                    <button type="button" class="cookie-consent-primary cookie-modal-accept">${copy.accept}</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.cookie-consent-close').addEventListener('click', closeModal);
        modal.querySelector('[data-cookie-close]').addEventListener('click', closeModal);
        modal.querySelector('.cookie-modal-reject').addEventListener('click', () => saveAndClose(false));
        modal.querySelector('.cookie-modal-save').addEventListener('click', () => saveAndClose(Boolean(modal.querySelector('#cookie-analytics').checked)));
        modal.querySelector('.cookie-modal-accept').addEventListener('click', () => saveAndClose(Boolean(measurementId)));
    };

    const init = () => {
        addFooterTrigger();
        buildBanner();
        buildModal();
        const consent = readConsent();
        const analyticsCheckbox = modal.querySelector('#cookie-analytics');
        if (analyticsCheckbox) analyticsCheckbox.checked = Boolean(consent && consent.analytics && measurementId);
        if (consent) {
            hideBanner();
            if (consent.analytics) loadGoogleAnalytics();
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && modal && !modal.hidden) closeModal();
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
})();
