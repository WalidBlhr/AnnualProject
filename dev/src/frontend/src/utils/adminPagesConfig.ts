// Script pour appliquer automatiquement la recherche et le tri aux pages admin
// Ce script est temporaire pour automatiser les modifications répétitives

const adminPagesConfig = {
  AdminServices: {
    dataField: 'services',
    searchFields: ['name', 'description'],
    sortOptions: [
      { value: 'id', label: 'ID' },
      { value: 'name', label: 'Nom' },
      { value: 'description', label: 'Description' },
      { value: 'price', label: 'Prix' },
      { value: 'createdAt', label: 'Date de création' },
    ],
    defaultSort: 'name',
    placeholder: 'Rechercher par nom ou description...'
  },
  AdminTrocs: {
    dataField: 'trocs',
    searchFields: ['title', 'description', 'type'],
    sortOptions: [
      { value: 'id', label: 'ID' },
      { value: 'title', label: 'Titre' },
      { value: 'type', label: 'Type' },
      { value: 'status', label: 'Statut' },
      { value: 'createdAt', label: 'Date de création' },
    ],
    defaultSort: 'createdAt',
    placeholder: 'Rechercher par titre, description ou type...'
  },
  AdminArticles: {
    dataField: 'articles',
    searchFields: ['title', 'content'],
    sortOptions: [
      { value: 'id', label: 'ID' },
      { value: 'title', label: 'Titre' },
      { value: 'createdAt', label: 'Date de création' },
      { value: 'updatedAt', label: 'Date de modification' },
    ],
    defaultSort: 'createdAt',
    placeholder: 'Rechercher par titre ou contenu...'
  }
};

export default adminPagesConfig;
