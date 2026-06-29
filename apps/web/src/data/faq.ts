export type FAQItem = { q: string; a: string };

export const faqs: FAQItem[] = [
  {
    q: "Pourquoi Bitcoin et pas un simple registre numérique ?",
    a: "Aucune entreprise, ni serveur d'État, ne peut garantir qu'une ligne de données ne sera pas modifiée d'ici 30 ans. Bitcoin est mathématiquement inviolable et survit à nos serveurs : la preuve reste décodable même si KandoFoncier disparaît.",
  },
  {
    q: "Qu'est-ce qui est réellement écrit sur la blockchain ?",
    a: "Uniquement un hash SHA-256 du couple (document + audio). Aucun document, aucune photo, aucune donnée personnelle. C'est cryptographiquement vérifiable mais ne révèle rien.",
  },
  {
    q: "Comment ça marche pour une cliente illettrée ?",
    a: "L'agent foncier saisit les champs à sa place. Elle parle 10 secondes dans sa langue locale (Fon, Yoruba, Adja, Mina) pour confirmer son consentement, puis pose son doigt sur l'écran. Aucune dépendance à la lecture ni à un mot de passe.",
  },
  {
    q: "Combien ça coûte d'ancrer un acte sur Bitcoin ?",
    a: "Zéro FCFA de frais réseau. OpenTimestamps regroupe des milliers de hashes dans un arbre de Merkle et n'insère qu'un seul hash racine dans la blockchain. Le coût est amorti par toute la communauté.",
  },
  {
    q: "Que se passe-t-il si quelqu'un essaie une double vente ?",
    a: "Le nouvel acquéreur scanne le document sur KandoFoncier. Si un seul octet a été modifié, le hash recalculé ne correspond plus au hash scellé sur Bitcoin : alerte rouge automatique. La vidéo originale reste opposable au tribunal.",
  },
  {
    q: "L'application stocke-t-elle mes documents ?",
    a: "Oui, les documents et audios restent dans notre base Supabase pour permettre la vérification. Mais même sans nos serveurs, vos preuves restent valides : il suffit que vous gardiez vos fichiers originaux sur votre téléphone.",
  },
  {
    q: "Peut-on falsifier l'audio ?",
    a: "Un audio synthétique aurait un hash différent. L'ensemble (document + audio + signature biométrique + date d'ancrage Bitcoin) forme une preuve indissociable. Modifier un élément invalide tout.",
  },
  {
    q: "À qui s'adresse KandoFoncier ?",
    a: "Aux agents fonciers, notaires, chefs de quartier et collectivités qui veulent sécuriser les ventes dans des zones où le foncier est contesté. Le grand public peut vérifier librement n'importe quel acte via l'explorer.",
  },
];
