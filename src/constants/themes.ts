/**
 * Thematic structure of Lalitā Sahasranāma — V. Ravi as source of truth.
 *
 * Every chapter boundary below is anchored to an explicit statement V. Ravi
 * makes in his commentary marking the start, end, or scope of a section.
 * Where V. Ravi gives sub-divisions (kūṭa ranges, yoginī ranges, soul-vs-
 * Brahman 256–274) those are preserved as sub-groups. Where the back half
 * has no explicit "from X to Y" markers (~535 onwards), sub-groups follow
 * the thematic clusters visible in V. Ravi's commentary.
 *
 * Ranges are inclusive, 1-indexed, and cover all 1000 nāmas exactly once.
 */
export type ThemeGroup = {
  range: [number, number];
  title: string;
  summary: string;
};

export type Chapter = {
  range: [number, number];
  title: string;
  summary: string;
  /** Direct quote (paraphrased) from V. Ravi anchoring this chapter's scope. */
  anchor?: string;
  groups: ThemeGroup[];
};

export const CHAPTERS: Chapter[] = [
  {
    range: [1, 3],
    title: "Invocation as the supreme Mother",
    summary:
      "The stotra opens by naming Her in three breaths — Śrī Mātā (the auspicious Mother), Śrī Mahārājñī (queen of queens), Śrī Siṃhāsaneśvarī (empress on the lion-throne). V. Ravi reads the first two as Her power of creation and Her power of sustenance — Her motherhood and Her sovereignty.",
    anchor:
      "\"The first nāma talks about Her creative power and the second nāma talks about Her power of sustenance.\"",
    groups: [
      {
        range: [1, 3],
        title: "Mātā, Mahārājñī, Siṃhāsaneśvarī",
        summary:
          "The triple refuge — Mother, Queen of queens, Empress on the lion-throne — that opens the entire stotra.",
      },
    ],
  },

  {
    range: [4, 11],
    title: "Manifestation and the four-armed form",
    summary:
      "She rises from the fire of consciousness (cidagni-kuṇḍa) to help the devas, blazing with the brilliance of a thousand rising suns. With nāma 7 the physical form begins — four arms holding four inner instruments: the noose of desire, the goad of anger, the sugarcane bow of mind, and five flower-arrows of the subtle senses.",
    anchor:
      "Nāma 6: \"From the next nāma onwards, Her physical form is being described.\"",
    groups: [
      {
        range: [4, 6],
        title: "Born of fire — the prakāśa form",
        summary:
          "From the cidagni-kuṇḍa She manifests to aid the gods; effulgence of a thousand rising suns. Her prakāśa (subtle/light) form is being described — about to give way to Her vimarśa (physical) form.",
      },
      {
        range: [7, 11],
        title: "Four arms with five subtle weapons",
        summary:
          "Four arms holding the noose (rāga, desire), the goad (krodha, anger), the sugarcane bow (manas, mind) and five flower-arrows (the tanmātras — the subtle elements of sound, touch, sight, taste, smell).",
      },
    ],
  },

  {
    range: [12, 51],
    title: "The body, head to foot — keśādi-pādānta",
    summary:
      "V. Ravi: \"From this nāma onwards, the gross description of Lalitāmbikā begins... For Goddesses the description is from head to foot.\" The 40 nāmas that follow trace Her form from crown to lotus toes — and V. Ravi reveals that the three kūṭas of the Pañcadaśī mantra are hidden inside: Vāgbhava-kūṭa in Her face (13–29), Madhya-kūṭa face-to-hip (30–38), Śaktī-kūṭa hip-down (39–47). Five nāmas (42–46) describe Her feet alone.",
    anchor:
      "Nāma 12: \"From this nāma onwards, the gross description of Lalitāmbikā begins.\"",
    groups: [
      {
        range: [12, 12],
        title: "The red glow that floods the worlds",
        summary:
          "The introductory nāma to the body — Her rosy radiance drowns every cosmic egg in red.",
      },
      {
        range: [13, 29],
        title: "Vāgbhava-kūṭa: the face",
        summary:
          "Crown, hair, forehead, brows, eyes, nose, cheeks, lips, teeth, breath — the seventeen nāmas of Her face, which V. Ravi identifies as the first kūṭa of the Pañcadaśī mantra (the giver of knowledge).",
      },
      {
        range: [30, 38],
        title: "Madhya / Kāmarāja-kūṭa: face to hip",
        summary:
          "The marriage-thread tied by Kāmeśvara, the conch-like neck, the golden armlets, the breasts as Kāmeśvara's love-jewels, the deep navel, the three-fold waist — the second kūṭa of the Pañcadaśī.",
      },
      {
        range: [39, 47],
        title: "Śaktī-kūṭa: hip downwards",
        summary:
          "Heavy hips with jewel-belt, soft elephant-trunk thighs, knees, the calves of Cupid's quiver, and the gem-set anklets. Within this, V. Ravi notes that five nāmas (42–46) are reserved for Her feet alone.",
      },
      {
        range: [48, 51],
        title: "Closing of the physical form",
        summary:
          "The all-ornament-adorned, the betel-fragrance that perfumes every direction, every-jewel-adorned — closing nāmas that round out the body before the conclusion at nāma 52.",
      },
    ],
  },

  {
    range: [52, 63],
    title: "Seated with Śiva, and Her abode on Mount Meru",
    summary:
      "Three transitional nāmas describe Her relationship to Śiva — seated on His lap (52), one with Him (53), holding Him under Her own will (54) — and V. Ravi marks this as the close of the physical description. From nāma 55 (Sumeru-madhya-śṛṅga-sthā) the narration pivots to Her cosmic city — at the centre of Mt. Meru, ringed by oceans of nectar.",
    anchor:
      "Nāma 54: \"With this verse, the physical description of Lalitai is concluded. From nāma-s 53 to 64 it is going to be the description of Śrī Nagara, the place where Lalitai lives.\"",
    groups: [
      {
        range: [52, 54],
        title: "Seated with Śiva — the body concluded",
        summary:
          "Śiva-kāmeśvarāṅka-sthā (seated on Śiva-Kāmeśvara's lap), Śivā (one with Śiva), Svādhīna-vallabhā (Her consort is at Her own will). The three nāmas that close the head-to-foot description and pivot the stotra outward.",
      },
      {
        range: [55, 63],
        title: "The city on the mountain",
        summary:
          "Sumeru-madhya-śṛṅga-sthā, Śrīman-nagara-nāyikā, Sudhā-sāgara-madhya-sthā — She dwells on the central peak of Mt. Meru, ringed by the ocean of nectar, the chintāmaṇi palace, and the kadamba groves. The cosmic capital from which all is administered.",
      },
    ],
  },

  {
    range: [64, 84],
    title: "The slaying of Bhaṇḍāsura",
    summary:
      "V. Ravi: \"From this nāma, till nāma 84, Her slaying of demon Bhaṇḍāsura is described.\" Bhaṇḍa — created from the ashes of Manmatha when Śiva burned the god of love — is the personification of ignorance and ego. Her army of śaktis marches out; commander-deities Daṇḍa-nāthā (Vārāhī), Mantriṇī (Śyāmalā), Sampatkarī, Aśvārūḍhā lead the campaign; Jvālāmālinikā erects a fortress of fire; the Mahā-pāśupata missile reduces the demon hosts to ash. Bhaṇḍa falls; Manmatha is resurrected.",
    anchor:
      "Nāma 64: \"From this nāma, till nāma 84, Her slaying of demon Bhaṇḍāsura is described.\"",
    groups: [
      {
        range: [64, 70],
        title: "The war invoked — Her army assembles",
        summary:
          "Worshipped by gods and sages, She arms Herself. Her śakti-army musters; Sampatkarī and Aśvārūḍhā take the field, Daṇḍa-nāthā (Vārāhī) and Mantriṇī (Śyāmalā) command the wings.",
      },
      {
        range: [71, 77],
        title: "The campaign — Jvālāmālinikā's fortress of fire",
        summary:
          "The demon's sons fall; Bhaṇḍāputras are slain; the goddesses on chariots circle the battlefield, ringed by Jvālāmālinikā's wall of flame.",
      },
      {
        range: [78, 84],
        title: "Victory — Mahā-pāśupata and the resurrection of Manmatha",
        summary:
          "The Mahā-pāśupata missile turns the demon hosts to ash. Bhaṇḍa is slain. Manmatha, burned long ago by Śiva, is brought back by Her — He was Her son, and a mother saves Her child from the father.",
      },
    ],
  },

  {
    range: [85, 89],
    title: "The Pañcadaśī mantra explained — Her subtle form",
    summary:
      "V. Ravi: \"Beginning this nāma, Her Pañcadaśī mantra is being explained... the description of Her subtle form begins. Her subtle form is Pañcadaśī mantra. Her subtler form is kāma-kalā. Her subtlest form is kuṇḍalinī.\" The three kūṭas of the 15-syllable mantra are mapped onto Her face, Her face-to-hip, and Her hip-downwards.",
    anchor:
      "Nāma 85: \"Beginning this nāma, Her Pañcadaśī mantra is being explained... the description of Her subtle form begins.\"",
    groups: [
      {
        range: [85, 89],
        title: "The three kūṭas of the fifteen-syllable mantra",
        summary:
          "Śrīmad-vāgbhava-kūṭaika-svarūpa-mukha-paṅkajā — Her face IS the first kūṭa; Her face-to-hip is the second (Madhya-kūṭa); Her hip-downward is the third (Śaktī-kūṭa). The Pañcadaśī mantra is hidden in Her very body.",
      },
    ],
  },

  {
    range: [90, 111],
    title: "Her subtlest form — kāmakalā and kuṇḍalinī",
    summary:
      "V. Ravi: \"From this nāma onwards till 111, the subtlest form of Lalitāmbikā will be discussed. Her subtle form is mantra, Her subtler form is kāmakalā, Her subtlest form is kuṇḍalinī.\" The discussion descends through the six cakras and culminates in nāma 110 — Kuṇḍalinī — the three-and-a-half coiled serpent power asleep in mūlādhāra. Nāma 111 closes: \"with this, the description of Her kuṇḍalinī form ends.\"",
    anchor:
      "Nāma 90: \"From this nāma onwards till 111, the subtlest form of Lalitāmbikā will be discussed.\"",
    groups: [
      {
        range: [90, 100],
        title: "Kula and the path of nectar",
        summary:
          "She enjoys kulāmṛta — the ambrosia that flows from sahasrāra when kuṇḍalinī reaches the crown. The path from mūlādhāra to sahasrāra IS kula. She is Kuleśvarī, Kulayoginī — the protector of the secret tradition.",
      },
      {
        range: [101, 109],
        title: "The cakras — Maṇipūra to Sahasrāra",
        summary:
          "She rises through Maṇipūra (navel), pierces Viṣṇu's knot (granthi), through Ājñā (third eye), pierces Rudra's knot, through Sahasrāra (crown), where ambrosia showers and the practitioner becomes a vessel of bliss.",
      },
      {
        range: [110, 110],
        title: "Kuṇḍalinī — the single nāma",
        summary:
          "V. Ravi: \"Her subtlest form is described in this single nāma.\" The three-and-a-half-coiled serpent in mūlādhāra — Her most concentrated presence in the human body.",
      },
      {
        range: [111, 111],
        title: "Bisa-tantu-tanīyasī — fine as a lotus thread",
        summary:
          "She is finer than the fiber of a lotus stalk — the closing nāma of Her kuṇḍalinī form. With this, V. Ravi notes, the subtlest description ends; \"from the next nāma, the description of Her blessings begin.\"",
      },
    ],
  },

  {
    range: [112, 131],
    title: "Blessing Her devotees",
    summary:
      "V. Ravi: \"Beginning from this nāma till nāma 131 the significant aspect of blessing Her devotees is described.\" Bhavānī — at whose first two syllables She rushes to grant absorption. Bhāvanāgamyā — reachable through inner contemplation alone. The axe to the forest of saṃsāra. The dispeller of fear, the giver of every auspiciousness.",
    anchor:
      "Nāma 112: \"Beginning from this nāma till nāma 131 the significant aspect of blessing Her devotees is described.\"",
    groups: [
      {
        range: [112, 120],
        title: "Bhavānī — instant absorption",
        summary:
          "Bhavānī, who hears the word \"Bhavānī tvaṃ\" and at once grants the devotee absorption into Her own Self. Bhāvanāgamyā, reached only through inner contemplation. Bhavāraṇya-kuṭhārikā — the axe to the forest of birth-and-death.",
      },
      {
        range: [121, 131],
        title: "Bhadrā — the welfare-bestower",
        summary:
          "Bhadra-priyā, Bhadra-mūrti — the personification of every auspiciousness. Bhakta-saubhāgya-dāyinī, granter of devotional fortune. Bhayāpahā — destroyer of fear. Śāntimatī — never harsh to Her own, but firm at the limit.",
      },
    ],
  },

  {
    range: [132, 195],
    title: "Nirguṇa Brahman and the fruit of formless worship",
    summary:
      "V. Ravi: \"Nāmas 132 to 155 discuss Her as Nirguṇa Brahman or Her formless form. Worshipping Her as nirguṇa form is considered an important aspect of worship, and the result of such worship is described in nāmas 156 to 195.\" Vāc Devīs chose to discuss the formless worship FIRST, then the with-form worship — placing the silent, attribute-less Brahman before the attributed one.",
    anchor:
      "Nāma 131: \"Nāma-s 132 to 155 discuss Her as Nirguṇa Brahman... the result of such worship is described in nāma-s 156 to 195.\"",
    groups: [
      {
        range: [132, 155],
        title: "The formless one — Nirguṇa Brahman",
        summary:
          "Niranjana, Nirlepā, Nirmalā, Nityā, Niraṅgā, Nirākārā, Niraguṇa, Niṣkalā, Nirupādhi, Nirīśvarā — twenty-four nāmas of the attribute-less, support-less, undivided Brahman.",
      },
      {
        range: [156, 175],
        title: "Fruits of formless worship — inner enemies slain",
        summary:
          "Bhayāpahā, Pāpa-nāśinī, Krodha-śamanī, Lobha-nāśinī — the destroyer of fear, sin, anger, greed and the six inner enemies; the silent worship cuts them at the root.",
      },
      {
        range: [176, 195],
        title: "Fruits continued — conquest of death, age, sorrow",
        summary:
          "Mṛtyu-mathanī, Duḥkha-hantrī — destroyer of death and sorrow. Sad-gati-pradā — giver of the right path. The formless worship's full result: liberation from every affliction of saṃsāra.",
      },
    ],
  },

  {
    range: [196, 248],
    title: "Saguṇa worship — Brahman with attributes",
    summary:
      "V. Ravi (at 131): \"Vāc Devīs have chosen to discuss Her nirguṇa worship first and saguṇa (with attributes) worship later (196–248).\" Now Brahman returns wearing form — Mṛḍa-priyā (Śiva's beloved), Mahā-bhairava-pūjitā, Cāru-rūpā, Cinmayī. Consciousness made luminous and tangible; the four states of jīva — waking, dream, deep-sleep, turīya — and the supreme Self that pervades each.",
    anchor:
      "Nāma 248: \"With nāma 248 the discussion on Her saguṇa Brahman (with forms and attributes) form is concluded.\"",
    groups: [
      {
        range: [196, 220],
        title: "Mṛḍa-priyā — the great heroine",
        summary:
          "Beloved of Śiva, Mahā-vīryā, worshipped by Mahā-bhairava, adored by every divine warrior. The embodied mahā-vidyā — the goddess as Saguṇa Brahman, with form and attributes.",
      },
      {
        range: [221, 240],
        title: "Cit-cinmayī — the four states of awareness",
        summary:
          "Vaiśvānarī (waking), Taijasī (dream), Prājñā-ātmikā (deep sleep), and the witness beyond — the four states of jīva, all of which are Her.",
      },
      {
        range: [241, 248],
        title: "Padma-rāga-sama-prabhā — close of saguṇa worship",
        summary:
          "She is like the deep-red padmarāga ruby. V. Ravi reads this as Her kuṇḍalinī form once more — red at the base, colourless at the crown. With nāma 248 the saguṇa worship is closed.",
      },
    ],
  },

  {
    range: [249, 340],
    title: "Pañca-Brahma svarūpa — the five cosmic acts",
    summary:
      "V. Ravi: \"The nāmas from 249 to 340 discuss on the 'Pañca-Brahma svarūpa' known as the five acts of the Brahman.\" The five — creation, sustenance, dissolution, tirodhāna (veiling), and anugraha (grace) — flow from the opening and closing of Her eyes. Nested inside is a 19-nāma meditation on the soul-Brahman distinction (256–274), and the secret bījas Hrīṃ, Aiṃ, Klīṃ are revealed in 278–284.",
    anchor:
      "Nāma 248: \"The nāmas from 249 to 340 discuss on the 'Pañca-Brahma svarūpa' known as the five acts of the Brahman.\"",
    groups: [
      {
        range: [249, 255],
        title: "The five functions enumerated",
        summary:
          "Pañca-brahma-svarūpiṇī — She is the form of the five Brahman-functions. Pañca-kṛtya-parāyaṇā — She is devoted to those five acts. The five-fold cosmic mechanism in seven nāmas.",
      },
      {
        range: [256, 274],
        title: "The soul and the Brahman — their difference",
        summary:
          "V. Ravi at 256: \"Beginning from this nāma, next 19 nāmas till 274 talk about the difference between the soul and the Brahman.\" Viśvarūpā, Jāgariṇī, Svapantī, Taijasātmikā — She is each state of the jīva AND the Brahman that knows them.",
      },
      {
        range: [275, 300],
        title: "The bījas revealed — Hrīṃ, Aiṃ, Klīṃ",
        summary:
          "She abides in the centre of the solar orbit. Her thousand feet are the universe; the three kūṭas of the Pañcadaśī mantra are revealed in nāmas 278–284 as Hrīṃ, Aiṃ, Klīṃ — the secret syllables.",
      },
      {
        range: [301, 340],
        title: "Boons, qualities, and acts of the universal Mother",
        summary:
          "Vara-dā (boon-giver), Vāma-keśī, Rasyā, Kāmyā, Komalāṅgī — the qualities of the universal Mother who carries out the five acts; the final nāmas of the section before turning to Her embodied form.",
      },
    ],
  },

  {
    range: [341, 474],
    title: "The Kṣetra form, the Word, and the secret rite",
    summary:
      "V. Ravi at 341: \"Since the next few nāmas deal with Her Kṣetra form, understanding Kṣetra becomes important. Kṣetra is the physical body and kṣetrajña is the soul.\" From here the stotra moves through the body of the cosmos, the four levels of speech (Parā, Paśyantī, Madhyamā, Vaikharī), the sixteen Nityā devīs of the lunar cycle, Her countless forms, the Vyāhṛti utterances, the kaula path, the obstacle-remover — closing at Siddheśvarī, the queen of the perfected, and the introduction of the yoginīs.",
    anchor:
      "Nāma 341: \"Since the next few nāma-s deal with Her Kṣetra form, understanding Kṣetra becomes important.\"",
    groups: [
      {
        range: [341, 360],
        title: "Kṣetra-svarūpā — the body of the cosmos",
        summary:
          "She is the field (kṣetra) and the knower of the field (kṣetrajña). The thirty-six tattvas of Śaiva metaphysics arise in Her, are sustained in Her, and dissolve in Her.",
      },
      {
        range: [361, 380],
        title: "Vaikharī to Parā — the four levels of speech",
        summary:
          "Vaikharī (audible), Madhyamā (mental), Paśyantī (vision), Parā (silent) — the four stations of speech, all of which are Her. V. Ravi reads them as four pīṭhas mapped on base / navel / heart / throat cakras.",
      },
      {
        range: [381, 400],
        title: "Rahasya-yāga and the sixteen Nityā devīs",
        summary:
          "Worshipped in the secret rite (rahasya-yāga) as the sixteen Nityā goddesses of the lunar fortnight — Kāmeśvarī, Bhagamālinī, Nityaklinnā and the rest. She is mahā-nityā, the seventeenth that contains them all.",
      },
      {
        range: [401, 420],
        title: "Of countless forms — chosen of the righteous",
        summary:
          "Vividhākārā, Vidyāvidyā-svarūpiṇī, Mahā-kāmeśa-nayanā — She holds every form the devotee can hold, and is the chosen deity of the righteous, the form of every knowledge and every ignorance.",
      },
      {
        range: [421, 440],
        title: "Vyāhṛti — power of the Word and the mada of yogic bliss",
        summary:
          "Vyāhṛti — the seven utterances (bhū, bhuvaḥ, suvaḥ, mahaḥ, janaḥ, tapaḥ, satyam). Mada-śālinī — shining with the inebriation of mantra-bliss. The Word as the door to ecstasy.",
      },
      {
        range: [441, 460],
        title: "The kaula path and Vighna-nāśinī",
        summary:
          "Kaula-mārga-tatpara-sevitā — worshipped by adepts of the kaula tradition; Kumāra-gaṇanāthāmbā — mother of Kumāra and Gaṇeśa; Vighna-nāśinī — destroyer of every obstacle on the path.",
      },
      {
        range: [461, 474],
        title: "Siddheśvarī — goddess of the perfected",
        summary:
          "Subhrūḥ (beautiful brows), Vahni-vāsinī (dweller in the fire), Bhakti-mat-kalpa-latikā (the wishing-vine of the devoted), Yaśasvinī (the renowned) — closing with the goddess of those whose practice has ripened, before the yoginīs.",
      },
    ],
  },

  {
    range: [475, 534],
    title: "The seven yoginīs of the cakras",
    summary:
      "V. Ravi: \"From nāma 475 to 534 (60 nāmas) discuss in detail about the six cakras and sahasrāra... each presided over by a yoginī.\" Importantly, V. Ravi flags that these nāmas \"do not refer to Lalitāmbikā directly\" — they describe Her chief yoginī attendants who must be passed through as Śaktī ascends from base to crown. The order is unusual: it begins at the throat (viśuddhi), descends, and ends at the crown.",
    anchor:
      "Nāma 474: \"From nāma 475 to 534 (60 nāmas) discuss in detail about the six cakras or psychic centres... each presided over by a yoginī.\"",
    groups: [
      {
        range: [475, 484],
        title: "Ḍākinī — Viśuddhi (throat) cakra",
        summary:
          "Sixteen-petalled lotus with the sixteen vowels of Sanskrit; bīja haṃ. The presiding yoginī is Ḍākinīśvarī. Skin is the body-element governed here.",
      },
      {
        range: [485, 494],
        title: "Rākiṇī — Anāhata (heart) cakra",
        summary:
          "Twelve-petalled lotus; bīja yaṃ. The yoginī is Rākiṇī. Blood is the body-element. The heart of every yogic experience.",
      },
      {
        range: [495, 503],
        title: "Lākinī — Maṇipūra (navel) cakra",
        summary:
          "Ten-petalled lotus; bīja raṃ — said to have the power of twelve suns. The yoginī is Lākinī. Flesh is the body-element. The seat of jaṭharāgni, the digestive fire.",
      },
      {
        range: [504, 513],
        title: "Kākinī — Svādhiṣṭhāna cakra",
        summary:
          "Six-petalled lotus; bīja vaṃ (Varuṇa, lord of water). The yoginī is Kākinī. Fat is the body-element. Just above the base cakra.",
      },
      {
        range: [514, 520],
        title: "Sākinī — Mūlādhāra (base) cakra",
        summary:
          "Four-petalled lotus; bīja laṃ (earth) and inside the triangle the kāma-bīja klīṃ. The yoginī is Sākinī. Bone is the body-element. The seat of the coiled Kuṇḍalinī.",
      },
      {
        range: [521, 527],
        title: "Hākinī — Ājñā (third eye) cakra",
        summary:
          "Two-petalled lotus; bīja oṃ. The yoginī is Hākinī. Marrow is the body-element. Where the guru gives commands and the practitioner gets the first glimpse of Brahman.",
      },
      {
        range: [528, 534],
        title: "Yākinī — Sahasrāra (crown)",
        summary:
          "Thousand-petalled lotus. The yoginī is Yākinī. Semen / ovum is the body-element. Śiva-Śaktī unite here; the practitioner who reaches sahasrāra is not born again.",
      },
    ],
  },

  {
    range: [535, 680],
    title: "Vāc Devīs resume — witnessing Self and compassion within",
    summary:
      "V. Ravi at 535: \"After describing yoginīs, Vāc Devīs continue with their description of Lalitāmbikā.\" Now the stotra returns to Her directly. She is Svāhā (the oblation), Anuttamā (the unsurpassable), Sarvavyādhi-praśamanī (healer of all illness), Mahā-pralaya-sākṣiṇī (witness of the great dissolution), Dayā-mūrti (compassion personified), Sad-asat-rūpa-dhāriṇī (holder of being and non-being), Vṛddhā (the Ancient). V. Ravi also flags that nāmas 591–597 explain the subtle nature of the three Pañcadaśī kūṭas as agni/sūrya/candra.",
    anchor:
      "Nāma 535: \"After describing yogini-s, Vāc Devi-s continue with their description of Lalitāmbikā.\"",
    groups: [
      {
        range: [535, 560],
        title: "Svāhā, Anuttamā — oblation and the unsurpassable healer",
        summary:
          "She is the oblation that perfects every sacrifice; Anuttamā — the supreme with no equal; Sarva-vyādhi-praśamanī — the medicine that cures the disease called saṃsāra itself.",
      },
      {
        range: [561, 590],
        title: "Witness of the great pralaya",
        summary:
          "Mahā-pralaya-sākṣiṇī — looking on, undisturbed, as worlds rise and fall in Her presence. Mahā-rūpā, Mahā-pūjyā — the supreme form, supreme worship, supreme stillness.",
      },
      {
        range: [591, 600],
        title: "Three kūṭas as agni, sūrya, candra; Dayā-mūrti",
        summary:
          "V. Ravi at 597: \"In these nāmas the subtle nature of the three kūṭas of the Pañcadaśī mantra are explained.\" First kūṭa as flame in mūlādhāra, second as rainbow in anāhata, third as moon below sahasrāra. Dayā-mūrti — the embodied compassion.",
      },
      {
        range: [601, 620],
        title: "Long-eyed grace — the digits of the moon",
        summary:
          "Darāndolita-dīrghākṣī — her long, tremulous side-glance. The sixteen kalās of the moon. The grace that lingers without ever quite leaving.",
      },
      {
        range: [621, 640],
        title: "Divine body, divine fragrance",
        summary:
          "Divya-vigrahā, Divya-gandhāḍhyā — the body of pure light, scented with the perfume of the gods. Kaivalya-pada-dāyinī — bestower of the state of kaivalya, the absolute liberation of Sāṃkhya.",
      },
      {
        range: [641, 660],
        title: "Dhyāna-gamyā — realised through meditation",
        summary:
          "Reached not by ritual but by stillness. Vijñātrī (the Knower), Vedya-varjitā (not the object of knowledge), Yogadā (giver of yoga), Yoginī — the goddess as the path of inner union.",
      },
      {
        range: [661, 680],
        title: "Sad-asat-rūpa-dhāriṇī — being and non-being",
        summary:
          "She holds both existence and non-existence and pre-dates them. Vṛddhā (the Ancient), Eka-rūpā, Anekarūpā — One in form and form-less, more ancient than the most ancient.",
      },
    ],
  },

  {
    range: [681, 880],
    title: "Queen of the universe",
    summary:
      "V. Ravi at 694: \"From nāma 684 Rājarājeśvarī till this nāma described the qualities of Rājarājeśvarī.\" The long sovereign-section opens with Caturanga-baleśvarī — the queen of the four-fold army. She becomes Mahā-kālī, adored by the apsaras; Subhagā, the auspicious; Pratyag-rūpā, the indwelling Self of Sat-cit-ānanda; Pāśa-hantrī, breaker of every cord; Brahmāṇī, Prāṇeśvarī, knower of every heart and refuge from saṃsāra; and finally Kāntārdha-vigrahā — the half of Śiva, the ardha-nārīśvara form.",
    anchor:
      "Nāma 694: \"From nāma 684 Rājarājeśsvarī till this nāma described the qualities of Rājarājeśsvarī.\"",
    groups: [
      {
        range: [681, 694],
        title: "Caturanga-baleśvarī — qualities of Rājarājeśvarī",
        summary:
          "Sukhārādhyā (easily worshipped), Caturanga-baleśvarī (queen of the four-fold army), Sāmrājya-dāyinī (giver of empire), Satya-sandhā (true to vow), Sāgara-mekhalā (whose girdle is the oceans) — fourteen nāmas describing the supreme sovereign.",
      },
      {
        range: [695, 720],
        title: "Beyond time and space; granter of the desired",
        summary:
          "Deśa-kāla-aparicchinnā — not bound by where or when. Sarvagā, Sarva-mohinī. Soft-limbed and equanimous, but boundless. The kind queen who swiftly grants the heart's request.",
      },
      {
        range: [721, 760],
        title: "Mahā-kālī — adored by the apsaras",
        summary:
          "Rambhādi-vanditā — adored by Rambhā and the celestial dancers. Mahā-kālī — even Time bows. The fierce form of the queen, the great destroyer.",
      },
      {
        range: [761, 800],
        title: "Subhagā and the indwelling Self",
        summary:
          "Subhagā — the auspicious; Durārādhyā — hard to worship for the impure; Pratyag-rūpā, Satya-jñāna-ānanda-rūpā — the goddess realised within as being, knowing, and bliss; Rasa-śevadhiḥ — the treasure of every sweetness.",
      },
      {
        range: [801, 840],
        title: "Pāśa-hantrī, Brahmāṇī, Prāṇeśvarī",
        summary:
          "Puṣṭā (full of vigor), Pāśa-hantrī (breaker of every binding cord), Brahmāṇī (the support of Brahman), Prāṇeśvarī (ruler of the five vital airs). The goddess who sustains and the goddess who liberates.",
      },
      {
        range: [841, 880],
        title: "Half of Śiva — Kāntārdha-vigrahā",
        summary:
          "Bhāva-jñā — knower of every mood. Janma-mṛtyu-jarā-tapta-jana-viśrānti-dāyinī — refuge for those exhausted by birth, age, and death. Kāntārdha-vigrahā — half of Her consort's body; the ardha-nārīśvara form, concealed from those whose sight is fixed outward.",
      },
    ],
  },

  {
    range: [881, 1000],
    title: "Salutation to Lalitāmbikā Śrīmat",
    summary:
      "The climactic 120 nāmas. She is Yajña-priyā (beloved of sacrifice), Vidrumābhā (red as coral), Nāda-rūpiṇī (the primal sound), Sadāśiva-kuṭumbinī (consort of Sadāśiva), Sadātuṣṭā (ever-pleased), Mano-mayī (form of the mind), Śāśvatī (eternal), Guṇātītā (beyond the three guṇas), Jñāna-jñeya-svarūpiṇī (knowledge and the known), Ṣaḍ-adhva-atīta-rūpiṇī (beyond the six paths). Nāma 996 reveals Her seat: Śrī-cakra-rāja-nilayā — She abides in the supreme yantra. The last four nāmas close the stotra with the salutation: Lalitā Mahā-tripura-sundarī, Śrīmat.",
    anchor:
      "Nāma 990: \"Vāc Devi-s now directly advise Her devotees to practice meditation to be with Her always.\"",
    groups: [
      {
        range: [881, 900],
        title: "Yajña-priyā — beloved of sacrifice; red as coral",
        summary:
          "Pleased by every yajña; Vidrumābhā — shining like coral; the closing nāmas of Her embodied power before the salutation begins. Naiṣkarmyā — transcending karma; the final freedom.",
      },
      {
        range: [901, 920],
        title: "Nāda-rūpiṇī — sound itself; Sadāśiva-kuṭumbinī",
        summary:
          "Nāda-rūpiṇī — She IS the primal sound (nāda) from which the universe arises. Sadāśiva-kuṭumbinī — the consort of the eternal benevolent one; their household IS the cosmos.",
      },
      {
        range: [921, 940],
        title: "Sadātuṣṭā — ever-pleased and high-minded",
        summary:
          "Sadātuṣṭā — never displeased. Mānavatī — of unbreakable repute. Vyaktāvyakta-svarūpiṇī — both manifest and unmanifest. The qualities of the perfect queen.",
      },
      {
        range: [941, 960],
        title: "Mano-mayī — form of the mind; Śāśvatī — the eternal",
        summary:
          "She IS the mind that thinks Her. Śāśvatī — She outlasts every yuga and every dissolution. Eternally young and eternally ancient.",
      },
      {
        range: [961, 980],
        title: "Guṇātītā — beyond the three guṇas",
        summary:
          "Lokātītā, Guṇātītā, Sarvātītā — beyond every world, every quality, every distinction. Suvāsiny-arcana-prītā — pleased by the worship of married women; the household goddess of the householder's altar.",
      },
      {
        range: [981, 995],
        title: "Knowledge and the known — beyond the six paths",
        summary:
          "Jñāna-jñeya-svarūpiṇī — She is both the knower and the known. Ṣaḍ-adhva-atīta-rūpiṇī — beyond the six paths of mantra. Abhyāsātiśaya-jñātā — known only by sustained practice of meditation.",
      },
      {
        range: [996, 1000],
        title: "Śrī-cakra-rāja-nilayā — the final salutation",
        summary:
          "She abides in Śrī Cakra, the supreme yantra; She IS Lalitāmbikā, the supreme Tripurā-sundarī. The closing five nāmas — Śrī Lalitā, Mahā-tripura-sundarī, Śrīmat — are the salutation that ends the stotra.",
      },
    ],
  },
];

// Flat list — kept for any callers that want just the leaf groups.
export const THEMES: ThemeGroup[] = CHAPTERS.flatMap((c) => c.groups);
