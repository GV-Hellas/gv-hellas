import { register, init, t, locale } from 'svelte-i18n';

register('el', () =>
    Promise.resolve({
        nav: {
            home: 'Αρχική',
            events: 'Εκδηλώσεις',
            links: 'Χρήσιμοι Σύνδεσμοι',
            gallery: 'Οπτικοακουστικό Υλικό',
            contact: 'Επικοινωνία',
            businesses: 'Ελληνοφωνες Επιχειρήσεις',
            equipment: 'Ενοικίαση Εξοπλισμού',
            church: 'Πρόγραμμα Εκκλησίας Olten',
            community: 'Κοινότητα',
            services: 'Πληροφορίες & Υπηρεσίες'
        },
        home: {
            welcomeTitle: 'Καλώς ήρθατε στην ιστοσελίδα μας!',
            welcomeSubtitle: 'Σύλλογος ομογενών Ελλήνων Rothrist',
            aboutHeadline: 'Σύλλογος ομογενών του Rothrist',
            aboutText:
                'Ιδρυμένος το 2019, ο σύλλογος μας έχει στόχο τη διατήρηση και προώθηση των ελληνικών παραδοσεων, της γλώσσας και του πολιτισμού στην Ελβετία.',
            activitiesHeadline: 'Δράσεις',
            activitiesIntro:
                'Σκοπός του Συλλόγου είναι η ενεργός παρέμβασή του στα πολιτιστικά δρώμενα της κοινότητας των Ελλήνων ομογενών του Rothrist, η αξιοποίηση και διάσωση των ζωντανών στοιχείων της παράδοσης και του λαϊκού μας πολιτισμού όπως οι χοροί τα τραγούδια και έθιμα, η ελληνική γλώσσα, διοργανώνοντας δράσεις σχετικές με τις παρακάτω θεματικές ενότητες:',
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
            description: 'Εδώ θα δημοσιεύουμε το πρόγραμμα της εκκλησίας στο Olten.',
            schedule: {
                meta: {
                    line1: 'ΟΙΚΟΥΜΕΝΙΚΟΝ ΠΑΤΡΙΑΡΧΕΙΟΝ',
                    line2: 'ΙΕΡΑ ΜΗΤΡΟΠΟΛΙΣ ΕΛΒΕΤΙΑΣ',
                    parishLine1: 'ΕΛΛΗΝΙΚΗ ΟΡΘΟΔΟΞΟΣ ΕΝΟΡΙΑ',
                    parishLine2: 'ΑΓΙΟΥ ΓΕΩΡΓΙΟΥ OLTEN',
                    address: 'Klosterplatz 8, 4600 Olten'
                },
                program: {
                    title: 'ΠΡΟΓΡΑΜΜΑ ΙΕΡΩΝ ΑΚΟΛΟΥΘΙΩΝ',
                    subtitle: 'ΑΓΙΑΣ ΚΑΙ ΜΕΓΑΛΗΣ ΕΒΔΟΜΑΔΟΣ 2025'
                },
                table: {
                    date: 'Ημερομηνία',
                    service: 'Ακολουθία',
                    time: 'Ώρα'
                },
                entries: [
                    {
                        date: '13.04.2025',
                        service: 'Κυριακή των Βαΐων — Όρθρος και Θεία Λειτουργία',
                        time: '10.00'
                    },
                    {
                        date: '16.04.2025',
                        service: 'Μεγάλη Τετάρτη — Ιερόν Ευχέλαιο',
                        time: '19.00'
                    },
                    {
                        date: '17.04.2025',
                        service: 'Μεγάλη Πέμπτη — Ακολουθία Παθών',
                        time: '20.00'
                    },
                    {
                        date: '18.04.2025',
                        service: 'Μεγάλη Παρασκευή — Ακολουθία Επιταφίου',
                        time: '20.15'
                    },
                    {
                        date: '19.04.2025',
                        service: 'Μέγα Σάββατο — Θεία Λειτουργία Μ. Βασιλείου',
                        time: '09.00'
                    }
                ],
                highlight: {
                    date: '19.04.2025',
                    text: 'Μέγα Σάββατο — Όρθρος και Θεία Λειτουργία του ΠΑΣΧΑ',
                    time: '23.00'
                },
                greeting: 'Καλό και ευλογημένο Πάσχα',
                signature: [
                    '+Αρχιμανδρίτης Φανούριος Θολιώτης',
                    'Πρωτοσύγκελλος Ι. Μ. Ελβετίας',
                    'Εφημέριος Olten'
                ]
            }
        }
    })
);

register('de', () =>
    Promise.resolve({
        nav: {
            home: 'Startseite',
            events: 'Veranstaltungen',
            links: 'Nützliche Links',
            gallery: 'Fotos und Videos',
            contact: 'Kontakt',
            businesses: 'Griechischsprachige Unternehmen',
            equipment: 'Materialvermietung',
            church: 'Kirchenprogramm Olten',
            community: 'Vereinsleben',
            services: 'Infos & Services'
        },
        home: {
            welcomeTitle: 'Willkommen auf unserer Webseite!',
            welcomeSubtitle: 'Griechischer Verein der Auswanderer von Rothrist',
            aboutHeadline: 'Verein der Auslandgriechen von Rothrist',
            aboutText:
                'Gegründet 2019 hat unser Verein das Ziel, die griechischen Traditionen, Sprache und Kultur in der Schweiz zu pflegen und zu fördern.',
            activitiesHeadline: 'Aktivitäten',
            activitiesIntro:
                'Ziel des Vereins ist die aktive Mitwirkung am kulturellen Leben der griechischen Gemeinde in Rothrist sowie die Pflege und Bewahrung lebendiger Elemente unserer Tradition und Volkskultur – wie Tänze, Lieder, Bräuche und die griechische Sprache – durch Aktionen zu den folgenden Themenschwerpunkten:',
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
            description: 'Hier werden wir das Programm der Kirche in Olten veröffentlichen.',
            schedule: {
                meta: {
                    line1: 'Ökumenisches Patriarchat',
                    line2: 'Heilige Metropolis der Schweiz',
                    parishLine1: 'Griechisch-Orthodoxe Gemeinde',
                    parishLine2: 'Heiliger Georgios Olten',
                    address: 'Klosterplatz 8, 4600 Olten'
                },
                program: {
                    title: 'Programm der Gottesdienste',
                    subtitle: 'Karwoche und Ostern 2025'
                },
                table: {
                    date: 'Datum',
                    service: 'Gottesdienst',
                    time: 'Uhrzeit'
                },
                entries: [
                    {
                        date: '13.04.2025',
                        service: 'Palmsonntag — Liturgie',
                        time: '10.00 Uhr'
                    },
                    {
                        date: '16.04.2025',
                        service: 'Mittwoch — Krankensalbung (efchelaion)',
                        time: '19.00 Uhr'
                    },
                    {
                        date: '17.04.2025',
                        service: 'Gründonnerstag — Die Heilige Passion: die 12 Evangelien',
                        time: '20.00 Uhr'
                    },
                    {
                        date: '18.04.2025',
                        service: 'Karfreitag — Epitaphios',
                        time: '20.15 Uhr'
                    },
                    {
                        date: '19.04.2025',
                        service: 'Karsamstag — S. Basilius Liturgie',
                        time: '09.00 Uhr'
                    }
                ],
                highlight: {
                    date: '19.04.2025',
                    text: 'Karsamstag — Orthros und Ostern Liturgie',
                    time: '23.00 Uhr'
                },
                greeting: 'Frohe und gesegnete Ostern',
                signature: [
                    '+Archimandrit Fanourios Tholiotis',
                    'Protosynkellos der Heiligen Metropolis der Schweiz',
                    'Pfarrer Olten'
                ]
            }
        }
    })
);

init({
    fallbackLocale: 'el',
    initialLocale: 'el'
});

export { t, locale };