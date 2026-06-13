// src/lib/i18n.ts
import {register, init, t, locale, json} from 'svelte-i18n';

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
        admin: {
            label: 'ADMIN',
            dashboard: {
                title: 'Πίνακας διαχείρισης',
                subtitle: 'Διαχειριστείτε το περιεχόμενο του ιστότοπου γρήγορα και καθαρά.',
                quickActions: 'Γρήγορες ενέργειες',
                createEvent: 'Νέα εκδήλωση',
                editPages: 'Επεξεργασία σελίδων',
                manageGallery: 'Διαχείριση υλικού'
            },
            events: {
                title: 'Διαχείριση εκδηλώσεων',
                subtitle: 'Δημιουργία, επεξεργασία και δημοσίευση εκδηλώσεων.',
                newEvent: 'Νέα εκδήλωση',
                table: {
                    title: 'Τίτλος',
                    date: 'Ημερομηνία',
                    status: 'Κατάσταση',
                    featured: 'Προβολή αρχικής',
                    actions: 'Ενέργειες'
                },
                status: {
                    draft: 'Πρόχειρο',
                    published: 'Δημοσιευμένο'
                },
                actions: {
                    edit: 'Επεξεργασία',
                    preview: 'Προεπισκόπηση'
                },
                empty: 'Δεν υπάρχουν ακόμη εκδηλώσεις.',
                deleteDialog: {
                    title: 'Διαγραφή εκδήλωσης;',
                    description: 'Αυτή η ενέργεια δεν μπορεί να αναιρεθεί. Η επιλεγμένη εκδήλωση θα διαγραφεί οριστικά.',
                    confirm: 'Διαγραφή εκδήλωσης',
                    deleting: 'Διαγραφή…'
                },
                toast: {
                    deleted: 'Η εκδήλωση διαγράφηκε',
                    deleteFailed: 'Δεν ήταν δυνατή η διαγραφή της εκδήλωσης'
                }
            },
            links: {
                title: 'Σύνδεσμοι',
                subtitle: 'Διαχείριση χρήσιμων εξωτερικών συνδέσμων και λογοτύπων.',
                createNew: 'Δημιουργία νέου',
                empty: 'Δεν υπάρχουν ακόμη σύνδεσμοι.',

                table: {
                    logo: 'Λογότυπο',
                    title: 'Τίτλος',
                    url: 'URL',
                    actions: 'Ενέργειες'
                },

                actions: {
                    edit: 'Επεξεργασία'
                },

                deleteDialog: {
                    title: 'Διαγραφή συνδέσμου;',
                    description: 'Αυτή η ενέργεια δεν μπορεί να αναιρεθεί. Ο επιλεγμένος σύνδεσμος θα διαγραφεί οριστικά.',
                    confirm: 'Διαγραφή συνδέσμου',
                    deleting: 'Διαγραφή…'
                },

                toast: {
                    deleted: 'Ο σύνδεσμος διαγράφηκε',
                    deleteFailed: 'Δεν ήταν δυνατή η διαγραφή του συνδέσμου'
                },

                form: {
                    createTitle: 'Δημιουργία συνδέσμου',
                    editTitle: 'Επεξεργασία συνδέσμου',
                    subtitle: 'Προσθέστε δίγλωσσο τίτλο, URL προορισμού και προαιρετικό λογότυπο.',
                    detailsTitle: 'Στοιχεία συνδέσμου',
                    detailsDescription: 'Ο ελληνικός τίτλος χρησιμοποιείται ως κύρια ετικέτα στη διαχείριση.',
                    nameEl: 'Τίτλος - EL',
                    nameDe: 'Τίτλος - DE',
                    nameElPlaceholder: 'Τίτλος',
                    nameDePlaceholder: 'Titel',
                    url: 'URL',
                    logoUpload: 'Ανέβασμα λογοτύπου',
                    logoPreview: 'Προεπισκόπηση λογοτύπου',
                    currentLogoHint: 'Τρέχον λογότυπο. Ανεβάστε νέο αρχείο μόνο αν θέλετε να το αντικαταστήσετε.',
                    createButton: 'Δημιουργία συνδέσμου',
                    saveButton: 'Αποθήκευση αλλαγών',
                    descriptionHtml: 'Περιγραφή',
                    validationNameEl: 'Το πεδίο Τίτλου-EL είναι υποχρεωτικό.',
                    validationNameDe: 'Το πεδίο Τίτλου-DE είναι υποχρεωτικό.',
                    validationUrl: 'Το πεδίο είναι υποχρεωτικό και πρέπει να είναι έγκυρο URL.'
                }
            },
            login: {
                title: 'Σύνδεση CMS Admin',
                username: 'Όνομα χρήστη',
                password: 'Κωδικός πρόσβασης',
                submit: 'Σύνδεση'
            },
            form: {
                languageHint: 'Πρώτα εισάγετε το περιεχόμενο στα Ελληνικά και κατόπιν στα Γερμανικά.',
                createEvent: 'Δημιουργία εκδήλωσης',
                editEvent: 'Επεξεργασία εκδήλωσης',
                saveChanges: 'Αποθήκευση αλλαγών',
                title: 'Τίτλος',
                description: 'Σύντομη περιγραφή',
                date: 'Ημερομηνία',
                pickDate: 'Επιλέξτε ημερομηνία',
                dateRequired: 'Παρακαλώ επιλέξτε ημερομηνία',
                time: 'Ώρα',
                location: 'Τοποθεσία',
                category: 'Κατηγορία',
                priceMembers: 'Τιμή μελών CHF',
                pricePublic: 'Τιμή κοινού CHF',
                addSection: 'Προσθήκη ενότητας',
                saveEvent: 'Αποθήκευση εκδήλωσης',
                saving: 'Αποθήκευση…',
                couldNotSave: 'Δεν ήταν δυνατή η αποθήκευση της εκδήλωσης',
                saved: 'Αποθηκεύτηκε',
                section: 'Ενότητα',
                removeSection: 'Αφαίρεση',
                textBeforeMedia: 'Κείμενο πριν από το υλικό',
                textAfterMedia: 'Κείμενο μετά το υλικό'
            }
        },
        home: {
            welcomeTitle: 'Καλώς ήρθατε στην ιστοσελίδα μας!',
            welcomeSubtitle: 'Σύλλογος ομογενών Ελλήνων Rothrist',
            aboutHeadline: 'Σύλλογος ομογενών του Rothrist',
            aboutText: 'Ιδρυμένος το 2019, ο σύλλογος μας έχει στόχο τη διατήρηση και προώθηση των ελληνικών παραδοσεων, της γλώσσας και του πολιτισμού στην Ελβετία.',
            activitiesHeadline: 'Δράσεις',
            activitiesIntro: 'Σκοπός του Συλλόγου είναι η ενεργός παρέμβασή του στα πολιτιστικά δρώμενα της κοινότητας των Ελλήνων ομογενών του Rothrist, η αξιοποίηση και διάσωση των ζωντανών στοιχείων της παράδοσης και του λαϊκού μας πολιτισμού όπως οι χοροί τα τραγούδια και έθιμα, η ελληνική γλώσσα, διοργανώνοντας δράσεις σχετικές με τις παρακάτω θεματικές ενότητες:',
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

            ui: {
                currentHeading: 'Πρόγραμμα 2025–2026',
                previousHeading: 'Πρόγραμμα 2025 (Αγία & Μεγάλη Εβδομάδα)',
                showPrevious: 'Εμφάνιση προηγούμενου προγράμματος',
                hidePrevious: 'Απόκρυψη προηγούμενου προγράμματος'
            },

            schedules: {
                // NEW (published): Program year 2025–2026 + Holy Week 2026
                current: {
                    meta: {
                        lines: ['ΟΙΚΟΥΜΕΝΙΚΟΝ ΠΑΤΡΙΑΡΧΕΙΟΝ', 'ΙΕΡΑ ΜΗΤΡΟΠΟΛΙΣ ΕΛΒΕΤΙΑΣ'],
                        parish: 'ΕΝΟΡΙΑ ΑΓΙΟΥ ΓΕΩΡΓΙΟΥ OLTEN',
                        address: 'Kapuzinerkloster, Klosterplatz 8, 4600 Olten'
                    },
                    program: {
                        title: 'ΠΡΟΓΡΑΜΜΑ ΙΕΡΩΝ ΑΚΟΛΟΥΘΙΩΝ',
                        subtitle: 'ΙΕΡΟΥ ΝΑΟΥ ΑΓΙΟΥ ΓΕΩΡΓΙΟΥ OLTEN (KAPUZINERKLOSTER) — ΕΤΟΥΣ 2025–2026'
                    },
                    table: {
                        date: 'Ημερομηνία',
                        event: 'Εορτή / Ακολουθία',
                        service: 'Τύπος',
                        time: 'Ώρα'
                    },
                    sections: [
                        {
                            title: 'ΕΤΟΥΣ 2025–2026',
                            rows: [
                                {
                                    date: '14.09.2025',
                                    event: 'Εορτή της Υψώσεως',
                                    service: 'Θ. Λειτουργία',
                                    time: '10.00'
                                },
                                {
                                    date: '05.10.2025',
                                    event: "Κυριακή Β' Λουκά",
                                    service: 'Θ. Λειτουργία',
                                    time: '10.00'
                                },
                                {
                                    date: '16.11.2025',
                                    event: 'Του Αγίου Αποστόλου Ματθαίου',
                                    service: 'Θ. Λειτουργία',
                                    time: '10.00'
                                },
                                {
                                    date: '25.12.2025',
                                    event: 'ΧΡΙΣΤΟΥΓΕΝΝΑ',
                                    service: 'Θ. Λειτουργία',
                                    time: '10.00',
                                    emphasis: true
                                },
                                {
                                    date: '18.01.2026',
                                    event: "Κυριακή ΙΒ' Λουκά",
                                    service: 'Θ. Λειτουργία',
                                    time: '10.00'
                                },
                                {
                                    date: '15.02.2026',
                                    event: 'Κυριακή της Απόκρεω',
                                    service: 'Θ. Λειτουργία',
                                    time: '10.00'
                                },
                                {
                                    date: '22.03.2026',
                                    event: "Κυριακή Δ' Νηστειών",
                                    service: 'Θ. Λειτουργία',
                                    time: '10.00'
                                },
                                {
                                    date: '05.04.2026',
                                    event: 'Κυριακή των Βαΐων',
                                    service: 'Θ. Λειτουργία',
                                    time: '10.00'
                                }
                            ]
                        },
                        {
                            title: 'ΑΓΙΑ ΚΑΙ ΜΕΓΑΛΗ ΕΒΔΟΜΑΔΑ 2026',
                            rows: [
                                {
                                    date: '08.04.2026',
                                    event: 'Μ. Τετάρτη — Ιερό Ευχέλαιο',
                                    service: '',
                                    time: '17.30–18.45',
                                    note:
                                        "(κατ’ εξαίρεση για φέτος διότι το Kapuzinerkloster θα χρησιμοποιηθεί από τους υπευθύνους του)"
                                },
                                {
                                    date: '09.04.2026',
                                    event: 'Μ. Πέμπτη — Ακολουθία Παθών',
                                    service: '',
                                    time: '20.00'
                                },
                                {
                                    date: '10.04.2026',
                                    event: 'Μ. Παρασκευή — Επιτάφιος Θρήνος',
                                    service: '',
                                    time: '20.00'
                                },
                                {
                                    date: '11.04.2026',
                                    event: 'Μ. Σάββατο — Θ. Λειτουργία',
                                    service: '',
                                    time: '09.00'
                                }
                            ],
                            highlight: {
                                date: '11.04.2026',
                                title: 'Μεγάλο Σάββατο',
                                text: 'Παννυχίδα ΑΝΑΣΤΑΣΕΩΣ, Όρθρος και Θ. Λειτουργία του ΠΑΣΧΑ',
                                time: '23.00'
                            }
                        },
                        {
                            title: '',
                            rows: [
                                {
                                    date: '17.05.2026',
                                    event: 'Κυριακή του Τυφλού',
                                    service: 'Θ. Λειτουργία',
                                    time: '10.00'
                                },
                                {
                                    date: '07.06.2026',
                                    event: 'Κυριακή των Αγ. Πάντων',
                                    service: 'Θ. Λειτουργία',
                                    time: '10.00'
                                }
                            ]
                        }
                    ],
                    signature: {
                        lines: [
                            "Μετ’ ευχών εγκαρδίων διατελλώ,",
                            '+ Ο Επίσκοπος Τυάνων Φανούριος',
                            'Επόπτης Γερμανοφώνου Ελβετίας',
                            'Υπεύθυνος της Ελληνικής Ορθοδόξου ενορίας Αγίου Γεωργίου Olten.'
                        ]
                    },
                    contact: {
                        heading: 'Στοιχεία επικοινωνίας',
                        phoneLabel: 'Τηλ. Επικοινωνίας',
                        emailLabel: 'E-mail',
                        facebookLabel: 'Facebook',
                        facebookName: 'Ορθόδοξη Εκκλησία Ολτεν',
                        phone: '0041 (0) 76 574 96 41',
                        email: 'p.fanourios@hotmail.com',
                        // Replace with your exact Facebook page URL if you have it (you mentioned you do).
                        facebookUrl:
                            'https://www.facebook.com/search/top/?q=%CE%9F%CF%81%CE%B8%CF%8C%CE%B4%CE%BF%CE%BE%CE%B7%20%CE%95%CE%BA%CE%BA%CE%BB%CE%B7%CF%83%CE%AF%CE%B1%20%CE%9F%CE%BB%CF%84%CE%B5%CE%BD'
                    }
                },

                // OLD: Holy Week / Easter 2025 (kept for history, hidden by default)
                previous: {
                    meta: {
                        lines: ['ΟΙΚΟΥΜΕΝΙΚΟΝ ΠΑΤΡΙΑΡΧΕΙΟΝ', 'ΙΕΡΑ ΜΗΤΡΟΠΟΛΙΣ ΕΛΒΕΤΙΑΣ'],
                        parish: 'ΕΛΛΗΝΙΚΗ ΟΡΘΟΔΟΞΟΣ ΕΝΟΡΙΑ ΑΓΙΟΥ ΓΕΩΡΓΙΟΥ OLTEN',
                        address: 'Klosterplatz 8, 4600 Olten'
                    },
                    program: {
                        title: 'ΠΡΟΓΡΑΜΜΑ ΙΕΡΩΝ ΑΚΟΛΟΥΘΙΩΝ',
                        subtitle: 'ΑΓΙΑΣ ΚΑΙ ΜΕΓΑΛΗΣ ΕΒΔΟΜΑΔΟΣ 2025'
                    },
                    table: {
                        date: 'Ημερομηνία',
                        event: 'Ακολουθία',
                        service: '',
                        time: 'Ώρα'
                    },
                    sections: [
                        {
                            title: '',
                            rows: [
                                {
                                    date: '13.04.2025',
                                    event: 'Κυριακή των Βαΐων — Όρθρος και Θεία Λειτουργία',
                                    service: '',
                                    time: '10.00'
                                },
                                {
                                    date: '16.04.2025',
                                    event: 'Μεγάλη Τετάρτη — Ιερόν Ευχέλαιο',
                                    service: '',
                                    time: '19.00'
                                },
                                {
                                    date: '17.04.2025',
                                    event: 'Μεγάλη Πέμπτη — Ακολουθία Παθών',
                                    service: '',
                                    time: '20.00'
                                },
                                {
                                    date: '18.04.2025',
                                    event: 'Μεγάλη Παρασκευή — Ακολουθία Επιταφίου',
                                    service: '',
                                    time: '20.15'
                                },
                                {
                                    date: '19.04.2025',
                                    event: 'Μεγάλο Σάββατο — Θεία Λειτουργία Μ. Βασιλείου',
                                    service: '',
                                    time: '09.00'
                                }
                            ],
                            highlight: {
                                date: '19.04.2025',
                                title: 'Μεγάλο Σάββατο',
                                text: 'Όρθρος και Θεία Λειτουργία του ΠΑΣΧΑ',
                                time: '23.00'
                            }
                        }
                    ],
                    greeting: 'Καλό και ευλογημένο Πάσχα',
                    signature: {
                        lines: [
                            '+Αρχιμανδρίτης Φανούριος Θολιώτης',
                            'Πρωτοσύγκελλος Ι. Μ. Ελβετίας',
                            'Εφημέριος Olten'
                        ]
                    },
                    contact: {
                        heading: 'Στοιχεία επικοινωνίας',
                        phoneLabel: 'Τηλ. Επικοινωνίας',
                        emailLabel: 'E-mail',
                        facebookLabel: 'Facebook',
                        facebookName: 'Ορθόδοξη Εκκλησία Ολτεν',
                        phone: '+41 (0) 76 574 96 41',
                        email: 'p.fanourios@hotmail.com',
                        facebookUrl:
                            'https://www.facebook.com/search/top/?q=%CE%9F%CF%81%CE%B8%CF%8C%CE%B4%CE%BF%CE%BE%CE%B7%20%CE%95%CE%BA%CE%BA%CE%BB%CE%B7%CF%83%CE%AF%CE%B1%20%CE%9F%CE%BB%CF%84%CE%B5%CE%BD'
                    }
                }
            }
        },
        common: {
            yes: 'Ναι',
            no: 'Όχι',
            save: 'Αποθήκευση',
            cancel: 'Ακύρωση',
            delete: 'Διαγραφή',
            published: 'Δημοσιευμένο',
            draft: 'Πρόχειρο',
            validationFailed: 'Παρακαλώ ελέγξτε τα πεδία της φόρμας'
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
        admin: {
            label: 'ADMIN',
            dashboard: {
                title: 'Administrationsbereich',
                subtitle: 'Verwalten Sie die Website-Inhalte schnell und übersichtlich.',
                quickActions: 'Schnelle Aktionen',
                createEvent: 'Neue Veranstaltung',
                editPages: 'Seiten bearbeiten',
                manageGallery: 'Medien verwalten'
            },
            events: {
                title: 'Veranstaltungen verwalten',
                subtitle: 'Veranstaltungen erstellen, bearbeiten und veröffentlichen.',
                newEvent: 'Neue Veranstaltung',
                table: {
                    title: 'Titel',
                    date: 'Datum',
                    status: 'Status',
                    featured: 'Startseite',
                    actions: 'Aktionen'
                },
                status: {
                    draft: 'Entwurf',
                    published: 'Veröffentlicht'
                },
                actions: {
                    edit: 'Bearbeiten',
                    preview: 'Vorschau'
                },
                empty: 'Es gibt noch keine Veranstaltungen.',
                deleteDialog: {
                    title: 'Veranstaltung löschen?',
                    description: 'Diese Aktion kann nicht rückgängig gemacht werden. Die ausgewählte Veranstaltung wird dauerhaft gelöscht.',
                    confirm: 'Veranstaltung löschen',
                    deleting: 'Löschen…'
                },
                toast: {
                    deleted: 'Die Veranstaltung wurde gelöscht',
                    deleteFailed: 'Die Veranstaltung konnte nicht gelöscht werden'
                }
            },
            links: {
                title: 'Links',
                subtitle: 'Nützliche externe Links und Logos verwalten.',
                createNew: 'Neu erstellen',
                empty: 'Noch keine Links vorhanden.',

                table: {
                    logo: 'Logo',
                    title: 'Titel',
                    url: 'URL',
                    actions: 'Aktionen'
                },

                actions: {
                    edit: 'Bearbeiten'
                },

                deleteDialog: {
                    title: 'Link löschen?',
                    description: 'Diese Aktion kann nicht rückgängig gemacht werden. Der ausgewählte Link wird dauerhaft gelöscht.',
                    confirm: 'Link löschen',
                    deleting: 'Löschen…'
                },

                toast: {
                    deleted: 'Der Link wurde gelöscht',
                    deleteFailed: 'Der Link konnte nicht gelöscht werden'
                },

                form: {
                    createTitle: 'Link erstellen',
                    editTitle: 'Link bearbeiten',
                    subtitle: 'Fügen Sie einen zweisprachigen Titel, eine Ziel-URL und optional ein Logo hinzu.',
                    detailsTitle: 'Linkdetails',
                    detailsDescription: 'Der griechische Titel wird als primäre Admin-Bezeichnung verwendet.',
                    nameEl: 'Titel - EL',
                    nameDe: 'Titel - DE',
                    nameElPlaceholder: 'Τίτλος',
                    nameDePlaceholder: 'Titel',
                    url: 'URL',
                    logoUpload: 'Logo hochladen',
                    logoPreview: 'Logo-Vorschau',
                    currentLogoHint: 'Aktuelles Logo. Laden Sie nur dann eine neue Datei hoch, wenn Sie es ersetzen möchten.',
                    createButton: 'Link erstellen',
                    saveButton: 'Änderungen speichern',
                    descriptionHtml: 'Beschreibung',
                    validationNameEl: 'Das Feld "Title-EL" ist erforderlich.',
                    validationNameDe: 'Das Feld "Title-DE" ist erforderlich.',
                    validationUrl: 'Dieses Feld ist erforderlich und muss eine gültige URL sein.'
                }
            },
            login: {
                title: 'CMS Admin Login',
                username: 'Benutzername',
                password: 'Passwort',
                submit: 'Login'
            },
            form: {
                languageHint: 'Geben Sie den Inhalt zuerst auf Griechisch und dann auf Deutsch ein.',
                createEvent: 'Veranstaltung erstellen',
                editEvent: 'Veranstaltung bearbeiten',
                saveChanges: 'Änderungen speichern',
                title: 'Titel',
                description: 'Kurzbeschreibung',
                date: 'Datum',
                pickDate: 'Datum auswählen',
                dateRequired: 'Bitte wählen Sie ein Datum aus',
                time: 'Uhrzeit',
                location: 'Ort',
                category: 'Kategorie',
                priceMembers: 'Mitgliederpreis CHF',
                pricePublic: 'Öffentlicher Preis CHF',
                addSection: 'Abschnitt hinzufügen',
                saveEvent: 'Veranstaltung speichern',
                saving: 'Speichern…',
                couldNotSave: 'Die Veranstaltung konnte nicht gespeichert werden',
                saved: 'Gespeichert',
                section: 'Abschnitt',
                removeSection: 'Entfernen',
                textBeforeMedia: 'Text vor den Medien',
                textAfterMedia: 'Text nach den Medien'
            }
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

            ui: {
                currentHeading: 'Programm 2025–2026',
                previousHeading: 'Programm 2025 (Karwoche & Ostern)',
                showPrevious: 'Vorheriges Programm anzeigen',
                hidePrevious: 'Vorheriges Programm ausblenden'
            },

            schedules: {
                current: {
                    meta: {
                        lines: ['Ökumenisches Patriarchat', 'Heilige Metropolis der Schweiz'],
                        parish: 'Gemeinde des Heiligen Georgios Olten',
                        address: 'Kapuzinerkloster, Klosterplatz 8, 4600 Olten'
                    },
                    program: {
                        title: 'Programm der Gottesdienste',
                        subtitle: 'Kirche Hl. Georgios Olten (KAPUZINERKLOSTER) — Jahr 2025–2026'
                    },
                    table: {
                        date: 'Datum',
                        event: 'Fest / Gottesdienst',
                        service: 'Art',
                        time: 'Uhrzeit'
                    },
                    sections: [
                        {
                            title: 'JAHR 2025–2026',
                            rows: [
                                {
                                    date: '14.09.2025',
                                    event: 'Fest der Kreuzerhöhung',
                                    service: 'Göttliche Liturgie',
                                    time: '10.00'
                                },
                                {
                                    date: '05.10.2025',
                                    event: '2. Sonntag nach Lukas',
                                    service: 'Göttliche Liturgie',
                                    time: '10.00'
                                },
                                {
                                    date: '16.11.2025',
                                    event: 'Gedenktag des Hl. Apostels Matthäus',
                                    service: 'Göttliche Liturgie',
                                    time: '10.00'
                                },
                                {
                                    date: '25.12.2025',
                                    event: 'WEIHNACHTEN',
                                    service: 'Göttliche Liturgie',
                                    time: '10.00',
                                    emphasis: true
                                },
                                {
                                    date: '18.01.2026',
                                    event: '12. Sonntag nach Lukas',
                                    service: 'Göttliche Liturgie',
                                    time: '10.00'
                                },
                                {
                                    date: '15.02.2026',
                                    event: 'Sonntag der Apokreo',
                                    service: 'Göttliche Liturgie',
                                    time: '10.00'
                                },
                                {
                                    date: '22.03.2026',
                                    event: '4. Sonntag der Fastenzeit',
                                    service: 'Göttliche Liturgie',
                                    time: '10.00'
                                },
                                {
                                    date: '05.04.2026',
                                    event: 'Palmsonntag',
                                    service: 'Göttliche Liturgie',
                                    time: '10.00'
                                }
                            ]
                        },
                        {
                            title: 'HEILIGE UND GROßE WOCHE 2026',
                            rows: [
                                {
                                    date: '08.04.2026',
                                    event: 'Großer Mittwoch — Krankensalbung (Efchelaion)',
                                    service: '',
                                    time: '17.30–18.45',
                                    note:
                                        '(ausnahmsweise dieses Jahr, da das Kapuzinerkloster von den Verantwortlichen genutzt wird)'
                                },
                                {
                                    date: '09.04.2026',
                                    event: 'Großer Donnerstag — Passionsgottesdienst',
                                    service: '',
                                    time: '20.00'
                                },
                                {
                                    date: '10.04.2026',
                                    event: 'Großer Freitag — Epitaphios (Klagegesang)',
                                    service: '',
                                    time: '20.00'
                                },
                                {
                                    date: '11.04.2026',
                                    event: 'Großer Samstag — Göttliche Liturgie',
                                    service: '',
                                    time: '09.00'
                                }
                            ],
                            highlight: {
                                date: '11.04.2026',
                                title: 'Großer Samstag',
                                text: 'Auferstehungsfeier — Orthros und Osterliturgie',
                                time: '23.00'
                            }
                        },
                        {
                            title: '',
                            rows: [
                                {
                                    date: '17.05.2026',
                                    event: 'Sonntag des Blinden',
                                    service: 'Göttliche Liturgie',
                                    time: '10.00'
                                },
                                {
                                    date: '07.06.2026',
                                    event: 'Allerheiligen-Sonntag',
                                    service: 'Göttliche Liturgie',
                                    time: '10.00'
                                }
                            ]
                        }
                    ],
                    signature: {
                        lines: [
                            'Mit herzlichen Grüßen,',
                            '+ Bischof von Tyana Fanourios',
                            'Aufsicht deutschsprachige Schweiz',
                            'Verantwortlicher der griechisch-orthodoxen Gemeinde Hl. Georgios Olten.'
                        ]
                    },
                    contact: {
                        heading: 'Kontakt',
                        phoneLabel: 'Telefon',
                        emailLabel: 'E-Mail',
                        facebookLabel: 'Facebook',
                        facebookName: 'Orthodoxe Kirche Olten',
                        phone: '0041 (0) 76 574 96 41',
                        email: 'p.fanourios@hotmail.com',
                        facebookUrl:
                            'https://www.facebook.com/search/top/?q=Orthodoxe%20Kirche%20Olten'
                    }
                },

                previous: {
                    meta: {
                        lines: ['Ökumenisches Patriarchat', 'Heilige Metropolis der Schweiz'],
                        parish: 'Griechisch-Orthodoxe Gemeinde Hl. Georgios Olten',
                        address: 'Klosterplatz 8, 4600 Olten'
                    },
                    program: {
                        title: 'Programm der Gottesdienste',
                        subtitle: 'Karwoche und Ostern 2025'
                    },
                    table: {
                        date: 'Datum',
                        event: 'Gottesdienst',
                        service: '',
                        time: 'Uhrzeit'
                    },
                    sections: [
                        {
                            title: '',
                            rows: [
                                {
                                    date: '13.04.2025',
                                    event: 'Palmsonntag — Liturgie',
                                    service: '',
                                    time: '10.00'
                                },
                                {
                                    date: '16.04.2025',
                                    event: 'Mittwoch — Krankensalbung (Efchelaion)',
                                    service: '',
                                    time: '19.00'
                                },
                                {
                                    date: '17.04.2025',
                                    event: 'Gründonnerstag — Die Heilige Passion (12 Evangelien)',
                                    service: '',
                                    time: '20.00'
                                },
                                {
                                    date: '18.04.2025',
                                    event: 'Karfreitag — Epitaphios',
                                    service: '',
                                    time: '20.15'
                                },
                                {
                                    date: '19.04.2025',
                                    event: 'Karsamstag — Basilius-Liturgie',
                                    service: '',
                                    time: '09.00'
                                }
                            ],
                            highlight: {
                                date: '19.04.2025',
                                title: 'Karsamstag',
                                text: 'Orthros und Osterliturgie',
                                time: '23.00'
                            }
                        }
                    ],
                    greeting: 'Frohe und gesegnete Ostern',
                    signature: {
                        lines: [
                            '+Archimandrit Fanourios Tholiotis',
                            'Protosynkellos der Heiligen Metropolis der Schweiz',
                            'Pfarrer Olten'
                        ]
                    },
                    contact: {
                        heading: 'Kontakt',
                        phoneLabel: 'Telefon',
                        emailLabel: 'E-Mail',
                        facebookLabel: 'Facebook',
                        facebookName: 'Orthodoxe Kirche Olten',
                        phone: '+41 (0) 76 574 96 41',
                        email: 'p.fanourios@hotmail.com',
                        facebookUrl:
                            'https://www.facebook.com/search/top/?q=Orthodoxe%20Kirche%20Olten'
                    }
                }
            }
        },
        common: {
            yes: 'Ja',
            no: 'Nein',
            save: 'Speichern',
            cancel: 'Abbrechen',
            delete: 'Löschen',
            published: 'Veröffentlicht',
            draft: 'Entwurf',
            validationFailed: 'Bitte überprüfen Sie die Formularfelder'
        }
    })
);

init({
    fallbackLocale: 'el',
    initialLocale: 'el'
});

export {t, locale, json};