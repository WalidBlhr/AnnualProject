import React from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Paper,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import SortIcon from '@mui/icons-material/Sort';

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface SortOption {
  value: string;
  label: string;
}

interface AdminSearchAndSortProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
  sortOptions: SortOption[];
  placeholder?: string;
}

const AdminSearchAndSort: React.FC<AdminSearchAndSortProps> = ({
  searchValue,
  onSearchChange,
  onSearchClear,
  sortConfig,
  onSortChange,
  sortOptions,
  placeholder = "Rechercher..."
}) => {
  const handleSortFieldChange = (field: string) => {
    onSortChange({
      field,
      direction: sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleSortDirectionToggle = () => {
    onSortChange({
      ...sortConfig,
      direction: sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === sortConfig.field);
    return option ? option.label : 'Aucun tri';
  };

  return (
    <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Barre de recherche */}
        <TextField
          placeholder={placeholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchValue && (
              <InputAdornment position="end">
                <IconButton
                  aria-label="clear search"
                  onClick={onSearchClear}
                  edge="end"
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 250, flex: 1 }}
          size="small"
        />

        {/* Sélecteur de champ de tri */}
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Trier par</InputLabel>
          <Select
            value={sortConfig.field}
            label="Trier par"
            onChange={(e) => handleSortFieldChange(e.target.value)}
          >
            {sortOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Bouton pour inverser l'ordre */}
        <IconButton
          onClick={handleSortDirectionToggle}
          title={`Tri ${sortConfig.direction === 'asc' ? 'croissant' : 'décroissant'}`}
          color="primary"
        >
          <SortIcon sx={{ 
            transform: sortConfig.direction === 'desc' ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s'
          }} />
        </IconButton>

        {/* Affichage du tri actuel */}
        {sortConfig.field && (
          <Chip
            label={`${getCurrentSortLabel()} (${sortConfig.direction === 'asc' ? '↑' : '↓'})`}
            onDelete={() => onSortChange({ field: '', direction: 'asc' })}
            color="primary"
            variant="outlined"
            size="small"
          />
        )}
      </Box>
    </Paper>
  );
};

export default AdminSearchAndSort;
