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
            gallery: {
                subtitle: 'Διαχείριση εικόνων και βίντεο της δημόσιας γκαλερί.',
                createTitle: 'Νέο στοιχείο γκαλερί',
                editTitle: 'Επεξεργασία στοιχείου γκαλερί',

                itemSingular: 'στοιχείο',
                itemPlural: 'στοιχεία',

                createNew: 'Νέο στοιχείο',
                createFirst: 'Δημιουργία πρώτου στοιχείου',
                empty: 'Δεν υπάρχουν ακόμα στοιχεία στη γκαλερί.',
                emptyDescription: 'Ανεβάστε την πρώτη εικόνα ή το πρώτο βίντεο για να εμφανιστεί στη δημόσια γκαλερί.',

                preview: 'Προεπισκόπηση',
                id: 'ID',
                idOptional: 'ID προαιρετικό',
                idHelp: 'Αφήστε το κενό για αυτόματη δημιουργία.',
                idReadonlyHelp: 'Το ID είναι σταθερό και δεν μπορεί να αλλάξει εδώ.',

                type: 'Τύπος',
                image: 'Εικόνα',
                video: 'Βίντεο',
                alt: 'Εναλλακτικό κείμενο',
                altPlaceholder: 'Σύντομη περιγραφή',

                tags: 'Ετικέτες',
                noTags: 'Χωρίς ετικέτες',
                tagsPlaceholder: 'Ετικέτες χωρισμένες με κόμμα, π.χ. γιορτή, σύλλογος',
                existingTags: 'Υπάρχουσες ετικέτες',

                files: 'Αρχεία',
                actions_label: 'Ενέργειες',
                edit: 'Επεξεργασία',
                delete: 'Διαγραφή',
                save: 'Αποθήκευση',
                cancel: 'Άκυρο',

                mediaUpload: 'Ανέβασμα αρχείου',
                mediaUploadHelp: 'Οι εικόνες αποθηκεύονται ως WebP 480w και 960w. Τα βίντεο αποθηκεύονται ως WebM.',
                replaceMedia: 'Αντικατάσταση αρχείου',
                replaceMediaHelp: 'Αφήστε το κενό για να διατηρηθεί το υπάρχον αρχείο.',

                currentType: 'Τρέχων τύπος',
                missing: 'Λείπει',
                missingImage: 'Λείπει εικόνα',
                missingVideo: 'Λείπει βίντεο',
                yes: 'ναι',
                no: 'όχι',

                table: {
                    preview: 'Προεπισκόπηση',
                    id: 'ID',
                    type: 'Τύπος',
                    alt: 'Περιγραφή',
                    tags: 'Ετικέτες',
                    files: 'Αρχεία',
                    updated: 'Ενημερώθηκε',
                    actions: 'Ενέργειες'
                },

                actions: {
                    edit: 'Επεξεργασία'
                },

                deleteDialog: {
                    title: 'Διαγραφή στοιχείου γκαλερί;',
                    description: 'Αυτή η ενέργεια θα αφαιρέσει το στοιχείο από τη γκαλερί. Τα ήδη ανεβασμένα αρχεία στο R2 δεν διαγράφονται αυτόματα.',
                    confirm: 'Διαγραφή στοιχείου',
                    deleting: 'Διαγραφή…'
                },

                toast: {
                    deleted: 'Το στοιχείο διαγράφηκε',
                    deleteFailed: 'Δεν ήταν δυνατή η διαγραφή του στοιχείου.'
                },

                errors: {
                    mediaRequired: 'Απαιτείται εικόνα ή βίντεο.',
                    invalidId: 'Μη έγκυρο ID γκαλερί.',
                    missingId: 'Λείπει το ID του στοιχείου γκαλερί.',
                    notFound: 'Το στοιχείο γκαλερί δεν βρέθηκε.',
                    deleteFailed: 'Παρουσιάστηκε σφάλμα κατά τη διαγραφή του στοιχείου γκαλερί.',
                    processingFailed: 'Δεν ήταν δυνατή η επεξεργασία του αρχείου.'
                }
            },
            links: {
                createTitle: 'Νέος σύνδεσμος',
                editTitle: 'Επεξεργασία συνδέσμου',
                backToList: 'Πίσω στους συνδέσμους',

                toast: {
                    created: 'Ο σύνδεσμος δημιουργήθηκε',
                    updated: 'Ο σύνδεσμος ενημερώθηκε',
                    deleted: 'Ο σύνδεσμος διαγράφηκε',
                    saveFailed: 'Δεν ήταν δυνατή η αποθήκευση του συνδέσμου.',
                    deleteFailed: 'Δεν ήταν δυνατή η διαγραφή του συνδέσμου.'
                },

                errors: {
                    invalidId: 'Μη έγκυρο ID συνδέσμου.',
                    invalidData: 'Τα στοιχεία του συνδέσμου δεν είναι έγκυρα.',
                    notFound: 'Ο σύνδεσμος δεν βρέθηκε.',
                    saveFailed: 'Παρουσιάστηκε σφάλμα κατά την αποθήκευση του συνδέσμου.',
                    deleteFailed: 'Παρουσιάστηκε σφάλμα κατά τη διαγραφή του συνδέσμου.'
                },

                form: {
                    subtitle: 'Συμπληρώστε τα στοιχεία που θα εμφανίζονται στη δημόσια σελίδα συνδέσμων.',
                    content: 'Περιεχόμενο',
                    contentHelp: 'Ο τίτλος, η περιγραφή και το URL του συνδέσμου.',
                    nameEl: 'Όνομα στα Ελληνικά',
                    nameDe: 'Όνομα στα Γερμανικά',
                    url: 'URL',
                    openUrl: 'Άνοιγμα συνδέσμου',
                    descriptionEl: 'Περιγραφή στα Ελληνικά',
                    descriptionDe: 'Περιγραφή στα Γερμανικά',
                    logo: 'Λογότυπο',
                    logoHelp: 'Προαιρετικό λογότυπο για τον σύνδεσμο.',
                    uploadLogo: 'Ανέβασμα λογότυπου',
                    replaceLogo: 'Αντικατάσταση λογότυπου',
                    logoStorageHelp: 'Το λογότυπο μετατρέπεται σε WebP και αποθηκεύεται στο Cloudflare R2.',
                    save: 'Αποθήκευση συνδέσμου',
                    saving: 'Αποθήκευση…'
                }
            },
            businesses: {
                title: 'Επιχειρήσεις',
                subtitle: 'Διαχείριση επιχειρήσεων, καταχωρίσεων και χορηγών.',
                createNew: 'Δημιουργία νέας',
                empty: 'Δεν υπάρχουν ακόμη επιχειρήσεις.',

                table: {
                    logo: 'Λογότυπο',
                    name: 'Επωνυμία',
                    sponsorType: 'Χορηγία',
                    url: 'URL',
                    contact: 'Επικοινωνία',
                    actions: 'Ενέργειες'
                },

                actions: {
                    view: 'Προβολή',
                    edit: 'Επεξεργασία'
                },

                sponsorTypes: {
                    listed: 'Απλή καταχώριση',
                    bronze: 'Χάλκινος χορηγός',
                    silver: 'Ασημένιος χορηγός',
                    gold: 'Χρυσός χορηγός'
                },

                sponsorTypeDescriptions: {
                    listed: 'Η επιχείρηση εμφανίζεται στον κατάλογο.',
                    bronze: 'Βασικό επίπεδο χορηγίας.',
                    silver: 'Μεσαίο επίπεδο χορηγίας με αυξημένη προβολή.',
                    gold: 'Κορυφαίο επίπεδο χορηγίας με μέγιστη προβολή.'
                },

                deleteDialog: {
                    title: 'Διαγραφή επιχείρησης;',
                    description: 'Αυτή η ενέργεια δεν μπορεί να αναιρεθεί. Η επιλεγμένη επιχείρηση θα διαγραφεί οριστικά.',
                    confirm: 'Διαγραφή επιχείρησης',
                    deleting: 'Διαγραφή…'
                },

                toast: {
                    deleted: 'Η επιχείρηση διαγράφηκε',
                    deleteFailed: 'Δεν ήταν δυνατή η διαγραφή της επιχείρησης'
                },

                form: {
                    createBusiness: 'Δημιουργία επιχείρησης',
                    editBusiness: 'Επεξεργασία επιχείρησης',
                    subtitle: 'Προσθέστε τα στοιχεία της επιχείρησης, το λογότυπο, πολυμέσα και δίγλωσσο περιεχόμενο.',

                    name: 'Επωνυμία επιχείρησης',
                    slug: 'Slug',
                    slugPlaceholder: 'Αφήστε το κενό για αυτόματη δημιουργία',
                    sponsorType: 'Τύπος χορηγίας',

                    description: 'Περιγραφή',
                    url: 'Ιστοσελίδα',
                    email: 'Email',
                    telephone: 'Τηλέφωνο',
                    contactPerson: 'Υπεύθυνος επικοινωνίας',

                    logo: 'Λογότυπο',
                    logoPreview: 'Προεπισκόπηση λογοτύπου',
                    currentLogoHint: 'Τρέχον λογότυπο. Ανεβάστε νέο αρχείο μόνο αν θέλετε να το αντικαταστήσετε.',

                    section: 'Ενότητα',
                    addSection: 'Προσθήκη ενότητας',
                    removeSection: 'Αφαίρεση ενότητας',
                    textBeforeMedia: 'Κείμενο πριν από τα πολυμέσα',
                    textAfterMedia: 'Κείμενο μετά τα πολυμέσα',

                    saveBusiness: 'Αποθήκευση επιχείρησης',
                    saveChanges: 'Αποθήκευση αλλαγών'
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
        businesses: {
            headline: 'Ελληνόφωνες Επιχειρήσεις',
            subtitle: 'Ανακαλύψτε επιχειρήσεις και χορηγούς που συνδέονται με τον Griechischer Verein Hellas.',
            eyebrow: 'Δίκτυο Griechischer Verein Hellas',
            viewProfile: 'Προβολή προφίλ',
            empty: 'Δεν έχουν προστεθεί ακόμη επιχειρήσεις.',
            thanks: 'Ευχαριστούμε θερμά τους χορηγούς μας για την υποστήριξή τους.'
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
            gallery: {
                subtitle: 'Bilder und Videos der öffentlichen Galerie verwalten.',
                createTitle: 'Neuer Galerie-Eintrag',
                editTitle: 'Galerie-Eintrag bearbeiten',

                itemSingular: 'Eintrag',
                itemPlural: 'Einträge',

                createNew: 'Neu erstellen',
                createFirst: 'Ersten Eintrag erstellen',
                empty: 'Es gibt noch keine Galerie-Einträge.',
                emptyDescription: 'Laden Sie das erste Bild oder Video hoch, damit es in der öffentlichen Galerie erscheint.',

                preview: 'Vorschau',
                id: 'ID',
                idOptional: 'ID optional',
                idHelp: 'Leer lassen, um automatisch eine ID zu erstellen.',
                idReadonlyHelp: 'Die ID ist stabil und kann hier nicht geändert werden.',

                type: 'Typ',
                image: 'Bild',
                video: 'Video',
                alt: 'Alternativtext',
                altPlaceholder: 'Kurze Beschreibung',

                tags: 'Tags',
                noTags: 'Keine Tags',
                tagsPlaceholder: 'Tags durch Komma getrennt, z. B. Fest, Verein',
                existingTags: 'Bestehende Tags',

                files: 'Dateien',
                actions_label: 'Aktionen',
                edit: 'Bearbeiten',
                delete: 'Löschen',
                save: 'Speichern',
                cancel: 'Abbrechen',

                mediaUpload: 'Datei hochladen',
                mediaUploadHelp: 'Bilder werden als WebP in 480w und 960w gespeichert. Videos werden als WebM gespeichert.',
                replaceMedia: 'Datei ersetzen',
                replaceMediaHelp: 'Leer lassen, um die aktuelle Datei beizubehalten.',

                currentType: 'Aktueller Typ',
                missing: 'Fehlt',
                missingImage: 'Bild fehlt',
                missingVideo: 'Video fehlt',
                yes: 'ja',
                no: 'nein',

                table: {
                    preview: 'Vorschau',
                    id: 'ID',
                    type: 'Typ',
                    alt: 'Beschreibung',
                    tags: 'Tags',
                    files: 'Dateien',
                    updated: 'Aktualisiert',
                    actions: 'Aktionen'
                },

                actions: {
                    edit: 'Bearbeiten'
                },

                deleteDialog: {
                    title: 'Galerie-Eintrag löschen?',
                    description: 'Diese Aktion entfernt den Eintrag aus der Galerie. Bereits hochgeladene Dateien in R2 werden nicht automatisch gelöscht.',
                    confirm: 'Eintrag löschen',
                    deleting: 'Wird gelöscht…'
                },

                toast: {
                    deleted: 'Galerie-Eintrag gelöscht',
                    deleteFailed: 'Der Galerie-Eintrag konnte nicht gelöscht werden.'
                },

                errors: {
                    mediaRequired: 'Bild oder Video erforderlich.',
                    invalidId: 'Ungültige Galerie-ID.',
                    processingFailed: 'Die Galerie-Datei konnte nicht verarbeitet werden.',
                    missingId: 'Die ID des Galerie-Eintrags fehlt.',
                    notFound: 'Der Galerie-Eintrag wurde nicht gefunden.',
                    deleteFailed: 'Beim Löschen des Galerie-Eintrags ist ein Fehler aufgetreten.'
                }
            },
            links: {
                createTitle: 'Neuer Link',
                editTitle: 'Link bearbeiten',
                backToList: 'Zurück zu den Links',

                toast: {
                    created: 'Link erstellt',
                    updated: 'Link aktualisiert',
                    deleted: 'Link gelöscht',
                    saveFailed: 'Der Link konnte nicht gespeichert werden.',
                    deleteFailed: 'Der Link konnte nicht gelöscht werden.'
                },

                errors: {
                    invalidId: 'Ungültige Link-ID.',
                    invalidData: 'Die Link-Daten sind ungültig.',
                    notFound: 'Der Link wurde nicht gefunden.',
                    saveFailed: 'Beim Speichern des Links ist ein Fehler aufgetreten.',
                    deleteFailed: 'Beim Löschen des Links ist ein Fehler aufgetreten.'
                },

                form: {
                    subtitle: 'Erfassen Sie die Angaben, die auf der öffentlichen Link-Seite angezeigt werden.',
                    content: 'Inhalt',
                    contentHelp: 'Titel, Beschreibung und URL des Links.',
                    nameEl: 'Name auf Griechisch',
                    nameDe: 'Name auf Deutsch',
                    url: 'URL',
                    openUrl: 'Link öffnen',
                    descriptionEl: 'Beschreibung auf Griechisch',
                    descriptionDe: 'Beschreibung auf Deutsch',
                    logo: 'Logo',
                    logoHelp: 'Optionales Logo für den Link.',
                    uploadLogo: 'Logo hochladen',
                    replaceLogo: 'Logo ersetzen',
                    logoStorageHelp: 'Das Logo wird in WebP umgewandelt und in Cloudflare R2 gespeichert.',
                    save: 'Link speichern',
                    saving: 'Wird gespeichert…'
                }
            },
            businesses: {
                title: 'Unternehmen',
                subtitle: 'Unternehmen, Einträge und Sponsoren verwalten.',
                createNew: 'Neu erstellen',
                empty: 'Noch keine Unternehmen vorhanden.',

                table: {
                    logo: 'Logo',
                    name: 'Name',
                    sponsorType: 'Sponsoring',
                    url: 'URL',
                    contact: 'Kontakt',
                    actions: 'Aktionen'
                },

                actions: {
                    view: 'Ansehen',
                    edit: 'Bearbeiten'
                },

                sponsorTypes: {
                    listed: 'Einfacher Eintrag',
                    bronze: 'Bronze-Sponsor',
                    silver: 'Silber-Sponsor',
                    gold: 'Gold-Sponsor'
                },

                sponsorTypeDescriptions: {
                    listed: 'Das Unternehmen erscheint im Verzeichnis.',
                    bronze: 'Basis-Sponsoringstufe.',
                    silver: 'Mittlere Sponsoringstufe mit erhöhter Sichtbarkeit.',
                    gold: 'Höchste Sponsoringstufe mit maximaler Sichtbarkeit.'
                },

                deleteDialog: {
                    title: 'Unternehmen löschen?',
                    description: 'Diese Aktion kann nicht rückgängig gemacht werden. Das ausgewählte Unternehmen wird dauerhaft gelöscht.',
                    confirm: 'Unternehmen löschen',
                    deleting: 'Löschen…'
                },

                toast: {
                    deleted: 'Das Unternehmen wurde gelöscht',
                    deleteFailed: 'Das Unternehmen konnte nicht gelöscht werden'
                },

                form: {
                    createBusiness: 'Unternehmen erstellen',
                    editBusiness: 'Unternehmen bearbeiten',
                    subtitle: 'Fügen Sie Unternehmensdaten, Logo, Medien und zweisprachige Inhalte hinzu.',

                    name: 'Unternehmensname',
                    slug: 'Slug',
                    slugPlaceholder: 'Leer lassen, um automatisch zu erstellen',
                    sponsorType: 'Sponsoring-Typ',

                    description: 'Beschreibung',
                    url: 'Website',
                    email: 'E-Mail',
                    telephone: 'Telefon',
                    contactPerson: 'Kontaktperson',

                    logo: 'Logo',
                    logoPreview: 'Logo-Vorschau',
                    currentLogoHint: 'Aktuelles Logo. Laden Sie nur dann eine neue Datei hoch, wenn Sie es ersetzen möchten.',

                    section: 'Abschnitt',
                    addSection: 'Abschnitt hinzufügen',
                    removeSection: 'Abschnitt entfernen',
                    textBeforeMedia: 'Text vor den Medien',
                    textAfterMedia: 'Text nach den Medien',

                    saveBusiness: 'Unternehmen speichern',
                    saveChanges: 'Änderungen speichern'
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
        businesses: {
            headline: 'Griechischsprachige Unternehmen',
            subtitle: 'Entdecken Sie Unternehmen und Sponsoren, die mit Griechischer Verein Hellas verbunden sind.',
            eyebrow: 'Griechischer Verein Hellas Netzwerk',
            viewProfile: 'Profil ansehen',
            empty: 'Es wurden noch keine Unternehmen hinzugefügt.',
            thanks: 'Wir möchten unseren Sponsoren herzlich für ihre wertvolle Unterstützung danken.'
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