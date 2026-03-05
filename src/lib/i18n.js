import {register, init, getLocaleFromNavigator, t, locale} from 'svelte-i18n';

register('el', () => Promise.resolve({
    nav: {
        home: 'Αρχική',
        events: 'Εκδηλώσεις',
        links: 'Χρήσιμοι Σύνδεσμοι',
        gallery: 'Οπτικοακουστικό Υλικό',
        contact: 'Επικοινωνία',
        businesses: 'Ελληνοφωνες Επιχειρήσεις',
        equipment: 'Ενοικίαση Εξοπλισμού',
        church: 'Πρόγραμμα Εκκλησίας Olten'
    },
    home: {
        welcomeTitle: 'Καλώς ήρθατε στην ιστοσελίδα μας!',
        welcomeSubtitle: 'Σύλλογος ομογενών Ελλήνων Rothrist',
        aboutHeadline: 'Σύλλογος ομογενών του Rothrist',
        aboutText: 'Ιδρυμένος το 2019, ο σύλλογος μας έχει στόχο τη διατήρηση και προώθηση των ελληνικών παραδοσεων, της γλώσσας και του πολιτισμού στην Ελβετία.',
        activitiesHeadline: 'Δράσεις',
        sponsorsHeadline: 'Ευγενικοί χορηγοί'
    },
    events: {
        headline: 'Εκδηλώσεις',
        upcoming: 'Επερχόμενες εκδηλώσεις',
        past: 'Παρελθόντα γεγονότα',
        readMore: 'Περισσότερα'
    },
    links: {
        headline: 'Χρήσιμοι Σύνδεσμοι'
    },
    gallery: {
        headline: 'Οπτικοακουστικό Υλικό'
    },
    contact: {
        headline: 'Επικοινωνία',
        formHeadline: 'Στείλτε μας ένα μήνυμα',
        name: 'Ονοματεπώνυμο',
        email: 'Email',
        phone: 'Τηλέφωνο',
        message: 'Μήνυμα',
        send: 'Αποστολή',
        address: 'Διεύθυνση',
        phoneContact: 'Τηλέφωνο Επικοινωνίας',
        followUs: 'Ακολουθήστε μας'
    },
    businesses: {
        headline: 'Ελληνοφωνες Επιχειρήσεις',
        thanks: 'Ευχαριστούμε θερμά τους χορηγούς μας για την υποστήριξή τους.'
    },
    equipment: {
        headline: 'Ενοικίαση Εξοπλισμού',
        description: 'Σύντομα θα προστεθούν πληροφορίες σχετικά με τη δυνατότητα ενοικίασης εξοπλισμού.'
    },
    church: {
        headline: 'Πρόγραμμα Εκκλησίας Olten',
        description: 'Εδώ θα δημοσιεύουμε το πρόγραμμα της εκκλησίας στο Olten.'
    }
}));

register('de', () => Promise.resolve({
    nav: {
        home: 'Startseite',
        events: 'Veranstaltungen',
        links: 'Nützliche Links',
        gallery: 'Fotos und Videos',
        contact: 'Kontakt',
        businesses: 'Griechischsprachige Unternehmen',
        equipment: 'Materialvermietung',
        church: 'Kirchenprogramm Olten'
    },
    home: {
        welcomeTitle: 'Willkommen auf unserer Webseite!',
        welcomeSubtitle: 'Griechischer Verein der Auswanderer von Rothrist',
        aboutHeadline: 'Verein der Auslandgriechen von Rothrist',
        aboutText: 'Gegründet 2019 hat unser Verein das Ziel, die griechischen Traditionen, Sprache und Kultur in der Schweiz zu pflegen und zu fördern.',
        activitiesHeadline: 'Aktivitäten',
        sponsorsHeadline: 'Liebenswürdige Sponsoren'
    },
    events: {
        headline: 'Veranstaltungen',
        upcoming: 'Bevorstehende Veranstaltungen',
        past: 'Vergangene Veranstaltungen',
        readMore: 'Mehr lesen'
    },
    links: {
        headline: 'Nützliche Links'
    },
    gallery: {
        headline: 'Fotos und Videos'
    },
    contact: {
        headline: 'Kontakt',
        formHeadline: 'Schicken Sie uns eine Nachricht',
        name: 'Name',
        email: 'Email',
        phone: 'Telefon',
        message: 'Nachricht',
        send: 'Senden',
        address: 'Adresse',
        phoneContact: 'Telefonischer Kontakt',
        followUs: 'Folgen Sie uns'
    },
    businesses: {
        headline: 'Griechischsprachige Unternehmen',
        thanks: 'Wir möchten unseren Sponsoren herzlich für ihre wertvolle Unterstützung danken.'
    },
    equipment: {
        headline: 'Materialvermietung',
        description: 'Bald werden Informationen zur Mietausrüstung verfügbar sein.'
    },
    church: {
        headline: 'Kirchenprogramm Olten',
        description: 'Hier werden wir das Programm der Kirche in Olten veröffentlichen.'
    }
}));

init({
    fallbackLocale: 'el',
    initialLocale: getLocaleFromNavigator()
});

export {t, locale};