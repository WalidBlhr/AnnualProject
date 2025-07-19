import { useEffect, useState } from "react";
import AdminPage, { Alert } from "./AdminPage";
import { IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow } from "@mui/material";
import axios from "axios";
import { API_URL } from "../../const";
import { ListingResult } from "../../types/ListingResult";
import { Delete, Edit } from "@mui/icons-material";
import { DetailedMessageGroup, MessageGroup } from "../../types/messages-types";
import MessageGroupEditingModal from "../../components/modals/MessageGroupEditingModal";
import AdminSearchAndSort, { SortOption } from "../../components/AdminSearchAndSort";
import { useAdminSearchAndSort } from "../../hooks/useAdminSearchAndSort";

const tableHeaders = ["ID", "Nom", "Description", "Date de création", "Action"];

const AdminMessageGroups : React.FC = () => {
  const [alert, setAlert] = useState<Alert>({open: false, message: "", severity: "success"});
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [groups, setGroups] = useState<MessageGroup[]>([]);
  const [totalGroups, setTotalGroups] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [editedGroup, setEditedGroup] = useState<DetailedMessageGroup>();

  // Options de tri pour les groupes de messages
  const sortOptions: SortOption[] = [
    { value: 'id', label: 'ID' },
    { value: 'name', label: 'Nom' },
    { value: 'description', label: 'Description' },
    { value: 'createdAt', label: 'Date de création' },
  ];

  // Hook pour la recherche et le tri
  const {
    searchValue,
    sortConfig,
    filteredAndSortedData,
    handleSearchChange,
    handleSearchClear,
    handleSortChange,
  } = useAdminSearchAndSort({
    data: groups,
    searchFields: ['name', 'description'],
    defaultSortField: 'id'
  });

  // Pagination sur les données filtrées et triées
  const paginatedGroups = filteredAndSortedData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ open: true, message, severity });
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    fetchMessageGroups();
  }, [page, rowsPerPage]);

  // Remettre la page à 0 quand on change la recherche
  useEffect(() => {
    setPage(0);
  }, [searchValue]);

  const requestWrapper = async (
    req: (token: string) => Promise<void>,
    catch_add: () => void = () => {}
  ) => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token provided.");
      return;
    }

    try {
      await req(token);
    } catch (e: any) {
      const errorMessage = e.response?.data?.message || 'Erreur lors du chargement des messages';
      showAlert(errorMessage, 'error');
      catch_add();
    }
  }

  const fetchMessageGroups = async () => {
    requestWrapper(async token => {
      const {data} = await axios.get<ListingResult<MessageGroup[]>>(
        API_URL + "/message-groups",
        {
          headers: {
            Authorization: "Bearer " + token,
          },
          params: {
            page: page + 1,
            limit: rowsPerPage,
          },
        }
      );
      setGroups(data.data.sort((gA, gB) => gA.id - gB.id));
      setTotalGroups(data.total_count);
    });
  };

  const onGroupSave = (data: DetailedMessageGroup) => {
    setGroups(groups.map(group => {
      if (group.id === data.id)
        return data;
      else
        return group;
    }));
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?'))
      return;

    requestWrapper(async token => {
      await axios.delete(
        API_URL + "/message-groups/" + groupId,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );
      showAlert("Groupe supprimé avec succès", "success");
      setGroups(prev => prev.filter(group => group.id !== groupId));
    });
  };

  const fetchGroupDetails = async (groupId: number) => {
    requestWrapper(async token => {
      const {data} = await axios.get<DetailedMessageGroup>(
        API_URL + "/message-groups/" + groupId,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );
      setEditedGroup(data);
    }, () => setEditDialogOpen(false));
  }

  const onEditClick = async (group: MessageGroup) => {
    setEditDialogOpen(true);
    await fetchGroupDetails(group.id);
  }

  return (
    <AdminPage
      title="Gestion des groupes de messages"
      alert={alert}
      setAlert={setAlert}
    >
      <AdminSearchAndSort
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onSearchClear={handleSearchClear}
        sortConfig={sortConfig}
        onSortChange={handleSortChange}
        sortOptions={sortOptions}
        placeholder="Rechercher par nom ou description..."
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {tableHeaders.map((header, i) => <TableCell key={i}>{header}</TableCell>)}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedGroups.map(group => (
              <AdminMessageGroupRow
                key={group.id}
                group={group}
                onEditClick={onEditClick}
                onDeleteClick={handleDeleteGroup}
              />
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredAndSortedData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
      <MessageGroupEditingModal
        dialogOpen={editDialogOpen}
        setDialogOpen={setEditDialogOpen}
        showAlert={showAlert}
        editedGroup={editedGroup}
        setEditedGroup={setEditedGroup}
        onGroupSave={onGroupSave}
        onGroupDelete={() => setGroups(prev => prev.filter(group => group.id !== editedGroup?.id))}
      />
    </AdminPage>
  );
};

interface RowProps{
  group: MessageGroup;
  onEditClick: (group: MessageGroup) => void;
  onDeleteClick: (groupId: number) => void;
}

const AdminMessageGroupRow : React.FC<RowProps> = ({group, onEditClick, onDeleteClick}) => {
  return (
    <TableRow>
      <TableCell>{group.id}</TableCell>
      <TableCell>{group.name}</TableCell>
      <TableCell>{group.description}</TableCell>
      <TableCell>{group.createdAt.toLocaleString()}</TableCell>
      <TableCell>
        <IconButton onClick={() => onEditClick(group)}>
          <Edit />
        </IconButton>
        <IconButton onClick={() => onDeleteClick(group.id)}>
          <Delete />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

export default AdminMessageGroups;
