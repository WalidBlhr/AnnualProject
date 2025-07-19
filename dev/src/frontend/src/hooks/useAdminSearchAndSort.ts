import { useState, useMemo } from 'react';
import { SortConfig } from '../components/AdminSearchAndSort';

interface UseAdminSearchAndSortProps<T> {
  data: T[];
  searchFields: (keyof T)[];
  defaultSortField?: string;
}

export function useAdminSearchAndSort<T>({
  data,
  searchFields,
  defaultSortField = ''
}: UseAdminSearchAndSortProps<T>) {
  const [searchValue, setSearchValue] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: defaultSortField,
    direction: 'asc'
  });

  // Fonction de recherche
  const filteredData = useMemo(() => {
    if (!searchValue.trim()) return data;
    
    const searchLower = searchValue.toLowerCase().trim();
    return data.filter(item => 
      searchFields.some(field => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(searchLower);
      })
    );
  }, [data, searchValue, searchFields]);

  // Fonction de tri
  const sortedAndFilteredData = useMemo(() => {
    if (!sortConfig.field) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = (a as any)[sortConfig.field];
      const bValue = (b as any)[sortConfig.field];

      // Gestion des valeurs nulles/undefined
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Tri pour les nombres
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // Tri pour les dates
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortConfig.direction === 'asc' 
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      // Tri pour les chaînes de caractères (dates ISO incluses)
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      
      if (sortConfig.direction === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [filteredData, sortConfig]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const handleSearchClear = () => {
    setSearchValue('');
  };

  const handleSortChange = (newSortConfig: SortConfig) => {
    setSortConfig(newSortConfig);
  };

  return {
    searchValue,
    sortConfig,
    filteredAndSortedData: sortedAndFilteredData,
    handleSearchChange,
    handleSearchClear,
    handleSortChange,
  };
}
