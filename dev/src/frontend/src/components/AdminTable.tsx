import React, { ReactNode, useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TablePagination,
  Alert,
  Snackbar,
} from '@mui/material';
import AdminSearchAndSort, { SortOption } from './AdminSearchAndSort';
import { useAdminSearchAndSort } from '../hooks/useAdminSearchAndSort';

interface AdminTableProps<T> {
  title: string;
  data: T[];
  searchFields: (keyof T)[];
  sortOptions: SortOption[];
  defaultSortField?: string;
  searchPlaceholder?: string;
  columns: string[];
  renderRow: (item: T, index: number) => ReactNode;
  alert?: {
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  };
  setAlert?: React.Dispatch<React.SetStateAction<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>>;
  additionalContent?: ReactNode;
}

function AdminTable<T extends { id: number | string }>({
  title,
  data,
  searchFields,
  sortOptions,
  defaultSortField = '',
  searchPlaceholder = 'Rechercher...',
  columns,
  renderRow,
  alert,
  setAlert,
  additionalContent
}: AdminTableProps<T>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Hook pour la recherche et le tri
  const {
    searchValue,
    sortConfig,
    filteredAndSortedData,
    handleSearchChange,
    handleSearchClear,
    handleSortChange,
  } = useAdminSearchAndSort({
    data,
    searchFields,
    defaultSortField
  });

  // Pagination sur les données filtrées et triées
  const paginatedData = filteredAndSortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // Remettre la page à 0 quand on change la recherche
  useEffect(() => {
    setPage(0);
  }, [searchValue]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        {title}
      </Typography>

      <AdminSearchAndSort
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
        sortConfig={sortConfig}
        onSortChange={handleSortChange}
        sortOptions={sortOptions}
        placeholder={searchPlaceholder}
      />

      {additionalContent}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {columns.map((column, index) => (
                <TableCell key={index}>{column}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map((item, index) => (
              <TableRow key={item.id}>
                {renderRow(item, index)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredAndSortedData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {alert && setAlert && (
        <Snackbar
          open={alert.open}
          autoHideDuration={6000}
          onClose={() => setAlert({ ...alert, open: false })}
        >
          <Alert
            severity={alert.severity}
            onClose={() => setAlert({ ...alert, open: false })}
            sx={{ whiteSpace: 'pre-line' }}
          >
            {alert.message}
          </Alert>
        </Snackbar>
      )}
    </Container>
  );
}

export default AdminTable;
