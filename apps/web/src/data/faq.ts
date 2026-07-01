export type FAQItem = { q: string; a: string };

export const faqs: FAQItem[] = [
  {
    q: "Comment ca marche pour une cliente analphabete ?",
    a: "Aucune entreprise, ni serveur d'État, ne peut garantir qu'une ligne de données ne sera pas modifiée d'ici 30 ans. Le systeme decentralise est mathématiquement inviolable et survit à nos serveurs : la preuve reste décodable même si KandoFoncier disparaît.",
  },
  {
    q: "A qui s'addresse la solution ?",
    a: "Aux agents fonciers, notaires, chefs de quartier et collectivités qui veulent sécuriser les ventes dans des zones où le foncier est contesté. Le grand public peut vérifier librement n'importe quel acte via l'explorer.",
  },
  {
    q: "Puis-je prresenter ces documents devant une juridiction ?",
    a: "Zéro FCFA de frais réseau. OpenTimestamps regroupe des milliers de hashes dans un arbre de Merkle et n'insère qu'un seul hash racine dans la blockchain. Le coût est amorti par toute la communauté.",
  },
  {
    q: "Que se passe t-il en cas de double vente ?",
    a: "Le nouvel acquéreur scanne le document sur Gandehou. Si un seul octet a été modifié, le hash recalculé ne correspond plus au hash scellé sur un systeme decentralise : alerte rouge automatique. La vidéo originale reste opposable au tribunal.",
  },
  {
    q: "L'application stocke-t-elle mes documents ?",
    a: "Oui, les documents et audios restent dans notre base Supabase pour permettre la vérification. Mais même sans nos serveurs, vos preuves restent valides : il suffit que vous gardiez vos fichiers originaux sur votre téléphone.",
  },
  {
    q: "Peut-on falsifier l'audio ?",
    a: "Un audio synthétique aurait un hash différent. L'ensemble (document + audio + signature biométrique + date d'ancrage) forme une preuve indissociable. Modifier un élément invalide tout.",
  },
];
